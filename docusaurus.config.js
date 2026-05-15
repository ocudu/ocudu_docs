// SPDX-FileCopyrightText: Copyright (C) 2021-2026 Software Radio Systems Limited
// SPDX-License-Identifier: BSD-3-Clause-Open-MPI

const { execSync } = require('child_process');
const { themes } = require('prism-react-renderer');

const gitlab_namespace = 'ocudu';
const gitlab_project = 'ocudu';
const url = `https://${gitlab_namespace}.gitlab.io/`;
const baseUrl = process.env.BASE_URL || '/';
const gitlab_repo_url = `https://gitlab.com/${gitlab_namespace}`;
const ocudu_docs_repo_url = `${gitlab_repo_url}/ocudu_docs`;

// Returns Commit Sha of given repository
function getRepoCommitSha(repoPath, repoName) {
  try {
    return execSync(`git -C ${repoPath} rev-parse HEAD`, { stdio: ['ignore', 'pipe', 'ignore'] })
      .toString()
      .trim();
  } catch (error) {
    console.error(`[commit-info] ERROR: Could not resolve commit SHA for ${repoName} in path '${repoPath}'`);
    return '';
  }
}

// Shortens given Commit Sha taking only the first 8 letters for better readability
function getShortSha(sha) {
  return sha ? sha.slice(0, 8) : 'ERROR - commit SHA not found';
}

// Get Commit Sha's of used repositories and shorten them for printing in the footnote
const ocuduDocsCommitSha = getRepoCommitSha('.', 'OCUDU Docs');
const ocuduDocsCommitShort = getShortSha(ocuduDocsCommitSha);

