import js from '@eslint/js';
import globals from 'globals';
import react from 'eslint-plugin-react';

export default [
  { ignores: ['node_modules/', '.claude/', '.impeccable/', 'mockup/', 'mobile/.expo/'] },
  js.configs.recommended,
  {
    files: ['api/**/*.{js,mjs}'],
    languageOptions: { ecmaVersion: 2023, sourceType: 'module', globals: globals.node },
  },
  {
    files: ['api/tests/**/*.js'],
    languageOptions: { globals: globals.jest },
  },
  {
    files: ['mobile/metro.config.js'],
    languageOptions: { ecmaVersion: 2023, sourceType: 'commonjs', globals: globals.node },
  },
  {
    files: ['web/js/**/*.js'],
    languageOptions: { ecmaVersion: 2023, sourceType: 'module', globals: globals.browser },
  },
  {
    files: ['mobile/src/**/*.js'],
    plugins: { react },
    rules: { 'react/jsx-uses-vars': 'error' },
    languageOptions: {
      ecmaVersion: 2023,
      sourceType: 'module',
      parserOptions: { ecmaFeatures: { jsx: true } },
      globals: {
        ...globals.es2021,
        fetch: 'readonly',
        AbortController: 'readonly',
        process: 'readonly',
        console: 'readonly',
        setTimeout: 'readonly',
        clearTimeout: 'readonly',
        setInterval: 'readonly',
        clearInterval: 'readonly',
        __DEV__: 'readonly',
      },
    },
  },
  {
    files: ['mobile/src/**/__tests__/**/*.js'],
    languageOptions: { globals: globals.jest },
  },
];
