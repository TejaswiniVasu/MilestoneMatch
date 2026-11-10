import { createHash } from 'node:crypto';
import { matchEvidence, modelVersion } from './model.mjs';

export class AppError extends Error {
  constructor(status, message) {
    super(message);
    this.status = status;
  }
}

export function dollars(cents) {
  return (cents / 100).toFixed(2);
}

export function parseReview(body) {
  const { title, scope, delivery } = body ?? {};
  if (typeof title !== 'string' || !title.trim() || title.trim().length > 80) {
    throw new AppError(400, 'Enter a project name from 1 to 80 characters.');
  }
  if (typeof scope !== 'string' || typeof delivery !== 'string' || scope.length > 2400 || delivery.length > 4000) {
    throw new AppError(400, 'Keep the agreed scope under 2,400 characters and the update under 4,000.');
  }
  const lines = scope.split(/\r?\n/).map((line) => line.trim()).filter(Boolean);
  const notes = delivery.split(/\r?\n/).map((line) => line.trim()).filter(Boolean);
  if (!lines.length || lines.length > 8 || notes.length > 16 || notes.some((line) => line.length > 300)) {
    throw new AppError(400, 'Use 1–8 scope lines and up to 16 update lines, with up to 300 characters per update.');
  }
  const items = lines.map((line, index) => {
    const match = /^(\d{1,5})(?:\.(\d{1,2}))?\s*\|\s*(.{3,240})$/.exec(line);
    if (!match) throw new AppError(400, `Scope line ${index + 1} needs a USD amount and a description, e.g. 150.00 | Deliver final mockups.`);
    const cents = Number(match[1]) * 100 + Number((match[2] ?? '').padEnd(2, '0'));
    if (!cents) throw new AppError(400, 'Every scope amount must be greater than zero.');
    return { id: 'line-' + (index + 1), description: match[3], cents };
  });
  const total = items.reduce((sum, item) => sum + item.cents, 0);
  if (total > 1_000_000) throw new AppError(400, 'Keep the sandbox total at or below $10,000.');
  const source = { title: title.trim(), scope, delivery };
  return { title: title.trim(), total, items: matchEvidence(items, notes), source, modelVersion,
    sourceHash: createHash('sha256').update(JSON.stringify(source)).digest('hex') };
}

export function draftPlan(review, budgetCents) {
  if (!Number.isSafeInteger(budgetCents) || budgetCents <= 0 || budgetCents > review.total) {
    throw new AppError(400, 'Set a payment limit greater than zero and no higher than the agreed total.');
  }
  let amount = 0;
  const proposedIds = [];
  const steps = review.items.map((item) => {
    const fits = amount + item.cents <= budgetCents;
    const proposed = item.status === 'candidate' && fits;
    if (proposed) { amount += item.cents; proposedIds.push(item.id); }
    return { itemId: item.id, action: proposed ? 'propose' : 'withhold',
      reason: item.status !== 'candidate' ? item.reasons.join(' ')
        : !fits ? 'This whole item exceeds the remaining payment limit.'
          : 'Matching completion claim; human artifact review and approval are still required.' };
  });
  return { budgetCents, amount, unpaid: review.total - amount, proposedIds, steps,
    policy: 'Scope order, whole items only, within your limit. No payment is made by drafting or applying this proposal.',
    clarification: review.items.filter((item) => item.status !== 'candidate').map((item) =>
      `${item.description}: ${item.nextAction}`).join('\n') };
}

export function approveLines(review, approvedIds) {
  if (!Array.isArray(approvedIds) || !approvedIds.length || new Set(approvedIds).size !== approvedIds.length) {
    throw new AppError(400, 'Select one or more distinct scope lines to approve.');
  }
  const approved = review.items.filter((item) => item.status === 'candidate' && approvedIds.includes(item.id));
  if (approved.length !== approvedIds.length) throw new AppError(400, 'Approve only scope lines with reported delivery evidence.');
  return { approved, amount: approved.reduce((sum, item) => sum + item.cents, 0) };
}
