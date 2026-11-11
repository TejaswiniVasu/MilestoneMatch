export function localDateInput(date = new Date()) {
  return [date.getFullYear(), String(date.getMonth() + 1).padStart(2, '0'), String(date.getDate()).padStart(2, '0')].join('-');
}

export function addDays(date, days) {
  const result = new Date(date);
  result.setDate(result.getDate() + days);
  return result;
}

export function timelineSnapshot(review, selectedIds, receipt, start, daysPerItem = 2, dependencies = false) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(start)) throw new Error('Choose a valid planned start date.');
  const [year, month, day] = start.split('-').map(Number);
  const startDate = new Date(year, month - 1, day, 9);
  if (year < 1900 || year > 2100 || localDateInput(startDate) !== start) throw new Error('Choose a valid planned start date between 1900 and 2100.');
  if (!Number.isSafeInteger(daysPerItem) || daysPerItem < 1 || daysPerItem > 30) throw new Error('Use 1–30 planned days per milestone.');
  const selected = new Set(selectedIds);
  const paid = new Set(receipt?.status === 'COMPLETED'
    ? review.items.filter((item) => selected.has(item.id) && item.status === 'candidate').map(({ id }) => id) : []);
  const resources = review.items.map((item, index) => ({
    id: item.id, name: `M${index + 1} · ${item.description}`, amount: item.cents / 100,
    payment: paid.has(item.id) ? 'Captured' : selected.has(item.id) && item.status === 'candidate' ? 'Selected, not paid' : 'Unpaid',
  }));
  const events = review.items.map((item, index) => {
    const captured = paid.has(item.id);
    const priorUnpaid = dependencies && index > 0 && !paid.has(review.items[index - 1].id);
    const state = captured ? 'Captured' : item.status !== 'candidate' ? 'Needs evidence'
      : priorUnpaid ? 'Prior milestone unpaid' : 'Ready for review';
    return {
      id: item.id, resourceId: item.id,
      name: `${state} · USD ${(item.cents / 100).toFixed(2)}`,
      startDate: addDays(startDate, index * daysPerItem), endDate: addDays(startDate, (index + 1) * daysPerItem),
      eventColor: captured ? 'green' : priorUnpaid ? 'orange' : item.status === 'candidate' ? 'blue' : 'red',
      readOnly: captured,
    };
  });
  return {
    reviewId: review.id, startDate, endDate: addDays(startDate, Math.max(14, review.items.length * daysPerItem + 2)),
    resources, events,
    dependencies: dependencies ? review.items.slice(1).map((item, index) => ({
      id: 'dependency-' + index, fromEvent: review.items[index].id, toEvent: item.id, type: 2,
    })) : [],
    capturedCount: paid.size,
  };
}
