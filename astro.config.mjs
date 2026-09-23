// @ts-check
import { defineConfig } from 'astro/config';

// Lo stesso output va su GitHub Pages e su www.jcmaxwell.it: cambia solo `site`.
// `base` è stampato nel QR code della brochure e non si cambia (vedi AGENTS.md).
export default defineConfig({
  site: process.env.SITE_URL ?? 'https://iismaxwell.github.io',
  base: '/quadri-orari/',
  output: 'static',
  build: {
    format: 'directory',
  },
});
