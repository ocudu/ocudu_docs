
# Software Design Patterns

Design patterns are reusable solutions to recurring structural problems. OCUDU uses a curated set of well-known patterns consistently throughout the codebase. Recognising them when reading code - and reaching for them when writing new code - is an important part of contributing effectively.

The patterns below are grouped by category and annotated with where and why they appear in OCUDU.

## Creational patterns

### Factory / Abstract Factory

**Problem:** A component needs to create objects without knowing their concrete type.

**In OCUDU:** Protocol entities are constructed through factory functions or factory classes that read configuration and return the right concrete implementation behind an interface pointer. This keeps construction logic out of business logic and makes it straightforward to return a different implementation (e.g., a stub or a test double) by swapping the factory.

```cpp
std::unique_ptr<mac_scheduler> make_mac_scheduler(const scheduler_expert_config& cfg);
```

### Builder

**Problem:** Constructing a complex object requires many optional parameters and a specific assembly order.

**In OCUDU:** Configuration objects and test harness setups use a builder pattern to avoid multi-argument constructors that are easy to call incorrectly. The builder validates the configuration before constructing the final object.
Have a look at the FAPI message builders for an example of this pattern, and check the unit tests [here](https://gitlab.com/ocudu/ocudu/-/blob/dev/tests/unittests/fapi/p7/builders/dl_pdsch_pdu_test.cpp?ref_type=heads) as well.

## Structural patterns

### Adapter

**Problem:** Two components have incompatible interfaces; one must be wrapped to look like the other.

**In OCUDU:** Layer boundaries regularly require adapters. The F1AP layer is a clear example. The DU-high holds a pointer to an `f1ap_message_handler` interface and calls it to send F1AP messages upward. Two concrete adapters implement that same interface:

- **`f1ap_sctp_adapter`** — wraps a real SCTP association. It serialises the ASN.1 message and hands the byte stream to the transport layer. This is the adapter used in a deployed system where the DU and CU run as separate network nodes.
- **`f1ap_local_adapter`** (fast path) — skips serialisation and SCTP entirely. It passes the already-decoded message object directly to the CU-CP handler in the same process. This is used when DU and CU are co-located, eliminating unnecessary encode/decode round-trips and loopback overhead.

The DU-high is never aware of which adapter is active. Swapping between split and co-located deployments is purely a wiring decision made at startup. This is one of the most heavily used patterns in the codebase.

### Decorator

**Problem:** Behaviour needs to be added to an object without modifying its class.

**In OCUDU:** Instrumentation (metrics collection, logging, tracing) is layered on top of a core implementation using decorators that implement the same interface and delegate to the inner object. This keeps instrumentation code out of protocol logic.

```cpp
// Wraps a real scheduler and records scheduling metrics around every call.
class scheduler_metrics_decorator : public mac_scheduler { ... };
```

## Behavioural patterns

### Strategy

**Problem:** An algorithm needs to be selectable at runtime or configuration time.

**In OCUDU:** The strategy pattern is the default way components interact. Every handler interface (`mac_scheduler`, `f1ap_message_handler`, `lower_phy_downlink_handler`, etc.) is a strategy contract: the holder knows only the interface, not the concrete type behind it. This means any component can be replaced - with a real implementation, a stub, a decorator, or an adapter - without touching its caller. Scheduling policies, HARQ retransmission strategies, and link adaptation algorithms are specific examples of this, but the pattern is pervasive across all layer boundaries.

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

**In OCUDU:** Rather than littering code with `if (reporter != nullptr) reporter->report(...)`, OCUDU uses null-object implementations that conform to the full interface but do nothing. The `null_mac_metrics_notifier` is a typical example. This keeps calling code clean and makes the "no-op" case explicit.