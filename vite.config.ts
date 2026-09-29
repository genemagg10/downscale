import { defineConfig } from 'vite';

// Project Pages are served at /downscale/. Dev stays at / so local play is just localhost.
export default defineConfig(({ command }) => ({
  base: command === 'build' ? '/downscale/' : '/',
  build: {
    target: 'esnext',
  },
  optimizeDeps: {
    exclude: ['@dimforge/rapier3d-compat'],
  },
}));
