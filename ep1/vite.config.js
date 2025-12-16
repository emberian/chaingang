import { defineConfig } from 'vite';

export default defineConfig({
  base: '/chaingang/ep1/',
  server: {
    open: true
  },
  build: {
    outDir: 'dist',
    assetsDir: 'assets'
  }
});
