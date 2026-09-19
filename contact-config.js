// Los datos editables viven únicamente en menu-config.json.
(() => {
  const storageKey = 'clowder_contact_config';
  let config = null;
  let pending = null;
  function validate(value) {
    if (!value || !/^[1-9]\d{7,14}$/.test(value.whatsappNumber)) throw new Error('Número de WhatsApp inválido');
    for (const key of ['paymentsUrl', 'instagramUrl', 'communityUrl']) {
      if (new URL(value[key]).protocol !== 'https:') throw new Error('Enlace inválido');
    }
    return Object.freeze({ ...value });
  }
  function url(message = '') {
    if (!config) throw new Error('No se pudo verificar el contacto');
    return `https://wa.me/${config.whatsappNumber}${message ? '?text=' + encodeURIComponent(message) : ''}`;
  }
  function updateLinks() {
    document.querySelectorAll('[data-whatsapp]').forEach(link => {
      if (config) link.href = url(link.dataset.message || '');
    });
  }
  try { config = validate(JSON.parse(localStorage.getItem(storageKey))); } catch (_) {}
  async function refresh() {
    if (pending) return pending;
    pending = (async () => {
      const controller = new AbortController();
      const timer = setTimeout(() => controller.abort(), 5000);
      try {
        // This header tells the worker that sending requires a live contact check.
        const response = await fetch('./menu-config.json', {
          cache: 'no-store', signal: controller.signal, headers: { 'X-Clowder-Contact': 'live' }
        });
        if (!response.ok) throw new Error('No se pudo verificar el contacto');
        config = validate(await response.json());
        try { localStorage.setItem(storageKey, JSON.stringify(config)); } catch (_) {}
        updateLinks();
        window.dispatchEvent(new Event('clowder:contact-updated'));
        return config;
      } finally { clearTimeout(timer); }
    })();
    try { return await pending; } finally { pending = null; }
  }
  // Reserve the tab within the click gesture to support Safari popup rules.
  function reserveWindow() {
    let target = null;
    try { target = window.open('about:blank', '_blank'); if (target) target.opener = null; } catch (_) {}
    return target;
  }
  function navigate(target, destination) {
    if (target && !target.closed) target.location.replace(destination);
    else window.location.assign(destination);
  }
  window.MenuContact = { refresh, url, reserveWindow, navigate, get value() { return config; } };
  document.addEventListener('click', async event => {
    const link = event.target.closest('[data-whatsapp]');
    if (!link) return;
    event.preventDefault();
    if (link.dataset.busy) return;
    link.dataset.busy = 'true';
    const target = reserveWindow();
    try { await refresh(); navigate(target, url(link.dataset.message || '')); }
    catch (_) { if (target) target.close(); alert('No pudimos verificar el contacto. Revisa tu conexión e inténtalo de nuevo.'); }
    finally { delete link.dataset.busy; }
  });
  function check() { if (document.visibilityState === 'visible' && navigator.onLine) refresh().catch(() => {}); }
  updateLinks();
  check();
  setInterval(check, 60000);
  window.addEventListener('online', check);
  document.addEventListener('visibilitychange', check);
})();
