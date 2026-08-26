// SPDX-FileCopyrightText: Copyright (C) 2021-2026 Software Radio Systems Limited
// SPDX-License-Identifier: BSD-3-Clause-Open-MPI

// Generates docs/dev_guide/codebase_guide/ from the markdown files under lib/ in the cloned
// OCUDU repo. The OCUDU repo is cloned to docs/ocudu/ during CI build (see .gitlab-ci.yml);
// set OCUDU_SOURCE_PATH to point at a local checkout instead.
//
// The source repo is canonical. This script transforms structure only (paths, links, frontmatter,
// assets) and never edits the text: a substitution here would put content on the site that the
// developer cannot see in their own file.
//
// If lib/ is not found the script writes a placeholder index page and exits, so a build without
// the clone still succeeds.

const fs = require('fs');
const path = require('path');

const REPO_ROOT = path.resolve(__dirname, '..');
const SOURCE_ROOT = process.env.OCUDU_SOURCE_PATH
  ? path.resolve(process.env.OCUDU_SOURCE_PATH)
  : path.join(REPO_ROOT, 'docs', 'ocudu');
const LIB_ROOT = path.join(SOURCE_ROOT, 'lib');

const OUT_REL = path.join('docs', 'dev_guide', 'codebase_guide');
const INDEX_REL = path.join('docs', 'dev_guide', 'codebase_guide.md');
const OUT_ROOT = path.join(REPO_ROOT, OUT_REL);
const URL_BASE = '/dev_guide/codebase_guide';

const SECTION_LABEL = 'Codebase Guide';
const SIDEBAR = 'devSidebar';

// Directory prefixes, relative to lib/. Mirroring the source tree would contradict the
// architecture the pages describe: MAC, RLC and the scheduler are siblings of du/ in the
// source, but MAC and RLC are DU-high components and the scheduler lives inside MAC.
const DIR_MAP = {
  'cu_cp': 'cu/cu_cp',
  'cu_up': 'cu/cu_up',
  'mac': 'du/du_high/mac',
  'rlc': 'du/du_high/rlc',
  'scheduler': 'du/du_high/mac/scheduler',
};

// Directories that exist only in the output. lib/ has no cu/ parent the way it has du/, so the
// CU grouping has no upstream index page; Docusaurus builds one listing its children.
const SYNTHETIC_CATEGORIES = {
  'cu': { label: 'Centralized Unit', position: 1 },
};

// Files whose destination is outside the generated section. log_reference.md explains how to
// read SCHED output at runtime, which is operator material rather than architecture.
const FILE_MAP = {
  'scheduler/log_reference.md': {
    out: path.join('docs', 'user_manual', 'outputs', 'scheduler_logs.md'),
    url: '/user_manual/outputs/scheduler_logs',
    position: 2,
    sidebar: 'userDocsSidebar',
  },
};

// Sidebar ordering, keyed by output path without extension. Directories become
// _category_.json entries, files get sidebar_position frontmatter.
const POSITION = {
  'cu/cu_cp': 1,
  'cu/cu_up': 2,
  'du': 2,
  'du/du_high': 1,
  'du/du_low': 2,
  'du/du_high/du_manager': 1,
  'du/du_high/mac': 2,
  'du/du_high/rlc': 3,
  'du/du_high/mac/procedures': 1,
  'du/du_high/mac/scheduler': 2,
  'du/du_high/rlc/rlc_am': 1,
};

// Lines that only exist to navigate the source tree. The sidebar does this job on the site.
const NAV_CRUFT = /^\s*\[Return to top level architecture diagram\]\([^)]*\)\.?\s*$/;

const LICENSE_SIDECAR =
  'SPDX-FileCopyrightText: Copyright (C) 2021-2026 Software Radio Systems Limited\n' +
  'SPDX-License-Identifier: BSD-3-Clause-Open-MPI\n';

const IMAGE_RE = /!\[([^\]]*)\]\(([^)\s]+)\)/g;
const LINK_RE = /(?<!!)\[([^\]]*)\]\(([^)\s]+)\)/g;

