(() => {
  const storageKey = 'milestone-match-theme';
  const system = window.matchMedia('(prefers-color-scheme: dark)');
  const valid = value => ['light', 'dark', 'system'].includes(value);
  let preference = 'system';
  try { const saved = localStorage.getItem(storageKey); if (valid(saved)) preference = saved; } catch { /* System mode works without storage. */ }
  function apply() {
    const theme = preference === 'system' ? (system.matches ? 'dark' : 'light') : preference;
    document.documentElement.dataset.theme = theme;
    document.documentElement.dataset.themePreference = preference;
    const meta = document.querySelector('meta[name="theme-color"]');
    if (meta) meta.content = theme === 'dark' ? '#10121d' : '#f5f6fb';
    const select = document.getElementById('theme-mode');
    if (select) select.value = preference;
    window.dispatchEvent(new CustomEvent('themechange', { detail: { theme, preference } }));
  }
  apply();
  system.addEventListener('change', () => { if (preference === 'system') apply(); });
  window.addEventListener('storage', event => {
    if (event.key !== storageKey && event.key !== null) return;
    preference = valid(event.newValue) ? event.newValue : 'system'; apply();
  });
  document.addEventListener('DOMContentLoaded', () => {
    const select = document.getElementById('theme-mode');
    select.value = preference;
    select.addEventListener('change', () => {
      preference = valid(select.value) ? select.value : 'system';
      try { localStorage.setItem(storageKey, preference); } catch { /* Apply for this tab anyway. */ }
      apply();
    });
  });
})();
