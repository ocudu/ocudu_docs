---
title: LIONS O-RU Integration Guide
sidebar_label: LIONS O-RU
description: "Connecting a LIONS Technology O-RAN radio unit to OCUDU over the split 7.2 Open Fronthaul interface."
---

import Tabs from '@theme/Tabs';
import TabItem from '@theme/TabItem';

# LIONS O-RU (4T4R / 8T8R)

:::warning
This document is intended to be used as a guide. Variances in firmware and software versions in local setups may require the sample configuration files provided to be changed. As a result please closely follow the specific users guides of your RU in conjunction with this guide.
:::

## Overview

This guide provides further details on connecting the OCUDU CU/DU to a LIONS Technology O-RU using the O-RAN 7.2 split. LIONS radio units feature two series: 4T4R Outdoor O-RU and 8T8R Outdoor O-RU. Three models with respective configurations are covered in this guide for 5 scenarios.

- **RANathon O-RU RS8682** — FR1 4T4R, 100 MHz, tested on band n48 (3.55 - 3.7 GHz).
- **RANathon O-RU RS8612** — FR1 4T4R, 100 MHz, tested on band n78 (3.3 - 3.8 GHz).
- **RANathon O-RU RS8777** — FR1 8T8R, 100 MHz, tested on band n77 (3.7 - 3.98 GHz).

### Tested firmware

| RU | Configuration | Firmware | Applied Scenario |
|---|---|---|---|
| RANathon O-RU RS8682 | 4T4R, single carrier | `1.0.5.021` | Scenario 1 & 3 |
| RANathon O-RU RS8777 | 8T8R, single carrier | `1.1.1.017` | Scenario 2 |
| RANathon O-RU RS8612 | 4T4R, single carrier | `1.0.5.021` | Scenario 3 |
| RANathon O-RU RS8777 | 8T8R as 2 × 4T4R, two carriers | `1.1.1.017` | Scenario 4 |

:::info
Please contact LIONS for up-to-date configuration and usage guidelines. Contact Lions Technology Inc. (sales@lions.technology) for more information.
:::

### Topology of Each Test Scenario

| Scenario | Topology | Cells | Antennas | RUs | Fronthaul ports | Status |
|---|---|---|---|---|---|---|
| 1 | Standard 4T4R, 1 cell × 1 RU | 1 | 4T4R | 1 | 1 | Verified |
| 2 | Standard 8T8R, 1 cell × 1 RU | 1 | 8T8R | 1 | 1 | Verified |
| 3 | Two cells, 4T4R × 2 RU (intra-gNB handover) — RS8612 + RS8682 | 2 independent | 4T4R | 2 | 2 | Verified |
| 4 | Two cells, 8T8R × 1 RU (2 × 4T4R) | 2 independent | 8T8R split as 2 × 4T4R | 1 | 2 | Verified |

### Sample configuration

Sample configuration files are provided in the `configs` folder of the OCUDU source files. The configurations described in this guide are **specific** to the firmware versions and topologies listed above.

---

## Common configuration

The values of ru_ofh parameters listed below are shared by every topology. Only the per-cell and eAxC settings change between them.

```yaml
ru_ofh:
  t1a_max_cp_dl: 425
  t1a_min_cp_dl: 140
  t1a_max_cp_ul: 425
  t1a_min_cp_ul: 140
  t1a_max_up: 405
  t1a_min_up: 120
  ta4_max: 420
  ta4_min: 20
  compr_method_dl: bfp
  compr_bitwidth_dl: 9
  compr_method_ul: bfp
  compr_bitwidth_ul: 9
  compr_method_prach: bfp
  compr_bitwidth_prach: 9
  enable_ul_static_compr_hdr: false
  enable_dl_static_compr_hdr: false
  ru_reference_level_dBFS: 0
  subcarrier_rms_backoff_dB: 11.6  
```
:::warning
The compression settings on the RU must match the DU exactly. A mismatch brings the cell up but leaves the affected plane undecodable.
:::

### Cell defaults

Numerology and random access are the same in every topology.

```yaml
cell_cfg:
  common_scs: 30
  prach:
    prach_config_index: 148     # format B4, FR1 TDD, 30 kHz
    prach_root_sequence_index: 0
    zero_correlation_zone: 14
    preamble_rx_target_pw: -72
```

### VLAN

The reference deployment runs the fronthaul **untagged** — no `vlan_tag_cp` or `vlan_tag_up` is set on the DU, and no VLAN is configured on the RU or the switch. If your deployment requires tagging, add both fields to the DU `cells` entry and configure the matching VLAN ID on the RU.

