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
  const state = { config: { ...originalConfig, ordersApiUrl: baseURL.replace(/\/$/, '') }, failConfig: false, pageErrors: [], alerts: [] };
  if(options.pizzaStock !== undefined) state.config.ordersApiUrl = baseURL.replace(/\/$/, '');
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
    window.__openAttempts = [];
    window.__popupBlocked = false;
    window.open = url => {
      window.__openAttempts.push(url);
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
    if(options.pizzaStock !== undefined && url.pathname === '/api/availability') return route.fulfill({status:200,contentType:'application/json',body:JSON.stringify({'clowder-pizza':options.pizzaStock})});
    if(url.pathname === '/api/orders') return route.fulfill({status:options.rejectPizza ? 400 : 200,contentType:'application/json',body:JSON.stringify(options.rejectPizza ? {error:'No quedan suficientes pizzas.'} : {ok:true})});
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
      window.__realContactNavigate = window.MenuContact.navigate;
      window.MenuContact.navigate = (target, url) => window.__whatsappAttempts.push({ url, blocked: !target });
    });
  };
  await page.goto(baseURL, { waitUntil: 'domcontentloaded' });
  await ready();
  await page.evaluate(() => document.getElementById('introSkip')?.click());
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
    if (await page.evaluate(cat => [...document.querySelectorAll('.category-tile')].some(tile => tile.disabled && tile.textContent.includes(cat)), category)) {
      await page.evaluate(category => selectCat(category), category);
      assert.equal(await page.locator('.category-home-view').count(), 1);
      continue;
    }
    await page.evaluate(category => selectCat(category), category);
    assert.ok(await page.locator('#menu .item').count(), `Categoría vacía: ${category}`);
    assert.ok(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1), `Desborde: ${category}`);
  }
}));

test('Stock actual: helados, pollo y queso disponibles; pizza, wachipapas y tocipapas agotados', () => useFixture(async ({ page }) => {
  const result = await page.evaluate(() => {
    const ids = ['affocato', 'milkishaki-nutella', 'milkishaki-fresa', 'milkishaki-salted-caramel'];
    changeQty('empanada-queso', 1);
    changeQty('empanada-pollo', 10);
    return {
      iceCream: ids.map(id => isItemOrderable(MENU.find(item => item.id === id))),
      cheese: !!cart['empanada-queso'], chicken: !!cart['empanada-pollo'],
      potatoes: ['wachipapa', 'tocipapa', 'papas-fritas'].map(id => isItemOrderable(MENU.find(item => item.id === id))),
      restored: sanitizeCart({ 'empanada-pollo': { qty: 8 }, 'tocipapa': { qty: 1 }, 'tocipapa-grande': { qty: 1 }, 'empanada-queso': { qty: 1 }, 'banana-bread-latte': { qty: 1 }, 'combo-cafe-empanada-queso': { qty: 1 } }),
      hidden: !CATS.includes('Combos') && CATS.includes('Bebida del Mes'),
    };
  });
  assert.deepEqual(result.iceCream, [true, true, true, true]);
  assert.equal(result.cheese, true);
  assert.equal(result.chicken, true);
  assert.deepEqual(result.potatoes, [false, false, true]);
  assert.equal(result.hidden, true);
  assert.deepEqual(Object.keys(result.restored), ['empanada-pollo', 'empanada-queso']);
  assert.equal(result.restored['empanada-pollo'].qty, 8);
  await page.evaluate(() => selectCat('Snack Sal'));
  assert.doesNotMatch(await page.locator('#menu').textContent(), /Últimas 4 empanadas de pollo/);
  assert.equal(await page.locator('#qty-empanada-capresse').count(), 1);
  assert.equal(await page.evaluate(() => MENU.find(item => item.id === 'empanada-capresse').price), 1.8);
  assert.equal(await page.evaluate(() => MENU.find(item => item.id === 'empanada-pizza').price), 2.4);
  assert.equal(await page.evaluate(() => isItemOrderable(MENU.find(item => item.id === 'empanada-pizza'))), false);
  assert.equal(await page.evaluate(() => MENU.find(item => item.id === 'empanada-pizza').img === MENU.find(item => item.id === 'empanada-pollo').img), true);
  await page.evaluate(() => { groupView.empanada = 'empanada-pollo'; renderMenu(); });
  assert.equal(await page.locator('#qty-empanada-pollo').count(), 1);
  assert.equal(await page.locator('#menu .cat-banner-slide img[src="banners/empanadas-octubre.jpeg"]').count(), 1);
}));

test('Cambiar el sabor de empanada conserva el orden de las tarjetas', () => useFixture(async ({ page }) => {
  await page.evaluate(() => selectCat('Snack Sal'));
  const cardOrder = () => page.locator('#menu .item').evaluateAll(cards => cards.map(card => card.id));
  const initialOrder = await cardOrder();
  for(const flavor of ['pizza', 'pollo', 'queso', 'capresse']) {
    await page.locator('#menu-group-empanada .variant-select').selectOption(`empanada-${flavor}`);
    assert.deepEqual(await cardOrder(), initialOrder, `El sabor ${flavor} movió la tarjeta`);
    assert.ok(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1));
  }
}));

