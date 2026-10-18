import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { fileURLToPath } from 'node:url';

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@kanca/engine/browser': fileURLToPath(new URL('../../packages/engine/src/browser.ts', import.meta.url)),
    },
  },
  server: {
    fs: { allow: ['../..'] },
    proxy: { '/api': 'http://localhost:3010' },
  },
  build: {
    target: 'es2022',
    sourcemap: true,
  },
});