### PTP synchronisation

The RU must have PTP locked before the DU is started.

---

<Tabs>
<TabItem value="scenario-1" label="Scenario 1 Standard 4T4R, One cell on One RU" default>

The baseline topology: a single 100 MHz TDD cell, 4×4 MIMO, on a **RANathon O-RU RS8682**. This radio supports frequency range 3.55 - 3.7GHz and normally is configured as n48. But in this test scenario, this radio is configured to n78 as 3.55 - 3.7GHz is also in the n78 frequency range.

### CU/DU

Only the values that differ from **Common configuration** are shown below.

```yaml
cell_cfg:
  - pci: 1
    sector_id: 100
    dl_arfcn: 640092          # 3601.38 MHz, band n78
    band: 78
    channel_bandwidth_MHz: 100
    nof_antennas_dl: 4
    nof_antennas_ul: 4
    ssb:
      ssb_block_power_dbm: 2

ru_ofh:
  cells:
    - network_interface: "0000:18:01.0"
      ru_mac_addr: c8:4d:34:f0:00:20        # RS8682
      du_mac_addr: 00:11:22:33:00:00
      prach_port_id: [4, 5, 6, 7]
      dl_port_id: [0, 1, 2, 3]
      ul_port_id: [0, 1, 2, 3]

hal:
  eal_args: "-l 1 -a 0000:18:01.0 --iova-mode=pa"
```

To expand on the `cells` field:

- `network_interface` : PCI address of the DPDK-bound interface carrying OFH traffic. Lions deployments use DPDK with the PCI address rather than a kernel interface name.
- `ru_mac_addr` : MAC address of the Lions RU.
- `du_mac_addr` : MAC address of the DU interface used for OFH traffic.
- `prach_port_id` / `dl_port_id` / `ul_port_id` : eAxC port identities. For 4T4R, ports 0–3 carry PDSCH/PUSCH and 4–7 carry PRACH.

No VLAN tags are set in the reference configuration — the fronthaul link is untagged. If your switch requires tagging, add `vlan_tag_cp` and `vlan_tag_up` and configure the matching VLAN on the RU.

### RU

The RS8682 is configured either through its **web UI** or over the **M-Plane** interface. Apply the following so that it matches the DU:

- `DU MAC address` : must match `du_mac_addr`. The same address is used for C-Plane and U-Plane.
- `Compression` : BFP9 on downlink, uplink **and** PRACH, with dynamic (per-message) compression headers.
- `eAxC port mapping` : 0–3 for PDSCH/PUSCH, 4–7 for PRACH, on carrier CC0.
- `Centre frequency` : must match the DU `dl_arfcn`. ARFCN 640092 corresponds to 3601.38 MHz.
- `Channel bandwidth` : 100 MHz (273 PRB) at 30 kHz SCS.
- `PTP` : locked before the DU starts.

</TabItem>
<TabItem value="scenario-2" label="Scenario 2 Standard 8T8R, One Cell on One RU">

A single 100 MHz TDD cell on band n77, 8×8. Downlink runs at rank 4; uplink is currently rank 1.

### CU/DU

Only the values that differ from **Common configuration** are shown.

```yaml
cell_cfg:
  pci: 1
  dl_arfcn: 650076          # band n77
  band: 77
  channel_bandwidth_MHz: 100
  nof_antennas_dl: 8
  nof_antennas_ul: 8

ru_ofh:
  compr_method_prach: none   # uncompressed PRACH
  compr_bitwidth_prach: 16
  cells:
    - network_interface: "0000:18:01.0"
      ru_mac_addr: c8:4d:34:f0:20:10
      du_mac_addr: 00:11:22:33:00:00
      prach_port_id: [8, 9, 10, 11, 12, 13, 14, 15]
      dl_port_id: [0, 1, 2, 3, 4, 5, 6, 7]
      ul_port_id: [0, 1, 2, 3, 4, 5, 6, 7]
```

:::warning
**OCUDU source changes are required for 8T8R.** The 26.04 release assumes a maximum of four receive ports and will abort during PHY construction with eight.
:::

### RU

The RS8777 is configured through its **web UI** or over the **M-Plane** interface. Apply the following so that it matches the DU:

- `DU MAC address` : must match `du_mac_addr`. The same address is used for C-Plane and U-Plane.
- `eAxC port mapping` : 0–7 for PDSCH/PUSCH, 8–15 for PRACH.
- `Centre frequency` : ARFCN 650076, band n77.
- `Channel bandwidth` : 100 MHz (273 PRB) at 30 kHz SCS.
- `PTP` : locked before the DU starts.

