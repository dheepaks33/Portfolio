// @ts-check
import { defineConfig } from 'astro/config';
import sitemap from '@astrojs/sitemap';

// Served from GitHub Pages at https://dheepaks33.github.io/Portfolio/
export default defineConfig({
  site: 'https://dheepaks33.github.io',
  base: '/Portfolio',
  trailingSlash: 'ignore',
  integrations: [sitemap()],
});
