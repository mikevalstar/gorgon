import { defineConfig } from 'astro/config';
import sitemap from '@astrojs/sitemap';
import compressor from 'astro-compressor';

// https://astro.build/config
export default defineConfig({
  site: 'https://gorgonjs.dev',
  // compressor must stay last so it sees every generated file
  integrations: [sitemap(), compressor()],
  markdown: {
    syntaxHighlight: 'prism',
  },
  vite: {
    ssr: {
      external: ["prismjs"]
    }
  }
});
