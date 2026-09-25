#!/usr/bin/env node
'use strict';

// Ejecutar con Node y Playwright instalados: node scripts/check-menu.cjs
// CHROME_PATH, PLAYWRIGHT_PATH y MENU_TEST_BASE_URL permiten usar otros entornos.
// WhatsApp y todos los servicios externos quedan interceptados: no se envían pedidos.
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const http = require('node:http');
const { chromium } = require(process.env.PLAYWRIGHT_PATH || require.resolve('playwright', {
  paths: [process.cwd(), '/Users/rnnld/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules'],
}));

const root = path.resolve(__dirname, '..');
const originalConfig = JSON.parse(fs.readFileSync(path.join(root, 'menu-config.json'), 'utf8'));
const defaultTime = '2026-09-18T01:00:00.000Z'; // Jueves, 20:00 en Ecuador.
const tests = [];
const test = (name, run) => tests.push({ name, run });
let browser;
let server;
let baseURL;

async function fixture(options = {}) {
  const state = { config: { ...originalConfig, ordersApiUrl: '' }, failConfig: false, pageErrors: [], alerts: [] };
  const context = await browser.newContext({
    viewport: { width: 390, height: 844 }, locale: 'es-EC', timezoneId: 'America/Guayaquil',
    serviceWorkers: 'block',
  });
  await context.addInitScript(({ time, draft }) => {
    let currentTime = new globalThis.Date(time).getTime();
    const RealDate = globalThis.Date;
    globalThis.Date = class extends RealDate {
      constructor(...args) { super(...(args.length ? args : [currentTime])); }
      static now() { return currentTime; }
    };
    window.__setTestTime = value => { currentTime = new RealDate(value).getTime(); };
    window.__whatsappAttempts = [];
    window.__popupBlocked = false;
    window.open = url => {
      if (window.__popupBlocked) return null;
      if (url !== 'about:blank') window.__whatsappAttempts.push({ url });
      return { closed: false, opener: null, close() { this.closed = true; },
        location: { replace(destination) { window.__whatsappAttempts.push({ url: destination }); } } };
    };
    localStorage.setItem('clowder_seen_guide', '1');
    if (draft && !sessionStorage.getItem('test_seeded')) {
      localStorage.setItem('clowder_order_draft', JSON.stringify(draft));
      sessionStorage.setItem('test_seeded', '1');
    }
  }, { time: options.time || defaultTime, draft: options.draft || null });
  await context.route('**/*', route => {
    const url = new URL(route.request().url());
    if (url.origin !== new URL(baseURL).origin) return route.abort();
    if (url.pathname.endsWith('/menu-config.json')) {
      if (state.failConfig) return route.fulfill({ status: 503, body: 'Test: unavailable' });
      return route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(state.config) });
    }
    return route.continue();
  });
  const page = await context.newPage();
  page.on('pageerror', error => state.pageErrors.push(error.message));
  page.on('dialog', async dialog => {
    if (dialog.type() === 'confirm') await dialog.accept();
    else { state.alerts.push(dialog.message()); await dialog.dismiss(); }
  });
  const ready = async () => {
    await page.waitForFunction(() => window.MenuContact?.value && typeof sendOrder === 'function');
    // Captura también la alternativa de misma pestaña cuando un popup es bloqueado.
    await page.evaluate(() => {
      window.MenuContact.navigate = (target, url) => window.__whatsappAttempts.push({ url, blocked: !target });
    });
  };
  await page.goto(baseURL, { waitUntil: 'domcontentloaded' });
  await ready();
  return {
    page, context, state, ready,
    async close() { await context.close(); assert.deepEqual(state.pageErrors, [], 'Errores JavaScript'); },
  };
}

async function useFixture(run, options) {
  const f = await fixture(options);
  try { await run(f); } finally { await f.close(); }
}

async function prepare(page, options = {}) {
  await page.evaluate(options => {
    cart = {};
    for (const [id, qty] of Object.entries(options.items || { 'catpuccino': 1 })) changeQty(id, qty);
    document.getElementById('customerName').value = options.name || 'Cliente de prueba';
    setMode(options.mode || 'mesa');
    if (options.mode === 'delivery') {
      document.getElementById('deliveryManzana').value = '12';
      document.getElementById('deliveryVilla').value = '8';
    }
    paymentBank = options.bank || 'Pichincha';
    setPay(options.pay || 'transferencia');
    updateBars();
    if (options.pay === 'efectivo') setExactCash();
    openCart();
  }, options);
}

