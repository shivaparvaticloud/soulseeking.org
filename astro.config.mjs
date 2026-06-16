import { defineConfig } from 'astro/config';
import tailwind from '@astrojs/tailwind';

// https://astro.build
export default defineConfig({
  output: 'static',
  site: 'https://soulseeking.org',
  integrations: [tailwind()],
  build: {
    format: 'directory',
  },
  compressHTML: true,
});