test('Chocolate disponible y opciones de avellana retiradas', () => useFixture(async ({ page }) => {
  const result = await page.evaluate(() => {
    const ids = ['cozy-claws', 'moccatto', 'nimbus', 'milkishaki-nutella'];
    const shake = MENU.find(item => item.id === 'milkishaki-nutella');
    setSyrup('catpuccino', 'avellana');
    return {
      available: ids.map(id => isItemOrderable(MENU.find(item => item.id === id))),
      shake: [shake.name, shake.desc, shake.flavor],
      options: MENU.flatMap(item => item.syrupOption || []),
      restored: sanitizeCart({catpuccino: {qty: 1, syrup: 'avellana'}}),
      selected: cart.catpuccino?.syrup || '',
    };
  });
  assert.deepEqual(result.available, [true, true, true, true]);
  assert.match(result.shake[0], /Brownie Bites/);
  assert.doesNotMatch(result.shake.join(' '), /avellana|hazelnut|nutella/i);
  assert.ok(!result.options.some(option => /avellana|hazelnut/i.test(option)));
  assert.equal(result.restored.catpuccino.syrup, '');
  assert.equal(result.selected, '');
  for (const category of ['Bebidas Calientes', 'Bebidas Frías']) {
    await page.evaluate(category => selectCat(category), category);
    assert.doesNotMatch(await page.locator('#menu').textContent(), /avellana|hazelnut/i);
  }
}));

test('Pago exacto funciona con 3 × $4.90 y rechaza efectivo insuficiente o fracciones de centavo', () => useFixture(async ({ page }) => {
  // Producto sintético para verificar centavos sin depender del stock del catálogo.
  await page.evaluate(() => MENU.push({ id:'test-centavos', cat:'Bebidas Frías', name:'Prueba centavos', price:4.9 }));
  await prepare(page, { items: { 'test-centavos': 3 }, pay: 'efectivo' });
  assert.equal(await page.locator('#drawerTotal').textContent(), '$14.70');
  assert.equal(await page.locator('#cashAmount').inputValue(), '14.70');
  assert.equal(await page.evaluate(() => !checkoutReady), false);
  for (const value of ['14.69', '20.001']) {
    await page.locator('#cashAmount').fill(value);
    await page.evaluate(() => updateBars());
    assert.equal(await page.evaluate(() => !checkoutReady), true, `Efectivo inválido aceptado: ${value}`);
  }
  await page.evaluate(() => setExactCash());
  await page.evaluate(() => sendOrder());
  const state = await orderState(page);
  assert.match(decodeURIComponent(state.destinations.at(-1).url), /14\.70/);
}));

test('Video del banner: reproduce en silencio, pausa fuera de pantalla y respeta una pausa manual', () => useFixture(async ({ page }) => {
  await page.setViewportSize({ width:1280, height:900 });
  await page.evaluate(() => {
    // Dos banners conocidos aíslan la reproducción del catálogo de temporada.
    const clip = CAT_BANNERS['Snack Sal'].find(b => b.video);
    CAT_BANNERS['Snack Sal'] = [{ ...clip, hidden:false }, { img:'banners/ss-banner-01.jpg', alt:'Empanada' }];
    selectCat('Snack Sal');
  });
  const video = page.locator('.cat-banner video');
  await video.scrollIntoViewIfNeeded();
  await page.waitForFunction(() => {
    const video = document.querySelector('.cat-banner video');
    return video && !video.paused && video.currentTime > 0;
  });
  assert.deepEqual(await video.evaluate(video => [video.muted, video.loop, video.playsInline, video.controls]), [true, true, true, true]);
  await page.locator('.cat-banner-arrow[data-step="1"]').click();
  await page.waitForFunction(() => document.querySelector('.cat-banner video').paused);
  await page.locator('.cat-banner-arrow[data-step="-1"]').click();
  await page.waitForFunction(() => !document.querySelector('.cat-banner video').paused);
  await video.evaluate(video => video.pause());
  await page.locator('.cat-banner-arrow[data-step="1"]').click();
  await page.waitForFunction(() => document.querySelector('.cat-banner-dot[aria-current="true"]').getAttribute('aria-label') === 'Ver promoción 2');
  await page.locator('.cat-banner-arrow[data-step="-1"]').click();
  await page.waitForFunction(() => document.querySelector('.cat-banner-dot[aria-current="true"]').getAttribute('aria-label') === 'Ver promoción 1');
  assert.equal(await video.evaluate(video => video.paused), true);
}));

test('Video con movimiento reducido no arranca automáticamente', () => useFixture(async ({ page }) => {
  await page.emulateMedia({ reducedMotion:'reduce' });
  await page.evaluate(() => {
    // Dos banners conocidos aíslan la reproducción del catálogo de temporada.
    const clip = CAT_BANNERS['Snack Sal'].find(b => b.video);
    CAT_BANNERS['Snack Sal'] = [{ ...clip, hidden:false }, { img:'banners/ss-banner-01.jpg', alt:'Empanada' }];
    selectCat('Snack Sal');
  });
  const video = page.locator('.cat-banner video');
  await video.scrollIntoViewIfNeeded();
  await page.waitForFunction(() => document.querySelector('.cat-banner video').readyState >= 2);
  assert.equal(await video.evaluate(video => video.paused), true);
  assert.equal(await video.evaluate(video => video.controls), true);
}));