async function orderState(page) {
  return page.evaluate(() => ({
    cart, mode, payMethod, currentOrderCode,
    name: document.getElementById('customerName').value,
    draft: JSON.parse(localStorage.getItem('clowder_order_draft') || 'null'),
    destinations: window.__whatsappAttempts,
  }));
}

test('Todos los menús se muestran en móvil sin errores ni desbordamiento horizontal', () => useFixture(async ({ page }) => {
  const categories = await page.evaluate(() => [...CATS]);
  for (const category of categories) {
    await page.evaluate(category => selectCat(category), category);
    assert.ok(await page.locator('#menu .item').count(), `Categoría vacía: ${category}`);
    assert.ok(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1), `Desborde: ${category}`);
  }
}));

test('Stock actual: helados disponibles, queso agotado, pollo limitado y promociones ocultas', () => useFixture(async ({ page }) => {
  const result = await page.evaluate(() => {
    const ids = ['affocato', 'milkishaki-nutella', 'milkishaki-fresa', 'milkishaki-salted-caramel'];
    changeQty('empanada-queso', 1);
    changeQty('empanada-pollo', 10);
    return {
      iceCream: ids.map(id => isItemOrderable(MENU.find(item => item.id === id))),
      cheese: !!cart['empanada-queso'], chicken: cart['empanada-pollo'].qty,
      restored: sanitizeCart({ 'empanada-pollo': { qty: 8 }, 'empanada-queso': { qty: 1 }, 'banana-bread-latte': { qty: 1 }, 'combo-cafe-empanada-queso': { qty: 1 } }),
      hidden: ['Bebida del Mes', 'Combos'].every(cat => !CATS.includes(cat)),
    };
  });
  assert.deepEqual(result.iceCream, [true, true, true, true]);
  assert.equal(result.cheese, false);
  assert.equal(result.chicken, 4);
  assert.equal(result.hidden, true);
  assert.deepEqual(Object.keys(result.restored), ['empanada-pollo']);
  assert.equal(result.restored['empanada-pollo'].qty, 4);
  await page.evaluate(() => selectCat('Snack Sal'));
  assert.match(await page.locator('#menu').textContent(), /Últimas 4 empanadas de pollo/);
}));

test('Pago exacto funciona con 3 × $4.90 y rechaza efectivo insuficiente o fracciones de centavo', () => useFixture(async ({ page }) => {
  // Producto sintético para verificar centavos sin depender del stock del catálogo.
  await page.evaluate(() => MENU.push({ id:'test-centavos', cat:'Bebidas Frías', name:'Prueba centavos', price:4.9 }));
  await prepare(page, { items: { 'test-centavos': 3 }, pay: 'efectivo' });
  assert.equal(await page.locator('#drawerTotal').textContent(), '$14.70');
  assert.equal(await page.locator('#cashAmount').inputValue(), '14.70');
  assert.equal(await page.locator('#sendBtn').isDisabled(), false);
  await page.evaluate(() => sendOrder());
  const state = await orderState(page);
  assert.match(decodeURIComponent(state.destinations.at(-1).url), /14\.70/);
  for (const value of ['14.69', '20.001']) {
    await page.locator('#cashAmount').fill(value);
    await page.evaluate(() => updateBars());
    assert.equal(await page.locator('#sendBtn').isDisabled(), true, `Efectivo inválido aceptado: ${value}`);
  }
}));

test('Carrito y mensaje distinguen los tamaños de papas', () => useFixture(async ({ page }) => {
  await prepare(page, { items: { 'tocipapa': 1, 'tocipapa-grande': 1, 'wachipapa': 1, 'wachipapa-grande': 1 } });
  const names = await page.locator('#cartList .n').allTextContents();
  assert.equal(names.length, 4);
  assert.equal(new Set(names).size, 4, 'Los tamaños tienen nombres idénticos');
  assert.ok(names.some(name => /Tocipapa.*Grande/i.test(name)));
  assert.ok(names.some(name => /Wachipapa.*Grande/i.test(name)));
  await page.evaluate(() => sendOrder());
  const message = new URL((await orderState(page)).destinations.at(-1).url).searchParams.get('text');
  assert.match(message, /Tocipapa.*Grande/i);
  assert.match(message, /Wachipapa.*Grande/i);
}));

