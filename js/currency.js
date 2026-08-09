// Shared currency display module. All real prices stay in EGP internally
// (products.json, WhatsApp order messages) - this only affects what visitors
// SEE. Rates are approximate and meant for a rough idea, not exact payment.
window.RayanCurrency = (function () {
  const KEY = 'rayan_currency';
  const RATES = { EGP: 1, USD: 1 / 49, SAR: 1 / 13.05 };
  const SYMBOLS = { EGP: 'ج.م', USD: '$', SAR: 'ر.س' };
  const LABELS = { EGP: 'ج.م', USD: 'USD $', SAR: 'SAR ر.س' };

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
    container.innerHTML = Object.keys(RATES).map((code) => (
      `<button type="button" class="currency-pill${code === getCurrency() ? ' active' : ''}" data-currency="${code}">${LABELS[code]}</button>`
    )).join('');
    container.querySelectorAll('.currency-pill').forEach((btn) => {
      btn.addEventListener('click', () => setCurrency(btn.dataset.currency));
    });
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
  });

  // For content rendered dynamically after DOMContentLoaded (product cards,
  // cart items, etc.) - call this once new .currency-price elements exist.
  document.addEventListener('rayan-content-updated', renderAllPrices);

  return { getCurrency, setCurrency, convert, format, RATES, SYMBOLS };
})();