test('Si falla el video se conserva su foto y el resto del carrusel', () => useFixture(async ({ page }) => {
  await page.route('**/banners/snack-papas.mp4', route => route.abort());
  await page.evaluate(() => {
    // Dos banners conocidos aíslan la reproducción del catálogo de temporada.
    const clip = CAT_BANNERS['Snack Sal'].find(b => b.video);
    CAT_BANNERS['Snack Sal'] = [{ ...clip, hidden:false }, { img:'banners/ss-banner-01.jpg', alt:'Empanada' }];
    selectCat('Snack Sal');
  });
  await page.locator('.cat-banner img[src$="/banners/snack-papas-poster.jpg"]').waitFor();
  assert.equal(await page.locator('.cat-banner video').count(), 0);
  assert.equal(await page.locator('.cat-banner-slide').count(), 2);
}));

test('Papas con presentación única: sin selector, sin tamaños en el pedido y sin variantes antiguas', () => useFixture(async ({ page }) => {
  // Aislar la presentación del stock; los horarios se comprueban por separado.
  await page.evaluate(() => {
    MENU.filter(item => ['wachipapa', 'tocipapa'].includes(item.id)).forEach(item => item.soldOut = false);
    HIDDEN_ITEM_IDS.splice(HIDDEN_ITEM_IDS.indexOf('tocipapa'), 1);
  });
  await page.evaluate(() => selectCat('Snack Sal'));
  for (const [id, name, price] of [['tocipapa', 'Tocipapa', '$2.50'], ['wachipapa', 'Wachipapa', '$3.00']]) {
    const card = page.locator('.item').filter({ has: page.locator('#qty-' + id) });
    assert.equal(await card.locator('.variant-select').count(), 0);
    assert.equal(await card.locator('.item-name-badge').textContent(), name);
    assert.equal(await card.locator('.item-price').textContent(), price);
  }
  const restored = await page.evaluate(() => sanitizeCart({
    'tocipapa': { qty: 1 }, 'wachipapa': { qty: 1 },
    'tocipapa-grande': { qty: 1 }, 'wachipapa-grande': { qty: 1 },
  }));
  assert.deepEqual(Object.keys(restored), ['tocipapa', 'wachipapa']);
  await prepare(page, { items: { 'tocipapa': 1, 'wachipapa': 1 } });
  const names = await page.locator('#cartList .n').allTextContents();
  assert.deepEqual(names, ['1x Tocipapa', '1x Wachipapa']);
  assert.equal(await page.evaluate(() => cartTotal()), 5.50);
  await page.evaluate(() => sendOrder());
  const message = new URL((await orderState(page)).destinations.at(-1).url).searchParams.get('text');
  assert.match(message, /Tocipapa/);
  assert.match(message, /Wachipapa/);
  assert.doesNotMatch(message, /Regular|Grande/);
}));

