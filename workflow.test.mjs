import test from 'node:test';
import assert from 'node:assert/strict';
import { reviewReadiness } from './generated/review-workflow.mjs';
import { readinessReport } from './workflow-report.mjs';
import { workflowClient } from './render-workflows.mjs';
import { sample } from './example.mjs';

test('Render flow checkpoints evidence, readiness and proposal without payment effects', async () => {
  const steps = [];
  const ctx = { step: async (name, fn, args) => { steps.push(name); return fn(...args); } };
  const result = await reviewReadiness.func(ctx, sample);
  assert.deepEqual(steps, ['match-evidence', 'summarize-readiness', 'draft-proposal']);
  assert.deepEqual(result, readinessReport(sample));
  assert.equal(result.totalCents, 30000);
  assert.equal(result.blockedCents, 6000);
  assert.equal(result.proposal.amount, 24000);
  assert.equal(result.proposal.proposedIds.length, 2);
  assert.ok(!('approvedIds' in result));
});

test('Render client scopes dispatch, uses idempotency, maps terminal results and hides errors', async () => {
  let captured;
  const report = readinessReport(sample);
  const client = workflowClient({ apiKey: 'test-private-key', flowSlug: 'demo/reviewReadiness', client: { workflows: {
    async startFlow(...args) { captured = args; return { id: 'frn-test123' }; },
    async getFlowRun(id) { return { id, status: 'succeeded', results: [report] }; },
  } } });
  assert.equal(await client.start(sample, 'review-123'), 'frn-test123');
  assert.equal(captured[0], 'demo/reviewReadiness');
  assert.deepEqual(captured[1], [sample]);
  assert.equal(captured[2].idempotencyKey, 'readiness-review-123');
  assert.equal(captured[2].signal.aborted, false);
  assert.deepEqual(await client.status('frn-test123'), { status: 'succeeded', report });
  const failed = workflowClient({ apiKey: 'test-private-key', flowSlug: 'demo/reviewReadiness', client: { workflows: {
    async startFlow() { throw new Error('test-private-key private raw response'); },
  } } });
  await assert.rejects(failed.start(sample, 'review-123'), e => e.status === 502 && !e.message.includes('test-private-key'));
});