test('Strawberry abre en portada y vence al terminar el domingo 27 en Ecuador', () => useFixture(async ({ page }) => {
  assert.equal(await page.evaluate(() => activeCat), 'Bebidas Calientes');
  for (const [time, available] of [
    ['2026-09-19T04:59:59Z', false],
    ['2026-09-19T05:00:00Z', true],
    ['2026-09-28T04:59:59Z', true],
    ['2026-09-28T05:00:00Z', false],
  ]) {
    const state = await page.evaluate(time => {
      window.__setTestTime(time);
      renderMenu();
      const item = MENU.find(i => i.id === 'strawberry-catpuccino');
      return { orderable: isItemOrderable(item), price: item.price,
        card: !!document.getElementById('qty-strawberry-catpuccino'),
        banner: !!document.querySelector('.cat-banner-slide img[src="banners/bc-strawberry-catpuccino.jpeg"]'),
        restored: !!sanitizeCart({ 'strawberry-catpuccino': { qty: 1 } })['strawberry-catpuccino'] };
    }, time);
    assert.deepEqual(state, { orderable: available, price: 3, card: available, banner: available, restored: available });
  }
  await page.evaluate(() => {
    window.__setTestTime('2026-09-28T04:59:59Z');
    renderMenu();
    changeQty('strawberry-catpuccino', 1);
    refreshAvailability();
    window.__setTestTime('2026-09-28T05:00:00Z');
    refreshAvailability();
  });
  assert.equal(await page.evaluate(() => !!cart['strawberry-catpuccino']), false);
  assert.equal(await page.locator('.cat-banner-slide img[src="banners/bc-strawberry-catpuccino.jpeg"]').count(), 0);
}));

test('Los horarios incluyen todos los tamaños y sus límites de lunes y domingo', () => useFixture(async ({ page }) => {
  for (const [time, expected] of [
    ['2026-09-21T23:59:00Z', false], ['2026-09-22T00:00:00Z', true],
    ['2026-09-22T04:00:00Z', true], ['2026-09-22T04:01:00Z', false],
    ['2026-09-20T23:29:00Z', false], ['2026-09-20T23:30:00Z', true],
    ['2026-09-21T03:30:00Z', true], ['2026-09-21T03:31:00Z', false],
  ]) {
    const result = await page.evaluate(time => {
      window.__setTestTime(time);
      return ['tocipapa', 'tocipapa-grande', 'wachipapa', 'wachipapa-grande'].map(id => isItemOrderable(MENU.find(item => item.id === id)));
    }, time);
    assert.deepEqual(result, [expected, expected, expected, expected], time);
  }
}));

test('Un botón renderizado antes de abrir cocina permite pedir al llegar la hora', () => useFixture(async ({ page }) => {
  await page.evaluate(() => { window.__setTestTime('2026-09-21T23:59:00Z'); selectCat('Snack Sal'); });
  const plus = page.locator('#qty-tocipapa').locator('..').locator('button').last();
  await page.evaluate(() => window.__setTestTime('2026-09-22T00:00:00Z'));
  await plus.click();
  assert.equal((await orderState(page)).cart.tocipapa?.qty, 1);
}));

test('Abrir WhatsApp y recargar conserva todos los datos y el mismo código', () => useFixture(async ({ page, ready }) => {
  await prepare(page, { mode: 'delivery' });
  await page.evaluate(() => { setMilk('catpuccino', 'almendra'); setSyrup('catpuccino', 'avellana'); saveNote('catpuccino', 'Poca espuma'); });
  await page.evaluate(() => sendOrder());
  const before = await orderState(page);
  assert.ok(before.currentOrderCode);
  assert.equal(before.cart.catpuccino.qty, 1);
  assert.equal(before.cart.catpuccino.milk, 'almendra');
  assert.equal(before.cart.catpuccino.syrup, 'avellana');
  assert.equal(before.cart.catpuccino.note, 'Poca espuma');
  assert.equal(before.draft.orderCode, before.currentOrderCode);
  await page.reload({ waitUntil: 'domcontentloaded' });
  await ready();
  const after = await orderState(page);
  assert.deepEqual(after.cart, before.cart);
  assert.equal(after.mode, 'delivery');
  assert.equal(after.name, before.name);
  assert.equal(await page.locator('#deliveryManzana').inputValue(), '12');
  assert.equal(await page.locator('#deliveryVilla').inputValue(), '8');
  assert.equal(after.currentOrderCode, before.currentOrderCode);
  await page.evaluate(() => sendOrder());
  assert.equal((await orderState(page)).currentOrderCode, before.currentOrderCode);
}));