test('El menú abre en categorías y Strawberry vence al terminar el domingo 27 en Ecuador', () => useFixture(async ({ page }) => {
  assert.equal(await page.evaluate(() => categoryHome), true);
  await page.evaluate(() => selectCat('Bebidas Calientes'));
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

test('Tocipapa y Wachipapa conservan los límites de cocina de lunes y domingo', () => useFixture(async ({ page }) => {
  await page.evaluate(() => {
    MENU.filter(item => ['wachipapa', 'tocipapa'].includes(item.id)).forEach(item => item.soldOut = false);
    HIDDEN_ITEM_IDS.splice(HIDDEN_ITEM_IDS.indexOf('tocipapa'), 1);
  });
  for (const [time, expected] of [
    ['2026-09-21T23:59:00Z', false], ['2026-09-22T00:00:00Z', true],
    ['2026-09-22T04:00:00Z', true], ['2026-09-22T04:01:00Z', false],
    ['2026-09-20T23:29:00Z', false], ['2026-09-20T23:30:00Z', true],
    ['2026-09-21T03:30:00Z', true], ['2026-09-21T03:31:00Z', false],
  ]) {
    const result = await page.evaluate(time => {
      window.__setTestTime(time);
      return ['tocipapa', 'wachipapa'].map(id => isItemOrderable(MENU.find(item => item.id === id)));
    }, time);
    assert.deepEqual(result, [expected, expected], time);
  }
}));

test('Un botón renderizado antes de abrir cocina permite pedir al llegar la hora', () => useFixture(async ({ page }) => {
  await page.evaluate(() => { window.__setTestTime('2026-09-21T23:59:00Z'); selectCat('Snack Sal'); });
  const plus = page.locator('#qty-papas-fritas').locator('..').locator('button').last();
  await page.evaluate(() => window.__setTestTime('2026-09-22T00:00:00Z'));
  await plus.click();
  assert.equal((await orderState(page)).cart['papas-fritas']?.qty, 1);
}));

test('Abrir WhatsApp limpia el carrito; recargar conserva solo el historial y permite repetir con código nuevo', () => useFixture(async ({ page, ready }) => {
  await prepare(page, { mode: 'delivery' });
  await page.evaluate(() => { cart = {}; setMilk('catpuccino', 'almendra'); setSyrup('catpuccino', 'vainilla-francesa'); changeQty('catpuccino', 1); saveNote('catpuccino', 'Poca espuma'); });
  await page.evaluate(() => sendOrder());
  const before = await orderState(page);
  const history = await page.evaluate(() => orderHistory);
  assert.equal(history.length, 1);
  assert.deepEqual(before.cart, {});
  assert.equal(before.currentOrderCode, '');
  assert.equal(before.mode, '');
  assert.equal(before.name, '');
  const previous = Object.values(history[0].cart)[0];
  assert.equal(previous.milk, 'almendra'); assert.equal(previous.syrup, 'vainilla-francesa'); assert.equal(previous.note, 'Poca espuma');
  assert.ok(!before.draft || !Object.keys(before.draft.cart).length);
  await page.reload({waitUntil:'domcontentloaded'}); await ready();
  assert.deepEqual((await orderState(page)).cart, {});
  assert.equal(await page.evaluate(() => orderHistory[0].code), history[0].code);
  await page.evaluate(() => repeatPreviousOrder(orderHistory[0]));
  assert.equal((await orderState(page)).currentOrderCode, '');
  assert.equal(Object.values((await orderState(page)).cart)[0].milk, 'almendra');
  await page.evaluate(() => {document.getElementById('customerName').value='ANDREA';setMode('mesa');setPay('transferencia');});
  await page.evaluate(() => sendOrder());
  assert.notEqual(await page.evaluate(() => orderHistory[0].code), history[0].code);
  await page.evaluate(() => { document.getElementById('introSkip')?.click();document.getElementById('orderHistory').open=true;document.querySelector('#orderHistoryList details').open=true;document.getElementById('orderHistory').scrollIntoView(); });
  await page.waitForFunction(() => !document.getElementById('introSplash'));
  assert.ok(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1));
  await page.locator('#orderHistory').screenshot({path:'/tmp/clowder-historial-mobile.png'});
  await page.setViewportSize({width:1440,height:1000});
  assert.ok(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1));
  await page.locator('#orderHistory').screenshot({path:'/tmp/clowder-historial-desktop.png'});
}));

test('El envío lento mantiene el menú visible y abre WhatsApp en la misma pestaña', () => useFixture(async ({ page, context, state }) => {
  state.config.ordersApiUrl = 'https://orders.test';
  let release;
  const gate=new Promise(resolve=>{release=resolve;});
  let received;
  const requestSeen=new Promise(resolve=>{received=resolve;});
  await page.route('https://orders.test/api/orders', async route=>{
    received(); await gate;
    await route.fulfill({status:200,contentType:'application/json',body:'{"ok":true}'});
  });
  await page.route('https://wa.me/**', route=>route.fulfill({status:200,body:'WhatsApp interceptado'}));
  await prepare(page);
  await page.evaluate(()=>{MenuContact.navigate=window.__realContactNavigate;});
  await page.locator('#sendBtn').click();
  await requestSeen;
  try {
    assert.equal(context.pages().length,1);
    assert.deepEqual(await page.evaluate(()=>window.__openAttempts),[],'No debe abrir about:blank');
    assert.equal(await page.locator('#sendBtn').textContent(),'Conectando con WhatsApp…');
    assert.equal(await page.locator('#sendBtn').isDisabled(),true);
    assert.equal((await orderState(page)).draft.cart.catpuccino.qty,1);
  } finally { release(); }
  await page.waitForURL('https://wa.me/**');
  assert.equal(context.pages().length,1);
  assert.ok(new URL(page.url()).searchParams.get('text').includes('Pedido Clowder'));
  await page.goBack();
  assert.deepEqual((await orderState(page)).cart,{});
}));

test('Un fallo de conexión no abre pestañas vacías y conserva el pedido', () => useFixture(async ({ page, state, context }) => {
  await prepare(page); state.failConfig=true;
  await page.evaluate(()=>sendOrder());
  assert.deepEqual(await page.evaluate(()=>window.__openAttempts),[]);
  assert.equal(context.pages().length,1);
  assert.equal(await page.locator('#contactError').isVisible(),true);
  assert.equal((await orderState(page)).draft.cart.catpuccino.qty,1);
}));

test('El bloqueo de popup limpia el carrito y conserva el mensaje en el historial', () => useFixture(async ({ page }) => {
  await prepare(page);
  await page.evaluate(() => { window.__popupBlocked = true; return sendOrder(); });
  const state = await orderState(page);
  assert.equal(state.destinations.at(-1).blocked, true);
  assert.deepEqual(state.cart, {});
  assert.equal(await page.evaluate(() => orderHistory[0].cart.catpuccino.qty), 1);
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
  await page.evaluate(() => { MenuContact.navigate = window.__realContactNavigate; });
  await page.locator('#whatsappRecoveryLink').click();
  await page.waitForURL('https://wa.me/**');
  assert.equal(orders.length, 1, 'El enlace de recuperación no debe registrar otro pedido');
}));

test('Nuevo pedido limpia carrito y código; el siguiente recibe otro código', () => useFixture(async ({ page }) => {
  await prepare(page);
  await page.evaluate(() => sendOrder());
  const first = await page.evaluate(() => orderHistory[0].code);
  await page.evaluate(() => startNewOrder());
  const cleared = await orderState(page);
  assert.deepEqual(cleared.cart, {});
  assert.equal(cleared.currentOrderCode, '');
  assert.ok(!cleared.draft || Object.keys(cleared.draft.cart).length === 0);
  await prepare(page);
  await page.evaluate(() => sendOrder());
  assert.notEqual(await page.evaluate(() => orderHistory[0].code), first);
}));

test('Dos dispositivos nuevos en el mismo minuto reciben códigos diferentes', async () => {
  const first = await fixture();
  const second = await fixture();
  try {
    const codes = [];
    for (const { page } of [first, second]) {
      await prepare(page);
      await page.evaluate(() => sendOrder());
      codes.push(await page.evaluate(() => orderHistory[0].code));
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
  assert.deepEqual((await orderState(page)).cart, {});
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
  assert.equal(await page.evaluate(() => !checkoutReady), false);
  for (const value of ['', '-1', '1.5']) {
    await page.locator('#deliveryManzana').fill(value);
    await page.evaluate(() => updateBars());
    assert.equal(await page.evaluate(() => !checkoutReady), true, `Dirección inválida: ${value}`);
  }
  await page.locator('#deliveryManzana').fill('12');
  await page.evaluate(() => updateBars());
  assert.equal(await page.evaluate(() => !checkoutReady), false);
}));

test('Computadora: dos columnas, categorías accesibles y sin desbordamiento', () => useFixture(async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 1000 });
  await page.evaluate(() => selectCat('Bebidas Calientes'));
  assert.ok(await page.locator('#cats .cat-btn').count() > 1);
  assert.equal(await page.locator('#menuBack').isVisible(), true);
  const layout = await page.evaluate(() => {
    const cards = [...document.querySelectorAll('.menu-products > .item')];
    return { columns: getComputedStyle(document.querySelector('.menu-products')).gridTemplateColumns.split(' ').length,
      overflow: document.documentElement.scrollWidth > innerWidth,
      width: cards[0].getBoundingClientRect().width,
      emojiFont: getComputedStyle(document.body).fontFamily };
  });
  assert.equal(layout.columns, 2);
  assert.equal(layout.overflow, false);
  assert.ok(layout.width > 350);
  assert.match(layout.emojiFont, /Apple Color Emoji/);
  await page.setViewportSize({ width: 390, height: 844 });
  await page.waitForFunction(() => document.documentElement.scrollWidth <= innerWidth);
  assert.equal(await page.locator('.cats-wrap').isVisible(), false);
}));

