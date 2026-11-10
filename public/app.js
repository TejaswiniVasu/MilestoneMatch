const byId = (id) => document.getElementById(id);
const form = byId('intake');
const reviewButton = byId('review-button');
const checkoutButton = byId('checkout');
const captureButton = byId('capture');
const configReady = fetch('/api/config').then((response) => response.json()).catch(() => ({}));
const formatter = new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' });
const money = (cents) => formatter.format(cents / 100);
const storageKey = 'milestone-match-checkout';
const labels = {
  candidate: 'Reported delivered',
  pending: 'Pending',
  missing: 'No evidence',
  unclear: 'Needs clarification',
  unclassified: 'Outside model coverage',
};
let config = {};
let review;
let order;
let selected = new Set();
let receipt;
let plan;
let checkoutPending = false;

function showError(id, message = '') {
  const element = byId(id);
  element.textContent = message;
  element.hidden = !message;
}

async function post(url, payload) {
  const response = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  const data = await response.json();
  if (!response.ok) throw new Error(data.error || 'Request failed.');
  return data;
}

function updateTotals() {
  const amount = review.items.reduce((total, item) => total + (selected.has(item.id) ? item.cents : 0), 0);
  byId('total').textContent = money(review.total);
  byId('approved').textContent = money(amount);
  byId('held').textContent = money(review.total - amount);
  const note = byId('payment-note');
  checkoutButton.hidden = Boolean(order?.returned || receipt);
  captureButton.hidden = !order?.returned || Boolean(receipt && receipt.status !== 'PENDING');
  checkoutButton.disabled = checkoutPending || !amount || !config.sandboxConfigured;
  if (receipt?.status === 'COMPLETED') note.textContent = 'PayPal confirmed the sandbox capture.';
  else if (receipt?.status === 'PENDING') note.textContent = 'PayPal is still processing this capture. Check its status below.';
  else if (receipt) note.textContent = 'Review the capture status in the PayPal Developer Dashboard.';
  else if (order?.returned) note.textContent = 'Buyer approval received. Capture ' + money(amount) + ' to finish.';
  else if (order?.cancelled) note.textContent = 'Checkout was cancelled. The same approval selection can be retried.';
  else if (!config.sandboxConfigured) note.textContent = 'AI review is available. See the README to connect PayPal Sandbox.';
  else if (amount) note.textContent = 'PayPal will receive the approved total of ' + money(amount) + '.';
  else note.textContent = 'Select the items you approve to continue.';
  byId('draft-plan').disabled = Boolean(order) || checkoutPending;
  byId('budget').disabled = Boolean(order) || checkoutPending;
  const apply = byId('apply-plan');
  if (apply) apply.disabled = Boolean(order) || checkoutPending || !plan?.proposedIds.length;
}

function node(tag, className, value) {
  const element = document.createElement(tag);
  if (className) element.className = className;
  if (value) element.textContent = value;
  return element;
}

