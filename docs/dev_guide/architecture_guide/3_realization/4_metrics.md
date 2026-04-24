# Metrics Reporting

## Overview

Every protocol layer in OCUDU reports its own performance and KPI metrics independently. Metrics are not collected by a central observer that reaches into layer internals - each layer pushes metrics outward through a reporting interface, keeping the measurement concern separated from the protocol logic.

## Metric categories

| Category | Examples |
|---|---|
| **RAN KPI metrics** | Throughput (DL/UL), BLER, CQI distribution, HARQ retransmission rate, active UE count |
| **Scheduling metrics** | Grant utilisation, PRB allocation per UE, scheduler queue depth |
| **Performance metrics** | Task execution latency, inter-slot jitter, CPU utilisation per component |
| **Execution metrics** | Executor queue depth, strand backlog, thread pool saturation |

## Reporting interface

Each layer that produces metrics depends on a `mac_metrics_notifier` interface injected at construction time. The layer calls `on_new_metrics_report()` with a typed metrics struct; it does not know - and must not assume - where the data goes. The wiring layer connects the notifier interface to the active backend (log file, Prometheus endpoint, in-memory ring buffer for testing, or a null-object no-op).

This design means:

- Adding a new metrics backend requires only a new implementation of `mac_metrics_notifier` - no protocol code changes.
- In unit tests, a `null_mac_metrics_notifier` or a capturing test double is injected; no real backend is needed.
- Metrics collection can be disabled at zero runtime cost by injecting the null object.

## Per-layer ownership

Each layer owns the definition of its own metrics struct. The MAC defines `mac_metric_report`; the RLC defines `rlc_metrics`; and so on. This avoids a monolithic metrics schema that every layer must update whenever any other layer changes. Consumers that want a combined view aggregate the per-layer structs at the wiring layer.

## Relationship to instrumentation

Metrics reporting covers aggregated, periodic measurements (e.g. throughput averaged over one second). It is complementary to - and separate from - the other instrumentation strategies:

- **Logging** captures discrete events and errors at human-readable granularity.
- **Traces** capture fine-grained, timestamped events for timing analysis of individual slot processing cycles.
- **Metrics** capture aggregated KPIs suitable for dashboards and alerting.

All three are injected through interfaces and can be enabled, disabled, or replaced independently.