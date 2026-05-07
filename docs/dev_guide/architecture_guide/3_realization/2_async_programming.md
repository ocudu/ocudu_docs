# Asynchronous Programming

## The problem

5G NR procedures are deeply asynchronous. A single procedure defined in a 3GPP TS may need to:

- send a message and wait for a response from the peer,
- arm a timer and react differently depending on whether the response or the timeout arrives first,
- suspend until a resource becomes available,
- retry after a back-off period,
- and branch on the outcome of a transaction that completes on a different thread.

Expressing this logic with callbacks or explicit state machines produces code that is hard to follow, error-prone, and difficult to test. The control flow is fragmented across many functions and state variables; understanding what a procedure does requires mentally stitching the pieces back together.

## The solution: custom stackless coroutines

OCUDU uses a **custom stackless coroutine framework** to express asynchronous procedures as sequential code. The framework is implemented entirely in C++17 without relying on C++20 language coroutines (a migration to C++20 coroutines is planned for the future).

A procedure is a callable struct with an `operator()` that receives a `coro_context` reference. A set of macros marks suspension points inside that function body. When the procedure suspends - waiting for a response, a timer, or an event - control returns to the caller. When the awaited condition is met, the framework resumes the procedure at exactly the point where it suspended.

```cpp
void rrc_setup_procedure::operator()(coro_context<async_task<void>>& ctx)
{
  CORO_BEGIN(ctx);

  create_srb1();
  transaction = event_mng.transactions.create_transaction(procedure_timeout);
  send_rrc_setup();

  CORO_AWAIT(transaction);   // suspend until RRCSetupComplete or timeout

  if (!transaction.has_response()) {
    logger.log_warning("\"{}\" timed out", name());
    rrc_ue.on_ue_release_required(cause_protocol_t::unspecified);
    CORO_EARLY_RETURN();
  }

  process_setup_complete(transaction.response());

  CORO_RETURN();
}
```

The procedure above spans a network round-trip yet reads as a linear sequence. The framework handles all suspension, resumption, and cancellation bookkeeping.

## Coroutine macros

| Macro | Purpose |
|---|---|
| `CORO_BEGIN(ctx)` | Opens the coroutine body; jumps to the last suspension point on resume |
| `CORO_AWAIT(awaitable)` | Suspends until `awaitable` is ready; discards the result |
| `CORO_AWAIT_VALUE(result, awaitable)` | Like `CORO_AWAIT` but stores the result |
| `CORO_RETURN(...)` | Returns a value (or `void`) and reaches the final suspension point |
| `CORO_EARLY_RETURN(...)` | Returns early from any point in the procedure |

These macros expand to a `switch`-based state machine. Each `CORO_AWAIT` stores the current line number as the resume index; on the next call to `operator()` the switch jumps directly back to that line.

## Task types

`async_task<R>` is the standard return type for a coroutine. It is a **lazy** task: it does not start executing until it is awaited by another coroutine or explicitly launched.

```cpp
async_task<void> launch_rrc_setup_procedure(ue_context& ue);
```

`eager_async_task<R>` starts executing immediately upon creation. It is used for fire-and-forget or top-level procedures that must begin without being awaited.

## Message passing and thread isolation

Coroutines handle async sequencing *within* an execution context. For communication *across* execution contexts — between a UE strand and a cell strand, or between a protocol layer and a worker pool - OCUDU uses message passing rather than shared mutable state.

The rule is: **post work to the owner's execution context instead of reaching into it from another thread.** This eliminates mutex contention, prevents priority inversion, and keeps latency bounded.

### task_executor

`task_executor` is the interface used to post work across strand and thread boundaries:

```cpp
class task_executor
{
public:
  // Dispatches a task; may run inline if safe. Returns false if queue is full.
  [[nodiscard]] virtual bool execute(unique_task task) = 0;

  // Always enqueues for later execution. Returns false if queue is full.
  [[nodiscard]] virtual bool defer(unique_task task) = 0;
};
```

