# Use of C++

## Language standard

The entire codebase is **C++17** compliant. Several features from C++20 and later are adopted ahead of the standard, either through in-house implementations or vendored single-header libraries.

The table below lists every in-house implementation and every vendored library, and what each provides:

| Feature / library | In-house or external |
|---|---|
| Coroutines (`async_task`, `CORO_*` macros) | In-house — custom C++17 stackless coroutine framework |
| `span<T>` | In-house — contiguous view type |
| `flat_map<K, V>` | In-house — sorted-vector associative container |
| Executor and strand framework | In-house — `task_executor`, `strand_executor`, priority strands |
| SIMD abstraction | In-house — architecture-portable wrapper over SSE/AVX/NEON intrinsics |
| Memory pools and object pools | In-house — fixed-size, lock-free allocators for real-time paths |
| Custom containers | In-house — ring buffers, static vectors, concurrent queues built on the primitives below |
| ASN.1 code generator | In-house — generates strongly-typed C++ from 3GPP ASN.1 schemas |
| `expected<T, E>` | External: [TartanLlama/expected](https://github.com/TartanLlama/expected) — C++23 `std::expected` backport; re-exported as `ocudu::expected` |
| String formatting | External: [{fmt}](https://fmt.dev) — C++20 `std::format` backport; used directly as `fmt::format` |
| Lock-free MPMC queue | External: [cameron314/concurrentqueue](https://github.com/cameron314/concurrentqueue) |
| Lock-free MPMC / SPSC queues | External: [rigtorp/MPMCQueue + SPSCQueue](https://github.com/rigtorp) |
| JSON serialisation | External: [nlohmann/json](https://github.com/nlohmann/json) |
| CLI argument parsing | External: [CLI11](https://github.com/CLIUtils/CLI11) |
| WebSocket server | External: [uWebSockets](https://github.com/uNetworking/uWebSockets) |
| Stack traces (debug builds) | External: [Backward-cpp](https://github.com/bombela/backward-cpp) |

## STL and specialised containers

Heavy use of the STL is encouraged. Where the STL does not meet real-time or performance requirements, OCUDU provides its own specialised containers — or wraps the vendored lock-free queue libraries listed above:

- Lock-free and priority queues (backed by cameron314 and rigtorp primitives)
- Memory pools and fixed-size allocators
- Unique and shared object pools
- Custom vectors (`static_vector`) and ring buffers

## ASN.1 generator

3GPP protocols define message formats in ASN.1. OCUDU uses its own **ASN.1 generator** that translates ASN.1 syntax directly into strongly-typed C++ types, eliminating manual serialisation code and reducing the risk of protocol encoding errors. The generator is not open-sourced yet.

## Asynchronous programming with coroutines

Protocol procedures often involve waiting for responses from peer entities or lower layers. OCUDU uses a **custom C++17 coroutine framework** (not C++20 language coroutines) to express these asynchronous sequences as straightforward, sequential-looking code rather than callback chains or explicit state machines. See [Asynchronous Programming](./2_async_programming.md) for a full description.

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

An abstraction layer wraps architecture-specific SIMD intrinsics (SSE, AVX2/512, NEON). Inner-layer algorithm code calls the abstraction; the correct instruction set is selected at compile time or runtime without changes to the algorithm implementation.
