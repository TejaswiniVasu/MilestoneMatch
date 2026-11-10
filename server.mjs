import { createServer } from 'node:http';
import { readFile } from 'node:fs/promises';
import { randomUUID } from 'node:crypto';
import { pathToFileURL } from 'node:url';
import { approveLines, AppError, parseReview } from './review.mjs';
import { paypalClient } from './paypal.mjs';
import { sample } from './example.mjs';

const staticPaths = new Map([
  ['/', ['index.html', 'text/html; charset=utf-8']],
  ['/style.css', ['style.css', 'text/css; charset=utf-8']],
  ['/app.js', ['app.js', 'text/javascript; charset=utf-8']],
  ['/mark.svg', ['mark.svg', 'image/svg+xml']],
]);

async function readBody(request) {
  if (!request.headers['content-type']?.startsWith('application/json')) {
    throw new AppError(415, 'Send a JSON request.');
  }
  let body = '';
  request.setEncoding('utf8');
  for await (const chunk of request) {
    body += chunk;
    if (Buffer.byteLength(body) > 16_384) throw new AppError(413, 'This request is too large.');
  }
  try {
    return JSON.parse(body);
  } catch {
    throw new AppError(400, 'The request could not be read as JSON.');
  }
}

export function buildServer({ origin, payments }) {
  const reviews = new Map();
  const ttl = 8 * 60 * 60 * 1000;
  return createServer(async (request, response) => {
    const json = (status, data) => response.writeHead(status, { 'Content-Type': 'application/json; charset=utf-8' }).end(JSON.stringify(data));
    response.setHeader('Cache-Control', 'no-store');
    response.setHeader('Referrer-Policy', 'no-referrer');
    response.setHeader('X-Content-Type-Options', 'nosniff');
    response.setHeader('Content-Security-Policy', "default-src 'self'; base-uri 'none'; frame-ancestors 'none'; form-action 'self'");
    try {
      const { pathname } = new URL(request.url, origin);
      if (request.method === 'GET' && staticPaths.has(pathname)) {
        const [file, type] = staticPaths.get(pathname);
        const bytes = await readFile(new URL('./public/' + file, import.meta.url));
        return response.writeHead(200, { 'Content-Type': type }).end(bytes);
      }
      if (request.method === 'GET' && pathname === '/api/config') {
        return json(200, { sandboxConfigured: payments.configured, sample });
      }
      if (request.method !== 'POST') throw new AppError(404, 'This page does not exist.');
      if (request.headers.origin !== origin) throw new AppError(403, 'Open the app at ' + origin + ' and try again.');
      const body = await readBody(request);

      if (pathname === '/api/reviews') {
        for (const [id, review] of reviews) {
          if (review.expiresAt <= Date.now()) reviews.delete(id);
        }
        if (reviews.size >= 200) throw new AppError(429, 'Too many active reviews. Restart the local demo or try later.');
        const result = { id: randomUUID(), ...parseReview(body) };
        reviews.set(result.id, { ...result, expiresAt: Date.now() + ttl });
        return json(201, result);
      }

      const route = /^\/api\/reviews\/([0-9a-f-]{36})\/(order|capture)$/.exec(pathname);
      if (!route) throw new AppError(404, 'This endpoint does not exist.');
      const review = reviews.get(route[1]);
      if (!review || review.expiresAt <= Date.now()) throw new AppError(404, 'This review expired. Run the review again.');
      if (route[2] === 'order') {
        if (!payments.configured) throw new AppError(503, 'Connect PayPal Sandbox using the README setup.');
        const selection = approveLines(review, body?.approvedIds);
        const selectionKey = selection.approved.map(({ id }) => id).join(',');
        const payment = review.payment ??= {
          ...selection, selectionKey, createId: randomUUID(), captureId: randomUUID(),
        };
        if (payment.selectionKey !== selectionKey) throw new AppError(409, 'The checkout selection is locked. Start a new review to change it.');
        if (payment.receipt) throw new AppError(409, 'This review already has a payment receipt.');
        if (!payment.creating) {
          payment.creating = payments.create(review, payment).then((order) => {
            Object.assign(payment, order);
            return order;
          }).catch((error) => {
            delete payment.creating;
            throw error;
          });
        }
        return json(200, await payment.creating);
      }

      const payment = review.payment;
      if (!payment?.orderId || payment.orderId !== body?.orderId) {
        throw new AppError(409, 'The PayPal order does not belong to this review.');
      }
      if (!payment.capturing && (!payment.receipt || payment.receipt.status === 'PENDING')) {
        payment.capturing = payments.capture(review, payment).then((receipt) => {
          payment.receipt = receipt;
          return receipt;
        }).finally(() => {
          delete payment.capturing;
        });
      }
      return json(200, payment.capturing ? await payment.capturing : payment.receipt);
    } catch (error) {
      if (error instanceof AppError) return json(error.status, { error: error.message });
      console.error('Request failed:', error.name, error.cause?.code ?? '');
      return json(502, { error: 'PayPal Sandbox could not complete the request. Check your setup and try again.' });
    }
  });
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  const port = Number(process.env.PORT || 3000);
  const host = '127.0.0.1';
  const origin = `http://${host}:${port}`;
  const payments = paypalClient({
    clientId: process.env.PAYPAL_CLIENT_ID,
    clientSecret: process.env.PAYPAL_CLIENT_SECRET,
    origin,
  });
  buildServer({ origin, payments }).listen(port, host, () => {
    console.log('MilestoneMatch at ' + origin);
  });
}
