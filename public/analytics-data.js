const statuses = {
  candidate: 'Reported delivered', pending: 'Pending', missing: 'No evidence',
  unclear: 'Needs clarification', unclassified: 'Outside model coverage',
};

export function analyticsRows(review, approvedIds, receipt) {
  if (!review) return [];
  const selected = new Set(approvedIds);
  const captured = receipt?.status === 'COMPLETED';
  return review.items.map((item) => {
    const approved = selected.has(item.id) && item.status === 'candidate';
    const amount = item.cents / 100;
    return {
      id: item.id, project: review.title, milestone: item.description,
      status: statuses[item.status] ?? 'Needs clarification',
      amount, selected: approved ? amount : 0, captured: captured && approved ? amount : 0,
      unpaid: captured && approved ? 0 : amount,
      blocked: item.status === 'candidate' ? 0 : amount,
      decision: captured && approved ? 'Captured' : approved ? 'Selected' : 'Unselected',
      evidence: item.evidence.map(({ text }) => text).join(' · '),
      reason: (item.reasons ?? []).join(' '),
    };
  });
}
