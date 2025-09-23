const js = require('@eslint/js');
const globals = require('globals');
const reactHooks = require('eslint-plugin-react-hooks');
const reactRefresh = require('eslint-plugin-react-refresh');
/* eslint-env node */
const { defineConfig } = require('eslint/config');

module.exports = defineConfig([
  {
    ignores: ['**/dist/**', 'node_modules'],
  },
  // Configuración específica para el backend (CommonJS / Node)
  {
    files: ['backend/**'],
    languageOptions: {
      ecmaVersion: 2020,
      globals: globals.node,
      parserOptions: {
        ecmaVersion: 'latest',
        sourceType: 'script',
      },
    },
    rules: {},
  },
  // Ensure the config file itself is linted with Node globals
  {
    files: ['eslint.config.js'],
    languageOptions: {
      globals: globals.node,
    },
    rules: {},
  },
  {
    files: ['**/*.{js,jsx}'],
    extends: [
      js.configs.recommended,
      reactHooks.configs['recommended-latest'],
      reactRefresh.configs.vite,
    ],
    languageOptions: {
      ecmaVersion: 2020,
      globals: globals.browser,
      parserOptions: {
        ecmaVersion: 'latest',
        ecmaFeatures: { jsx: true },
        sourceType: 'module',
      },
    },
    rules: {
      'no-unused-vars': ['error', { varsIgnorePattern: '^[A-Z_]' }],
    },
  },
]);