test('El bloqueo de popup conserva el pedido y prepara el destino alternativo', () => useFixture(async ({ page }) => {
  await prepare(page);
  await page.evaluate(() => { window.__popupBlocked = true; return sendOrder(); });
  const state = await orderState(page);
  assert.equal(state.destinations.at(-1).blocked, true);
  assert.equal(state.cart.catpuccino.qty, 1);
  assert.equal(state.draft.cart.catpuccino.qty, 1);
}));

test('Pedido registrado permite recuperar WhatsApp cuando la navegación falla o se bloquea', () => useFixture(async ({ page, state }) => {
  state.config.ordersApiUrl = 'https://orders.test';
  const orders = [];
  await page.route('https://orders.test/api/orders', async route => {
    orders.push(route.request().postDataJSON());
    await route.fulfill({ status: 200, contentType: 'application/json', body: '{"ok":true}' });
  });
  await prepare(page);
  await page.evaluate(() => { MenuContact.navigate = () => { throw new Error('Navigation blocked'); }; });
  await page.evaluate(() => sendOrder());
  assert.equal(orders.length, 1);
  assert.equal(await page.locator('#contactError').isVisible(), false);
  assert.equal(await page.locator('#whatsappRecovery').isVisible(), true);
  const destination = await page.locator('#whatsappRecoveryLink').getAttribute('href');
  assert.equal(new URL(destination).hostname, 'wa.me');
  assert.ok(new URL(destination).searchParams.get('text').includes(orders[0].code));
  await page.route('https://wa.me/**', route => route.fulfill({ status: 200, body: 'WhatsApp interceptado' }));
  await page.locator('#whatsappRecoveryLink').click();
  await page.waitForURL('https://wa.me/**');
  assert.equal(orders.length, 1, 'El enlace de recuperación no debe registrar otro pedido');
}));

test('Nuevo pedido limpia carrito y código; el siguiente recibe otro código', () => useFixture(async ({ page }) => {
  await prepare(page);
  await page.evaluate(() => sendOrder());
  const first = (await orderState(page)).currentOrderCode;
  await page.evaluate(() => startNewOrder());
  const cleared = await orderState(page);
  assert.deepEqual(cleared.cart, {});
  assert.equal(cleared.currentOrderCode, '');
  assert.ok(!cleared.draft || Object.keys(cleared.draft.cart).length === 0);
  await prepare(page);
  await page.evaluate(() => sendOrder());
  assert.notEqual((await orderState(page)).currentOrderCode, first);
}));

test('Dos dispositivos nuevos en el mismo minuto reciben códigos diferentes', async () => {
  const first = await fixture();
  const second = await fixture();
  try {
    const codes = [];
    for (const { page } of [first, second]) {
      await prepare(page);
      await page.evaluate(() => sendOrder());
      codes.push((await orderState(page)).currentOrderCode);
    }
    assert.ok(codes.every(Boolean));
    assert.notEqual(codes[0], codes[1]);
  } finally { await first.close(); await second.close(); }
});

test('Cambiar la configuración actualiza enlaces y pedidos sin perder el borrador', () => useFixture(async ({ page, state }) => {
  await prepare(page);
  const before = (await orderState(page)).cart;
  state.config.whatsappNumber = '593990001122'; // Número sintético: las salidas están interceptadas.
  await page.evaluate(() => MenuContact.refresh());
  assert.equal(await page.evaluate(() => MenuContact.value.whatsappNumber), state.config.whatsappNumber);
  const links = await page.locator('[data-whatsapp]').evaluateAll(nodes => nodes.map(node => node.href));
  assert.ok(links.length >= 3, 'Faltan destinos estáticos centralizados');
  assert.ok(links.every(url => new URL(url).pathname === '/593990001122'));
  assert.deepEqual((await orderState(page)).cart, before);
  await page.evaluate(() => sendOrder());
  assert.equal(new URL((await orderState(page)).destinations.at(-1).url).pathname, '/593990001122');
  assert.deepEqual((await orderState(page)).cart, before);
}));

