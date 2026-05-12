---
displayed_sidebar: devSidebar
description: Code standards, logging conventions, testing requirements, and the contribution process for OCUDU.
---

import DocCard from '@theme/DocCard';

# Developer Zone

Everything you need to contribute to OCUDU: code style, logging conventions, testing requirements, and the full merge request process.

:::tip First contribution?
Read the [Contribution Guidelines](./contributing_guide/index.md) for an overview of the process, then check the GitLab issue tracker for issues labelled `good first issue`.
:::

## Architecture

<section className="row">
  <article className="col col--6 margin-bottom--lg">
    <DocCard item={{type: 'link', href: '/dev_guide/architecture_guide/', label: 'Architecture Guide', description: 'Vision, design principles, and implementation patterns for the OCUDU codebase.'}} />
  </article>
</section>

## Code Standards

The conventions that keep the OCUDU codebase consistent and readable. Familiarise yourself with these before opening a merge request.

<section className="row">
  <article className="col col--6 margin-bottom--lg">
    <DocCard item={{type: 'link', href: '/dev_guide/code_guide/', label: 'C++ Code Guide', description: 'Language choices, library usage, source structure, naming conventions, and commit message formatting.'}} />
  </article>
  <article className="col col--6 margin-bottom--lg">
    <DocCard item={{type: 'link', href: '/dev_guide/logging_guide/', label: 'Logging Guide', description: 'Log levels, subsystem tags, and formatting rules for the OCUDU logging framework.'}} />
  </article>
  <article className="col col--6 margin-bottom--lg">
    <DocCard item={{type: 'link', href: '/dev_guide/testing_policy/', label: 'Testing Policy', description: 'Test coverage expectations for each type of contribution: unit, integration, and system tests.'}} />
  </article>
</section>

## Contributing

<section className="row">
  <article className="col col--6 margin-bottom--lg">
    <DocCard item={{type: 'link', href: '/dev_guide/contributing_guide/', label: 'Contribution Guidelines', description: 'Ways to contribute, how to propose ideas, opening merge requests, and licensing requirements.'}} />
  </article>
  <article className="col col--6 margin-bottom--lg">
    <DocCard item={{type: 'link', href: '/dev_guide/reporting/', label: 'Reporting Issues', description: 'How to report bugs and feature requests via GitLab issues. Security vulnerabilities use a separate responsible disclosure process.'}} />
  </article>
</section>

## API Reference

<section className="row">
  <article className="col col--6 margin-bottom--lg">
    <DocCard item={{type: 'link', href: 'pathname:///doxygen/index.html', label: 'Doxygen', description: 'Auto-generated API reference for the OCUDU codebase, built from source documentation.'}} />
  </article>
</section>
