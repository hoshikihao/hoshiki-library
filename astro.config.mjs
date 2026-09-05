// @ts-check
import { defineConfig } from 'astro/config';
import sitemap from '@astrojs/sitemap';
import icon from 'astro-icon';

// https://astro.build/config
export default defineConfig({
  site: 'https://read.hoshikihao.com',
  integrations: [sitemap(), icon()],
  markdown: {
    shikiConfig: { theme: 'github-light', wrap: true },
  },
});
