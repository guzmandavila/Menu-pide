const CACHE_NAME = 'clowder-pwa-v20-refresh-open-menus';
const APP_SHELL = [
  './',
  './index.html',
  './manifest.webmanifest',
  './icons/clowder-icon-192-v9.png',
  './icons/clowder-icon-512-v9.png',
  './fuentes/Doughie.ttf'
];

self.addEventListener('install', event => {
  event.waitUntil(caches.open(CACHE_NAME).then(cache => cache.addAll(APP_SHELL)));
  self.skipWaiting();
});

self.addEventListener('activate', event => {
  event.waitUntil((async () => {
    const keys = await caches.keys();
    await Promise.all(keys.filter(key => key.startsWith('clowder-pwa-') && key !== CACHE_NAME)
      .map(key => caches.delete(key)));
    await self.clients.claim();
    // Old pages have no update listener: navigate them once to replace stale code.
    const windows = await self.clients.matchAll({ type: 'window' });
    const scope = new URL('./', self.location).href;
    await Promise.all(windows.filter(client => client.url.startsWith(scope))
      .map(client => client.navigate(client.url).catch(() => {})));
  })());
});

self.addEventListener('fetch', event => {
  if (event.request.method !== 'GET') return;
  // Always refresh the menu online so contact details cannot remain stale.
  const url = new URL(event.request.url);
  if (event.request.mode === 'navigate' ||
      (url.origin === self.location.origin &&
       (url.pathname === new URL('./', self.location).pathname ||
        url.pathname === new URL('./index.html', self.location).pathname))) {
    event.respondWith((async () => {
      const cache = await caches.open(CACHE_NAME);
      try {
        const response = await fetch(event.request, { cache: 'no-store' });
        if (!response.ok) throw new Error('Menu unavailable');
        await cache.put('./index.html', response.clone());
        return response;
      } catch (error) {
        const cached = await cache.match('./index.html');
        if (cached) return cached;
        throw error;
      }
    })());
    return;
  }
  event.respondWith(
    caches.match(event.request).then(cached => cached || fetch(event.request).then(response => {
      if (response.ok && new URL(event.request.url).origin === self.location.origin) {
        const copy = response.clone();
        caches.open(CACHE_NAME).then(cache => cache.put(event.request, copy));
      }
      return response;
    }).catch(() => caches.match('./index.html')))
  );
});
