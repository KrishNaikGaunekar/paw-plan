import { defineConfig } from 'vite';

export default defineConfig({
  // Relative base so the built output works under any GitHub Pages
  // subpath (e.g. https://<user>.github.io/<repo>/) without editing config
  // per-deploy target.
  base: './',
  build: {
    outDir: 'dist',
    assetsDir: 'assets',
  },
});