test('Si falla verificar el contacto, no se abre un número guardado ni se pierde el pedido', () => useFixture(async ({ page, state }) => {
  await prepare(page);
  state.failConfig = true;
  await page.evaluate(() => sendOrder());
  const result = await orderState(page);
  assert.equal(result.destinations.length, 0);
  assert.equal(result.cart.catpuccino.qty, 1);
  assert.ok(state.alerts.length > 0 || await page.locator('[role="alert"]').count(), 'Debe explicar el problema de conexión');
}));

test('Notas restauradas se muestran como texto y cantidades inválidas se descartan', () => useFixture(async ({ page }) => {
  const result = await orderState(page);
  assert.equal(result.cart.catpuccino.qty, 10);
  assert.ok(!result.cart['cozy-claws']);
  assert.ok(!result.cart['producto-inventado']);
  assert.equal(await page.evaluate(() => window.__xss), undefined);
  assert.equal(await page.locator('#cartList img[src="x"]').count(), 0);
  assert.match(await page.locator('#cartList').textContent(), /<img/);
}, { draft: { cart: { catpuccino: { qty: 99, note: '<img src=x onerror="window.__xss=true">' }, 'cozy-claws': { qty: -2 }, 'producto-inventado': { qty: 2 } }, mode: 'mesa', payMethod: 'transferencia', customerName: 'Prueba' } }));

test('Delivery exige manzana y villa enteras y permite direcciones válidas', () => useFixture(async ({ page }) => {
  await prepare(page, { mode: 'delivery' });
  assert.equal(await page.locator('#sendBtn').isDisabled(), false);
  for (const value of ['', '-1', '1.5']) {
    await page.locator('#deliveryManzana').fill(value);
    await page.evaluate(() => updateBars());
    assert.equal(await page.locator('#sendBtn').isDisabled(), true, `Dirección inválida: ${value}`);
  }
  await page.locator('#deliveryManzana').fill('12');
  await page.evaluate(() => updateBars());
  assert.equal(await page.locator('#sendBtn').isDisabled(), false);
}));

async function main() {
  if (process.env.MENU_TEST_BASE_URL) baseURL = process.env.MENU_TEST_BASE_URL;
  else {
    const mime = { '.html': 'text/html', '.js': 'text/javascript', '.json': 'application/json', '.css': 'text/css', '.webmanifest': 'application/manifest+json', '.png': 'image/png', '.jpg': 'image/jpeg', '.svg': 'image/svg+xml', '.ttf': 'font/ttf' };
    server = http.createServer((req, res) => {
      const requested = decodeURIComponent(new URL(req.url, 'http://localhost').pathname);
      const file = path.resolve(root, '.' + (requested.endsWith('/') ? requested + 'index.html' : requested));
      if (!file.startsWith(root + path.sep)) { res.writeHead(403).end(); return; }
      fs.readFile(file, (error, body) => {
        if (error) { res.writeHead(404).end(); return; }
        res.writeHead(200, { 'Content-Type': mime[path.extname(file)] || 'application/octet-stream', 'Cache-Control': 'no-store' }).end(body);
      });
    });
    await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
    baseURL = `http://127.0.0.1:${server.address().port}/`;
  }
  browser = await chromium.launch({ headless: true, executablePath: process.env.CHROME_PATH || '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome' });
  let failed = 0;
  for (const { name, run } of tests) {
    try { await run(); console.log(`PASS ${name}`); }
    catch (error) { failed++; console.error(`FAIL ${name}\n${error.stack}`); }
  }
  console.log(`\n${tests.length - failed}/${tests.length} pruebas correctas. Cero pedidos enviados.`);
  process.exitCode = failed ? 1 : 0;
}

main().catch(error => { console.error(error); process.exitCode = 1; }).finally(async () => {
  if (browser) await browser.close();
  if (server) await new Promise(resolve => server.close(resolve));
});
