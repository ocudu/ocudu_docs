---
sidebar_label: "Supported E2 Metrics"
description: "Complete reference of E2SM-KPM report styles and metrics supported by OCUDU, with source nodes, units, and label restrictions."
---

# Supported E2 Metrics

## What is E2SM-KPM?

E2SM-KPM (E2 Service Model, Key Performance Measurements) is an O-RAN Alliance service model that lets a near-RT RIC subscribe to performance measurements from an E2 node. It is carried over the E2 interface using E2AP and is defined in O-RAN.WG3.E2SM-KPM-R003-v03.00.

The RIC sends a subscription request specifying which metrics to collect, at what reporting interval, and using which report style. The gNB's E2 agent collects those measurements internally and sends periodic RIC Indication messages back to the RIC with the results.

The three main concepts in an E2SM-KPM subscription are:

- **Report Style:** determines how measurements are aggregated (node-level, per-UE, or conditional).
- **Metric name:** identifies the specific measurement, using names from the 3GPP TS 28.552 or O-RAN specifications.
- **Labels:** optional dimensions attached to a measurement (per-PLMN, per-5QI, per-slice). If no label is requested, the aggregate value is returned.

To enable E2SM-KPM, configure the gNB as described in the [Near-RT RIC tutorial](../../tutorials/near-rt-ric/index.md#gnb).

## Metric Coverage

OCUDU implements E2SM-KPM v3.00. The table below shows the current coverage of the full 3GPP and O-RAN metric specifications.

| Specification | Defined | Supported |
|---|---|---|
| 3GPP TS 28.552 | 278 | 24 |
| O-RAN WG3 | 9 | 3 |
| **Total** | **287** | **27** |

The metric set grows with each release as new internal measurements are exposed through the E2 interface.

## Report Service Styles

E2SM-KPM defines six report styles that control how measurements are aggregated and delivered. All six are supported.

| Style | Name | Description |
|---|---|---|
| 1 | E2 Node Measurement | Node-level aggregate measurements across all UEs |
| 2 | E2 Node Measurement for a single UE | Measurements filtered to one specific UE |
| 3 | Condition-based, UE-level E2 Node Measurement | UE-level measurements for UEs matching subscribed conditions |
| 4 | Common Condition-based, UE-level Measurement | UE-level measurements across multiple metric types with shared conditions |
| 5 | E2 Node Measurement for multiple UEs | Measurements for a named set of UEs |
| 255 | Multiple report measurements | Multiple simultaneous subscriptions (Integrated level) |

Style 255 is functional but has not been tested against available RICs due to limited xApp support for this mode.

For styles 3 and 4, condition checking is not yet implemented; all active UEs are included in reports regardless of the conditions specified in the subscription request.

## Supported Metrics

Each metric is produced by one of three E2 agent instances in the gNB. Each must be enabled separately in the gNB configuration:

- **DU**: the Distributed Unit E2 agent (`enable_du_e2: true`)
- **CU-CP**: the CU Control Plane E2 agent (`enable_cu_cp_e2: true`)
- **CU-UP**: the CU User Plane E2 agent (`enable_cu_up_e2: true`)

Most metrics support the `NO_LABEL` (aggregate) variant only. Where a narrower restriction applies, it is noted in the table.

### Throughput and Data Volume

| Metric | Source | Unit | Notes |
|---|---|---|---|
| `DRB.UEThpDl` | DU | kbps | DL per-UE throughput; NO_LABEL only |
| `DRB.UEThpUl` | DU | kbps | UL per-UE throughput; NO_LABEL only |
| `DRB.RlcSduTransmittedVolumeDL` | DU | kbit | DL RLC transmitted SDU volume (O-RAN); NO_LABEL only |
| `DRB.RlcSduTransmittedVolumeUL` | DU | kbit | UL RLC transmitted SDU volume (O-RAN); NO_LABEL only |

### Latency and Delay

| Metric | Source | Unit | Notes |
|---|---|---|---|
| `DRB.AirIfDelayUl` | DU | ms | UL air interface delay per DRB; NO_LABEL only |
| `DRB.RlcDelayUl` | DU | ms | UL RLC delay per DRB; NO_LABEL only |
| `DRB.PdcpReordDelayUl` | CU-UP | ms | UL PDCP reordering delay; NO_LABEL only |
| `DRB.RlcSduDelayDl` | DU | 0.1 ms | DL RLC SDU delay; NO_LABEL only |

### Physical Resource Block Utilization

| Metric | Source | Unit | Notes |
|---|---|---|---|
| `RRU.PrbTotDl` | DU | % | Total DL PRBs in the scheduling period; NO_LABEL only |
| `RRU.PrbTotUl` | DU | % | Total UL PRBs in the scheduling period; NO_LABEL only |
| `RRU.PrbUsedDl` | DU | — | DL PRBs occupied; NO_LABEL only |
| `RRU.PrbAvailDl` | DU | — | DL PRBs available; NO_LABEL only |
| `RRU.PrbUsedUl` | DU | — | UL PRBs occupied; NO_LABEL only |
| `RRU.PrbAvailUl` | DU | — | UL PRBs available; NO_LABEL only |

### Packet Loss and Success Rates

| Metric | Source | Unit | Notes |
|---|---|---|---|
| `DRB.PacketSuccessRateUlgNBUu` | DU | — | UL packet success rate at the Uu interface; NO_LABEL only |
| `DRB.RlcPacketDropRateDl` | DU | — | DL RLC packet drop rate; NO_LABEL only |
| `DRB.RlcPacketDropRateDL` | DU | — | DL RLC packet drop rate (O-RAN); spec name is `DRB.RlcPacketDropRateDLDist` — subscribe using `DRB.RlcPacketDropRateDL`; NO_LABEL only |

### RRC Connections

These metrics are reported at E2 node level only. UE-level granularity and per-PLMN labels are not supported.

| Metric | Source | Unit | Notes |
|---|---|---|---|
| `RRC.ConnMean` | CU-CP | — | Mean number of RRC-connected UEs |
| `RRC.ConnMax` | CU-CP | — | Peak number of RRC-connected UEs |
| `RRC.ConnEstabAtt` | CU-CP | — | RRC connection setup attempts |
| `RRC.ConnEstabSucc` | CU-CP | — | RRC connection setup successes |
| `RRC.ConnEstabFailCause` | CU-CP | — | RRC setup failure cause; only the `NetworkReject` sub-metric is exposed |
| `RRC.ReEstabAtt` | CU-CP | — | RRC re-establishment attempts |
| `RRC.ReEstabSuccWithUeContext` | CU-CP | — | RRC re-establishment successes with retained UE context |

### UE Context

| Metric | Source | Unit | Notes |
|---|---|---|---|
| `UECNTX.ConnEstabAtt` | CU-CP | — | UE context setup attempts; node-level, NO_LABEL only |
| `UECNTX.ConnEstabSucc` | CU-CP | — | UE context setup successes; node-level, NO_LABEL only |

### RACH

| Metric | Source | Unit | Notes |
|---|---|---|---|
| `RACH.PreambleDedCell` | DU | — | Dedicated RACH preambles received at cell level; NO_LABEL only |

## Extending the Metric Set

Adding support for a new metric involves three steps.

All relevant files are under `lib/e2/e2sm/e2sm_kpm/`.

### Step 1: Confirm the internal measurement exists

Each getter reads from the in-memory data that the provider receives from the gNB stack. Before writing any E2 code, confirm the value you need is already being produced by the relevant subsystem:

| Provider | Member variables | Source structs |
|---|---|---|
| DU | `last_ue_metrics` (scheduler per-slot PRB and PRACH data); `ue_aggr_rlc_metrics` (RLC SDU/PDU byte counts and delays) | `scheduler_cell_metrics`, `rlc_metrics` |
| CU-CP | `cu_cp_metrics` (RRC connection and UE context counters) | `cu_cp_metrics_report` |
| CU-UP | `ue_aggr_pdcp_metrics` (PDCP reordering and delay); `ue_aggr_f1u_metrics` (F1-U counters) | `pdcp_metrics_container`, `f1u_metrics_container` |

If the value is not present in these structs, it must first be added to the relevant gNB subsystem and plumbed into the provider via its `report_metrics()` entry point.

### Step 2: Implement the getter function

Add a getter method to the provider class that corresponds to where the data lives. All getters share the same signature:

```cpp
bool get_my_metric(
    const asn1::e2sm::label_info_list_l          label_info_list,
    const std::vector<asn1::e2sm::ue_id_c>&      ues,
    const std::optional<asn1::e2sm::cgi_c>       cell_global_id,
    std::vector<asn1::e2sm::meas_record_item_c>& items);
```

The body follows the same pattern in every getter:

1. If `ues` is empty, compute one aggregate (node-level) value and push it into `items`.
2. If `ues` is non-empty, iterate over them and push one record per UE from the stored per-UE data.
3. Return `true` if at least one record was added, `false` if no data was available yet.

Existing getters such as `get_prb_avail_dl` (DU, node-level) and `get_drb_dl_mean_throughput` (DU, per-UE) are good templates. Declare the new method in the corresponding header file alongside the existing getter declarations:

| Provider class | Header | Implementation |
|---|---|---|
| `e2sm_kpm_du_meas_provider_impl` | `e2sm_kpm_du_meas_provider_impl.h` | `e2sm_kpm_du_meas_provider_impl.cpp` |
| `e2sm_kpm_cu_cp_meas_provider_impl` | `e2sm_kpm_cu_meas_provider_impl.h` | `e2sm_kpm_cu_meas_provider_impl.cpp` |
| `e2sm_kpm_cu_up_meas_provider_impl` | `e2sm_kpm_cu_meas_provider_impl.h` | `e2sm_kpm_cu_meas_provider_impl.cpp` |

### Step 3: Register the metric

In the constructor of the provider class, add a call to `supported_metrics.emplace()`:

```cpp
supported_metrics.emplace(
    "Metric.Name",
    e2sm_kpm_supported_metric_t{
        NO_LABEL,                   // supported label flags (e.g. NO_LABEL, PLMN_ID_LABEL, FIVE_QI_LABEL)
        E2_NODE_LEVEL | UE_LEVEL,   // supported granularity levels
        false,                      // cell-scope granularity supported
        &e2sm_kpm_du_meas_provider_impl::get_my_metric});
```

Replace `e2sm_kpm_du_meas_provider_impl` with the actual provider class name from the table above.

The declared labels and levels control which RIC subscription parameters the E2 agent accepts, and they are also advertised to the RIC in the RAN Function Definition at E2 setup. They must not exceed what `e2sm_kpm_metric_defs.h` defines for this metric name. The constraint is validated by `check_e2sm_kpm_metrics_definitions()` at startup, which will log an error if a violation is detected.

For contributions that add new metrics, see the [Contributing Guide](../../dev_guide/contributing_guide/index.md).
