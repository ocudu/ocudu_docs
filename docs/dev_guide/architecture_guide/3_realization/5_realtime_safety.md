# Real-Time Safety

## The timing constraint

A 5G NR base station processes one slot every **500 µs** (numerology µ=1) or **1 ms** (µ=0). The L1 modem and the time-critical portions of the L2 scheduler must complete all their work within this budget - every slot, without exception. A single missed deadline causes a dropped slot, which translates directly to degraded throughput and user experience for every UE in the cell.

This hard real-time requirement shapes how code on the critical path must be written.

## What the critical path must never do

The following operations are **forbidden** on any code path that executes within the slot processing budget:

| Forbidden operation | Why |
|---|---|
| **Dynamic memory allocation** (`new`, `malloc`, `std::vector::push_back` that triggers a resize, …) | Allocation involves a system call and a lock on the allocator; latency is unbounded |
| **System calls** (file I/O, socket operations, `clock_gettime` with VDSO disabled, ..) | Kernel transitions have unpredictable latency under load |
| **Explicit synchronisation** (`std::mutex::lock`, condition variables, semaphores) | Blocking on a contended lock causes priority inversion with no bounded wait time |
| **Exceptions** | Exception handling involves heap allocation and dynamic dispatch; timing is not guaranteed |
| **Logging to a blocking sink** | Writing to a file or socket on the critical path introduces I/O latency |

Pre-allocated memory pools, lock-free queues, and non-blocking ring buffers are the standard alternatives for each of these.

## Coding discipline

Real-time safety is enforced through code review and tooling, not solely by convention:

- **Static analysis** flags calls to allocating STL containers and known non-RT-safe APIs on paths annotated as real-time.
- **RTSAN (real-time sanitizer)** runs daily in CI and reports any allocation, system call, or blocking primitive reached from a real-time-annotated call stack.
- **TSAN (thread sanitizer)** runs daily and catches data races that could cause non-deterministic timing.
- **ASAN (address sanitizer)** runs daily and catches memory errors that could cause latency spikes from corruption-induced retries.

When contributing code to a real-time path, annotate it with the appropriate marker so the sanitizer can enforce the constraint automatically.

## Performance profiling

Meeting the timing budget requires knowing where time is actually spent. OCUDU uses:

- **Execution traces** - fine-grained timestamps at slot entry/exit and at key processing stages, written to a lock-free ring buffer and flushed off the critical path.
- **Benchmarks** - micro-benchmarks for inner-loop functions (channel estimation, LDPC encode/decode, FFT) run in CI to catch regressions before they land.
- **Profilers** - periodic profiling runs (perf, VTune) on representative workloads to identify hotspots and guide optimisation.

## Real-time safe alternatives

| Need | RT-safe approach |
|---|---|
| Variable-length buffer | Pre-allocated memory pool; fixed-capacity ring buffer |
| Passing data between threads | Lock-free queue (single-producer / single-consumer or MPSC) |
| Signalling an event | Atomic flag or lock-free notification primitive |
| Logging from the critical path | Write to a lock-free ring buffer; a background thread drains it |
| Timing measurement | `clock_gettime(CLOCK_MONOTONIC_RAW)` or a hardware TSC read |