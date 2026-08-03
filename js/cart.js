// ===================== Shopping cart (shared across pages) =====================
const CART_KEY = 'rayan_cart';
const cart = JSON.parse(localStorage.getItem(CART_KEY) || '[]');

const saveCart = () => localStorage.setItem(CART_KEY, JSON.stringify(cart));

const cartFab = document.getElementById('cartFab');
const cartBadge = document.getElementById('cartBadge');
const cartDrawer = document.getElementById('cartDrawer');
const cartOverlay = document.getElementById('cartOverlay');
const cartClose = document.getElementById('cartClose');
const cartItemsEl = document.getElementById('cartItems');
const cartEmptyEl = document.getElementById('cartEmpty');
const cartTotalEl = document.getElementById('cartTotal');
const cartCheckoutBtn = document.getElementById('cartCheckout');

function renderCart() {
  const count = cart.reduce((sum, item) => sum + item.qty, 0);
  cartBadge.textContent = String(count);
  cartBadge.style.display = count > 0 ? 'flex' : 'none';

  cartItemsEl.innerHTML = '';
  cartEmptyEl.style.display = cart.length === 0 ? 'block' : 'none';

  cart.forEach((item, index) => {
    const row = document.createElement('div');
    row.className = 'cart-item';
    row.innerHTML = `
      <div class="cart-item-info">
        <h4>${item.name}</h4>
        ${item.note ? `<span class="cart-item-note">✎ ${item.note}</span>` : ''}
        <span class="cart-item-price">${item.price.toLocaleString('en-US')} ج.م × ${item.qty}</span>
      </div>
      <div class="cart-item-qty">
        <button type="button" class="qty-btn cart-qty-minus" aria-label="إنقاص الكمية">−</button>
        <span class="qty-value">${item.qty}</span>
        <button type="button" class="qty-btn cart-qty-plus" aria-label="زيادة الكمية">+</button>
      </div>
      <button type="button" class="cart-item-remove" aria-label="حذف">🗑️</button>
    `;
    row.querySelector('.cart-qty-minus').addEventListener('click', () => {
      item.qty = Math.max(1, item.qty - 1);
      saveCart();
      renderCart();
    });
    row.querySelector('.cart-qty-plus').addEventListener('click', () => {
      item.qty += 1;
      saveCart();
      renderCart();
    });
    row.querySelector('.cart-item-remove').addEventListener('click', () => {
      cart.splice(index, 1);
      saveCart();
      renderCart();
    });
    cartItemsEl.appendChild(row);
  });

  const total = cart.reduce((sum, item) => sum + item.price * item.qty, 0);
  cartTotalEl.textContent = `${total.toLocaleString('en-US')} ج.م`;
}

function openCart() {
  cartDrawer.classList.add('open');
  cartOverlay.classList.add('open');
  cartDrawer.setAttribute('aria-hidden', 'false');
  document.body.style.overflow = 'hidden';
}
function closeCart() {
  cartDrawer.classList.remove('open');
  cartOverlay.classList.remove('open');
  cartDrawer.setAttribute('aria-hidden', 'true');
  document.body.style.overflow = '';
}

function addToCart(name, price, qty, note) {
  const existing = cart.find((item) => item.name === name && (item.note || '') === (note || ''));
  if (existing) existing.qty += qty;
  else cart.push({ name, price, qty, note: note || '' });
  saveCart();
  renderCart();
  openCart();
}

cartFab.addEventListener('click', openCart);
cartClose.addEventListener('click', closeCart);
cartOverlay.addEventListener('click', closeCart);

cartCheckoutBtn.addEventListener('click', () => {
  if (cart.length === 0) return;
  sessionStorage.setItem('rayan_cart_checkout', JSON.stringify(cart));
  window.location.href = 'booking.html';
});

renderCart();

window.RayanCart = { add: addToCart };