test('Navegación inferior y Atrás conservan el carrito', () => useFixture(async ({ page }) => {
  await page.evaluate(() => selectCat('Bebidas Calientes'));
  await page.evaluate(() => changeQty('catpuccino', 1));
  await page.locator('#menuBack').click();
  await page.waitForFunction(() => categoryHome);
  assert.equal((await orderState(page)).cart.catpuccino.qty, 1);
  await page.evaluate(() => selectCat('Bebidas Frías'));
  await page.goBack();
  await page.waitForFunction(() => categoryHome);
  assert.equal((await orderState(page)).cart.catpuccino.qty, 1);
  await page.goForward();
  await page.waitForFunction(() => !categoryHome && activeCat === 'Bebidas Frías');
  await page.locator('#cartbar').click();
  assert.equal(await page.locator('#overlay').evaluate(el => el.classList.contains('open')), true);
  await page.evaluate(() => closeCart());
  for(const width of [320,390,1440]) {
    await page.setViewportSize({width,height:844});
    assert.ok(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1));
    const boxes = await page.evaluate(() => ['menuBack','cartbar'].map(id => {const r=document.getElementById(id).getBoundingClientRect();return {left:r.left,right:r.right,top:r.top,bottom:r.bottom};}));
    assert.ok(boxes[0].right <= boxes[1].left);
    assert.ok(boxes.every(b => b.left >= 0 && b.right <= width && b.bottom <= 844));
  }
  await page.setViewportSize({width:390,height:844});
}));

test('Confirmación pide datos solo al continuar y conserva validaciones', () => useFixture(async ({page}) => {
 await page.evaluate(()=>{selectCat('Bebidas Calientes');changeQty('catpuccino',1);openCart();});
 assert.equal(await page.locator('#overlay .field-missing, #overlay .option-missing').count(),0);
 await page.locator('#sendBtn').click();
 assert.ok(await page.locator('#overlay .field-missing').count()>0);
 assert.equal((await orderState(page)).destinations.length,0);
 await page.evaluate(()=>{document.getElementById('customerName').value='Prueba';setMode('mesa');setPay('efectivo');setExactCash();});
 assert.equal(await page.locator('#overlay .field-missing, #overlay .option-missing').count(),0);
 await page.locator('#cashAmount').fill('0.01');await page.evaluate(()=>updateBars());
 await page.locator('#sendBtn').click();assert.equal((await orderState(page)).destinations.length,0);
 await page.evaluate(()=>setExactCash());await page.locator('#sendBtn').click();
 await page.waitForFunction(()=>window.__whatsappAttempts.length===1);
 assert.equal((await orderState(page)).destinations.length,1);
 await page.evaluate(()=>{startNewOrder();selectCat('Bebidas Calientes');changeQty('catpuccino',1);openCart();});
 assert.equal(await page.locator('#overlay .field-missing, #overlay .option-missing').count(),0);
}));

