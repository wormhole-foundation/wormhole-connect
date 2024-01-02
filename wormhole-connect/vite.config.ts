import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react-swc';
import checker from 'vite-plugin-checker';
import { nodePolyfills } from 'vite-plugin-node-polyfills';
import EnvironmentPlugin from 'vite-plugin-environment';
import path from 'path';

// https://vitejs.dev/config/
export default defineConfig({
  resolve: {
    alias: {
      utils: path.resolve(__dirname, './src/utils'),
      config: path.resolve(__dirname, './src/config'),
      components: path.resolve(__dirname, './src/components'),
      store: path.resolve(__dirname, './src/store'),
      routes: path.resolve(__dirname, './src/routes'),
      icons: path.resolve(__dirname, './src/icons'),
      hooks: path.resolve(__dirname, './src/hooks'),
      consts: path.resolve(__dirname, './src/consts'),
      public: path.resolve(__dirname, './public'),
    },
  },
  build: {
    outDir: './build',
    rollupOptions: {
      input: {
        main: 'src/main.tsx',
        index: 'index.html',
      },
      output: {
        entryFileNames: '[name].js',
        assetFileNames: '[name]-[hash][extname]',
      },
    },
  },
  plugins: [
    checker({
      typescript: true,
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
        Buffer: true,
      },
    }),
    EnvironmentPlugin('all', { prefix: 'REACT_APP_' }),
  ],
});
