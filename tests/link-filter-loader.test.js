// SPDX-FileCopyrightText: Copyright (C) 2021-2026 Software Radio Systems Limited
// SPDX-License-Identifier: BSD-3-Clause-Open-MPI

const linkFilterLoader = require('../plugins/link-filter-loader');

/**
 * Creates a mock webpack loader context for testing.
 */
function createContext({ resourcePath, versionUrl, docsPath } = {}) {
  return {
    resourcePath: resourcePath || '/builds/ocudu/ocudu_docs/docs/tutorials/srsue/index.md',
    getOptions() {
      return { versionUrl, docsPath };
    },
  };
}

/**
 * Runs the loader with the given source and options.
 */
function run(source, options = {}) {
  const context = createContext(options);
  return linkFilterLoader.call(context, source);
}

// Suppress console.log during tests
beforeAll(() => { jest.spyOn(console, 'log').mockImplementation(() => {}); });
afterAll(() => { console.log.mockRestore(); });

describe('link-filter-loader', () => {
  describe('keeps links that should be preserved', () => {
    test('keeps external http links', () => {
      const input = '[Open5GS](https://open5gs.org/)';
      expect(run(input)).toBe(input);
    });

    test('keeps external https links', () => {
      const input = '[GitLab](https://gitlab.com/ocudu/ocudu)';
      expect(run(input)).toBe(input);
    });

    test('keeps mailto links', () => {
      const input = '[Email](mailto:contact@ocudu.org)';
      expect(run(input)).toBe(input);
    });

    test('keeps anchor links', () => {
      const input = '[Section](#overview)';
      expect(run(input)).toBe(input);
    });

    test('keeps image links (png)', () => {
      const input = '[Diagram](./assets/setup.png)';
      expect(run(input)).toBe(input);
    });

    test('keeps image links (jpg)', () => {
      const input = '[Photo](./assets/photo.jpg)';
      expect(run(input)).toBe(input);
    });

    test('keeps image links (svg)', () => {
      const input = '[Logo](./assets/logo.svg)';
      expect(run(input)).toBe(input);
    });

    test('keeps image links case-insensitive', () => {
      const input = '[Image](./assets/DIAGRAM.PNG)';
      expect(run(input)).toBe(input);
    });

    test('keeps links to .md files', () => {
      const input = '[Install](../installation/installation.md)';
      expect(run(input)).toBe(input);
    });

    test('keeps links to .mdx files', () => {
      const input = '[Config](../config_reference/config_reference.mdx)';
      expect(run(input)).toBe(input);
    });

    test('keeps links to .md files with anchors', () => {
      const input = '[Section](./guide.md#setup)';
      expect(run(input)).toBe(input);
    });

    test('keeps links to directories (no extension)', () => {
      const input = '[Tutorials](../tutorials)';
      expect(run(input)).toBe(input);
    });

    test('keeps links to directories (trailing slash)', () => {
      const input = '[User Manual](../user_manual/)';
      expect(run(input)).toBe(input);
    });

    test('keeps links with ftp protocol', () => {
      const input = '[FTP](ftp://example.com/file.tar.gz)';
      expect(run(input)).toBe(input);
    });
  });

  describe('converts non-markdown file links to GitLab URLs', () => {
    const options = {
      versionUrl: 'https://gitlab.com/ocudu/ocudu_docs/-/tree/abc123',
      docsPath: '/builds/ocudu/ocudu_docs',
      resourcePath: '/builds/ocudu/ocudu_docs/docs/tutorials/srsue/index.md',
    };

    // path.relative uses backslashes on Windows, forward slashes on Linux.
    // CI runs on Linux so the URLs are correct there; this helper lets the
    // assertions pass on both platforms.
    const norm = (s) => s.replace(/\\/g, '/');

    test('converts .cpp file links', () => {
      const input = '[Source](../../src/main.cpp)';
      const result = norm(run(input, options));
      expect(result).toBe('[Source](https://gitlab.com/ocudu/ocudu_docs/-/tree/abc123/docs/src/main.cpp)');
    });

    test('converts .h file links', () => {
      const input = '[Header](../include/module.h)';
      const result = norm(run(input, options));
      expect(result).toBe('[Header](https://gitlab.com/ocudu/ocudu_docs/-/tree/abc123/docs/tutorials/include/module.h)');
    });

    test('converts .yml file links', () => {
      const input = '[Config](./configs/gnb.yml)';
      const result = norm(run(input, options));
      expect(result).toBe('[Config](https://gitlab.com/ocudu/ocudu_docs/-/tree/abc123/docs/tutorials/srsue/configs/gnb.yml)');
    });

    test('converts .py file links', () => {
      const input = '[Script](./scripts/run.py)';
      const result = norm(run(input, options));
      expect(result).toBe('[Script](https://gitlab.com/ocudu/ocudu_docs/-/tree/abc123/docs/tutorials/srsue/scripts/run.py)');
    });

    test('converts ./LICENSE link', () => {
      const input = '[License](./LICENSE)';
      const result = norm(run(input, options));
      expect(result).toBe('[License](https://gitlab.com/ocudu/ocudu_docs/-/tree/abc123/docs/tutorials/srsue/LICENSE)');
    });

    test('preserves link text in converted links', () => {
      const input = '[View Source Code](../../src/gnb.cpp)';
      const result = norm(run(input, options));
      expect(result).toBe('[View Source Code](https://gitlab.com/ocudu/ocudu_docs/-/tree/abc123/docs/src/gnb.cpp)');
    });
  });

  describe('strips non-markdown links when no versionUrl is provided', () => {
    test('removes link markup and keeps only text', () => {
      const input = '[Source File](../../src/main.cpp)';
      const result = run(input);
      expect(result).toBe('Source File');
    });

    test('strips .yml links', () => {
      const input = '[Config](./config.yml)';
      const result = run(input);
      expect(result).toBe('Config');
    });

    test('strips ./LICENSE link', () => {
      const input = '[License](./LICENSE)';
      const result = run(input);
      expect(result).toBe('License');
    });
  });

  describe('handles multiple links in one document', () => {
    test('processes each link independently', () => {
      const input = [
        'See [the docs](./guide.md) and [the source](./main.cpp).',
        'Also check [Open5GS](https://open5gs.org/) and [diagram](./arch.png).',
      ].join('\n');

      const result = run(input);

      // .md and external and image links preserved
      expect(result).toContain('[the docs](./guide.md)');
      expect(result).toContain('[Open5GS](https://open5gs.org/)');
      expect(result).toContain('[diagram](./arch.png)');
      // .cpp link stripped
      expect(result).toContain('the source');
      expect(result).not.toContain('[the source](./main.cpp)');
    });
  });

  describe('edge cases', () => {
    test('handles empty source', () => {
      expect(run('')).toBe('');
    });

    test('handles source with no links', () => {
      const input = '# Hello World\n\nThis is plain text.';
      expect(run(input)).toBe(input);
    });

    test('does not touch HTML anchor tags', () => {
      const input = '<a id="section-anchor"></a>';
      expect(run(input)).toBe(input);
    });

    test('handles links with special characters in text', () => {
      const input = '[`gnb_rf_b200.yml`](./configs/gnb_rf_b200.yml)';
      const result = run(input);
      expect(result).toBe('`gnb_rf_b200.yml`');
    });

    test('handles webp images', () => {
      const input = '[Photo](./assets/photo.webp)';
      expect(run(input)).toBe(input);
    });

    test('handles .MDX case-insensitive', () => {
      const input = '[Page](./page.MDX)';
      expect(run(input)).toBe(input);
    });
  });
});