test('Transferencia sin banco, papelera y colores de leche', () => useFixture(async ({page}) => {
 await page.evaluate(()=>{selectCat('Bebidas Calientes');changeQty('catpuccino',1);document.getElementById('milk-moccatto').value='almendra';setMilk('moccatto','almendra');changeQty('moccatto',1);openCart();document.getElementById('customerName').value='Prueba';setMode('mesa');paymentBank='';setPay('transferencia');});
 assert.equal(await page.locator('#paymentBank').count(),0);
 assert.equal(await page.locator('#bankField a').getAttribute('href'),'https://clowder.cafe/pagos/');
 assert.equal(await page.evaluate(()=>checkoutReady),true);
 assert.equal(await page.locator('.milk-chip-deslactosada').count(),1);
 assert.equal(await page.locator('.milk-chip-almendra').count(),1);
 const colors=await page.locator('.milk-chip').evaluateAll(es=>es.map(e=>getComputedStyle(e).backgroundColor));assert.notEqual(colors[0],colors[1]);
 await page.locator('#cartList .cart-row').nth(1).getByRole('button',{name:'Agregar una unidad con las mismas modificaciones'}).click();
 const almond=await page.evaluate(()=>Object.values(cart).find(x=>x.milk==='almendra'));assert.equal(almond.qty,2);
 const rm=page.locator('#cartList .rm').first();const box=await rm.boundingBox();assert.ok(box.width>=44 && box.height>=44);
 await rm.click();assert.equal(await page.locator('#cartList .cart-row').count(),1);
 await page.locator('#sendBtn').click();await page.waitForFunction(()=>window.__whatsappAttempts.length===1);
 const msg=decodeURIComponent((await orderState(page)).destinations[0].url);assert.match(msg,/Pago: transferencia/);assert.doesNotMatch(msg,/transferencia a /);
}));

test('Pizza: disponibilidad compartida habilita y agotado bloquea el producto', async () => {
  for(const remaining of [5,0]) await useFixture(async ({page}) => {
    await page.evaluate(async () => { delete MENU.find(i => i.id === 'clowder-pizza').soldOutManual; await refreshPizzaAvailability(); });
    await page.waitForFunction(remaining => MENU.find(i => i.id === 'clowder-pizza').soldOut === (remaining === 0), remaining);
    assert.equal(await page.evaluate(() => isItemOrderable(MENU.find(i => i.id === 'clowder-pizza'))), remaining > 0);
  }, {pizzaStock:remaining});
});
test('Pizza: rechazo del servidor conserva el pedido y no abre WhatsApp', () => useFixture(async ({page}) => {
  await page.evaluate(async () => { delete MENU.find(i => i.id === 'clowder-pizza').soldOutManual; await refreshPizzaAvailability(); });
  await page.waitForFunction(() => !MENU.find(i => i.id === 'clowder-pizza').soldOut);
  await prepare(page,{items:{'clowder-pizza':1}});
  await page.evaluate(() => sendOrder());
  assert.equal((await orderState(page)).destinations.length,0);
  assert.match(await page.locator('#contactError').textContent(), /No quedan suficientes pizzas/);
  assert.equal((await orderState(page)).cart['clowder-pizza'].qty,1);
}, {pizzaStock:5,rejectPizza:true}));

test('Solo bebidas: oculta comida sin cambiar stock y limpia un borrador anterior', () => useFixture(async ({page}) => {
  assert.equal(await page.locator('#drinksOnlyNotice').isVisible(), true);
  assert.deepEqual(await page.evaluate(() => visibleCats()), ['Bebidas Frías', 'Bebida del Mes', 'Bebidas Calientes', 'Matcha']);
  assert.equal(await page.locator('.category-tile').count(), 4);
  assert.doesNotMatch(await page.locator('#menu').textContent(), /Snack Dulce|Snack Sal|Empanada|oChips/);
  assert.deepEqual(Object.keys((await orderState(page)).cart), ['catpuccino']);
  assert.equal(await page.evaluate(() => MENU.find(i => i.id === 'empanada-queso').soldOut || false), false);
  await page.evaluate(() => { selectCat('Snack Sal'); changeQty('empanada-queso', 1); });
  assert.equal(await page.evaluate(() => categoryHome), true);
  assert.equal((await orderState(page)).cart['empanada-queso'], undefined);
  assert.match(await page.locator('#hoursNotice').textContent(), /Halloween/);
  for(const category of ['Bebidas Frías', 'Bebida del Mes', 'Bebidas Calientes', 'Matcha']) {
    await page.evaluate(category => selectCat(category), category);
    assert.ok(await page.locator('#menu .item').count());
    assert.ok(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1));
  }
  await page.evaluate(() => { closeHours(); expandCats(false); document.getElementById('introSkip')?.click(); });
  await page.waitForFunction(() => !document.getElementById('introSplash'));
  await page.screenshot({path:'/tmp/clowder-solo-bebidas-mobile.png', fullPage:true});
  await page.setViewportSize({width:1440,height:1000});
  assert.ok(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1));
  await page.screenshot({path:'/tmp/clowder-solo-bebidas-desktop.png', fullPage:true});
}, {time:'2026-10-30T20:00:00-05:00', draft:{cart:{catpuccino:{qty:1}, 'empanada-queso':{qty:1}}, mode:'mesa'}}));

