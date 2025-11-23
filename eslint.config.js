// eslint.config.js
import js from '@eslint/js';
import tsPlugin from '@typescript-eslint/eslint-plugin';
import tsParser from '@typescript-eslint/parser';
import reactPlugin from 'eslint-plugin-react';
import hooksPlugin from 'eslint-plugin-react-hooks';
import simpleImportSort from 'eslint-plugin-simple-import-sort';

export default [
  // Global defaults for all project files
  {
    ignores: ['dist/**', 'electron/dist/**', 'node_modules/**'],
    files: ['**/*.{js,jsx,ts,tsx}'],

    languageOptions: {
      parser: tsParser,
      ecmaVersion: 'latest',
      sourceType: 'module',
      globals: {
        console: 'readonly',
        setTimeout: 'readonly',
        clearTimeout: 'readonly',
        URL: 'readonly',
      },
    },

    plugins: {
      '@typescript-eslint': tsPlugin,
      react: reactPlugin,
      'react-hooks': hooksPlugin,
      'simple-import-sort': simpleImportSort,
    },

    rules: {
      // Core recommended sets
      ...js.configs.recommended.rules,
      ...tsPlugin.configs.recommended.rules,

      // Real correctness rules (errors)
      'react-hooks/rules-of-hooks': 'error',
      'simple-import-sort/imports': 'error',
      'simple-import-sort/exports': 'error',

      // Your preference: warnings, not errors
      '@typescript-eslint/no-explicit-any': 'warn',
      '@typescript-eslint/no-unused-vars': 'warn',
      '@typescript-eslint/no-require-imports': 'warn',
      'no-undef': 'warn',
      'no-empty': 'warn',
    },
  },

  // Renderer (React/Vite)
  {
    files: ['src/**/*.{js,jsx,ts,tsx}'],
    languageOptions: {
      globals: {
        window: 'readonly',
        document: 'readonly',
        fetch: 'readonly',
        navigator: 'readonly',
      },
    },
    rules: {
      'no-console': 'warn', // allowed but flagged
    },
  },

  // Electron main (Node environment)
  {
    files: ['electron/**/*.{js,ts}'],
    ignores: ['electron/preload.ts'],

    languageOptions: {
      globals: {
        require: 'readonly',
        module: 'readonly',
        __dirname: 'readonly',
        process: 'readonly',
      },
      sourceType: 'script',
      ecmaVersion: 2022,
    },

    rules: {
      'no-console': 'off', // allowed freely in backend
    },
  },

  // Electron preload (browser + node)
  {
    files: ['electron/preload.ts'],
    languageOptions: {
      globals: {
        window: 'readonly',
        document: 'readonly',
        console: 'readonly',
        require: 'readonly',
        module: 'readonly',
        fetch: 'readonly',
      },
    },
  },
];
