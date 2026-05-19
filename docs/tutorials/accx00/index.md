---
description: "Configure OCUDU to offload LDPC encoding and decoding to an Intel ACC100 or vRAN Boost (ACC200/VRB1) hardware accelerator via DPDK BBDEV."
---

import Tabs from '@theme/Tabs';
import TabItem from '@theme/TabItem';

# OCUDU gNB with BBDEV Hardware Acceleration

:::info
This tutorial assumes that DPDK is already installed and configured on your system. For details, see the [DPDK tutorial](../dpdk/).
:::

## Overview

LDPC encoding and decoding are the most compute-intensive operations in the 5G NR PHY layer. Offloading them to a dedicated hardware accelerator reduces CPU load significantly, which either frees those cores for other gNB functions or allows the same host to support a higher bandwidth configuration or more concurrent UEs.

DPDK's BBDEV (wireless baseband device) library provides a common interface to hardware accelerators that handle PHY-layer processing. OCUDU integrates with BBDEV-capable devices through its hardware abstraction layer (HAL). This tutorial covers building, configuring, and running OCUDU with Intel's ACC100 and vRAN Boost 1.0 (ACC200/VRB1) accelerators.

This example uses test mode with dummy RU emulation to keep the setup simple. No radio hardware is required.

### Device naming

This tutorial covers two Intel accelerator families:

| Name | Also known as | Notes |
|---|---|---|
| ACC100 | Intel vRAN Dedicated Accelerator ACC100 | Older device; has dedicated on-board DDR for HARQ buffers |
| ACC200 / VRB1 | Intel vRAN Boost 1.0 | Newer device; no dedicated DDR, uses host memory for HARQ |

In OCUDU configuration, `acc200` and `vrb1` are aliases and use the same code path as `acc100`. The tutorial uses **ACCx00** to refer to either device where the steps are identical.

## Hardware and Software Requirements

