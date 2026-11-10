import { build } from 'esbuild';

await Promise.all([build({
  entryPoints: ['studio/dashboard.js'],
  outfile: 'public/generated/studio.js',
  bundle: true,
  format: 'esm',
  platform: 'browser',
  target: ['es2022'],
  minify: true,
  legalComments: 'eof',
}), build({
  entryPoints: ['studio/timeline.js'], outfile: 'public/generated/timeline.js',
  bundle: true, format: 'esm', platform: 'browser', target: ['es2022'], minify: true,
  legalComments: 'eof',
  loader: { '.woff': 'file', '.woff2': 'file', '.ttf': 'file' },
})]);
console.log('Built local AG Studio dashboard and Bryntum timeline.');
