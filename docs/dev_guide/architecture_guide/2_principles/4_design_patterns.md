---
sidebar_position: 4
---

# Software Design Patterns

Design patterns are reusable solutions to recurring structural problems. OCUDU uses a curated set of well-known patterns consistently throughout the codebase. Recognising them when reading code - and reaching for them when writing new code - is an important part of contributing effectively.

The patterns below are grouped by category and annotated with where and why they appear in OCUDU.

## Creational patterns

### Factory / Abstract Factory

**Problem:** A component needs to create objects without knowing their concrete type.

**In OCUDU:** Protocol entities are constructed through factory functions or factory classes that read configuration and return the right concrete implementation behind an interface pointer. This keeps construction logic out of business logic and makes it straightforward to return a different implementation (e.g. a stub or a test double) by swapping the factory.

```cpp
std::unique_ptr<IUlScheduler> make_ul_scheduler(const SchedConfig& cfg);
```

### Builder

**Problem:** Constructing a complex object requires many optional parameters and a specific assembly order.

**In OCUDU:** Configuration objects and test harness setups use a builder pattern to avoid multi-argument constructors that are easy to call incorrectly. The builder validates the configuration before constructing the final object.

## Structural patterns

### Adapter (Gateway)

**Problem:** Two components have incompatible interfaces; one must be wrapped to look like the other.

**In OCUDU:** Layer boundaries regularly require adapters. When connecting OCUDU to a third-party PHY, an adapter class wraps the external API and presents the `IPhyDownlinkProcessor` interface that the MAC expects. The MAC never knows the adapter exists. This is one of the most heavily used patterns in the codebase.

### Decorator

**Problem:** Behaviour needs to be added to an object without modifying its class.

**In OCUDU:** Instrumentation (metrics collection, logging, tracing) is layered on top of a core implementation using decorators that implement the same interface and delegate to the inner object. This keeps instrumentation code out of protocol logic.

```cpp
// Wraps a real scheduler and records scheduling metrics around every call.
class MetricsDecoratorScheduler : public IScheduler { ... };
```

## Behavioural patterns

### Strategy

**Problem:** An algorithm needs to be selectable at runtime or configuration time.

**In OCUDU:** Scheduling policies, HARQ retransmission strategies, and link adaptation algorithms are all strategies. Each variant implements a common interface; the containing component holds a pointer to the interface and calls it without knowing which concrete strategy is active. Adding a new variant is adding a new class - no existing code changes.

### Observer (Notifier / Event dispatcher)

**Problem:** One component needs to notify others when something happens, without knowing who is listening.

**In OCUDU:** Cross-layer events (slot indications, UE state changes, measurement reports) are dispatched through an observer/notifier pattern. Producers fire events into an event dispatcher; consumers register as listeners. This keeps producers and consumers decoupled - neither includes the other's header.

### Command

**Problem:** An operation needs to be encapsulated as an object so it can be queued, deferred, or cancelled.

**In OCUDU:** Protocol procedures that span multiple slot boundaries are modelled as command-like objects or coroutine tasks. This allows the executor framework to schedule, prioritise, and cancel them independently of the protocol logic that issues them.

### Template Method

**Problem:** The skeleton of a procedure is fixed, but certain steps vary between implementations.

**In OCUDU:** Common procedure scaffolding (timer management, state machine transitions, PDU assembly) is implemented in a base class. Subclasses override only the steps that differ. This avoids duplicating the procedural skeleton across multiple variants.

### Null Object

**Problem:** A component requires a collaborator, but in some configurations that collaborator does nothing.

**In OCUDU:** Rather than littering code with `if (reporter != nullptr) reporter->report(...)`, OCUDU uses null-object implementations that conform to the full interface but do nothing. The `NullMetricsReporter` is a typical example. This keeps calling code clean and makes the "no-op" case explicit.

## Pattern selection guide

When deciding which pattern to apply, use this rough guide:

| Situation | Pattern to consider |
|---|---|
| Need to create objects without knowing their type | Factory |
| Need to build a complex object step by step | Builder |
| Need to make an incompatible interface fit | Adapter |
| Need to add behaviour without changing a class | Decorator |
| Need to select an algorithm at runtime | Strategy |
| Need to decouple event producers from consumers | Observer |
| Need to queue or defer an operation | Command |
| Need a fixed procedure with variable steps | Template Method |
| Need a safe "do nothing" default | Null Object |

Patterns are tools, not targets. If the straightforward solution is simpler than any pattern, use the straightforward solution.