</TabItem>
<TabItem value="scenario-3" label="Scenario 3 Two Cells, 4T4R on Two RUs for Intra-gNB Handover">

This test runs two independent 100 MHz cells, each on its own radio unit and its own fronthaul port. This is the deployment used for intra-gNB handover between the two cells. The two units are **different 4T4R models**, to span the frequency range listed below:

| Cell | PCI | `dl_arfcn` | Centre | Radio unit | Fronthaul | RU MAC |
|---|---|---|---|---|---|---|
| 1 | 1 | 623388 | 3350.82 MHz | RANathon O-RU RS8612 | `0000:18:01.0` | `c8:4d:34:f0:00:16` |
| 2 | 2 | 623388 | 3350.82 MHz | RANathon O-RU RS8682 | `0000:18:19.0` | `c8:4d:34:f0:00:20` |

Both units run the single-carrier firmware `1.0.5.021`.

:::info
**The RS8682** frequency range 3.55 - 3.7GHz and normally is configured as n48. But in this test scenario, this radio is configured to n78 as 3.55 - 3.7GHz is also in the n78 frequency range.
:::

### CU/DU

The ru_ofh and the shared cell defaults refer to **Common configuration**; only the per-cell and per-fronthaul values are shown below.
Each cell uses the standard single-carrier eAxC mapping on its own RU, so the port identities repeat — they are distinguished by the fronthaul interface and RU MAC, not by eAxC value:

```yaml
cell_cfg:
  - pci: 1
    sector_id: 100
    dl_arfcn: 623388
    band: 78
    channel_bandwidth_MHz: 100
    nof_antennas_dl: 4
    nof_antennas_ul: 4

  - pci: 2
    sector_id: 101
    dl_arfcn: 623388
    band: 78
    channel_bandwidth_MHz: 100
    nof_antennas_dl: 4
    nof_antennas_ul: 4
    ssb:
      ssb_block_power_dbm: 2


ru_ofh:
  cells:
    - network_interface: "0000:18:01.0"
      ru_mac_addr: c8:4d:34:f0:00:16  # RU1 RS8612
      du_mac_addr: 00:11:22:33:00:00
      prach_port_id: [4, 5, 6, 7]
      dl_port_id: [0, 1, 2, 3]
      ul_port_id: [0, 1, 2, 3]
    - network_interface: "0000:18:19.0"
      ru_mac_addr: c8:4d:34:f0:00:20  # RU2 RS8682
      du_mac_addr: 00:11:22:33:00:02
      prach_port_id: [4, 5, 6, 7]
      dl_port_id: [0, 1, 2, 3]
      ul_port_id: [0, 1, 2, 3]

hal:
  eal_args: "-l 1 -a 0000:18:01.0 -a 0000:18:19.0 --iova-mode=pa"
```
:::warning
Both fronthaul PCI addresses must be passed to DPDK with separate `-a` flags, and each cell needs its own `du_mac_addr`.
:::

### Handover configuration

Handover between the two cells is A3-event triggered and needs a `mobility` block under `cu_cp` with the neighbour relations shown on each cell above:

```yaml
cu_cp:
  mobility:
    trigger_handover_from_measurements: true
    cells:
      - nr_cell_id: 0x290064
        ncells:
          - nr_cell_id: 0x290065
            report_configs: [3]
      - nr_cell_id: 0x290065
        ncells:
          - nr_cell_id: 0x290064
            report_configs: [3]
    report_configs:
      - report_cfg_id: 3
        report_type: event_triggered
        event_triggered_report_type: a3
        meas_trigger_quantity: rsrp
        meas_trigger_quantity_offset_db: 3
        hysteresis_db: 0
        time_to_trigger_ms: 480
        report_interval_ms: 240
```

:::info
For an intra-frequency test the two cells must share `dl_arfcn` and differ only in `pci`, `nr_cell_id` and `sector_id`. OCUDU derives `dl_ssb_arfcn` from `dl_arfcn`, so matching `dl_arfcn` is what makes the two cells intra-frequency.
:::

### RU

Configure each RU either through its **web UI** or over the **M-Plane** interface. Apply the following so that it matches the corresponding DU:

