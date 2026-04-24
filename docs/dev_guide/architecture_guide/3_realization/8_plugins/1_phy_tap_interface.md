# The PHY TAP Plugin Interface

The PHY TAP plugin is the primary extension point for custom uplink signal processing. It intercepts received IQ samples at the upper PHY layer - after the radio front-end and FFT, before OCUDU's own channel estimation and decoding - giving a plugin full access to the resource grid on every slot.

## The processing interface

Every PHY TAP plugin must implement `external_ul_processor`. This is the interface OCUDU calls:

```cpp
class external_ul_processor
{
public:
  virtual ~external_ul_processor() = default;

  /// Called once per received uplink symbol on every allocated slot.
  /// grid_reader gives read access to the raw IQ samples.
  /// grid_writer allows the plugin to write modified samples back.
  virtual void process(
      resource_grid_writer&                                      grid_writer,
      const resource_grid_reader&                               grid_reader,
      slot_point                                                slot,
      unsigned                                                  symbol,
      span<const uplink_pdu_slot_repository::pusch_pdu>         pusch_pdus,
      span<const uplink_pdu_slot_repository::pucch_pdu>         pucch_pdus,
      span<const pucch_processor::format1_common_configuration> pucch_f1_pdus,
      span<const uplink_pdu_slot_repository::srs_pdu>           srs_pdus) = 0;

  /// Called once per slot for quiet (unallocated) slots.
  /// Requires enable_quiet_processing=true in the plugin arguments.
  virtual void process_quiet(const resource_grid_reader& grid_reader,
                             slot_point                  slot) = 0;

  /// Called for each received PRACH window.
  virtual void process_prach(prach_buffer&               buffer,
                             const prach_buffer_context& context) = 0;
};
```

There are three distinct callbacks:

| Callback | Trigger | Receives |
|---|---|---|
| `process()` | Once per uplink symbol on an allocated slot | Resource grid reader/writer, slot/symbol index, all active PDU descriptors (PUSCH, PUCCH, SRS) |
| `process_quiet()` | Once per quiet (unallocated) slot | Resource grid reader, slot index |
| `process_prach()` | Once per PRACH reception window | PRACH buffer and context (format, ports, occasions) |

The PDU descriptors passed to `process()` tell the plugin exactly which RNTIs are active and where their allocations are in the resource grid - without the plugin needing to decode any scheduling messages itself.

## The factory interface

OCUDU does not instantiate processors directly. It asks a **factory** to create them, one per active cell. The factory interface is:

```cpp
class external_ul_processor_factory
{
public:
  virtual ~external_ul_processor_factory() = default;

  /// Creates one processor instance. Called once per cell at startup.
  virtual std::unique_ptr<external_ul_processor> create() = 0;
};
```

Factories receive all configuration they need at construction time - number of resource blocks, number of antenna ports, free-form argument string. This separates "how to configure the processor" from "how to process a symbol", keeping each class focused on a single responsibility.

## The adapter layer

OCUDU's internal PHY TAP interface (`phy_tap`) is distinct from `external_ul_processor`. An adapter class bridges the two, translating OCUDU's internal callbacks into the external interface. This insulation means the external interface can remain stable even as OCUDU's internal interfaces evolve:

```cpp
class phy_tap_impl : public phy_tap
{
public:
  explicit phy_tap_impl(std::unique_ptr<external_ul_processor> processor) :
    processor(std::move(processor))
  {}

  void handle_ul_symbol(resource_grid_writer&       grid_writer,
                        const resource_grid_reader& grid_reader,
                        slot_point slot, unsigned symbol,
                        /* PDU spans... */) override
  {
    processor->process(grid_writer, grid_reader, slot, symbol, /* ... */);
  }

  void handle_quiet_grid(const resource_grid_reader& grid_reader,
                         slot_point slot) override
  {
    processor->process_quiet(grid_reader, slot);
  }

  void handle_prach_window(prach_buffer&               buffer,
                           const prach_buffer_context& context) override
  {
    processor->process_prach(buffer, context);
  }

private:
  std::unique_ptr<external_ul_processor> processor;
};
```

## The entry point

Every plugin must export exactly one free function. This is the only symbol OCUDU resolves from the plugin at startup:

```cpp
// Declared in OCUDU's plugin header; defined in the plugin's factory source file.
std::shared_ptr<phy_tap_factory>
create_phy_tap_factory(unsigned           nof_rb,
                       unsigned           nof_ports,
                       const std::string& processor_arguments);
```

The implementation creates the plugin's factory chain and returns it to OCUDU:

```cpp
std::shared_ptr<phy_tap_factory>
create_phy_tap_factory(unsigned nof_rb, unsigned nof_ports,
                       const std::string& processor_arguments)
{
  return std::make_shared<phy_tap_factory_impl>(nof_rb, nof_ports, processor_arguments);
}
```

OCUDU calls this once at startup, holds the returned `phy_tap_factory`, and calls `factory->create()` once per cell to get the per-cell `phy_tap` instance it drives at runtime.
