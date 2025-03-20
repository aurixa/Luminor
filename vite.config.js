/**
 * Luminor
 * Vite configuration
 * Code written by a mixture of AI (2025)
 */

import { defineConfig } from 'vite';

export default defineConfig({
  root: './',
  publicDir: 'public',
  server: {
    port: 5173,
    open: true
  },
  build: {
    outDir: 'dist',
    assetsDir: 'assets',
    emptyOutDir: true,
    sourcemap: true,
    minify: true,
    target: 'es2020',
  },
  optimizeDeps: {
    include: ['three']
  },
  resolve: {
    extensions: ['.ts', '.js']
  }
}); 