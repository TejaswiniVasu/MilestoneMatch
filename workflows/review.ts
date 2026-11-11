import { flow, type FlowContext } from '@renderinc/sdk/workflows';
import { matchEvidence, summarizeReadiness, proposeReadiness } from '../workflow-report.mjs';

type ReviewInput = { title: string; scope: string; delivery: string };
export const reviewReadiness = flow(
  { name: 'reviewReadiness', timeoutSeconds: 120, plan: 'flex' },
  async (ctx: FlowContext, input: ReviewInput) => {
    const review = await ctx.step('match-evidence', matchEvidence, [input]);
    const summary = await ctx.step('summarize-readiness', summarizeReadiness, [review]);
    const proposal = await ctx.step('draft-proposal', proposeReadiness, [review]);
    return { ...summary, proposal };
  },
);
