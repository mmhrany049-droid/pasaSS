import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { resolve } from 'node:path';

// base './' lets the built app run from any folder (USB, file server, GitHub Pages, nginx sub-path).
// Two entry points: index.html = student app, hub.html = «پروژه مرکز» (owner's hub).
export default defineConfig({
  plugins: [react()],
  base: './',
  build: { outDir: 'dist', sourcemap: false, rollupOptions: { input: { main: resolve(__dirname, 'index.html'), hub: resolve(__dirname, 'hub.html') } } },
});
