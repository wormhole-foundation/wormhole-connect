import path from 'path';
import { fileURLToPath } from 'url';
import { execSync } from 'child_process';
import {
  defineConfig,
  loadEnv,
  ConfigEnv,
  BuildEnvironmentOptions,
} from 'vite';
import type { InputOption, PreRenderedAsset } from 'rollup';
import react from '@vitejs/plugin-react-swc';
import checker from 'vite-plugin-checker';
import { nodePolyfills } from 'vite-plugin-node-polyfills';
import dts from 'vite-plugin-dts';
import { visualizer } from 'rollup-plugin-visualizer';
import packageJson from './package.json';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const { version } = packageJson;
const isAnalyze = process.env.ANALYZE === 'true';

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
    exports: path.resolve(__dirname, './src/exports'),
    'process/': 'process',
    'buffer/': 'buffer',
  },
};

const plugins = [
  checker({ typescript: true }),
  dts({ insertTypesEntry: true }),
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
  process.env.ANALYZE === 'true' &&
    visualizer({
      open: true,
      gzipSize: true,
      brotliSize: true,
      template: 'treemap', // or 'sunburst'
    }),
].filter(Boolean);

function assetFileNames(assetInfo: PreRenderedAsset) {
  if (assetInfo.name === 'main.css') {
    return '[name][extname]';
  }

  return '[name]-[hash][extname]';
}

// Netlify and local dev server
const sampleAppBuild: BuildEnvironmentOptions = {
  outDir: './build',
  rollupOptions: {
    input: {
      main: 'src/SampleApp.tsx',
      index: 'index.html',
    } as Record<string, string>,
    output: {
      assetFileNames,
      inlineDynamicImports: false,
      exports: 'named' as const,
    },
  },
};

// Legacy production build, hosted by unpkg.com (includes React, auto-binds to DOM)
const hostedBuild: BuildEnvironmentOptions = {
  outDir: './dist',
  rollupOptions: {
    input: {
      main: 'src/main.tsx',
    } as Record<string, string>,
    output: {
      entryFileNames: '[name].mjs',
      assetFileNames,
      inlineDynamicImports: false,
      exports: 'named' as const,
    },
  },
};

const libEntry: InputOption = [
  path.resolve(__dirname, 'src/exports/index.ts'),
  path.resolve(__dirname, 'src/exports/mayan.ts'),
  path.resolve(__dirname, 'src/exports/ntt.ts'),
  path.resolve(__dirname, 'src/exports/hosted.ts'),
  path.resolve(__dirname, 'src/exports/executor.ts'),
  path.resolve(__dirname, 'src/exports/lifi.ts'),
  path.resolve(__dirname, 'src/exports/monad.ts'),
];

const rollupInput: InputOption = {
  index: 'src/exports/index.ts',
  mayan: 'src/exports/mayan.ts',
  ntt: 'src/exports/ntt.ts',
  hosted: 'src/exports/hosted.ts',
  executor: 'src/exports/executor.ts',
  lifi: 'src/exports/lifi.ts',
  monad: 'src/exports/monad.ts',
};

const external = [
  'react',
  'react/jsx-runtime',
  '@emotion/react',
  '@emotion/styled',
  '@mui/material',
  '@mui/icons-material',
  '@mui/styled-engine',
  '@mui/system',
];

// Production build, for npm import
const libBuild: BuildEnvironmentOptions = {
  outDir: './lib',
  lib: {
    entry: libEntry,
    formats: isAnalyze ? ['es'] : ['es', 'cjs'],
    fileName: (format, entryname) => {
      const n = entryname.split('/').pop()!;
      return `${n.split('.')[0]}.${format === 'es' ? 'mjs' : 'js'}`;
    },
  },
  rollupOptions: {
    input: rollupInput,
    output: {
      assetFileNames,
      inlineDynamicImports: false,
      exports: 'named' as const,
    },
    external,
  },
};

// Minimal build, for submodule import
const minimalBuild: BuildEnvironmentOptions = {
  sourcemap: true,
  minify: false,
  outDir: './lib',
  lib: {
    entry: libEntry,
    formats: ['es'],
  },
  rollupOptions: {
    input: rollupInput,
    output: {
      entryFileNames: '[name].mjs',
      chunkFileNames: '[name].mjs',
      assetFileNames: '[name].[ext]',
      inlineDynamicImports: false,
      preserveModules: true,
      preserveModulesRoot: 'src',
    },
    external,
  },
  terserOptions: {
    mangle: false,
    compress: false,
  },
};

export default defineConfig(({ command, mode }: ConfigEnv) => {
  const env = loadEnv(mode, process.cwd(), '');
  const isHosted = !!env.VITE_BUILD_HOSTED;
  const isNetlify = !!env.VITE_BUILD_NETLIFY;
  const isMinimal = !!env.VITE_BUILD_MINIMAL;
  const isSampleApp = command === 'serve' || (command === 'build' && isNetlify);

  let build: BuildEnvironmentOptions | undefined = undefined;

  if (isSampleApp) {
    build = sampleAppBuild;
  } else if (command === 'build') {
    if (isHosted) {
      build = hostedBuild;
    } else if (isMinimal) {
      build = minimalBuild;
    } else {
      build = libBuild;
    }
  }

  return {
    build,
    define,
    envPrefix,
    resolve,
    plugins,
  };
});
