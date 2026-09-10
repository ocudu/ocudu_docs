---
description: "Which fronthaul switches and PTP grandmaster clocks have been used with OCUDU, and what was recorded for each."
displayed_sidebar: userDocsSidebar
---

# Switches and Timing

Split 7.2 requires tight timing synchronisation between the DU and the RU. These are the fronthaul switches and PTP grandmaster clocks that have been used with OCUDU.

## Tested devices

| Device | Role | Notes |
| --- | --- | --- |
| [Fibrolan Falcon-RX/812/G](falcon.md) | O-RAN switch and PTP grandmaster | Guide covers SyncCenter, PTP clock and VLAN configuration |
| [Meinberg MicroSync HR](meinberg.md) | PTP grandmaster | Verified with MikroTik switches acting as boundary clocks |
| [MikroTik CRS326-24S+2Q+](mikrotik.md) | PTP-capable switch | |
| [MikroTik CRS510-8XS-2XQ-IN](mikrotik.md) | PTP-capable switch | |
| [Netgear M4300-8X8F](netgear.md) | PTP-capable switch | |

**What was tested.** Every device listed here was tested in-house with OCUDU. The [O-RAN WG4 synchronisation topology](../../tutorials/oranru/index.md#synchronization) determines which role a given device needs to play; the tutorials use LLS-C3, with the fronthaul switch acting as PTP grandmaster.

**Where to look.** A device name that is a link has a guide, and that guide is the authoritative record for it. The guides vary in depth: the Falcon-RX guide walks through the full configuration, while the others record the tested models and refer to the vendor documentation for the rest.

:::info
**Any device with announced PTP support is a candidate.** OCUDU relies on standard PTP for synchronisation and does not talk to switches or clocks through any vendor-specific interface, so this table records what has been tested, not what is supported.

To use a device that is not listed, start from the synchronisation section of the [Connecting an O-RAN 7.2 radio unit](../../tutorials/oranru/index.md#synchronization) tutorial. Then [report the result](../report_an_integration.md). An incomplete guide is better than none, and a device that did not work is still worth recording.
:::

## Report an integration

See [Report an integration](../report_an_integration.md) for the details a report should carry and how to submit it. Extensions, updates and improvements to existing guides are also welcome and necessary contributions.
