---
sidebar_position: 1
---

# Software Architecture Guide

This guide describes the software architecture of OCUDU. Reading it before diving into the codebase will help you understand the design decisions, where contributions belong, and what the codebase expects from every contributor.

The guide is structured in three parts:

- **[Vision and Goals](./1_vision_and_goals.md)** - the platform ambition behind OCUDU and the design goals every contribution must respect.

- **[Design Principles](./2_principles/index.md)** - the engineering principles that shape every class and interface:
  - [Clean Architecture](./2_principles/1_clean_architecture.md) - layered dependency model; arrows always point inward.
  - [Clean Code - SOLID](./2_principles/2_solid.md) - the five SOLID principles with OCUDU-specific guidance and violation patterns.
  - [Object Oriented Programming](./2_principles/3_oop.md) - encapsulation, polymorphism, composition over inheritance, ownership rules.

- **[Realization](./3_realization/index.md)** - how the principles above are concretely expressed in the implementation:
  - [Threading Model](./3_realization/1_threading_model.md) - executor-based, fully configurable, decoupled from protocol logic.
  - [Asynchronous Programming](./3_realization/2_async_programming.md) - coroutine-based async procedures for complex 5G NR flows.
  - [Interfaces](./3_realization/3_interfaces.md) - stack-layer interfaces, FAPI, and supported functional splits.
  - [Metrics Reporting](./3_realization/4_metrics.md) - per-layer KPI and performance metrics via injected reporter interfaces.
  - [Real-Time Safety](./3_realization/5_realtime_safety.md) - timing constraints, forbidden operations, and CI enforcement.
  - [Use of C++](./3_realization/6_cpp_language.md) - C++17/20/23 features, specialised containers, executors, and SIMD.
  - [Testing](./3_realization/7_testing.md) - unit, component, integration, and E2E test strategy.
  - [Plugins](./3_realization/8_plugins/index.md) - extending or replacing OCUDU components with third-party implementations.
- [Software Design Patterns](./3_realization/9_design_patterns.md) - the patterns used consistently across the codebase.

- **[References](./4_references.md)** - books and online resources for further reading on Clean Architecture, SOLID, C++ software design, and design patterns.

---

import DocCardList from '@theme/DocCardList';

<DocCardList />
