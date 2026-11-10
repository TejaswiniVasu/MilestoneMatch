import {
  ApiError, CheckoutPaymentIntent, Client, Environment, OrdersController,
  PaypalExperienceUserAction, PaypalWalletContextShippingPreference,
} from '@paypal/paypal-server-sdk';
import { AppError, dollars } from './review.mjs';

function issuesFrom(error) {
  let body = error.result;
  if (!body && typeof error.body === 'string') {
    try { body = JSON.parse(error.body); } catch { /* Non-JSON upstream failure. */ }
  }
  return new Set((Array.isArray(body?.details) ? body.details : []).map((detail) => detail?.issue));
}

export function paypalClient({ clientId, clientSecret, origin, request }) {
  const configured = Boolean(clientId && clientSecret);
  const configuration = {
    environment: Environment.Sandbox,
    timeout: 12_000,
    clientCredentialsAuthCredentials: {
      oAuthClientId: clientId || '', oAuthClientSecret: clientSecret || '', oAuthClockSkew: 60,
    },
    httpClientOptions: { timeout: 12_000, retryConfig: { maxNumberOfRetries: 0 } },
  };
  // Tests inject the transport under the real SDK: auth, serialization, response
  // schemas and error mapping still run. Production uses the SDK's HTTP adapter.
  if (request) configuration.unstable_httpClientOptions = {
    adapter: async (config) => {
      const response = await request(config.url, {
        method: config.method.toUpperCase(), headers: config.headers,
        body: config.data, signal: config.signal,
      });
      return { data: await response.text(), status: response.status, statusText: response.statusText,
        headers: Object.fromEntries(response.headers), config };
    },
  };
  let orders;
  function resetClient() { orders = new OrdersController(new Client(configuration)); }
  resetClient();

  async function call(method, params) {
    if (!configured) throw new AppError(503, 'Set the PayPal Sandbox credentials in .env and restart the app.');
    const controller = orders;
    try {
      return (await controller[method](params, { abortSignal: AbortSignal.timeout(12_000) })).result;
    } catch (error) {
      // OAuth failures can leave a rejected token promise cached by this SDK.
      // Rebuild after auth/transport failures so a user retry can recover.
      const tokenRequest = String(error.request?.url ?? error.config?.url ?? '').includes('/v1/oauth2/token');
      if (orders === controller && (tokenRequest || !(error instanceof ApiError) || [401, 403].includes(error.statusCode))) resetClient();
      if (error instanceof ApiError) {
        const issues = issuesFrom(error);
        if (error.statusCode === 401) throw new AppError(503, 'PayPal rejected the Sandbox credentials. Check the app Client ID and Secret in .env, then restart.');
        if (issues.has('UNSUPPORTED_PAYEE_CURRENCY') || issues.has('CURRENCY_NOT_SUPPORTED')) {
          throw new AppError(409, 'This Sandbox seller cannot accept USD. Check its receiving settings, or use a US Business Sandbox seller and its app credentials.');
        }
        if (issues.has('INSTRUMENT_DECLINED')) throw new AppError(409, 'The Sandbox buyer payment method was declined. Return to PayPal to choose another test method, or start a fresh review.');
        if (issues.has('ORDER_NOT_APPROVED')) throw new AppError(409, 'Complete buyer approval in PayPal Sandbox first.');
        if (error.statusCode === 429) throw new AppError(503, 'PayPal Sandbox is limiting requests. Wait before retrying the same checkout.');
      }
      throw error;
    }
  }

  return {
    configured,
    async create(review, payment) {
      const callback = new URL('/', origin);
      callback.searchParams.set('review', review.id);
      callback.searchParams.set('checkout', 'approved');
      const returnUrl = callback.toString();
      callback.searchParams.set('checkout', 'cancelled');
      const order = await call('createOrder', {
        paypalRequestId: payment.createId, prefer: 'return=representation',
        body: {
          intent: CheckoutPaymentIntent.Capture,
          purchaseUnits: [{
            referenceId: 'approved-scope', customId: review.id,
            description: `MilestoneMatch | ${payment.approved.length} approved line(s)`,
            amount: { currencyCode: 'USD', value: dollars(payment.amount) },
          }],
          paymentSource: { paypal: { experienceContext: {
            shippingPreference: PaypalWalletContextShippingPreference.NoShipping,
            userAction: PaypalExperienceUserAction.Continue,
            returnUrl, cancelUrl: callback.toString(),
          } } },
        },
      });
      const action = order.links?.find(({ rel }) => rel === 'payer-action' || rel === 'approve');
      let redirect;
      try { if (action) redirect = new URL(action.href); } catch { /* Missing or malformed provider link. */ }
      if (!order.id || !['https://www.sandbox.paypal.com', 'https://sandbox.paypal.com'].includes(redirect?.origin) || redirect.username || redirect.password) {
        throw new AppError(502, 'PayPal Sandbox did not provide a checkout link. Start a fresh review if the order has expired.');
      }
      return { orderId: order.id, checkoutUrl: redirect.toString() };
    },
    async capture(review, payment) {
      let order;
      try {
        order = payment.receipt
          ? await call('getOrder', { id: payment.orderId })
          : await call('captureOrder', { id: payment.orderId, paypalRequestId: payment.captureId, prefer: 'return=representation', body: {} });
      } catch (error) {
        if (error instanceof ApiError && issuesFrom(error).has('ORDER_ALREADY_CAPTURED')) {
          order = await call('getOrder', { id: payment.orderId });
        } else throw error;
      }
      const unit = order.purchaseUnits?.[0];
      const captures = unit?.payments?.captures;
      const capture = captures?.[0];
      if (order.id !== payment.orderId || order.purchaseUnits?.length !== 1 || captures?.length !== 1 ||
          unit?.customId !== review.id || !capture?.id ||
          capture.amount?.currencyCode !== 'USD' || capture.amount?.value !== dollars(payment.amount)) {
        throw new AppError(502, 'The PayPal receipt did not match this review. Check the order in Sandbox before retrying.');
      }
      return { captureId: capture.id, status: capture.status, amount: capture.amount.value, currency: capture.amount.currencyCode };
    },
  };
}
