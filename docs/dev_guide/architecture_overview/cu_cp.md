---
description: "Implementation of the CU-CP (Central Unit - Control Plane) in OCUDU, including components and interfaces."
displayed_sidebar: devSidebar
---

# CU-CP

<img src={require('./assets/cu_cp.png').default} alt="CU-CP architecture" style={{maxWidth: '680px', width: '100%', display: 'block', margin: '2rem auto'}} />

The CU-CP (Central Unit - Control Plane) is responsible for handling control plane messaging, specifically the control plane aspect of the PDCP protocol. The CU-CP communicates directly with the AMF via the N2 interface, the CU-UP via the E1 interface, the DU-high via the F1-c interface, and optionally with the near-RT RIC via the E2 interface. This implementation takes a UE-centric approach.

## Components

- **CU-UP Processor:** Handles each CU-UP connected to the CU-CP. Multiple CU-UPs can be connected to a single CU-CP; the E1AP is instantiated inside the CU-UP Processor for each connected CU-UP.
- **DU Processor:** Handles each DU connected to the CU-CP. Each connected DU has its own DU Processor with bundled F1AP, PDCP, and RRC procedures. Each connected UE also has its own RRC UE instance containing the PDCP processes.
- **UE Manager:** Manages connected UEs in the CU-CP. Responsible for adding and removing UEs and providing relevant UE information to other processes. Communicates UE information to and from the CU-UP, DU, and Core.
- **Measurement Manager:** Manages cell measurement within the gNB.
- **Mobility Manager:** Manages UE mobility in the CU-CP.

## Interfaces

| Interface | Connects to |
|-----------|-------------|
| E2 | Near-RT RIC |
| E1 | CU-UP |
| F1-c | DU (control plane) |
| N2 | AMF |
