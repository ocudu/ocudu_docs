# Asynchronous Programming

## The problem

5G NR procedures are deeply asynchronous. A single procedure defined in a 3GPP TS may need to:

- send a message and wait for a response from the peer,
- arm a timer and react differently depending on whether the response or the timeout arrives first,
- suspend until a resource becomes available,
- retry after a back-off period,
- and branch on the outcome of a transaction that completes on a different thread.

Expressing this logic with callbacks or explicit state machines produces code that is hard to follow, error-prone, and difficult to test. The control flow is fragmented across many functions and state variables; understanding what a procedure does requires mentally stitching the pieces back together.

## The solution: coroutines

OCUDU uses **C++ coroutines** to express asynchronous procedures as sequential code. A coroutine can suspend at an `await` point - waiting for a timer, a response, or an event - and resume automatically when the condition is met. From the outside, the coroutine is just a callable; from the inside, it reads like a straightforward sequence of steps.

```cpp
async_task<void> handle_rrc_setup(ue_context& ue)
{
  auto response = co_await send_rrc_setup_request(ue);
  if (!response) {
    co_await start_release_procedure(ue);
    co_return;
  }
  co_await configure_srb1(ue, response->config);
  co_await notify_ngap_initial_context_complete(ue);
}
```

The procedure above spans multiple asynchronous events - a request/response exchange, a possible release path, bearer configuration, and an NGAP notification - yet reads as a linear sequence. The coroutine runtime handles all suspension, resumption, and cancellation bookkeeping.

## Design principles for async code

### Await points are the only suspension points

A coroutine only suspends at an explicit `co_await`. Between awaits, it runs synchronously on the executor that resumed it. This makes reasoning about concurrency straightforward: treat every block between two awaits as an atomic section.

### Cancellation is explicit

Long-running procedures can be cancelled by the caller. OCUDU's coroutine framework propagates cancellation through the await chain: when a procedure is cancelled, any pending awaitable is notified and the coroutine unwinds cleanly without resource leaks.

### Errors propagate naturally

Rather than out-parameters or error callbacks, async functions return `async_task<expected<T, E>>`. The caller `co_await`s the result and handles the error inline, keeping the happy path and the error path adjacent and readable.

### No blocking on the executor

A coroutine must never block its executor thread - for example by calling `std::this_thread::sleep_for` or blocking on a mutex. Blocking prevents other tasks queued on the same executor from running and can cause missed slot deadlines. Any wait must be expressed as an awaitable that suspends the coroutine and returns the thread to the executor.

## Testing async code

Because the threading model is injected, tests can run coroutines on a manual or synchronous executor that drives tasks step by step. This makes it possible to test multi-step async procedures deterministically, without timers or real threads, by simply stepping the executor forward between assertions.
