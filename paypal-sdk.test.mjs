import assert from 'node:assert/strict';
import { randomUUID } from 'node:crypto';
import test from 'node:test';
import { paypalClient } from './paypal.mjs';

const origin = 'http://127.0.0.1:3000';
const token = { access_token: 'fixture-token', token_type: 'Bearer', expires_in: 3600 };
const checkout = { id: 'SDK-ORDER', links: [{ rel: 'payer-action', href: 'https://www.sandbox.paypal.com/checkoutnow?token=SDK-ORDER' }] };
const review = { id: randomUUID() };
const payment = () => ({ createId: randomUUID(), captureId: randomUUID(), amount: 24000, approved: [{ id: 'line-1' }], orderId: 'SDK-ORDER' });
const failure = (issue, status = 422) => Response.json({
  name: 'FIXTURE_ERROR', message: 'Synthetic provider error; do not reflect this message.', debug_id: 'fixture-debug', details: [{ issue }],
}, { status });
const captured = (status = 'COMPLETED', extra = false) => ({
  id: 'SDK-ORDER', purchase_units: [{ custom_id: review.id, payments: { captures: [
    { id: 'SDK-CAPTURE', status, amount: { currency_code: 'USD', value: '240.00' } },
    ...(extra ? [{ id: 'EXTRA', status, amount: { currency_code: 'USD', value: '1.00' } }] : []),
  ] } }],
});

test('a failed OAuth exchange can recover on the next user retry', async () => {
  let tokenCalls = 0;
  let orderCalls = 0;
  const client = paypalClient({ clientId: 'fixture-id', clientSecret: 'fixture-secret', origin,
    request: async (url) => {
      if (url.endsWith('/token')) {
        tokenCalls++;
        return tokenCalls === 1 ? failure('INVALID_CLIENT', 401) : Response.json(token);
      }
      orderCalls++;
      return Response.json(checkout);
    },
  });
  const selection = payment();
  await assert.rejects(client.create(review, selection), (error) => error.status === 503 && /Sandbox credentials/.test(error.message));
  assert.equal((await client.create(review, selection)).orderId, 'SDK-ORDER');
  assert.equal(tokenCalls, 2);
  assert.equal(orderCalls, 1);
});

test('SDK provider errors have actionable messages and no automatic order retry', async () => {
  for (const [issue, status, expected] of [
    ['UNSUPPORTED_PAYEE_CURRENCY', 422, /cannot accept USD/],
    ['CURRENCY_NOT_SUPPORTED', 422, /cannot accept USD/],
    ['INSTRUMENT_DECLINED', 422, /payment method was declined/],
    ['ORDER_NOT_APPROVED', 422, /buyer approval/],
    ['RATE_LIMIT', 429, /limiting requests/],
  ]) {
    let orderCalls = 0;
    const client = paypalClient({ clientId: 'fixture-id', clientSecret: 'fixture-secret', origin,
      request: async (url) => {
        if (url.endsWith('/token')) return Response.json(token);
        orderCalls++;
        return failure(issue, status);
      },
    });
    await assert.rejects(client.create(review, payment()), (error) => {
      assert.match(error.message, expected);
      assert.doesNotMatch(error.message, /Synthetic provider|fixture-secret|fixture-debug/);
      return [409, 503].includes(error.status);
    });
    assert.equal(orderCalls, 1, issue);
  }
});

test('already captured orders recover through a validated SDK GET', async () => {
  const calls = [];
  const client = paypalClient({ clientId: 'fixture-id', clientSecret: 'fixture-secret', origin,
    request: async (url, options) => {
      if (url.endsWith('/token')) return Response.json(token);
      calls.push({ url, method: options.method });
      return url.endsWith('/capture') ? failure('ORDER_ALREADY_CAPTURED') : Response.json(captured());
    },
  });
  assert.equal((await client.capture(review, payment())).captureId, 'SDK-CAPTURE');
  assert.deepEqual(calls.map(({ method }) => method), ['POST', 'GET']);
  const readUrl = new URL(calls[1].url);
  assert.equal(readUrl.origin, 'https://api-m.sandbox.paypal.com');
  assert.equal(readUrl.pathname, '/v2/checkout/orders/SDK-ORDER');
  assert.equal(readUrl.search, '');
});

test('pending capture status checks do not create a second capture', async () => {
  let captures = 0;
  let reads = 0;
  const client = paypalClient({ clientId: 'fixture-id', clientSecret: 'fixture-secret', origin,
    request: async (url, options) => {
      if (url.endsWith('/token')) return Response.json(token);
      if (options.method === 'POST') { captures++; return Response.json(captured('PENDING')); }
      reads++; return Response.json(captured());
    },
  });
  const selection = payment();
  selection.receipt = await client.capture(review, selection);
  assert.equal(selection.receipt.status, 'PENDING');
  assert.equal((await client.capture(review, selection)).status, 'COMPLETED');
  assert.equal(captures, 1);
  assert.equal(reads, 1);
});

test('the single-payment receipt check rejects extra captures and unsafe redirect hosts', async () => {
  const clientFor = (body) => paypalClient({ clientId: 'fixture-id', clientSecret: 'fixture-secret', origin,
    request: async (url) => Response.json(url.endsWith('/token') ? token : body),
  });
  await assert.rejects(clientFor(captured('COMPLETED', true)).capture(review, payment()), /receipt did not match/);
  for (const href of ['https://unrelated.example/pay', 'http://www.sandbox.paypal.com/pay',
    'https://user:pass@www.sandbox.paypal.com/pay', 'https://www.sandbox.paypal.com:9443/pay', 'not a URL']) {
    await assert.rejects(clientFor({ ...checkout, links: [{ rel: 'payer-action', href }] }).create(review, payment()), /checkout link/);
  }
});
