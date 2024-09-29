import { build } from 'esbuild';
import { dependencies } from './package.json';

const shared = {
  bundle: true,
  entryPoints: ['src/index.ts'],
  external: Object.keys(dependencies),
  minify: true,
  sourcemap: false,
};

build({
  ...shared,
  format: 'esm',
  outfile: './dist/index.esm.js',
  target: ['ES6'],
});

build({
  ...shared,
  format: 'cjs',
  outfile: './dist/index.cjs.js',
  target: ['ES6'],
});
