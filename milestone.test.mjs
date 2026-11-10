import assert from 'node:assert/strict';
import { Readable } from 'node:stream';
import test from 'node:test';
import { sample } from './example.mjs';
import { classify } from './model.mjs';
import { paypalClient } from './paypal.mjs';
import { approveLines, draftPlan, parseReview } from './review.mjs';
import { evidenceCases } from './evidence-cases.mjs';
import { createHash } from 'node:crypto';
import { buildServer } from './server.mjs';

const origin = 'http://127.0.0.1:3000';

test('held-out paraphrases and out-of-domain updates', () => {
  const cases = [
    ['Screen reader and keyboard navigation checks passed.', 'accessibility'],
    ['GA4 conversion tracking is recording purchase events.', 'analytics'],
    ['Edited product copy and website headlines are attached.', 'copy'],
    ['The final design frames are shared in the Figma prototype.', 'design'],
    ['The hosted staging preview is live and the link is included.', 'deployment'],
    ['Installation documentation and troubleshooting notes are available.', 'documentation'],
    ['The original project files are in the handoff ZIP.', 'handoff'],
    ['The contact form now sends submissions through the CRM webhook.', 'integration'],
    ['Phone viewport testing is complete on Android and iPhone.', 'mobile'],
    ['The page speed audit includes Lighthouse timings.', 'performance'],
    ['The regression suite and acceptance test logs are available.', 'qa'],
    ['The narrated demo video and screen recording are uploaded.', 'video'],
    ['A courier collected the wedding flowers.', undefined],
    ['The rent deposit goes to my landlord.', undefined],
  ];
  for (const [input, expected] of cases) assert.equal(classify(input)?.label, expected, input);
});

test('the split follows human approval and excludes pending and missing work', () => {
  const review = parseReview(sample);
  assert.deepEqual(review.items.map(({ status }) => status), ['candidate', 'candidate', 'missing', 'pending']);
  assert.equal(review.total, 30_000);
  assert.equal(approveLines(review, ['line-2', 'line-1']).amount, 24_000);
  assert.equal(approveLines(review, ['line-2']).amount, 9_000);
  assert.throws(() => approveLines(review, ['line-4']), /reported delivery evidence/);
  assert.throws(() => approveLines(review, ['line-1', 'line-1']), /distinct/);
});

test('contradictory evidence and duplicate deliverable categories require review', () => {
  const conflicting = parseReview({ ...sample, delivery: sample.delivery + '\nThe Figma design mockups are not ready.' });
  assert.equal(conflicting.items[0].status, 'pending');
  const ambiguous = parseReview({ ...sample, scope: sample.scope + '\n15 | Share another Figma design mockup' });
  assert.equal(ambiguous.items[0].status, 'unclear');
  assert.throws(() => parseReview({ ...sample, scope: '4.999 | Design layout' }), /USD amount/);
});

test('adversarial evidence and explicit acceptance requirements', () => {
  for (const [name, scope, delivery, expected] of evidenceCases) {
    const review = parseReview({ title: name, scope, delivery });
    assert.equal(review.items[0].status, expected, name);
    if (expected !== 'candidate') assert.throws(() => approveLines(review, ['line-1']), /reported delivery evidence/, name);
  }
});

test('bounded proposals never approve blocked items or exceed the budget', () => {
  const review = parseReview(sample);
  for (const budget of [1, 8999, 9000, 14999, 15000, 23999, 24000, 30000]) {
    const plan = draftPlan(review, budget);
    assert.ok(plan.amount <= budget);
    assert.equal(plan.amount + plan.unpaid, review.total);
    assert.ok(plan.proposedIds.every((id) => ['line-1', 'line-2'].includes(id)));
    if (plan.proposedIds.length) assert.equal(approveLines(review, plan.proposedIds).amount, plan.amount);
    assert.equal(plan.steps.length, review.items.length);
  }
  assert.deepEqual(draftPlan(review, 10000).proposedIds, ['line-2']);
  for (const bad of [0, -1, 30001, 1.5, '24000', null, Infinity]) {
    assert.throws(() => draftPlan(review, bad), /payment limit/);
  }
  assert.equal(review.payment, undefined);
});

function request(server, route, data, headers = {}, method = 'POST') {
  return new Promise((resolve, reject) => {
    const incoming = Object.assign(Readable.from([JSON.stringify(data)]), {
      headers: { origin, 'content-type': 'application/json', ...headers },
      url: route,
      method,
    });
    let code;
    const response = {
      setHeader() {},
      writeHead(status) { code = status; return this; },
      end(body) {
        const value = Buffer.isBuffer(body) ? body.toString() : body;
        resolve({ code, body: value?.startsWith('{') ? JSON.parse(value) : value });
      },
    };
    server.listeners('request')[0](incoming, response).catch(reject);
  });
}

