import js from '@eslint/js';
import tseslint from 'typescript-eslint';
import reactPlugin from 'eslint-plugin-react';
import reactHooksPlugin from 'eslint-plugin-react-hooks';
import prettierConfig from 'eslint-config-prettier';
import globals from 'globals';

// ESLint configuration for wormhole-connect
// Based on @wormhole-labs/dev-config patterns but adapted for project requirements
export default [
  // Global ignores (from dev-config pattern)
  {
    ignores: [
      // Dependencies
      '**/node_modules/**',
      '**/jspm_packages/**',

      // Build outputs
      '**/dist/**',
      '**/build/**',
      '**/lib/**',
      '**/coverage/**',
      '**/.next/**',

      // Config files
      '*.config.js',
      '*.config.mjs',
      '*.config.ts',

      // Wormhole Connect specific
      'scripts/**/*.js',
      'public/**',
    ],
  },

  // Apply to all JS/TS files
  {
    files: ['**/*.{js,jsx,ts,tsx,mjs,cjs}'],
    languageOptions: {
      ecmaVersion: 'latest',
      sourceType: 'module',
      globals: {
        ...globals.browser,
        ...globals.node,
      },
      parserOptions: {
        ecmaFeatures: {
          jsx: true,
        },
      },
    },
  },

  // Recommended configs
  js.configs.recommended,
  ...tseslint.configs.recommended,
  reactPlugin.configs.flat.recommended,
  reactPlugin.configs.flat['jsx-runtime'],

  // React hooks plugin
  {
    plugins: {
      'react-hooks': reactHooksPlugin,
    },
    rules: {
      'react-hooks/rules-of-hooks': 'error',
      'react-hooks/exhaustive-deps': 'warn',
    },
  },

  // General rules for all files
  {
    rules: {
      // Original rules from wormhole-connect
      'comma-dangle': ['error', 'always-multiline'],
      semi: ['error', 'always'],

      // Disable rules that conflict with current codebase
      'no-undef': 'off',
      'no-unused-vars': 'off',
      'no-constant-condition': 'off',
      'no-redeclare': 'off',
      'no-console': 'off', // Dev-config has this as warn, but connect allows it

      // React rules
      'react/react-in-jsx-scope': 'off',
      'react/prop-types': 'off',
      'react/no-unescaped-entities': 'off',
      'react/display-name': 'off',

      // TypeScript rules - less strict than dev-config defaults
      '@typescript-eslint/ban-ts-comment': 'off',
      '@typescript-eslint/explicit-module-boundary-types': 'off',
      '@typescript-eslint/no-explicit-any': 'off', // Dev-config has this as error
      '@typescript-eslint/no-non-null-assertion': 'off', // Dev-config has this as warn
      '@typescript-eslint/no-unused-vars': [
        'warn',
        {
          args: 'none',
          argsIgnorePattern: '^_',
          varsIgnorePattern: '^_',
          caughtErrorsIgnorePattern: '^_',
        },
      ],
      '@typescript-eslint/consistent-type-imports': [
        'warn',
        {
          prefer: 'type-imports',
          disallowTypeAnnotations: false,
        },
      ],
    },
  },

  // Strict rules for hooks directory (keep existing behavior)
  {
    files: ['src/hooks/**/*.{ts,tsx}'],
    rules: {
      '@typescript-eslint/explicit-module-boundary-types': ['error'],
      '@typescript-eslint/no-explicit-any': ['error', { ignoreRestArgs: true }],
      '@typescript-eslint/no-non-null-assertion': ['error'],
      'react-hooks/exhaustive-deps': ['error'],
    },
  },

  // Prettier config to disable conflicting rules (must be last)
  prettierConfig,
];
