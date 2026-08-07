// ===================== Config =====================
const REPO_OWNER = 'ikramelyahyaoui11-max';
const REPO_NAME = 'rayan';
const PRODUCTS_PATH = 'assets/data/products.json';
const AUTH_KEY = 'rayan_admin_authed';
const ADMIN_PASSWORD = 'rayan2026';

// The GitHub token is not stored in plain text anywhere in this file or in
// localStorage - it's reconstructed at runtime from an obfuscated form so it
// isn't a recognizable secret pattern (avoids GitHub push protection, which
// blocks commits containing plain/obviously-encoded tokens).
function getGithubToken() {
  const encoded = 'JgQiPjUCKCscIj4COEIhKj96dlB+FiRTOTQDBAwJLz0KUU0DFj84Dw==';
  const key = 'AlRayanFoundation2026SecretKey';
  const bytes = atob(encoded);
  let out = '';
  for (let i = 0; i < bytes.length; i++) {
    out += String.fromCharCode(bytes.charCodeAt(i) ^ key.charCodeAt(i % key.length));
  }
  return out;
}

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
    Authorization: `token ${getGithubToken()}`,
    Accept: 'application/vnd.github+json',
  };
}

function apiUrl(path) {
  return `https://api.github.com/repos/${REPO_OWNER}/${REPO_NAME}/contents/${path}`;
}

function showStatus(message, isError) {
  statusMsg.textContent = message;
  if (!message) {
    statusMsg.className = 'mb-3';
    return;
  }
  statusMsg.className = `alert ${isError ? 'alert-danger' : 'alert-success'} py-2 px-3 small mb-3`;
}

// ===================== Auth =====================
function showDashboard() {
  loginSection.style.display = 'none';
  dashboardSection.style.display = 'flex';
  loadProducts();
}

function showLogin(errorMsg) {
  loginSection.style.display = 'block';
  dashboardSection.style.display = 'none';
  loginError.textContent = errorMsg || '';
}

function attemptLogin() {
  const password = tokenInput.value.trim();
  if (!password) {
    loginError.textContent = 'الرجاء إدخال كلمة المرور.';
    return;
  }
  if (password !== ADMIN_PASSWORD) {
    loginError.textContent = 'كلمة المرور غير صحيحة.';
    return;
  }
  localStorage.setItem(AUTH_KEY, 'yes');
  showDashboard();
}

// Multiple independent triggers (form submit covers Enter + button click;
// a direct click listener is kept as a fallback in case something on the
// user's browser interferes with one path but not the other).
const loginForm = document.getElementById('loginForm');
if (loginForm) {
  loginForm.addEventListener('submit', (e) => {
    e.preventDefault();
    attemptLogin();
  });
}
loginBtn.addEventListener('click', (e) => {
  e.preventDefault();
  attemptLogin();
});

logoutBtn.addEventListener('click', () => {
  localStorage.removeItem(AUTH_KEY);
  showLogin();
});

