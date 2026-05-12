# Plugins

The plugin system allows extending or replacing parts of OCUDU with third-party implementations without modifying the core codebase. Plugins live in the outermost layer of the Clean Architecture: they depend on OCUDU interfaces, but OCUDU never depends on them. The core stack does not know - and does not care - whether it is talking to a built-in implementation or a plugin.

## Available plugin types

| Plugin | Purpose |
|---|---|
| **Radio** | Add support for a new split-8 radio device |
| **DU HI** | Interface a 3rd-party PHY; the built-in PHY and higher layers are not instantiated |
| **DU LO** | Interface a 3rd-party MAC; the built-in MAC and higher layers are not instantiated |
| **PHY TAP** | Tap uplink IQ symbols at the PHY layer for custom processing, monitoring, or telemetry |

## How the plugin system works

The application controls the entire lifecycle. The pattern is the same for all plugin types:

1. At startup, OCUDU calls a **factory entry point** exported by the plugin, passing configuration parameters.
2. The plugin's factory creates one or more objects that implement a well-defined **C++ interface**.
3. OCUDU stores a pointer to that interface and calls it at runtime - it never touches the plugin's internals.

This directly realises the Dependency Inversion Principle. OCUDU defines the interface; the plugin provides the implementation. The dependency arrow points inward, toward OCUDU, even though the runtime call goes outward.

## Plugin lifecycle

```
Startup
  OCUDU calls create_phy_tap_factory(nof_rb, nof_ports, args)
    └─ Plugin builds factory chain from args
         └─ Returns phy_tap_factory to OCUDU

  OCUDU calls factory->create() for each cell
    └─ Factory creates external_ul_processor chain
         └─ phy_tap_impl wraps it and returns phy_tap to OCUDU

Runtime - per symbol (allocated slot)
  OCUDU upper PHY calls phy_tap::handle_ul_symbol()
    └─ phy_tap_impl calls external_ul_processor::process()
         └─ Decorator chain executes in order
              └─ Custom DSP reads/writes resource grid
              └─ (Optional) ZMQ decorator streams measurements async

Runtime - per slot (quiet slot, if enabled)
  OCUDU calls phy_tap::handle_quiet_grid()
    └─ external_ul_processor::process_quiet()

Runtime - per PRACH window
  OCUDU calls phy_tap::handle_prach_window()
    └─ external_ul_processor::process_prach()
```

## Dependency rule

A well-written plugin:

- includes only the interface headers provided by OCUDU (`external_ul_processor.h`, `external_processor_factories.h`),
- never includes internal OCUDU headers outside of those interfaces,
- pre-allocates all memory in constructors - never inside processing callbacks (if it's executed in the critical path),
- defers any I/O (network, disk) to a background thread so the critical path is not blocked.

---

import DocCardList from '@theme/DocCardList';

<DocCardList />
