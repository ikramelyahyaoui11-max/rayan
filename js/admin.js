// ===================== Config =====================
const REPO_OWNER = 'ikramelyahyaoui11-max';
const REPO_NAME = 'rayan';
const PRODUCTS_PATH = 'assets/data/products.json';
const TOKEN_KEY = 'rayan_admin_token';

// ===================== Elements =====================
const loginSection = document.getElementById('loginSection');
const dashboardSection = document.getElementById('dashboardSection');
const tokenInput = document.getElementById('tokenInput');
const loginBtn = document.getElementById('loginBtn');
const loginError = document.getElementById('loginError');
const logoutBtn = document.getElementById('logoutBtn');
const productsList = document.getElementById('productsList');
const saveAllBtn = document.getElementById('saveAllBtn');
const statusMsg = document.getElementById('statusMsg');
const addProductBtn = document.getElementById('addProductBtn');
const addError = document.getElementById('addError');

let products = [];
let productsSha = null;

// ===================== Helpers =====================
function utf8ToBase64(str) {
  return btoa(unescape(encodeURIComponent(str)));
}

function base64ToUtf8(b64) {
  return decodeURIComponent(escape(atob(b64.replace(/\n/g, ''))));
}

function ghHeaders() {
  return {
    Authorization: `token ${localStorage.getItem(TOKEN_KEY)}`,
    Accept: 'application/vnd.github+json',
  };
}

function apiUrl(path) {
  return `https://api.github.com/repos/${REPO_OWNER}/${REPO_NAME}/contents/${path}`;
}

function showStatus(message, isError) {
  statusMsg.textContent = message;
  statusMsg.className = isError ? 'admin-status admin-status-error' : 'admin-status admin-status-ok';
}

// ===================== Auth =====================
function showDashboard() {
  loginSection.style.display = 'none';
  dashboardSection.style.display = 'block';
  logoutBtn.style.display = 'inline-flex';
  loadProducts();
}

function showLogin(errorMsg) {
  loginSection.style.display = 'block';
  dashboardSection.style.display = 'none';
  logoutBtn.style.display = 'none';
  loginError.textContent = errorMsg || '';
}

loginBtn.addEventListener('click', () => {
  const token = tokenInput.value.trim();
  if (!token) return;
  localStorage.setItem(TOKEN_KEY, token);
  showDashboard();
});

logoutBtn.addEventListener('click', () => {
  localStorage.removeItem(TOKEN_KEY);
  showLogin();
});

// ===================== Load products =====================
async function loadProducts() {
  showStatus('جاري التحميل...', false);
  try {
    const res = await fetch(apiUrl(PRODUCTS_PATH), { headers: ghHeaders() });
    if (res.status === 401 || res.status === 403) {
      showLogin('التوكن غير صالح أو لا يملك الصلاحيات الكافية.');
      return;
    }
    if (!res.ok) throw new Error(`GitHub API error: ${res.status}`);
    const data = await res.json();
    productsSha = data.sha;
    products = JSON.parse(base64ToUtf8(data.content));
    renderProducts();
    showStatus('', false);
  } catch (err) {
    showStatus(`حدث خطأ أثناء التحميل: ${err.message}`, true);
  }
}

