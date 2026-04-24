# Chaining Processors with the Decorator Pattern

More complex use cases need to compose multiple processing stages - for example, running a custom DSP algorithm and simultaneously streaming telemetry to an external system - without either stage knowing about the other. The Decorator pattern achieves this: each stage wraps the previous one and implements the same `external_ul_processor` interface.

## The pattern

```
create_phy_tap_factory()
  └─ ul_epre_zmq_tap_factory::create()
       └─ ul_epre_zmq_tap
            └─ iq_tap_processor_factory::create()
                 └─ iq_tap_processor   ← innermost, runs first
```

Each decorator calls the inner processor before (or after) its own work, then adds its own behaviour. The chain is assembled in the entry point from the argument string; no stage modifies the others.

## Example: a ZMQ telemetry decorator

This decorator wraps any existing processor and streams per-subcarrier energy measurements (EPRE) to an external receiver over ZMQ after the last symbol of each slot. The ZMQ send is dispatched to a background worker so the critical path is not blocked by network I/O.

```cpp
class ul_epre_zmq_tap : public external_ul_processor
{
public:
  ul_epre_zmq_tap(std::unique_ptr<external_ul_processor> inner,
                     const std::string& zmq_address) :
    inner(std::move(inner)),
    zmq_backend(zmq_address),
    worker("ULPhyTap", default_queue_size),
    executor(worker)
  {}

  void process(resource_grid_writer&       grid_writer,
               const resource_grid_reader& grid_reader,
               slot_point slot, unsigned symbol,
               /* PDU spans... */) override
  {
    // 1. Delegate to the wrapped stage first.
    if (inner) {
      inner->process(grid_writer, grid_reader, slot, symbol, /* ... */);
    }

    // 2. On the last symbol of the slot, compute and stream EPRE.
    //    This is done after the inner stage so it sees any modifications
    //    written back by the inner processor.
    if (symbol == grid_reader.get_nof_symbols() - 1) {
      send_epre_async(grid_reader);
    }
  }

  void process_quiet(const resource_grid_reader& grid_reader,
                     slot_point slot) override
  {
    if (inner) inner->process_quiet(grid_reader, slot);
  }

  void process_prach(prach_buffer& buffer,
                     const prach_buffer_context& context) override
  {
    if (inner) inner->process_prach(buffer, context);
  }

private:
  void send_epre_async(const resource_grid_reader& grid_reader)
  {
    auto buffer = compute_epre(grid_reader); // reads from the grid, no allocation

    // Hand off to the background thread. The critical path returns immediately.
    executor.defer([this, buf = std::move(buffer)]() {
      zmq_backend.send_buffer(*buf);
    });
  }

  std::unique_ptr<external_ul_processor> inner;
  zmq_server_backend                     zmq_backend;
  task_worker                            worker;
  task_worker_executor                   executor;
};
```

## The decorator's factory

The decorator's factory wraps any existing `external_ul_processor_factory`, which makes it composable with any other stage without knowing its type:

```cpp
class ul_epre_zmq_tap_factory : public external_ul_processor_factory
{
public:
  ul_epre_zmq_tap_factory(std::shared_ptr<external_ul_processor_factory> inner_factory,
                   std::string zmq_address) :
    inner_factory(std::move(inner_factory)),
    zmq_address(std::move(zmq_address))
  {}

  std::unique_ptr<external_ul_processor> create() override
  {
    return std::make_unique<ul_epre_zmq_tap>(
        inner_factory->create(), zmq_address);
  }

private:
  std::shared_ptr<external_ul_processor_factory> inner_factory;
  std::string zmq_address;
};
```

## Wiring the chain in the entry point

The entry point builds the chain from the argument string. Adding the ZMQ decorator requires no changes to `iq_tap_processor` or its factory - it is purely additive:

```cpp
std::shared_ptr<phy_tap_factory>
create_phy_tap_factory(unsigned nof_rb, unsigned nof_ports,
                       const std::string& args)
{
  // Start with the base processing stage.
  std::shared_ptr<external_ul_processor_factory> factory =
      std::make_shared<iq_tap_processor_factory>(nof_rb, nof_ports);

  // If tap_ul_epre=<address> appears in args, wrap with the ZMQ decorator.
  std::smatch m;
  if (std::regex_search(args, m, std::regex(R"(tap_ul_epre=([^,]*))"))) {
    factory = std::make_shared<ul_epre_zmq_tap_factory>(std::move(factory), m[1].str());
  }

  return std::make_shared<phy_tap_factory_impl>(std::move(factory));
}
```

At runtime this produces the chain **ZMQ decorator → custom processor**, assembled entirely from the configuration string, with no `if` branches inside any processing stage. Adding a further stage is another `if` block in the entry point and a new decorator class - nothing else changes.
