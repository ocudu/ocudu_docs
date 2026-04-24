# Interfaces

## Principle

All communication between OCUDU software components crosses a well-defined interface boundary expressed as a pure-virtual C++ class. No component calls into another component's internals directly. This is the practical realisation of the Dependency Inversion Principle: the consuming layer defines the interface it needs; the producing layer implements it.

The benefits are consistent:

- Either side of an interface can be replaced - by a different implementation, a mock, a plugin, or a third-party component - without touching the other side.
- The interface is the documentation of the contract between two components. Reading it is sufficient to understand what one layer expects from the next.
- Unit and component tests stub out dependencies by providing lightweight implementations of the relevant interfaces.

## Stack layer interfaces

NR protocol layers (PHY, MAC, RLC, PDCP, RRC, …) communicate exclusively through C++ interfaces. A layer holds a reference to its neighbour's interface; it never instantiates the neighbour directly. The direction of the reference respects the Clean Architecture dependency rule: upper layers define what they need from lower layers; lower layers implement it.

Typical layer boundaries:

| Boundary | Interface direction |
|---|---|
| MAC ↔ PHY | MAC holds `IPhyDownlinkProcessor` and `IPhyUplinkProcessor`; PHY calls into `IMacSlotHandler` |
| RLC ↔ MAC | RLC holds `IMacUlScheduler`; MAC calls into `IRlcUlReceiver` |
| PDCP ↔ RLC | PDCP holds `IRlcTxDataHandler`; RLC calls into `IPdcpRxDataHandler` |
| RRC ↔ PDCP | RRC holds `IPdcpSrbControl`; PDCP calls into `IRrcMessageHandler` |

Each interface is defined in the header of the layer that depends on it, not in the header of the layer that implements it - this is what keeps the dependency pointing inward.

## FAPI - the PHY-MAC boundary

The **FAPI (Functional Application Platform Interface)** is the standardised interface between the L2 (MAC) and L1 (PHY). OCUDU implements FAPI as the primary mechanism for PHY-MAC communication. Using a standardised interface at this boundary means:

- The built-in OCUDU PHY can be swapped for a third-party PHY without any changes to the MAC.
- A third-party MAC can be connected below OCUDU's RLC/PDCP/RRC stack via the DU LO plugin interface, which exposes FAPI externally.
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
