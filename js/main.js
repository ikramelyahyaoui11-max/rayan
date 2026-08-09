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

// ===================== FAQ accordion =====================
document.querySelectorAll('.accordion-item').forEach((item) => {
  const trigger = item.querySelector('.accordion-trigger');
  const panel = item.querySelector('.accordion-panel');

  trigger.addEventListener('click', () => {
    const isOpen = item.classList.contains('open');

    document.querySelectorAll('.accordion-item.open').forEach((openItem) => {
      if (openItem !== item) {
        openItem.classList.remove('open');
        openItem.querySelector('.accordion-trigger').setAttribute('aria-expanded', 'false');
        openItem.querySelector('.accordion-panel').style.maxHeight = null;
      }
    });

    item.classList.toggle('open', !isOpen);
    trigger.setAttribute('aria-expanded', String(!isOpen));
    panel.style.maxHeight = isOpen ? null : panel.scrollHeight + 'px';
  });
});

// ===================== Animated counters =====================
const counters = document.querySelectorAll('.stat-num');

const animateCounter = (el) => {
  const target = parseInt(el.dataset.count, 10);
  const suffix = el.dataset.suffix || '';
  const duration = 1400;
  const startTime = performance.now();

  const tick = (now) => {
    const progress = Math.min((now - startTime) / duration, 1);
    const eased = 1 - Math.pow(1 - progress, 3);
    const value = Math.round(target * eased);
    el.textContent = value.toLocaleString('en-US') + suffix;
    if (progress < 1) requestAnimationFrame(tick);
  };
  requestAnimationFrame(tick);
};

if ('IntersectionObserver' in window) {
  const observer = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        animateCounter(entry.target);
        observer.unobserve(entry.target);
      }
    });
  }, { threshold: 0.5 });

  counters.forEach((el) => observer.observe(el));
} else {
  counters.forEach((el) => {
    el.textContent = el.dataset.count + (el.dataset.suffix || '');
  });
}

// ===================== Footer year =====================
document.getElementById('year').textContent = new Date().getFullYear();

// ===================== Proof gallery (mixed photos + videos carousel) =====================
const galleryImages = ['05', '14', '25', '40', '58'].map((n) => `assets/gallery/rayan-${n}.jpg`);
const VIDEO_COUNT = 5;
const videoItems = Array.from({ length: VIDEO_COUNT }, (_, i) => {
  const n = String(i + 1).padStart(2, '0');
  return {
    src: `assets/gallery/videos/rayan-vid-${n}.mp4`,
    poster: `assets/gallery/videos/thumbs/rayan-vid-${n}.jpg`,
  };
});

const galleryItems = [];
for (let i = 0; i < Math.max(galleryImages.length, videoItems.length); i++) {
  if (galleryImages[i]) galleryItems.push({ type: 'image', src: galleryImages[i] });
  if (videoItems[i]) galleryItems.push({ type: 'video', ...videoItems[i] });
}

const track = document.getElementById('carouselTrack');
let imageIndex = 0;

galleryItems.forEach((item) => {
  const slide = document.createElement('div');
  slide.className = 'carousel-slide';

  if (item.type === 'image') {
    const currentImageIndex = imageIndex;
    const img = document.createElement('img');
    img.src = item.src;
    img.loading = 'lazy';
    img.alt = `توثيق ميداني - صورة ${currentImageIndex + 1}`;
    slide.appendChild(img);
    slide.addEventListener('click', () => openLightbox(currentImageIndex));
    imageIndex++;
  } else {
    slide.classList.add('video-card');

    const video = document.createElement('video');
    video.src = item.src;
    video.preload = 'none';
    video.poster = item.poster;
    video.setAttribute('playsinline', '');
    video.setAttribute('aria-label', 'توثيق ميداني - فيديو');

    const poster = document.createElement('div');
    poster.className = 'video-poster';
    poster.innerHTML = '<button type="button" class="video-play-btn" aria-label="تشغيل الفيديو">▶</button>';

    const playVideo = () => {
      slide.classList.add('is-playing');
      video.controls = true;
      video.play();
    };
    poster.addEventListener('click', playVideo);

    video.addEventListener('play', () => {
      slide.classList.add('is-playing');
      video.controls = true;
      track.querySelectorAll('video').forEach((v) => {
        if (v !== video) v.pause();
      });
      stopAutoplay();
    });
    video.addEventListener('pause', () => {
      if (video.currentTime === 0) slide.classList.remove('is-playing');
    });

    slide.appendChild(video);
    slide.appendChild(poster);
  }

  track.appendChild(slide);
});

const carouselPrev = document.getElementById('carouselPrev');
const carouselNext = document.getElementById('carouselNext');

const scrollCarousel = (direction) => {
  const amount = track.clientWidth * 0.7;
  const maxScroll = track.scrollWidth - track.clientWidth;

  if (direction > 0 && Math.abs(track.scrollLeft) >= maxScroll - 4) {
    track.scrollTo({ left: 0, behavior: 'smooth' });
  } else {
    track.scrollBy({ left: -direction * amount, behavior: 'smooth' });
  }
};

