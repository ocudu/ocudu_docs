---
description: "Checking the O1 adapter M-plane client against a real O-RAN Radio Unit (O-RU)."
displayed_sidebar: userDocsSidebar
---

# Testing M-plane with an O-RU

## Overview

This guide checks the M-plane client in the [O1 adapter](https://gitlab.com/ocudu/ocudu_elements/ocudu_oran_apps/ocudu_o1_adapter) against a real O-RAN Radio Unit (O-RU). It covers configuration management (CM), fault management (FM) and performance management (PM), for the `sudo` and `hybrid-odu` roles of O-RAN.WG4.MP.0 Table 6.5-1.

For the adapter options and the provision profile, see [O-RU M-plane service](https://gitlab.com/ocudu/ocudu_elements/ocudu_oran_apps/ocudu_o1_adapter/-/blob/main/docs/mplane-service.md). For `ru_controller.py`, see [O-RU M-plane client](https://gitlab.com/ocudu/ocudu_elements/ocudu_oran_apps/ocudu_o1_adapter/-/blob/main/docs/mplane-client.md). For testing without hardware, see [M-plane sim loop](https://gitlab.com/ocudu/ocudu_elements/ocudu_oran_apps/ocudu_o1_adapter/-/blob/main/docs/mplane-sim-testing.md).

## Setup considerations

- Reset the O-RU so that no configuration from an earlier run remains.
- Connect the O-RU to a PTP grandmaster it can lock to.
- Check whether the O-RU accepts NETCONF connections from an O-RU controller or only performs NETCONF call home. For call home, the O-RU discovers the adapter host as an O-RU controller through DHCP (option 43 for DHCPv4, option 17 for DHCPv6) or from `configured-client-info` in `o-ran-mplane-int`.
- Install the adapter.

```bash
git clone https://gitlab.com/ocudu/ocudu_elements/ocudu_oran_apps/ocudu_o1_adapter.git
cd ocudu_o1_adapter
python3 -m venv .venv
.venv/bin/pip install -r requirements.txt
```

## Provision profile

Example for a 4T4R TDD O-RU at 100 MHz.

```yaml
# provision.yaml
interface:
  ru_mac_addr: "AA:BB:CC:DD:EE:01"
  vlan: 3
  l2_mtu: 1500   # default 9600

processing:
  ru_mac_addr: "AA:BB:CC:DD:EE:01"
  du_mac_addr: "AA:BB:CC:DD:EE:02"
  vlan: 3

endpoint:
  iq_bitwidth: 9
  compression_type: STATIC
  num_prb: 273
  frame_structure: 193
  tx_endpoints:
    - {name: <tx-endpoint-0>, eaxc_id: 0}
    - {name: <tx-endpoint-1>, eaxc_id: 1}
    - {name: <tx-endpoint-2>, eaxc_id: 2}
    - {name: <tx-endpoint-3>, eaxc_id: 3}
  rx_endpoints:
    - {name: <rx-endpoint-0>, eaxc_id: 0}
    - {name: <rx-endpoint-1>, eaxc_id: 1}
    - {name: <rx-endpoint-2>, eaxc_id: 2}
    - {name: <rx-endpoint-3>, eaxc_id: 3}
  prach_endpoints:
    - {name: <prach-endpoint-0>, eaxc_id: 4}
    - {name: <prach-endpoint-1>, eaxc_id: 5}
    - {name: <prach-endpoint-2>, eaxc_id: 6}
    - {name: <prach-endpoint-3>, eaxc_id: 7}

carrier:
  dl_arfcn: 650000
  dl_freq: 3750000000
  ul_arfcn: 650000
  ul_freq: 3750000000
  tx_gain: 20.0
  rf_bandwidth_hz: 100000000

tdd:
  pattern_upload: true

activation: {state: ACTIVE}

pm:
  rx_window_objects: [RX_ON_TIME, RX_EARLY, RX_LATE, RX_CORRUPT, RX_DUPL, RX_TOTAL]
  rx_window_interval: 60
  notification_interval: 60
```

## gNB configuration

The adapter configures the O-RU only. Keep the gNB configuration consistent with the profile, or the carriers reach READY but no UE attaches. The table lists the corresponding keys.

| Profile | Corresponding gNB configuration |
|---|---|
| `processing.ru_mac_addr` | `ru_ofh.cells.ru_mac_addr` |
| `processing.du_mac_addr` | `ru_ofh.cells.du_mac_addr` |
| `processing.vlan` | `ru_ofh.cells.vlan_tag_cp`, `ru_ofh.cells.vlan_tag_up` |
| `interface.l2_mtu` | `ru_ofh.cells.mtu` |
| `eaxc_id` in `endpoint.tx_endpoints` | `ru_ofh.cells.dl_port_id` |
| `eaxc_id` in `endpoint.rx_endpoints` | `ru_ofh.cells.ul_port_id` |
| `eaxc_id` in `endpoint.prach_endpoints` | `ru_ofh.cells.prach_port_id` |
| Number of TX and RX endpoints | `cell_cfg.nof_antennas_dl`, `cell_cfg.nof_antennas_ul` |
| `endpoint.compression_type: STATIC` | `ru_ofh.enable_dl_static_compr_hdr: true`, `ru_ofh.enable_ul_static_compr_hdr: true` |
| `endpoint.iq_bitwidth` | `ru_ofh.compr_bitwidth_dl`, `ru_ofh.compr_bitwidth_ul`, `ru_ofh.compr_bitwidth_prach` |
| `endpoint.num_prb`, `endpoint.frame_structure` | `cell_cfg.channel_bandwidth_MHz`, `cell_cfg.common_scs` |
| `carrier.dl_arfcn`, `carrier.ul_arfcn` | `cell_cfg.dl_arfcn`, `cell_cfg.band` |
| `carrier.rf_bandwidth_hz` | `cell_cfg.channel_bandwidth_MHz` |
| `tdd.switching_points` | `cell_cfg.tdd_ul_dl_cfg` |

## Starting the adapter

```bash
.venv/bin/python src/o1_adapter.py \
  --profile ru \
  --ru_supervise --ru_callhome \
  --ru_provision_config provision.yaml --ru_pm \
  --ru_netconf_username <sudo-user> --ru_netconf_password <sudo-password> \
  --rpc_log rpc.log --loglevel DEBUG
```

For an O-RU that accepts NETCONF connections, use `--ru_netconf_host <ru-ip>` instead of `--ru_callhome`.

When the O-RU connects, you will see the following output:

```text
RU M-plane session: DISCONNECTED -> CONNECTING
Listening for RU call-home on 0.0.0.0:4334
RU call-home connection from <ru-ip>:<port>
RU M-plane session: CONNECTING -> SUPERVISED
```

## Configuration management

1. Wait for provisioning. Every carrier reaches READY.
2. Start the gNB and attach a UE, as described in [Initializing the network](../../tutorials/oranru/index.md#initializing-the-network) and [Connecting to the network](../../tutorials/oranru/index.md#connecting-to-the-network). The UE passes traffic in both directions.
3. Reset the O-RU. The adapter provisions it again and every carrier returns to READY.

When provisioning completes, you will see the following output:

```text
O-RU provisioned; carrier activation receipt: Rx-Array-Carrier-00=READY, ..., Tx-Array-Carrier-03=READY
```

If the O-RU rejects an edit, the `rpc-error` in `rpc.log` names the element.

## Fault management

1. Raise an alarm on the O-RU, for example by stopping the PTP grandmaster. The adapter emits a VES event with the fault ID, source and severity sent by the O-RU.
2. Restart the PTP grandmaster. The clear is emitted as `notifyClearedAlarm`.
3. Restart the adapter while an alarm is active. The alarm is read from `active-alarm-list`.

You will see output similar to the following:

```text
O-RU fault <fault-id> <severity> from <source>: <text> (affected: <objects>)
O-RU fault <fault-id> cleared from <source>: <text> (affected: <objects>)
O-RU active-alarm-list: faults [<fault-id>]; retiring none
```

## Performance management

1. The adapter reads the measurement capabilities of the O-RU and requests only the objects it advertises. No `rpc-error` appears.
2. Notifications arrive every `notification_interval` seconds. Check the interval against the `eventTime` of each `measurement-result-stats` notification in `rpc.log`, since the adapter log timestamps include processing delay.
3. Reset the O-RU. Measurements resume after it reconnects.

You will see output similar to the following:

```text
O-RU advertises measurement objects: rx-window (11), ...
Measurement objects not advertised by the O-RU (unit RU), not requested: ['RX_DUPL']
Editing ORAN Performance measurements
Editing ORAN Performance measurement activation
O-RU performance stream started: 5 samples, e.g. ru.rx-window-stats.RX_ON_TIME
```

## Hybrid M-plane architecture

In the hybrid architecture, the adapter acts as the `hybrid-odu` role, which cannot write every module. Set up the following first, from the SMO or with the `sudo` account:

- an account in the `hybrid-odu` group
- the U-plane VLAN interface in `ietf-interfaces`
- the synchronization configuration
- the performance measurements. In this role the adapter only receives the notifications.

Start the adapter with `--ru_role hybrid-odu` and repeat [Configuration management](#configuration-management). Each write the role does not allow is logged once and skipped.

```text
IETF interfaces: ietf-interfaces is not writable for role hybrid-odu (O-RAN WG4 M-plane specification, Table 6.5-1); skipped, expected to be provisioned by the SMO/NMS
```

To record the result, see [Report an integration](../report_an_integration.md).