// ---------------------------------------------------------------------------- path resolution

// Destination of a lib-relative markdown path, as a pure function. Link rewriting reuses this,
// which is why no hand-maintained link table is needed.
function destinationOf(libRel) {
  if (libRel.toLowerCase() === 'readme.md') {
    return { external: false, out: INDEX_REL, url: `${URL_BASE}/`, outDir: '', isIndex: true, key: '' };
  }

  const mapped = FILE_MAP[libRel];
  if (mapped) return { external: true, out: mapped.out, url: mapped.url, position: mapped.position, sidebar: mapped.sidebar };

  const dir = path.posix.dirname(libRel) === '.' ? '' : path.posix.dirname(libRel);
  const base = path.posix.basename(libRel);

  let outDir = dir;
  for (const [from, to] of Object.entries(DIR_MAP)) {
    if (dir === from || dir.startsWith(from + '/')) {
      outDir = to + dir.slice(from.length);
      break;
    }
  }

  const isIndex = base.toLowerCase() === 'readme.md';
  const outBase = isIndex ? 'index.md' : base;
  const outRel = outDir ? path.posix.join(outDir, outBase) : outBase;

  const slug = base.replace(/\.md$/i, '');
  const url = isIndex
    ? (outDir ? `${URL_BASE}/${outDir}/` : `${URL_BASE}/`)
    : (outDir ? `${URL_BASE}/${outDir}/${slug}` : `${URL_BASE}/${slug}`);

  return { external: false, out: path.join(OUT_REL, outRel), url, outDir, isIndex, key: outDir ? path.posix.join(outDir, slug) : slug };
}

function walk(dir, base, acc) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    const rel = base ? path.posix.join(base, entry.name) : entry.name;
    if (entry.isDirectory()) walk(full, rel, acc);
    else if (entry.isFile() && entry.name.toLowerCase().endsWith('.md')) acc.push(rel);
  }
  return acc;
}

// ---------------------------------------------------------------------------- transformation