`unique_task` is a move-only callable with a small-buffer optimisation that avoids heap allocation for typical closures.

Use `defer()` when the caller must not run the task inline (for example when strict ordering matters or the caller is on a different thread). Use `execute()` when inline execution is acceptable to reduce dispatch latency.

### Strands

A *strand* wraps a `task_executor` and adds one guarantee: tasks posted to the same strand always run one at a time, regardless of how many producer threads are posting. This gives a component a safe, single-owner execution context without any locking - multiple external threads can safely drive a single-owner component by posting tasks to its strand.

### The cross-strand pattern

Instead of protecting shared state with a mutex:

```cpp
// Avoid: lock on shared state
{
    std::lock_guard lock(ue_mutex);
    ue.apply_config(new_config);
}
```

Post the mutation to the component's own strand:

```cpp
// Prefer: deliver the mutation as a task
ue_exec.defer([this, new_config]() {
    ue.apply_config(new_config);
});
```

All access to `ue` flows through its strand, so there is nothing to lock.

### Switching execution context inside a coroutine

When a coroutine needs to continue on a different executor, `try_execute_on` provides an awaitable that suspends and resumes in the target context:

```cpp
// Suspend and resume in other_exec's context.
// Returns false if the target queue was full.
bool ok;
CORO_AWAIT_VALUE(ok, try_execute_on(other_exec));
```

For compute-heavy work that should not block the control strand, `try_offload_to_executor` dispatches a callable to a worker executor and resumes the coroutine back on the original strand once the work completes:

```cpp
result_t result;
CORO_AWAIT_VALUE(result, try_offload_to_executor(worker_exec, ctrl_exec, []{ return compute(); }));
```

## Transactions: the standard request/response pattern

Most 3GPP procedures follow a request/response pattern with a timeout. OCUDU models this with `protocol_transaction<ResponseType>`:

```cpp
// Create a transaction with a timeout (e.g. T300).
transaction = event_mng.transactions.create_transaction(procedure_timeout);

send_rrc_setup();

CORO_AWAIT(transaction);   // suspend until response arrives or timeout fires

if (!transaction.has_response()) {
  // transaction.failure_cause() is protocol_transaction_failure::timeout or ::cancel
  handle_failure();
  CORO_EARLY_RETURN();
}

process(transaction.response());
```

`protocol_transaction_failure` has three values: `timeout`, `cancel`, and `abnormal`. The `has_response()` / `failure_cause()` pattern avoids exceptions and keeps the happy path and error path adjacent.

## Cancellation

A running coroutine can be cancelled by its owner. The framework propagates cancellation by negating the stored state index and re-entering `operator()`. The macro expansion detects the negative index, cleans up the in-flight awaiter, and unwinds the procedure cleanly without resource leaks. Procedures do not need to add cancellation-specific code; the macro infrastructure handles it automatically.

## Design principles for async code

### Suspension points are the only suspension points

A coroutine only suspends at an explicit `CORO_AWAIT` or `CORO_AWAIT_VALUE`. Between awaits it runs synchronously on the executor that resumed it. Treat every block between two awaits as an atomic section.

### No blocking on the executor thread

A coroutine must never block its executor thread - for example by calling `std::this_thread::sleep_for` or blocking on a mutex. Blocking prevents other tasks queued on the same executor from running and can cause missed slot deadlines. Any wait must be expressed as an awaitable that suspends the coroutine and returns the thread to the executor.

### Errors propagate in-band

Async functions return `async_task<expected<T, E>>`. The caller awaits the result and handles the error inline, keeping the happy path and the error path adjacent and readable.

## Testing async code

Because the threading model is injected, tests can drive coroutines on a manual executor that steps tasks forward one at a time. This makes it possible to test multi-step async procedures deterministically, without real timers or threads, by simply advancing the executor between assertions.
