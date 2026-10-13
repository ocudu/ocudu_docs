---
description: "How to take an O-RAN split 7.2 radio unit that has never been used with OCUDU from first contact to a listed, documented integration."
---

# Integrating a new radio unit

:::note
This page is a draft. Sections marked **TODO** still need content.
:::

## Overview

The other pages in this section describe radio units that have already been integrated with OCUDU. This page is for the step before that: you have an O-RAN split 7.2 radio unit (O-RU) that nobody has run with OCUDU yet, and you want to get it working and added to the [list of radio units](index.md#radio-units).

It applies whether you are an RU vendor qualifying your own product, an operator or lab evaluating a unit, or a community member with an RU on the bench. It is vendor-neutral: it describes what to check and in which order, not how to configure a specific device.

OCUDU's Open Fronthaul (OFH) library implements the O-RAN WG4 specifications without vendor-specific code paths. A new RU is therefore an interop exercise, not a porting effort. In most cases the work is matching configuration on both sides. Where the RU and OCUDU read the specification differently, the fix is a configuration option, an RU firmware change, or an OCUDU change, in that order of preference. See [When the RU does not interoperate](#when-the-ru-does-not-interoperate).

If this is your first O-RAN RU of any kind, start with the [Connecting an O-RAN 7.2 radio unit](../../tutorials/oranru/index.md) tutorial. It covers the NIC, switch, PTP and DPDK setup that this guide assumes.

## The integration path

An integration moves through a series of milestones. Each one maps onto a support status in the [RU tables](index.md#support-status), so you can report the RU as soon as you reach the first one and update the entry as you get further.

| Step | Milestone | Status you can report |
| --- | --- | --- |
| 1. [Prepare](#1-prepare) | RU details and lab setup collected | Not listed yet |
| 2. [S-plane](#2-s-plane) | DU and RU locked to the same time reference | Not listed yet |
| 3. [Downlink](#3-downlink) | RU transmits the cell, SSB visible | CUS 🟠 |
| 4. [Uplink and attach](#4-uplink-and-attach) | PRACH detected, COTS UE attaches and passes traffic | CUS 🟡 |
| 5. [Features and RF](#5-features-and-rf) | Full rate reached, RF calibrated with measurement equipment | CUS 🟢 |
| 6. [M-plane](#6-m-plane) | RU configured and monitored over NETCONF | M 🟡 or 🟢 |
| 7. [Contribute](#7-contribute-the-result) | Table row and guide merged | Listed |

Steps 2 to 5 have to be done in order, since each one depends on the previous. The M-plane is independent and is usually done last; many lab integrations never get to it, and a CUS-only integration is a complete result.

You do not have to finish the path before contributing. A table row with 🟠 and a note on what is missing is useful to the next person who picks up the same RU.

## 1. Prepare

### Collect the RU details

Get the following from the RU vendor or the RU documentation before setting anything up. Most failed integrations come from one of these values being wrong or missing, and most of them also end up in the final report.

| Item | Why it matters |
| --- | --- |
| RU model and firmware version, with release notes | Timing parameters and supported features change between firmware versions. The firmware version goes into the table. |
| O-RAN category (A or B) and split option (7.2x) | Category B RUs expect precoding/beamforming information OCUDU does not send. |
| Supported bands, bandwidths, numerology and TDD patterns | Many RUs only accept a subset of TDD patterns. |
| eAxC ID layout (DU port, band sector, CC, RU port bit widths) | Must match `dl_port_id`, `ul_port_id` and `prach_port_id`. |
| Delay profile: `T2a_min/max`, `Ta3_min/max` or the equivalent `T1a`/`Ta4` windows | Needed to derive the OCUDU transmit and receive windows. |
| Supported compression methods and bit widths, static or dynamic compression header | Must match `compr_method_*`, `compr_bitwidth_*` and `enable_*_static_compr_hdr`. |
| PRACH handling: C-plane type 3 support, FFT size, start-symbol behaviour | Most early PRACH failures come from here. |
| Maximum output power per port and the IQ reference level | Needed for RF calibration. |
| S-plane configuration: LLS-C1/C2/C3, PTP profile, domain number, transport | Must match the grandmaster and switch. |
| M-plane support: NETCONF version, YANG models, call-home or static IP | Decides whether the RU needs a config file or an M-plane client to start at all. Some RUs can only be configured over the M-plane. |

### Check the list first

Search the [RU tables](index.md#radio-units) and the [community discussions](https://gitlab.com/ocudu/community/discussions) for the same RU or a close relative from the same vendor. An RU that shares a platform with a listed one often takes the same timing windows and PRACH settings, and the existing guide is a better starting point than the defaults.

### Set up the lab

**TODO**: add a reference diagram of the lab setup (DU, switch, grandmaster, RU, UE, measurement equipment).

A conducted setup, with the RU connected to the UE and measurement equipment through cables and attenuators, makes every later step easier to debug and is required for a 🟢 result.

:::warning
Never connect RU TX ports directly to a UE or measurement equipment without enough attenuation. Check the maximum input power of every device in the chain.
:::

### Keep a record as you go

The final contribution is much easier to write if you collect these from the start:

- The OCUDU version or commit and the RU firmware version for every test.
- The DU YAML and the RU configuration (file, CLI dump or M-plane configuration) for every configuration that worked.
- DU console output and logs, including the [OFH metrics](../../user_manual/outputs/outputs.md#ofh-metrics), for each milestone.
- What did not work, and what you changed to get past it.

## 2. S-plane

The S-plane provides frequency and phase synchronization between the DU and the RU. OCUDU does not implement PTP itself; the host is synchronized using a third-party stack such as [linuxptp](https://linuxptp.nwtime.org/). See [Switches and timing](../switches_and_timing/index.md) for devices that have been used as grandmaster or boundary clock.

### Choose the synchronization topology

| Topology | Description | Notes |
| --- | --- | --- |
| LLS-C1 | DU is the PTP master for the RU over a direct link | **TODO**: document if tested |
| LLS-C2 | One or more PTP-aware switches between DU and RU | Common in lab setups |
| LLS-C3 | Grandmaster in the fronthaul network, DU and RU are both slaves | Most common with OCUDU |

Confirm the PTP profile (typically ITU-T G.8275.1, L2 multicast) and the domain number match on the grandmaster, switch, DU and RU.

### Verify the DU clock

1. Start `ptp4l` on the fronthaul NIC and `phc2sys` to steer the system clock. The tutorial provides a sample [`srs-linuxptp.cfg`](../../tutorials/oranru/assets/srs-linuxptp.cfg).
2. Confirm `ptp4l` reports the port in `SLAVE` state and the master offset stays within **TODO: agreed range, e.g. ±100 ns**.
3. Confirm `phc2sys` reports an offset within **TODO: range**.

### Verify the RU clock

1. Check the RU's own sync status (vendor CLI, web interface, or the `o-ran-sync` YANG model over the M-plane).
2. The RU should report a locked state, for example `LOCKED` in `o-ran-sync:sync/sync-status`.
3. Record the time it takes the RU to lock after boot. Some RUs will not start transmitting until locked.

### Done when

- [ ] DU and RU are both locked to the same grandmaster.
- [ ] Offsets are stable over **TODO: duration, e.g. one hour**.
- [ ] There are no holdover or free-run events during the following steps.

## 3. Downlink

The C-plane and U-plane are implemented in the OFH library and configured through the `ru_ofh` section of the DU configuration. See the [configuration reference](../../user_manual/config_reference/config_reference.mdx) for all parameters.

Start from the sample configuration of the closest listed RU, or from the tutorial if there is none, and change one thing at a time.

### Transport

Match these on both sides before starting the DU:

- `ru_mac_addr` and `du_mac_addr`.
- `vlan_tag_cp` and `vlan_tag_up`, and optionally `vlan_pcp_cp` and `vlan_pcp_up`.
- `mtu`: jumbo frames (9000) are needed for wide bandwidths with multiple antennas. Check the NIC and every switch port on the path.
- eAxC IDs: `dl_port_id`, `ul_port_id` and `prach_port_id`.

### Timing windows

Derive the OCUDU windows from the RU delay profile:

| OCUDU parameter | Meaning | Derived from |
| --- | --- | --- |
| `t1a_min_cp_dl`, `t1a_max_cp_dl` | DL C-plane transmit window at the DU | RU `T2a_min_cp_dl`, `T2a_max_cp_dl` plus transport delay |
| `t1a_min_cp_ul`, `t1a_max_cp_ul` | UL C-plane transmit window at the DU | RU `T2a_min_cp_ul`, `T2a_max_cp_ul` plus transport delay |
| `t1a_min_up`, `t1a_max_up` | DL U-plane transmit window at the DU | RU `T2a_min_up`, `T2a_max_up` plus transport delay |
| `ta4_min`, `ta4_max` | UL U-plane receive window at the DU | RU `Ta3_min`, `Ta3_max` plus transport delay |

**TODO**: add a worked example with a timing diagram.

### Bring up the cell

1. Start the DU with a single cell in the simplest configuration the RU supports, for example SISO and the RU's default TDD pattern.
2. Check the RU counters for on-time C-plane and U-plane packets. Early or late packets at the RU point to the `t1a_*` windows. See [RU late or early packets](../../user_manual/troubleshooting/troubleshooting.md#ru-late-or-early-packets) and [OFH packet drops](../../user_manual/troubleshooting/troubleshooting.md#ofh-packet-drops).
3. Confirm the SSB is visible on a spectrum analyzer or a UE scanner at the expected frequency and PCI.

### Done when

- [ ] The RU reports no sustained early or late packets.
- [ ] The cell is visible at the expected frequency and PCI.

At this point the RU can be reported as CUS 🟠.

## 4. Uplink and attach

1. **UL U-plane.** Check the DU [OFH metrics](../../user_manual/outputs/outputs.md#ofh-metrics): `received_packets.late` and `rx_window_stats.nof_missed_uplink_symbols` should stay at zero. If not, adjust `ta4_*`.
2. **PRACH.** Trigger a UE attach and confirm PRACH detection in the DU log. If PRACH packets arrive but are dropped, check `is_prach_cp_enabled`, `cplane_prach_fft_len`, `ignore_prach_start_symbol` and `prach_port_id`.
3. **Attach and traffic.** Attach a COTS UE, then run DL and UL iperf in SISO, then with two and four DL MIMO layers if the RU supports them. See [UE attach failure](../../user_manual/troubleshooting/troubleshooting.md#ue-attach-failure) if the UE sees the cell but does not attach.

### Done when

- [ ] No sustained early or late packets on either side over **TODO: duration**.
- [ ] A COTS UE attaches and detaches reliably, repeated **TODO: N** times.
- [ ] DL and UL traffic flows.

At this point the RU can be reported as CUS 🟡. Note any restriction, such as an unsupported TDD pattern or a rate below the expected peak, in the report.

## 5. Features and RF

This step turns a working integration into a characterised one. It is what separates 🟡 from 🟢, and it is what makes the guide useful to someone choosing an RU.

### Features

Cover the configurations the RU supports and record the result for each:

| Feature | Parameters | Tested values |
| --- | --- | --- |
| Duplex and TDD pattern | `cell_cfg.tdd_ul_dl_cfg` | **TODO** |
| Bandwidth | `cell_cfg.channel_bandwidth_MHz`, `ru_bandwidth_MHz` | **TODO** |
| Numerology | `cell_cfg.common_scs` | **TODO** |
| Compression | `compr_method_*`, `compr_bitwidth_*` | **TODO** |
| Static compression header | `enable_ul_static_compr_hdr`, `enable_dl_static_compr_hdr` | **TODO** |
| PRACH format | `cell_cfg.prach.prach_config_index` | **TODO** |
| MIMO layers / antenna ports | `cell_cfg.nof_antennas_dl`, `cell_cfg.nof_antennas_ul` | **TODO** |
| Multiple cells or carriers | `cells` list | **TODO** |

### Output power calibration

1. Configure the RU for its maximum rated output power per port.
2. Set `ru_reference_level_dBFS` (or `iq_scaling`) and `subcarrier_rms_backoff_dB` so that a fully loaded carrier reaches the rated power without DPD saturation. See [RU power and DPD saturation](../../user_manual/troubleshooting/troubleshooting.md#ru-power-and-dpd-saturation).
3. Measure channel power per port with a spectrum analyzer and record the offset from the rated power.
4. Set `cell_cfg.ssb.ssb_block_power_dbm` to the measured SSB EPRE so that UE path loss estimates are correct.

### Transmitter quality

Measure per port, at full load, with the modulation used in the throughput tests:

| Measurement | Target | Measured |
| --- | --- | --- |
| Channel power | Rated power ±**TODO** dB | |
| EVM (256QAM) | < 3.5 % (3GPP TS 38.104) | |
| ACLR | **TODO** per TS 38.104 | |
| Frequency error | < ±0.05 ppm | |
| Occupied bandwidth | Within channel | |
| TDD on/off transient | **TODO** | |

### Receiver

| Measurement | Method | Measured |
| --- | --- | --- |
| UL SNR at given input level | DU PUSCH metrics | |
| Reference sensitivity | **TODO**: signal generator or UE with calibrated attenuation | |
| PRACH detection | Detection rate at low UL input level | |

### Throughput

Record the achieved throughput against the theoretical peak for the configuration:

| Configuration | DL expected | DL measured | UL expected | UL measured |
| --- | --- | --- | --- | --- |
| **TODO**: e.g. TDD 100 MHz, SISO | | | | |
| **TODO**: e.g. TDD 100 MHz, 2 layers | | | | |
| **TODO**: e.g. TDD 100 MHz, 4 layers | | | | |

**TODO**: optionally, over-the-air tests and long-duration stability runs.

### Done when

- [ ] Full DL and UL rate reached for the tested configurations.
- [ ] Output power calibrated and transmitter quality measured with RF measurement equipment.

At this point the RU can be reported as CUS 🟢.

## 6. M-plane

The M-plane is the NETCONF/YANG management interface defined in O-RAN WG4. In OCUDU, M-plane support is developed in the [O1 Adapter repo](https://gitlab.com/ocudu/ocudu_elements/ocudu_oran_apps/ocudu_o1_adapter). If you skip the M-plane and configure the RU statically, record the M-plane status as untested.

If the RU can only be configured over the M-plane, the start-up and CM parts of this step have to be done before step 3.

### Start-up

1. **Transport.** Confirm how the RU gets its M-plane IP address (DHCP, static) and how it finds the NETCONF client (DHCP option 43, static configuration).
2. **Call home.** Check the RU initiates a NETCONF call home to the client, or that the client can connect to the RU directly.
3. **Session.** Establish the SSH or TLS session and retrieve the RU capabilities. Record the list of supported YANG modules and their revisions.

### Configuration management (CM)

Configure the RU over the M-plane instead of the vendor config file:

- `o-ran-uplane-conf`: TX/RX array carriers, frequency, bandwidth, gain, eAxC mapping.
- `o-ran-processing-element`: transport addresses and VLANs.
- `o-ran-delay-management`: read the delay profile and set the windows.
- `o-ran-module-cap`, `o-ran-compression-factors`: check the reported capabilities against the CU-plane configuration.

**TODO**: list the exact YANG module revisions tested, and add a sample carrier configuration.

### Fault management (FM)

- Subscribe to `o-ran-fm` alarm notifications.
- Trigger at least one alarm, for example by disconnecting the sync source, and confirm it is reported and cleared.

### Performance management (PM)

- Configure `o-ran-performance-management` measurement objects (for example RX window counters and transceiver statistics).
- Confirm the RU reports them at the configured interval.

### Software and lifecycle management

**TODO**: software download and activation, reset, and supervision (`o-ran-supervision` watchdog).

### Done when

- [ ] CM: the RU carries traffic when configured only over the M-plane. Report M 🟡.
- [ ] FM and PM: alarms are raised and cleared, and counters are reported and consistent with the DU OFH metrics. Report M 🟢.

## When the RU does not interoperate

Sooner or later most new RUs hit a point where the configuration on both sides looks right and it still does not work. Work through the options in this order:

1. **Configuration.** Recheck the values from [Collect the RU details](#collect-the-ru-details) against the RU's actual behaviour, not its datasheet. The OFH library has several options that exist only to accommodate differences between RUs, for example `ignore_prach_start_symbol`, `cplane_prach_fft_len` and the static compression header flags. Check the [configuration reference](../../user_manual/config_reference/config_reference.mdx) for others.
2. **RU firmware.** If the RU deviates from the O-RAN specification, raise it with the vendor. Record the firmware version that works, and the one that does not, in the report.
3. **OCUDU.** If OCUDU deviates from the specification, or lacks a feature the RU needs, open an issue on the [issue tracker](https://gitlab.com/ocudu/ocudu/-/issues) with the RU model, firmware, DU configuration and logs. Merge requests are welcome; the OFH library is meant to stay vendor-neutral, so a change should be framed as a specification feature or a generic configuration option, not as a code path for one RU.

If you are not sure which of the three it is, ask in the [community discussions](https://gitlab.com/ocudu/community/discussions) first.

## 7. Contribute the result

An integration only extends the list of supported RUs once it is recorded. Contributions are merge requests against the [documentation repository](https://gitlab.com/ocudu/ocudu_docs); [Report an integration](../report_an_integration.md) has the report template and the submission steps.

### What to contribute

| Contribution | When | Where |
| --- | --- | --- |
| Table row | As soon as you reach 🟠. Update it at each later milestone. | `docs/integrations/radio_units/index.md` |
| RU guide | Once you have a repeatable working configuration, usually at 🟡. | A new page beside this one, see [Adding a new integration guide](../../dev_guide/contributing_guide/contributing_docs.md#adding-a-new-integration-guide) |
| Configuration files | With the guide: the DU YAML and the RU configuration for each tested setup. | The `assets/` directory beside the guide |
| Sample DU configuration | Optionally, for an RU expected to be widely used. | The `configs/` directory of the [OCUDU repository](https://gitlab.com/ocudu/ocudu), named like the existing `gnb_ru_*.yml` files |
| Issues and fixes | Anything you found under [When the RU does not interoperate](#when-the-ru-does-not-interoperate). | The [OCUDU issue tracker](https://gitlab.com/ocudu/ocudu/-/issues) |

### What a guide should contain

Use the [Benetel guide](benetel.md) as a model. At a minimum, a guide for a new RU should give:

- The RU model, firmware version and OCUDU version that were tested.
- The DU `ru_ofh` and `cell_cfg` excerpt, with the values that differ from the defaults explained.
- The RU-side settings, or a link to the RU configuration file in `assets/`.
- The S-plane topology used.
- The tested configurations from [step 5](#features), and any known restrictions.
- The measured values from [step 5](#5-features-and-rf), if RF calibration was done.

### Keep it current

An RU entry is a snapshot of one firmware version against one OCUDU version. When either changes, retest at least the attach and throughput steps and update the firmware column, the guide and the configuration files. A result that has not been rechecked for several OCUDU releases is still useful, but say which release it was.