function firstParagraph(body) {
  const lines = body.split('\n');
  let i = 0;
  while (i < lines.length && !/^#\s/.test(lines[i])) i++;
  i++;
  // Skip blank lines and standalone images, which several pages place directly under the H1.
  const skippable = (line) => line.trim() === '' || /^!\[[^\]]*\]\([^)]*\)\s*$/.test(line.trim());
  while (i < lines.length && skippable(lines[i])) i++;
  const para = [];
  while (i < lines.length && lines[i].trim() !== '' && !/^[#>|\-*`]/.test(lines[i])) {
    para.push(lines[i].trim());
    i++;
  }
  let text = para.join(' ')
    .replace(IMAGE_RE, '')
    .replace(LINK_RE, '$1')
    .replace(/`/g, '')
    .replace(/\s+/g, ' ')
    .trim();
  if (text.length > 180) {
    text = text.slice(0, 180);
    text = text.slice(0, text.lastIndexOf(' ')) + '...';
  }
  return text;
}

function headingOf(body) {
  const m = body.match(/^#\s+(.+)$/m);
  return m ? m[1].trim() : null;
}

function yamlString(s) {
  return '"' + s.replace(/\\/g, '\\\\').replace(/"/g, '\\"') + '"';
}

function isExternal(target) {
  return /^([a-z][a-z0-9+.-]*:|\/\/|#|\/)/i.test(target);
}

// Copies an asset next to the page that references it, with its REUSE sidecar.
function copyAsset(srcAbs, outDirAbs) {
  if (!fs.existsSync(srcAbs)) return null;
  const assetsDir = path.join(outDirAbs, 'assets');
  fs.mkdirSync(assetsDir, { recursive: true });
  const base = path.basename(srcAbs);
  fs.copyFileSync(srcAbs, path.join(assetsDir, base));

  const sidecar = srcAbs + '.license';
  if (fs.existsSync(sidecar)) fs.copyFileSync(sidecar, path.join(assetsDir, base + '.license'));
  else fs.writeFileSync(path.join(assetsDir, base + '.license'), LICENSE_SIDECAR);

  return base;
}

// Code must survive verbatim, so fenced blocks and inline spans are masked out before any
// rewriting and restored afterwards. Without this, a path mentioned inside a directory listing
// gets turned into a site URL.
function maskCode(text) {
  const stash = [];
  const keep = (match) => {
    stash.push(match);
    return ` ⟦CODE${stash.length - 1}⟧ `;
  };
  const masked = text
    .replace(/^([ \t]*)(```|~~~)[\s\S]*?^\1?\2[ \t]*$/gm, keep)
    .replace(/`[^`\n]*`/g, keep);
  return { masked, stash };
}

function unmaskCode(text, stash) {
  return text.replace(/ ⟦CODE(\d+)⟧ /g, (_, i) => stash[Number(i)]);
}

function transform(libRel, raw, dest) {
  const srcDir = path.posix.dirname(libRel) === '.' ? '' : path.posix.dirname(libRel);
  const outAbs = path.join(REPO_ROOT, dest.out);
  // The section index lives beside the generated directory, so its assets go inside that
  // directory to keep every generated file under one gitignored path.
  const isSectionIndex = dest.out === INDEX_REL;
  const outDirAbs = isSectionIndex ? OUT_ROOT : path.dirname(outAbs);
  const assetPrefix = isSectionIndex ? './codebase_guide/assets/' : './assets/';

  const stripped = raw
    .split('\n')
    .filter((line) => !NAV_CRUFT.test(line))
    .join('\n')
    .replace(/\n{3,}/g, '\n\n')
    .trim() + '\n';

  const unresolved = [];
  const { masked, stash } = maskCode(stripped);
  let body = masked;

  body = body.replace(IMAGE_RE, (match, alt, target) => {
    if (isExternal(target)) return match;
    const srcAbs = path.join(LIB_ROOT, srcDir, target);
    const asset = copyAsset(srcAbs, outDirAbs);
    if (!asset) {
      unresolved.push(`image ${target}`);
      return match;
    }
    return `![${alt}](${assetPrefix}${asset})`;
  });

  body = body.replace(LINK_RE, (match, text, target) => {
    if (isExternal(target)) return match;

    const hashAt = target.indexOf('#');
    const filePart = hashAt === -1 ? target : target.slice(0, hashAt);
    const anchor = hashAt === -1 ? '' : target.slice(hashAt);
    if (!/\.md$/i.test(filePart)) return match;

    const resolved = path.posix.normalize(path.posix.join(srcDir, filePart));
    if (!fs.existsSync(path.join(LIB_ROOT, resolved))) {
      unresolved.push(`link ${target}`);
      return match;
    }
    return `[${text}](${destinationOf(resolved).url}${anchor})`;
  });

  body = unmaskCode(body, stash);

  const front = ['---'];
  const description = firstParagraph(body);
  if (description) front.push(`description: ${yamlString(description)}`);
  front.push(`displayed_sidebar: ${dest.sidebar || SIDEBAR}`);
  const position = dest.external ? dest.position : POSITION[dest.key];
  if (position !== undefined && !dest.isIndex) front.push(`sidebar_position: ${position}`);
  front.push('---', '', '');

  return { content: front.join('\n') + body, unresolved };
}

function writeCategory(outDirAbs, label, position, link) {
  const payload = { label };
  if (position !== undefined) payload.position = position;
  if (link) payload.link = link;
  fs.writeFileSync(path.join(outDirAbs, '_category_.json'), JSON.stringify(payload, null, 2) + '\n');
  fs.writeFileSync(path.join(outDirAbs, '_category_.json.license'), LICENSE_SIDECAR);
}

function writePlaceholder() {
  fs.mkdirSync(OUT_ROOT, { recursive: true });
  const fence = '```';
  fs.writeFileSync(
    path.join(REPO_ROOT, INDEX_REL),
    [
      '---',
      'description: "Module documentation generated at build time from the OCUDU source repository."',
      `displayed_sidebar: ${SIDEBAR}`,
      '---',
      '',
      `# ${SECTION_LABEL}`,
      '',
      'This section is generated from the markdown files under `lib/` in the OCUDU source',
      'repository. It is empty here because that repository was not available when this site',
      'was built.',
      '',
      'To render it against a local checkout:',
      '',
      fence + 'bash',
      'OCUDU_SOURCE_PATH=/path/to/ocudu npm start',
      fence,
      '',
    ].join('\n'),
  );
  // Docusaurus throws when an autogenerated sidebar points at a missing directory, so the
  // directory must exist even with nothing in it.
  fs.writeFileSync(path.join(OUT_ROOT, '.gitkeep'), '');
}

