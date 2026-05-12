---
displayed_sidebar: userDocsSidebar
description: Step-by-step guides from your first gNB to advanced multi-component deployments.
---

import DocCard from '@theme/DocCard';

# Tutorials

Step-by-step guides from your first gNB to advanced multi-component deployments. Each tutorial has a single goal: follow it in order and you will have a working system by the end.

Choose a starting point based on your available hardware and experience with OCUDU.

:::tip Start here if you are new to OCUDU
The [Testmode](./testmode/index.md) tutorial requires only an installed OCUDU build, with no radio hardware or physical UE. Once you have a working system, the [srsUE](./srsue/index.md) tutorial adds a software UE over ZeroMQ.
:::

## Beginner

No specialist hardware required.

<section className="row">
  <article className="col col--6 margin-bottom--lg">
    <DocCard item={{type: 'link', href: '/tutorials/srsue/', label: 'OCUDU with srsUE', description: 'Build a complete open-source 5G network using srsUE as the UE and Open5GS as the core, connected over ZeroMQ.'}} />
  </article>
</section>

## Intermediate

Requires a USRP RF front-end or a commercial UE.

<section className="row">
  <article className="col col--6 margin-bottom--lg">
    <DocCard item={{type: 'link', href: '/tutorials/cots_ue/', label: 'COTS UE', description: 'Connect a commercial 5G device to OCUDU using a test SIM and a USRP RF front-end.'}} />
  </article>
  <article className="col col--6 margin-bottom--lg">
    <DocCard item={{type: 'link', href: '/tutorials/amari_ue/', label: 'Amarisoft UE', description: 'Connect an Amarisoft UE simulator to OCUDU for multi-UE testing scenarios.'}} />
  </article>
  <article className="col col--6 margin-bottom--lg">
    <DocCard item={{type: 'link', href: '/tutorials/handover/', label: 'Handover', description: 'Configure and test intra-gNB handover between two OCUDU cells with a COTS UE.'}} />
  </article>
</section>

## Advanced

Requires specialist infrastructure: an O-RAN RU or a Near-RT RIC.

<section className="row">
  <article className="col col--6 margin-bottom--lg">
    <DocCard item={{type: 'link', href: '/tutorials/oranru/', label: 'O-RAN RU', description: 'Connect an O-RAN-compliant radio unit to OCUDU over the split 7.2 fronthaul interface.'}} />
  </article>
  <article className="col col--6 margin-bottom--lg">
    <DocCard item={{type: 'link', href: '/tutorials/near-rt-ric/', label: 'Near-RT RIC', description: 'Use the E2 interface to integrate OCUDU with a Near-RT RIC and deploy an xApp.'}} />
  </article>
  <article className="col col--6 margin-bottom--lg">
    <DocCard item={{type: 'link', href: '/tutorials/ntn/', label: 'NTN', description: 'Configure OCUDU for a 5G NR Non-Terrestrial Network deployment.'}} />
  </article>
</section>

## Deployment Optimisation

Performance optimisation for OCUDU deployments.

<section className="row">
  <article className="col col--6 margin-bottom--lg">
    <DocCard item={{type: 'link', href: '/tutorials/testmode/', label: 'Testmode', description: 'Verify your OCUDU installation and explore the configuration without radio hardware or a physical UE.'}} />
  </article>
  <article className="col col--6 margin-bottom--lg">
    <DocCard item={{type: 'link', href: '/tutorials/dpdk/', label: 'DPDK', description: 'Configure DPDK for high-performance fronthaul connectivity with OCUDU.'}} />
  </article>
  <article className="col col--6 margin-bottom--lg">
    <DocCard item={{type: 'link', href: '/tutorials/matlab/', label: 'MATLAB', description: 'Integrate MATLAB with OCUDU for signal processing, analysis, and algorithm prototyping.'}} />
  </article>
  <article className="col col--6 margin-bottom--lg">
    <DocCard item={{type: 'link', href: '/tutorials/tuning/', label: 'Performance Tuning', description: 'Tune a Linux host for maximum OCUDU performance in production.'}} />
  </article>
</section>

## Orchestration

Distributed and containerised OCUDU deployments.

<section className="row">
  <article className="col col--6 margin-bottom--lg">
    <DocCard item={{type: 'link', href: '/tutorials/k8s/', label: 'Kubernetes', description: 'Deploy OCUDU in a split 7.2 architecture using Kubernetes.'}} />
  </article>
  <article className="col col--6 margin-bottom--lg">
    <DocCard item={{type: 'link', href: '/tutorials/cu_du_split/', label: 'CU/DU Split', description: 'Deploy OCUDU with the CU and DU running as separate processes, connected over the F1 interface.'}} />
  </article>
</section>
