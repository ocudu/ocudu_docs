---
sidebar_position: 1
---


# Clean Architecture

OCUDU is built on [Clean Architecture](https://blog.cleancoder.com/uncle-bob/2012/08/13/the-clean-architecture.html) principles introduced by Robert C. Martin. The core idea is to organise code into concentric layers where **dependencies always point inward** - from low-level infrastructure details toward high-level business rules - and never the other way around.

## The dependency rule

The single most important rule is: **source code dependencies must point inward only**. An inner layer never knows anything about an outer layer. This means:

- High-level business logic does not depend on frameworks, databases, or I/O.
- Business rules can be tested without spinning up any external infrastructure.
- Swapping out an outer-layer component (e.g. a radio driver) does not require touching inner-layer code.

![The Clean Architecture diagram - four concentric rings: Entities (centre), Use Cases, Interface Adapters, and Frameworks & Drivers (outer). Arrows point inward, showing the dependency direction.](assets/clean_arch_simple.svg)

*Reproduced from Robert C. Martin, ["The Clean Architecture"](https://blog.cleancoder.com/uncle-bob/2012/08/13/the-clean-architecture.html), 2012. The original diagram and article are © Robert C. Martin.*

## Layers in OCUDU

OCUDU maps the Clean Architecture rings directly onto the 5G NR protocol stack, from highest to lowest abstraction:

| Abstraction | Layer | What lives here |
|---|---|---|
| Highest | **Business entities** | NR protocol layer implementations (MAC, RLC, PDCP, …) |
| ↑ | **Business logic** | 3GPP TS procedures and state machines |
| ↓ | **Adaptors** | Layer adaptors, gateways (GWs), interface glue |
| Lowest | **Frameworks & drivers** | Device drivers, I/O, build-system integrations |

The key constraint: **lower abstraction modules depend on higher abstraction modules, not the reverse**. A device driver does not import a MAC-layer header; the MAC layer defines an interface and the driver implements it.

## Separation of concerns

Mixing code from different abstraction layers is actively avoided:

- Keep abstraction layer boundaries and interfaces clean and narrow.
- Minimise coupling between modules at different abstraction levels.
- Use interfaces (abstract C++ classes) as the contract at every boundary. This decouples data from behaviour, enables mocking in tests, and allows CPU-optimised implementations to be swapped in without changing business logic.

## Dependency inversion at the boundary

When the direction of control flow would force an inner layer to call outward, the **Dependency Inversion Principle** is applied. The inner layer defines an interface; the outer layer implements it. This keeps the dependency arrow pointing inward even when control flows outward. The component diagram in the figure above illustrates this at the use-case boundary:

1. `Controller` calls the `Use Case Input Port` interface (defined by the inner layer).
2. `Use Case Interactor` (inner layer) implements that interface and drives the logic.
3. `Use Case Interactor` calls the `Use Case Output Port` interface (also defined by the inner layer).
4. `Presenter` (outer layer) implements the output port interface.

At runtime control flows Controller → Interactor → Presenter; at compile time all dependency arrows point inward.

## What this means for contributors

When adding a feature, decide which layer it belongs to before writing any code:

- **New hardware support** → touch only the lowest layer (device drivers / frameworks).
- **New deployment scenario** → touch the adaptor layer and possibly the driver layer.
- **New protocol behaviour** → touch only the business logic or business entity layers.

Keeping changes scoped to the correct layer is what allows the codebase to stay portable, testable, and maintainable as it grows.

## Benefits at a glance

- **Portability**: C++ codebase runs across different platforms; hardware dependencies are isolated to the lowest layer.
- **Testability**: Business rules are tested without external components by mocking interface implementations.
- **Decoupled NR layers**: MAC, RLC, PDCP, and other NR layers are completely decoupled from each other through interfaces.
- **3rd-party integration**: External PHYs connect via FAPI; the rest of the stack is unaffected.
- **Flexible execution**: Memory and threading resources are configurable without touching business logic.
- **CPU optimisation**: Interface-based design allows swapping a generic implementation for a SIMD-optimised one without changing call sites.
