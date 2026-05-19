---
description: "How OCUDU's design principles are expressed in concrete implementation: threading, async, interfaces, metrics, real-time safety, C++, and testing."
---

# Realization

This section explains how the design principles described earlier materialize into concrete implementation decisions in OCUDU. Each page covers one aspect of how abstract concepts - clean layering, interface-based design, asynchronous procedures - are actually expressed in the codebase.

## Threading model

The threading model is fully configurable and completely decoupled from protocol logic. Business entities never create or manage threads directly. Instead, they schedule work onto executor abstractions - task executors, strands, thread pools, and lock-free queues - that can be wired up differently for each deployment target.

See [Threading Model](./1_threading_model.md).

## Asynchronous programming

5G NR procedures are inherently asynchronous: they wait for packet arrivals, timer expirations, peer responses, and cross-layer transactions. OCUDU expresses these multi-step procedures using a coroutine library that makes complex asynchronous logic read as straightforward sequential code.

See [Asynchronous Programming](./2_async_programming.md).

## Interfaces

All communication between software components crosses a well-defined interface boundary. Stack layers talk to each other through pure-virtual C++ interfaces. The PHY-MAC boundary follows the FAPI specification. Multiple functional splits (CU/DU, split 6, split 7.2x, split 8) are supported, each realised through the same interface discipline.

See [Interfaces](./3_interfaces.md).

## Metrics reporting

Every protocol layer reports its own performance and KPI metrics independently. This gives operators and developers a per-layer view of system behaviour without coupling the reporting mechanism to any specific observability backend.

See [Metrics Reporting](./4_metrics.md).

## Real-time safety

The L1 and time-critical paths of the L2 must meet strict per-slot timing budgets. OCUDU enforces real-time safety through a combination of coding discipline (no dynamic allocation, no system calls, no explicit synchronisation on the critical path) and continuous instrumentation that catches violations automatically in CI.

See [Real-Time Safety](./5_realtime_safety.md).

## Use of C++

The entire codebase is C++17 compliant with selective use of C++20 and C++23 features. OCUDU makes heavy use of the STL, provides its own specialised containers for real-time use, relies on coroutines for asynchronous programming, abstracts the execution model through executors, and wraps SIMD intrinsics behind a portability layer.

See [Use of C++](./6_cpp_language.md).

## Software Design Patterns

OCUDU uses a curated set of well-known patterns consistently throughout the codebase. Recognising them when reading code - and reaching for the right one when writing new code - is an important part of contributing effectively. The most common are Adapter, Strategy, Observer, Factory, Decorator, and Null Object.

See [Software Design Patterns](./9_design_patterns.md) for the full catalogue with OCUDU-specific context.

---

import DocCardList from '@theme/DocCardList';

<DocCardList />