test('Solo bebidas: empieza y termina a medianoche de Ecuador con la página abierta', () => useFixture(async ({page}) => {
  assert.equal(await page.locator('#drinksOnlyNotice').isVisible(), false);
  await page.evaluate(() => {selectCat('Snack Sal'); changeQty('empanada-queso',1); window.__setTestTime('2026-10-30T05:00:00Z'); refreshAvailability();});
  assert.equal(await page.locator('#drinksOnlyNotice').isVisible(), true);
  assert.equal(await page.evaluate(() => categoryHome), true);
  assert.equal(await page.locator('.category-tile').count(), 4);
  assert.deepEqual((await orderState(page)).cart, {});
  await page.evaluate(() => {window.__setTestTime('2026-10-31T04:59:59Z');refreshAvailability();});
  assert.equal(await page.locator('#drinksOnlyNotice').isVisible(), true);
  await page.evaluate(() => {window.__setTestTime('2026-10-31T05:00:00Z');refreshAvailability();selectCat('Snack Sal');changeQty('empanada-queso',1);});
  assert.equal(await page.locator('#drinksOnlyNotice').isVisible(), false);
  assert.equal((await orderState(page)).cart['empanada-queso'].qty, 1);
  assert.equal(await page.evaluate(() => visibleCats().includes('Snack Dulce')), true);
}, {time:'2026-10-30T04:59:59Z'}));

test('Borrador antiguo de Andrea genera un código nuevo antes de registrar', () => useFixture(async ({page}) => {
  let sent;
  await page.route('**/api/orders', route => {sent=route.request().postDataJSON();return route.fulfill({status:200,contentType:'application/json',body:'{"ok":true}'});});
  await prepare(page, {items:{'milkishaki-salted-caramel':1}, name:'ANDREA'});
  await page.evaluate(() => sendOrder());
  assert.notEqual(sent.code, 'CL-20261017-1807-1B9189AE');
  assert.match(sent.code, /^CL-20261029-/);
  assert.deepEqual((await orderState(page)).cart, {});
}, {time:'2026-10-29T20:00:00-05:00',draft:{orderCode:'CL-20261017-1807-1B9189AE',orderReceiptKey:'a'.repeat(64),cart:{catpuccino:{qty:1}}}}));

test('Registro rechazado bloquea WhatsApp; reintentar conserva código y modificarlo genera otro', () => useFixture(async ({page}) => {
  const orders=[]; let reject=true;
  await page.route('**/api/orders', route => {orders.push(route.request().postDataJSON());return route.fulfill({status:reject?400:200,contentType:'application/json',body:JSON.stringify(reject?{error:'Este pedido ya fue registrado. Empieza un pedido nuevo para cambiarlo.'}:{ok:true})});});
  await prepare(page);
  await page.evaluate(() => sendOrder());
  assert.equal((await orderState(page)).destinations.length,0);
  assert.equal((await orderState(page)).cart.catpuccino.qty,1);
  await page.evaluate(() => sendOrder());
  assert.equal(orders[0].code,orders[1].code);
  reject=false;
  await page.evaluate(() => {changeQty('catpuccino',1);return sendOrder();});
  assert.notEqual(orders[1].code,orders[2].code);
  assert.equal((await orderState(page)).destinations.length,1);
  assert.deepEqual((await orderState(page)).cart,{});
}));

test('Repetir historial respeta precios y disponibilidad actuales sin recuperar datos personales', () => useFixture(async ({page}) => {
  await prepare(page,{items:{catpuccino:1,'empanada-queso':1}});
  await page.evaluate(() => sendOrder());
  await page.evaluate(() => {window.__setTestTime('2026-10-30T20:00:00-05:00');MENU.find(i=>i.id==='catpuccino').price=3;repeatPreviousOrder(orderHistory[0]);});
  const state=await orderState(page);
  assert.deepEqual(Object.keys(state.cart),['catpuccino']);
  assert.equal(await page.evaluate(() => grandTotal()),3);
  assert.equal(state.currentOrderCode,'');assert.equal(state.name,'');assert.equal(state.mode,'');assert.equal(state.payMethod,'');
  assert.equal(await page.evaluate(() => orderHistory[0].totalCents),400);
}, {time:'2026-10-29T20:00:00-05:00'}));