// ---------------------------------------------------------------------------- main

function main() {
  // Wipe first so upstream deletions and renames propagate rather than leaving orphan pages.
  fs.rmSync(OUT_ROOT, { recursive: true, force: true });
  fs.rmSync(path.join(REPO_ROOT, INDEX_REL), { force: true });
  for (const mapped of Object.values(FILE_MAP)) {
    fs.rmSync(path.join(REPO_ROOT, mapped.out), { force: true });
  }

  if (!fs.existsSync(LIB_ROOT)) {
    writePlaceholder();
    console.log(`[source-docs] ${path.relative(REPO_ROOT, LIB_ROOT)} not found - wrote placeholder.`);
    return;
  }

  const sources = walk(LIB_ROOT, '', []).sort();
  const categories = new Map();
  const warnings = [];
  let written = 0;

  for (const libRel of sources) {
    const dest = destinationOf(libRel);
    const outAbs = path.join(REPO_ROOT, dest.out);
    fs.mkdirSync(path.dirname(outAbs), { recursive: true });

    const raw = fs.readFileSync(path.join(LIB_ROOT, libRel), 'utf8');
    const { content, unresolved } = transform(libRel, raw, dest);
    fs.writeFileSync(outAbs, content);
    written++;

    for (const item of unresolved) warnings.push(`${libRel}: unresolved ${item}`);

    // An index page names the category its directory becomes.
    if (!dest.external && dest.isIndex && dest.outDir) {
      categories.set(dest.outDir, {
        label: headingOf(raw) || path.posix.basename(dest.outDir),
        position: POSITION[dest.outDir],
      });
    }
  }

  for (const [outDir, meta] of categories) {
    writeCategory(path.join(OUT_ROOT, outDir), meta.label, meta.position);
  }

  for (const [outDir, meta] of Object.entries(SYNTHETIC_CATEGORIES)) {
    const dirAbs = path.join(OUT_ROOT, outDir);
    if (!fs.existsSync(dirAbs)) continue;
    writeCategory(dirAbs, meta.label, meta.position, {
      type: 'generated-index',
      slug: `${URL_BASE}/${outDir}`,
    });
  }

  // A generated directory with no index page gets no _category_.json, so Docusaurus falls back
  // to the raw folder name as its sidebar label. Adding a README.md upstream fixes it.
  const checkLabels = (dirAbs, rel) => {
    for (const entry of fs.readdirSync(dirAbs, { withFileTypes: true })) {
      if (!entry.isDirectory() || entry.name === 'assets') continue;
      const childRel = rel ? path.posix.join(rel, entry.name) : entry.name;
      const childAbs = path.join(dirAbs, entry.name);
      if (!fs.existsSync(path.join(childAbs, '_category_.json'))) {
        warnings.push(`${childRel}/ has no index page - sidebar label falls back to "${entry.name}"`);
      }
      checkLabels(childAbs, childRel);
    }
  };
  checkLabels(OUT_ROOT, '');

  console.log(`[source-docs] Generated ${written} page(s) in ${OUT_REL} from ${path.relative(REPO_ROOT, LIB_ROOT) || LIB_ROOT}.`);
  for (const warning of warnings) console.warn(`[source-docs] WARNING ${warning}`);
}

main();
