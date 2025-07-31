import js from '@eslint/js';
import tseslint from 'typescript-eslint';
import reactPlugin from 'eslint-plugin-react';
import reactHooksPlugin from 'eslint-plugin-react-hooks';
import prettierConfig from 'eslint-config-prettier';
import globals from 'globals';
import wormholeDevConfig from '@wormhole-labs/dev-config/eslint';

export default [
  // Use wormhole dev-config as base
  ...wormholeDevConfig,

  // Additional ignores specific to wormhole-connect (from original)
  {
    ignores: [
      'scripts/**/*.js',
      'public/**',
    ],
  },

  // Apply to all JS/TS files (from original)
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
    settings: {
      react: {
        version: 'detect',
      },
    },
  },

  // Add typescript configs that might not be in dev-config
  ...tseslint.configs.recommended,
  
  // React configs (from original)
  reactPlugin.configs.flat.recommended,
  reactPlugin.configs.flat['jsx-runtime'],

  // React hooks plugin (from original)
  {
    plugins: {
      'react-hooks': reactHooksPlugin,
    },
    rules: {
      'react-hooks/rules-of-hooks': 'error',
      'react-hooks/exhaustive-deps': 'warn',
    },
  },

  // General rules for all files (from original)
  {
    rules: {
      // Original rules from .eslintrc.json
      'comma-dangle': ['error', 'always-multiline'],
      semi: ['error', 'always'],

      // Disable rules that TypeScript handles
      'no-undef': 'off', // TypeScript handles this
      'no-unused-vars': 'off', // Use @typescript-eslint/no-unused-vars instead
      'no-constant-condition': 'off',
      'no-redeclare': 'off',

      // React rules
      'react/react-in-jsx-scope': 'off', // Not needed with new JSX transform
      'react/prop-types': 'off', // We use TypeScript for type checking
      'react/no-unescaped-entities': 'off', // Allow quotes in JSX
      'react/display-name': 'off', // Not critical for our use case
      
      // Override dev-config rules
      'no-console': 'off', // dev-config restricts console
      'prettier/prettier': 'off', // Prettier is run separately, not through ESLint
    },
  },

  // TypeScript-specific rules (from original)
  {
    files: ['**/*.{ts,tsx}'],
    rules: {
      // TypeScript rules
      '@typescript-eslint/ban-ts-comment': 'off',
      '@typescript-eslint/explicit-module-boundary-types': 'off',
      '@typescript-eslint/no-explicit-any': 'off',
      '@typescript-eslint/no-non-null-assertion': 'off',
      '@typescript-eslint/no-unused-vars': [
        'warn',
        {
          args: 'none',
          argsIgnorePattern: '^_',
          varsIgnorePattern: '^_',
          caughtErrorsIgnorePattern: '^_',
        },
      ],
      // Disable to prevent React from being imported as type
      '@typescript-eslint/consistent-type-imports': 'off',
      
      // Override dev-config type-aware rules (downgrade to warn)
      '@typescript-eslint/no-floating-promises': 'warn', // dev-config has 'error'
      '@typescript-eslint/no-misused-promises': 'warn', // dev-config has 'error'
      '@typescript-eslint/await-thenable': 'warn', // dev-config has 'error'
    },
  },

  // Strict rules for hooks directory (from original)
  {
    files: ['src/hooks/**/*.{ts,tsx}'],
    rules: {
      '@typescript-eslint/explicit-module-boundary-types': ['error'],
      '@typescript-eslint/no-explicit-any': ['error', { ignoreRestArgs: true }],
      '@typescript-eslint/no-non-null-assertion': ['error'],
      'react-hooks/exhaustive-deps': ['error'],
      // Keep type-aware rules as errors in hooks
      '@typescript-eslint/no-floating-promises': 'error',
      '@typescript-eslint/no-misused-promises': 'error',
      '@typescript-eslint/await-thenable': 'error',
    },
  },

  // Prettier config to disable conflicting rules (must be last)
  prettierConfig,
];