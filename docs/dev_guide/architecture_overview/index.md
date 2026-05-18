---
description: An overview of how the O-RAN gNB architecture is implemented in the OCUDU codebase.
displayed_sidebar: devSidebar
---

# Architecture Overview

OCUDU provides software implementations of the O-RAN network functions that make up a gNB: the CU-CP, CU-UP, and DU. These are distinct, independently deployable components, each responsible for a specific part of the radio access protocol stack. They can be deployed together as a single gNB or distributed across separate hosts, and each can be integrated with third-party O-RAN compliant components at any of the standard interfaces.

For a conceptual introduction to the O-RAN gNB architecture, see the [Knowledge Base](/knowledge_base/gnb_components/).

<img src={require('./assets/ocudu_arch.png').default} alt="OCUDU component architecture" style={{maxWidth: '780px', width: '100%', display: 'block', margin: '2rem auto'}} />

## Components

- [CU-CP](./cu_cp): Central Unit - Control Plane. Implements RRC and the control plane aspect of PDCP. Manages RRC connections with UEs, handles NGAP signaling with the 5G Core, and coordinates bearer setup with the CU-UP.
- [CU-UP](./cu_up): Central Unit - User Plane. Implements user plane PDCP and SDAP. Handles header compression, ciphering, and QoS flow mapping for user data, routing traffic between the 5G Core and the DU.
- [DU-high](./du_high): Distributed Unit - High. Implements the MAC and RLC layers. MAC handles radio resource scheduling and HARQ; RLC provides segmentation and reliable in-order delivery.
- [DU-low](./du_low): Distributed Unit - Low. Implements the Upper PHY layer, handling channel coding, modulation, and resource mapping at the interface between the DU-high and the Radio Unit.