- PC with Ubuntu 22.04.2
- OCUDU (built from source)
- [DPDK](https://www.dpdk.org/) (already installed, see the [DPDK tutorial](../dpdk/))
- [PF-BBDEV Configuration Application](https://github.com/intel/pf-bb-config)
- An ACC100 or ACC200/VRB1 PCIe accelerator card

## Installation

### PF-BBDEV Configuration Application

The PF-BBDEV Configuration (`pf_bb_config`) application configures the hardware accelerator at the host level before DPDK takes ownership of the device. For more information, see the [pf_bb_config documentation](https://github.com/intel/pf-bb-config).

To install `pf_bb_config`, run:

```bash
git clone https://github.com/intel/pf-bb-config.git
cd pf-bb-config/
./build.sh
```

Verify the build succeeded by checking the binary exists:

```bash
ls pf_bb_config
```

### OCUDU gNB

BBDEV hardware acceleration requires an OCUDU build with DPDK enabled. Navigate to your OCUDU build directory and rerun cmake with the required flags:

```bash
cd ocudu/build
cmake ../ -DENABLE_DPDK=ON -DASSERT_LEVEL=MINIMAL
make -j`nproc`
```

:::info
`-DASSERT_LEVEL=MINIMAL` is optional but recommended for production deployments. If you have not set up the build directory yet, follow the [Installation Guide](/user_manual/installation/) first.
:::

Enabling DPDK triggers compilation of hardware-acceleration code for both PUSCH and PDSCH PHY-layer processing. Verify that DPDK was found by checking the cmake output includes:

```
-- Checking for module 'libdpdk>=22.11'
--   Found libdpdk, version 25.11.0
```

If this line is absent, or if you see `Building without DPDK support as DPDK dependencies could not be resolved`, check the output of the DPDK installation step in the [DPDK tutorial](../dpdk/).

## Test Mode with ACCx00

### Configuration

#### ACCx00

The accelerator must be bound to DPDK's `vfio-pci` driver and configured with `pf_bb_config` before starting OCUDU. The steps below use PCI address `0000:8a:00.0` for the physical function (PF); substitute the address of your device.

**Step 1: Bind the PF to vfio-pci**

As shown in the [DPDK tutorial](../dpdk/):

```bash
cd dpdk/usertools/
sudo ./dpdk-devbind.py -b vfio-pci 0000:8a:00.0
```

Expected output (confirming `drv=vfio-pci`):

```
Baseband devices using DPDK-compatible driver
=============================================
0000:8a:00.0 'Device 0d5c' drv=vfio-pci unused=
```

**Step 2: Configure the device and enable SR-IOV**

SR-IOV (Single Root I/O Virtualization) allows the single physical device to expose one or more virtual functions (VFs) to the OS. OCUDU communicates with a VF via the DPDK EAL, not the PF directly. For a single gNB instance, creating 1 VF is sufficient. Up to 64 VFs are supported if multiple instances need to share the device.

<Tabs>
  <TabItem value="acc100" label="ACC100" default>

```bash
cd pf-bb-config/
# Replace the UUID with a value of your choice — it must match the --vfio-vf-token in eal_args
sudo ./pf_bb_config ACC100 -v 00112233-4455-6677-8899-aabbccddeeff -c acc100/acc100_config_1vf_5g.cfg
echo 1 | sudo tee /sys/module/vfio_pci/parameters/enable_sriov
echo 1 | sudo tee /sys/bus/pci/devices/0000\:8a\:00.0/sriov_numvfs
```

  </TabItem>
  <TabItem value="acc200" label="ACC200 / VRB1">

```bash
cd pf-bb-config/
# Replace the UUID with a value of your choice — it must match the --vfio-vf-token in eal_args
sudo ./pf_bb_config VRB1 -v 00112233-4455-6677-8899-aabbccddeeff -c vrb1/vrb1_config_vf_5g.cfg
echo 1 | sudo tee /sys/module/vfio_pci/parameters/enable_sriov
echo 1 | sudo tee /sys/bus/pci/devices/0000\:8a\:00.0/sriov_numvfs
```

  </TabItem>
</Tabs>

`acc100_config_1vf_5g.cfg` and `vrb1_config_vf_5g.cfg` are predefined configuration files included with the `pf_bb_config` installation.

The `-v` flag assigns a VFIO token (a UUID) to the VF. This token is a shared secret between `pf_bb_config` and the DPDK EAL: the same value must appear as `--vfio-vf-token` in `eal_args`. The value `00112233-4455-6677-8899-aabbccddeeff` used throughout this tutorial is an example; replace it with any valid UUID.

It is also possible to use the ACCx00 with the `igb_uio` driver (see the [DPDK tutorial](../dpdk/) for build and usage details). In that case, the `pf_bb_config` command must point to a physical function-based (`_pf`) configuration and does not include the `-v` VF token flag.

#### OCUDU gNB

The following configuration file provides a simple example for using the ACCx00 in test mode (1 cell, 4T4R, 100 MHz, single UE). Save it as `gnb_accx00_testmode.yml`:

<Tabs>
  <TabItem value="acc100" label="ACC100" default>

```yaml
# SPDX-FileCopyrightText: Copyright (C) 2021-2026 Software Radio Systems Limited
# SPDX-License-Identifier: BSD-3-Clause-Open-MPI

cu_cp:
  amf:
    no_core: true

log:
  filename: /tmp/gnb.log
  all_level: warning

cu_up:
  warn_on_drop: false

buffer_pool:
  nof_segments: 1048576

cell_cfg:
  dl_arfcn: 381500
  band: 39
  channel_bandwidth_MHz: 100
  common_scs: 30
  plmn: "00101"
  tac: 7
  pci: 1
  nof_antennas_dl: 4
  nof_antennas_ul: 4
  pdsch:
    min_ue_mcs: 27
    mcs_table: qam256
  pusch:
    min_ue_mcs: 27
    mcs_table: qam256
    rv_sequence: 0

cells:
  - pci: 1

ru_dummy:

test_mode:
  test_ue:
    rnti: 0x1234
    pdsch_active: true
    pusch_active: true
    ri: 4
    nof_ues: 1

expert_phy:
  max_request_headroom_slots: 3
  max_proc_delay: 4
  pusch_dec_max_iterations: 2

hal:
  eal_args: "--lcores (0-1)@(3-29,33-59) --vfio-vf-token=00112233-4455-6677-8899-aabbccddeeff -a 0000:8b:00.1 --log-level=error"
  bbdev_hwacc:
    hwacc_type: acc100
    id: 0
    pdsch_enc:
      nof_hwacc: 32
      cb_mode: false
      dedicated_queue: true
    pusch_dec:
      nof_hwacc: 32
      force_local_harq: false
      dedicated_queue: true
      harq_context_size: 5184
```

  </TabItem>
  <TabItem value="acc200" label="ACC200 / VRB1">

```yaml
# SPDX-FileCopyrightText: Copyright (C) 2021-2026 Software Radio Systems Limited
# SPDX-License-Identifier: BSD-3-Clause-Open-MPI

cu_cp:
  amf:
    no_core: true

log:
  filename: /tmp/gnb.log
  all_level: warning

cu_up:
  warn_on_drop: false

buffer_pool:
  nof_segments: 1048576

cell_cfg:
  dl_arfcn: 381500
  band: 39
  channel_bandwidth_MHz: 100
  common_scs: 30
  plmn: "00101"
  tac: 7
  pci: 1
  nof_antennas_dl: 4
  nof_antennas_ul: 4
  pdsch:
    min_ue_mcs: 27
    mcs_table: qam256
  pusch:
    min_ue_mcs: 27
    mcs_table: qam256
    rv_sequence: 0

cells:
  - pci: 1

ru_dummy:

test_mode:
  test_ue:
    rnti: 0x1234
    pdsch_active: true
    pusch_active: true
    ri: 4
    nof_ues: 1

expert_phy:
  max_request_headroom_slots: 3
  max_proc_delay: 4
  pusch_dec_max_iterations: 2

hal:
  eal_args: "--lcores (0-1)@(3-29,33-59) --vfio-vf-token=00112233-4455-6677-8899-aabbccddeeff -a 0000:8b:00.1 --log-level=error"
  bbdev_hwacc:
    hwacc_type: acc200
    id: 0
    pdsch_enc:
      nof_hwacc: 32
      cb_mode: false
      dedicated_queue: true
    pusch_dec:
      nof_hwacc: 32
      force_local_harq: false
      dedicated_queue: true
      harq_context_size: 5184
```

  </TabItem>
</Tabs>

All BBDEV parameters live in the `hal` section. The following extract explains each parameter:

```yaml
hal:
  bbdev_hwacc:
    hwacc_type: acc100        # Accepted values: acc100, acc200, vrb1 (acc200/vrb1 are aliases)
    id: 0                     # BBDEV device index; 0 when only one accelerator is installed
    pdsch_enc:
      nof_hwacc: 32           # Number of hardware-accelerated LDPC encoder functions to reserve
      cb_mode: false          # false = encode full TB in one operation; true = encode each CB separately
      dedicated_queue: true   # true = dedicated queue per function (default); false = shared queue
    pusch_dec:
      nof_hwacc: 32           # Number of hardware-accelerated LDPC decoder functions to reserve
      force_local_harq: false # false = use ACC100 on-board DDR for HARQ (ACC200 always uses host memory)
      dedicated_queue: true   # true = dedicated queue per function (default); false = shared queue
      harq_context_size: 5184 # HARQ context repository size; sized here for max 162 CBs/TB × 32 UEs
  eal_args: "--lcores (0-1)@(3-29,33-59) --vfio-vf-token=00112233-4455-6677-8899-aabbccddeeff -a 0000:8b:00.1 --log-level=error"
```

**Key configuration parameters:**

**`hwacc_type`** — selects the BBDEV accelerator. Accepted values are `acc100`, `acc200`, and `vrb1`. `acc200` and `vrb1` are aliases and use the same code path as `acc100`.

**`id`** — BBDEV device index (typically `0` when only one accelerator is installed). Use `rte_bbdev_count` / `rte_bbdev_is_valid` from the [BBDEV API](https://doc.dpdk.org/api/rte__bbdev_8h.html) to enumerate installed devices.

**`pdsch_enc`** — hardware-accelerated PDSCH encoding:
- `nof_hwacc` — number of hardware-accelerated LDPC encoder functions to reserve. Set to `0` to disable hardware acceleration and fall back to software.
- `cb_mode` — when `false` (default), the entire TB is encoded in a single operation (lower overhead). When `true`, each code block (CB) is encoded separately. CB mode is forced automatically if the TB or rate-matched CB size exceeds the maximum `mbuf` size (64 000 bytes).
- `dedicated_queue` — when `true` (default), each accelerated function instance gets its own hardware queue, allocated upfront. When `false`, a queue is reserved dynamically per operation, which is more flexible if the number of function instances exceeds available queues, but adds per-operation overhead.

**`pusch_dec`** — hardware-accelerated PUSCH decoding:
- `nof_hwacc` — number of hardware-accelerated LDPC decoder functions to reserve. Set to `0` to disable hardware acceleration and fall back to software.
- `force_local_harq` — when `false` (default), HARQ uses the ACC100's embedded DDR. Set to `true` to use host memory instead (strongly discouraged for ACC100; significant performance penalty). The ACC200 has no dedicated DDR, so host memory is always used regardless of this setting.
- `dedicated_queue` — same as for `pdsch_enc` above.
- `harq_context_size` — size of the HARQ context repository for tracking CB offsets in DDR memory. Size to the maximum expected value (max CBs per TB × max UEs). The default in the example (5184 = 162 CBs × 32 UEs) is appropriate for a 100 MHz 32-UE configuration.

**`eal_args`** — arguments forwarded to the DPDK EAL:
- `-a <vf_address>` — the PCI address of the **VF** created by SR-IOV, not the PF. After enabling SR-IOV, confirm the VF address with `sudo dpdk-devbind.py -s` and substitute it here.
- `--vfio-vf-token` — the UUID assigned during `pf_bb_config`. Must match the `-v` argument used there.
- `--lcores (0-1)@(3-29,33-59)` — maps EAL threads 0–1 to cores 3–29 and 33–59. Adjust for your host's core count.
- Use `--vfio-intr=msi` to request VFIO MSI interrupts (the only type supported by ACC100). If Open Fronthaul with DPDK is also enabled, MSI interrupt configuration will not complete; in that case, use `--log-level=error` to suppress the resulting warning messages.

:::info
When `upper_phy` parameters from `expert_execution` are in use, the number of DL/UL threads (including PUSCH decoder threads) is bounded by the corresponding `nof_hwacc` values in the `hal` section.
:::

### Running the gNB with the ACCx00

```bash
sudo ./apps/gnb/gnb -c gnb_accx00_testmode.yml
```

Expected console output:

```
--== OCUDU gNB (commit 57abe27c28) ==--

Warning: the configured maximum PDSCH concurrency (0) is overridden by the number of PDSCH encoder hardware accelerated functions (32)
Warning: the configured maximum PUSCH and SRS concurrency (4) is overridden by the number of PUSCH decoder hardware accelerated functions (32)

Cell pci=1, bw=100 MHz, 4T4R, dl_arfcn=381500 (n39), dl_freq=1907.5 MHz, dl_ssb_arfcn=373490, ul_freq=1907.5 MHz

==== gNB started ===
Type <h> to view help

          |--------------------DL---------------------|-------------------------------UL-----------------------------
 pci rnti | cqi  ri  mcs  brate   ok  nok  (%)  dl_bs | pusch  rsrp  ri  mcs  brate   ok  nok  (%)    bsr     ta  phr
   1 1234 |  15 4.0   27   1.2G 1400    0   0%    10M |  99.9 -99.9   1   27   154M  600    0   0%  81.9M      0  n/a
```

The two `Warning` lines are expected. They indicate that OCUDU has overridden the software concurrency limits (derived from `expert_execution.threads`) with the number of hardware-accelerated function instances configured in `nof_hwacc`. This is correct behaviour: when BBDEV acceleration is active, the hardware function count determines the maximum concurrent encode/decode operations, not the software thread count.

## Teardown

To release the accelerator and restore it to kernel control:

**Step 1: Stop the gNB** (Ctrl+C or send SIGTERM).

**Step 2: Remove the VFs:**

```bash
echo 0 | sudo tee /sys/bus/pci/devices/0000\:8a\:00.0/sriov_numvfs
```

**Step 3: Unbind the PF from vfio-pci:**

```bash
sudo dpdk-devbind.py --unbind 0000:8a:00.0
```

After unbinding, the device will appear in the "Other devices" section of `dpdk-devbind.py -s` with no driver attached. This is the normal state for an ACC100/ACC200 on a system without the vendor kernel driver installed. The device is now available for re-binding in a future session.