- `DU MAC address` : must match the corresponding DU's `du_mac_addr`. The same address is used for C-Plane and U-Plane.
- `Compression` : BFP9 on downlink, uplink **and** PRACH, with dynamic (per-message) compression headers.
- `eAxC port mapping` : Both RUs use the standard eAxC mapping 0–3 for PDSCH/PUSCH, 4–7 for PRACH.
- `Centre frequency` : Set each RU's centre frequency to match its cell's `dl_arfcn`. Set the frequency to 3350.82 MHz (ARFCN 623388) on both RS8612 and RS8682, which is supported by both models.
- `Channel bandwidth` : 100 MHz (273 PRB) at 30 kHz SCS.
- `PTP` : Both RUs must hold locked before the DU starts and must be locked to the same grandmaster for handover to work.

</TabItem>
<TabItem value="scenario-4" label="Scenario 4 Two Cells, One 8T8R Configured as 2 x 4T4R">

The RS8777 can split its eight antennas into two independent 4T4R cells. Antennas 1–4 carry CC0 and antennas 5–8 carry CC1, each on its **own optical port**, so the single radio presents to the DU as two ordinary 4T4R cells rather than as one 8T8R cell.

| Cell | PCI | `dl_arfcn` | Centre | Band | Antennas | RU optical port | Fronthaul | RU MAC |
|---|---|---|---|---|---|---|---|---|
| 1 | 1 | 650000 | 3750 MHz | 77 | Ant 1–4 (CC0) | OPT1 | `0000:18:01.0` | `c8:4d:34:f0:20:20` |
| 2 | 2 | 656796 | 3851.94 MHz | 77 | Ant 5–8 (CC1) | OPT2 | `0000:18:11.0` | `c8:4d:34:f0:20:21` |

Both cells run 100 MHz at 30 kHz SCS on band **n77**. Each optical port is assigned its **own RU MAC address**, so the two fronthaul links are separated even though they lead to the same radio.

:::info
Cell 1 at 3750 MHz also falls inside n78 (3300 – 3800 MHz), so it can be signalled as **band 78** where a UE requires it — that is how the reference bring-up was run. Cell 2 has no such option: 3851.94 MHz is above the n78 ceiling and must be n77.
:::

:::info
**This topology doesn't need DU to support 8T8R feature.** Here the DU only builds two 4T4R cells — the boot banner reports `4T4R` for both — so stock port handling is sufficient. The split happens inside the radio.
:::

### eAxC plan

Both cells use the same standard mapping, and both are CC ID 0:

| Carrier | RU antennas | DL / UL ports | PRACH ports | CC ID |
|---|---|---|---|---|
| CC0 | Ant 1–4 | 0–3 | 4–7 | 0 |
| CC1 | Ant 5–8 | 0–3 | 4–7 | 0 |

:::info
The two sets of RU antenna numbers represent two separate 4T4R functions inside this RU. Therefore, the eAxC ports are identical on both cells.
:::

### CU/DU

Only the values that differ from **Common configuration** are shown below.

```yaml
cell_cfg:
  - pci: 1
    sector_id: 100
    dl_arfcn: 650000          # 3750 MHz
    band: 77                  # n78 is also valid here if required
    channel_bandwidth_MHz: 100
    nof_antennas_dl: 4
    nof_antennas_ul: 4
    ssb:
      ssb_block_power_dbm: -11
  - pci: 2
    sector_id: 101
    dl_arfcn: 656796          # 3851.94 MHz
    band: 77
    channel_bandwidth_MHz: 100
    nof_antennas_dl: 4
    nof_antennas_ul: 4
    ssb:
      ssb_block_power_dbm: -11

ru_ofh:
  compr_method_prach: none    # uncompressed PRACH
  compr_bitwidth_prach: 16
  cells:
    - network_interface: "0000:18:01.0"     # OPT1
      ru_mac_addr: c8:4d:34:f0:20:20        # RU port connects to this DU optical port1
      du_mac_addr: 00:11:22:33:00:00
      prach_port_id: [4, 5, 6, 7]
      dl_port_id: [0, 1, 2, 3]
      ul_port_id: [0, 1, 2, 3]
    - network_interface: "0000:18:11.0"     # OPT2
      ru_mac_addr: c8:4d:34:f0:20:21        # RU port connects to this DU optical port2
      du_mac_addr: 00:11:22:33:00:02
      prach_port_id: [4, 5, 6, 7]
      dl_port_id: [0, 1, 2, 3]
      ul_port_id: [0, 1, 2, 3]

hal:
  eal_args: "-l 1 -a 0000:18:01.0 -a 0000:18:11.0 --iova-mode=pa"
```

### RU