test('Si el servidor guardó pero se perdió la respuesta, recargar y reintentar no duplica el pedido', () => useFixture(async ({page,ready}) => {
  const orders=[];let fail=true;
  await page.route('**/api/orders',route=>{orders.push(route.request().postDataJSON());return fail?route.abort():route.fulfill({status:200,contentType:'application/json',body:'{"ok":true}'});});
  await prepare(page);await page.evaluate(()=>sendOrder());
  assert.equal((await orderState(page)).destinations.length,0);
  assert.equal((await orderState(page)).cart.catpuccino.qty,1);
  await page.reload({waitUntil:'domcontentloaded'});await ready();fail=false;
  await page.evaluate(()=>sendOrder());
  assert.equal(orders.length,2);assert.deepEqual(orders[0],orders[1]);
  assert.deepEqual((await orderState(page)).cart,{});
  assert.equal(await page.evaluate(()=>orderHistory.length),1);
}));

test('Historial conserva como máximo diez pedidos y muestra notas como texto', () => useFixture(async ({page}) => {
  await prepare(page);
  await page.evaluate(() => {
    for(let i=0;i<12;i++) rememberOrder({code:`CL-20261029-2000-TEST${i}`,totalCents:250},'<img src=x onerror="window.__historyXss=true">');
    renderOrderHistory();
  });
  assert.equal(await page.evaluate(()=>orderHistory.length),10);
  assert.equal(await page.locator('#orderHistoryList img').count(),0);
  assert.equal(await page.evaluate(()=>window.__historyXss),undefined);
  await page.reload({waitUntil:'domcontentloaded'});
  assert.equal(await page.locator('#orderHistoryList details').count(),10);
}));

test('WhatsApp en blanco: volver y recargar muestra el mismo pedido arriba sin registrar otra venta', () => useFixture(async ({page,ready,state}) => {
  const orders=[];
  await page.route('**/api/orders',route=>{orders.push(route.request().postDataJSON());return route.fulfill({status:200,contentType:'application/json',body:'{"ok":true}'});});
  await prepare(page);
  await page.evaluate(()=>{MenuContact.navigate=()=>{throw new Error('WhatsApp en blanco');};return sendOrder();});
  const code=orders[0].code;
  assert.equal(await page.locator('#whatsappRecovery').isVisible(),true);
  assert.match(await page.locator('#recoveryOrderDetails').textContent(),new RegExp(code));
  await page.reload({waitUntil:'domcontentloaded'});await ready();
  await page.waitForFunction(()=>!document.getElementById('introSplash'));
  assert.equal(await page.locator('#whatsappRecovery').isVisible(),true);
  assert.ok(await page.locator('#whatsappRecovery').evaluate(el=>el.getBoundingClientRect().top<innerHeight));
  assert.match(await page.locator('#whatsappRecoveryMessage').textContent(),new RegExp(code));
  await page.locator('#whatsappRecovery details summary').click();
  assert.match(await page.locator('#recoveryOrderDetails').textContent(),/Catpuccino/);
  state.config.whatsappNumber='593990001122';
  await page.route('https://wa.me/**',route=>route.fulfill({status:200,body:'WhatsApp interceptado'}));
  await page.locator('#whatsappRecoveryLink').click();
  await page.waitForURL('https://wa.me/**');
  const destination=page.url();
  assert.equal(new URL(destination).pathname,'/593990001122');
  assert.match(new URL(destination).searchParams.get('text'),new RegExp(code));
  assert.equal(orders.length,1);
  await page.goBack();await ready();
  assert.deepEqual((await orderState(page)).cart,{});
  await page.waitForFunction(()=>!document.getElementById('introSplash'));
  await page.evaluate(()=>window.scrollTo(0,0));
  await page.screenshot({path:'/tmp/clowder-recuperar-whatsapp.png',fullPage:false});
  await page.getByRole('button',{name:'Ya envié el mensaje',exact:true}).click();
  assert.equal(await page.locator('#whatsappRecovery').isVisible(),false);
  await page.reload({waitUntil:'domcontentloaded'});await ready();
  assert.equal(await page.locator('#whatsappRecovery').isVisible(),false);
  assert.equal(await page.evaluate(()=>orderHistory[0].code),code);
}));

test('Si falla guardar la copia de recuperación, conserva el carrito para reintentar sin duplicar', () => useFixture(async ({page}) => {
  const orders=[];
  await page.route('**/api/orders',route=>{orders.push(route.request().postDataJSON());return route.fulfill({status:200,contentType:'application/json',body:'{"ok":true}'});});
  await prepare(page);
  await page.evaluate(()=>{
    window.__originalSetItem=Storage.prototype.setItem;
    Storage.prototype.setItem=function(key,value){if(key==='clowder_order_history')throw new Error('Quota');return window.__originalSetItem.call(this,key,value);};
    return sendOrder();
  });
  assert.equal((await orderState(page)).destinations.length,0);
  assert.equal((await orderState(page)).cart.catpuccino.qty,1);
  assert.match(await page.locator('#contactError').textContent(),/copia para recuperar/);
  await page.evaluate(()=>{Storage.prototype.setItem=window.__originalSetItem;return sendOrder();});
  assert.deepEqual(orders[0],orders[1]);
  assert.equal((await orderState(page)).destinations.length,1);
  assert.equal(await page.locator('#whatsappRecovery').isVisible(),true);
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
