// Run with Node 18+: node scripts/check-service-worker.cjs
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const source = fs.readFileSync(path.join(__dirname, '..', 'sw.js'), 'utf8');
const scope = 'https://example.test/Menu-pide/';
const keyOf = request => typeof request === 'string' ? request : request.url;
const html = text => new Response(text, { headers: { 'Content-Type': 'text/html' } });
const json = value => new Response(JSON.stringify(value), { headers: { 'Content-Type': 'application/json' } });
const asset = (text, type) => new Response(text, { headers: { 'Content-Type': type } });

function harness() {
  const handlers = new Map();
  const stores = new Map();
  const messages = [];
  const navigations = [];
  const fetches = [];
  let network = async () => { throw new Error('offline'); };
  const clients = [scope, scope + 'index.html', 'https://example.test/Another-menu/'].map(url => ({
    url,
    postMessage(message) { messages.push({ url, type: message.type }); },
    navigate(url) { navigations.push(url); return Promise.resolve(); }
  }));
  const caches = {
    async open(name) {
      if (!stores.has(name)) stores.set(name, new Map());
      const store = stores.get(name);
      return {
        async match(key) { return store.get(keyOf(key))?.clone(); },
        async put(key, response) { store.set(keyOf(key), response.clone()); },
        async delete(key) { return store.delete(keyOf(key)); },
        async keys() { return [...store.keys()].map(key => new Request(key)); },
        async addAll(requests) {
          for (const request of requests) {
            const response = await network(request);
            if (!response.ok) throw new Error('Precache failed');
            store.set(request.url, response.clone());
          }
        }
      };
    },
    async keys() { return [...stores.keys()]; },
    async delete(name) { return stores.delete(name); }
  };
  const self = {
    registration: { scope },
    addEventListener(name, handler) { handlers.set(name, handler); },
    async skipWaiting() { self.skippedWaiting = true; },
    clients: {
      async claim() { self.claimed = true; },
      async matchAll() { return clients; }
    }
  };
  vm.runInNewContext(source, {
    self, caches, URL, Request, Response, AbortController, setTimeout, clearTimeout,
    async fetch(request, options) {
      fetches.push({ url: request.url, options });
      return network(request, options);
    }
  }, { filename: 'sw.js' });
  return {
    self, caches, stores, fetches, messages, navigations,
    setNetwork(fn) { network = fn; },
    async lifecycle(name) {
      const work = [];
      handlers.get(name)({ waitUntil(promise) { work.push(promise); } });
      await Promise.all(work);
    },
    async request(url, { destination = '', mode = 'cors', method = 'GET', headers = {} } = {}) {
      let response;
      let handled = false;
      const work = [];
      handlers.get('fetch')({
        request: { url: new URL(url, scope).href, destination, mode, method, headers: new Headers(headers) },
        respondWith(promise) { handled = true; response = promise; },
        waitUntil(promise) { work.push(promise); }
      });
      const result = await response;
      await Promise.all(work);
      return { handled, response: result };
    }
  };
}

