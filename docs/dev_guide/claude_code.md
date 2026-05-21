---
description: "Using Claude Code to work on the OCUDU documentation with a pre-configured agent context file."
displayed_sidebar: devSidebar
---

# Using Claude Code

[Claude Code](https://claude.ai/code) is an AI coding assistant that reads a `CLAUDE.md` file from the root of a repository to understand project conventions before starting work. A pre-configured `CLAUDE.md` is available for the `ocudu_docs` repository. Support for the OCUDU source repository is in progress.

## Documentation

The `CLAUDE.md` for `ocudu_docs` gives the agent the context it needs to work on the documentation: the repository structure, writing conventions, sidebar registration rules, frontmatter requirements, and common build pitfalls.

Download the file and save it as `CLAUDE.md` in the root of your cloned `ocudu_docs` repository. The file is served from `static/CLAUDE.md` in the repository:

[Download CLAUDE.md](pathname:///CLAUDE.md)

Open Claude Code from the root of the repository. It will read the file automatically. Some tasks you can ask it to handle:

- Add a new integration guide for a vendor, including the file, frontmatter, and sidebar entry
- Check a page for style issues against the rules in the [Docs Contribution Guide](./contributing_guide/contributing_docs.md)
- Run through the common pitfalls checklist before submitting a merge request
