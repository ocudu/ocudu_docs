---
description: An overview of how the O-RAN gNB architecture is implemented in the OCUDU codebase.
displayed_sidebar: devSidebar
---

# Architecture Overview

OCUDU implements all components and interfaces of the O-RAN gNB stack in software. Each component is fully performant, configurable, and compliant with the O-RAN standard. Third-party RICs, RUs, and gNB components can also be integrated with OCUDU components.

For a conceptual introduction to the O-RAN gNB architecture, see the [Knowledge Base](/knowledge_base/gnb_components/).

<img src={require('./assets/ocudu_arch.png').default} alt="OCUDU component architecture" style={{maxWidth: '780px', width: '100%', display: 'block', margin: '2rem auto'}} />

## Components

- [CU-CP](./cu_cp): Central Unit - Control Plane. Handles control plane messaging, including the control plane aspect of PDCP.
- [CU-UP](./cu_up): Central Unit - User Plane. Handles user plane messaging, including PDCP and SDAP.
- [DU-high](./du_high): Distributed Unit - High. Handles MAC and RLC processing for uplink and downlink traffic.
- [DU-low](./du_low): Distributed Unit - Low. Handles Upper PHY processing between the DU-high and the Radio Unit.
