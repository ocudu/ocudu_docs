---
description: "Connecting a Pegatron O-RAN radio unit to OCUDU over the split 7.2 Open Fronthaul interface."
---

# Pegatron O-RU (PR1450/PR2850)

:::warning
This document is intended to be used as a guide. Variances in firmware and software versions in local setups may require the sample configuration files provided to be changed. As a result please closely follow the specific users guides of your RU in conjunction with this guide.
:::

## Overview

This guide provides further details on connecting the OCUDU CU/DU to an RU using the ORAN 7.2 split. Specifically, we discuss the Pegatron family of O-RAN Radio Units.
Pegatron 5G offers several RU models covering different deployment scenarios:

- **PR1450-78I**: Indoor 5G NR FR1 4T4R O-RU for private network deployments. (Tested Firmware: v1.0.2.4p1)

> **Note:** These Pegatron RUs are built upon a [Metanoia reference design](https://metanoia-comm.com/products/5g/cobra/). Therefore, the configurations and troubleshooting steps outlined in this guide will likely apply to other Metanoia-based RUs.

:::info
Please refer to the Pegatron 5G User Guide provided by the distributor for up-to-date configuration and usage guidelines. Contact Pegatron ([https://5g.pegatroncorp.com/](https://5g.pegatroncorp.com/)) for more information.
:::

---

## Configuration

### CU/DU

A sample configuration file for the DU can be found in the `configs` folder of the OCUDU source files. This configuration is **specific** to the firmware version of the RU being used for this guide. As a result, you may need to modify this slightly for your local setup.

The following excerpt shows how the DU is configured to communicate with the RU (for a 4x4 MIMO configuration with 100 MHz bandwidth):

```yaml
ru_ofh:
  t1a_max_cp_dl: 470
  t1a_min_cp_dl: 285
  t1a_max_cp_ul: 429
  t1a_min_cp_ul: 285
  t1a_max_up: 350
  t1a_min_up: 125
  ta4_max: 180
  ta4_min: 110
  is_prach_cp_enabled: true
  compr_method_ul: bfp
  compr_bitwidth_ul: 9
  compr_method_dl: bfp
  compr_bitwidth_dl: 9
  compr_method_prach: bfp
  compr_bitwidth_prach: 9
  enable_ul_static_compr_hdr: true
  enable_dl_static_compr_hdr: true
  ru_reference_level_dBFS: -12
  subcarrier_rms_backoff_dB: 0

  cells:
    - network_interface: 0000:ca:01.3
      ru_mac_addr: 48:21:0b:xx:xx:xx
      du_mac_addr: 00:11:22:33:44:55
      vlan_tag_cp: 5
      vlan_tag_up: 5
      enable_promiscuous: true
      check_link_status: false
      prach_port_id: [4, 5, 6, 7]
      dl_port_id: [0, 1, 2, 3]
      ul_port_id: [0, 1, 2, 3]
```

To expand on this, the following parameters are set in the `cells` field:

* `network_interface` : PCI address of the DPDK-bound network interface used to send the OFH packets. When using SR-IOV, this is the Virtual Function (VF) PCI address.
* `ru_mac_addr` : MAC address of the Pegatron RU.
* `du_mac_addr` : MAC address of the interface used by the DU for OFH traffic.
* `vlan_tag_up/vlan_tag_cp` : VLAN identifier, should be set to the value configured in the RU/switch settings.
* `enable_promiscuous` : Must be set to `true` when using SR-IOV Virtual Functions if the VF MAC does not match the `du_mac_addr`. Alternatively, you can set this to `false` if you configure the VF MAC to match the PF MAC at the OS level.
* `check_link_status` : Set to `false` for SR-IOV VF interfaces where link status reporting may not be supported.

### RU

Refer to the Pegatron 5G User Guide documentation to apply the following configuration changes so that they match your local setup. The following information is purely a guide and may not work for your specific set up.

The RU has been tested with the following configuration:

* 4x4 MIMO configuration with 100 MHz bandwidth on band n78

Below are the most critical values to be configured on the RU side, and the ones that should match the DU configuration:

* `DU MAC Address` : The MAC address of the DU must be configured in the RU for Control-Plane and User-Plane traffic. In our configuration we use the same MAC address for both planes.
* `VLAN tag` : In our setup the same VLAN ID (5) is used for all network traffic (C-Plane and U-Plane), as only one MAC address is used.
* `Compression` : Configure **static** BFP9 compression for all uplink and downlink channels. The Pegatron RU uses static compression headers (i.e. the compression header is **not** included in each OFH message), which is why `enable_ul_static_compr_hdr` and `enable_dl_static_compr_hdr` are both set to `true` on the DU side.
* `eAxC Port Mapping` : Configure RU port IDs 0, 1, 2, 3 for PDSCH/PUSCH and 4, 5, 6, 7 for PRACH.
* `Center Frequency` : Set to match the DU `dl_arfcn`. For example, ARFCN 650000 corresponds to 3750.0 MHz.
* `Channel Bandwidth` : Set to 100 MHz (273 PRBs) to match the DU configuration.
* `TDD Pattern` : The TDD pattern should match the DU's `tdd_ul_dl_cfg`. With the configuration above (period 10, 7 DL slots + 6 DL symbols, 2 UL slots + 4 UL symbols), this corresponds to a DDDDDDDSUUU pattern.
* `PTP Synchronization` : Ensure PTP is configured and locked before starting the DU. The RU must have a stable PTP lock for correct fronthaul timing.

### DPDK and SR-IOV Configuration

:::info
The specific CPU core isolations, EAL arguments, and SR-IOV configurations shown below are highly dependent on specific server hardware and OS environment. They are provided as a working example rather than a strict requirement for the RU itself.
:::

Unlike the Benetel and Foxconn guides which use kernel-mode Ethernet interfaces, this setup uses **DPDK with SR-IOV**. The `network_interface` field in the DU configuration takes a PCI address (e.g. `0000:ca:01.3`) instead of a Linux interface name (e.g. `enp1xxx`).

To use this mode:

1. Ensure the physical NIC supports SR-IOV and that a Virtual Function (VF) has been created and bound to a DPDK-compatible driver (e.g. `iavf` via `vfio-pci`).
2. Pass the correct DPDK EAL arguments in the `hal` section:
```yaml
hal:
  eal_args: "--lcores (0-13)@(3,5,7,11,13,15,17,19,21,23,25,27,29,31) -a 0000:ca:01.3 --file-prefix=gnb --log-level=lib.eal:error --log-level=pmd:error -d /opt/dpdk/24.11.2/lib/x86_64-linux-gnu/dpdk/pmds-25.0/librte_common_iavf.so -d /opt/dpdk/24.11.2/lib/x86_64-linux-gnu/dpdk/pmds-25.0/librte_net_iavf.so"

```

3. The `-a` flag specifies the PCI address of the VF, and `-d` flags load the required DPDK PMD drivers for Intel Adaptive Virtual Function (iavf).
4. The `--lcores` mapping pins DPDK worker threads to specific CPU cores for real-time performance.

:::info
When deploying on Kubernetes (e.g. StarlingX), the SR-IOV VF is typically allocated via the SR-IOV Device Plugin and the PCI address is injected into the pod at runtime. The `enable_promiscuous: true` and `check_link_status: false` settings are necessary in this scenario.
:::

### CPU Affinity and Threading

For optimal real-time performance, the DU should be configured with appropriate CPU affinity:

```yaml
expert_execution:
  affinities:
    main_pool_pinning: mask
    ofh:
      timing_cpu: "3"                  # Dedicated CPU core for OFH timing-critical tasks.
  threads:
    main_pool:
      nof_threads: 12                  # Number of worker threads in the main thread pool.
      task_queue_size: 2048
      backoff_period: 10

```

Ensure that the CPU cores specified are isolated from the OS scheduler (e.g. via `isolcpus` kernel parameter or a CPU manager like the one provided by StarlingX/Wind River).

---

## Initializing and connecting to the network

Initializing and connecting to the network is done in the same way as outlined in the general 7.2 RU guide.

### Initializing the network

The following steps should be taken to initialize the network:

1. Ensure the Pegatron RU is powered on and that PTP synchronization is locked.
2. Run the CU/DU, making sure that the PTP sync between the DU and the fronthaul switch is successful as previously outlined.
```bash
sudo ./gnb -c gnb_ru_pegatron_tdd_n78_100mhz_4x4.yml

```


If the DU connects to the RU successfully, you will see the following output:

```bash
--== OCUDU gNB (commit xxxxxxx) ==--

Connecting to AMF on 127.0.0.5:38412
Initializing the Open Fronthaul Interface for sector#0: ul_compr=[BFP,9], dl_compr=[BFP,9], prach_compr=[BFP,9], prach_cp_enabled=true, downlink_broadcast=false
Cell pci=0, bw=100 MHz, 4T4R, dl_arfcn=650000 (n78), dl_freq=3750.0 MHz, dl_ssb_arfcn=647328, ul_freq=3750.0 MHz

==== gNodeB started ===
Type <t> to view trace
```

### Troubleshooting

If the DU fails to connect to the RU, check the following:

* **PTP lock**: Verify that the RU has achieved PTP lock before starting the DU.
* **MAC addresses**: Ensure `ru_mac_addr` and `du_mac_addr` are correct and match the physical setup.
* **VLAN configuration**: Verify that the VLAN tags match between the DU, RU, and any intermediate switches.
* **Compression settings**: The Pegatron RU uses static compression headers. Make sure both `enable_ul_static_compr_hdr` and `enable_dl_static_compr_hdr` are set to `true`.
* **DPDK driver**: Verify the SR-IOV VF is correctly bound and the iavf PMD drivers are loaded.

### Connecting to the network

You can now connect a UE to the network. This can be done using e.g. a COTS UE. See the main RU guide for details on this.

---

## Kubernetes / Helm Deployment

This RU has also been tested with the OCUDU Helm chart for Kubernetes-based deployments (e.g. on StarlingX). Key Helm values for this setup include:

* SR-IOV Device Plugin resource requests (`intel.com/pci_sriov_net_fh_cp`)
* Isolated CPU allocation (`windriver.com/isolcpus`)
* Hugepages (1Gi pages recommended for DPDK)
* Multus CNI for N2/N3 user plane connectivity
* Host network disabled (using SR-IOV VFs instead)

Refer to the OCUDU Helm chart documentation for full details on Kubernetes deployment.