// ===================== Render =====================
function renderProducts() {
  productsList.innerHTML = '';
  products.forEach((product, index) => {
    const card = document.createElement('div');
    card.className = 'admin-product-card';
    card.innerHTML = `
      <div class="admin-product-image">
        <img src="${product.image}" alt="${product.name}">
        <input type="file" class="admin-image-input" accept="image/*">
      </div>
      <div class="admin-product-fields">
        <div class="form-row">
          <label>الاسم</label>
          <input type="text" class="f-name" value="${product.name}">
        </div>
        <div class="form-row">
          <label>الوسم (Tag)</label>
          <input type="text" class="f-tag" value="${product.tag}">
        </div>
        <div class="form-row">
          <label>السعر (ج.م)</label>
          <input type="number" class="f-price" value="${product.price}">
        </div>
        <div class="form-row">
          <label>الوصف</label>
          <input type="text" class="f-desc" value="${product.desc}">
        </div>
        <div class="form-row">
          <label>النية الافتراضية</label>
          <select class="f-intention">
            <option value="أضحية">أضحية</option>
            <option value="عقيقة">عقيقة</option>
            <option value="صدقة">صدقة</option>
            <option value="نذر">نذر</option>
          </select>
        </div>
        <label class="admin-checkbox-row">
          <input type="checkbox" class="f-featured">
          مميز (إطار برتقالي في الصفحة الرئيسية)
        </label>
        <button type="button" class="btn btn-outline admin-delete-btn">🗑️ حذف المنتج</button>
      </div>
    `;

    card.querySelector('.f-intention').value = product.defaultIntention;
    card.querySelector('.f-featured').checked = Boolean(product.featured);

    card.querySelector('.f-name').addEventListener('change', (e) => { product.name = e.target.value; scheduleSave(); });
    card.querySelector('.f-tag').addEventListener('change', (e) => { product.tag = e.target.value; scheduleSave(); });
    card.querySelector('.f-price').addEventListener('change', (e) => { product.price = Number(e.target.value); scheduleSave(); });
    card.querySelector('.f-desc').addEventListener('change', (e) => { product.desc = e.target.value; scheduleSave(); });
    card.querySelector('.f-intention').addEventListener('change', (e) => { product.defaultIntention = e.target.value; scheduleSave(); });
    card.querySelector('.f-featured').addEventListener('change', (e) => { product.featured = e.target.checked; scheduleSave(); });

    card.querySelector('.admin-delete-btn').addEventListener('click', () => {
      if (!confirm(`هل تريد حذف "${product.name}"؟`)) return;
      products.splice(index, 1);
      renderProducts();
      persistProducts();
    });

    card.querySelector('.admin-image-input').addEventListener('change', async (e) => {
      const file = e.target.files[0];
      if (!file) return;
      try {
        showStatus('جاري رفع الصورة...', false);
        const path = await uploadImage(file, product.id);
        product.image = path;
        card.querySelector('.admin-product-image img').src = `https://raw.githubusercontent.com/${REPO_OWNER}/${REPO_NAME}/main/${path}`;
        await persistProducts();
      } catch (err) {
        showStatus(`فشل رفع الصورة: ${err.message}`, true);
      }
    });

    productsList.appendChild(card);
  });
}

