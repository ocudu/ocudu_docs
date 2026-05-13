---
slug: /
title: OCUDU Documentation
sidebar_position: 1
displayed_sidebar: null
hide_table_of_contents: true
hide_title: true
description: OCUDU is an open-source 5G CU/DU implementing the full O-RAN gNB stack. Find installation guides, tutorials, configuration reference, and developer documentation here.
---

import Link from '@docusaurus/Link';
import useBaseUrl from '@docusaurus/useBaseUrl';

<div style={{display: 'flex', gap: '2.5rem', alignItems: 'center', marginBottom: '2.5rem', flexWrap: 'wrap'}}>
  <div style={{flex: '1', minWidth: '280px'}}>
    <p style={{display: 'inline-block', fontSize: '0.8rem', fontWeight: '600', letterSpacing: '0.05em', textTransform: 'uppercase', color: '#52B8F5', background: 'rgba(82, 184, 245, 0.1)', border: '1px solid rgba(82, 184, 245, 0.3)', borderRadius: '999px', padding: '0.25rem 0.85rem', marginBottom: '0.75rem'}}>Open-Source CU/DU · A Linux Foundation Project</p>
    <h1 style={{fontSize: '2.5rem', fontWeight: '700', letterSpacing: '-0.02em', marginTop: '0.25rem', marginBottom: '0.75rem'}}>OCUDU Documentation</h1>
    <p>OCUDU is an open-source 5G gNB implementing the full CU-CP, CU-UP and DU software stack. It is designed for commercial deployment and research, and runs on general-purpose x86 and ARM hardware.</p>
    <p>OCUDU is a <a href="https://www.linuxfoundation.org/">Linux Foundation</a> project, licensed under BSD-3-Clause.</p>
    <div style={{display: 'flex', gap: '1rem', marginTop: '1.5rem', flexWrap: 'wrap'}}>
      <Link className="button button--primary button--lg" to="/user_manual/installation/">Get Started</Link>
      <Link className="button button--secondary button--lg" href="https://gitlab.com/ocudu/ocudu">Get the Code ↗</Link>
    </div>
  </div>
  <div style={{flexShrink: '0', width: '40%', minWidth: '240px'}}>
    <img
      src={useBaseUrl('/img/oran_gnb_arch.svg')}
      alt="OCUDU O-RAN gNB architecture: O-CU-CP, O-CU-UP, O-DU-high, O-DU-low"
      style={{width: '100%', borderRadius: '8px'}}
    />
  </div>
</div>

<div style={{display: 'flex', flexWrap: 'wrap', borderTop: '1px solid var(--ifm-color-emphasis-300)', borderBottom: '1px solid var(--ifm-color-emphasis-300)', margin: '2rem 0'}}>
  {[
    { value: '3GPP R18',         label: 'Standards aligned' },
    { value: 'O-RAN compliant',  label: 'Open interfaces' },
    { value: 'CU/DU split',      label: 'Disaggregated architecture' },
    { value: 'Linux Foundation', label: 'Open governance' },
    { value: 'BSD-3-Clause',     label: 'Permissive licence' },
  ].map(s => (
    <div key={s.value} style={{flex: '1', minWidth: '130px', padding: '1rem', textAlign: 'center'}}>
      <div style={{fontWeight: '700', color: '#52B8F5', fontSize: '0.9rem'}}>{s.value}</div>
      <div style={{fontSize: '0.75rem', opacity: '0.65', marginTop: '0.2rem'}}>{s.label}</div>
    </div>
  ))}
</div>

