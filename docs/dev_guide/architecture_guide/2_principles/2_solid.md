---
sidebar_position: 2
---

# Clean Code

[SOLID](https://en.wikipedia.org/wiki/SOLID) is a set of five object-oriented design principles that, taken together, produce code that is easy to understand, extend, and test. Applying them consistently throughout OCUDU is a hard requirement, not a suggestion. Code review will flag violations.

| Principle | Rule |
|---|---|
| **S**ingle Responsibility | Each class does one thing. |
| **O**pen/Closed | Extend behaviour through interfaces, not by modifying existing code. |
| **L**iskov Substitution | Implementations are substitutable for their interface. |
| **I**nterface Segregation | Prefer small, focused interfaces over large, general ones. |
| **D**ependency Inversion | Depend on abstractions, not concrete types. |


## Single Responsibility Principle (SRP)

> *A class should have only one reason to change.*

Each class does one thing and does it well. If a class changes because the scheduling algorithm changed *and also* because the logging format changed, it has two responsibilities and should be split.

**In OCUDU:** A MAC scheduler class is responsible for scheduling decisions. It does not format log messages, manage threads, or serialise ASN.1 messages - it delegates those concerns to collaborators injected through its constructor.

**Common violation to watch for:** "God classes" that accumulate helper methods over time. If a class has more than one section in its header that addresses a completely different concern, split it.

## Open / Closed Principle (OCP)

> *Software entities should be open for extension, but closed for modification.*

Adding new behaviour should be possible by implementing a new class that conforms to an existing interface, not by editing existing classes. Editing an existing, tested class risks introducing regressions and spreads the cost of a change to every caller.

**In OCUDU:** Adding a new scheduling policy means implementing `mac_scheduler` and wiring it in - not adding another `if/else` branch inside the existing scheduler. Adding a new radio device means implementing the radio plugin interface - not modifying the radio abstraction layer.

**Common violation to watch for:** Long `switch` or `if/else` chains that grow every time a new variant is added. Each new case is a signal that an interface and a set of implementations are missing.

## Liskov Substitution Principle (LSP)

> *Objects of a subclass must be substitutable for objects of the base class without altering the correctness of the program.*

Any concrete implementation of an interface must honour the full contract of that interface - not just its method signatures, but its pre-conditions, post-conditions, and invariants. A mock used in tests must behave like a real implementation would, or the tests prove nothing.

**In OCUDU:** If `mac_cell_slot_handler::handle_slot_indication()` guarantees it will never emit a grant that exceeds the configured bandwidth, every implementation - including mocks - must uphold that guarantee. Callers are allowed to rely on it.

**Common violation to watch for:** Implementations that override a method to throw `not_implemented` or silently do nothing. If the full interface is not implementable, the interface is too large (see ISP below).

## Interface Segregation Principle (ISP)

> *Clients should not be forced to depend on interfaces they do not use.*

Interfaces must be narrow and focused. A component that only needs to read metrics should not be given an interface that also exposes write and reset methods. Large interfaces couple unrelated callers and make mocking harder.

**In OCUDU:** Layer boundaries are crossed via small, purpose-built interfaces. A component that produces downlink grants exposes a `pdcch_resource_allocator` interface; a component that consumes them depends on that interface alone. It does not receive a handle to the entire scheduler.

**Common violation to watch for:** Interface files that grow long as new callers request new methods. When a method is added to an interface "because caller X needs it," check first whether a separate, narrower interface for X's use case is the right solution.

## Dependency Inversion Principle (DIP)

> *High-level modules should not depend on low-level modules. Both should depend on abstractions. Abstractions should not depend on details.*

This is the principle that directly enforces Clean Architecture's dependency rule in C++. Inner-layer classes hold references to interfaces. Outer-layer classes implement those interfaces and are injected at construction time. The inner layer never `#include`s a concrete outer-layer type.

**In OCUDU:** The MAC layer defines `lower_phy_downlink_handler`. The PHY layer implements it. The MAC entity is constructed with a reference to `lower_phy_downlink_handler` - it never instantiates a PHY object directly. This is what makes it possible to test the MAC without a PHY.

**Common violation to watch for:** Constructors that `new` their own collaborators instead of receiving them as arguments. Any use of `new ConcreteType()` inside a class body (rather than a factory) is a dependency inversion violation unless the class itself owns the concrete type as an implementation detail.

---

## Quick reference

| Principle | Rule | Violation signal |
|---|---|---|
| **SRP** | One reason to change | Class with unrelated methods; "and also" in descriptions |
| **OCP** | Extend via new types, not edits | Growing `if/switch` chains per new variant |
| **LSP** | Implementations honour full contract | `not_implemented` overrides; mocks that lie |
| **ISP** | Small, focused interfaces | Callers ignoring most of an interface's methods |
| **DIP** | Depend on abstractions | `new ConcreteType()` inside a class body |