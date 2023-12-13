import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react-swc';
import { nodePolyfills } from 'vite-plugin-node-polyfills';
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
  },
  plugins: [
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
    }),
  ],
});
