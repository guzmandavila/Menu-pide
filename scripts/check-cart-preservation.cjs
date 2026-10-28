// Run with Node 18+: node scripts/check-cart-preservation.cjs
// Exercise the production cart operation without browser or external services.
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const source = fs.readFileSync(path.join(__dirname, '..', 'app.js'), 'utf8');
function productionFunction(name) {
  const start = source.indexOf(`function ${name}(`);
  assert.ok(start >= 0, `Missing production function: ${name}`);
  const end = source.indexOf('\n}', start);
  assert.ok(end > start);
  return source.slice(start, end + 2);
}
function fixture(baseQty, extraQty, baseNote = '', extraNote = '') {
  const context = {
    cart: {
      coffee: {qty:baseQty, note:baseNote, milk:'', syrup:'', scoop:''},
      'coffee::syrup=vanilla': {qty:extraQty, note:extraNote, milk:'', syrup:'vanilla', scoop:''}
    },
    pendingOptions: {}, alerts: [], renders:0,
    itemQuantityLimit: () => 10, productForCartLine: () => ({}),
    renderMenu() { context.renders++; }, updateBars() {},
    alert(message) { context.alerts.push(message); }
  };
  vm.createContext(context);
  vm.runInContext(['cartProductId', 'cartLineId', 'removeExtra'].map(productionFunction).join('\n'), context);
  return context;
}
function remove(context) { context.removeExtra('coffee::syrup=vanilla', 'syrup'); }
// The reported 10 + 1 case must leave the whole order unchanged.
for(const [baseQty, extraQty] of [[10,1], [6,5], [10,10]]) {
  const context = fixture(baseQty, extraQty);
  const before = JSON.stringify(context.cart);
  remove(context);
  assert.equal(JSON.stringify(context.cart), before);
  assert.equal(context.alerts.length, 1);
  assert.equal(context.renders, 0);
}
// Safe merges preserve every unit, including the exact limit.
for(const [baseQty, extraQty] of [[1,1], [9,1], [4,6]]) {
  const context = fixture(baseQty, extraQty, 'Sin azúcar', 'Sin azúcar');
  remove(context);
  assert.equal(context.cart.coffee.qty, baseQty + extraQty);
  assert.equal(context.cart.coffee.note, 'Sin azúcar');
  assert.equal(Object.keys(context.cart).length, 1);
  assert.equal(context.alerts.length, 0);
}
// Instructions from one line must never be silently lost or applied to another.
for(const [baseNote, extraNote] of [['', 'Muy caliente'], ['Sin azúcar', 'Tibio']]) {
  const context = fixture(1, 1, baseNote, extraNote);
  const before = JSON.stringify(context.cart);
  remove(context);
  assert.equal(JSON.stringify(context.cart), before);
  assert.equal(context.alerts.length, 1);
}
// A non-colliding option change retains all original instructions.
const context = fixture(1, 3, '', 'Tibio');
delete context.cart.coffee;
remove(context);
assert.equal(context.cart.coffee.qty, 3);
assert.equal(context.cart.coffee.note, 'Tibio');
assert.equal(context.cart.coffee.syrup, '');
assert.equal(context.alerts.length, 0);
// Stale controls and unsupported extra types are harmless.
const before = JSON.stringify(context.cart);
context.removeExtra('missing', 'syrup');
context.removeExtra('coffee', 'invalid');
assert.equal(JSON.stringify(context.cart), before);
console.log('Cart preservation checks passed: overflow, notes, safe merges and stale controls.');
