---
description: "Implementation of the DU-high (Distributed Unit - High) in OCUDU, including components and interfaces."
displayed_sidebar: devSidebar
---

# DU-high

<img src={require('./assets/du_high.png').default} alt="DU-high architecture" style={{maxWidth: '900px', width: '100%', display: 'block', margin: '2rem auto'}} />

The DU-high (Distributed Unit - High) is responsible for handling both uplink and downlink traffic, specifically the MAC and RLC processing of these signals. The DU-high communicates directly with the CU-CP and CU-UP via the F1-c and F1-u interfaces, the DU-low via the FAPI interface, and optionally with the near-RT RIC via the E2 interface.

## Components

- **DU Manager:** Manages the DU, specifically the connected UEs and RAN resources.
- **RLC:** The Radio Link Control (RLC) layer sits between the MAC in the DU-high and the F1AP/PDCP in the CU. It provides transport services for SRBs and DRBs and operates in three modes: transparent (TM), unacknowledged (UM), and acknowledged (AM).
- **MAC:** The Medium Access Control (MAC) layer is responsible for encoding and decoding MAC PDUs, scheduling uplink and downlink grants, and other control services including System Information, Paging, UE data scheduling, and Random Access handling.

## Interfaces

| Interface | Connects to |
|-----------|-------------|
| E2 | Near-RT RIC |
| F1-c | CU-CP |
| F1-u | CU-UP |
| FAPI | DU-low |