(async () => {
  const sw = harness();
  sw.setNetwork(async request => html(request.url));
  await sw.lifecycle('install');
  assert.equal(sw.self.skippedWaiting, true);
  const shellName = [...sw.stores.keys()].find(name => name.includes('shell-'));
  const shell = await sw.caches.open(shellName);
  for (const file of ['index.html', 'app.js', 'contact-config.js', 'styles.css']) {
    assert.ok(await shell.match(scope + file), `${file} must be available offline`);
  }

  const legacy = await sw.caches.open('clowder-pwa-v20-refresh-open-menus');
  await legacy.put(scope + 'index.html', html('old own menu'));
  await legacy.put('https://example.test/Another-menu/index.html', html('another menu'));
  const previous = await sw.caches.open('clowder-menu:/Menu-pide/:shell-v20');
  await previous.put(scope + 'index.html', html('old own scoped menu'));
  const sibling = await sw.caches.open('clowder-menu:/Another-menu/:shell-v20');
  await sibling.put('https://example.test/Another-menu/index.html', html('other app'));
  await sw.lifecycle('activate');
  assert.equal(sw.self.claimed, true);
  assert.equal(sw.navigations.length, 0, 'updates must never navigate an active checkout');
  assert.deepEqual(sw.messages.map(entry => entry.type), ['MENU_UPDATE_AVAILABLE', 'MENU_UPDATE_AVAILABLE']);
  assert.equal(await legacy.match(scope + 'index.html'), undefined);
  assert.ok(await legacy.match('https://example.test/Another-menu/index.html'));
  assert.ok(sw.stores.has('clowder-menu:/Another-menu/:shell-v20'));
  assert.equal(sw.stores.has('clowder-menu:/Menu-pide/:shell-v20'), false);

  sw.setNetwork(async () => json({ whatsappNumber: '593979864314' }));
  let result = await sw.request('menu-config.json');
  assert.equal((await result.response.json()).whatsappNumber, '593979864314');
  assert.equal(sw.fetches.at(-1).options.cache, 'no-store');
  sw.setNetwork(async () => json({ whatsappNumber: '593999999999' }));
  result = await sw.request('menu-config.json');
  assert.equal((await result.response.json()).whatsappNumber, '593999999999', 'online config must bypass cached phone');

  sw.setNetwork(async () => { throw new Error('offline'); });
  result = await sw.request('menu-config.json');
  assert.equal((await result.response.json()).whatsappNumber, '593999999999');
  result = await sw.request('menu-config.json', { headers: { 'X-Clowder-Contact': 'live' } });
  assert.equal(result.response.type, 'error', 'checkout must reject stale cached contact data');
  result = await sw.request('missing-image.png', { destination: 'image' });
  assert.equal(result.response.type, 'error', 'offline images must never receive HTML');
  result = await sw.request('./', { mode: 'navigate' });
  assert.ok(result.response.headers.get('Content-Type').includes('text/html'));

  sw.setNetwork(async () => html('server error disguised as success'));
  result = await sw.request('menu-config.json', { headers: { 'X-Clowder-Contact': 'live' } });
  assert.equal(result.response.type, 'error');
  sw.setNetwork(async () => new Response('{broken', { headers: { 'Content-Type': 'application/json' } }));
  result = await sw.request('menu-config.json');
  assert.equal((await result.response.json()).whatsappNumber, '593999999999', 'invalid JSON must not replace valid cached config');

  sw.setNetwork(async () => asset('window.version = 2;', 'text/javascript'));
  result = await sw.request('app.js', { destination: 'script' });
  assert.equal(await result.response.text(), 'window.version = 2;');
  sw.setNetwork(async () => asset('window.version = 3;', 'text/javascript'));
  result = await sw.request('app.js?v=3', { destination: 'script' });
  assert.equal(await result.response.text(), 'window.version = 3;', 'script edits must refresh without a SW version bump');
  sw.setNetwork(async () => html('not javascript'));
  result = await sw.request('app.js', { destination: 'script' });
  assert.equal(await result.response.text(), 'window.version = 3;', 'wrong MIME must not overwrite scripts');

  sw.setNetwork(async () => asset('new font', 'font/ttf'));
  await sw.request('fuentes/Doughie.ttf', { destination: 'font' });
  sw.setNetwork(async () => { throw new Error('offline'); });
  result = await sw.request('fuentes/Doughie.ttf', { destination: 'font' });
  assert.equal(await result.response.text(), 'new font', 'refreshed assets must supersede their precached copy');

  sw.setNetwork(async () => asset('pixels', 'image/png'));
  for (let index = 0; index < 85; index++) {
    await sw.request(`images/${index}.png`, { destination: 'image' });
  }
  const runtime = [...sw.stores.entries()].find(([name]) => name.includes('assets-'))[1];
  assert.equal(runtime.size, 80, 'runtime storage must stay bounded');
  for (const [url, options] of [
    ['https://example.test/Another-menu/app.js', { destination: 'script' }],
    ['https://cdn.example.test/app.js', { destination: 'script' }],
    ['unknown-route', { mode: 'navigate' }],
    ['menu-config.json', { method: 'POST' }],
    ['images/1.png', { destination: 'image', headers: { Range: 'bytes=0-10' } }]
  ]) {
    assert.equal((await sw.request(url, options)).handled, false, `must leave ${url} to the browser`);
  }
  console.log('Service worker checks passed: update continuity, contact freshness, offline MIME safety, scope isolation, bounded asset cache.');
})().catch(error => { console.error(error); process.exitCode = 1; });
