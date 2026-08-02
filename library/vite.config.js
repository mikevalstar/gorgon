// vite.config.ts
const path = require('path');
const {defineConfig} = require('vite');
// vite-plugin-dts >=3.7 dropped its CJS default export
const dts = require('vite-plugin-dts').default;

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
    },
  },
});
