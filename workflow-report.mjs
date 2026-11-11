import { parseReview, draftPlan } from './review.mjs';
export const matchEvidence = input => parseReview(input);
export function summarizeReadiness(review) {
  const blocked = review.items.filter(item => item.status !== 'candidate');
  return { sourceHash: review.sourceHash, modelVersion: review.modelVersion,
    totalCents: review.total, blockedCents: blocked.reduce((sum, item) => sum + item.cents, 0),
    blockedCount: blocked.length, itemCount: review.items.length };
}
export const proposeReadiness = review => draftPlan(review, review.total);
export function readinessReport(input) {
  const review = matchEvidence(input);
  return { ...summarizeReadiness(review), proposal: proposeReadiness(review) };
}
