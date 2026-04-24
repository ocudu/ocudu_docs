# Plugin Configuration

## Enabling the PHY TAP plugin

Plugins are enabled and configured through the `expert_phy` section of the OCUDU configuration file:

```yaml
expert_phy:
  enable_phy_tap: true
  phy_tap_arguments: "enable_quiet_processing=true,tap_ul_epre=tcp://*:5555"
```

Or equivalently via command-line flags:

```bash
--expert_phy.enable_phy_tap=true \
--expert_phy.phy_tap_arguments="enable_quiet_processing=true,tap_ul_epre=tcp://*:5555"
```

## How arguments are passed to the plugin

The entire `phy_tap_arguments` string is passed verbatim to `create_phy_tap_factory()` as the `processor_arguments` parameter. Parsing is the plugin's responsibility. The convention used in the example plugin is comma-separated `key=value` pairs, parsed with standard regex:

```cpp
std::smatch m;
if (std::regex_search(args, m, std::regex(R"(enable_quiet_processing=(true|false))"))) {
  enable_quiet = (m[1].str() == "true");
}
```

## Supported arguments

| Argument | Type | Default | Description |
|---|---|---|---|
| `enable_quiet_processing` | `true\|false` | `false` | Enables `process_quiet()` callbacks for slots with no uplink allocations. Disabled by default to avoid unnecessary CPU load on idle slots. |
| `log_level` | `none\|error\|warning\|info\|debug` | `warning` | Controls the verbosity of the plugin's logger. |
| `tap_ul_epre` | ZMQ address string | *(disabled)* | Activates the ZMQ EPRE telemetry decorator and binds to the given address, e.g. `tcp://*:5555`. See [Chaining Processors](./3_decorator_chaining.md). |

## Adding custom arguments

Any `key=value` pair can be added to the argument string. Custom arguments are ignored by the built-in parsing; only the plugin's own `create_phy_tap_factory()` implementation reads them. This means a plugin can expose its own configuration surface without any changes to OCUDU's configuration schema.
