import path from 'path';
import { execSync } from 'child_process';
import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react-swc';
import checker from '@artursapek/vite-plugin-checker';
// Until this is merged or that issue is fixed some other way, we have to use
// this fork of vite-plugin-node-polyfills.
// https://github.com/davidmyersdev/vite-plugin-node-polyfills/pull/89
import { nodePolyfills } from '@kev1n-peters/vite-plugin-node-polyfills';
import dts from 'vite-plugin-dts';

const packagePath = __dirname.endsWith('wormhole-connect')
  ? './package.json'
  : './wormhole-connect/package.json';
const { version } = require(packagePath);

let gitHash = 'unknown';
try {
  gitHash = execSync('git log -1 --format=%H').toString().replace('\n', '');
} catch (e) {
  console.error(`Failed to determine git hash! Will be missing from telemetry`);
  console.error(e);
}

console.info(
  `\nBuilding Wormhole Connect version=${version} hash=${gitHash}\n`,
);

// There are three configs this file can return.
// 1. local dev server
// 2. production build, for direct import
// 3. production build, hosted by unpkg.com (includes React, auto-binds to DOM)

// TODO: consider using the "VITE_APP_" prefix which is the default for Vite
const envPrefix = 'REACT_APP_';

const define = {
  'import.meta.env.REACT_APP_CONNECT_VERSION':
    process.env.CONNECT_VERSION ?? JSON.stringify(version),
  'import.meta.env.REACT_APP_CONNECT_GIT_HASH': JSON.stringify(gitHash),
};

const resolve = {
  alias: {
    utils: path.resolve(__dirname, './src/utils'),
    config: path.resolve(__dirname, './src/config'),
    components: path.resolve(__dirname, './src/components'),
    contexts: path.resolve(__dirname, './src/contexts'),
    // This was originally called "events" and that breaks some NPM dependency
    // so do not rename it "events":
    telemetry: path.resolve(__dirname, './src/telemetry'),
    store: path.resolve(__dirname, './src/store'),
    routes: path.resolve(__dirname, './src/routes'),
    icons: path.resolve(__dirname, './src/icons'),
    hooks: path.resolve(__dirname, './src/hooks'),
    consts: path.resolve(__dirname, './src/consts'),
    sdklegacy: path.resolve(__dirname, './src/sdklegacy'),
    public: path.resolve(__dirname, './public'),
    views: path.resolve(__dirname, './src/views'),
    'process/': 'process',
    'buffer/': 'buffer',
  },
};

const plugins = [
  checker({
    typescript: true,
  }),
  dts({
    insertTypesEntry: true,
  }),
  react(),
  nodePolyfills({
    include: [
      'crypto',
      'http',
      'https',
      'stream',
      'buffer',
      'url',
      'os',
      'zlib',
    ],
    globals: {
      global: true,
      Buffer: true,
    },
  }),
];

const optimizeDeps = {
  include: [
    '@emotion/react',
    '@emotion/styled',
    '@mui/material/Tooltip',
    '@mui/material/Unstable_Grid2',
  ],
};

interface AssetInfo {
  name: string;
}

let output = {
  assetFileNames: (assetInfo: AssetInfo) => {
    if (assetInfo.name === 'main.css') {
      return '[name][extname]';
    }

    return '[name]-[hash][extname]';
  },
  inlineDynamicImports: false,
  exports: 'named',
};

let external = [
  // TODO figure out why these have to be here. build fails without it
  '@particle-network/solana-wallet',
  '@particle-network/auth',
];

export default defineConfig(({ command, mode }) => {
  const env = loadEnv(mode, process.cwd(), '');
  const isHosted = !!env.VITE_BUILD_HOSTED;
  const isNetlify = !!env.VITE_BUILD_NETLIFY;

  if (command === 'serve' || (command === 'build' && isNetlify)) {
    // Local development
    return {
      define,
      envPrefix,
      resolve,
      build: {
        outDir: './build',
        rollupOptions: {
          input: {
            main: 'src/demo.tsx',
            index: 'index.html',
          },
          output,
          external,
        },
      },
      plugins,
      optimizeDeps,
    };
  } else if (command === 'build') {
    //
    // Building for production
    // There are two possible configs here: invoked by "npm run build" and "npm run build:hosted"
    //
    // - by default, we build a component library that can be imported and used in React apps
    //
    // - alternatively, VITE_BUILD_HOSTED=1 causes Vite to build a bundle that is used
    //   via unpkg.com hosting. This build looks for a DOM element #wormhole-connect and comes
    //   bundled with a copy of React. This is "legacy mode" and useful only on web apps that don't
    //   use React.
    //

    if (isHosted) {
      return {
        define,
        envPrefix,
        resolve,
        build: {
          outDir: './dist',
          rollupOptions: {
            input: {
              main: 'src/main.tsx',
            },
            output: {
              entryFileNames: '[name].js',
              ...output,
            },
            external,
          },
        },
        plugins,
        optimizeDeps,
      };
    } else {
      return {
        define,
        envPrefix,
        resolve,
        build: {
          outDir: './lib',
          lib: {
            entry: path.resolve(__dirname, 'src/index.tsx'),
            formats: ['es', 'cjs'],
            fileName: 'index',
          },
          rollupOptions: {
            input: {
              index: 'src/index.ts',
            },
            output,
            external: ['react', 'react-dom', ...external],
          },
        },
        plugins,
        optimizeDeps,
      };
    }
  }
});
