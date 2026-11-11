import { Channel3 } from '@channel3/sdk';
import { AppError } from './review.mjs';

function safeLink(value) {
  try {
    const url = new URL(value);
    return url.protocol === 'https:' && !url.username && !url.password ? url.href : null;
  } catch { return null; }
}

export function supplyRequest(body) {
  const query = typeof body?.query === 'string' ? body.query.trim() : '';
  if (query.length < 3 || query.length > 200) throw new AppError(400, 'Describe the supply in 3–200 characters.');
  const budgetCents = body?.budgetCents;
  if (!Number.isSafeInteger(budgetCents) || budgetCents < 100 || budgetCents > 1_000_000) {
    throw new AppError(400, 'Choose a per-item budget from USD 1 to USD 10,000.');
  }
  return { query, budgetCents };
}

export function channel3Client({ apiKey, request } = {}) {
  const client = apiKey ? new Channel3({ apiKey, maxRetries: 0, timeoutInSeconds: 15,
    ...(request ? { fetch: request } : {}) }) : null;
  return {
    configured: Boolean(client),
    async search(body) {
      const { query, budgetCents } = supplyRequest(body);
      if (!client) throw new AppError(503, 'Configure CHANNEL3_API_KEY on the server to search project supplies.');
      const options = { abortSignal: AbortSignal.timeout(20_000) };
      try {
        const page = await client.products.search({ query, limit: 6,
          filters: { price: { max_price: budgetCents / 100 }, availability: ['InStock'] },
          config: { country: 'US', currency: 'USD', language: 'en', mode: 'default' },
        }, options);
        // Refresh at display time, per Channel3 guidance. Never cache offer URLs.
        const products = await Promise.all(page.data.slice(0, 6).map(async ({ id }) => {
          try {
            const product = await client.products.retrieve({ product_id: id, country: 'US', currency: 'USD' }, options);
            const offers = (product.offers ?? []).flatMap(offer => {
              const url = safeLink(offer.url);
              const price = offer.price?.price;
              if (!url || offer.price?.currency !== 'USD' || !Number.isFinite(price) || price < 0
                || Math.round(price * 100) > budgetCents || offer.availability === 'OutOfStock') return [];
              return [{ url, retailer: String(offer.domain || new URL(url).hostname).slice(0, 100),
                cents: Math.round(price * 100), availability: offer.availability === 'InStock' ? 'In stock' : 'Availability not supplied' }];
            }).sort((a, b) => a.cents - b.cents).slice(0, 3);
            return offers.length ? { id: product.id, title: String(product.title).slice(0, 240), offers } : null;
          } catch { return null; } // Skip offers that can no longer be refreshed.
        }));
        return { query, budgetCents, currency: 'USD', country: 'US', source: 'Channel3',
          checkedAt: new Date().toISOString(), products: products.filter(Boolean) };
      } catch (error) {
        if ([401, 403].includes(error.statusCode)) throw new AppError(503, 'Channel3 credentials were rejected. Check the server environment setting.');
        if ([402, 429].includes(error.statusCode)) throw new AppError(429, 'Channel3 credits or request limits were reached. Try later or check your developer account.');
        throw new AppError(502, 'Channel3 search is temporarily unavailable. Try again shortly.');
      }
    },
  };
}
