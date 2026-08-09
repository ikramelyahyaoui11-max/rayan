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

// ===================== Product data (loaded from products.json + services.json) =====================
Promise.all([
  fetch(`assets/data/products.json?v=${Date.now()}`, { cache: 'no-store' }).then((res) => res.json()),
  fetch(`assets/data/services.json?v=${Date.now()}`, { cache: 'no-store' }).then((res) => res.json()),
]).then(([products, services]) => {
    const PRODUCTS = [
      ...products,
      ...services.map((s) => ({ ...s, _isService: true })),
    ];
    const params = new URLSearchParams(window.location.search);
    const product = PRODUCTS.find((p) => p.id === params.get('id')) || PRODUCTS[0];

    document.getElementById('pageTitle').textContent = `${product.name} | مؤسسة الريان لتنفيذ المشروعات بأفريقيا`;
    const productImageEl = document.getElementById('productImage');
    const productIconEl = document.getElementById('productIcon');
    if (product.image) {
      productImageEl.src = product.image;
      productImageEl.alt = product.name;
      productImageEl.style.display = '';
      productIconEl.style.display = 'none';
    } else {
      productImageEl.style.display = 'none';
      productIconEl.style.display = 'flex';
      productIconEl.querySelector('span').textContent = product.icon || '🤲';
    }
    document.getElementById('productTag').textContent = product.tag;
    document.getElementById('productName').textContent = product.name;
    document.getElementById('productDesc').textContent = product.desc;
    const productPriceEl = document.getElementById('productPrice');
    productPriceEl.classList.add('currency-price');
    productPriceEl.dataset.egp = product.price;
    productPriceEl.dataset.split = 'true';
    productPriceEl.innerHTML = `${product.price.toLocaleString('en-US')} <span>ج.م</span>`;
    document.getElementById('productIntention').value = product.defaultIntention;

    if (product._isService) {
      document.getElementById('productAddonsRow').style.display = 'none';
      document.getElementById('productAddons').required = false;
      document.getElementById('productIntentionRow').style.display = 'none';
      document.getElementById('productIntention').required = false;
      const deliveryText = 'أوكّل مؤسسة الريان بتنفيذ هذا المشروع وتزويدي بتقرير موثق بالصور والفيديوهات';
      const productDeliveryEl2 = document.getElementById('productDelivery');
      productDeliveryEl2.textContent = deliveryText;
      productDeliveryEl2.dataset.value = deliveryText;
      document.getElementById('productSubmitBtn').innerHTML = '🤲 أضف للسلة';
    }

    // ---- Quantity stepper ----
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

    // ---- Add to cart ----
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
        delivery: productDeliveryEl.dataset.value,
      });
      qty = 1;
      qtyValueEl.textContent = '1';
      productNoteEl.value = '';
    });

    // ---- Other available products ----
    const otherProductsEl = document.getElementById('otherProducts');
    PRODUCTS.filter((p) => p.id !== product.id).forEach((p) => {
      const a = document.createElement('a');
      a.className = 'other-product-card';
      a.href = `product.html?id=${p.id}`;
      a.innerHTML = `
        ${p.image
          ? `<img src="${p.image}" alt="${p.name}" loading="lazy">`
          : `<div class="other-product-icon"><span>${p.icon || '🤲'}</span></div>`}
        <div class="other-product-info">
          <h4>${p.name}</h4>
          <span class="currency-price" data-egp="${p.price}">${p.price.toLocaleString('en-US')} ج.م</span>
        </div>
      `;
      otherProductsEl.appendChild(a);
    });
    document.dispatchEvent(new CustomEvent('rayan-content-updated'));
  });
