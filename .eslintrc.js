// SPDX-FileCopyrightText: Copyright (C) 2021-2026 Software Radio Systems Limited
// SPDX-License-Identifier: BSD-3-Clause-Open-MPI

module.exports = {
  env: {
    node: true,
    es2021: true,
    jest: true,
  },
  extends: 'eslint:recommended',
  parserOptions: {
    ecmaVersion: 'latest',
    sourceType: 'module',
  },
  rules: {
    'no-unused-vars': ['warn', { argsIgnorePattern: '^_' }],
    'no-console': 'off',
  },
  overrides: [
    {
      // Client-side modules run in the browser
      files: ['src/js/**/*.js'],
      env: {
        browser: true,
        node: false,
      },
    },
    {
      // TypeScript files handled separately if needed
      files: ['**/*.ts', '**/*.tsx'],
      parser: '@typescript-eslint/parser',
      parserOptions: {
        project: false,
      },
    },
  ],
  ignorePatterns: [
    'node_modules/',
    'build/',
    '.docusaurus/',
    'static/',
    'docs/',
  ],
};
