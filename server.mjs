import { createServer } from 'node:http';
import { readFile } from 'node:fs/promises';
import { randomBytes, randomUUID } from 'node:crypto';
import { pathToFileURL } from 'node:url';
import { approveLines, AppError, draftPlan, parseReview } from './review.mjs';
import { paypalClient } from './paypal.mjs';
import { channel3Client, supplyRequest } from './channel3.mjs';
import { sample, scenarios } from './example.mjs';

const staticPaths = new Map([
  ['/', ['index.html', 'text/html; charset=utf-8']],
  ['/style.css', ['style.css', 'text/css; charset=utf-8']],
  ['/app.js', ['app.js', 'text/javascript; charset=utf-8']],
  ['/mark.svg', ['mark.svg', 'image/svg+xml']],
  ['/analytics-data.js', ['analytics-data.js', 'text/javascript; charset=utf-8']],
  ['/generated/studio.js', ['generated/studio.js', 'text/javascript; charset=utf-8']],
  ['/timeline-data.js', ['timeline-data.js', 'text/javascript; charset=utf-8']],
  ['/generated/timeline.js', ['generated/timeline.js', 'text/javascript; charset=utf-8']],
  ['/generated/timeline.css', ['generated/timeline.css', 'text/css; charset=utf-8']],
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

export function buildServer({ origin, payments, studioLicenseKey = '', bryntumLicenseKey = '', supplies = channel3Client() }) {
  const reviews = new Map();
  let supplyWindow = 0, supplyRequests = 0, supplyBusy = false;
  const ttl = 8 * 60 * 60 * 1000;
  return createServer(async (request, response) => {
    const json = (status, data) => response.writeHead(status, { 'Content-Type': 'application/json; charset=utf-8' }).end(JSON.stringify(data));
    response.setHeader('Cache-Control', 'no-store');
    response.setHeader('Referrer-Policy', 'no-referrer');
    response.setHeader('X-Content-Type-Options', 'nosniff');
    const nonce = randomBytes(16).toString('base64');
    // Pinned Studio/Charts emit a few fixed styles without propagating styleNonce.
    // Permit only their exact hashes; other style elements still require a nonce.
    const vendorStyleHashes = [
      'ydedGqCb79ipYJuuWRyOTMrKbkjYWv8WIjG7SRdnEPU=',
      'qQh5MACkb9yIcbPdi4lOsJy5dWKd901m0f4cHuMtuF8=',
      'TLR4GbBojMTnKgNWDid3ScmLNCCuE4NUzxTHyMm7Zc4=',
      '47DEQpj8HBSa+/TImW+5JCeuQeRkm5NMpJWZG3hSuFU=',
    ].map((hash) => `'sha256-${hash}'`).join(' ');
    response.setHeader('Content-Security-Policy', `default-src 'self'; style-src 'self' 'nonce-${nonce}' ${vendorStyleHashes}; style-src-attr 'unsafe-inline'; img-src 'self' data:; font-src 'self' data:; base-uri 'none'; frame-ancestors 'none'; form-action 'self'`);
    try {
      const { pathname } = new URL(request.url, origin);
      if (request.method === 'GET' && /^\/generated\/[\w-]+\.(woff2?|ttf)$/.test(pathname)) {
        const bytes = await readFile(new URL('./public' + pathname, import.meta.url));
        const type = pathname.endsWith('.woff2') ? 'font/woff2' : pathname.endsWith('.woff') ? 'font/woff' : 'font/ttf';
        return response.writeHead(200, { 'Content-Type': type }).end(bytes);
      }
      if (request.method === 'GET' && staticPaths.has(pathname)) {
        const [file, type] = staticPaths.get(pathname);
        const source = await readFile(new URL('./public/' + file, import.meta.url));
        const bytes = file === 'index.html' ? Buffer.from(source.toString().replace('__STYLE_NONCE__', nonce)) : source;
        return response.writeHead(200, { 'Content-Type': type }).end(bytes);
      }
      if (request.method === 'GET' && pathname === '/api/config') {
        const local = ['localhost', '127.0.0.1', '[::1]'].includes(new URL(origin).hostname);
        return json(200, { sandboxConfigured: payments.configured, channel3Configured: supplies.configured, sample, scenarios, studioLicenseKey,
          studioEnabled: local || Boolean(studioLicenseKey), bryntumLicenseKey, timelineEnabled: local || Boolean(bryntumLicenseKey) });
      }
      if (request.method === 'GET' && pathname === '/health') return json(200, { status: 'ok' });
      if (request.method !== 'POST') throw new AppError(404, 'This page does not exist.');
      if (request.headers.origin !== origin) throw new AppError(403, 'Open the app at ' + origin + ' and try again.');
      const body = await readBody(request);

      if (pathname === '/api/reviews') {
        for (const [id, review] of reviews) {
          if (review.expiresAt <= Date.now()) reviews.delete(id);
        }
        if (reviews.size >= 200) throw new AppError(429, 'Too many active reviews. Restart the local demo or try later.');
        const result = { id: randomUUID(), createdAt: new Date().toISOString(), ...parseReview(body) };
        reviews.set(result.id, { ...result, expiresAt: Date.now() + ttl, events: [
          { type: 'review.created', at: result.createdAt, modelVersion: result.modelVersion },
        ] });
        return json(201, result);
      }

      const route = /^\/api\/reviews\/([0-9a-f-]{36})\/(order|capture|plan|record|supplies)$/.exec(pathname);
      if (!route) throw new AppError(404, 'This endpoint does not exist.');
      const review = reviews.get(route[1]);
      if (!review || review.expiresAt <= Date.now()) throw new AppError(404, 'This review expired. Run the review again.');
      if (route[2] === 'supplies') {
        supplyRequest(body);
        if (!supplies.configured) throw new AppError(503, 'Configure CHANNEL3_API_KEY on the server to search project supplies.');
        if (Date.now() - supplyWindow > 3_600_000) { supplyWindow = Date.now(); supplyRequests = 0; }
        if (supplyBusy || supplyRequests >= 30) throw new AppError(429, 'Demo supply-search limit reached. Try later.');
        supplyRequests++; supplyBusy = true;
        try { return json(200, await supplies.search(body)); }
        finally { supplyBusy = false; }
      }
      if (route[2] === 'plan') return json(200, draftPlan(review, body?.budgetCents));
      if (route[2] === 'record') {
        if (review.payment?.receipt?.status !== 'COMPLETED') throw new AppError(409, 'A completed capture is required for a payment record.');
        const payment = review.payment;
        return json(200, { version: 2, project: review.title, reviewId: review.id, createdAt: review.createdAt,
          source: review.source, sourceHash: review.sourceHash, modelVersion: review.modelVersion,
          currency: 'USD', environment: 'sandbox', orderId: payment.orderId, receipt: payment.receipt,
          approvedCents: payment.amount, unpaidCents: review.total - payment.amount,
          scope: review.items.map((item) => ({ ...item, approved: payment.approved.some(({ id }) => id === item.id) })),
          events: review.events });
      }
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
            review.events.push({ type: 'order.created', at: new Date().toISOString(), orderId: order.orderId,
              approvedIds: payment.approved.map(({ id }) => id), amount: payment.amount });
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
          if (!review.events.some((event) => event.type === 'capture.' + receipt.status && event.captureId === receipt.captureId)) {
            review.events.push({ type: 'capture.' + receipt.status, at: new Date().toISOString(), captureId: receipt.captureId });
          }
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
  const host = process.env.HOST || '127.0.0.1';
  const origin = (process.env.APP_ORIGIN || process.env.RENDER_EXTERNAL_URL || `http://127.0.0.1:${port}`).replace(/\/$/, '');
  const parsedOrigin = new URL(origin);
  if (parsedOrigin.origin !== origin || !['http:', 'https:'].includes(parsedOrigin.protocol) || parsedOrigin.username || parsedOrigin.password) {
    throw new Error('APP_ORIGIN must be an HTTP(S) origin with no path or credentials.');
  }
  const payments = paypalClient({
    clientId: process.env.PAYPAL_CLIENT_ID,
    clientSecret: process.env.PAYPAL_CLIENT_SECRET,
    origin,
  });
  buildServer({ origin, payments, studioLicenseKey: process.env.AG_STUDIO_LICENSE_KEY, bryntumLicenseKey: process.env.BRYNTUM_LICENSE_KEY, supplies: channel3Client({ apiKey: process.env.CHANNEL3_API_KEY }) }).listen(port, host, () => {
    console.log('MilestoneMatch at ' + origin);
  });
}
