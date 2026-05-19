---
displayed_sidebar: userDocsSidebar
description: OCUDU development status, current features, roadmap, and release notes.
---

import DocCard from '@theme/DocCard';

# Releases

Development status, current features, and release roadmap for OCUDU. New versions ship every April and October.

<div className="margin-bottom--lg">
  <DocCard item={{type: 'link', href: '/releases/release_notes', label: 'Release Notes', description: 'Per-release changelog covering new features, protocol updates, and fixes for all OCUDU versions.'}} />
</div>

## Development Status

<div className="row" style={{marginBottom: '2rem'}}>
  <div className="col col--4">
    <div style={{textAlign:'center', padding:'1rem 0.75rem', border:'1px solid var(--ifm-color-emphasis-300)', borderRadius:'8px'}}>
      <div style={{fontSize:'1.1rem', fontWeight:'700', color:'var(--ifm-color-primary)'}}>Apr 2026</div>
      <div style={{fontWeight:'600', margin:'0.25rem 0'}}>First Release</div>
      <div style={{fontSize:'0.8rem', color:'var(--ifm-color-emphasis-600)'}}>v26.04 · initial public release</div>
    </div>
  </div>
  <div className="col col--4">
    <div style={{textAlign:'center', padding:'1rem 0.75rem', border:'1px solid var(--ifm-color-emphasis-300)', borderRadius:'8px'}}>
      <div style={{fontSize:'1.1rem', fontWeight:'700', color:'var(--ifm-color-primary)'}}>Active</div>
      <div style={{fontWeight:'600', margin:'0.25rem 0'}}>OCUDU gNB</div>
      <div style={{fontSize:'0.8rem', color:'var(--ifm-color-emphasis-600)'}}>CU-CP · CU-UP · DU</div>
    </div>
  </div>
  <div className="col col--4">
    <div style={{textAlign:'center', padding:'1rem 0.75rem', border:'1px solid var(--ifm-color-emphasis-300)', borderRadius:'8px'}}>
      <div style={{fontSize:'1.1rem', fontWeight:'700', color:'var(--ifm-color-primary)'}}>Active</div>
      <div style={{fontWeight:'600', margin:'0.25rem 0'}}>OCUDU gNB</div>
      <div style={{fontSize:'0.8rem', color:'var(--ifm-color-emphasis-600)'}}>O1 agent · E2 agent</div>
    </div>
  </div>
</div>

## Current Features

<div className="row" style={{marginBottom: '1.5rem'}}>
  <div className="col col--4">
    <h4>Radio &amp; Physical Layer</h4>
    <ul>
      <li>FDD/TDD, all FR1 and FR2 bands</li>
      <li>All bandwidths up to 100 MHz (FR1) and 400 MHz (FR2)</li>
      <li>15, 30, and 120 kHz subcarrier spacing</li>
      <li>All physical channels</li>
      <li>QAM-256, 4x4 MIMO DL and UL</li>
      <li>Optimised LDPC/Polar codecs for ARM Neon and x86 AVX2/AVX512</li>
      <li>SSB-based and CSI-RS-based radio link monitoring</li>
      <li>NTN GEO support</li>
    </ul>
  </div>
  <div className="col col--4">
    <h4>Protocol Stack</h4>
    <ul>
      <li>All RRC and MAC procedures</li>
      <li>All handover and mobility types over NG and Xn (including Conditional HO)</li>
      <li>Robust Header Compression (RoHC)</li>
      <li>RRC_INACTIVE support</li>
      <li>NRPPa using RSRP and SRS</li>
      <li>RAN slicing</li>
    </ul>
  </div>
  <div className="col col--4">
    <h4>Architecture &amp; Deployment</h4>
    <ul>
      <li>CU/DU and CU-CP/CU-UP separation</li>
      <li>Split 7.2 via Open Fronthaul library</li>
      <li>M-plane support via OCUDU helper components</li>
      <li>Hardware accelerator support via DPDK BBDEV</li>
    </ul>
  </div>
</div>

## Roadmap

Planned features by release, through the end of the programme in October 2028.

```mermaid
%%{init: {'theme': 'base', 'themeVariables': {
  'cScale0': '#64B5FF',
  'cScaleLabel0': '#000000',
  'cScale1': '#5a73d3',
  'cScaleLabel1': '#ffffff',
  'cScale2': '#64B5FF',
  'cScaleLabel2': '#000000',
  'cScale3': '#6F8BFF',
  'cScaleLabel3': '#ffffff',
  'cScale4': '#64B5FF',
  'cScaleLabel4': '#000000'
}}}%%
    timeline
        title OCUDU Feature Roadmap 2026-2028
          v26.04 <br> Initial release : FR2 : RoHC : RRC inactive : Xn : M plane
          v26.10 : Beamforming : 8T8R : ORAN Split 7.2b : NSA : NTN Release 17
          v27.04 : MU-MIMO : 64T64R : NTN Release 18
          v27.10 : Multiple BWP : Carrier Aggregation : RedCap
          v28.04 : Dual Connectivity : non-3GPP Access Technologies
```
