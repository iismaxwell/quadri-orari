// @ts-check
import { defineConfig } from 'astro/config';
import { unified } from '@astrojs/markdown-remark';
import { domandeEspandibili } from './src/markdown/domande-espandibili.ts';

// Il sito sta alla radice del sottodominio quadri.jcmaxwell.it (CNAME verso GitHub Pages):
// `base` è `/` (vedi AGENTS.md).
export default defineConfig({
  site: process.env.SITE_URL ?? 'https://quadri.jcmaxwell.it',
  base: '/',
  output: 'static',
  build: {
    format: 'directory',
  },
  markdown: {
    processor: unified({ rehypePlugins: [domandeEspandibili] }),
  },
});
