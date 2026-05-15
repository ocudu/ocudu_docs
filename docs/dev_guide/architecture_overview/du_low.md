---
description: "Implementation of the DU-low (Distributed Unit - Low) in OCUDU, including components and interfaces."
displayed_sidebar: devSidebar
---

# DU-low

<img src={require('./assets/du_low.png').default} alt="DU-low architecture" style={{maxWidth: '820px', width: '100%', display: 'block', margin: '2rem auto'}} />

The DU-low (Distributed Unit - Low) is responsible for handling both uplink and downlink traffic, specifically the Upper PHY processing of these signals. The DU-low communicates directly with the DU-high via the FAPI interface and with the Radio Unit via the Open FrontHaul (OFH) interface. Lower PHY processing is carried out in the Radio Unit. This architecture applies to O-RAN Split 7.2 deployments.

## Components

- **Upper PHY:** Handles the processing of uplink and downlink signals to and from the Radio Unit.

## Interfaces

| Interface | Connects to |
|-----------|-------------|
| FAPI | DU-high |
| OFH | Radio Unit (lower PHY) |
