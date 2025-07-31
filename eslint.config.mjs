import reactPlugin from 'eslint-plugin-react';
import reactHooksPlugin from 'eslint-plugin-react-hooks';
import globals from 'globals';
import wormholeDevConfig from '@wormhole-labs/dev-config/eslint';

export default [
  // Use wormhole dev-config as base - this includes all the TypeScript type-aware rules
  ...wormholeDevConfig,

  // Additional ignores specific to wormhole-connect
  {
    ignores: [
      'scripts/**/*.js',
      'public/**',
    ],
  },

  // Browser/Node globals and React JSX support
  {
    files: ['**/*.{js,jsx,ts,tsx,mjs,cjs}'],
    languageOptions: {
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

  // React plugin configs
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

  // Override rules for all files
  {
    rules: {
      // Original wormhole-connect rules
      'comma-dangle': ['error', 'always-multiline'],
      semi: ['error', 'always'],

      // Disable rules that TypeScript handles
      'no-undef': 'off',
      'no-unused-vars': 'off',
      'no-constant-condition': 'off',
      'no-redeclare': 'off',

      // React rules
      'react/react-in-jsx-scope': 'off',
      'react/prop-types': 'off',
      'react/no-unescaped-entities': 'off',
      'react/display-name': 'off',

      // Override dev-config TypeScript rules for wormhole-connect
      '@typescript-eslint/ban-ts-comment': 'off',
      '@typescript-eslint/explicit-module-boundary-types': 'off',
      '@typescript-eslint/no-explicit-any': 'off', // dev-config has 'error'
      '@typescript-eslint/no-non-null-assertion': 'off', // dev-config has 'warn'
      '@typescript-eslint/no-unused-vars': [
        'warn',
        {
          args: 'none',
          argsIgnorePattern: '^_',
          varsIgnorePattern: '^_',
          caughtErrorsIgnorePattern: '^_',
        },
      ],
      '@typescript-eslint/consistent-type-imports': 'off', // Prevent React type import issues

      // Override other dev-config rules
      'no-console': 'off', // dev-config restricts console
      'prettier/prettier': 'off', // Prettier is run separately
      
      // Downgrade type-aware rules from error to warn for existing codebase
      '@typescript-eslint/no-floating-promises': 'warn', // dev-config has 'error'
      '@typescript-eslint/no-misused-promises': 'warn', // dev-config has 'error'
      '@typescript-eslint/await-thenable': 'warn', // dev-config has 'error'
    },
  },

  // Strict rules for hooks directory
  {
    files: ['src/hooks/**/*.{ts,tsx}'],
    rules: {
      // Restore stricter rules for hooks
      '@typescript-eslint/explicit-module-boundary-types': ['error'],
      '@typescript-eslint/no-explicit-any': ['error', { ignoreRestArgs: true }],
      '@typescript-eslint/no-non-null-assertion': ['error'],
      'react-hooks/exhaustive-deps': ['error'],
      '@typescript-eslint/no-floating-promises': 'error',
      '@typescript-eslint/no-misused-promises': 'error',
      '@typescript-eslint/await-thenable': 'error',
    },
  },
];