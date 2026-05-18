---
description: "Implementation of the DU-low (Distributed Unit - Low) in OCUDU, including components and interfaces."
displayed_sidebar: devSidebar
---

# DU-low

<img src={require('./assets/du_low.png').default} alt="DU-low architecture" style={{maxWidth: '820px', width: '100%', display: 'block', margin: '2rem auto'}} />

The DU-low (Distributed Unit - Low) implements the Upper PHY layer of the protocol stack. It performs channel coding and modulation for downlink transmissions, and channel estimation, equalization, and decoding for uplink receptions. The DU-low communicates with the DU-high via the FAPI interface and with the Radio Unit via the Open Fronthaul (OFH) interface, where lower PHY processing and RF functions are carried out. This architecture applies to O-RAN Split 7.2 deployments.

## Components

- **Upper PHY:** Performs channel coding, modulation, and resource mapping for downlink, and channel estimation, equalization, and decoding for uplink.

## Interfaces

| Interface | Connects to |
|-----------|-------------|
| FAPI | DU-high |
| OFH | Radio Unit (lower PHY) |
