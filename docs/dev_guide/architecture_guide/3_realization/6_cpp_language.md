# Use of C++

## Language standard

The entire codebase is **C++17** compliant. Selected C++20 and C++23 features are adopted where they improve correctness or reduce boilerplate:

- **Coroutines** (`co_await` / `co_return`) for asynchronous programming.
- `std::expected` for error propagation without exceptions.
- `std::span`, `std::format`, `std::flat_map`, ranges, and other ergonomic standard library additions.

## STL and specialised containers

Heavy use of the STL is encouraged. Where the STL does not meet real-time or performance requirements, OCUDU provides its own specialised containers:

- Lock-free and priority queues
- Memory pools
- Unique and shared object pools
- Custom vectors and lists

## ASN.1 generator

3GPP protocols define message formats in ASN.1. OCUDU includes an **ASN.1 generator** that translates ASN.1 syntax directly into strongly-typed C++ types, eliminating manual serialisation code and reducing the risk of protocol encoding errors.

## Asynchronous programming with coroutines

Protocol procedures often involve waiting for responses from peer entities or lower layers. OCUDU uses C++20 coroutines to express these asynchronous sequences as straightforward, sequential-looking code rather than callback chains or explicit state machines.

## Executors

OCUDU abstracts the execution model through an executor framework so that business logic does not depend on how threads are managed. The same protocol code can run on a single-core embedded system, a multi-socket server, or a cloud VM by changing only configuration, not source code.

| Executor type | Description |
|---|---|
| **Single worker** | One dedicated thread, single-priority queue |
| **Thread pool** | Multiple workers sharing a task queue |
| **Multi-priority thread pool** | Workers with high/low priority lanes |
| **Strand** | Serialises tasks on top of a worker or pool; single and multi-priority variants |
| **Fork limiter** | Caps the degree of parallelism for bounded-concurrency tasks |

## SIMD abstraction

An abstraction layer wraps architecture-specific SIMD intrinsics (SSE, AVX, NEON, …). Inner-layer algorithm code calls the abstraction; the correct instruction set is selected at compile time or runtime without changes to the algorithm implementation.
