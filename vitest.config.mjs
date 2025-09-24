import { defineConfig } from 'vitest/config';
import path from 'path';

export default defineConfig({
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: ['./src/setupTests.ts'],
    exclude: [
      '**/node_modules/**',
      '**/dist/**',
      '**/lib/**',
      '**/*.e2e.test.ts',
      '**/e2e/**',
      '**/tests/**',
    ],
    watch: false,
  },
  resolve: {
    alias: {
      utils: path.resolve(__dirname, './src/utils'),
      config: path.resolve(__dirname, './src/config'),
      components: path.resolve(__dirname, './src/components'),
      contexts: path.resolve(__dirname, './src/contexts'),
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
      theme: path.resolve(__dirname, './src/theme'),
    },
  },
});
