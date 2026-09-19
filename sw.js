// Cache names include the scope: another menu on this origin keeps its own data.
const SCOPE_URL = new URL(self.registration.scope);
const CACHE_PREFIX = `clowder-menu:${SCOPE_URL.pathname}:`;
const SHELL_CACHE = `${CACHE_PREFIX}shell-v21`;
const ASSET_CACHE = `${CACHE_PREFIX}assets-v21`;
const INDEX_URL = new URL('index.html', SCOPE_URL).href;
const CONFIG_URL = new URL('menu-config.json', SCOPE_URL).href;
const MAX_RUNTIME_ASSETS = 80;
const APP_SHELL = [
  'index.html',
  'app.js',
  'contact-config.js',
  'styles.css',
  'manifest.webmanifest',
  'icons/clowder-icon-192-v9.png',
  'icons/clowder-icon-512-v9.png',
  'fuentes/Doughie.ttf'
];

function isInScope(url) {
  return url.origin === SCOPE_URL.origin && url.pathname.startsWith(SCOPE_URL.pathname);
}

async function fetchFresh(request) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 5000);
  try {
    return await fetch(request, { cache: 'no-store', signal: controller.signal });
  } finally {
    clearTimeout(timeout);
  }
}

async function remember(cacheName, key, response) {
  // Cache storage may be unavailable or full. That must never block an online order.
  try {
    const cache = await caches.open(cacheName);
    await cache.put(key, response.clone());
    if (cacheName === ASSET_CACHE) {
      const keys = await cache.keys();
      await Promise.all(keys.slice(0, Math.max(0, keys.length - MAX_RUNTIME_ASSETS))
        .map(request => cache.delete(request)));
    }
  } catch (_) {}
}

async function findCached(key) {
  try {
    const shell = await caches.open(SHELL_CACHE);
    const assets = await caches.open(ASSET_CACHE);
    return (await assets.match(key)) || (await shell.match(key));
  } catch (_) {
    return undefined;
  }
}

function isUsableResponse(response, kind) {
  if (!response.ok || response.status === 206 || response.type === 'opaque') return false;
  const type = (response.headers.get('Content-Type') || '').toLowerCase();
  if (kind === 'document') return type.includes('text/html');
  if (kind === 'script') return /(?:java|ecma)script/.test(type);
  if (kind === 'style') return type.includes('text/css');
  if (kind === 'manifest' || kind === 'config') return /application\/(?:[\w.+-]*\+)?json/.test(type);
  if (kind === 'image') return type.startsWith('image/');
  if (kind === 'font') return /^(?:font\/|application\/(?:font|x-font|octet-stream))/.test(type);
  return false;
}

async function networkFirst(request, key, kind) {
  try {
    const response = await fetchFresh(request);
    if (isUsableResponse(response, kind)) {
      if (kind === 'config') {
        const config = await response.clone().json();
        if (!config || typeof config !== 'object' || Array.isArray(config)) throw new Error('Invalid configuration');
      }
      await remember(SHELL_CACHE, key, response);
      return response;
    }
  } catch (_) {}
  // Checkout must verify the current destination, never accept an offline copy.
  if (kind === 'config' && request.headers.get('X-Clowder-Contact') === 'live') return Response.error();
  const cached = await findCached(key);
  if (cached) return cached;
  if (kind === 'document') {
    return new Response('<!doctype html><html lang="es"><meta charset="utf-8"><meta name="viewport" content="width=device-width"><title>Clowder</title><h1>No pudimos cargar el menú</h1><p>Revisa tu conexión y vuelve a intentarlo.</p><button onclick="location.reload()">Reintentar</button></html>', {
      status: 503,
      headers: { 'Content-Type': 'text/html; charset=utf-8', 'Cache-Control': 'no-store' }
    });
  }
  // Never return the menu HTML for a missing JSON, script, image or stylesheet.
  return Response.error();
}

async function refreshAsset(request, key, kind) {
  try {
    const response = await fetchFresh(request);
    if (isUsableResponse(response, kind)) {
      await remember(ASSET_CACHE, key, response);
      return response;
    }
  } catch (_) {}
  return (await findCached(key)) || Response.error();
}

self.addEventListener('install', event => {
  event.waitUntil((async () => {
    const cache = await caches.open(SHELL_CACHE);
    await cache.addAll(APP_SHELL.map(path => new Request(new URL(path, SCOPE_URL), { cache: 'reload' })));
    await self.skipWaiting();
  })());
});

self.addEventListener('activate', event => {
  event.waitUntil((async () => {
    const names = await caches.keys();
    await Promise.all(names.map(async name => {
      if (name.startsWith(CACHE_PREFIX) && name !== SHELL_CACHE && name !== ASSET_CACHE) {
        await caches.delete(name);
      } else if (name.startsWith('clowder-pwa-')) {
        // Legacy caches were shared across scopes. Remove only our own entries.
        const cache = await caches.open(name);
        const keys = await cache.keys();
        await Promise.all(keys.filter(request => isInScope(new URL(request.url)))
          .map(request => cache.delete(request)));
        if (!(await cache.keys()).length) await caches.delete(name);
      }
    }));
    await self.clients.claim();
    const windows = await self.clients.matchAll({ type: 'window' });
    windows.filter(client => isInScope(new URL(client.url))).forEach(client => {
      client.postMessage({ type: 'MENU_UPDATE_AVAILABLE' });
    });
    // Do not navigate clients: a customer may be writing an address or placing an order.
    // Legacy pages without a message listener need their next navigation to load new JS.
  })());
});

self.addEventListener('fetch', event => {
  if (event.request.method !== 'GET' || event.request.headers.has('range')) return;
  const url = new URL(event.request.url);
  if (!isInScope(url)) return;
  const key = `${url.origin}${url.pathname}`;
  if (url.pathname === SCOPE_URL.pathname || key === INDEX_URL) {
    event.respondWith(networkFirst(event.request, INDEX_URL, 'document'));
    return;
  }
  if (key === CONFIG_URL) {
    event.respondWith(networkFirst(event.request, CONFIG_URL, 'config'));
    return;
  }
  // Other navigation routes retain their real response (including a real 404).
  if (event.request.mode === 'navigate') return;
  let kind = event.request.destination;
  if (!kind) {
    if (/\.m?js$/i.test(url.pathname)) kind = 'script';
    else if (/\.css$/i.test(url.pathname)) kind = 'style';
    else if (/\.webmanifest$/i.test(url.pathname)) kind = 'manifest';
  }
  if (['script', 'style', 'manifest'].includes(kind)) {
    event.respondWith(networkFirst(event.request, key, kind));
  } else if (['image', 'font'].includes(kind)) {
    const refresh = refreshAsset(event.request, key, kind);
    event.waitUntil(refresh);
    event.respondWith(findCached(key).then(cached => cached || refresh));
  }
});
