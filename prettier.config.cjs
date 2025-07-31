// Using require for prettier config as prettier doesn't support ES modules for config files
// eslint-disable-next-line @typescript-eslint/no-require-imports
const devConfig = require('@wormhole-labs/dev-config/prettier');

// Re-export the dev-config prettier configuration with project-specific overrides
module.exports = {
  ...(devConfig.default || devConfig),
  // Wormhole Connect specific overrides (keeping original .prettierrc values)
  printWidth: 80, // Keep original line width (dev-config uses 100)
  tabWidth: 2,
  singleQuote: true,
  trailingComma: 'all', // dev-config uses 'es5', but connect uses 'all'
  semi: true,
};
