# Design Principles

Every architectural decision in OCUDU flows from a small set of design principles. These principles are not optional guidelines - they are the shared language that allows contributors across the world to work on the same codebase and produce coherent results. Understanding them is the single most important preparation before writing or reviewing OCUDU code.

## Clean Architecture

OCUDU structures its codebase as a set of concentric layers. Dependencies always point inward: toward the business logic and protocol entities, never outward toward drivers, frameworks, or I/O. This one rule has far-reaching consequences:

- Protocol logic is testable in isolation, without radio hardware or a running network.
- Adding a new radio or deployment scenario touches only the outermost layer.
- NR protocol layers (MAC, RLC, PDCP, …) are completely decoupled from each other.

See [Clean Architecture](./1_clean_architecture.md) for a full explanation with diagrams.

## Clean Code - SOLID

Five principles, one consistent codebase. SOLID shapes every class and interface in OCUDU:

- **Single Responsibility** - one reason to change.
- **Open / Closed** - extend via new types, not edits.
- **Liskov Substitution** - implementations honour the full interface contract.
- **Interface Segregation** - small, focused interfaces; callers depend only on what they use.
- **Dependency Inversion** - depend on abstractions; outer layers are injected into inner layers, never the reverse.

Code review will flag SOLID violations. See [Clean Code - SOLID](./3_solid.md) for per-principle guidance and common violation patterns.

## Object Oriented Programming

OCUDU uses OOP as its fundamental building block - not just as a language feature, but as the mechanism that makes layering, interface contracts, and testability work in practice. The key disciplines are encapsulation (hide implementation details), composition over inheritance (inject collaborators rather than inheriting behaviour), and polymorphism through pure-virtual interfaces (the concrete mechanism behind every swappable component).

See [Object Oriented Programming](./2_oop.md) for the full breakdown including ownership rules.

## Software Design Patterns

OCUDU uses a curated set of well-known patterns consistently. Recognising them when reading code - and reaching for the right one when writing new code - is an important part of contributing effectively. The most common are:

- **Adapter / Gateway** - wrapping incompatible interfaces at layer boundaries.
- **Strategy** - selecting scheduling policies, HARQ strategies, and algorithms at runtime.
- **Observer** - decoupling cross-layer event producers from consumers.
- **Factory** - constructing protocol entities without binding to concrete types.
- **Decorator** - adding instrumentation without touching protocol logic.
- **Null Object** - safe "do nothing" defaults that keep calling code clean.

See [Software Design Patterns](./4_design_patterns.md) for the full catalogue with OCUDU-specific context.

---

import DocCardList from '@theme/DocCardList';

<DocCardList />
