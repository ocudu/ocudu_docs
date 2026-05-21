# OCUDU Documentation: Claude Code Instructions

## Project

Docusaurus documentation site for OCUDU (Open Centralized Unit Distributed Unit). All documentation content lives in `docs/` as Markdown files. The site is configured in `docusaurus.config.js` and sidebar navigation is defined in `sidebars_extended.js`.

## Prerequisites

- Docker v20.10 or later. See the [Docker installation guide](https://docs.docker.com/engine/install/).
- Git, with `user.name` and `user.email` configured. Verify before your first commit:
  ```bash
  git config user.name
  git config user.email
  ```
  If either is blank, set them with `git config --global user.name "Your Name"` and `git config --global user.email "you@example.com"`. The DCO sign-off will be malformed without these.

## Local Preview

Start the site with Docker:

```bash
docker compose -f docker-compose.yml up --build
```

Available at http://localhost:3001. If port 3001 is already in use, update the port mapping in `docker-compose.yml`.

Content changes to Markdown files reload automatically. Restart with `--build` if you modify `docusaurus.config.js`, `sidebars_extended.js`, `package.json`, or anything in `src/`. The search index and Doxygen output are only built during deployment and will not work in the local server.

## Key Files

- `docs/`: all documentation content as Markdown files
- `sidebars_extended.js`: sidebar navigation; most pages require a manual entry here
- `docusaurus.config.js`: site configuration and navbar
- `static/img/`: images (each requires a `.license` sidecar file)

## Every New Page Must Have

1. A frontmatter block with `description` and `displayed_sidebar`
2. An entry in `sidebars_extended.js` (file path relative to `docs/`, no `.md` extension, alphabetical order within the section)

Frontmatter template:

```yaml
---
description: "One sentence description."
displayed_sidebar: userDocsSidebar
---
```

`displayed_sidebar` maps to sections of the site:
- `userDocsSidebar`: user manual, tutorials, integrations, migration guide
- `devSidebar`: developer zone (architecture, code guide, contributing)
- `knowledgeBaseSidebar`: knowledge base pages

Every page should open with an H1 heading (`# Page Title`). Docusaurus uses this as the visible page title.

These are the only required frontmatter fields. Other Docusaurus frontmatter keys (`title`, `slug`, `sidebar_label`, `id`) are supported but optional.

Sidebar entry example (inserting a new guide in alphabetical order between existing entries):

```js
items: [
  'integrations/radio_units/benetel',
  'integrations/radio_units/your_new_guide',  // add this line
  'integrations/radio_units/foxconn',
],
```

Use the file path relative to `docs/`, without the `.md` extension. Keeping entries in alphabetical order is a readability convention, not a build requirement.

## File Type: `.md` vs `.mdx`

Use `.md` for all pages by default. Use `.mdx` only when the page requires JSX components (React imports, `className=`, self-closing tags). Renaming to `.mdx` is straightforward if needed later.

## Writing Style

- Active voice: "run the command", not "the command should be run"
- Imperative for instructions: "clone the repository", not "you should clone the repository"
- One topic per sentence
- No em-dashes (—): never write this character in documentation text; use a colon, semicolon, or a new sentence instead
- Quote all commands and file paths with inline code formatting

## Common Build Breakers

- A `description:` value containing `: ` must be wrapped in double quotes or it causes a YAML parse error
- JSX syntax is only valid in `.mdx` files, not `.md` (see [File Type](#file-type-md-vs-mdx) above)
- PNG, JPG, GIF, SVG, PDF, `.woff`, and other binary or generated files in `static/` each require a `.license` sidecar (see below)
- Relative links to other `.md` files must point to a file that exists at that path; verify before committing
- Anchor links (`#heading`) must match an existing heading; verify after any heading rename
- Check for conflict markers (`<<<<<<<`, `=======`, `>>>>>>>`) before committing

## License Sidecars

PNG, JPG, GIF, SVG, PDF, `.woff`, and other binary or generated files added to `static/` each require a `.license` sidecar. Update the end year to the current year:

```
SPDX-FileCopyrightText: Copyright (C) 2021-<current year> Software Radio Systems Limited
SPDX-License-Identifier: BSD-3-Clause-Open-MPI
```

For example, `static/img/my_diagram.png` requires `static/img/my_diagram.png.license`.

## Commits

Before your first commit, verify Git is configured (see [Prerequisites](#prerequisites)).

Sign every commit for DCO compliance. Use the area of work as the scope:

```bash
git commit --signoff -m "<area>: describe what you changed"
```

Common scopes: `tutorials`, `integrations`, `user_manual`, `dev_guide`, `knowledge_base`, `config`, `css`.

---

For the full merge request workflow, repository tree, writing style reference, and extended pitfalls list, see the [Docs Contribution Guide](/dev_guide/contributing_guide/contributing_docs).
