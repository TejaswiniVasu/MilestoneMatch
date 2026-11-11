import test from 'node:test';
import assert from 'node:assert/strict';
import { channel3Client, supplyRequest } from './channel3.mjs';

const input = { query: 'USB microphone for recording', budgetCents: 7500 };
test('Channel3 uses server-side SDK auth and refreshes offers within the separate budget', async () => {
  const calls = [];
  const client = channel3Client({ apiKey: 'fixture-secret', request: async (url, init) => {
    calls.push({ url: String(url), init });
    assert.equal(new Headers(init.headers).get('x-api-key'), 'fixture-secret');
    if (String(url).endsWith('/v1/search')) {
      const body = JSON.parse(init.body);
      assert.equal(body.filters.price.max_price, 75);
      assert.equal(body.config.currency, 'USD');
      return Response.json({ products: [{ id: 'microphone', title: 'Old title' }], next_page_token: null });
    }
    return Response.json({ id: 'microphone', title: '<b>Fresh microphone</b>', offers: [
      { url: 'https://retailer.example/mic', domain: 'retailer.example', price: { price: 49.99, currency: 'USD' }, availability: 'InStock' },
      { url: 'javascript:alert(1)', price: { price: 5, currency: 'USD' } },
      { url: 'https://retailer.example/expensive', price: { price: 76, currency: 'USD' } },
      { url: 'https://retailer.example/foreign', price: { price: 5, currency: 'GBP' } },
      { url: 'https://retailer.example/sold-out', price: { price: 5, currency: 'USD' }, availability: 'OutOfStock' },
    ] });
  } });
  const result = await client.search(input);
  assert.equal(calls.length, 2);
  assert.equal(result.products[0].title, '<b>Fresh microphone</b>');
  assert.equal(result.products[0].offers.length, 1);
  assert.equal(result.products[0].offers[0].cents, 4999);
  assert.equal(result.products[0].offers[0].url, 'https://retailer.example/mic');
  assert.ok(!JSON.stringify(result).includes('fixture-secret'));
});

test('Channel3 validates budget, handles missing config and hides provider errors without retries', async () => {
  for (const budgetCents of [-1, 0, 99, 1000001, 100.5, '7500']) assert.throws(() => supplyRequest({ ...input, budgetCents }));
  assert.throws(() => supplyRequest({ ...input, query: 'xx' }));
  await assert.rejects(channel3Client().search(input), /Configure CHANNEL3_API_KEY/);
  let requests = 0;
  const client = channel3Client({ apiKey: 'fixture-secret', request: async () => {
    requests++;
    return Response.json({ detail: 'fixture-secret raw upstream detail' }, { status: 401 });
  } });
  await assert.rejects(client.search(input), error => error.status === 503 && !error.message.includes('fixture-secret'));
  assert.equal(requests, 1);
});
