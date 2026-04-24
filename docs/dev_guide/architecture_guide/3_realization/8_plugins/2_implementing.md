# Implementing a PHY TAP Plugin

A PHY TAP plugin requires three pieces: the processor class, the factory class, and the exported entry point. Follow these steps in order.

## Step 1 - implement the processor

Create a class that inherits from `external_ul_processor` and implements all three callbacks.

```cpp
class iq_tap_processor : public external_ul_processor
{
public:
  iq_tap_processor(unsigned nof_rb, unsigned nof_ports) :
    nof_ports(nof_ports),
    // Pre-allocate the working buffer in the constructor.
    // Dynamic allocation inside process() is forbidden.
    temp(nof_rb * NOF_SUBCARRIERS_PER_RB)
  {}

  void process(resource_grid_writer&       grid_writer,
               const resource_grid_reader& grid_reader,
               slot_point slot, unsigned symbol,
               span<const uplink_pdu_slot_repository::pusch_pdu> pusch_pdus,
               /* ... */) override
  {
    for (unsigned port = 0; port != nof_ports; ++port) {
      // Read the raw IQ samples for this port and symbol.
      grid_reader.get(temp, port, symbol, 0);

      // ---- Insert custom DSP here ----
      // Example: scale by 0.5 (attenuate by 6 dB).
      srsvec::sc_prod(temp, temp, 0.5f);
      // --------------------------------

      // Write the modified samples back.
      grid_writer.put(port, symbol, 0, temp);
    }
  }

  void process_quiet(const resource_grid_reader&, slot_point) override
  {
    // Nothing to do for quiet slots in this example.
    // Quiet callbacks only fire when enable_quiet_processing=true.
  }

  void process_prach(prach_buffer&               buffer,
                     const prach_buffer_context& context) override
  {
    // Iterate ports, time/frequency occasions, and PRACH symbols.
    // Use buffer.get_symbol(port, td_occasion, fd_occasion, symbol)
    // to access the IQ samples.
  }

private:
  unsigned          nof_ports;
  std::vector<cf_t> temp; // pre-allocated; never resize inside process()
};
```

:::caution Real-time constraint
`process()` runs on the L1 timing-critical thread and must complete within the slot budget (500 µs at numerology µ=1). Never allocate memory, call blocking APIs, perform I/O, or take locks inside `process()`, `process_quiet()`, or `process_prach()`. Pre-allocate all buffers in the constructor. See [Real-Time Safety](../5_realtime_safety.md) for the full list of forbidden operations.
:::

## Step 2 - implement the factory

The factory is responsible for constructing the processor with its configuration. OCUDU calls `create()` once per active cell at startup.

```cpp
class iq_tap_processor_factory : public external_ul_processor_factory
{
public:
  iq_tap_processor_factory(unsigned nof_rb, unsigned nof_ports) :
    nof_rb(nof_rb), nof_ports(nof_ports)
  {}

  std::unique_ptr<external_ul_processor> create() override
  {
    return std::make_unique<iq_tap_processor>(nof_rb, nof_ports);
  }

private:
  unsigned nof_rb;
  unsigned nof_ports;
};
```

## Step 3 - export the entry point

Define `create_phy_tap_factory()`. This is the single symbol OCUDU looks up from the plugin. It receives the cell parameters and the free-form argument string from the OCUDU configuration, builds the factory, and returns it.

```cpp
std::shared_ptr<phy_tap_factory>
create_phy_tap_factory(unsigned           nof_rb,
                       unsigned           nof_ports,
                       const std::string& processor_arguments)
{
  // Parse processor_arguments here if your plugin needs configuration.
  auto ext_factory = std::make_shared<iq_tap_processor_factory>(nof_rb, nof_ports);
  return std::make_shared<phy_tap_factory_impl>(std::move(ext_factory));
}
```

Once these three pieces are in place and linked into the OCUDU binary (see [Build System](./5_build_system.md)), the plugin is active. OCUDU will call `process()` on every received uplink symbol for every configured cell.
