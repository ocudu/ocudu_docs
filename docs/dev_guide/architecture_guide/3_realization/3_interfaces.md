# Interfaces

## Principle

All communication between OCUDU software components crosses a well-defined interface boundary expressed as a pure-virtual C++ class. No component calls into another component's internals directly. This is the practical realisation of the Dependency Inversion Principle: the consuming layer defines the interface it needs; the producing layer implements it.

The benefits are consistent:

- Either side of an interface can be replaced - by a different implementation, a mock, a plugin, or a third-party component - without touching the other side.
- The interface is the documentation of the contract between two components. Reading it is sufficient to understand what one layer expects from the next.
- Unit and component tests stub out dependencies by providing lightweight implementations of the relevant interfaces.

## Stack layer interfaces

Any two components that communicate across a significant boundary do so through a pure-virtual interface. This includes 3GPP protocol layers (PHY, MAC, RLC, PDCP, RRC), functional splits (DU-high to DU-low, CU to DU), infrastructure services (timers, executors, metrics reporters), and any plugin or third-party integration point.

The critical consequence is that **no layer object holds a direct pointer to another layer object**. RLC does not know that MAC exists as a concrete class; MAC does not know that RLC exists as a concrete class. What they hold are pointers to interfaces. The wiring - creating both objects and connecting them through their interfaces - happens in the application or test harness, not inside the protocol components themselves.

Adapter objects are what make this work in practice. When two layers need to communicate but their interfaces do not match exactly, an adapter sits between them, implementing the interface one side expects while delegating to the other side. The adapter is instantiated in the wiring layer; neither protocol component is aware of its existence. This is described further in the [Adapter design pattern](9_design_patterns.md#adapter).

Typical 3GPP layer boundaries:

| Boundary | Interface direction |
|---|---|
| MAC ↔ PHY | MAC holds `lower_phy_downlink_handler` and `lower_phy_uplink_handler`; PHY calls into `mac_cell_slot_handler` |
| RLC ↔ MAC | RLC holds `mac_rlc_ul_scheduler`; MAC calls into `rlc_rx_lower_layer_interface` |
| PDCP ↔ RLC | PDCP holds `rlc_tx_lower_layer_interface`; RLC calls into `pdcp_rx_lower_notifier` |
| RRC ↔ PDCP | RRC holds `pdcp_entity_control`; PDCP calls into `rrc_ul_dcch_pdu_handler` |

Each interface is defined in the header of the layer that depends on it, not in the header of the layer that implements it - this is what keeps the dependency pointing inward.

## FAPI - the PHY-MAC boundary

The **FAPI (Functional Application Platform Interface)** is the standardised interface between the L2 (MAC) and L1 (PHY). OCUDU implements FAPI as the primary mechanism for PHY-MAC communication. Using a standardised interface at this boundary means:

- The built-in OCUDU PHY can be swapped for a third-party PHY without any changes to the MAC. This is the `du_high` plugin.
- A third-party DU-high (L2 and above) can drive OCUDU's L1 via the `du_low` plugin interface, which exposes the FAPI boundary upward so external schedulers and MAC implementations can plug in above it.
- Integration with commercial small-cell PHYs, SDR frameworks, and FPGA-based modems is possible without modifying the core stack.

## Functional splits

OCUDU supports multiple functional split points, each realised through the same interface discipline:

| Split | Description |
|---|---|
| **CU/DU split** | RRC and PDCP run in the Central Unit (CU); RLC, MAC, and PHY run in the Distributed Unit (DU). Communication over the F1 interface. |
| **Split 6** | MAC and above in the DU High; PHY in the DU Low. The FAPI interface is the split point. |
| **Split 7.2x** | Upper PHY in the DU; lower PHY and radio in the RU. The Open Fronthaul (OFH) interface is the split point. |
| **Split 8** | Full PHY in the RU; the DU handles MAC and above. The radio plugin interface is the split point. |

Each split is supported by defining the appropriate interface at the split boundary and providing implementations on both sides. Adding a new split means adding a new interface - existing code above and below the split is unaffected.
