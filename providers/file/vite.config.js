// vite.config.ts
const path = require('path');
const {defineConfig} = require('vite');
const dts = require('vite-plugin-dts');

module.exports = defineConfig({
  plugins: [dts({insertTypesEntry: true})],
  build: {
    sourcemap: true,
    lib: {
      type: ['es', 'cjs', 'umd'],
      entry: path.resolve(__dirname, 'index.ts'),
      name: 'Gorgon',
      fileName: format => `index.${format}.js`,
    },
    rollupOptions: {
      external: ['react'],
      output: {
        globals: {
          react: 'React'
        }
      }
    },
  },
});