Configure the RS8777 through its **web UI** or over the **M-Plane** interface:

- `DU MAC address` : must match `du_mac_addr`. The same address is used for C-Plane and U-Plane.
- `Antenna configuration & eAxC port mapping` : assign Ant 1–4 to CC0 and Ant 5–8 to CC1 for uplink, downlink and PRACH. Set both `CCID0` and `CCID1` to `0`, and give each group RU port IDs 0–3 with PRACH port IDs 4–7.
- `Carrier Configuration on OPT1` : CC0 enabled, absolute frequency 3750 MHz, 30 kHz SCS, 100 MHz, source MAC `c8:4d:34:f0:20:20`, destination MAC `00:11:22:33:00:00`, VLAN 0, compression type **Dynamic**.
- `Carrier Configuration on OPT2` : CC1 enabled, absolute frequency 3851.94 MHz, 30 kHz SCS, 100 MHz, source MAC `c8:4d:34:f0:20:21`, destination MAC `00:11:22:33:00:02`, VLAN 0, compression type **Dynamic**.
- `Channel bandwidth` : 100 MHz (273 PRB) at 30 kHz SCS.
- `PTP` : locked before the DU starts.

</TabItem>
</Tabs>

## Initializing and connecting to the network

### Initializing the network

1. Power on the LIONS RU and confirm PTP lock.

   **PTP status**

   ```text
   netport status:    online
   2RU 1588 status:   locked
   Sys time setting:  yes
   CBRS support:      no
   RF status:         Active
   PA status:         Active
   CC0 status:        Active
   CC1 status:        Active
   -------------------------------------------------------------------
   sync-state:            locked
   ptp lock-state:        locked
   ptp state :            parent
   ptp clock-class :      248
   synce lock-state:      unlocked
   synce state     :      disabled
   synce quality-level:   0
   ```

2. Confirm the fronthaul interface is bound to DPDK and the PCI address in `network_interface` matches.
3. Start the CU/DU:

   ```bash
   # Section 1 - 4T4R, one cell
   sudo ./gnb -c gnb_ru_lions_RS8612_tdd_n78_100mhz_4x4.yml

   # Section 2 - 8T8R, one cell
   sudo ./gnb -c gnb_ru_lions_rs8777_tdd_n77_100mhz_8x8.yml

   # Section 3 - two cells on two RUs
   sudo ./gnb -c gnb_ru_lions_RS8612_tdd_n78_100mhz_4x4_2cell.yml

   # Section 4 - 8T8R as two 4T4R cells on two optical ports
   sudo ./gnb -c gnb_ru_lions_rs8777_tdd_n77_100mhz_4x4_2cell.yml
   ```

   Check the following CU/DU startup messages. This example illustrates **Scenario 1**. Cell count, antenna configuration, frequency, bandwidth and compression settings vary with the selected scenario. These messages report CU/DU initialisation and the N2 connection to the AMF.

   ```bash
   --== OCUDU gNB (commit xxxxxxx) ==--

   Initializing the Open Fronthaul Interface for sector#0: ul_compr=[BFP,9], dl_compr=[BFP,9], prach_compr=[BFP,9], prach_cp_enabled=true
   Cell pci=1, bw=100 MHz, 4T4R, dl_arfcn=640092 (n78), dl_freq=3601.38 MHz, dl_ssb_arfcn=637344, ul_freq=3601.38 MHz
   N2: Connection to AMF on 192.168.123.252:38412 completed
   ==== gNB started ===
   Type <h> to view help
   ```

4. Check RU fronthaul packet counters and timing. RU is radiating when FH packets are sent and received ontime. 

   ```text
   rx_total_cuplan_cnt        [0]:124776218
   tx_total_cuplan_cnt        [0]:23697971
   antenna_id                 [0]:0
   rx_up_total                [0]:227447
   rx_up_early                [0]:0
   rx_up_late                 [0]:0
   rx_up_ontime               [0]:227447
   rx_dl_cp_total             [0]:17494
   rx_dl_cp_early             [0]:0
   rx_dl_cp_late              [0]:0
   rx_dl_cp_ontime            [0]:17494
   rx_dl_cp_outrange          [0]:0
   rx_ul_cp_total             [0]:0
   rx_ul_cp_early             [0]:0
   rx_ul_cp_late              [0]:0
   rx_ul_cp_ontime            [0]:0
   rx_ul_cp_outrange          [0]:0
   ```

### Connecting to the network

You can now connect a UE to the network. This can be done using e.g. a COTS UE. See the main RU guide for details on this.