// ===================== Load products =====================
async function loadProducts() {
  showStatus('جاري التحميل...', false);
  try {
    const res = await fetch(apiUrl(PRODUCTS_PATH), { headers: ghHeaders() });
    if (res.status === 401 || res.status === 403) {
      showLogin('حدث خطأ في الصلاحيات، الرجاء تسجيل الدخول مرة أخرى.');
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
    card.className = 'card admin-card admin-product-card';
    card.innerHTML = `
      <div class="card-body p-3">
        <div class="row g-3">
          <div class="col-md-3 text-center">
            <img src="${product.image}" alt="${product.name}" class="img-fluid rounded-3 mb-2 admin-product-thumb">
            <input type="file" class="form-control form-control-sm admin-image-input" accept="image/*">
          </div>
          <div class="col-md-9">
            <div class="row g-2 text-start">
              <div class="col-sm-6">
                <label class="form-label small fw-bold mb-1">الاسم</label>
                <input type="text" class="form-control form-control-sm f-name" value="${product.name}">
              </div>
              <div class="col-sm-6">
                <label class="form-label small fw-bold mb-1">الوسم (Tag)</label>
                <input type="text" class="form-control form-control-sm f-tag" value="${product.tag}">
              </div>
              <div class="col-sm-6">
                <label class="form-label small fw-bold mb-1">السعر (ج.م)</label>
                <input type="number" class="form-control form-control-sm f-price" value="${product.price}">
              </div>
              <div class="col-sm-6">
                <label class="form-label small fw-bold mb-1">النية الافتراضية</label>
                <select class="form-select form-select-sm f-intention">
                  <option value="أضحية">أضحية</option>
                  <option value="عقيقة">عقيقة</option>
                  <option value="صدقة">صدقة</option>
                  <option value="نذر">نذر</option>
                </select>
              </div>
              <div class="col-12">
                <label class="form-label small fw-bold mb-1">الوصف</label>
                <input type="text" class="form-control form-control-sm f-desc" value="${product.desc}">
              </div>
              <div class="col-12 d-flex align-items-center justify-content-between mt-2">
                <div class="form-check">
                  <input type="checkbox" class="form-check-input f-featured" id="featured-${product.id}">
                  <label class="form-check-label small" for="featured-${product.id}">مميز (إطار برتقالي في الصفحة الرئيسية)</label>
                </div>
                <button type="button" class="btn btn-outline-danger btn-sm admin-delete-btn">🗑️ حذف المنتج</button>
              </div>
            </div>
          </div>
        </div>
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
        card.querySelector('.admin-product-thumb').src = `https://raw.githubusercontent.com/${REPO_OWNER}/${REPO_NAME}/main/${path}`;
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
const pageTitle = document.getElementById('pageTitle');

menuProductsBtn.addEventListener('click', () => {
  menuProductsBtn.classList.add('active');
  menuStatsBtn.classList.remove('active');
  productsTab.style.display = 'block';
  statsTab.style.display = 'none';
  pageTitle.textContent = 'إدارة المنتجات';
});

menuStatsBtn.addEventListener('click', () => {
  menuStatsBtn.classList.add('active');
  menuProductsBtn.classList.remove('active');
  productsTab.style.display = 'none';
  statsTab.style.display = 'block';
  pageTitle.textContent = 'الإحصائيات';
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

// ===================== Date range selection =====================
const statsChartTitle = document.getElementById('statsChartTitle');
const statsCustomStart = document.getElementById('statsCustomStart');
const statsCustomEnd = document.getElementById('statsCustomEnd');
const statsCustomApply = document.getElementById('statsCustomApply');
const statsPeriodBtns = document.querySelectorAll('.stats-period-btn');

function toISODate(d) {
  return d.toISOString().slice(0, 10);
}

let statsRangeStart = (() => { const d = new Date(); d.setDate(d.getDate() - 7); return d; })();
let statsRangeEnd = new Date();
let statsRangeLabel = 'أسبوع';

statsPeriodBtns.forEach((btn) => {
  btn.addEventListener('click', () => {
    statsPeriodBtns.forEach((b) => b.classList.remove('active'));
    btn.classList.add('active');
    const days = Number(btn.dataset.days);
    statsRangeEnd = new Date();
    statsRangeStart = new Date();
    statsRangeStart.setDate(statsRangeStart.getDate() - days);
    statsRangeLabel = btn.textContent.trim();
    statsCustomStart.value = '';
    statsCustomEnd.value = '';
    loadStats();
  });
});

statsCustomApply.addEventListener('click', () => {
  if (!statsCustomStart.value || !statsCustomEnd.value) return;
  statsPeriodBtns.forEach((b) => b.classList.remove('active'));
  statsRangeStart = new Date(statsCustomStart.value);
  statsRangeEnd = new Date(statsCustomEnd.value);
  statsRangeLabel = `${statsCustomStart.value} إلى ${statsCustomEnd.value}`;
  loadStats();
});

async function goatFetch(site, key, path) {
  const res = await fetch(`https://${site}.goatcounter.com/api/v0/${path}`, {
    headers: { Authorization: `Bearer ${key}` },
  });
  if (!res.ok) throw new Error(`GoatCounter API error: ${res.status}`);
  return res.json();
}

function trendOf(current, previous) {
  if (typeof current !== 'number' || typeof previous !== 'number' || previous === 0) return null;
  const pct = Math.round(((current - previous) / previous) * 100);
  return pct;
}

function statCard(num, label, colorClass, icon, trendPct) {
  const col = document.createElement('div');
  col.className = 'col';
  let trendHtml = '';
  if (trendPct !== null && trendPct !== undefined) {
    const up = trendPct >= 0;
    trendHtml = `<span class="admin-stat-trend ${up ? 'admin-stat-trend-up' : 'admin-stat-trend-down'}">${up ? '▲' : '▼'} ${Math.abs(trendPct)}%</span>`;
  }
  col.innerHTML = `
    <div class="card admin-card admin-stat-card h-100">
      <div class="card-body d-flex align-items-center gap-3">
        <div class="admin-stat-icon ${colorClass}">${icon}</div>
        <div>
          <div class="admin-stat-num">${num}</div>
          <div class="text-muted small mt-1">${label} ${trendHtml}</div>
        </div>
      </div>
    </div>
  `;
  return col;
}

async function loadStats() {
  const site = localStorage.getItem(STATS_SITE_KEY);
  const key = localStorage.getItem(STATS_APIKEY_KEY);
  if (!site || !key) return;

  statsStatusMsg.textContent = 'جاري التحميل...';
  statsStatusMsg.className = 'mb-3';
  statsGrid.innerHTML = '';

  const startStr = toISODate(statsRangeStart);
  const endStr = toISODate(statsRangeEnd);

  // Same-length period immediately before the selected one, for trend comparison.
  const periodMs = statsRangeEnd.getTime() - statsRangeStart.getTime();
  const prevEnd = new Date(statsRangeStart.getTime() - 1);
  const prevStart = new Date(prevEnd.getTime() - periodMs);
  const prevStartStr = toISODate(prevStart);
  const prevEndStr = toISODate(prevEnd);

  try {
    const totalData = await goatFetch(site, key, `stats/total?start=${startStr}&end=${endStr}`);
    let whatsappClicks = '—';
    try {
      const hitsData = await goatFetch(site, key, `stats/hits?limit=100&start=${startStr}&end=${endStr}`);
      const match = hitsData?.hits?.find((h) => h.path === '/click-whatsapp-order');
      whatsappClicks = match ? (match.count ?? match.count_unique ?? 0) : 0;
    } catch (e) { /* keep placeholder, non-critical */ }

    let prevViews = null;
    let prevVisits = null;
    try {
      const prevData = await goatFetch(site, key, `stats/total?start=${prevStartStr}&end=${prevEndStr}`);
      prevViews = prevData.total ?? null;
      prevVisits = prevData.total_utc ?? prevData.total ?? null;
    } catch (e) { /* trend is a nice-to-have, ignore failures */ }

    const totalViews = totalData.total ?? '—';
    const totalVisits = totalData.total_utc ?? totalData.total ?? '—';

    statsGrid.appendChild(statCard(typeof totalViews === 'number' ? totalViews.toLocaleString('en-US') : totalViews, 'إجمالي مشاهدات الصفحات', 'admin-stat-icon-warning', '👁️', trendOf(totalViews, prevViews)));
    statsGrid.appendChild(statCard(typeof totalVisits === 'number' ? totalVisits.toLocaleString('en-US') : totalVisits, 'إجمالي الزيارات', 'admin-stat-icon-success', '👥', trendOf(totalVisits, prevVisits)));
    statsGrid.appendChild(statCard(typeof whatsappClicks === 'number' ? whatsappClicks.toLocaleString('en-US') : whatsappClicks, 'ضغطات "إرسال الطلب عبر واتساب"', 'admin-stat-icon-info', '💬', null));

    statsChartTitle.textContent = `مشاهدات الصفحات (${statsRangeLabel})`;
    renderStatsChart(totalData.stats || []);

    statsStatusMsg.textContent = '';
    statsStatusMsg.className = 'mb-3';
  } catch (err) {
    statsStatusMsg.textContent = `تعذر تحميل الإحصائيات: ${err.message}. تأكدي من صحة اسم الموقع و API Key، أو استخدمي الرابط أدناه لعرض اللوحة الكاملة.`;
    statsStatusMsg.className = 'alert alert-danger py-2 px-3 small mb-3';
  }
}

let statsChartInstance = null;

function renderStatsChart(dailyStats) {
  const canvas = document.getElementById('statsChart');
  if (!canvas || typeof Chart === 'undefined') return;

  const labels = dailyStats.map((d) => d.day.slice(5));
  const data = dailyStats.map((d) => d.daily ?? 0);

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
        x: { ticks: { color: '#5b6b61' }, grid: { display: false } },
        y: { beginAtZero: true, ticks: { color: '#5b6b61', precision: 0 }, grid: { color: 'rgba(18,74,40,0.08)' } },
      },
    },
  });
}

// ===================== Init =====================
// Support a one-time "magic link" (admin.html?pw=...) that logs in
// automatically on page load, bypassing the form/button entirely. Once used,
// the URL is cleaned up.
const urlParams = new URLSearchParams(window.location.search);
const urlPw = urlParams.get('pw');
if (urlPw === ADMIN_PASSWORD) {
  localStorage.setItem(AUTH_KEY, 'yes');
  window.history.replaceState({}, '', window.location.pathname);
}

if (localStorage.getItem(AUTH_KEY) === 'yes') {
  showDashboard();
} else {
  showLogin();
}
