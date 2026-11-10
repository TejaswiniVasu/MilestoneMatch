import { build } from 'esbuild';

await build({
  entryPoints: ['studio/dashboard.js'],
  outfile: 'public/generated/studio.js',
  bundle: true,
  format: 'esm',
  platform: 'browser',
  target: ['es2022'],
  minify: true,
  legalComments: 'eof',
});
console.log('Built local AG Studio dashboard.');
