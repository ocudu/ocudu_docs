# OCUDU Documentation

This directory contains the documentation infrastructure for the OCUDU project.
This also includes automated API documentation generation (Doxygen) and a markdown-based documentation site (Docusaurus). The software architecture documentation as well as the Doxygen content is imported from the main OCUDU repository.

## Structure

```txt
ocudu_docs/
├── .env                     # env file for docker-compose
├── docker-compose.yml       # Docker services for documentation
├── docusaurus.config.js     # Docusaurus site configuration
├── docs/                    # Markdown files for documentation
└── README.md                # This file
```

## Docker Services

### Usage

1. Start services

```bash
docker compose -f docker-compose.yml up
```

**Access:** [http://localhost:3001](http://localhost:3001)

## Docusaurus

### Automatically rendering of .md files in the repository

1. It collects all markdown files anywhere in the repository (except excluded paths)
2. Files appear in the sidebar and are searchable
3. README.md files become index pages for their directory

### Static Pages

Static HTML reports (like doxygen) will be accessible via `baseUrl/doxygen/index.html`.

### More Features

- **Search**: Local search powered by `@easyops-cn/docusaurus-search-local`.
