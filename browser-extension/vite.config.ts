import { defineConfig } from 'vite';
import { crx } from '@crxjs/vite-plugin';
import manifest from './manifest.config';

// CRXJS resolves the manifest's src/* entry paths (content scripts, background, popup)
// and bundles them into a loadable MV3 extension under dist/.
export default defineConfig({
  plugins: [crx({ manifest })],
  build: {
    outDir: 'dist',
    emptyOutDir: true,
  },
});
