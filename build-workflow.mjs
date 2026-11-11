import { build } from 'esbuild';
await build({ entryPoints: ['workflows/review.ts'], outfile: 'generated/review-workflow.mjs',
  bundle: true, packages: 'external', platform: 'node', format: 'esm', target: 'node22' });
console.log('Built Render readiness workflow.');
