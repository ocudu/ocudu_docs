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

Inter-component communication on the critical path uses lock-free queues to avoid priority inversion and unbounded blocking. Lock-free queues are used at the boundaries where a non-real-time producer hands work to a real-time consumer (e.g. passing downlink data from the L2 scheduler to the L1 modem).

### Fork limiters

A fork limiter caps the degree of parallelism for a set of tasks. This prevents a burst of parallel work from monopolising pool threads and starving other components with tighter timing requirements.

## Dependency on the threading model

Protocol components express their threading requirements through their constructor: they receive executor references for the work they need to schedule. They never call threading APIs directly. This means:

- The threading model can be reconfigured without touching any protocol code.
- Unit tests can inject a synchronous (inline) executor, making async code testable without threads.
- The architecture team can reason about thread budgets and priorities centrally, in the wiring layer, rather than hunting for thread creation scattered across the codebase.
