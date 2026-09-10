---
description: "Which 5G cores have been used with OCUDU, what was recorded for each, and how to report a new one."
displayed_sidebar: userDocsSidebar
---

# 5G Cores

5G cores that have been used with OCUDU, and what was recorded for each.

## Documented cores

| Core | Notes |
| --- | --- |
| [Ella Core](ella_core/index.md) | Single binary for private networks. The guide covers a co-hosted deployment with OCUDU. |
| Open5GS | Recommended in [Running OCUDU](../../user_manual/running/running.md) and used as the core throughout the [tutorials](../../tutorials/index.md). No dedicated guide yet. |

**Where to look.** A core name that is a link has a guide, and that guide is the authoritative record for it; where a guide and this table disagree, the guide is correct and the table needs fixing.

:::info
**Any core that implements the NG interfaces is a candidate.** The OCUDU CU-CP terminates N2 (NGAP) towards the AMF over SCTP, and the CU-UP terminates N3 (GTP-U) towards the UPF. Nothing in that path is specific to a core implementation, so this table records what has been documented, not what is supported.

To use a core that is not listed, start from [Running OCUDU](../../user_manual/running/running.md) for the gNB side and the core's own documentation for the rest. Then [report the result](../report_an_integration.md). An incomplete guide is better than none, and a core that did not work is still worth recording.
:::

## Report an integration

See [Report an integration](../report_an_integration.md) for the details a report should carry and how to submit it. A dedicated Open5GS guide would be a useful contribution, since it is the core most OCUDU users start with.
