// Applies site-wide settings (WhatsApp number, phone) saved from the admin
// panel to WhatsApp/tel links and their visible text on the current page.
window.RayanSettings = { data: null };

fetch(`assets/data/settings.json?v=${Date.now()}`, { cache: 'no-store' })
  .then((res) => res.json())
  .then((settings) => {
    window.RayanSettings.data = settings;
    const waNum = settings.whatsapp;
    const phoneNum = settings.phone;

    if (waNum) {
      document.querySelectorAll('a[href*="wa.me/"]').forEach((a) => {
        a.href = a.href.replace(/wa\.me\/\d+/, `wa.me/${waNum}`);
        if (a.textContent.includes('واتساب:') && phoneNum) {
          a.textContent = `واتساب: ${phoneNum}`;
        }
      });
    }
    if (phoneNum) {
      document.querySelectorAll('a[href^="tel:"]').forEach((a) => {
        a.href = `tel:${phoneNum}`;
        if (/^\+?\d[\d\s]*$/.test(a.textContent.trim())) a.textContent = phoneNum;
      });
    }
  })
  .catch(() => { /* settings.json missing or unreachable - keep default numbers in the HTML */ });
