// SPDX-FileCopyrightText: Copyright (C) 2021-2026 Software Radio Systems Limited
// SPDX-License-Identifier: BSD-3-Clause-Open-MPI

// Generates docs/general/5_release_notes.md from the CHANGELOG in the cloned OCUDU repo.
// The OCUDU repo is cloned to docs/ocudu/ during CI build (see .gitlab-ci.yml).
// If the CHANGELOG is not found (e.g. local dev without the clone), the script exits
// without modifying the existing release notes file.

const fs = require('fs');
const path = require('path');

const changelogPath = path.resolve(__dirname, '../docs/ocudu/CHANGELOG');
const outputPath = path.resolve(__dirname, '../docs/general/5_release_notes.md');

if (!fs.existsSync(changelogPath)) {
  console.log('[release-notes] docs/ocudu/CHANGELOG not found — skipping generation.');
  process.exit(0);
}

const changelogContent = fs.readFileSync(changelogPath, 'utf8');

// Preserve the sidebar position derived from the filename prefix (5_).
// Use sidebar_label to keep "Release Notes" as the nav entry regardless of
// whatever heading the CHANGELOG itself starts with.
const frontmatter = `---
sidebar_label: Release Notes
---

`;

fs.writeFileSync(outputPath, frontmatter + changelogContent);
console.log('[release-notes] Generated docs/general/5_release_notes.md from docs/ocudu/CHANGELOG.');
