// SPDX-FileCopyrightText: Copyright (C) 2021-2026 Software Radio Systems Limited
// SPDX-License-Identifier: BSD-3-Clause-Open-MPI

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const SCRIPT = path.resolve(__dirname, '../scripts/generate-release-notes.js');
const CHANGELOG_DIR = path.resolve(__dirname, '../docs/ocudu');
const CHANGELOG_PATH = path.join(CHANGELOG_DIR, 'CHANGELOG');
const OUTPUT_PATH = path.resolve(__dirname, '../docs/releases/release_notes.md');

describe('generate-release-notes', () => {
  let originalOutput;

  beforeAll(() => {
    // Save original output file if it exists
    if (fs.existsSync(OUTPUT_PATH)) {
      originalOutput = fs.readFileSync(OUTPUT_PATH, 'utf8');
    }
  });

  afterAll(() => {
    // Restore original output file
    if (originalOutput !== undefined) {
      fs.writeFileSync(OUTPUT_PATH, originalOutput);
    } else if (fs.existsSync(OUTPUT_PATH)) {
      fs.unlinkSync(OUTPUT_PATH);
    }
    // Clean up test CHANGELOG
    if (fs.existsSync(CHANGELOG_PATH)) {
      fs.unlinkSync(CHANGELOG_PATH);
    }
    if (fs.existsSync(CHANGELOG_DIR) && fs.readdirSync(CHANGELOG_DIR).length === 0) {
      fs.rmdirSync(CHANGELOG_DIR);
    }
  });

  afterEach(() => {
    // Clean up CHANGELOG between tests
    if (fs.existsSync(CHANGELOG_PATH)) {
      fs.unlinkSync(CHANGELOG_PATH);
    }
  });

  test('exits silently when CHANGELOG does not exist', () => {
    // Ensure no CHANGELOG exists
    if (fs.existsSync(CHANGELOG_PATH)) {
      fs.unlinkSync(CHANGELOG_PATH);
    }

    const result = execSync(`node "${SCRIPT}"`, { encoding: 'utf8' });
    expect(result).toContain('not found');
  });

  test('generates release notes with frontmatter when CHANGELOG exists', () => {
    fs.mkdirSync(CHANGELOG_DIR, { recursive: true });
    fs.writeFileSync(CHANGELOG_PATH, '# Changelog\n\n## v26.04\n\n- Feature A\n- Feature B\n');

    execSync(`node "${SCRIPT}"`, { encoding: 'utf8' });

    const output = fs.readFileSync(OUTPUT_PATH, 'utf8');
    expect(output).toMatch(/^---\nsidebar_label: Release Notes\n---\n\n/);
    expect(output).toContain('# Changelog');
    expect(output).toContain('- Feature A');
    expect(output).toContain('- Feature B');
  });

  test('handles empty CHANGELOG file', () => {
    fs.mkdirSync(CHANGELOG_DIR, { recursive: true });
    fs.writeFileSync(CHANGELOG_PATH, '');

    execSync(`node "${SCRIPT}"`, { encoding: 'utf8' });

    const output = fs.readFileSync(OUTPUT_PATH, 'utf8');
    expect(output).toMatch(/^---\nsidebar_label: Release Notes\n---\n\n$/);
  });

  test('overwrites existing output file', () => {
    fs.writeFileSync(OUTPUT_PATH, 'old content');
    fs.mkdirSync(CHANGELOG_DIR, { recursive: true });
    fs.writeFileSync(CHANGELOG_PATH, '# New Content');

    execSync(`node "${SCRIPT}"`, { encoding: 'utf8' });

    const output = fs.readFileSync(OUTPUT_PATH, 'utf8');
    expect(output).toContain('# New Content');
    expect(output).not.toContain('old content');
  });
});