// ===================== Upload image =====================
function fileToBase64(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const base64 = reader.result.split(',')[1];
      resolve(base64);
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

async function uploadImage(file, productId) {
  const ext = file.name.split('.').pop();
  const path = `assets/products/${productId}-${Date.now()}.${ext}`;
  const base64 = await fileToBase64(file);

  const res = await fetch(apiUrl(path), {
    method: 'PUT',
    headers: ghHeaders(),
    body: JSON.stringify({
      message: `Upload image for ${productId} via admin panel`,
      content: base64,
      branch: 'main',
    }),
  });
  if (!res.ok) {
    const errData = await res.json().catch(() => ({}));
    throw new Error(errData.message || `HTTP ${res.status}`);
  }
  return path;
}

// ===================== Add product =====================
addProductBtn.addEventListener('click', async () => {
  addError.textContent = '';
  const id = document.getElementById('newId').value.trim();
  const name = document.getElementById('newName').value.trim();
  const tag = document.getElementById('newTag').value.trim();
  const price = Number(document.getElementById('newPrice').value);
  const intention = document.getElementById('newIntention').value;
  const desc = document.getElementById('newDesc').value.trim();
  const imageFile = document.getElementById('newImage').files[0];

  if (!id || !name || !price) {
    addError.textContent = 'الرجاء تعبئة الحقول الأساسية: المعرف، الاسم، السعر.';
    return;
  }
  if (products.some((p) => p.id === id)) {
    addError.textContent = 'هذا المعرف مستخدم بالفعل، اختر معرفًا آخر.';
    return;
  }

  let imagePath = 'assets/products/kharouf.png';
  if (imageFile) {
    try {
      showStatus('جاري رفع الصورة...', false);
      imagePath = await uploadImage(imageFile, id);
    } catch (err) {
      addError.textContent = `فشل رفع الصورة: ${err.message}`;
      return;
    }
  }

  products.push({
    id,
    name,
    tag: tag || 'جديد',
    price,
    desc: desc || '',
    image: imagePath,
    defaultIntention: intention,
    featured: false,
  });

  document.getElementById('newId').value = '';
  document.getElementById('newName').value = '';
  document.getElementById('newTag').value = '';
  document.getElementById('newPrice').value = '';
  document.getElementById('newDesc').value = '';
  document.getElementById('newImage').value = '';

  renderProducts();
  await persistProducts();
});

// ===================== Save all =====================
let saveInProgress = false;
let saveQueued = false;
let saveDebounceTimer = null;
let saveDebouncePending = false;

// Warn before leaving the page while a save is pending/in-flight, so a
// reflex refresh (e.g. right after clicking a button) can't silently
// cancel the request before GitHub receives it.
window.addEventListener('beforeunload', (e) => {
  if (saveInProgress || saveDebouncePending) {
    e.preventDefault();
    e.returnValue = '';
  }
});

// Batches rapid successive field edits into a single save instead of
// firing one GitHub API round-trip per field, which made editing feel slow.
function scheduleSave() {
  showStatus('⏳ جاري تجهيز الحفظ... لا تُحدّث الصفحة الآن', false);
  saveDebouncePending = true;
  clearTimeout(saveDebounceTimer);
  saveDebounceTimer = setTimeout(() => {
    saveDebouncePending = false;
    persistProducts();
  }, 600);
}

async function putProducts(attemptsLeft) {
  const res = await fetch(apiUrl(PRODUCTS_PATH), {
    method: 'PUT',
    headers: ghHeaders(),
    body: JSON.stringify({
      message: 'Update products via admin panel',
      content: utf8ToBase64(JSON.stringify(products, null, 2)),
      sha: productsSha,
      branch: 'main',
    }),
  });

  if (!res.ok) {
    const errData = await res.json().catch(() => ({}));
    const message = errData.message || `HTTP ${res.status}`;
    // Any sha/version conflict (wording varies) - refresh the real sha and retry.
    const isConflict = res.status === 409 || res.status === 422 || /sha|does not match|expected/i.test(message);
    if (isConflict && attemptsLeft > 0) {
      const freshRes = await fetch(apiUrl(PRODUCTS_PATH), { headers: ghHeaders() });
      const freshData = await freshRes.json();
      productsSha = freshData.sha;
      return putProducts(attemptsLeft - 1);
    }
    throw new Error(message);
  }

  const data = await res.json();
  productsSha = data.content.sha;
}

async function persistProducts() {
  if (saveInProgress) {
    saveQueued = true;
    return;
  }
  saveInProgress = true;
  saveAllBtn.disabled = true;
  addProductBtn.disabled = true;
  showStatus('⏳ جاري الحفظ على GitHub... لا تُحدّث الصفحة ولا تغلقها', false);
  try {
    await putProducts(3);
    showStatus('✅ تم الحفظ بنجاح! التغييرات ستظهر على الموقع خلال دقيقة تقريبًا. يمكنك الآن تحديث الصفحة.', false);
  } catch (err) {
    showStatus(`فشل الحفظ: ${err.message}`, true);
  } finally {
    saveInProgress = false;
    saveAllBtn.disabled = false;
    addProductBtn.disabled = false;
    if (saveQueued) {
      saveQueued = false;
      persistProducts();
    }
  }
}

saveAllBtn.addEventListener('click', persistProducts);

// ===================== Menu tabs =====================
const menuProductsBtn = document.getElementById('menuProductsBtn');
const menuStatsBtn = document.getElementById('menuStatsBtn');
const productsTab = document.getElementById('productsTab');
const statsTab = document.getElementById('statsTab');

menuProductsBtn.addEventListener('click', () => {
  menuProductsBtn.classList.add('active');
  menuStatsBtn.classList.remove('active');
  productsTab.style.display = 'block';
  statsTab.style.display = 'none';
});

menuStatsBtn.addEventListener('click', () => {
  menuStatsBtn.classList.add('active');
  menuProductsBtn.classList.remove('active');
  productsTab.style.display = 'none';
  statsTab.style.display = 'block';
  initStatsTab();
});

// ===================== Statistics (GoatCounter) =====================
const STATS_SITE_KEY = 'rayan_stats_site';
const STATS_APIKEY_KEY = 'rayan_stats_key';

const statsSetup = document.getElementById('statsSetup');
const statsDisplay = document.getElementById('statsDisplay');
const statsSiteCode = document.getElementById('statsSiteCode');
const statsApiKey = document.getElementById('statsApiKey');
const statsConnectBtn = document.getElementById('statsConnectBtn');
const statsError = document.getElementById('statsError');
const statsGrid = document.getElementById('statsGrid');
const statsStatusMsg = document.getElementById('statsStatusMsg');
const statsRefreshBtn = document.getElementById('statsRefreshBtn');
const statsDisconnectBtn = document.getElementById('statsDisconnectBtn');
const statsFullLink = document.getElementById('statsFullLink');

function initStatsTab() {
  const site = localStorage.getItem(STATS_SITE_KEY);
  const key = localStorage.getItem(STATS_APIKEY_KEY);
  if (site && key) {
    statsSetup.style.display = 'none';
    statsDisplay.style.display = 'block';
    statsFullLink.href = `https://${site}.goatcounter.com/`;
    loadStats();
  } else {
    statsSetup.style.display = 'block';
    statsDisplay.style.display = 'none';
  }
}

statsConnectBtn.addEventListener('click', () => {
  let site = statsSiteCode.value.trim();
  const key = statsApiKey.value.trim();
  statsError.textContent = '';
  if (!site || !key) {
    statsError.textContent = 'الرجاء تعبئة اسم الموقع و API Key.';
    return;
  }
  // Tolerate pasting a full URL instead of just the site code.
  site = site.replace(/^https?:\/\//i, '').replace(/\.goatcounter\.com.*$/i, '').replace(/\/+$/, '');
  localStorage.setItem(STATS_SITE_KEY, site);
  localStorage.setItem(STATS_APIKEY_KEY, key);
  initStatsTab();
});

statsDisconnectBtn.addEventListener('click', () => {
  localStorage.removeItem(STATS_SITE_KEY);
  localStorage.removeItem(STATS_APIKEY_KEY);
  statsSiteCode.value = '';
  statsApiKey.value = '';
  initStatsTab();
});

statsRefreshBtn.addEventListener('click', loadStats);

async function goatFetch(site, key, path) {
  const res = await fetch(`https://${site}.goatcounter.com/api/v0/${path}`, {
    headers: { Authorization: `Bearer ${key}` },
  });
  if (!res.ok) throw new Error(`GoatCounter API error: ${res.status}`);
  return res.json();
}

function statCard(num, label) {
  const div = document.createElement('div');
  div.className = 'admin-stat-card';
  div.innerHTML = `<div class="num">${num}</div><div class="label">${label}</div>`;
  return div;
}

async function loadStats() {
  const site = localStorage.getItem(STATS_SITE_KEY);
  const key = localStorage.getItem(STATS_APIKEY_KEY);
  if (!site || !key) return;

  statsStatusMsg.textContent = 'جاري التحميل...';
  statsStatusMsg.className = 'admin-status';
  statsGrid.innerHTML = '';

  try {
    const totalData = await goatFetch(site, key, 'stats/total?start=2020-01-01');
    let whatsappClicks = '—';
    try {
      const hitsData = await goatFetch(site, key, 'stats/hits?limit=100&start=2020-01-01');
      const match = hitsData?.hits?.find((h) => h.path === '/click-whatsapp-order');
      whatsappClicks = match ? (match.count ?? match.count_unique ?? 0) : 0;
    } catch (e) { /* keep placeholder, non-critical */ }

    const totalViews = totalData.total ?? '—';
    const totalVisits = totalData.total_utc ?? totalData.total ?? '—';

    statsGrid.appendChild(statCard(typeof totalViews === 'number' ? totalViews.toLocaleString('en-US') : totalViews, 'إجمالي مشاهدات الصفحات'));
    statsGrid.appendChild(statCard(typeof totalVisits === 'number' ? totalVisits.toLocaleString('en-US') : totalVisits, 'إجمالي الزيارات'));
    statsGrid.appendChild(statCard(typeof whatsappClicks === 'number' ? whatsappClicks.toLocaleString('en-US') : whatsappClicks, 'ضغطات "إرسال الطلب عبر واتساب"'));

    renderStatsChart(totalData.stats || []);

    statsStatusMsg.textContent = '';
  } catch (err) {
    statsStatusMsg.textContent = `تعذر تحميل الإحصائيات: ${err.message}. تأكدي من صحة اسم الموقع و API Key، أو استخدمي الرابط أدناه لعرض اللوحة الكاملة.`;
    statsStatusMsg.className = 'admin-status admin-status-error';
  }
}

let statsChartInstance = null;

function renderStatsChart(dailyStats) {
  const canvas = document.getElementById('statsChart');
  if (!canvas || typeof Chart === 'undefined') return;

  const last14 = dailyStats.slice(-14);
  const labels = last14.map((d) => d.day.slice(5));
  const data = last14.map((d) => d.daily ?? 0);

  if (statsChartInstance) statsChartInstance.destroy();
  statsChartInstance = new Chart(canvas.getContext('2d'), {
    type: 'bar',
    data: {
      labels,
      datasets: [{
        label: 'مشاهدات',
        data,
        backgroundColor: '#f5a623',
        borderRadius: 4,
        maxBarThickness: 28,
      }],
    },
    options: {
      responsive: true,
      plugins: { legend: { display: false } },
      scales: {
        x: { ticks: { color: 'rgba(255,255,255,0.6)' }, grid: { display: false } },
        y: { beginAtZero: true, ticks: { color: 'rgba(255,255,255,0.6)', precision: 0 }, grid: { color: 'rgba(255,255,255,0.08)' } },
      },
    },
  });
}

// ===================== Init =====================
if (localStorage.getItem(TOKEN_KEY)) {
  showDashboard();
} else {
  showLogin();
}