/** @type {import('@docusaurus/types').DocusaurusConfig} */
module.exports = {
  title: 'OCUDU',
  tagline: 'Open Centralized Unit Distributed Unit',
  url: url,
  baseUrl: baseUrl,
  onBrokenLinks: 'throw',
  favicon: 'img/ocudu_o.png',
  organizationName: gitlab_namespace,
  projectName: gitlab_project,
  customFields: {
    versionUrl: `${ocudu_docs_repo_url}/-/tree/${ocuduDocsCommitSha}`,
  },
  markdown: {
    mermaid: true,
    hooks: {
      onBrokenMarkdownLinks: 'warn',
    },
  },
  themes: ['@docusaurus/theme-mermaid'],
  themeConfig: {
    docs: {
      sidebar: {
        autoCollapseCategories: true,
      },
    },
    tableOfContents: {
      minHeadingLevel: 2,
      maxHeadingLevel: 3,
    },
    prism: {
      theme: themes.github,
      darkTheme: themes.dracula,
      defaultLanguage: 'bash',
      additionalLanguages: ['bash', 'shell-session', 'cmake', 'cpp', 'json', 'yaml'],
    },
    navbar: {
      title: '',
      logo: {
        alt: 'OCUDU Logo',
        src: 'https://srs.io/wp-content/uploads/ocudu_color.png',
      },
      items: [
        {
          type: 'dropdown',
          label: 'User Docs',
          position: 'left',
          to: '/user_manual/',
          items: [
            { type: 'doc', docId: 'user_manual/installation/installation', label: 'User Manual' },
            { type: 'doc', docId: 'tutorials/index',      label: 'Tutorials' },
            { type: 'doc', docId: 'integrations/index',   label: 'Integrations' },
            { type: 'doc', docId: 'releases/index',       label: 'Releases & Roadmap' },
          ],
        },
        {
          type: 'dropdown',
          label: 'Knowledge',
          position: 'left',
          to: '/knowledge_base/',
          items: [
            { type: 'doc', docId: 'knowledge_base/oran_gnb/index',       label: 'O-RAN Overview' },
            { type: 'doc', docId: 'knowledge_base/gnb_components/index',  label: 'CU/DU Components' },
            { type: 'doc', docId: 'knowledge_base/gnb_interfaces/index',  label: 'gNB Interfaces' },
            { type: 'doc', docId: 'knowledge_base/cots_ues/index',        label: 'COTS UEs' },
            { type: 'doc', docId: 'knowledge_base/glossary',              label: 'Glossary' },
          ],
        },
        {
          type: 'dropdown',
          label: 'Dev Zone',
          position: 'left',
          to: '/dev_guide/',
          items: [
            { type: 'doc', docId: 'dev_guide/architecture_guide/index',  label: 'Architecture Guide' },
            { type: 'doc', docId: 'dev_guide/architecture_overview/index', label: 'Architecture Overview' },
            { type: 'doc', docId: 'dev_guide/code_guide/index',          label: 'C++ Code Guide' },
            { type: 'doc', docId: 'dev_guide/logging_guide/index',       label: 'Logging Guide' },
            { type: 'doc', docId: 'dev_guide/testing_policy/index',      label: 'Testing Policy' },
            { type: 'doc', docId: 'dev_guide/contributing_guide/index',  label: 'Contributing Guide' },
          ],
        },
        {
          type: 'doc',
          docId: 'community/index',
          position: 'left',
          label: 'Community',
        },
        {
          type: 'doc',
          docId: 'qa_results/index',
          position: 'left',
          label: 'QA',
        },
        {
          type: 'dropdown',
          label: 'CI Results',
          position: 'right',
          items: [
            {
              href: '/coverage/index.html',
              target: '_blank',
              label: 'Code Coverage',
            },
          ],
        },
        {
          type: 'html',
          position: 'right',
          value: '<a href="https://ocudu.org" target="_blank" rel="noopener noreferrer" aria-label="OCUDU Website" class="navbar__item navbar__link" style="display:flex;align-items:center;padding:0.25rem 0.35rem"><svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><line x1="2" y1="12" x2="22" y2="12"/><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/></svg></a>',
        },
        {
          type: 'html',
          position: 'right',
          value: `<a href="${gitlab_repo_url}" target="_blank" rel="noopener noreferrer" aria-label="GitLab" class="navbar__item navbar__link" style="display:flex;align-items:center;padding:0.25rem 0.35rem"><svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="95 95 190 190"><path fill="#e24329" d="M265.26416,174.37243l-.2134-.55822-21.19899-55.30908c-.4236-1.08359-1.18542-1.99642-2.17699-2.62689-.98837-.63373-2.14749-.93253-3.32305-.87014-1.1689.06239-2.29195.48925-3.20809,1.21821-.90957.73554-1.56629,1.73047-1.87493,2.85346l-14.31327,43.80662h-57.90965l-14.31327-43.80662c-.30864-1.12299-.96536-2.11791-1.87493-2.85346-.91614-.72895-2.03911-1.15582-3.20809-1.21821-1.17548-.06239-2.33468.23641-3.32297.87014-.99166.63047-1.75348,1.5433-2.17707,2.62689l-21.19891,55.31237-.21348.55493c-6.28158,16.38521-.92929,34.90803,13.05891,45.48782.02621.01641.04922.03611.07552.05582l.18719.14119,32.29094,24.17392,15.97151,12.09024,9.71951,7.34871c2.34117,1.77316,5.57877,1.77316,7.92002,0l9.71943-7.34871,15.96822-12.09024,32.48142-24.31511c.02958-.02299.05588-.04269.08538-.06568,13.97834-10.57977,19.32735-29.09604,13.04905-45.47796Z"/><path fill="#fc6d26" d="M265.26416,174.37243l-.2134-.55822c-10.5174,2.16062-20.20405,6.6099-28.49844,12.81593-.1346.0985-25.20497,19.05805-46.55171,35.19699,15.84998,11.98517,29.6477,22.40405,29.6477,22.40405l32.48142-24.31511c.02958-.02299.05588-.04269.08538-.06568,13.97834-10.57977,19.32735-29.09604,13.04905-45.47796Z"/><path fill="#fca326" d="M160.34962,244.23117l15.97151,12.09024,9.71951,7.34871c2.34117,1.77316,5.57877,1.77316,7.92002,0l9.71943-7.34871,15.96822-12.09024s-13.79772-10.41888-29.6477-22.40405c-15.85327,11.98517-29.65099,22.40405-29.65099,22.40405Z"/><path fill="#fc6d26" d="M143.44561,186.63014c-8.29111-6.20274-17.97446-10.65531-28.49507-12.81264l-.21348.55493c-6.28158,16.38521-.92929,34.90803,13.05891,45.48782.02621.01641.04922.03611.07552.05582l.18719.14119,32.29094,24.17392s13.79772-10.41888,29.65099-22.40405c-21.34673-16.13894-46.42031-35.09848-46.55499-35.19699Z"/></svg></a>`,
        },
      ],
    },
    footer: {
      style: 'dark',
      links: [
        {
          title: 'Documentation',
          items: [
            { label: 'User Manual',      to: '/user_manual/installation/installation' },
            { label: 'Tutorials',        to: '/tutorials/' },
            { label: 'Knowledge Base',   to: '/knowledge_base/' },
            { label: 'Developer Guide',  to: '/dev_guide/' },
            { label: 'Releases',         to: '/releases/' },
          ],
        },
        {
          title: 'Community',
          items: [
            { label: 'Discussions',          href: 'https://gitlab.com/ocudu/community/discussions' },
            { label: 'Mailing List',         href: 'https://lists.ocudu.org/g/main' },
            { label: 'Community Calls',      href: 'https://zoom-lfx.platform.linuxfoundation.org/meeting/97654512715?password=f7e88038-aff1-426e-bc62-02ef36985c98' },
            { label: 'GitLab Issues',        href: 'https://gitlab.com/ocudu/ocudu/-/issues' },
          ],
        },
        {
          title: 'Project',
          items: [
            { label: 'ocudu.org',            href: 'https://ocudu.org' },
            { label: 'GitLab',               href: gitlab_repo_url },
            { label: 'Linux Foundation',     href: 'https://www.linuxfoundation.org/' },
            { label: `Docs: ${ocuduDocsCommitShort}`, href: `${ocudu_docs_repo_url}/-/tree/${ocuduDocsCommitSha}` },
          ],
        },
      ],
      copyright: `Copyright © ${new Date().getFullYear()} OCUDU Project.`,
    },
  },
  i18n: {
    defaultLocale: 'en',
    locales: ['en'],
  },
  presets: [
    [
      '@docusaurus/preset-classic',
      {
        docs: {
          path: 'docs',
          routeBasePath: '/',
          include: ['**/*.md', '**/*.mdx'],
          exclude: [
            '**/node_modules/**',
            '**/.gitlab/**',
            '**/.tox/**',
            '**/build/**',
            '**/ccache/**',
            '**/.git/**',
            'ocudu/**',
          ],
          sidebarPath: require.resolve('./sidebars_extended.js'),
        },
        blog: false,
        theme: {
          customCss: require.resolve('./src/css/custom.css'),
        },
      }
    ],
  ],
  plugins: [
    'docusaurus-plugin-drawio',
    [
      require.resolve("@easyops-cn/docusaurus-search-local"),
      {
        hashed: true,
        indexDocs: true,
        indexPages: true,
        indexBlog: false,
        docsRouteBasePath: '/',
      },
    ],
    // Link filter plugin - removes broken links to non-markdown files
    require('./plugins/link-filter-plugin.js'),
    // Webpack config: fix ESM resolution for @untitled-ui/icons-react and ignore
    // static folders during live reload
    function (context, options) {
      return {
        name: 'custom-webpack-config',
        configureWebpack(config, isServer, utils) {
          return {
            module: {
              rules: [
                {
                  test: /\.js$/,
                  include: /node_modules\/@untitled-ui\/icons-react/,
                  resolve: { fullySpecified: false },
                },
              ],
            },
            watchOptions: {
              ignored: /static[\\/](doxygen|coverage|cppcheck)/,
              poll: 1000,
            },
            snapshot: {
              managedPaths: [/^(.+?[\\/]node_modules[\\/])/],
            },
          };
        },
        getPathsToWatch() {
          return [];
        },
      };
    },
  ]
};
