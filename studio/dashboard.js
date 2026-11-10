import { AgStudioLicenseManager, createStudio, createWidgets, singleColumnLayout, studioTheme } from 'ag-studio';

const money = (value) => new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(value ?? 0);
const field = (name, aggregation) => ({ id: 'milestones.' + name, ...(aggregation ? { aggregation } : {}) });
const stateKey = 'milestone-match-studio-layout-v1';
const fields = [
  ...['project', 'milestone', 'status', 'decision', 'evidence', 'reason'].map((id) => ({
    id, name: ({ reason: 'Review explanation', evidence: 'Original delivery claim' })[id] ?? id[0].toUpperCase() + id.slice(1), format: 'textFormat',
  })),
  ...['amount', 'selected', 'captured', 'unpaid', 'blocked'].map((id) => ({
    id, name: id[0].toUpperCase() + id.slice(1) + ' USD', format: 'currencyFormat',
    formatOptions: { format: '$#,##0.00' },
  })),
];
const dataFor = (rows) => ({ sources: [{ id: 'milestones', name: 'Current review milestones', data: rows, fields }] });

// A native Studio widget: queries Studio's engine, so page filters apply to it
// in exactly the same way as the built-in grid and chart widgets.
class EvidenceSummary {
  constructor() { this.element = document.createElement('div'); this.element.className = 'studio-evidence-summary'; this.sequence = 0; }
  getGui() { return this.element; }
  init(params) { return this.refresh(params); }
  async refresh(params) {
    const sequence = ++this.sequence;
    params.widgetApi.setDisplayState('loading', { prominent: false });
    try {
      const mapped = ['amount', 'selected', 'captured', 'blocked'].map((key) => params.dataMapping[key]?.[0]);
      if (mapped.some((value) => !value)) return;
      const result = await params.widgetApi.getData({ fields: mapped }, { queryId: 'summary' });
      if (sequence !== this.sequence || result.replaced) return;
      if (result.results.metadata?.error) throw new Error('Query failed');
      const values = result.results.rows[0] ?? {};
      this.element.replaceChildren();
      ['Agreed scope', 'Selected for checkout', 'Captured by PayPal', 'Needs evidence'].forEach((label, index) => {
        const card = document.createElement('div');
        const title = document.createElement('span'); title.textContent = label;
        const value = document.createElement('strong'); value.textContent = money(values[mapped[index].key]);
        value.dataset.metric = ['agreed', 'selected', 'captured', 'blocked'][index];
        card.append(title, value); this.element.append(card);
      });
      const note = document.createElement('p');
      note.textContent = 'Selected amounts are proposals, not captured payments. Needs evidence is the scope blocked by this review.';
      this.element.append(note);
      params.widgetApi.setDisplayState('displayed');
    } catch {
      if (sequence !== this.sequence) return;
      this.element.textContent = 'Could not calculate evidence totals. Reset the dashboard layout and retry.';
      params.widgetApi.setDisplayState('displayed');
    }
  }
  destroy() { this.sequence++; }
}

function initialState() {
  return {
    pages: [{
      id: 'review', name: 'Payment and evidence',
      widgets: {
        summary: { type: 'evidence-summary', dataMapping: Object.fromEntries(['amount', 'selected', 'captured', 'blocked'].map((key) => [key, [field(key, 'sum')]])), format: { title: { enabled: true, text: 'Evidence and payment totals' } } },
        status: { type: 'list-filter', dataMapping: { value: [field('status')] }, format: { title: { enabled: true, text: 'Filter evidence status' } } },
        amounts: { type: 'bar-chart-grouped', dataMapping: { categoryKey: [field('status')], valueKey: [field('amount', 'sum')] }, format: { title: { enabled: true, text: 'Scope amount by evidence status' } } },
        ledger: { type: 'grid', dataMapping: { cols: [field('milestone'), field('status'), field('decision'), field('amount'), field('captured'), field('reason')] }, format: { title: { enabled: true, text: 'Milestone decisions · USD' } } },
      },
      widgetLayout: {
        summary: { xTrack: 0, yTrack: 0, xSpan: 24, ySpan: 15 },
        status: { xTrack: 0, yTrack: 15, xSpan: 7, ySpan: 16 },
        amounts: { xTrack: 7, yTrack: 15, xSpan: 17, ySpan: 16 },
        ledger: { xTrack: 0, yTrack: 31, xSpan: 24, ySpan: 19 },
      },
    }],
    selectedPageId: 'review',
    panels: { filters: { collapsed: true }, data: { collapsed: true } },
  };
}

export function mountDashboard(element, rows, { licenseKey, nonce, onError } = {}) {
  let currentRows = rows;
  if (licenseKey) AgStudioLicenseManager.setLicenseKey(licenseKey);
  let saved;
  try { saved = JSON.parse(sessionStorage.getItem(stateKey) || 'null'); } catch { sessionStorage.removeItem(stateKey); }
  const widgets = (base) => createWidgets({
    additionalTypes: [{
      id: 'evidence-summary', label: 'Milestone evidence summary',
      comp: EvidenceSummary,
      dataMapping: Object.fromEntries(['amount', 'selected', 'captured', 'blocked'].map((key) => [key, {
        type: 'field', supportedRoles: ['numeric'], requires: { cardinality: 'one' }, required: true,
      }])),
      form: (params) => params.createDefaults({ dataMappingItems: ['amount', 'selected', 'captured', 'blocked'].map((key) => ({ key, label: key[0].toUpperCase() + key.slice(1) })) }),
      defaultSize: { width: 800, height: 240 }, minSize: { width: 260, height: 220 },
    }],
    menu: [...base.menu, { label: 'MilestoneMatch', widgetIds: ['evidence-summary'] }],
  });
  const api = createStudio(element, {
    mode: 'view', data: dataFor(rows), initialState: saved ?? initialState(), widgets,
    layout: { minWidth: 240 },
    responsiveLayoutBreakpoints: [{ maxWidth: 640, layout: singleColumnLayout }],
    panels: { view: { left: [], right: [] }, edit: { left: ['data'], right: ['edit'] } },
    theme: studioTheme.withParams({
      accentColor: '#22543d', backgroundColor: '#ffffff', foregroundColor: '#182a22',
      browserColorScheme: 'light', fontFamily: 'system-ui, sans-serif',
      chartPaletteFills1Color: '#22543d', studioCanvasBackgroundColor: '#f8f7f2',
    }),
    loadThemeGoogleFonts: false, styleNonce: nonce,
    onStateUpdated: ({ state }) => { try { sessionStorage.setItem(stateKey, JSON.stringify(state)); } catch { /* The dashboard still works without layout storage. */ } },
    onErrorRaised: (event) => { if (event.fatal) onError?.('The saved dashboard could not load. Use Reset layout to restore it.'); },
  });
  return {
    update(rows) { currentRows = rows; api.setProperty('data', dataFor(rows)); },
    setEditing(editing) { api.setProperty('mode', editing ? 'edit' : 'view'); },
    reset() {
      // Recreate rather than animate panel state immediately after a mode change.
      api.destroy();
      sessionStorage.removeItem(stateKey);
      return mountDashboard(element, currentRows, { licenseKey, nonce, onError });
    },
    destroy() { api.destroy(); },
  };
}
