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

// ===================== Product data =====================
const PRODUCTS = [
  {
    id: 'kharouf',
    name: 'خروف',
    tag: 'الأكثر طلبًا',
    price: 2800,
    desc: 'ذبح، سلخ، توزيع كامل على المحتاجين، وتوثيق بالاسم',
    image: 'assets/products/kharouf.png',
    defaultIntention: 'أضحية',
  },
  {
    id: 'bakara',
    name: 'بقرة',
    tag: 'عرض العيد',
    price: 3600,
    desc: 'ذبيحة كاملة الحجم، توثيق شامل وتوزيع على عدد أكبر من المستفيدين',
    image: 'assets/gallery/rayan-27.jpg',
    defaultIntention: 'أضحية',
  },
  {
    id: 'ijl',
    name: 'عجل صغير',
    tag: 'بداية خير',
    price: 4200,
    desc: 'بداية خير ورزق كبير، ذبح وتوزيع كامل مع توثيق بالاسم',
    image: 'assets/gallery/rayan-33.jpg',
    defaultIntention: 'أضحية',
  },
  {
    id: 'maaz',
    name: 'ماعز',
    tag: 'للمواليد',
    price: 2600,
    desc: 'مناسب للعقيقة أو الأضحية، ذبح وتوثيق كامل وتوزيع على الفقراء',
    image: 'assets/gallery/rayan-52.jpg',
    defaultIntention: 'عقيقة',
  },
];

const params = new URLSearchParams(window.location.search);
const product = PRODUCTS.find((p) => p.id === params.get('id')) || PRODUCTS[0];

document.getElementById('pageTitle').textContent = `${product.name} | مؤسسة الريان لتنفيذ المشروعات بأفريقيا`;
document.getElementById('productImage').src = product.image;
document.getElementById('productImage').alt = product.name;
document.getElementById('productTag').textContent = product.tag;
document.getElementById('productName').textContent = product.name;
document.getElementById('productDesc').textContent = product.desc;
document.getElementById('productPrice').innerHTML = `${product.price.toLocaleString('en-US')} <span>ج.م</span>`;
document.getElementById('productIntention').value = product.defaultIntention;

// ===================== Quantity stepper =====================
let qty = 1;
const qtyValueEl = document.getElementById('qtyValue');
document.getElementById('qtyMinus').addEventListener('click', () => {
  qty = Math.max(1, qty - 1);
  qtyValueEl.textContent = String(qty);
});
document.getElementById('qtyPlus').addEventListener('click', () => {
  qty += 1;
  qtyValueEl.textContent = String(qty);
});

// ===================== Add to cart =====================
const productNoteEl = document.getElementById('productNote');
const productAddonsEl = document.getElementById('productAddons');
const productIntentionEl = document.getElementById('productIntention');
const productDeliveryEl = document.getElementById('productDelivery');

document.getElementById('productForm').addEventListener('submit', (e) => {
  e.preventDefault();
  window.RayanCart.add(product.name, product.price, qty, {
    note: productNoteEl.value.trim(),
    intention: productIntentionEl.value,
    addons: productAddonsEl.value,
    delivery: productDeliveryEl.value,
  });
  qty = 1;
  qtyValueEl.textContent = '1';
  productNoteEl.value = '';
});

// ===================== Other available products =====================
const otherProductsEl = document.getElementById('otherProducts');
PRODUCTS.filter((p) => p.id !== product.id).forEach((p) => {
  const a = document.createElement('a');
  a.className = 'other-product-card';
  a.href = `product.html?id=${p.id}`;
  a.innerHTML = `
    <img src="${p.image}" alt="${p.name}" loading="lazy">
    <div class="other-product-info">
      <h4>${p.name}</h4>
      <span>${p.price.toLocaleString('en-US')} ج.م</span>
    </div>
  `;
  otherProductsEl.appendChild(a);
});
