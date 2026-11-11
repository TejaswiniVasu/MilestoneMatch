import { parseReview } from './review.mjs';
import { evidenceCases } from './evidence-cases.mjs';

const results = evidenceCases.map(([name, scope, delivery, expected]) => {
  const result = parseReview({ title: name, scope, delivery });
  const actual = result.items[0].status;
  return { name, expected, actual, pass: expected === actual };
});
const passed = results.filter(({ pass }) => pass).length;
console.log(JSON.stringify({
  description: 'Synthetic evidence regression suite. Not a real-world accuracy estimate or proof of artifact completion.',
  cases: results.length, passed,
  unsafeCandidateErrors: results.filter(({ actual, expected }) => actual === 'candidate' && expected !== 'candidate').length,
  results,
}, null, 2));
if (passed !== results.length) process.exitCode = 1;
