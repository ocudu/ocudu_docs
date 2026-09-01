// SPDX-FileCopyrightText: Copyright (C) 2021-2026 Software Radio Systems Limited
// SPDX-License-Identifier: BSD-3-Clause-Open-MPI

// Prepares the built Docusaurus HTML for PDF rendering.
//
// docs-to-pdf loads each page in headless Chromium. Two problems arise:
//
//   1. Tabbed content (Tabs/TabItem) only shows the active panel; the others
//      carry a `hidden` attribute, so a naive PDF loses every inactive tab.
//   2. Mermaid diagrams are rendered client-side by @docusaurus/theme-mermaid —
//      the built HTML only contains the raw graph definition, not an <svg>.
//
// A previous approach stripped all Docusaurus JS bundles so React could not
// re-hide the tab panels. That fixed the tabs but killed Mermaid, because the
// diagrams need JS to render (see MR !83 review).
//
// This script instead loads each page WITH JS in Puppeteer, waits for Mermaid
// to finish drawing its SVG, then performs the tab surgery (unhide panels,
// inject a label per panel, hide the interactive tab bar) directly on the live
// DOM. It serializes the result back to disk as static HTML. When docs-to-pdf
// later loads that static file, there is no JS to strip and nothing to
// re-hydrate: the diagrams are already inline SVG and the tabs are already
// expanded.
//
// Usage: node scripts/prepare-pdf-html.js <baseUrl> <buildDir>
//   baseUrl  - URL the built site is being served from (e.g. http://localhost:3000)
//   buildDir - directory containing the built HTML (e.g. public)

const fs = require('fs');
const path = require('path');

const BASE_URL = process.argv[2] || 'http://localhost:3000';
const BUILD_DIR = process.argv[3] || 'public';

// Puppeteer drives headless Chromium. We prefer puppeteer-core (no bundled
// browser download) since the CI job installs Chromium system-wide and points
// PUPPETEER_EXECUTABLE_PATH at it. Fall back to the full puppeteer package if
// that's what is present locally.
let puppeteer;
try {
  puppeteer = require('puppeteer-core');
} catch (e) {
  puppeteer = require('puppeteer');
}

const EXECUTABLE_PATH = process.env.PUPPETEER_EXECUTABLE_PATH || undefined;

// Collect every .html file under the build directory, returning paths relative
// to the build root (used to build the matching served URL).
function collectHtml(dir, root, out) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      collectHtml(full, root, out);
    } else if (entry.name.endsWith('.html')) {
      out.push(path.relative(root, full));
    }
  }
  return out;
}

// Convert a build-relative file path to the URL path Docusaurus serves it at.
// foo/index.html -> /foo/   ;   foo/bar.html -> /foo/bar.html
function fileToUrlPath(relFile) {
  const posix = relFile.split(path.sep).join('/');
  if (posix === 'index.html') return '/';
  if (posix.endsWith('/index.html')) {
    return '/' + posix.slice(0, -'index.html'.length);
  }
  return '/' + posix;
}

// Runs inside the page context. Waits for Mermaid, then rewrites tabs.
// Returns a small summary so the Node side can log/verify.
/* eslint-disable no-undef */
function transformInPage() {
  const summary = { mermaid: 0, tabGroups: 0 };

  // Count rendered Mermaid diagrams (theme-mermaid marks containers and injects
  // an <svg> once drawing completes).
  summary.mermaid = document.querySelectorAll(
    '.docusaurus-mermaid-container svg, .mermaid svg, [data-mermaid] svg'
  ).length;

  // Expand every tab group: reveal hidden panels, label each panel with its
  // tab text, and hide the now-redundant interactive tab bar.
  const tabLists = document.querySelectorAll('ul[role="tablist"]');
  tabLists.forEach((ul) => {
    const labels = Array.from(ul.querySelectorAll('li[role="tab"]')).map((li) =>
      li.textContent.trim()
    );
    if (labels.length < 2) return;

    // The panels are siblings of the tablist within the tabs container.
    const container = ul.closest('.tabs-container') || ul.parentElement;
    if (!container) return;
    const panels = container.querySelectorAll('div[role="tabpanel"]');

    panels.forEach((panel, idx) => {
      panel.removeAttribute('hidden');
      panel.style.display = 'block';
      if (!panel.querySelector('.pdf-tab-label')) {
        const label = document.createElement('div');
        label.className = 'pdf-tab-label';
        label.textContent = labels[idx] || '';
        label.style.cssText =
          'font-weight:700;font-size:0.9em;padding:4px 0 8px;' +
          'border-bottom:1px solid #dee2e6;margin-bottom:8px;';
        panel.insertBefore(label, panel.firstChild);
      }
      panel.style.border = '1px solid #dee2e6';
      panel.style.padding = '12px 16px';
      panel.style.marginBottom = '1rem';
      panel.style.borderRadius = '4px';
    });

    ul.style.display = 'none';
    summary.tabGroups += 1;
  });

  return summary;
}
/* eslint-enable no-undef */

async function main() {
  const buildRoot = path.resolve(BUILD_DIR);
  const files = collectHtml(buildRoot, buildRoot, []);

  const browser = await puppeteer.launch({
    executablePath: EXECUTABLE_PATH,
    args: ['--no-sandbox', '--disable-gpu', '--disable-dev-shm-usage'],
    protocolTimeout: 300000,
  });

  let processed = 0;
  let mermaidTotal = 0;
  let tabTotal = 0;

  try {
    const page = await browser.newPage();
    for (const relFile of files) {
      const urlPath = fileToUrlPath(relFile);
      const url = BASE_URL.replace(/\/$/, '') + urlPath;

      try {
        await page.goto(url, { waitUntil: 'networkidle0', timeout: 60000 });
      } catch (err) {
        console.warn(`[prepare-pdf] navigation failed for ${url}: ${err.message}`);
        continue;
      }

      // If the page has Mermaid source, wait until the SVG is drawn. Docusaurus
      // renders asynchronously, so poll for the injected <svg>.
      const hasMermaid = await page.evaluate(
        () =>
          !!document.querySelector(
            '.docusaurus-mermaid-container, .mermaid, [data-mermaid]'
          )
      );
      if (hasMermaid) {
        try {
          await page.waitForFunction(
            () =>
              document.querySelectorAll(
                '.docusaurus-mermaid-container svg, .mermaid svg, [data-mermaid] svg'
              ).length > 0,
            { timeout: 30000 }
          );
        } catch (err) {
          console.warn(`[prepare-pdf] Mermaid did not render on ${url}: ${err.message}`);
        }
      }

      const summary = await page.evaluate(transformInPage);
      mermaidTotal += summary.mermaid;
      tabTotal += summary.tabGroups;

      // Serialize the fully-rendered DOM (doctype + documentElement) and write
      // it back over the static file so the later docs-to-pdf pass uses it.
      const html = await page.evaluate(
        () => '<!DOCTYPE html>\n' + document.documentElement.outerHTML
      );
      fs.writeFileSync(path.join(buildRoot, relFile), html);
      processed += 1;
    }
  } finally {
    await browser.close();
  }

  console.log(
    `[prepare-pdf] processed ${processed} pages; ` +
      `${mermaidTotal} Mermaid diagrams rendered; ${tabTotal} tab groups expanded.`
  );
}

main().catch((err) => {
  console.error('[prepare-pdf] fatal:', err);
  process.exit(1);
});
