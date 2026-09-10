---
description: "Connecting a VVDN O-RAN radio unit to OCUDU over the split 7.2 Open Fronthaul interface."
---

# VVDN n78 indoor RU

:::warning
This document is intended to be used as a guide. Variances in firmware and software versions in local setups may require the sample configuration files provided to be changed. As a result please closely follow the specific users guides of your RU in conjunction with this guide.
:::

:::info
This page is a partial guide. The CU/DU side is covered by a working sample configuration; the RU side is not documented yet. If you complete this integration, please [report it](../report_an_integration.md) so the missing half can be filled in.
:::

## Overview

This page covers using OCUDU with O-RUs from [VVDN](https://www.vvdntech.com/) over the O-RAN 7.2 split.

The recorded result is for the VVDN n78 indoor RU on firmware v3.0.5, verified against release 24.1. See the [O-RAN Radio Units overview](index.md) for how to read that. A VVDN n78 outdoor RU also exists, but no result has been recorded against it.

---

## Configuration

### CU/DU

Download the [sample gNB configuration file](assets/gnb_ru_vvdn_tdd_n78_100mhz.yml) for the indoor VVDN RU.

This configuration creates a 100 MHz SISO TDD cell in band n78. The fronthaul parameters are in the `ru_ofh` section; see the [configuration reference](../../user_manual/config_reference/config_reference.mdx) for what each one does.

### RU

The RU-side configuration steps are not documented here yet. Use the VVDN documentation for your model, and the [Connecting an O-RAN 7.2 radio unit](../../tutorials/oranru/index.md) tutorial for the hardware-agnostic parts of the setup. Ask in the [community discussions](https://gitlab.com/ocudu/community/discussions) if you hit problems.

---

## Known restrictions

- The sample configuration has been used at 100 MHz SISO only. Other bandwidths and MIMO configurations are untested rather than known to fail.
- The RU-side configuration procedure is not documented here.
- The recorded result is for the indoor unit. No result is recorded for the VVDN n78 outdoor RU.
