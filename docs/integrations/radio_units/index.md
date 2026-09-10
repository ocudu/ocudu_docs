---
description: "Which radio units have been integrated with OCUDU, what was recorded for each, and how to report a new one."
displayed_sidebar: userDocsSidebar
---

# O-RAN Radio Units

Radio units, test equipment, and reference platforms that have been integrated with OCUDU over the split 7.2 Open Fronthaul interface, and what was recorded for each.

## Radio units

An RU is a radio unit built for indoor or outdoor operation with an internal or external antenna.

| Device | Placement | Firmware | Verified by | Notes |
| --- | --- | --- | --- | --- |
| [Benetel RAN550](benetel.md) | Indoor | v1.4.1-NM-25fa970 | SRS | 4x2 at 100 MHz only |
| [Benetel RAN650](benetel.md) | Outdoor | v1.4.0-NM-5561771 | SRS | 4x2 at 100 MHz only |
| CGI SC-703 (Airspan AV2700) | Indoor | ST70R01B003 | SRS | M-plane only, 3.6 to 3.8 GHz |
| Comba RRU-3510F28A | Outdoor | CT.A06.01.002.06.07.10 | Community | |
| CommScope ERA DAS | Both | Not recorded | Vendor | |
| Eridan ER2035 Gen1 40 MHz | Outdoor | Not recorded | Vendor | |
| [Foxconn RPQN-4800E](foxconn.md) | Indoor | v3_1_13q_551p1 | SRS | 20 to 100 MHz, SISO/2x2/4x4 |
| [Foxconn RPQN-7801I](foxconn.md) | Indoor | v3.1.15q.551v0706 | SRS | `RRH_DL_IQ_SCALING` at 2T2R only |
| Fujitsu Gen2 | Outdoor | Not recorded | Community | DL only, no FDD PRACH |
| [LITEON FlexFi FF-RFI078I4](liteon.md) | Indoor | 02.00.09+ | SRS | 2T1R, second Rx unexercised |
| Lions RANathon RS8602 | Outdoor | 1.0.4.016 | SRS | |
| MTI G21RRH-46-01B | Outdoor | 12.20.01 | SRS | OFH done, E2E pending |
| [Pegatron PR1450-78I](pegatron.md) | Indoor | v1.0.2.4p1 | SRS | 4x4 at 100 MHz, Metanoia design |
| [VVDN n78 indoor RU](vvdn.md) | Indoor | v3.0.5 | SRS | 100 MHz SISO only, partial guide |

**What was tested.** Typical testing covers Open Fronthaul integration, a UE attach in SISO mode at 100 MHz, then two and four downlink MIMO layers. Known gaps and restrictions are in the Notes column.

**Where the result came from.** `Verified by` is `SRS` for a result produced in the SRS lab, `Vendor` where the device maker verified its own unit, and `Community` for a result reported by another party. A device name that is a link has a guide, and that guide is the authoritative record for the device; where a guide and this table disagree, the guide is correct and the table needs fixing.

:::info
**Any conformant radio unit is a candidate.** OCUDU's Open Fronthaul library implements the O-RAN WG4 CUS-plane specification with no vendor-specific code paths, so this table records what has been reported, not what is supported.

To integrate a device that is not listed, start from the [Connecting an O-RAN 7.2 radio unit](../../tutorials/oranru/index.md) tutorial. Then [report the result](../report_an_integration.md). An incomplete guide is better than none, and a device that did not work is still worth recording.
:::

## Test equipment

Test equipment (TE) is test and measurement equipment that presents an O-RAN CUS-plane interface. It is used to exercise the fronthaul without a radio.

| Device | Verified by | Notes |
| --- | --- | --- |
| Keysight RUsim | SRS | FDD and TDD verified |
| Viavi TMlite | SRS | Full rate in emulation mode |

## Reference platforms

A reference platform (REF) implements an RU for development and evaluation purposes but is not a shipping RU product.

| Device | Firmware | Verified by | Notes |
| --- | --- | --- | --- |
| AMD ZCU670 | v2.1 | SRS | DL only, PRACH FFT size fixed |
| [Picocom PC802SCB](picocom.md) | v3.0.0 | SRS | Up to 100 MHz 4T4R, wired, no power amplifier |
| Picocom RDB X2 (PC805) | RU 7.0.0 | Community | ORANIC high-PHY, not covered by the PC802SCB guide |

## Report an integration

See [Report an integration](../report_an_integration.md) for the details a report should carry and how to submit it.

The guides linked above are written by whoever did the integration, so they vary in depth. A short guide is not a sign of a worse integration; it means nobody has written the longer one yet. Extensions, updates and improvements to existing guides are also welcome and necessary contributions.
