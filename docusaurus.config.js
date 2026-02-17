/*
 *
 * Copyright 2021-2026 Software Radio Systems Limited
 *
 * By using this file, you agree to the terms and conditions set
 * forth in the LICENSE file which can be found at the top level of
 * the distribution.
 *
 */

const { execSync } = require('child_process');
const { themes } = require('prism-react-renderer');

const gitlab_namespace = 'ocudu';
const gitlab_project = 'ocudu';
const url = `https://${gitlab_namespace}.gitlab.io/`;
const baseUrl = process.env.BASE_URL || '/';
const gitlab_repo_url = `https://gitlab.com/${gitlab_namespace}`;
const ocudu_repo_url = `${gitlab_repo_url}/${gitlab_project}`;
const ocudu_docs_repo_url = `${gitlab_repo_url}/ocudu_docs`;
const ocudu_oran_apps_repo_url = `${gitlab_repo_url}/ocudu_elements/ocudu_oran_apps`;
const ocudu_netconf_repo_url = `${ocudu_oran_apps_repo_url}/ocudu_netconf`;
const ocudu_o1_adapter_repo_url = `${ocudu_oran_apps_repo_url}/ocudu_o1_adapter`;

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
const ocuduCommitSha = getRepoCommitSha('docs/ocudu', 'OCUDU');
const ocuduDocsCommitSha = getRepoCommitSha('.', 'OCUDU Docs');
const ocuduNetconfCommitSha = getRepoCommitSha('oran_apps/ocudu_netconf', 'OCUDU Netconf');
const ocuduO1AdapterCommitSha = getRepoCommitSha('oran_apps/ocudu_o1_adapter', 'OCUDU O1 Adapter');
const ocuduCommitShort = getShortSha(ocuduCommitSha);
const ocuduDocsCommitShort = getShortSha(ocuduDocsCommitSha);
const ocuduNetconfCommitShort = getShortSha(ocuduNetconfCommitSha);
const ocuduO1AdapterCommitShort = getShortSha(ocuduO1AdapterCommitSha);

/** @type {import('@docusaurus/types').DocusaurusConfig} */
module.exports = {
  title: 'OCUDU',
  tagline: 'Open Centralized Unit Distributed Unit',
  url: url,
  baseUrl: baseUrl,
  onBrokenLinks: 'throw',
  favicon: 'https://srs.io/wp-content/uploads/ocudu_color.png',
  organizationName: gitlab_namespace,
  projectName: gitlab_project,
  markdown: {
    mermaid: true,
    hooks: {
      onBrokenMarkdownLinks: 'warn',
    },
  },
  themes: ['@docusaurus/theme-mermaid'],
  themeConfig: {
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
          to: '/',
          position: 'left',
          label: 'Documentation',
        },
        {
          type: 'dropdown',
          label: 'ORAN Apps',
          position: 'left',
          items: [
            {
              to: '/oran_apps/ocudu_netconf',
              label: 'Netconf',
            },
            {
              to: '/oran_apps/ocudu_o1_adapter',
              label: 'O1 Adapter',
            }
          ],
        },
        {
          type: 'dropdown',
          label: 'CI Results',
          position: 'left',
          items: [
            {
              href: '/coverage/index.html',
              target: "_blank",
              label: 'Code Coverage',
            }
          ],
        },
        {
          href: 'https://ocudu.org',
          label: 'Website',
          position: 'right',
        },
        {
          href: gitlab_repo_url,
          label: 'Gitlab',
          position: 'right',
        },
      ],
    },
    announcementBar: {
      id: 'wip',
      content:
        'This documentation is a work in progress!',
      backgroundColor: '#ddc36fff',
      textColor: '#091E42',
      isCloseable: false,
    },
    footer: {
      style: 'dark',
      links: [
        {
          title: 'More',
          items: [
            {
              label: 'Website',
              href: 'https://ocudu.org'
            },
            {
              label: 'Gitlab',
              href: gitlab_repo_url,
            },
          ],
        },
        {
          title: 'Repositories used for building this website',
          items: [
            {
              label: `OCUDU: ${ocuduCommitShort}`,
              href: `${ocudu_repo_url}/-/tree/${ocuduCommitSha}`,
            },
            {
              label: `OCUDU Docs: ${ocuduDocsCommitShort}`,
              href: `${ocudu_docs_repo_url}/-/tree/${ocuduDocsCommitSha}`,
            },
            {
              label: `OCUDU Netconf: ${ocuduNetconfCommitShort}`,
              href: `${ocudu_netconf_repo_url}/-/tree/${ocuduNetconfCommitSha}`,
            },
            {
              label: `OCUDU O1 Adapter: ${ocuduO1AdapterCommitShort}`,
              href: `${ocudu_o1_adapter_repo_url}/-/tree/${ocuduO1AdapterCommitSha}`,
            },
          ],
        },
      ],
      copyright: `Copyright © ${new Date().getFullYear()} Software Radio Systems.`,
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
    [
      '@docusaurus/plugin-content-docs',
      {
        id: 'oran_apps',
        path: 'oran_apps',
        routeBasePath: 'oran_apps',
        sidebarPath: require.resolve('./sidebars.js'),
        include: ['**/*.md', '**/*.mdx'],
        exclude: [
          '**/.git/**',
          '**/node_modules/**',
        ],
      }
    ],
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
    // Custom webpack config to ignore changes in static folders during live reload in local
    function (context, options) {
      return {
        name: 'custom-webpack-config',
        configureWebpack(config, isServer, utils) {
          return {
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