test('HTTP review, exact PayPal request, concurrent retries and receipt', async () => {
  let orderPayload;
  let captureCalls = 0;
  let createCalls = 0;
  let orderApproved = false;
  let captureTotal = '240.00';
  let captureRequestId;
  const calls = [];
  const payments = paypalClient({
    clientId: 'test-client',
    clientSecret: 'test-secret',
    origin,
    request: async (url, options) => {
      calls.push(url);
      assert.equal(new URL(url).origin, 'https://api-m.sandbox.paypal.com');
      const json = (data, status = 200) => Response.json(data, { status });
      if (url.endsWith('/v1/oauth2/token')) {
        assert.equal(options.body, 'grant_type=client_credentials');
        assert.match(options.headers.Authorization, /^Basic /);
        return json({ access_token: 'fixture', expires_in: 3600 });
      }
      assert.equal(options.headers.Authorization, 'Bearer fixture');
      if (url.endsWith('/orders')) {
        createCalls++;
        orderPayload = JSON.parse(options.body);
        assert.match(options.headers['PayPal-Request-Id'], /^[a-f0-9-]{36}$/);
        return json({ id: 'TEST-ORDER', links: [{ rel: 'payer-action', href: 'https://www.sandbox.paypal.com/checkoutnow?token=TEST-ORDER' }] });
      }
      assert.match(url, /\/TEST-ORDER\/capture$/);
      captureCalls++;
      captureRequestId ??= options.headers['PayPal-Request-Id'];
      assert.equal(options.headers['PayPal-Request-Id'], captureRequestId);
      if (!orderApproved) return json({ details: [{ issue: 'ORDER_NOT_APPROVED' }] }, 422);
      return json({
        id: 'TEST-ORDER',
        purchase_units: [{
          custom_id: orderPayload.purchase_units[0].custom_id,
          payments: { captures: [{ id: 'TEST-CAPTURE', status: 'COMPLETED', amount: { value: captureTotal, currency_code: 'USD' } }] },
        }],
      });
    },
  });
  const server = buildServer({ origin, payments });
  assert.match((await request(server, '/', {}, {}, 'GET')).body, /Evidence ledger/);
  const rejected = await request(server, '/api/reviews', sample, { origin: 'https://unrelated.example' });
  assert.equal(rejected.code, 403);
  const review = await request(server, '/api/reviews', sample);
  assert.equal(review.code, 201);
  const base = '/api/reviews/' + review.body.id;
  assert.equal((await request(server, base + '/record', {})).code, 409);
  const plan = await request(server, base + '/plan', { budgetCents: 24000 });
  assert.equal(plan.code, 200);
  assert.equal(plan.body.amount, 24000);
  assert.equal(createCalls, 0);

  assert.equal((await request(server, base + '/order', { approvedIds: ['line-3'] })).code, 400);
  const selection = { approvedIds: ['line-1', 'line-2'], amount: '0.01' };
  const orders = await Promise.all([
    request(server, base + '/order', selection),
    request(server, base + '/order', { approvedIds: [...selection.approvedIds].reverse() }),
  ]);
  assert.ok(orders.every((result) => result.code === 200 && result.body.orderId === 'TEST-ORDER'));
  assert.equal(createCalls, 1);
  assert.deepEqual(orderPayload.purchase_units[0].amount, { currency_code: 'USD', value: '240.00' });
  assert.equal(orderPayload.purchase_units[0].custom_id, review.body.id);
  assert.equal(new URL(orderPayload.payment_source.paypal.experience_context.return_url).searchParams.get('review'), review.body.id);
  assert.equal((await request(server, base + '/order', { approvedIds: ['line-1'] })).code, 409);
  assert.equal((await request(server, base + '/capture', { orderId: 'WRONG' })).code, 409);
  assert.equal(captureCalls, 0);

  const capture = () => request(server, base + '/capture', { orderId: 'TEST-ORDER' });
  assert.equal((await capture()).code, 409);
  orderApproved = true;
  captureTotal = '239.00';
  assert.equal((await capture()).code, 502);
  captureTotal = '240.00';
  const captures = await Promise.all([capture(), capture()]);
  const expected = { captureId: 'TEST-CAPTURE', status: 'COMPLETED', amount: '240.00', currency: 'USD' };
  assert.ok(captures.every((result) => result.code === 200));
  for (const result of captures) assert.deepEqual(result.body, expected);
  assert.deepEqual((await capture()).body, expected);
  assert.equal(captureCalls, 3);
  assert.equal(calls.filter((url) => url.endsWith('/v1/oauth2/token')).length, 1);
  const record = await request(server, base + '/record', { approvedCents: 1, approvedIds: ['line-4'] });
  assert.equal(record.code, 200);
  assert.equal(record.body.approvedCents, 24000);
  assert.equal(record.body.unpaidCents, 6000);
  assert.deepEqual(record.body.scope.filter(({ approved }) => approved).map(({ id }) => id), ['line-1', 'line-2']);
  assert.equal(record.body.sourceHash, createHash('sha256').update(JSON.stringify(record.body.source)).digest('hex'));
  assert.deepEqual(record.body.events.map(({ type }) => type), ['review.created', 'order.created', 'capture.COMPLETED']);
});
