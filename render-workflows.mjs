import { Render } from '@renderinc/sdk';
import { AppError } from './review.mjs';
export function workflowClient({ apiKey, flowSlug, client } = {}) {
  const configured = Boolean(apiKey && flowSlug);
  const render = configured ? (client ?? new Render({ token: apiKey })) : null;
  const failure = () => new AppError(502, 'Render Workflows is unavailable. Check its deployment and server settings; normal review still works.');
  return {
    configured,
    async start(input, reviewId) {
      if (!render) throw new AppError(503, 'Configure Render Workflows to run a background report.');
      try {
        const run = await render.workflows.startFlow(flowSlug, [input], {
          idempotencyKey: `readiness-${reviewId}`, signal: AbortSignal.timeout(12000),
        });
        if (!/^frn-[a-zA-Z0-9]+$/.test(run.id)) throw failure();
        return run.id;
      } catch { throw failure(); }
    },
    async status(id) {
      try {
        const run = await render.workflows.getFlowRun(id, AbortSignal.timeout(12000));
        if (run.id !== id) throw failure();
        if (run.status === 'succeeded') return { status: 'succeeded', report: run.results?.[0] };
        if (['failed', 'canceled'].includes(run.status)) return { status: 'failed' };
        return { status: ['pending', 'running', 'paused'].includes(run.status) ? run.status : 'pending' };
      } catch { throw failure(); }
    },
  };
}
