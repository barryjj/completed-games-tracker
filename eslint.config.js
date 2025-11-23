import js from '@eslint/js';
import tsPlugin from '@typescript-eslint/eslint-plugin';
import tsParser from '@typescript-eslint/parser';
import reactPlugin from 'eslint-plugin-react';
import reactHooks from 'eslint-plugin-react-hooks';
import simpleImportSort from 'eslint-plugin-simple-import-sort';

export default [
  // ==========================
  // ROOT GUARD — do not remove
  // - Ensures no injected config ever enables project-mode
  // - Ensures eslint.config.js is never targeted
  // ==========================
  {
    // a defensive global ignore and explicit null project to stop any injected presets
    ignores: ['eslint.config.js', '**/eslint.config.js'],
    languageOptions: {
      parserOptions: {
        // Defensive: explicitly disable type-aware linting globally (overrides injected presets)
        project: null,
      },
    },
  },

  // ==========================
  // 0. Global Ignores
  // ==========================
  {
    ignores: ['dist/**', 'electron/dist/**', 'node_modules/**'],
  },

  // ==========================
  // 1. MAIN SOURCE CODE (TypeScript/React)
  // ==========================
  {
    files: ['src/**/*.{ts,tsx,js,jsx}', 'electron/**/*.{ts,tsx,js,jsx}'],

    ...js.configs.recommended,

    languageOptions: {
      parser: tsParser,
      parserOptions: {
        project: './tsconfig.eslint.json',
        ecmaVersion: 'latest',
        sourceType: 'module',
      },
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
      'react-hooks': reactHooks,
      'simple-import-sort': simpleImportSort,
    },

    settings: {
      react: {
        version: 'detect',
      },
    },

    rules: {
      // --- TypeScript Rules ---
      'no-shadow': 'off',
      'no-unused-vars': 'off',
      '@typescript-eslint/no-shadow': 'error',
      '@typescript-eslint/no-unused-vars': ['warn', { argsIgnorePattern: '^_' }],
      '@typescript-eslint/no-explicit-any': 'warn',

      // --- React Rules ---
      'react/jsx-uses-react': 'off',
      'react/react-in-jsx-scope': 'off',
      'react/prop-types': 'off',

      // --- React Hooks ---
      'react-hooks/rules-of-hooks': 'error',
      'react-hooks/exhaustive-deps': 'warn',

      // --- Custom Rules ---
      'no-console': 'warn',
      'no-undef': 'warn',
      'no-empty': 'warn',
      'simple-import-sort/imports': 'error',
      'simple-import-sort/exports': 'error',
    },
  },

  // ==========================
  // 2. ELECTRON MAIN PROCESS
  // ==========================
  {
    files: ['electron/**/*.{ts,js}'],
    ignores: ['electron/preload.ts'],
    languageOptions: {
      globals: {
        require: 'readonly',
        module: 'readonly',
        __dirname: 'readonly',
        process: 'readonly',
      },
      sourceType: 'script',
    },
    rules: {
      'no-console': 'off',
      'no-undef': 'off',
    },
  },

  // ==========================
  // 3. ELECTRON PRELOAD
  // ==========================
  {
    files: ['electron/preload.ts'],
    languageOptions: {
      globals: {
        window: 'readonly',
        document: 'readonly',
        require: 'readonly',
        module: 'readonly',
        fetch: 'readonly',
      },
    },
  },
];
