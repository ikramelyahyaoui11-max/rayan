// ===================== Header scroll shadow =====================
const header = document.getElementById('siteHeader');
const onScroll = () => {
  if (window.scrollY > 8) header.classList.add('scrolled');
  else header.classList.remove('scrolled');
};
document.addEventListener('scroll', onScroll, { passive: true });
onScroll();

// ===================== Mobile nav toggle =====================
const navToggle = document.getElementById('navToggle');
const mainNav = document.getElementById('mainNav');

navToggle.addEventListener('click', () => {
  const isOpen = mainNav.classList.toggle('open');
  navToggle.classList.toggle('open', isOpen);
  navToggle.setAttribute('aria-expanded', String(isOpen));
});

mainNav.querySelectorAll('a').forEach((link) => {
  link.addEventListener('click', () => {
    mainNav.classList.remove('open');
    navToggle.classList.remove('open');
    navToggle.setAttribute('aria-expanded', 'false');
  });
});

// ===================== Footer year =====================
document.getElementById('year').textContent = new Date().getFullYear();

// ===================== Reveal on scroll =====================
if ('IntersectionObserver' in window) {
  const revealObserver = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        entry.target.classList.add('in-view');
        revealObserver.unobserve(entry.target);
      }
    });
  }, { threshold: 0.15 });

  document.querySelectorAll('.reveal').forEach((el) => revealObserver.observe(el));
} else {
  document.querySelectorAll('.reveal').forEach((el) => el.classList.add('in-view'));
}

// ===================== Back to top =====================
const backToTop = document.getElementById('backToTop');
const toggleBackToTop = () => {
  backToTop.classList.toggle('visible', window.scrollY > 480);
};
document.addEventListener('scroll', toggleBackToTop, { passive: true });
toggleBackToTop();

backToTop.addEventListener('click', () => {
  window.scrollTo({ top: 0, behavior: 'smooth' });
});

// ===================== Booking form → WhatsApp =====================
const bookingForm = document.getElementById('bookingForm');
const bookingType = document.getElementById('bookingType');

let checkoutCart = null;
const cartCheckoutData = sessionStorage.getItem('rayan_cart_checkout');
if (cartCheckoutData) {
  checkoutCart = JSON.parse(cartCheckoutData);
  sessionStorage.removeItem('rayan_cart_checkout');

  document.getElementById('orderTypeRow').style.display = 'none';
  bookingType.required = false;

  const summaryBlock = document.getElementById('cartSummaryBlock');
  const summaryList = document.getElementById('cartSummaryList');
  const summaryTotal = document.getElementById('cartSummaryTotal');
  summaryBlock.style.display = 'block';

  let total = 0;
  checkoutCart.forEach((item) => {
    const lineTotal = item.price * item.qty;
    total += lineTotal;
    const row = document.createElement('div');
    row.className = 'cart-summary-row';
    const details = [];
    if (item.intention) details.push(`النية: ${item.intention}`);
    if (item.note) details.push(`الاسم: ${item.note}`);
    if (item.addons && item.addons !== 'بدون إضافات') details.push(item.addons);
    if (item.delivery) details.push(`التسليم: ${item.delivery}`);
    const detailsText = details.length ? ` (${details.join(' - ')})` : '';
    row.textContent = `${item.name}${detailsText} × ${item.qty} — ${lineTotal.toLocaleString('en-US')} ج.م`;
    summaryList.appendChild(row);
  });
  summaryTotal.textContent = `الإجمالي: ${total.toLocaleString('en-US')} ج.م`;
}

// GoatCounter's script loads async - on a fast click right after page load it
// may not be ready yet. Retry briefly instead of silently dropping the event
// (the WhatsApp redirect itself never waits on this).
function trackWhatsAppClick(attemptsLeft) {
  if (window.goatcounter && window.goatcounter.count) {
    window.goatcounter.count({ path: 'click-whatsapp-order', title: 'WhatsApp order click', event: true });
  } else if (attemptsLeft > 0) {
    setTimeout(() => trackWhatsAppClick(attemptsLeft - 1), 200);
  }
}

bookingForm.addEventListener('submit', (e) => {
  e.preventDefault();

  const name = bookingForm.name.value.trim();
  const phone = bookingForm.phone.value.trim();
  const whatsapp = bookingForm.whatsapp.value.trim();

  let orderLines;
  if (checkoutCart) {
    const total = checkoutCart.reduce((sum, item) => sum + item.price * item.qty, 0);
    orderLines = [
      'الطلبات:',
      ...checkoutCart.map((item) => {
        const details = [];
        if (item.intention) details.push(`النية: ${item.intention}`);
        if (item.note) details.push(`الاسم: ${item.note}`);
        if (item.addons && item.addons !== 'بدون إضافات') details.push(item.addons);
        if (item.delivery) details.push(`التسليم: ${item.delivery}`);
        const detailsText = details.length ? ` (${details.join(' - ')})` : '';
        return `- ${item.name}${detailsText} × ${item.qty} (${(item.price * item.qty).toLocaleString('en-US')} ج.م)`;
      }),
      `الإجمالي: ${total.toLocaleString('en-US')} ج.م`,
    ];
  } else {
    const type = bookingType.value;
    const price = bookingType.selectedOptions[0]?.dataset.price || '';
    orderLines = [`نوع الطلب: ${type}`, price ? `السعر: ${price}` : ''];
  }

  const message = [
    'مرحبًا، أرغب في حجز:',
    `الاسم: ${name}`,
    `رقم الهاتف: ${phone}`,
    whatsapp ? `رقم واتساب: ${whatsapp}` : '',
    ...orderLines,
  ].filter(Boolean).join('\n');

  trackWhatsAppClick(5);

  const waNumber = (window.RayanSettings && window.RayanSettings.data && window.RayanSettings.data.whatsapp) || '201008659399';
  const url = `https://wa.me/${waNumber}?text=${encodeURIComponent(message)}`;
  window.open(url, '_blank', 'noopener');

  if (checkoutCart) localStorage.removeItem('rayan_cart');
});