function render() {
  byId('empty').hidden = Boolean(review);
  byId('ledger').hidden = !review;
  if (!review) return;

  const items = byId('items');
  items.replaceChildren();
  for (const item of review.items) {
    const row = node('article', 'evidence-row');
    const heading = node('div', 'row-heading');
    const amount = node('span', 'amount', money(item.cents));
    if (item.status === 'candidate') {
      const checkbox = node('input');
      checkbox.type = 'checkbox';
      checkbox.id = item.id;
      checkbox.checked = selected.has(item.id);
      checkbox.disabled = Boolean(order) || checkoutPending;
      checkbox.addEventListener('change', () => {
        if (checkbox.checked) selected.add(item.id);
        else selected.delete(item.id);
        updateTotals();
      });
      const label = node('label', '', item.description);
      label.htmlFor = item.id;
      heading.append(checkbox, label, amount);
    } else {
      heading.append(node('span'), node('span', 'row-title', item.description), amount);
    }
    const detail = node('p', 'detail');
    detail.append(node('span', 'chip ' + item.status, labels[item.status]));
    const explanation = item.evidence.length
      ? item.evidence.map(({ text }) => '“' + text + '”').join(' · ')
      : item.status === 'unclassified'
        ? 'Try a more specific description.'
        : 'No matching line in the delivery update.';
    detail.append(document.createTextNode(explanation));
    const reasoning = node('details', 'reasoning');
    reasoning.append(node('summary', '', 'Why this decision?'));
    for (const reason of item.reasons ?? []) reasoning.append(node('p', '', reason));
    reasoning.append(node('p', 'next-action', item.nextAction));
    if (item.evidence.length) reasoning.append(node('p', '', 'Source: ' + item.evidence.map(({ id }) => id).join(', ')));
    row.append(heading, detail, reasoning);
    items.append(row);
  }

  const receiptBox = byId('receipt');
  receiptBox.hidden = !receipt;
  byId('export').hidden = receipt?.status !== 'COMPLETED';
  receiptBox.replaceChildren();
  if (receipt) {
    const label = receipt.status === 'COMPLETED' ? 'Payment captured' : 'Capture status · ' + receipt.status;
    receiptBox.append(
      node('strong', '', label + ' · USD ' + receipt.amount),
      node('p', '', 'Order ' + order.orderId),
      node('p', '', 'Capture ' + receipt.captureId),
    );
  }
  captureButton.textContent = receipt?.status === 'PENDING' ? 'Check payment status' : 'Capture sandbox payment →';
  updateTotals();
}

function fields(data) {
  for (const name of ['title', 'scope', 'delivery']) form.elements[name].value = data[name];
}

function saveCheckout() {
  sessionStorage.setItem(storageKey, JSON.stringify({
    review, approvedIds: [...selected], order, receipt, input: Object.fromEntries(new FormData(form)),
  }));
}

function clearReview() {
  review = undefined;
  order = undefined;
  receipt = undefined;
  plan = undefined;
  checkoutPending = false;
  byId('plan').replaceChildren();
  byId('plan').hidden = true;
  showError('plan-error');
  selected.clear();
  sessionStorage.removeItem(storageKey);
  if (location.search) history.replaceState(null, '', '/');
  showError('payment-error');
  render();
}

form.addEventListener('input', () => {
  if (review) clearReview();
});

byId('sample').addEventListener('click', async () => {
  const { sample } = await configReady;
  if (!sample) return showError('intake-error', 'The example could not be loaded.');
  clearReview();
  showError('intake-error');
  fields(sample);
});

byId('load-scenario').addEventListener('click', () => {
  const example = config.scenarios?.find(({ id }) => id === byId('scenario').value);
  if (!example) return;
  clearReview();
  showError('intake-error');
  fields(example);
});

byId('draft-plan').addEventListener('click', async () => {
  if (order || checkoutPending) return;
  const currentReview = review;
  const button = byId('draft-plan');
  const budgetValue = byId('budget').value;
  showError('plan-error');
  button.disabled = true;
  plan = undefined;
  byId('plan').replaceChildren();
  byId('plan').hidden = true;
  try {
    const value = budgetValue;
    if (!/^\d+(?:\.\d{1,2})?$/.test(value)) throw new Error('Enter a USD limit with at most two decimal places.');
    const result = await post('/api/reviews/' + currentReview.id + '/plan', { budgetCents: Math.round(Number(value) * 100) });
    if (review !== currentReview || byId('budget').value !== budgetValue) return;
    plan = result;
    const box = byId('plan');
    box.replaceChildren(node('h3', '', money(plan.amount) + ' proposed · ' + money(plan.unpaid) + ' unpaid'));
    box.append(node('p', '', plan.policy));
    const trace = node('ol', 'plan-steps');
    for (const step of plan.steps) {
      const item = review.items.find(({ id }) => id === step.itemId);
      trace.append(node('li', '', (step.action === 'propose' ? 'Propose: ' : 'Withhold: ') + item.description + ' — ' + step.reason));
    }
    box.append(trace);
    const apply = node('button', 'text-button', 'Apply proposal to selection');
    apply.id = 'apply-plan';
    apply.type = 'button';
    apply.addEventListener('click', () => {
      if (order || checkoutPending || !plan) return;
      selected = new Set(plan.proposedIds);
      render();
    });
    box.append(apply);
    if (plan.clarification) {
      const label = node('label', '', 'Clarification draft · copy and send yourself');
      label.htmlFor = 'clarification';
      const draft = node('textarea');
      draft.id = 'clarification';
      draft.readOnly = true;
      draft.rows = 4;
      draft.value = 'Please share completion evidence for the following scope items:\n' + plan.clarification;
      box.append(label, draft);
    }
    box.hidden = false;
    updateTotals();
  } catch (error) {
    if (review === currentReview) showError('plan-error', error.message);
  } finally {
    button.disabled = Boolean(order) || checkoutPending;
  }
});