carouselPrev.addEventListener('click', () => scrollCarousel(-1));
carouselNext.addEventListener('click', () => scrollCarousel(1));

let autoplayTimer = null;
const startAutoplay = () => {
  stopAutoplay();
  autoplayTimer = setInterval(() => scrollCarousel(1), 3200);
};
const stopAutoplay = () => {
  if (autoplayTimer) clearInterval(autoplayTimer);
};
startAutoplay();

const carouselEl = track.closest('.carousel');
carouselEl.addEventListener('mouseenter', stopAutoplay);
carouselEl.addEventListener('mouseleave', startAutoplay);
carouselEl.addEventListener('touchstart', stopAutoplay, { passive: true });
carouselEl.addEventListener('touchend', () => setTimeout(startAutoplay, 2500), { passive: true });

// ---- Lightbox ----
const lightbox = document.getElementById('lightbox');
const lightboxImg = document.getElementById('lightboxImg');
const lightboxCounter = document.getElementById('lightboxCounter');
const lightboxClose = document.getElementById('lightboxClose');
const lightboxPrev = document.getElementById('lightboxPrev');
const lightboxNext = document.getElementById('lightboxNext');

let currentIndex = 0;

function showLightboxImage(i) {
  currentIndex = (i + galleryImages.length) % galleryImages.length;
  lightboxImg.src = galleryImages[currentIndex];
  lightboxImg.alt = `توثيق ميداني - صورة ${currentIndex + 1}`;
  lightboxCounter.textContent = `${currentIndex + 1} / ${galleryImages.length}`;
}

function openLightbox(i) {
  showLightboxImage(i);
  lightbox.classList.add('open');
  lightbox.setAttribute('aria-hidden', 'false');
  document.body.style.overflow = 'hidden';
  stopAutoplay();
}

function closeLightbox() {
  lightbox.classList.remove('open');
  lightbox.setAttribute('aria-hidden', 'true');
  document.body.style.overflow = '';
  startAutoplay();
}

lightboxClose.addEventListener('click', closeLightbox);
lightboxPrev.addEventListener('click', () => showLightboxImage(currentIndex - 1));
lightboxNext.addEventListener('click', () => showLightboxImage(currentIndex + 1));

lightbox.addEventListener('click', (e) => {
  if (e.target === lightbox) closeLightbox();
});

document.addEventListener('keydown', (e) => {
  if (!lightbox.classList.contains('open')) return;
  if (e.key === 'Escape') closeLightbox();
  if (e.key === 'ArrowLeft') showLightboxImage(currentIndex + 1);
  if (e.key === 'ArrowRight') showLightboxImage(currentIndex - 1);
});

// ===================== Product cards (loaded from assets/data/products.json) =====================
fetch(`assets/data/products.json?v=${Date.now()}`, { cache: 'no-store' })
  .then((res) => res.json())
  .then((products) => {
    const productsGrid = document.getElementById('productsGrid');

    products.forEach((product) => {
      const card = document.createElement('div');
      card.className = product.featured ? 'card product-card featured' : 'card product-card';
      card.dataset.product = product.name;
      card.dataset.price = product.price;
      card.innerHTML = `
        <a class="product-link" href="product.html?id=${product.id}">
          <div class="product-card-image"><img src="${product.image}" alt="${product.name}" loading="lazy"></div>
          <span class="product-tag">${product.tag}</span>
          <h3>${product.name}</h3>
          <p class="product-desc">${product.desc}</p>
          <span class="stars">★★★★★</span>
          <div class="product-price currency-price" data-egp="${product.price}" data-split="true">${product.price.toLocaleString('en-US')} <span>ج.م</span></div>
        </a>
        <div class="product-actions">
          <div class="qty-stepper">
            <button type="button" class="qty-btn qty-minus" aria-label="إنقاص الكمية">−</button>
            <span class="qty-value">1</span>
            <button type="button" class="qty-btn qty-plus" aria-label="زيادة الكمية">+</button>
          </div>
          <button type="button" class="btn btn-primary btn-block add-to-cart-btn">🛒 أضف للسلة</button>
        </div>
      `;

      const qtyValue = card.querySelector('.qty-value');
      card.querySelector('.qty-minus').addEventListener('click', () => {
        qtyValue.textContent = String(Math.max(1, Number(qtyValue.textContent) - 1));
      });
      card.querySelector('.qty-plus').addEventListener('click', () => {
        qtyValue.textContent = String(Number(qtyValue.textContent) + 1);
      });
      card.querySelector('.add-to-cart-btn').addEventListener('click', () => {
        window.RayanCart.add(product.name, product.price, Number(qtyValue.textContent));
        qtyValue.textContent = '1';
      });

      card.classList.add('in-view');
      productsGrid.appendChild(card);
    });
    document.dispatchEvent(new CustomEvent('rayan-content-updated'));
  });

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

  document.querySelectorAll('.reveal-group').forEach((group) => {
    Array.from(group.children).forEach((child, i) => {
      child.style.transitionDelay = `${Math.min(i, 6) * 70}ms`;
      revealObserver.observe(child);
    });
  });
} else {
  document.querySelectorAll('.reveal, .reveal-group > *').forEach((el) => el.classList.add('in-view'));
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
