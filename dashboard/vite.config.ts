import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// The `base` is configurable so the same build works both locally (default '/')
// and on GitHub Pages under a repo subpath. Set BASE_PATH at build time, e.g.
//   BASE_PATH=/measure-loading-times/ npm run build
// The GitHub Pages workflow sets this automatically.
const base = process.env.BASE_PATH ?? '/';

export default defineConfig({
  base,
  plugins: [react()],
  build: {
    outDir: 'dist',
    sourcemap: false,
    chunkSizeWarningLimit: 1200,
  },
});
