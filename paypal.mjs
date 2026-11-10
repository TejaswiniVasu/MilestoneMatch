import { AppError, dollars } from './review.mjs';

const sandbox = 'https://api-m.sandbox.paypal.com';
const orderPath = '/v2/checkout/orders';

class PayPalError extends Error {
  constructor(body) {
    super('PayPal Sandbox rejected the request.');
    this.issues = new Set((body?.details ?? []).map(({ issue }) => issue));
  }
}

export function paypalClient({ clientId, clientSecret, origin, request = fetch }) {
  const configured = Boolean(clientId && clientSecret);
  let token;
  let expiresAt = 0;

  async function call(path, options) {
    const response = await request(sandbox + path, { ...options, signal: AbortSignal.timeout(12_000) });
    const data = await response.json();
    if (!response.ok) throw new PayPalError(data);
    return data;
  }

  async function authorize() {
    if (!configured) throw new AppError(503, 'Set the PayPal Sandbox credentials in .env and restart the app.');
    if (Date.now() < expiresAt) return token;
    const credentials = Buffer.from(clientId + ':' + clientSecret).toString('base64');
    const result = await call('/v1/oauth2/token', {
      method: 'POST',
      headers: {
        Authorization: 'Basic ' + credentials,
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: 'grant_type=client_credentials',
    });
    token = result.access_token;
    expiresAt = Date.now() + Math.max(0, result.expires_in - 60) * 1000;
    return token;
  }

  async function orderRequest(path, { payload, requestId } = {}) {
    const headers = { Authorization: 'Bearer ' + await authorize() };
    if (!requestId) return call(path, { headers });
    return call(path, {
      method: 'POST',
      headers: {
        ...headers,
        'Content-Type': 'application/json',
        'PayPal-Request-Id': requestId,
        Prefer: 'return=representation',
      },
      body: JSON.stringify(payload ?? {}),
    });
  }

  return {
    configured,
    async create(review, payment) {
      const callback = new URL('/', origin);
      callback.searchParams.set('review', review.id);
      callback.searchParams.set('checkout', 'approved');
      const returnUrl = callback.toString();
      callback.searchParams.set('checkout', 'cancelled');
      const order = await orderRequest(orderPath, {
        requestId: payment.createId,
        payload: {
          intent: 'CAPTURE',
          purchase_units: [{
            reference_id: 'approved-scope',
            custom_id: review.id,
            description: `MilestoneMatch | ${payment.approved.length} approved line(s)`,
            amount: { currency_code: 'USD', value: dollars(payment.amount) },
          }],
          payment_source: {
            paypal: {
              experience_context: {
                shipping_preference: 'NO_SHIPPING',
                user_action: 'CONTINUE',
                return_url: returnUrl,
                cancel_url: callback.toString(),
              },
            },
          },
        },
      });
      const action = order.links?.find(({ rel }) => rel === 'payer-action' || rel === 'approve');
      const redirect = action && new URL(action.href);
      if (!order.id || redirect?.protocol !== 'https:' || !['www.sandbox.paypal.com', 'sandbox.paypal.com'].includes(redirect.hostname)) {
        throw new AppError(502, 'PayPal Sandbox did not provide a checkout link. Start a fresh review if the order has expired.');
      }
      return { orderId: order.id, checkoutUrl: redirect.toString() };
    },
    async capture(review, payment) {
      const path = orderPath + '/' + encodeURIComponent(payment.orderId);
      let order;
      try {
        order = payment.receipt
          ? await orderRequest(path)
          : await orderRequest(path + '/capture', { requestId: payment.captureId });
      } catch (error) {
        if (error instanceof PayPalError && error.issues.has('ORDER_ALREADY_CAPTURED')) {
          order = await orderRequest(path);
        } else if (error instanceof PayPalError && error.issues.has('ORDER_NOT_APPROVED')) {
          throw new AppError(409, 'Complete buyer approval in PayPal Sandbox first.');
        } else {
          throw error;
        }
      }
      const unit = order.purchase_units?.[0];
      const capture = unit?.payments?.captures?.[0];
      if (order.id !== payment.orderId || unit?.custom_id !== review.id || !capture?.id ||
          capture.amount?.currency_code !== 'USD' || capture.amount?.value !== dollars(payment.amount)) {
        throw new AppError(502, 'The PayPal receipt did not match this review. Check the order in Sandbox before retrying.');
      }
      return {
        captureId: capture.id,
        status: capture.status,
        amount: capture.amount.value,
        currency: capture.amount.currency_code,
      };
    },
  };
}