byId('budget').addEventListener('input', () => {
  plan = undefined;
  byId('plan').hidden = true;
});

form.addEventListener('submit', async (event) => {
  event.preventDefault();
  clearReview();
  showError('intake-error');
  const input = Object.fromEntries(new FormData(form));
  reviewButton.disabled = true;
  try {
    const result = await post('/api/reviews', input);
    if (Object.keys(input).some((name) => form.elements[name].value !== input[name])) return;
    review = result;
    byId('budget').value = (review.total / 100).toFixed(2);
    render();
  } catch (error) {
    showError('intake-error', error.message);
  } finally {
    reviewButton.disabled = false;
  }
});

checkoutButton.addEventListener('click', async () => {
  const currentReview = review;
  const approvedIds = [...selected];
  showError('payment-error');
  checkoutPending = true;
  updateTotals();
  byId('items').querySelectorAll('input').forEach((input) => { input.disabled = true; });
  try {
    const payment = await post('/api/reviews/' + currentReview.id + '/order', { approvedIds });
    if (review !== currentReview) return;
    order = { orderId: payment.orderId };
    saveCheckout();
    location.assign(payment.checkoutUrl);
  } catch (error) {
    if (review !== currentReview) return;
    order ??= { cancelled: true };
    render();
    showError('payment-error', error.message);
  } finally {
    if (review === currentReview) {
      checkoutPending = false;
      updateTotals();
    }
  }
});

captureButton.addEventListener('click', async () => {
  const currentReview = review;
  captureButton.disabled = true;
  showError('payment-error');
  try {
    const result = await post('/api/reviews/' + currentReview.id + '/capture', { orderId: order.orderId });
    if (review !== currentReview) return;
    receipt = result;
    render();
    saveCheckout();
  } catch (error) {
    if (review === currentReview) showError('payment-error', error.message);
  } finally {
    captureButton.disabled = false;
  }
});

byId('export').addEventListener('click', async () => {
  if (receipt?.status !== 'COMPLETED') return;
  const currentReview = review;
  byId('export').disabled = true;
  try {
    const record = await post('/api/reviews/' + currentReview.id + '/record', {});
    if (review !== currentReview) return;
    const url = URL.createObjectURL(new Blob([JSON.stringify(record, null, 2)], { type: 'application/json' }));
    const download = node('a');
    download.href = url;
    download.download = 'milestone-match-' + order.orderId + '.json';
    download.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  } catch (error) {
    if (review === currentReview) showError('payment-error', error.message);
  } finally { byId('export').disabled = false; }
});

config = await configReady;
for (const example of config.scenarios ?? []) {
  const option = node('option', '', example.label);
  option.value = example.id;
  byId('scenario').append(option);
}
const query = new URLSearchParams(location.search);
let saved;
try { saved = JSON.parse(sessionStorage.getItem(storageKey) || 'null'); }
catch { sessionStorage.removeItem(storageKey); }
if (saved && (!query.has('checkout') || saved.review.id === query.get('review'))) {
  const approved = query.get('checkout') === 'approved' && query.get('token') === saved.order.orderId;
  review = saved.review;
  byId('budget').value = (review.total / 100).toFixed(2);
  fields(saved.input);
  selected = new Set(saved.approvedIds);
  order = { ...saved.order, returned: approved || saved.order.returned, cancelled: query.get('checkout') === 'cancelled' };
  receipt = saved.receipt;
  render();
  if (approved && !captureButton.hidden) captureButton.focus();
} else if (query.has('checkout')) {
  showError('intake-error', 'The checkout review could not be restored. Open the review in the same browser tab.');
}
