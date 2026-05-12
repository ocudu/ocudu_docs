# Threading Model

## Overview

The threading model in OCUDU is fully configurable and completely agnostic from the core protocol components. Protocol entities never create, own, or directly manage threads. Instead, all work is expressed as tasks submitted to **executor** abstractions. The concrete threading arrangement - how many threads exist, how they are prioritised, and which components share them - is a deployment-time configuration decision, not a protocol-logic decision.

This separation is what allows the same protocol code to run correctly on a single-core embedded board, a four-core edge server, or a large multi-socket machine, simply by changing the executor configuration.

## Execution primitives

OCUDU provides a layered set of execution primitives:

### Task executor

The fundamental unit. A task executor accepts a callable and arranges for it to run. The caller does not know - and must not assume - on which thread the callable will execute or when. Protocol code submits tasks and moves on; it does not block waiting for completion.

### Thread pools

A thread pool backs one or more task executors with a set of worker threads. OCUDU supports:

| Pool type | Description |
|---|---|
| **Single worker** | One dedicated thread; tasks run strictly in submission order |
| **Multi-worker pool** | N worker threads sharing a task queue; tasks may run concurrently |
| **Multi-priority pool** | Multiple priority lanes within one pool; high-priority tasks are dequeued first |

### Strands

A strand serialises task execution on top of an existing thread pool. Tasks submitted to a strand are guaranteed to run one at a time and in order, even though the underlying pool may have many workers. This gives a component the sequential execution guarantee of a single thread while sharing pool resources with other components.

Strands are the primary tool for protecting component-internal state without explicit locking. If all access to a component's state flows through a single strand, no mutexes are needed.

### Lock-free queues

Inter-component communication on the critical path uses lock-free queues to avoid priority inversion and unbounded blocking. Lock-free queues are the standard tool at any boundary where a non-real-time producer must hand work to a real-time consumer.

A typical example: an RRC reconfiguration procedure runs on a non-real-time executor and decides to update the UE's bearer configuration. The MAC slot handler runs on a hard-deadline thread that fires every 500 µs. The reconfiguration cannot take a mutex that the slot handler might also hold — that would risk priority inversion and a missed slot deadline. Instead, the reconfiguration procedure pushes a configuration update command into a lock-free queue. The slot handler drains the queue at the start of each slot and applies any pending updates to the UE object before scheduling begins. Neither side ever blocks waiting for the other.

OCUDU provides two lock-free queue variants, both expressed as specialisations of the `concurrent_queue<T, Policy, BlockingPolicy>` template:

- **SPSC** (`concurrent_queue_policy::lockfree_spsc`) - single-producer, single-consumer. Backed by rigtorp's `SPSCQueue`. Use this when ownership of each end of the queue is fixed to one thread; it has the lowest overhead of any queue type. Header: `ocudu/adt/spsc_queue.h`.
- **MPMC** (`concurrent_queue_policy::lockfree_mpmc`) - multi-producer, multi-consumer. Backed by rigtorp's `MPMCQueue` (bounded) or moodycamel's `ConcurrentQueue` (unbounded). Use this when multiple threads may push or pop concurrently. Headers: `ocudu/adt/mpmc_queue.h`, `ocudu/adt/moodycamel_mpmc_queue.h`.

Both variants support a `non_blocking` and a `sleep` wait policy, selected as the third template parameter.

### Fork limiters

A fork limiter caps the degree of parallelism for a set of tasks. This prevents a burst of parallel work from monopolising pool threads and starving other components with tighter timing requirements.

## Dependency on the threading model

Protocol components express their threading requirements through their constructor: they receive executor references for the work they need to schedule. They never call threading APIs directly. This means:

- The threading model can be reconfigured without touching any protocol code.
- Unit tests can inject a synchronous (inline) executor, making async code testable without threads.
- The architecture team can reason about thread budgets and priorities centrally, in the wiring layer, rather than hunting for thread creation scattered across the codebase.
