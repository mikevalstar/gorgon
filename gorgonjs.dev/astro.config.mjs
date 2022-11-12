import { defineConfig } from 'astro/config';
import sitemap from '@astrojs/sitemap';
import compress from 'vite-plugin-compression';

// https://astro.build/config
export default defineConfig({
  site: 'https://gorgonjs.dev',
  integrations: [sitemap()],
  markdown: {
    syntaxHighlight: 'prism',
  },
  vite: {
    plugins: [compress({
      ext: '.br',
      algorithm: 'brotliCompress'
    }), compress({
      ext: '.gz',
      algorithm: 'gzip'
    })],
    build: {
      // emptyOutDir: false, // Implement later as an option
    },
    ssr:{
      external: ["prismjs"]
    }
  }
});
