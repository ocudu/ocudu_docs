---
description: "How to contribute to the OCUDU documentation: repository structure, adding pages, writing style, and submitting a merge request."
displayed_sidebar: devSidebar
---

# Docs Contribution Guide

This guide is for anyone who wants to improve the OCUDU documentation: adding a new integration guide, writing a tutorial, fixing an error, or expanding existing content. It covers everything you need to go from a local clone to a submitted merge request.

For contributing code to OCUDU, see the [Code Contribution Guide](./index.md).

## Repository Structure

The documentation lives in the [ocudu_docs](https://gitlab.com/ocudu/ocudu_docs) repository. The top-level structure is:

```
ocudu_docs/
├── .gitlab/              # GitLab project configuration and templates
├── .reuse/               # REUSE licence compliance configuration
├── LICENSES/             # Licence texts referenced by SPDX headers
├── docs/                 # All documentation content as Markdown files
│   ├── user_manual/           # Installation, configuration, running, outputs, troubleshooting
│   ├── tutorials/             # Step-by-step tutorials
│   ├── integrations/          # Third-party hardware and core integration guides
│   ├── knowledge_base/        # Background and reference material
│   └── dev_guide/             # Developer and contributor documentation
├── plugins/              # Custom Docusaurus plugins
├── scripts/              # Build scripts
├── src/                  # Custom React components and CSS
│   ├── css/                   # Custom stylesheets
│   ├── pages/                 # Custom React pages
│   └── theme/                 # Docusaurus theme component overrides
├── static/               # Static assets served directly
│   ├── doxygen/               # Doxygen HTML output (mounted from the OCUDU source repo)
│   └── img/                   # Images used in the documentation
├── .env                  # Environment variables for docker-compose
├── .gitignore            # Git ignore rules
├── .gitlab-ci.yml        # GitLab CI/CD pipeline configuration
├── LICENSE               # Project licence
├── README.md             # Repository overview
├── REUSE.toml            # REUSE/SPDX licence compliance configuration
├── docker-compose.yml    # Docker services for the documentation site
├── docusaurus.config.js  # Site configuration, including the top navbar
├── package-lock.json     # Locked dependency versions (auto-generated)
├── package-lock.json.license  # SPDX licence sidecar for package-lock.json
├── package.json          # Node.js dependencies
├── package.json.license  # SPDX licence sidecar for package.json
└── sidebars_extended.js  # Sidebar navigation for all sections
```

The `node_modules/` and `.docusaurus/` directories are generated automatically and do not need to be committed or modified.

## Setting Up a Local Preview

Docker must be installed before running the site. See the [Docker installation guide](https://docs.docker.com/engine/install/) if you have not set it up yet.

Clone the [ocudu_docs](https://gitlab.com/ocudu/ocudu_docs) repository:

```bash
git clone https://gitlab.com/ocudu/ocudu_docs.git
```

If you do not have write access, fork the repository on GitLab first and clone your fork instead. See [Submitting Your Contribution](#submitting-your-contribution) for the full workflow.

From the root of the repository, start the preview server:

```bash
docker compose -f docker-compose.yml up --build
```

The `--build` flag forces Docker to rebuild the container image before starting. Use it the first time you run the site and whenever dependencies change. Without it, Docker reuses a cached image that may be out of date.

The site is available at [http://localhost:3001](http://localhost:3001). If port 3001 is already in use, update the port mapping in `docker-compose.yml`.

Content changes to Markdown files are reflected automatically without restarting the server. If you modify any build files (`docusaurus.config.js`, `sidebars_extended.js`, `package.json`, or the `src/` directory), stop the server and run the command again with `--build` to pick up the changes.

### How the site works

**Docusaurus** renders all `.md` files in the repository automatically:

- Every Markdown file in `docs/` is collected and made accessible by URL.
- Files are excluded only if their path matches an exclusion rule in `docusaurus.config.js`.
- `README.md` files become index pages for their directory.

**Static pages** such as the Doxygen API reference are served directly and accessible at `baseUrl/doxygen/index.html`. Doxygen output is only built during deployment and will not be available in the local development server.

**Search** is powered by [`@easyops-cn/docusaurus-search-local`](https://github.com/easyops-cn/docusaurus-search-local) and indexes all documentation pages locally without any external service. The search index is only built during a production build and will not work in the local development server.

## Adding a New Page

### 1. Create the file

Place the file in the appropriate subdirectory under `docs/`. Use lowercase with underscores for filenames. For a new tutorial, the file goes in `docs/tutorials/<topic>/index.md`.

Use a `.md` extension by default. Use `.mdx` only if the page requires JSX components or React imports. The JSX pitfall in [Common Pitfalls](#common-pitfalls) explains what breaks if you mix these up.

### 2. Add frontmatter

Every page requires a frontmatter block at the top:

```yaml
---
description: "A short description of this page. Quote the value if it contains a colon."
displayed_sidebar: userDocsSidebar
---
```

`description` is used for search results and page metadata. If the value contains a colon followed by a space, wrap it in double quotes. Unquoted colons cause a YAML parse error and break the build.

`displayed_sidebar` tells Docusaurus which sidebar to show when this page is open. Use `userDocsSidebar` for user-facing content, `devSidebar` for developer documentation, and `knowledgeBaseSidebar` for knowledge base pages. Without this field, the sidebar may not display correctly on pages that are not in an autogenerated directory.

These are the only required frontmatter fields. Other Docusaurus frontmatter keys (`title`, `slug`, `sidebar_label`, `id`) are supported but optional.

Every page should open with an H1 heading (`# Page Title`). Docusaurus uses this as the visible page title in the browser and table of contents.

### 3. Register the page in the sidebar

**This step is required.** A new file that is not registered in `sidebars_extended.js` will not appear in the navigation, even though the page itself is accessible by URL.

Open `sidebars_extended.js` and add an entry in the correct section. For example, to add a new integration guide for a radio unit:

```js
items: [
  'integrations/radio_units/benetel',
  'integrations/radio_units/your_new_guide',  // add this line
  'integrations/radio_units/foxconn',
],
```

Use the file path relative to `docs/`, without the `.md` extension. Keep entries in alphabetical order within their section. This is a readability convention, not a build requirement.

Some subdirectories under `docs/` are marked as `autogenerated` in `sidebars_extended.js`. Files added to those directories appear in the sidebar automatically without a manual entry. Most tutorial subdirectories and user manual sections use this mode. Integration guides and developer documentation do not — entries must be added manually.

### 4. Check the navbar

Most pages do not require a navbar change. The navbar links to section index pages, not individual documents. Only add a navbar entry if you are creating a new top-level section of the site.

## Adding a New Integration Guide

Integration guides are the most common community contribution. Before you start, read [Report an integration](../../integrations/report_an_integration.md); it lists the technical details a report should carry and lets you choose between adding a row to a category overview and writing a full guide. A row on an overview page is a complete contribution in itself.

To add a full guide:

1. Create the file at `docs/integrations/radio_units/<vendor>.md`, `docs/integrations/5g_cores/<vendor>/index.md`, or `docs/integrations/switches_and_timing/<vendor>.md` depending on the type.
2. Follow the skeleton below. The [Benetel guide](../../integrations/radio_units/benetel.md) is a worked example of it.
3. Add the file to `sidebars_extended.js` in alphabetical order within the correct category (see step 3 in [Adding a New Page](#adding-a-new-page) above).
4. Add your device to the category overview page, for example `docs/integrations/radio_units/index.md`, and link the new guide from its table row.
5. Add any images to `static/img/` and include a `.license` sidecar alongside each one (see [License sidecars](#license-sidecars) below).

### Integration guide skeleton

Every radio unit guide uses the same headings in the same order, so that a reader who has used one guide can navigate the next one. Keep the heading text as written. Omit a section only if it genuinely does not apply; the [VVDN guide](../../integrations/radio_units/vvdn.md) omits the bring-up sections because the RU side is not documented yet, and says so.

Three sections are optional and appear only where they have content: `## Troubleshooting`, `## Kubernetes and Helm deployment`, and any extra `###` subsections under `## Configuration` such as `### DPDK and SR-IOV configuration`. When present, they go in the order shown below. The [Pegatron guide](../../integrations/radio_units/pegatron.md) uses all three.

```markdown
# <Vendor> <Model>

:::warning
This document is intended to be used as a guide. Variances in firmware and
software versions in local setups may require the sample configuration files
provided to be changed. As a result please closely follow the specific users
guides of your RU in conjunction with this guide.
:::

## Overview

What the device is, a link to the vendor page, and the exact model and firmware
version the guide was written against.

## Configuration

### CU/DU

The OCUDU side: a link to a sample configuration file in `assets/`, and what
cell it produces (band, bandwidth, duplexing, MIMO layers).

### RU

The device side: the commands or management steps needed, with output shown
where it helps the reader confirm they are on track.

## Initializing and connecting to the network

### Initializing the network

Bring-up order, and what a healthy start looks like.

### Connecting to the network

The UE attach, and how to confirm traffic is flowing.

## Troubleshooting

Optional. Symptom and check, for failures specific to this device.

## Kubernetes and Helm deployment

Optional. Helm values and cluster requirements specific to this device.

## Known restrictions

Bandwidths, MIMO configurations, firmware versions, or features that are not
verified or not working, and any part of the setup that is a working example
rather than a requirement. State them plainly; a recorded restriction is more
useful than silence.
```

A short guide that fills in only the Overview and Configuration sections is worth submitting. Later contributors can extend it.

### Keep the overview table in step

Each category overview page, for example [O-RAN Radio Units](../../integrations/radio_units/index.md), carries a table summarising the guides: vendor, model, status, the release the result was recorded against, firmware, and a link to the guide. The table is a summary; the guide is the authoritative record. When you add or change a guide, update its table row to match. Keep notes in the table to a single clause; the long form belongs in the guide's **Known restrictions** section.

Table rows without a guide are expected and fine. A row records that a device was integrated; a guide records how. Adding a row on its own is a complete contribution.

## Writing Style

Follow these rules when writing documentation:

- **Sentence case in headings.** Capitalise the first word and any proper noun or acronym, and nothing else: `## Known restrictions`, `### DPDK and SR-IOV configuration`, `## Kubernetes and Helm deployment`. Not `## Known Restrictions`.
- **Name the device in the page title.** An integration guide's H1 is the vendor followed by the model or family, for example `# Picocom PC802SCB` or `# Benetel RAN550/RAN650`. Docusaurus uses the H1 as the sidebar label, so a bare vendor name leaves the reader guessing which unit the guide covers.
- **Active voice.** Write "run the command" not "the command should be run."
- **Imperative for instructions.** Write "clone the repository" not "you should clone the repository."
- **One topic per sentence.** Split complex sentences rather than joining them with "and" or "but."
- **No em-dashes (—).** Use a colon, semicolon, or a new sentence instead.
- **Quote all commands and file paths** using inline code formatting.

For a full style reference, see the [Hitchhiker's Guide to Documentation](https://docs-guide.readthedocs.io/en/latest/) and the [Diataxis framework](https://diataxis.fr/) for guidance on which type of document to write.

## Common Pitfalls

Check all of the following before submitting a merge request:

- **Missing sidebar entry.** The most common mistake. Every new page must be added to `sidebars_extended.js` manually if its directory is not listed as `autogenerated`.
- **Missing `displayed_sidebar`.** Pages outside an autogenerated directory may show no sidebar at all. Add `displayed_sidebar: userDocsSidebar` (or the appropriate sidebar ID) to the frontmatter of every new page.
- **Unquoted YAML colons.** Any `description:` value that contains `: ` must be wrapped in double quotes.
- **Broken relative links.** Links to other `.md` files use relative paths. Verify that the target file exists at the path you specify.
- **Broken anchor links.** An anchor like `#section-heading` will silently stop working if the target heading is renamed. Verify all anchors after any heading change.
- **Missing `.license` sidecar.** Every PNG, JPG, GIF, SVG, PDF, `.woff`, or other binary or generated file in `static/` requires a `.license` file alongside it. See [License sidecars](#license-sidecars).
- **Bare curly braces.** Docusaurus parses `.md` files as MDX, so `{` and `}` in prose are read as a JSX expression and fail the build. Wrap literal braces in inline code, for example a log line such as `` `{Format B4, ZCZ 0, SCS 30kHz, Rx ports 1}` ``.
- **JSX in `.md` files.** JSX syntax (React components, `className=`, self-closing tags) is only valid in `.mdx` files. Using JSX in a `.md` file will break the build. If your page includes custom components, rename the file to `.mdx`.
- **Conflict markers.** Run `git diff` before committing to confirm no `<<<<<<<`, `=======`, or `>>>>>>>` markers remain in the files.

### License sidecars

PNG, JPG, GIF, SVG, PDF, `.woff`, and other binary or generated files require a `.license` sidecar. Update the end year to the current year:

```
SPDX-FileCopyrightText: Copyright (C) 2021-<current year> Software Radio Systems Limited
SPDX-License-Identifier: BSD-3-Clause-Open-MPI
```

For example, an image at `static/img/my_diagram.png` requires a file at `static/img/my_diagram.png.license` with the above content.

## Submitting Your Contribution

If you have write access to the repository, clone it directly and start from step 2. If you do not have write access, begin with step 1.

1. Fork the [ocudu_docs](https://gitlab.com/ocudu/ocudu_docs) repository on GitLab and clone your fork.
2. Create a branch with a descriptive name using underscores, for example `add_<vendor>_integration_guide` or `fix_<topic>_typos`.
3. Make your changes and verify the local preview looks correct.
4. Verify your Git identity is configured before committing. The DCO sign-off will be malformed without it:
   ```bash
   git config user.name
   git config user.email
   ```
   Set either with `git config --global user.name "Your Name"` if blank.
5. Sign your commits with a Developer Certificate of Origin (DCO) sign-off. The DCO certifies that you wrote the change and have the right to contribute it. Use the area of work as the commit scope:
   ```bash
   git commit --signoff -m "<area>: describe what you changed"
   ```
   Common scopes: `tutorials`, `integrations`, `user_manual`, `dev_guide`, `knowledge_base`, `config`, `css`.
6. Open a merge request against the `main` branch. Describe what you changed and why.

When you open the MR, two automated checks run: a REUSE licence header check and a full Docusaurus build, which enforces broken link detection. Both must pass before the MR can be merged. The pipeline also produces a live preview URL, which appears in the CI job output and lets you review the rendered site before merge.

If you are unsure whether your contribution fits the documentation or have questions at any point, open an issue or ask in the [community channels](/community/).
