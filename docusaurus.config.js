/*
 *
 * Copyright 2021-2026 Software Radio Systems Limited
 *
 * By using this file, you agree to the terms and conditions set
 * forth in the LICENSE file which can be found at the top level of
 * the distribution.
 *
 */

const { themes } = require('prism-react-renderer');

const gitlab_namespace = 'ocudu';
const gitlab_project = 'ocudu';
const url = `https://${gitlab_namespace}.gitlab.io/`;
const baseUrl = process.env.BASE_URL || '/';
const gitlab_repo_url = `https://gitlab.com/${gitlab_namespace}`;

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
