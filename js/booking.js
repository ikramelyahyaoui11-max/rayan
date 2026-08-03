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

const presetType = sessionStorage.getItem('rayan_order_type');
if (presetType) {
  bookingType.value = presetType;
  sessionStorage.removeItem('rayan_order_type');
  sessionStorage.removeItem('rayan_order_price');
}

bookingForm.addEventListener('submit', (e) => {
  e.preventDefault();

  const name = bookingForm.name.value.trim();
  const phone = bookingForm.phone.value.trim();
  const whatsapp = bookingForm.whatsapp.value.trim();
  const type = bookingType.value;
  const price = bookingType.selectedOptions[0]?.dataset.price || '';

  const message = [
    'مرحبًا، أرغب في حجز:',
    `الاسم: ${name}`,
    `رقم الهاتف: ${phone}`,
    whatsapp ? `رقم واتساب: ${whatsapp}` : '',
    `نوع الطلب: ${type}`,
    price ? `السعر: ${price}` : ''
  ].filter(Boolean).join('\n');

  const url = `https://wa.me/201008659399?text=${encodeURIComponent(message)}`;
  window.open(url, '_blank', 'noopener');
});
