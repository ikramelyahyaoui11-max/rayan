// Shared currency display module. All real prices stay in EGP internally
// (products.json, WhatsApp order messages) - this only affects what visitors
// SEE. Rates default to a rough estimate but are overridden by the admin's
// manually-set exchange rates in settings.json once they load.
window.RayanCurrency = (function () {
  const KEY = 'rayan_currency';
  const RATES = { EGP: 1, USD: 1 / 49, SAR: 1 / 13.05 };
  const SYMBOLS = { EGP: 'ج.م', USD: '$', SAR: 'ر.س' };
  const LABELS = { EGP: 'جنيه مصري (ج.م)', USD: 'دولار ($)', SAR: 'ريال سعودي (ر.س)' };

  function loadRatesFromSettings() {
    fetch(`assets/data/settings.json?v=${Date.now()}`, { cache: 'no-store' })
      .then((res) => res.json())
      .then((settings) => {
        if (settings.usdRate) RATES.USD = 1 / Number(settings.usdRate);
        if (settings.sarRate) RATES.SAR = 1 / Number(settings.sarRate);
        document.querySelectorAll('.currency-switcher').forEach(renderSwitcher);
        renderAllPrices();
      })
      .catch(() => { /* keep default rates if settings.json is unavailable */ });
  }

  function getCurrency() {
    return localStorage.getItem(KEY) || 'EGP';
  }

  function setCurrency(code) {
    if (!RATES[code]) return;
    localStorage.setItem(KEY, code);
    document.dispatchEvent(new CustomEvent('rayan-currency-change'));
  }

  function convert(egpAmount) {
    const cur = getCurrency();
    return egpAmount * RATES[cur];
  }

  function formatParts(egpAmount) {
    const cur = getCurrency();
    const val = convert(egpAmount);
    const rounded = cur === 'EGP' ? Math.round(val) : Math.round(val * 10) / 10;
    return { amount: rounded.toLocaleString('en-US'), symbol: SYMBOLS[cur] };
  }

  function format(egpAmount) {
    const { amount, symbol } = formatParts(egpAmount);
    return `${amount} ${symbol}`;
  }

  function renderSwitcher(container) {
    if (!container) return;
    const current = getCurrency();
    container.innerHTML = `
      <select class="currency-select" aria-label="اختر العملة">
        ${Object.keys(RATES).map((code) => (
          `<option value="${code}"${code === current ? ' selected' : ''}>${LABELS[code]}</option>`
        )).join('')}
      </select>
    `;
    container.querySelector('.currency-select').addEventListener('change', (e) => setCurrency(e.target.value));
  }

  // Elements marked with class="currency-price" and data-egp="<amount>" are
  // kept in sync automatically - callers just need to set data-egp whenever
  // the underlying EGP amount changes (e.g. re-rendering a cart line).
  function renderAllPrices() {
    document.querySelectorAll('.currency-price[data-egp]').forEach((el) => {
      const egp = Number(el.dataset.egp);
      if (el.dataset.split === 'true') {
        const { amount, symbol } = formatParts(egp);
        el.innerHTML = `${amount} <span>${symbol}</span>`;
      } else {
        el.textContent = format(egp);
      }
    });
  }

  document.addEventListener('rayan-currency-change', () => {
    document.querySelectorAll('.currency-switcher').forEach(renderSwitcher);
    renderAllPrices();
  });

  document.addEventListener('DOMContentLoaded', () => {
    document.querySelectorAll('.currency-switcher').forEach(renderSwitcher);
    renderAllPrices();
    loadRatesFromSettings();
  });

  // For content rendered dynamically after DOMContentLoaded (product cards,
  // cart items, etc.) - call this once new .currency-price elements exist.
  document.addEventListener('rayan-content-updated', renderAllPrices);

  return { getCurrency, setCurrency, convert, format, RATES, SYMBOLS };
})();
