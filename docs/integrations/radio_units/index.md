---
description: "Which radio units have been integrated with OCUDU, what was recorded for each, and how to report a new one."
displayed_sidebar: userDocsSidebar
---

# O-RAN Radio Units

Radio units, test equipment, and reference platforms that have been integrated with OCUDU over the split 7.2 Open Fronthaul interface, and what was recorded for each.

## Support status

The tables on this page score support separately for each Open Fronthaul plane: **C** (Control), **U** (User), **S** (Synchronization), and **M** (Management). C, U, and S together make up the **CUS**-plane interface.

### CUS-plane support status

In OCUDU, the C-plane and U-plane are implemented directly in the OFH layer of the main repo. The S-plane is provided by a third-party stack such as linuxptp.

| | Status | Meaning |
| --- | --- | --- |
| 🟢 | Very good | Confirmed working without issues for all tested configurations. Achieves full rate for DL and UL in conducted mode and/or under ideal conditions over the air. RF settings and output power have been calibrated with RF measurement equipment. |
| 🟡 | Good | Confirmed to attach a COTS UE, with some restriction on performance, e.g. not achieving the maximum rate or not RF calibrated. It could also be that the RU requires a specific config or doesn't support a tested feature, e.g. TDD pattern. |
| 🟠 | Partly supported | Confirmed downlink transmission. Uplink, for data and/or PRACH, is still missing. |
| ⚪ | Unknown | Not tested. |

### M-plane support status

M-plane is the separate NETCONF-based management interface, and not every device or integration uses it.

An RU integration typically starts with CUS-plane interop testing, using a static RU configuration set via a config file or web interface depending on the vendor. M-plane integration usually comes later, and matters most for production deployments rather than lab bring-up.

The OCUDU community is actively building out M-plane support in the [O1 Adapter repo](https://gitlab.com/ocudu/ocudu_elements/ocudu_oran_apps/ocudu_o1_adapter). This page does not attempt to track feature-level M-plane status per device; that detail belongs in a discussion or issue, not a table cell. If you are working on M-plane for a device listed here, or want to see one added, we would like to hear from you: open a discussion or issue in the O1 Adapter repo, or [report the result](../report_an_integration.md) here.

| | Status | Meaning |
| --- | --- | --- |
| 🟢 | Very good | Configuration management (CM), fault management (FM) and performance management (PM) verified. |
| 🟡 | Good | At least configuration management (CM) has been tested. |
| ⚪ | Unknown | Not tested. |

## Radio units

An RU is a radio unit built for indoor or outdoor operation with an internal or external antenna.

| Device | Placement | CUS | M | Verified by | Notes |
| --- | --- | --- | --- | --- | --- |
| [Benetel RAN550](benetel.md) | Indoor | 🟢 | ⚪ | SRS |  |
| [Benetel RAN650](benetel.md) | Outdoor | 🟢 | ⚪ | SRS |  |
| CGI SC-703 (Airspan AV2700) | Indoor | 🟡 | 🟡 | SRS | No manual config, M-plane only, 3.6 to 3.8 GHz, FW: ST70R01B003 |
| Comba RRU-3510F28A | Outdoor | 🟡 | ⚪ | Community | FW: CT.A06.01.002.06.07.10 |
| CommScope ERA DAS | n/a | 🟠 | ⚪ | Vendor | DL working, PRACH detection failed. Likely LTE UL frequency shift. |
| Eridan ER2035 Gen1 40 MHz | Outdoor | 🟡 | ⚪ | Vendor | |
| [Foxconn RPQN-4800E](foxconn.md) | Indoor | 🟢 | ⚪ | SRS |  |
| [Foxconn RPQN-7801I](foxconn.md) | Indoor | 🟢 | ⚪ | SRS |  |
| Fujitsu/1Finity Tri-band FDD | Outdoor | 🟡 | 🟡 | Community |  |
| Fujitsu/1Finity TDD | Outdoor | 🟡 | 🟡 | Community |  |
| [LITEON FlexFi FF-RFI078I4](liteon.md) | Indoor | 🟡 | ⚪ | SRS | |
| Lions RANathon RS8602 | Outdoor | 🟡 | ⚪ | SRS | FW: 1.0.4.016 |
| MTI G21RRH-46-01B FDD | Outdoor | 🟡 | 🟡 | SRS | FW: 12.20.01 |
| [Pegatron PR1450-78I](pegatron.md) | Indoor | 🟢 | ⚪ | Community |  |
| Solid Band7 FDD DAS | n/a | 🟡 | ⚪ | Community |  |
| [VVDN n78 indoor RU](vvdn.md) | Indoor | 🟡 | ⚪ | SRS | |

**What was tested.** Typical testing covers Open Fronthaul integration for CUS-plane, a UE attach in SISO mode at 100 MHz, then two and four downlink MIMO layers. Known gaps and restrictions are in the individual RU guide or notes column.

**Where the result came from.** `Verified by` is `SRS` for a result produced in the SRS lab, `Vendor` where the device maker verified its own unit, and `Community` for a result reported by another party. A device name that is a link has a guide, and that guide is the authoritative record for the device; where a guide and this table disagree, the guide is correct and the table needs fixing.

:::info
**Any conformant radio unit is a candidate.** OCUDU's Open Fronthaul library implements the O-RAN WG4 CUS-plane and M-plane specifications with no vendor-specific code paths, so this table records what has been reported, not what is supported.

Don't see your RU here? Start from the [Connecting an O-RAN 7.2 radio unit](../../tutorials/oranru/index.md) tutorial, then [report the result](../report_an_integration.md), whatever the outcome. An incomplete guide is better than none, and a device that did not work is still worth recording.
:::

## Test equipment

Test equipment (TE) is test and measurement equipment that presents an O-RAN CUS-plane interface. It is used to exercise the fronthaul without a radio.

| Device | CUS | M | Verified by | Notes |
| --- | --- | --- | --- | --- |
| Amarisoft | 🟢 | ⚪ | SRS | Used for CI testing in `lteue` |
| Keysight RUsim | 🟢 | ⚪ | Vendor | FDD and TDD verified |
| Viavi TMlite RUemu | 🟢 | ⚪ | SRS | Mostly tested with TDD |

## Reference platforms

A reference platform (REF) implements an RU for development and evaluation purposes but is not a shipping RU product.

| Device | Firmware | CUS | M | Verified by | Notes |
| --- | --- | --- | --- | --- | --- |
| AMD ZCU670 | v2.1 | 🟠 | ⚪ | SRS | DL only, PRACH FFT size fixed |
| [Picocom PC802SCB](picocom.md) | v3.0.0 | 🟡 | ⚪ | SRS | Up to 100 MHz 4T4R, wired, no power amplifier |
| Picocom RDB X2 (PC805) | RU 7.0.0 | 🟡 | ⚪ | Community | ORANIC high-PHY, not covered by the PC802SCB guide |

## Report an integration

See [Report an integration](../report_an_integration.md) for the details a report should carry and how to submit it.

The guides linked above are written by whoever did the integration, so they vary in depth. A short guide is not a sign of a worse integration; it means nobody has written the longer one yet. Extensions, updates and improvements to existing guides are also welcome and necessary contributions.
