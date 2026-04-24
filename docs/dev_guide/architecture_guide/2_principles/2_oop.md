---
sidebar_position: 3
---

# Object Oriented Programming

OCUDU is written in C++ and uses Object Oriented Programming (OOP) as its fundamental building block. OOP is not just a language feature here - it is the mechanism that makes the layered architecture, interface-based design, and testability strategy work in practice.

## Core concepts and how they apply

### Encapsulation

A class owns its data and controls how it is accessed. Implementation details - internal state, helper methods, data structures - are hidden behind a public interface. Callers depend only on what a class promises to do, not on how it does it.

In OCUDU this means:
- Internal state of a protocol entity (e.g. an RLC bearer's window, a MAC scheduler's queue) is never accessed directly from another layer.
- Only the methods declared in the public interface of a class are stable API. Everything else is free to change without breaking callers.

### Abstraction

Classes model real domain concepts at the right level of detail for their layer. A MAC entity is not a bundle of raw buffers and timers - it is an object with meaningful operations (`handle_pdu`, `schedule_ul_grant`, …). Naming and interface design should reflect the 3GPP domain, not the internal implementation.

### Inheritance - use sparingly

Inheritance is used to express genuine "is-a" relationships. It is **not** used as a code-reuse mechanism. In practice, most inheritance in OCUDU is one level deep: a concrete class inherits from a pure-virtual interface class and nothing else.

Prefer **composition over inheritance** when sharing behaviour. Injecting a collaborator as a constructor parameter is almost always cleaner and more testable than inheriting from a base class that bundles that behaviour.

### Polymorphism

Polymorphism through virtual functions is the backbone of OCUDU's interface-based design. A pointer or reference to an interface class (pure virtual) can hold any conforming implementation at runtime. This is what makes it possible to:

- swap in a mock implementation during unit tests,
- replace the built-in PHY with a third-party one via a plugin,
- select a CPU-optimised algorithm at startup without changing call sites.

The dependency rule of Clean Architecture is enforced directly through this mechanism: inner layers hold pointers to interface classes defined in the same layer; outer layers provide the concrete implementations.

## Composition over inheritance

When a class needs a capability, inject it as a collaborator rather than inheriting it:

```cpp
// Prefer this:
class MacScheduler {
public:
  explicit MacScheduler(IMetricsReporter& reporter) : reporter(reporter) {}
private:
  IMetricsReporter& reporter;
};

// Over this:
class MacScheduler : public MetricsReporterBase { ... };
```

Composition keeps classes focused, makes dependencies explicit, and means each collaborator can be mocked independently in tests.

## Object ownership and lifetime

OCUDU follows clear ownership rules to avoid memory errors and undefined lifetime:

| Ownership model | When to use |
|---|---|
| `std::unique_ptr` | One clear owner; ownership can be transferred |
| `std::shared_ptr` | Shared ownership with reference counting (use sparingly - prefer unique ownership) |
| Raw reference or pointer | Non-owning access to an object whose lifetime is guaranteed to outlive the reference |

Raw pointers are never used for ownership. Returning a raw pointer signals "I am not giving you ownership; the object is managed elsewhere and will outlive this pointer." If that guarantee cannot be made, use a smart pointer.
