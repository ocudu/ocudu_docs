---
description: "Implementation of the CU-UP (Central Unit - User Plane) in OCUDU, including components and interfaces."
displayed_sidebar: devSidebar
---

# CU-UP

<img src={require('./assets/cu_up.png').default} alt="CU-UP architecture" style={{maxWidth: '520px', width: '100%', display: 'block', margin: '2rem auto'}} />

The CU-UP (Central Unit - User Plane) is responsible for handling user plane messaging, specifically the user plane aspects of the PDCP and SDAP protocols. The CU-UP communicates directly with the UPF in the 5G Core via the N3 interface, the CU-CP via the E1 interface, the DU-high via the F1-u interface, and optionally with the near-RT RIC via the E2 interface.

## Components

- **UE Manager:** Manages connected UEs in the CU-UP. Responsible for adding and removing UEs and providing relevant UE information to other processes. Communicates UE information to and from the CU-CP, DU, and Core.
- **GTP-U:** The GPRS Tunneling Protocol User Plane (GTP-U) is responsible for transporting user plane traffic to and from the UPF of the 5G Core via the N3 interface.
- **SDAP:** The Service Data Adaptation Protocol (SDAP) is responsible for adapting and mapping Quality of Service (QoS) requirements onto user plane traffic.
- **PDCP:** The Packet Data Convergence Protocol (PDCP) is responsible for handling user plane data before and after it passes through the DU-high.

## Interfaces

| Interface | Connects to |
|-----------|-------------|
| E2 | Near-RT RIC |
| E1 | CU-CP |
| F1-u | DU (user plane) |
| N3 | 5G Core (UPF) |
