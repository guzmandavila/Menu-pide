/* ============================================================
   EDITA AQUÍ TU MENÚ — cambia nombres, descripciones y precios.
   "cat" agrupa los productos por categoría.
   ============================================================ */
const MENU = [
  { id:'combo-cafe-empanada-queso', cat:'Combos', name:'Café + Empanada de queso', desc:'Un café de la casa y una empanada de queso. Disponible únicamente los lunes, todo el día.', price:3.25, originalPrice:3.75, img:'miniaturas/combo-cafe-empanada.jpg', featured:true, featuredTag:'COMBO DEL LUNES', accent:'#D8A24A', order:0, days:[1] },
  { id:'combo-bananacake-catpuccino', cat:'Combos', name:'Bananacake + Catpuccino', desc:'Bananacake con harina de almendras, panela y drizzle de vainilla, acompañado de un Catpuccino. Disponible solo los martes, todo el día.', price:4.60, originalPrice:5.20, img:'banners/cmb-banner-02.jpg', featured:true, featuredTag:'COMBO DEL MARTES', accent:'#D8A24A', order:1, days:[2] },
  { id:'banana-bread-latte', cat:'Bebida del Mes', name:'Banana Bread Latte', desc:'Sirope casero de brown butter (mantequilla avellanada), banano real y un shot de espresso, servido frío.', price:3.75, img:'assets/image-b4e517cc3df03e47.jpg', featured:true, featuredTag:'Bebida del mes', promoNote:'El precio de lanzamiento ($2.75) ya terminó. Mantente atento a la Bebida del Mes: cada lanzamiento sale con descuento.' },

  // ---- Bebidas Calientes ----
  { id:'strawberry-catpuccino', cat:'Bebidas Calientes', name:'Strawberry Catpuccino', classic:'Cappuccino de fresa', desc:'Dulce, cremoso y hecho para consentirte.', price:3.00, availableFrom:'2026-09-19T00:00:00-05:00', availableUntil:'2026-09-28T00:00:00-05:00', promoNote:'Disponible del 19 al 27 de septiembre, hasta las 23:59.', img:'banners/bc-strawberry-catpuccino.jpeg' },
  { id:'catpuccino', cat:'Bebidas Calientes', name:'Catpuccino', classic:'Cappuccino', syrupOption:['vainilla-francesa','avellana','caramelo-salado'], desc:'Espresso y leche.', price:2.6, milk:true, img:'miniaturas/bc-catpuccino.jpg' },
  { id:'cozy-claws', cat:'Bebidas Calientes', name:'Cozy Claws', classic:'Chocolate caliente', syrupOption:['vainilla-francesa','avellana','caramelo-salado'], desc:'Con base de cacao y leche.', price:2.8, milk:true, img:'miniaturas/bc-cozy-claws.jpg' },
  { id:'doble-sippi', cat:'Bebidas Calientes', name:'Doble Sippi', classic:'Espresso doble', syrupOption:['vainilla-francesa','avellana','caramelo-salado'], desc:'', price:1.8, img:'miniaturas/bc-doble-sippi.jpg' },
  { id:'long-tail', cat:'Bebidas Calientes', name:'Long Tail', classic:'Americano', syrupOption:['vainilla-francesa','avellana','caramelo-salado'], desc:'', price:2.25, img:'miniaturas/bc-long-tail.jpg' },
  { id:'moccatto', cat:'Bebidas Calientes', name:'Moccatto', classic:'Mocaccino', syrupOption:['vainilla-francesa','avellana','caramelo-salado'], desc:'Espresso con base de cacao y leche.', price:3.0, milk:true, img:'miniaturas/bc-moccatto.jpg' },

  // ---- Bebidas Frías ----
  { id:'affocato', cat:'Bebidas Calientes', name:'AffoCato', desc:'Espresso doble sobre helado de vainilla Madagascar.', price:3.5, img:'miniaturas/bf-affocato.jpg' },
  { id:'berrybloom', cat:'Bebidas Frías', name:'BerryBloom', classic:'Limonada de fresa', classicTheme:'fresh', order:6, desc:'Salsa de fresa, zumo de limón y miel, con hielo.', price:3.75, img:'assets/image-45bed35fc31fb6b1.jpg' },
  { id:'ice-koffin', cat:'Bebidas Frías', name:'Ice Koffin', classic:'Americano helado', classicTheme:'fresh', order:1, desc:'Espresso y agua, con hielo.', price:2.5, img:'assets/image-cc920e9b95fa9297.jpg' },
  { id:'nara-sunset', cat:'Bebidas Frías', name:'Nara Sunset', classic:'Naranja y café', classicTheme:'fresh', order:5, desc:'Con hielo.', price:3.5, img:'assets/image-564f15ba92421bf9.jpg' },
  { id:'nimbus', cat:'Bebidas Frías', name:'Ice Moccatto', classic:'Mocaccino helado', classicTheme:'fresh', order:3, desc:'Espresso, leche y sirope de chocolate, con hielo.', price:4.0, milk:true, img:'assets/image-de2fc99b743f1564.jpg' },
  { id:'vanilatte', cat:'Bebidas Frías', name:'Ice Latte', classic:'Latte helado', classicTheme:'fresh', order:2, syrupOption:['vainilla-francesa','avellana','caramelo-salado'], desc:'Espresso, leche y jarabe de vainilla, con hielo.', price:3.5, milk:true, img:'assets/image-c2358fbf75d9fa28.jpg' },

  // ---- Matcha ----
  { id:'nekomatchalatte', cat:'Matcha', name:'NekoMatchaLatte', syrupOption:['caramelo','vainilla'], desc:'Matcha, leche y hielo.', price:3.5, milk:true, img:'assets/image-a21806fe3017f9d8.jpg' },
  { id:'sakuramatcha-latte', cat:'Matcha', name:'SakuraMatcha Latte', desc:'Matcha, leche y fresa, con hielo.', price:4.15, milk:true, img:'assets/image-73038c7da3c63e99.jpg' },

  // ---- Panadería ----
  { id:'galleta', cat:'Snack Dulce', name:'Galleta', desc:'', price:2.0 },
  { id:'funbite', cat:'Snack Dulce', name:'Funbite', desc:'Mix de harinas sin gluten con chips de colores.', price:2.25, img:'assets/funbite.jpeg' },
  { id:'mini-cake-del-dia', cat:'Snack Dulce', name:'Apple Crumble Cake', desc:'Harina de almendra, harina de coco, ghee y manzana natural, cobertura de chocolate blanco.', price:2.6, scoop:true, accent:'#C8433B', img:'miniaturas/apple-crumble.jpg', imgScoop:'miniaturas/apple-crumble-helado.jpg' },

  { id:'brownie', cat:'Snack Dulce', name:'Brownie', desc:'Brownie intenso y húmedo, con cacao orgánico, endulzado con alulosa y panela.', price:3.0, scoop:true, img:'assets/image-6d3c530cc30feadd.jpg' },
  { id:'milkishaki-nutella', cat:'Bebidas Frías', name:'MilkiShaki - Nutella + Brownie Bites', classic:'Milkshake', classicTheme:'fresh', order:4, desc:'Hecho en casa, con leche y helado premium.', price:4.9, milk:true, img:'assets/image-2b43f2fe510398fb.jpg', group:'milkishaki', flavor:'Nutella + Brownie Bites'  },
  { id:'milkishaki-fresa', cat:'Bebidas Frías', name:'MilkiShaki - Fresa', classic:'Milkshake', classicTheme:'fresh', order:4, desc:'Hecho en casa, con leche y helado premium.', price:4.9, milk:true, img:'assets/image-299c9fd9ebdf031a.jpg', group:'milkishaki', flavor:'Fresa'  },
  { id:'milkishaki-salted-caramel', cat:'Bebidas Frías', name:'MilkiShaki - Salted Caramel', classic:'Milkshake', classicTheme:'fresh', order:4, desc:'Hecho en casa, con leche y helado premium.', price:4.9, milk:true, img:'assets/image-861d6d271de84321.jpg', group:'milkishaki', flavor:'Salted Caramel'  },

  // ---- Snacks ----
  { id:'tocipapa', cat:'Snack Sal', name:'Tocipapa', desc:'Papas corte recto con tocineta crocante y salsa de la casa. 120 g (20–25 g de tocineta).', price:2.5, img:'assets/image-9fa7a5da9f5e3cb0.jpg', group:'tocipapa', flavor:'Regular' },
  { id:'tocipapa-grande', cat:'Snack Sal', name:'Tocipapa', desc:'Papas corte recto con tocineta crocante y salsa de la casa. 180 g (30–40 g de tocineta).', price:3.5, img:'assets/image-9fa7a5da9f5e3cb0.jpg', group:'tocipapa', flavor:'Grande' },
  { id:'wachipapa', cat:'Snack Sal', name:'Wachipapa', desc:'Papas corte recto con chorizo argentino y salsa mayochurri de la casa. 120 g (35–40 g de chorizo).', price:3.0, img:'assets/image-a77569a7a899b63a.jpg', group:'wachipapa', flavor:'Regular' },
  { id:'wachipapa-grande', cat:'Snack Sal', name:'Wachipapa', desc:'Papas corte recto con chorizo argentino y salsa mayochurri de la casa. 180 g (50–60 g de chorizo).', price:4.0, img:'assets/image-a77569a7a899b63a.jpg', group:'wachipapa', flavor:'Grande' },
  { id:'empanada-pollo', cat:'Snack Sal', name:'Empanada de Hojaldre', desc:'Pechuga de pollo con nuestra salsa de vegetales. No te pierdas nuestro aderezo de mayonesa de la casa.', price:2.4, maxQty:4, promoNote:'¡Últimas 4 empanadas de pollo disponibles!', img:'assets/image-b46285ee20adcc24.jpg', group:'empanada', flavor:'Pollo' },
  { id:'empanada-queso', cat:'Snack Sal', name:'Empanada de Hojaldre', desc:'Hojaldre horneado y crocante, relleno de queso de búfala.', price:1.5, soldOut:true, img:'assets/image-b46285ee20adcc24.jpg', group:'empanada', flavor:'Queso' },
  { id:'empanada-pizza', cat:'Snack Sal', name:'Empanada de Hojaldre', desc:'Hojaldre horneado y crocante, relleno de queso mozzarella y tocineta.', price:0, img:'assets/image-b46285ee20adcc24.jpg', group:'empanada', flavor:'Pizza', comingSoon:true },
  { id:'virginia-melt', cat:'Snack Sal', name:'Virginia Melt', desc:'Pan de masa madre tostado con ghee, jamón Virginia, mozzarella de búfala y salsa panini, con chips de papa.', price:3.5, soldOut:true, img:'assets/image-96afa6196cb83296.jpg' },
  { id:'leche-almendras', cat:'Congelados y Más', name:'Leche de Almendras Casera', desc:'Nuestra leche de almendras hecha en casa, en botella para llevar.', price:0, img:'assets/image-f54974e93c477710.jpg', comingSoon:true },
  // Yuki: pan de yuca artesanal, congelado. Se vende solo por paquete de 10 o 20,
  // por eso van como productos independientes (no variantes) con la cantidad en el nombre.
  { id:'yuki-10', cat:'Congelados y Más', name:'Yuki · 10 panes', desc:'Elaborado con queso de búfala y ghee. Suave por dentro, ligeramente crujiente por fuera y sin mantecas vegetales.', price:5.50, img:'miniaturas/cm-yuki.jpg' },
  { id:'yuki-20', cat:'Congelados y Más', name:'Yuki · 20 panes', desc:'Elaborado con queso de búfala y ghee. Suave por dentro, ligeramente crujiente por fuera y sin mantecas vegetales.', price:8.50, img:'miniaturas/cm-yuki.jpg' },
  { id:'cake-zanahoria', cat:'Congelados y Más', name:'Cake Grande', desc:'Cake grande completo, para compartir en casa.', price:0, group:'cake-grande', flavor:'Zanahoria', soldOut:true },
  { id:'cake-banana', cat:'Congelados y Más', name:'Cake Grande', desc:'Cake grande completo, para compartir en casa.', price:0, group:'cake-grande', flavor:'Banana', soldOut:true },
  { id:'cake-naranja', cat:'Congelados y Más', name:'Cake Grande', desc:'Cake grande completo, para compartir en casa.', price:0, group:'cake-grande', flavor:'Naranja', soldOut:true },
  { id:'merch-camiseta', cat:'Merch Clowder', name:'Camiseta Clowder', desc:'Camiseta de algodón con el logo de la casa.', price:0, comingSoon:true },
  { id:'merch-totebag', cat:'Merch Clowder', name:'Tote Bag', desc:'Bolsa de tela para el día a día.', price:0, comingSoon:true },
  { id:'merch-stickers', cat:'Merch Clowder', name:'Stickers', desc:'Set de stickers para tu laptop, termo o donde quieras.', price:0, comingSoon:true },
  { id:'merch-llavero', cat:'Merch Clowder', name:'Llavero', desc:'Llavero con la patita de Clowder.', price:0, comingSoon:true },
  { id:'merch-cuadro', cat:'Merch Clowder', name:'Cuadro', desc:'Ilustración de la casa, lista para colgar.', price:0, comingSoon:true },

  // ---- Extras ----
];

// Producto retirado: se excluye del menú activo sin tocar el resto del catálogo.
// Mantener este filtro separado hace sencillo revertirlo si vuelve a venderse.
for (let i = MENU.length - 1; i >= 0; i--) {
  if (MENU[i].name === 'Virginia Melt' || MENU[i].id === 'empanada-pizza') MENU.splice(i, 1);
}
// Nara Sunset se presenta sin una descripción redundante en la tarjeta.
const naraSunset = MENU.find(item => item.id === 'nara-sunset');
if (naraSunset) naraSunset.desc = '';
// Especial semanal: reemplaza el Apple Crumble por minicake de banano.
const miniCake = MENU.find(item => item.id === 'mini-cake-del-dia');
if (miniCake) {
  miniCake.name = 'Minicake de banano';
  miniCake.desc = 'Banano maduro, horneado hasta quedar suave y aromático.';
  miniCake.img = 'miniaturas/minipan.png';
  miniCake.imgScoop = '';
  miniCake.scoop = false;
  miniCake.accent = '#C98A3D';
  miniCake.featured = true;
  miniCake.featuredTag = 'MINICAKE DE LA SEMANA';
}
// El minicake y el brownie siguen ocultos; Snack Dulce incluye galleta y Funbite.
const HIDDEN_ITEM_IDS = ['mini-cake-del-dia', 'brownie'];
// Información de preparación visible en cada tarjeta.
['wachipapa','tocipapa','wachipapa-grande','tocipapa-grande'].forEach(id => {
  const item = MENU.find(product => product.id === id);
  if (item) item.processTag = '♨️ Freidora de aire · papas y proteína';
});
MENU.filter(item => item.group === 'empanada').forEach(item => {
  item.name = `Empanada de Hojaldre de ${item.flavor.toLowerCase()}`;
  item.processTag = '♨️ Horneada · sin sartén ni aceite' + (item.id === 'empanada-pollo' ? ' · Menos de 20 min' : '');
});
// Disponibilidad de las bebidas con helado.
const ICE_CREAM_AVAILABLE = true;
const ICE_CREAM_DRINK_IDS = ['milkishaki-nutella', 'milkishaki-fresa', 'milkishaki-salted-caramel', 'affocato'];
MENU.forEach(item => {
  if (ICE_CREAM_DRINK_IDS.includes(item.id)) item.soldOut = !ICE_CREAM_AVAILABLE;
  if (!ICE_CREAM_AVAILABLE && item.scoop) item.scoop = false;
});
['brownie'].forEach(id => {
  const item = MENU.find(product => product.id === id);
  if (item) {
    delete item.comingSoon;
    delete item.soldOut;
  }
});

/* Banners promocionales por categoría — array = slider. Para quitar uno, borra su entrada */
const CAT_BANNERS = {
  'Matcha': [
    { img:'banners/mt-banner-01.jpg', alt:'Matcha Clowder' },
  ],
  'Bebidas Calientes': [
    { productId:'strawberry-catpuccino', img:'banners/bc-strawberry-catpuccino.jpeg', alt:'Strawberry Catpuccino — dulce, cremoso y hecho para consentirte' },
    { img:'banners/bc-banner-01.jpg', alt:'Tu mañana empieza aquí — tu dosis de energía lista para llevar' },
  ],
  'Snack Dulce': [
    // Sin banners por ahora.
  ],
  'Snack Sal': [
    { img:'banners/ss-banner-01.jpg', alt:'Empanada de pollo — vegetales frescos picaditos y pechuga de pollo mechada' },
    { img:'banners/ss-banner-02.jpg', alt:'Wachipapas — el cierre perfecto de tu fin de semana' },
  ],
  'Bebidas Frías': [
    { img:'banners/bf-banner-02.jpg', alt:'Berry Bloom — limonada con salsa de fresa, refrescante y sin café' },
  ],
  'Bebida del Mes': [
    { img:'banners/bm-banner-01.jpg', alt:'Banana Bread Latte — bebida del mes' },
  ],
  'Combos': [
    { day:1, img:'banners/cmb-banner-01.jpg', alt:'Combo del lunes — café más empanada de queso' },
    { day:2, img:'banners/cmb-banner-02.jpg', alt:'Combo del martes — Bananacake más Catpuccino por $4,60' },
  ],
};
// Categorías ocultas temporalmente: sus productos siguen en MENU (por si se reactivan),
// pero no aparecen como pestaña hasta sacarlas de esta lista.
const HIDDEN_CATS = ['Merch Clowder', 'Congelados y Más', 'Bebida del Mes', 'Combos']; // categorías ocultas temporalmente
const CATS = [...new Set(MENU.map(i=>i.cat))].filter(c => !HIDDEN_CATS.includes(c));
function visibleCats(){
  return CATS;
}

/* Colores secundarios de marca — uno por categoría de sabor */
const CAT_COLORS = {
  'Bebidas Calientes': '#442C19',
  'Bebidas Frías':     '#B6DAEA',
  'Matcha':            '#3F854A',
  'Snack Dulce':        '#CC835A',
  'Snack Sal':          '#FAEF9A',
  'Congelados y Más':   '#D5C8DF',
  'Merch Clowder':     '#8C7B6B',
  'Bebida del Mes':     '#D5528C',
  'Combos':             '#D8A24A',
};
function catColor(c){ return CAT_COLORS[c] || 'transparent'; }
function lighten(hex, amt){
  hex = hex.replace('#','');
  const r = parseInt(hex.substring(0,2),16), g = parseInt(hex.substring(2,4),16), b = parseInt(hex.substring(4,6),16);
  const nr = Math.round(r + (255-r)*amt), ng = Math.round(g + (255-g)*amt), nb = Math.round(b + (255-b)*amt);
  return `rgb(${nr},${ng},${nb})`;
}
function pastelBg(c){ const hex = catColor(c); return hex==='transparent' ? 'transparent' : lighten(hex, 0.45); }

// Calientes es la portada del menú al abrir la app.
let activeCat = MENU.some(i=>i.cat==='Bebidas Calientes') ? 'Bebidas Calientes' : CATS[0];
let cart = {}; // id -> {qty, note}
let mode = '';
let payMethod = '';
const PAYMENT_BANKS = ['Guayaquil','Pichincha','Bolivariano','Pacífico','Produbanco'];
let paymentBank = '';
let orderReceiptKey = '';
let deliveryLocationUrl = '';
let lastCartCount = 0;
let locationRequestVersion = 0;
const MAX_QTY = 10;
function itemQuantityLimit(item){ return Math.min(MAX_QTY, item?.maxQty ?? MAX_QTY); }
function escapeHtml(value){
  return String(value).replace(/[&<>"']/g, char => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[char]));
}
const businessClock = new Intl.DateTimeFormat('en-US', {
  timeZone:'America/Guayaquil', weekday:'short', hour:'2-digit', minute:'2-digit', hourCycle:'h23'
});
function businessTime(now = new Date()){
  const parts = Object.fromEntries(businessClock.formatToParts(now).map(part => [part.type, part.value]));
  return { day:['Sun','Mon','Tue','Wed','Thu','Fri','Sat'].indexOf(parts.weekday), hour:Number(parts.hour), minute:Number(parts.minute) };
}
// Evento único: 8 de septiembre de 2026, hora de Ecuador.
function birthdayState(now = new Date()){
  const date = new Intl.DateTimeFormat('en-CA', {timeZone:'America/Guayaquil',year:'numeric',month:'2-digit',day:'2-digit'}).format(now);
  const active = date === '2026-09-08';
  return {active, closed:active && businessTime(now).hour >= 19};
}
function refreshBirthday(){
  const state = birthdayState();
  document.getElementById('birthdayNotice').hidden = !state.active;
  document.getElementById('birthdayHours').textContent = state.closed
    ? 'Hoy cerramos a las 19h00 para salir a celebrar. Los pedidos ya están cerrados, pero puedes dejar un regalo solidario.'
    : 'Hoy atendemos hasta las 19h00: después saldremos a celebrar y cerraremos los pedidos.';
}
function openBirthdayGift(event){
  event.preventDefault();
  const input = document.getElementById('birthdayAmount');
  if(!birthdayState().active || !input.reportValidity()) return;
  const amount = Number(input.value);
  if(!Number.isFinite(amount) || amount < 1) return;
  const message = `🎂 ¡Feliz cumpleaños, gato mesero! Quiero aportar $${amount.toFixed(2)} como regalo solidario para los michis de la calle. Adjunto mi comprobante de transferencia para que puedan verificarlo.`;
  document.getElementById('birthdayReceipt').dataset.message = message;
  if(MenuContact.value) document.getElementById('birthdayReceipt').href = MenuContact.url(message);
  document.getElementById('birthdayGiftInstructions').hidden = false;
  openPayments();
}
function isWithinAvailability(item, now = Date.now()){
  return (!item.availableFrom || now >= Date.parse(item.availableFrom))
    && (!item.availableUntil || now < Date.parse(item.availableUntil));
}
function sanitizeCart(value){
  const clean = {};
  if(!value || typeof value !== 'object' || Array.isArray(value)) return clean;
  for(const [id, entry] of Object.entries(value)){
    const item = MENU.find(product => product.id === id);
    if(!item || !isWithinAvailability(item) || item.soldOut || item.comingSoon || HIDDEN_CATS.includes(item.cat) || HIDDEN_ITEM_IDS.includes(item.id) || !entry || typeof entry !== 'object') continue;
    if(!Number.isInteger(entry.qty) || entry.qty < 1) continue;
    clean[id] = {
      qty:Math.min(itemQuantityLimit(item), entry.qty), note:typeof entry.note === 'string' ? entry.note.slice(0,500) : '',
      milk:item.milk && ['almendra','avena'].includes(entry.milk) ? entry.milk : '',
      scoop:item.scoop && entry.scoop === 'si' ? 'si' : '',
      syrup:item.syrupOption?.includes(entry.syrup) ? entry.syrup : ''
    };
  }
  return clean;
}

// Conserva el pedido si la persona actualiza o cierra accidentalmente la página.
try {
  const draft = JSON.parse(localStorage.getItem('clowder_order_draft') || 'null');
  if(draft){
    cart = sanitizeCart(draft.cart);
    mode = ['mesa','llevar','delivery'].includes(draft.mode) ? draft.mode : '';
    payMethod = ['efectivo','transferencia'].includes(draft.payMethod) ? draft.payMethod : '';
    paymentBank = PAYMENT_BANKS.includes(draft.paymentBank) ? draft.paymentBank : '';
    orderReceiptKey = /^[a-f0-9]{64}$/.test(draft.orderReceiptKey || '') ? draft.orderReceiptKey : '';
    deliveryLocationUrl = typeof draft.deliveryLocationUrl === 'string' && /^https:\/\/www\.google\.com\/maps\?q=-?[\d.]+,-?[\d.]+$/.test(draft.deliveryLocationUrl) ? draft.deliveryLocationUrl : '';
  }
} catch(e) {}

function persistOrderDraft(){
  try {
    localStorage.setItem('clowder_order_draft', JSON.stringify({
      cart, mode, payMethod, paymentBank, orderReceiptKey, deliveryLocationUrl, orderCode:currentOrderCode,
          customerName: document.getElementById('customerName')?.value || '',
          cashAmount: document.getElementById('cashAmount')?.value || '',
          deliveryManzana: document.getElementById('deliveryManzana')?.value || '',
      deliveryVilla: document.getElementById('deliveryVilla')?.value || ''
    }));
  } catch(e) {}
}

let catsCollapsed = true; // arranca enfocada en la categoría de entrada, sin la lista completa
function renderCats(){
  const el = document.getElementById('cats');
  if(catsCollapsed){
    // La pastilla activa funciona como acceso para volver a la lista completa.
    el.innerHTML = '';
    return;
  }
  el.innerHTML = visibleCats().map(c => {
    const active = c===activeCat;
    const color = catColor(c);
    const isPromo = c === 'Bebida del Mes' || c === 'Combos';
    // Todas llevan su color: la lista solo se ve al elegir, así que no hay
    // riesgo de confundir cuál está seleccionada.
    // La activa va con el color pleno; las demás con una versión suave del mismo.
    const style = active
      ? `style="background:${color}; border-color:${color}; color:${textColorFor(color)};"`
      : `style="background:${lighten(color,0.62)}; border-color:${lighten(color,0.25)}; color:#3a3229;"`;
    return `<button class="cat-btn ${active?'active':''} ${isPromo?'cat-btn-promo':''}" ${style} onclick="selectCat('${c}')"><span class="cat-dot" style="background:${active?textColorFor(color):color}"></span>${c}</button>`;
  }).join('');
}
function syncHeaderCompact(){
  const stickyTop = document.querySelector('.sticky-top');
  if(!stickyTop) return;
  stickyTop.classList.toggle('compact', catsCollapsed);
  const titleEl = document.getElementById('compactCatTitle');
  if(titleEl){
    if(catsCollapsed){
      const color = catColor(activeCat);
      const textColor = textColorFor(color);
      titleEl.style.background = color;
      titleEl.style.borderColor = color;
      titleEl.style.color = textColor;
      titleEl.innerHTML = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><polyline points="15 18 9 12 15 6"/></svg><span class="cat-dot" style="background:${textColor}"></span><span style="overflow:hidden;text-overflow:ellipsis;white-space:nowrap">${activeCat}</span>`;
      titleEl.onclick = expandCats;
      titleEl.setAttribute('role','button');
      titleEl.setAttribute('tabindex','0');
      titleEl.setAttribute('aria-label','Ver todas las categorías');
    } else {
      titleEl.style.background = '';
      titleEl.style.borderColor = '';
      titleEl.style.color = '';
      titleEl.innerHTML = '';
      titleEl.onclick = null;
      titleEl.removeAttribute('role');
      titleEl.removeAttribute('tabindex');
      titleEl.removeAttribute('aria-label');
    }
  }
}
function expandCats(){
  catsCollapsed = false;
  renderCats();
  renderMenu();
  syncHeaderCompact();
  // Al volver a la vista general, enfoca la categoría que estaba activa.
  const catsRow = document.getElementById('cats');
  const activeBtn = catsRow && catsRow.querySelector('.cat-btn.active');
  if(catsRow && activeBtn){
    requestAnimationFrame(() => {
      const target = activeBtn.offsetLeft - (catsRow.clientWidth - activeBtn.offsetWidth) / 2;
      const maxScroll = Math.max(0, catsRow.scrollWidth - catsRow.clientWidth);
      catsRow.scrollTo({ left: Math.max(0, Math.min(target, maxScroll)), behavior:'smooth' });
    });
  }
}
function selectCat(c){
  activeCat = c;
  catsCollapsed = true;
  renderCats();
  renderMenu();
  syncHeaderCompact();
}

const FLAVOR_COLORS = {
  'Salted Caramel': '#C68642',
  'Nutella + Brownie Bites': '#4A2C17',
  'Fresa': '#E8536B',
  'Regular': '#D8C9A3',
  'Grande': '#B5542C',
  'Búfala': '#E8D9B0',
  'Queso': '#F2E5A1',
  'Pollo': '#C9A876',
  'Pizza': '#C0392B',
  'Zanahoria': '#D2691E',
  'Banana': '#F0D264',
  'Naranja': '#E8842D',
};
function textColorFor(hex){
  const r = parseInt(hex.slice(1,3),16), g = parseInt(hex.slice(3,5),16), b = parseInt(hex.slice(5,7),16);
  const luminance = (0.299*r + 0.587*g + 0.114*b) / 255;
  return luminance > 0.55 ? '#1a1310' : '#faf6ec';
}
function arrowSvg(color){
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="${color}" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><polyline points="6 9 12 15 18 9"/></svg>`;
  return `url('data:image/svg+xml,${encodeURIComponent(svg)}')`;
}

const GROUP_NAMES = {
  'milkishaki': 'MilkiShaki',
  'tocipapa': 'Tocipapa',
  'wachipapa': 'Wachipapa',
  'empanada': 'Empanada de Hojaldre',
  'cake-grande': 'Cake Grande',
};
let groupView = {}; // group -> currently displayed variant id

function selectVariant(group, id){
  groupView[group] = id;
  renderMenu();
}

// Un recurso ausente no debe dejar un ícono roto ni un banner vacío.
document.addEventListener('error', event => {
  const img = event.target;
  if(!(img instanceof HTMLImageElement)) return;
  if(img.closest('.cat-banner')) img.closest('.cat-banner').remove();
  else if(img.classList.contains('item-thumb')) img.hidden = true;
}, true);

function renderMenu(){
  const today = businessTime().day;
  const items = MENU.filter(i=>i.cat===activeCat && !HIDDEN_ITEM_IDS.includes(i.id) && isWithinAvailability(i));
  const seenGroups = new Set();
  const display = [];
  items.forEach(i=>{
    if(i.group){
      if(seenGroups.has(i.group)) return;
      seenGroups.add(i.group);
      const variants = MENU.filter(m=>m.group===i.group);
      const currentId = groupView[i.group] || variants[0].id;
      const current = variants.find(v=>v.id===currentId) || variants[0];
      display.push(Object.assign({}, current, {__group:i.group, __variants:variants, __isGroup:true, __sortPrice: variants[0].price}));
    } else {
      display.push(i);
    }
  });

  display.sort((a,b)=>{
    const aFeatured = a.featured ? 0 : 1;
    const bFeatured = b.featured ? 0 : 1;
    if(aFeatured !== bFeatured) return aFeatured - bFeatured;
    // Orden manual explícito (menor primero); si un producto no lo define, se ordena por precio
    const aOrder = a.order !== undefined ? a.order : 999;
    const bOrder = b.order !== undefined ? b.order : 999;
    if(aOrder !== bOrder) return aOrder - bOrder;
    const aPrice = a.__sortPrice !== undefined ? a.__sortPrice : a.price;
    const bPrice = b.__sortPrice !== undefined ? b.__sortPrice : b.price;
    return aPrice - bPrice;
  });

  const el = document.getElementById('menu');
  const categoryBanners = (CAT_BANNERS[activeCat] || []).filter(b => !b.productId || MENU.some(item => item.id === b.productId && isWithinAvailability(item)));
  const dailyBanner = activeCat === 'Combos' && categoryBanners.find(b=>b.day===today);
  const banners = dailyBanner ? [dailyBanner] : categoryBanners;
  let bannerHtml = '';
  if(banners && banners.length){
    const slides = banners.map(b => `<div class="cat-banner-slide"><img src="${b.img}" alt="${b.alt}" loading="lazy" decoding="async"></div>`).join('');
    const dots = banners.length > 1
      ? `<div class="cat-banner-dots">${banners.map((_,i)=>`<button type="button" class="cat-banner-dot${i===0?' active':''}" aria-label="Ver promoción ${i+1}" aria-current="${i===0?'true':'false'}"></button>`).join('')}</div>`
      : '';
    const controls = banners.length > 1 ? `<div class="cat-banner-controls"><button type="button" class="cat-banner-arrow" data-step="-1" aria-label="Promoción anterior">‹</button>${dots}<button type="button" class="cat-banner-arrow" data-step="1" aria-label="Promoción siguiente">›</button></div>` : '';
    bannerHtml = `<div class="cat-banner"><div class="cat-banner-track" id="catBannerTrack" ${banners.length > 1 ? 'tabindex="0" role="region" aria-label="Promociones: usa las flechas para navegar"' : ''}>${slides}</div>${controls}</div>`;
  }
  const sectionLabelHtml = catsCollapsed ? '' : `<div class="section-label"><span class="cat-dot" style="background:${catColor(activeCat)}"></span>${activeCat}</div>`;
  el.innerHTML = sectionLabelHtml + bannerHtml + display.map(i=>{
    const inCart = cart[i.id];
    const qty = inCart ? inCart.qty : 0;
    const note = inCart ? inCart.note : '';
    const milk = inCart ? (inCart.milk || '') : '';
    const scoop = inCart ? (inCart.scoop || '') : '';
    const syrup = inCart ? (inCart.syrup || '') : '';
    const flavorColor = FLAVOR_COLORS[i.flavor] || '#1a1310';
    const flavorText = textColorFor(flavorColor);
    const closedNow = !i.comingSoon && !i.soldOut && !isItemOrderable(i);
    // Fuera de horario se conserva el precio y se bloquea solo el botón "+".
    // Así la tarjeta no se llena con el estado "Cerrado" repetido.
    const badgeText = i.comingSoon ? (i.comingSoonLabel || 'Próximamente') : (i.soldOut ? 'Agotado' : null);
    const badgeClass = i.comingSoon ? 'coming-soon-price' : (i.soldOut ? 'sold-out-price' : '');
    const unavailableNote = i.comingSoon ? (i.comingSoonNote || 'Todavía no está disponible para pedir.') : (i.soldOut ? 'Se agotó por hoy — vuelve pronto.' : '');
    const variantSelect = i.__isGroup ? `
      <select class="variant-select" style="background-color:${flavorColor}; color:${flavorText}; background-image:${arrowSvg(flavorText)};" onchange="selectVariant('${i.__group}', this.value)">
        ${i.__variants.map(v=>`<option value="${v.id}" ${v.id===i.id?'selected':''}>${v.flavor}</option>`).join('')}
      </select>` : '';
    return `
    <div class="item ${i.featured?'item-featured':''} ${i.cat==='Combos'?'item-combo':''}" style="background:${i.accent ? lighten(i.accent, 0.82) : (isStoreCat(i.cat) ? '#F2EEE6' : pastelBg(i.cat))}; border-left-color:${i.accent || (catColor(i.cat)==='transparent' ? 'var(--line)' : catColor(i.cat))};">
      ${i.featured ? `<div class="featured-ribbon">\u{1F43E} ${i.featuredTag||'Destacado'}</div>` : ''}
      ${i.comingSoon ? `<div class="coming-soon-status">✦ ${badgeText}</div>` : ''}
      <div class="item-top">
        ${(() => { const currentImg = (i.imgScoop && scoop === 'si') ? i.imgScoop : i.img; if (!currentImg) return ''; const image = `<img class="item-thumb" id="thumb-${i.id}" src="${currentImg}" alt="${i.name}" loading="lazy" decoding="async">`; return i.id === 'funbite' ? `<span class="funbite-photo">${image}</span>` : image; })()}
        <div class="item-info">
          <div class="item-name-badge">${i.__isGroup ? GROUP_NAMES[i.__group] : i.name}</div>
          ${i.classic ? `<span class="classic-tag ${i.classicTheme==='fresh'?'classic-tag-fresh':''}">${i.classic}</span>` : ''}
          ${variantSelect}
          ${i.desc ? `<div class="item-desc">${i.desc}</div>` : ''}
          ${i.processTag ? `<div class="process-tag">${i.processTag}</div>` : ''}
        </div>
        ${!i.comingSoon ? `<div class="item-price-col">
          ${i.originalPrice ? `<div class="item-price-was">$${i.originalPrice.toFixed(2)}</div>` : ''}
          <div class="item-price ${badgeClass}">${badgeText ? badgeText : '$'+i.price.toFixed(2)}</div>
        </div>` : ''}
      </div>
      ${i.promoNote ? `<div class="promo-note">${i.promoNote}</div>` : ''}
      ${badgeText ? `
      <div class="coming-soon-note">${unavailableNote}</div>` : `
      <div class="item-controls">
        <div class="stepper">
          <button onclick="changeQty('${i.id}', -1)">–</button>
          <div class="qty" id="qty-${i.id}">${qty}</div>
          <button class="${closedNow?'blocked-add':''}" onclick="changeQty('${i.id}', 1)" aria-label="${closedNow && i.days?itemDayNotice(i):(closedNow?'Ver horarios de atención':'Agregar al pedido')}">+</button>
        </div>
        <button class="note-toggle ${note?'has-note':''}" id="notebtn-${i.id}" onclick="toggleNote('${i.id}')">${note ? '✎ '+escapeHtml(truncate(note)) : '+ nota'}</button>
      </div>
      ${i.milk ? `
      <select class="milk-select" id="milk-${i.id}" onchange="setMilk('${i.id}', this.value)">
        <option value="" ${milk===''?'selected':''}>Leche deslactosada</option>
        <option value="almendra" ${milk==='almendra'?'selected':''}>+ Leche vegetal de almendras, casera (+$0.50)</option>
      </select>` : ''}
      ${i.scoop ? `
      <select class="milk-select" id="scoop-${i.id}" onchange="setScoop('${i.id}', this.value)">
        <option value="" ${scoop===''?'selected':''}>Sin bola de helado</option>
        <option value="si" ${scoop==='si'?'selected':''}>+ Bola de helado de vainilla Madagascar (+$0.75)</option>
      </select>` : ''}
      ${i.syrupOption ? `
      <select class="milk-select" id="syrup-${i.id}" onchange="setSyrup('${i.id}', this.value)">
        <option value="" ${syrup===''?'selected':''}>Sin sirope</option>
        ${i.syrupOption.map(flavorKey => `<option value="${flavorKey}" ${syrup===flavorKey?'selected':''}>+ Sirope de ${SYRUP_LABELS[flavorKey]} (+$0.50)</option>`).join('')}
      </select>` : ''}
      <textarea class="note-input" id="note-${i.id}" rows="2" placeholder="Ej: sin cebolla, para llevar aparte..." maxlength="500" oninput="saveNote('${i.id}', this.value)">${escapeHtml(note)}</textarea>`}
    </div>`;
  }).join('');
  initBannerSlider();
}
// El tacto conserva el scroll nativo; el mouse permite agarrar la pista.
function enableMouseDrag(track, onRelease){
  if(track.dataset.mouseDrag) return;
  track.dataset.mouseDrag = 'true';
  let drag = null;
  let suppressClick = false;
  track.addEventListener('dragstart', event => event.preventDefault());
  track.addEventListener('pointerdown', event => {
    if(event.pointerType !== 'mouse' || event.button !== 0 || track.scrollWidth <= track.clientWidth) return;
    suppressClick = false;
    drag = {id:event.pointerId, x:event.clientX, left:track.scrollLeft, moved:false};
  });
  track.addEventListener('pointermove', event => {
    if(!drag || event.pointerId !== drag.id) return;
    const distance = event.clientX - drag.x;
    if(!drag.moved && Math.abs(distance) < 5) return;
    if(!drag.moved){
      drag.moved = true;
      track.classList.add('mouse-dragging');
      track.setPointerCapture(event.pointerId);
    }
    event.preventDefault();
    track.scrollLeft = drag.left - distance;
  });
  function finish(event){
    if(!drag || event.pointerId !== drag.id) return;
    const moved = drag.moved;
    const left = track.scrollLeft;
    drag = null;
    suppressClick = moved;
    track.classList.remove('mouse-dragging');
    if(track.hasPointerCapture(event.pointerId)) track.releasePointerCapture(event.pointerId);
    if(moved && onRelease) onRelease(left);
  }
  track.addEventListener('pointerup', finish);
  track.addEventListener('pointercancel', finish);
  track.addEventListener('lostpointercapture', finish);
  track.addEventListener('pointerleave', event => {if(drag && !drag.moved) finish(event);});
  track.addEventListener('click', event => {
    if(!suppressClick) return;
    event.preventDefault();
    event.stopImmediatePropagation();
    suppressClick = false;
  }, true);
}
function initBannerSlider(){
  const track = document.getElementById('catBannerTrack');
  if(!track) return;
  const dots = track.parentElement.querySelectorAll('.cat-banner-dot');
  if(!dots.length) return;
  const arrows = track.parentElement.querySelectorAll('.cat-banner-arrow');
  const step = () => track.children[1].offsetLeft - track.children[0].offsetLeft;
  const index = () => Math.round(track.scrollLeft / step());
  const goTo = i => track.scrollTo({left:Math.max(0, Math.min(dots.length-1, i)) * step(), behavior:matchMedia('(prefers-reduced-motion: reduce)').matches ? 'instant' : 'smooth'});
  enableMouseDrag(track, left => goTo(Math.round(left / step())));
  dots.forEach((dot, i) => dot.addEventListener('click', () => goTo(i)));
  arrows.forEach(button => button.addEventListener('click', () => goTo(index() + Number(button.dataset.step))));
  track.addEventListener('keydown', event => {
    if(!['ArrowLeft','ArrowRight','Home','End'].includes(event.key)) return;
    event.preventDefault();
    goTo(event.key === 'Home' ? 0 : event.key === 'End' ? dots.length-1 : index() + (event.key === 'ArrowRight' ? 1 : -1));
  });
  function sync(){
    const idx = index();
    dots.forEach((dot,i) => {
      dot.classList.toggle('active', i === idx);
      dot.setAttribute('aria-current', String(i === idx));
    });
    arrows[0].disabled = idx === 0;
    arrows[1].disabled = idx === dots.length-1;
  }
  track.addEventListener('scroll', sync, {passive:true});
  sync();
}
function truncate(s){ return s.length>18 ? s.slice(0,18)+'…' : s; }

function unitPrice(id){
  const item = MENU.find(m=>m.id===id);
  let p = item.price;
  if(cart[id] && cart[id].milk) p += 0.5;
  if(cart[id] && cart[id].scoop) p += 0.75;
  if(cart[id] && cart[id].syrup) p += 0.50;
  return Math.round(p * 100) / 100;
}
function productLabel(item){
  return ['wachipapa','tocipapa'].includes(item.group) ? `${item.name} · ${item.flavor}` : item.name;
}
function validCash(total){
  const input = document.getElementById('cashAmount');
  return !!input && input.value.trim() !== '' && input.validity.valid && Number.isFinite(Number(input.value)) && Math.round(Number(input.value) * 100) >= Math.round(total * 100);
}
function canAddItem(id){
  const item = MENU.find(product => product.id === id);
  if(!item || !isWithinAvailability(item) || item.soldOut || item.comingSoon || HIDDEN_CATS.includes(item.cat)) return false;
  if(!isItemOrderable(item)){ showUnavailableNotice(id); return false; }
  return true;
}
function changeQty(id, delta){
  if(delta > 0 && !canAddItem(id)) return;
  const current = cart[id]?.qty || 0;
  const item = MENU.find(product => product.id === id);
  const limit = itemQuantityLimit(item);
  if(delta > 0 && current >= limit){
    if(limit < MAX_QTY) alert(`Solo quedan ${limit} unidades de este producto.`);
    else openBigOrder();
    return;
  }
  const next = Math.min(limit, Math.max(0, current + delta));
  if(next===0){ delete cart[id]; }
  else { cart[id] = { qty: next, note: cart[id]?.note || '', milk: cart[id]?.milk || '', scoop: cart[id]?.scoop || '', syrup: cart[id]?.syrup || '' }; }
  const qtyEl = document.getElementById('qty-'+id);
  if(qtyEl) qtyEl.textContent = next;
  if(next === 0) renderMenu();
  updateBars();
}
function openBigOrder(){
  const el = document.getElementById('bigOrderOverlay');
  if(el) el.classList.add('open');
}
function closeBigOrder(){
  const el = document.getElementById('bigOrderOverlay');
  if(el) el.classList.remove('open');
}

function setMilk(id, value){
  if(!canAddItem(id)){ renderMenu(); return; }
  if(!cart[id] && !value) return;
  if(cart[id]) cart[id].milk = value;
  else { cart[id] = { qty:1, note:'', milk: value, scoop:'', syrup:'' }; const qtyEl = document.getElementById('qty-'+id); if(qtyEl) qtyEl.textContent = 1; }
  updateBars();
}

// Nombres simples del sirope, para quien no sabe qué es "hazelnut" o "salted caramel"
const SYRUP_LABELS = {
  'vainilla-francesa': 'vainilla francesa',
  'avellana': 'avellana',
  'caramelo-salado': 'caramelo salado',
  'caramelo': 'caramelo',
  'vainilla': 'vainilla',
};

function setSyrup(id, value){
  if(!canAddItem(id)){ renderMenu(); return; }
  if(!cart[id] && !value) return;
  if(cart[id]) cart[id].syrup = value;
  else { cart[id] = { qty:1, note:'', milk:'', scoop:'', syrup: value }; const qtyEl = document.getElementById('qty-'+id); if(qtyEl) qtyEl.textContent = 1; }
  updateBars();
}

function setScoop(id, value){
  if(value && (!ICE_CREAM_AVAILABLE || !MENU.find(item => item.id === id)?.scoop)) return;
  if(!canAddItem(id)){ renderMenu(); return; }
  if(!cart[id] && !value) return;
  if(cart[id]) cart[id].scoop = value;
  else { cart[id] = { qty:1, note:'', milk:'', scoop: value, syrup:'' }; const qtyEl = document.getElementById('qty-'+id); if(qtyEl) qtyEl.textContent = 1; }
  // Si el producto tiene una foto especial para cuando lleva helado (ej. Apple Crumble Cake),
  // la cambiamos al vuelo con un pequeño fundido, en vez de esperar a un re-render completo.
  const item = MENU.find(m=>m.id===id);
  const thumb = document.getElementById('thumb-'+id);
  if(item && item.imgScoop && thumb){
    const nextSrc = value === 'si' ? item.imgScoop : item.img;
    thumb.style.opacity = '0';
    setTimeout(() => { thumb.src = nextSrc; thumb.style.opacity = '1'; }, 150);
  }
  updateBars();
}

function removeExtra(id, type){
  if(!cart[id]) return;
  cart[id][type] = '';
  renderMenu();
  updateBars();
}

function toggleNote(id){
  const box = document.getElementById('note-'+id);
  box.classList.toggle('open');
  if(box.classList.contains('open')) box.focus();
}
function saveNote(id, val){
  if(!canAddItem(id)){ renderMenu(); return; }
  val = val.slice(0,500);
  if(cart[id]) cart[id].note = val.trim();
  else if(val.trim()){ cart[id] = { qty:1, note: val.trim(), milk:'', scoop:'', syrup:'' }; const qtyEl = document.getElementById('qty-'+id); if(qtyEl) qtyEl.textContent = 1; }
  const btn = document.getElementById('notebtn-'+id);
  if(btn){
    if(val.trim()){ btn.textContent = '✎ '+truncate(val.trim()); btn.classList.add('has-note'); }
    else { btn.textContent = '+ nota'; btn.classList.remove('has-note'); }
  }
  updateBars();
}

function cartCount(){ return Object.values(cart).reduce((a,c)=>a+c.qty,0); }
function cartTotal(){
  return Object.entries(cart).reduce((sum,[id,c])=>{
    return sum + Math.round(unitPrice(id) * 100) * c.qty;
  },0) / 100;
}
const DRINK_CATS = ['Bebidas Calientes','Bebidas Frías','Matcha'];
const SNACK_CATS = ['Snack Sal','Snack Dulce'];
// Categorías de tienda: no se preparan, no llevan empaque de comida
const STORE_CATS = ['Congelados y Más','Merch Clowder'];
function isStoreCat(c){ return STORE_CATS.includes(c); }

// Wachi y Toci requieren el horario de cocina; el resto conserva su disponibilidad.
const KITCHEN_HOURS_ITEM_IDS = MENU.filter(item => ['wachipapa', 'tocipapa'].includes(item.group)).map(item => item.id);
const FULL_MENU_ORDERING_ENABLED = true; // Permite pedidos fuera del horario habitual.
const ALWAYS_OPEN_CATS = ['Bebidas Calientes', 'Congelados y Más', 'Combos'];
const ALWAYS_OPEN_GROUPS = ['empanada']; // se puede pedir a cualquier hora, sin importar su categoría
function isMenuOpenNow(){
  const now = businessTime();
  const day = now.day;
  const mins = now.hour*60 + now.minute;
  if(day === 0) return mins >= (18*60+30) && mins <= (22*60+30);
  return mins >= (19*60) && mins <= (23*60);
}
function isDeliveryAvailableNow(){
  return true; // Delivery habilitado permanentemente, sin restricciones de horario.
}
function validAddressField(el){
  return !!el && el.value.trim() !== '' && el.validity.valid && Number.isInteger(Number(el.value)) && Number(el.value) >= 0;
}
function deliveryAddressOk(){
  return ['deliveryManzana','deliveryVilla'].every(id => validAddressField(document.getElementById(id)));
}
function shareLocation(){
  const status = document.getElementById('locationStatus');
  if(!navigator.geolocation){
    if(status) status.textContent = 'Este navegador no permite compartir ubicación.';
    return;
  }
  const requestVersion = ++locationRequestVersion;
  if(status) status.textContent = 'Buscando tu ubicación…';
  navigator.geolocation.getCurrentPosition(pos => {
    if(requestVersion !== locationRequestVersion) return;
    const { latitude, longitude } = pos.coords;
    deliveryLocationUrl = `https://www.google.com/maps?q=${latitude},${longitude}`;
    if(status) status.textContent = 'Ubicación lista. También puedes completar Manzana y Villa.';
    persistOrderDraft();
  }, () => {
    if(requestVersion !== locationRequestVersion) return;
    if(status) status.textContent = 'No pudimos obtenerla. Revisa el permiso o usa Manzana y Villa.';
  }, { enableHighAccuracy:true, timeout:10000, maximumAge:60000 });
}
function isItemOrderable(item){
  if(birthdayState().closed) return false;
  if(!isWithinAvailability(item) || item.soldOut || item.comingSoon || HIDDEN_CATS.includes(item.cat) || HIDDEN_ITEM_IDS.includes(item.id)) return false;
  if(item.days && !item.days.includes(businessTime().day)) return false;
  if(KITCHEN_HOURS_ITEM_IDS.includes(item.id)) return isMenuOpenNow();
  if(FULL_MENU_ORDERING_ENABLED) return true;
  if(ALWAYS_OPEN_CATS.includes(item.cat)) return true;
  if(ALWAYS_OPEN_GROUPS.includes(item.group || item.__group)) return true;
  return isMenuOpenNow();
}

const PREP_TIME = {
  'Bebida del Mes': [5, 10],
  'Bebidas Calientes': [5, 10],
  'Bebidas Frías': [5, 10],
  'Matcha': [5, 10],
  'Snack Dulce': [5, 10],
  'Snack Sal': [15, 25],
  'Combos': [8, 15],
};

function estimatedPrepTime(){
  const work = new Map();
  Object.entries(cart).forEach(([id, entry])=>{
    const item = MENU.find(m=>m.id===id);
    const range = item && (item.id === 'empanada-pollo' ? [10, 15] : PREP_TIME[item.cat]);
    if(!range) return;
    const current = work.get(item.cat) || {range, qty:0, empanadaQty:0};
    current.range = [Math.max(current.range[0], range[0]), Math.max(current.range[1], range[1])];
    if(item.group === 'empanada') current.empanadaQty += entry.qty;
    else current.qty += entry.qty;
    work.set(item.cat, current);
  });
  if(!work.size) return null;

  // Una sola persona prepara el pedido: las categorías distintas suman trabajo;
  // Hasta 4 empanadas comparten el tiempo base; desde la quinta se suman 5 minutos.
  // Los demás productos conservan su margen por unidades adicionales.
  const parts = [...work.values()].sort((a,b)=>b.range[1]-a.range[1]);
  let min = parts[0].range[0];
  let max = parts[0].range[1];
  parts.slice(1).forEach(({range})=>{
    min += range[0];
    max += range[1];
  });
  const extraUnits = [...work.values()].reduce((sum, part)=>sum + Math.max(0, part.qty - (part.empanadaQty ? 0 : 1)), 0);
  min += Math.min(10, extraUnits * 2);
  max += Math.min(15, extraUnits * 3);
  const empanadaQty = [...work.values()].reduce((sum, part)=>sum + part.empanadaQty, 0);
  if(empanadaQty >= 5){ min += 5; max += 5; }
  return [min, max];
}

function packagingReasons(){
  if(mode!=='llevar') return [];
  const reasons = [];
  const hasOtherSnack = Object.keys(cart).some(id=>{
    const item = MENU.find(m=>m.id===id);
    return item && SNACK_CATS.includes(item.cat) && item.group !== 'empanada';
  });
  const empanadaQty = Object.entries(cart).reduce((sum,[id,c])=>{
    const item = MENU.find(m=>m.id===id);
    return sum + (item && item.group === 'empanada' ? c.qty : 0);
  },0);
  if(hasOtherSnack || empanadaQty >= 3) reasons.push({label:'empaque', fee:0.5});
  const drinkQty = Object.entries(cart).reduce((sum,[id,c])=>{
    const item = MENU.find(m=>m.id===id);
    return sum + (item && DRINK_CATS.includes(item.cat) ? c.qty : 0);
  },0);
  if(drinkQty > 1) reasons.push({label:'portavasos', fee:0.25});
  return reasons;
}
function packagingFee(){ return packagingReasons().reduce((s,r)=>s+r.fee,0); }
function grandTotal(){ return Math.round((cartTotal() + packagingFee()) * 100) / 100; }

function updateBars(){
  if(mode === 'delivery' && !isDeliveryAvailableNow()) mode = '';
  [['btnMesa',mode === 'mesa'],['btnLlevar',mode === 'llevar'],['btnDelivery',mode === 'delivery'],
   ['btnEfectivo',payMethod === 'efectivo'],['btnTransfer',payMethod === 'transferencia']].forEach(([id,active]) => {
    const button = document.getElementById(id);
    button.classList.toggle('active', active);
    button.setAttribute('aria-pressed', String(active));
  });
  persistOrderDraft();
  const count = cartCount();
  const total = grandTotal();
  document.getElementById('cartCount').textContent = count;
  document.getElementById('cartTotal').textContent = '$'+total.toFixed(2);
  document.getElementById('drawerTotal').textContent = '$'+total.toFixed(2);
  const cartbarEl = document.getElementById('cartbar');
  cartbarEl.classList.toggle('show', count>0);
  cartbarEl.tabIndex = count > 0 ? 0 : -1;
  cartbarEl.setAttribute('aria-hidden', String(count === 0));
  // Pulsa cada vez que se agrega algo (no al quitar)
  if(count > 0 && count > lastCartCount){
    cartbarEl.classList.remove('pulse');
    void cartbarEl.offsetWidth; // reinicia la animación
    cartbarEl.classList.add('pulse');
  }
  if(count === 0) cartbarEl.classList.remove('pulse');
  lastCartCount = count;

  // Si el carrito es solo de Congelados/Merch (retiro o envío coordinado), "para servir/llevar"
  // no tiene sentido: se esconde el selector y no se exige para poder enviar el pedido.
  const cartIds = Object.keys(cart);
  const storeOnly = cartIds.length > 0 && cartIds.every(id => {
    const item = MENU.find(m=>m.id===id);
    return item && STORE_CATS.includes(item.cat);
  });
  document.getElementById('modeFieldWrap').style.display = storeOnly ? 'none' : 'block';
  const deliveryBtn = document.getElementById('btnDelivery');
  const deliveryHint = document.getElementById('deliveryHint');
  const deliveryFields = document.getElementById('deliveryFields');
  // Si quedó guardado un delivery de una sesión anterior y ya pasó el horario,
  // vuelve al estado neutro sin borrar el resto del pedido.
  if(mode === 'delivery' && !isDeliveryAvailableNow()) mode = '';
  const deliveryActive = mode === 'delivery';
  if(deliveryBtn){
    const unavailable = !isDeliveryAvailableNow();
    deliveryBtn.disabled = false;
    deliveryBtn.classList.toggle('unavailable', unavailable);
    deliveryBtn.setAttribute('aria-disabled', unavailable ? 'true' : 'false');
    deliveryBtn.title = unavailable ? 'Delivery no disponible.' : 'Delivery habilitado todos los días, sin restricción de horario.';
  }
  if(deliveryHint) deliveryHint.classList.toggle('open', deliveryActive);
  if(deliveryFields) deliveryFields.classList.toggle('open', deliveryActive);
  const manzanaEl = document.getElementById('deliveryManzana');
  const villaEl = document.getElementById('deliveryVilla');
  const deliveryValidation = document.getElementById('deliveryValidation');
  const manzanaOk = validAddressField(manzanaEl);
  const villaOk = validAddressField(villaEl);
  if(manzanaEl) manzanaEl.classList.toggle('field-missing', deliveryActive && !manzanaOk);
  if(villaEl) villaEl.classList.toggle('field-missing', deliveryActive && !villaOk);
  if(manzanaEl) manzanaEl.setAttribute('aria-invalid', deliveryActive && !manzanaOk ? 'true' : 'false');
  if(villaEl) villaEl.setAttribute('aria-invalid', deliveryActive && !villaOk ? 'true' : 'false');
  if(deliveryValidation) deliveryValidation.classList.toggle('open', deliveryActive && (!manzanaOk || !villaOk));

  const cashAmountEl = document.getElementById('cashAmount');
  const cashActive = payMethod === 'efectivo';
  document.getElementById('bankField').hidden = payMethod !== 'transferencia';
  document.getElementById('paymentBank').value = paymentBank;
  const bankOk = payMethod !== 'transferencia' || PAYMENT_BANKS.includes(paymentBank);
  const cashOk = !cashActive || validCash(total);
  const cashChange = document.getElementById('cashChange');
  if(cashChange) cashChange.classList.toggle('open', cashActive);
  if(cashAmountEl) cashAmountEl.classList.toggle('field-missing', cashActive && !cashOk);
  const cashChangeText = document.getElementById('cashChangeText');
  if(cashChangeText){
    const amount = Number(cashAmountEl?.value || 0);
    cashChangeText.textContent = cashActive && amount >= total
      ? `Cambio: $${(amount - total).toFixed(2)}`
      : (cashActive && amount > 0 ? `Debe cubrir $${total.toFixed(2)}` : '');
  }

  const nameOk = (document.getElementById('customerName')?.value || '').trim().length > 0;
  const nameField = document.getElementById('customerName');
  if(nameField) nameField.classList.toggle('field-missing', !nameOk && count > 0);
  const modeOk = storeOnly || mode !== '';
  const addressOk = mode !== 'delivery' || deliveryAddressOk();
  const deliveryOk = mode !== 'delivery' || isDeliveryAvailableNow();
  const listo = count > 0 && nameOk && modeOk && addressOk && deliveryOk && payMethod !== '' && cashOk && bankOk;
  ['btnMesa','btnLlevar'].forEach(id => {
    const el = document.getElementById(id);
    if(el) el.classList.toggle('option-missing', count > 0 && !storeOnly && !modeOk);
  });
  ['btnEfectivo','btnTransfer'].forEach(id => {
    const el = document.getElementById(id);
    if(el) el.classList.toggle('option-missing', count > 0 && payMethod === '');
  });
  document.getElementById('sendBtn').disabled = !listo || birthdayState().closed || sendingOrder;
  const hint = document.getElementById('sendHint');
  if(hint){
    const faltan = [];
    if(count === 0) faltan.push('tu pedido');
    if(!nameOk) faltan.push('tu nombre');
    if(!modeOk) faltan.push('cómo recibes tu pedido');
    if(mode === 'delivery' && !deliveryOk) faltan.push('delivery disponible');
    if(mode === 'delivery' && deliveryOk && !addressOk) faltan.push('manzana y villa');
    if(payMethod === '') faltan.push('cómo pagas');
    if(!bankOk) faltan.push('el banco al que transfieres');
    if(cashActive && !cashOk) faltan.push('con cuánto pagas');
    if(faltan.length){
      const lista = faltan.length === 1
        ? faltan[0]
        : faltan.slice(0,-1).join(', ') + ' y ' + faltan[faltan.length-1];
      hint.textContent = 'Para continuar, completa ' + lista + '.';
      hint.style.display = 'block';
    } else {
      hint.innerHTML = '';
      hint.style.display = 'none';
    }
  }

  const reasons = packagingReasons();
  const pkgLine = document.getElementById('packagingLine');
  if(reasons.length===0){
    pkgLine.style.display = 'none';
  } else {
    pkgLine.style.display = 'block';
    pkgLine.textContent = reasons.map(r => `+ $${r.fee.toFixed(2)} ${r.label}`).join(' · ');
  }

  const prepTime = estimatedPrepTime();
  const prepLine = document.getElementById('prepTimeLine');
  if(!prepTime){
    prepLine.style.display = 'none';
  } else {
    prepLine.style.display = 'flex';
    const deliveryExtra = mode === 'delivery' ? ` + <strong>5 min entrega</strong>` : '';
    prepLine.innerHTML = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="9"/><polyline points="12 7 12 12 16 14"/></svg><span><strong>${prepTime[0]}–${prepTime[1]} min</strong> preparación${deliveryExtra}</span>`;
  }

  renderCartList();
}

function renderCartList(){
  const el = document.getElementById('cartList');
  const entries = Object.entries(cart);
  if(entries.length===0){
    el.innerHTML = `<div class="empty-cart">
      <img src="assets/image-09bd87cf7012da0b.png" alt="Clowder">
      Todavía no agregas nada
    </div>`;
    return;
  }
  el.innerHTML = entries.map(([id,c])=>{
    const item = MENU.find(m=>m.id===id);
    const baseTotal = item.price * c.qty;
    const extrasTotal = (unitPrice(id) - item.price) * c.qty;
    const modifierChips = [];
    if(c.milk) modifierChips.push(`<span class="modifier-chip">Leche vegetal (${c.milk === 'almendra' ? 'almendra' : 'avena'}) <strong>+$0.50</strong><button aria-label="Quitar leche vegetal" onclick="removeExtra('${id}','milk')">×</button></span>`);
    if(c.scoop) modifierChips.push(`<span class="modifier-chip">Bola de helado <strong>+$0.75</strong><button aria-label="Quitar bola de helado" onclick="removeExtra('${id}','scoop')">×</button></span>`);
    if(c.syrup) modifierChips.push(`<span class="modifier-chip">Sirope de ${SYRUP_LABELS[c.syrup]} <strong>+$0.50</strong><button aria-label="Quitar sirope" onclick="removeExtra('${id}','syrup')">×</button></span>`);
    const priceHtml = extrasTotal > 0.001
      ? `<div class="price-breakdown"><div><span>Precio base</span><b>$${baseTotal.toFixed(2)}</b></div><div><span>Extras</span><b>+$${extrasTotal.toFixed(2)}</b></div></div><strong class="price-total">Total $${(baseTotal + extrasTotal).toFixed(2)}</strong>`
      : `$${baseTotal.toFixed(2)}`;
    return `
    <div class="cart-row">
      <div class="info">
        <div class="n">${c.qty}x ${escapeHtml(productLabel(item))}</div>
        ${modifierChips.length ? `<div class="cart-modifiers">${modifierChips.join('')}</div>` : ''}
        ${c.note ? `<div class="note">nota: ${escapeHtml(c.note)}</div>` : ''}
        <button class="rm" onclick="changeQty('${id}', -${c.qty})">Quitar producto</button>
      </div>
      <div class="price">${priceHtml}</div>
    </div>`;
  }).join('');
}

document.getElementById('cartbar').addEventListener('click', openCart);
document.addEventListener('keydown', event => {
  if((event.key === 'Enter' || event.key === ' ') && event.target.matches('[role="button"]')){
    event.preventDefault(); event.target.click();
  }
  if(event.key === 'Escape') document.querySelectorAll('.overlay.open').forEach(el => el.classList.remove('open'));
});
function openCart(){ document.getElementById('overlay').classList.add('open'); }
function closeCart(){ document.getElementById('overlay').classList.remove('open'); }

const BANKS = [
  { name: "Banco Pichincha",    number: "2202483405",  color: "#FAEF9A" },
  { name: "Banco Guayaquil",    number: "0017821771",  color: "#CC835A" },
  { name: "Produbanco",         number: "20000238765", color: "#3F854A" },
  { name: "Bolivariano",        number: "0841307487",  color: "#D5C8DF" },
  { name: "Banco del Pacífico", number: "1053591925",  color: "#B6DAEA" },
];
let currentAccountNumber = '';

function renderBanks(){
  const el = document.getElementById('banksList');
  el.innerHTML = BANKS.map((b,i) => `
    <div class="bank-row" role="button" tabindex="0" onclick="selectBank(${i})" id="bankRow-${i}">
      <span class="bank-dot" style="background:${b.color}"></span>
      <span>${b.name}</span>
    </div>`).join('');
}
function selectBank(i){
  const bank = BANKS[i];
  document.querySelectorAll('.bank-row').forEach(el => el.classList.remove('active'));
  document.getElementById('bankRow-'+i).classList.add('active');
  document.getElementById('bankAccountNumber').textContent = bank.number;
  currentAccountNumber = bank.number;
  document.getElementById('bankDetails').classList.add('open');
  const btn = document.getElementById('copyAccountBtn');
  btn.textContent = 'Copiar número';
}
function copyAccountNumber(){
  if(!currentAccountNumber) return;
  const btn = document.getElementById('copyAccountBtn');
  const done = () => { btn.textContent = '¡Copiado!'; setTimeout(()=>{ btn.textContent = 'Copiar número'; }, 1800); };
  if(navigator.clipboard && navigator.clipboard.writeText){
    navigator.clipboard.writeText(currentAccountNumber).then(done).catch(() => { btn.textContent = 'No se pudo copiar. Selecciona el número.'; });
  } else {
    const ta = document.createElement('textarea');
    ta.value = currentAccountNumber;
    document.body.appendChild(ta);
    ta.select();
    let copied = false;
    try { copied = document.execCommand('copy'); } catch(e) {}
    document.body.removeChild(ta);
    if(copied) done();
    else btn.textContent = 'No se pudo copiar. Selecciona el número.';
  }
}
function openPayments(){
  renderBanks();
  document.getElementById('bankDetails').classList.remove('open');
  document.getElementById('paymentsOverlay').classList.add('open');
}
function closePayments(){ document.getElementById('paymentsOverlay').classList.remove('open'); }

function openGuide(){ document.getElementById('guideOverlay').classList.add('open'); }
function closeGuide(){
  document.getElementById('guideOverlay').classList.remove('open');
  try { localStorage.setItem('clowder_seen_guide', '1'); } catch(e) {}
}
(function(){
  try {
    if(!localStorage.getItem('clowder_seen_guide')){
      setTimeout(openGuide, 500);
    }
  } catch(e) {}
})();

const DEFAULT_HOURS_TITLE = 'Horarios de atención';
const DEFAULT_HOURS_NOTICE = 'Ahora estamos fuera del horario del menú completo. Puedes revisar los horarios y volver a pedir cuando esté disponible.';
function openHours(title = DEFAULT_HOURS_TITLE, notice = DEFAULT_HOURS_NOTICE){
  document.getElementById('hoursTitle').textContent = title;
  document.getElementById('hoursNotice').textContent = notice;
  document.getElementById('hoursOverlay').classList.add('open');
}
function showClosedNotice(){ openHours(); }
function itemDayNotice(item){
  const dayNames = ['domingos', 'lunes', 'martes', 'miércoles', 'jueves', 'viernes', 'sábados'];
  return 'Disponible solo los ' + item.days.map(day => dayNames[day]).join(' y ') + '.';
}
function showUnavailableNotice(id){
  if(birthdayState().closed){ openHours('🎂 Cerrado por cumpleaños', 'Hoy cerramos a las 19h00 para celebrar al gato mesero. Puedes dejar un regalo desde $1 para los michis de la calle en el aviso de cumpleaños.'); return; }
  const item = MENU.find(product => product.id === id);
  if(item && !isWithinAvailability(item)){
    openHours('Promoción por tiempo limitado', item.promoNote || 'Este producto ya no está disponible.');
    return;
  }
  if(item?.days && !item.days.includes(businessTime().day)){
    openHours('Combo del día', itemDayNotice(item));
    return;
  }
  if(item && KITCHEN_HOURS_ITEM_IDS.includes(item.id)){
    openHours('Horario de papas', 'Wachipapas y Tocipapas: lunes a sábado de 19:00 a 23:00; domingos de 18:30 a 22:30.');
    return;
  }
  showClosedNotice();
}
function closeHours(){ document.getElementById('hoursOverlay').classList.remove('open'); }

function toggleTheme(){
  document.body.classList.toggle('light-theme');
}

function setPay(p){
  payMethod = p;
  document.getElementById('btnEfectivo').classList.toggle('active', p==='efectivo');
  document.getElementById('btnTransfer').classList.toggle('active', p==='transferencia');
  updateBars();
}

function setExactCash(){
  const input = document.getElementById('cashAmount');
  if(!input) return;
  input.value = grandTotal().toFixed(2);
  updateBars();
}

function setMode(m){
  if(m === 'delivery' && !isDeliveryAvailableNow()){
    alert('Delivery no disponible. Puedes pedir para llevar o para servir.');
    return;
  }
  mode = m;
  document.getElementById('btnMesa').classList.toggle('active', m==='mesa');
  document.getElementById('btnLlevar').classList.toggle('active', m==='llevar');
  document.getElementById('btnDelivery').classList.toggle('active', m==='delivery');
  updateBars();
}

let sendingOrder = false;
let currentOrderCode = '';
try {
  currentOrderCode = JSON.parse(localStorage.getItem('clowder_order_draft') || 'null')?.orderCode || '';
  if(!/^CL-[A-Z0-9-]{10,60}$/.test(currentOrderCode)) currentOrderCode = '';
} catch(e) {}

// La parte aleatoria evita colisiones entre dispositivos en el mismo minuto.
function createOrderCode(now){
  const parts = Object.fromEntries(new Intl.DateTimeFormat('en-GB', {
    timeZone:'America/Guayaquil',year:'numeric',month:'2-digit',day:'2-digit',hour:'2-digit',minute:'2-digit',hourCycle:'h23'
  }).formatToParts(now).map(part => [part.type, part.value]));
  const random = Array.from(crypto.getRandomValues(new Uint8Array(4)), byte => byte.toString(16).padStart(2,'0')).join('').toUpperCase();
  return `CL-${parts.year}${parts.month}${parts.day}-${parts.hour}${parts.minute}-${random}`;
}

async function registerSharedOrder(apiUrl, order){
  // Sin servidor configurado, el menú conserva su funcionamiento actual.
  if(!apiUrl) return;
  const url = new URL(apiUrl);
  if(url.protocol !== 'https:' && !(['localhost','127.0.0.1'].includes(url.hostname) && url.protocol === 'http:')) throw new Error('La dirección del registro de pedidos no es válida.');
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 15000);
  try {
    const response = await fetch(url.href.replace(/\/$/, '') + '/api/orders', {
      method:'POST', headers:{'Content-Type':'application/json'}, body:JSON.stringify(order), signal:controller.signal
    });
    const result = await response.json();
    if(!response.ok) throw new Error(result.error || 'No pudimos registrar el pedido.');
  } finally { clearTimeout(timeout); }
}

async function sendOrder(){
  if(sendingOrder) return;

  if(birthdayState().closed){ showUnavailableNotice(); return; }
  const unavailable = Object.keys(cart).some(id => {
    const item = MENU.find(product => product.id === id);
    return !item || !isItemOrderable(item);
  });
  if(unavailable){
    alert('Hay productos que ya no están disponibles en este horario. Retíralos del pedido para continuar.');
    renderMenu();
    return;
  }
  updateBars();
  if(document.getElementById('sendBtn').disabled) return;
  const name = document.getElementById('customerName').value.trim() || 'Sin nombre';
  const entries = Object.entries(cart);
  if(entries.length===0) return;
  if(mode === 'delivery'){
    if(!isDeliveryAvailableNow()){
      alert('Delivery no disponible.');
      return;
    }
    if(!deliveryAddressOk()){
      alert('Para delivery necesitamos tu Manzana y Villa dentro de Canaria.');
      return;
    }
  }
  const cashAmount = Number(document.getElementById('cashAmount')?.value || 0);
  if(payMethod === 'efectivo' && !validCash(grandTotal())){
    alert(`Escribe un monto igual o mayor al total ($${grandTotal().toFixed(2)}).`);
    document.getElementById('cashAmount')?.focus();
    return;
  }

  const now = new Date();
  if(!currentOrderCode){
    currentOrderCode = createOrderCode(now);
    persistOrderDraft();
  }
  if(!orderReceiptKey){
    orderReceiptKey = Array.from(crypto.getRandomValues(new Uint8Array(32)), b => b.toString(16).padStart(2,'0')).join('');
    persistOrderDraft();
  }
  const orderCode = currentOrderCode;
  const totalItems = entries.reduce((s,[,c])=>s+c.qty,0);

  let msg = `\u{1F9FE} *Pedido Clowder* #${orderCode}\n`;
  msg += `👤 ${name}\n`;
  // Si el pedido es solo de Congelados/Merch, "para servir/llevar" no aplica: se reemplaza
  // por la línea de retiro/envío coordinado (misma lógica que en updateBars()).
  const storeOnlyOrder = entries.every(([id]) => {
    const item = MENU.find(m=>m.id===id);
    return item && STORE_CATS.includes(item.cat);
  });
  if(storeOnlyOrder){
    msg += `📦 *Retiro o envío a coordinar*\n`;
  } else if(mode === 'delivery') {
    const manzana = document.getElementById('deliveryManzana').value.trim();
    const villa = document.getElementById('deliveryVilla').value.trim();
    msg += `🚲 *Delivery gratis* · Canaria\n`;
    msg += `📍 Manzana ${manzana} · Villa ${villa}\n`;
    if(deliveryLocationUrl) msg += `🗺️ Ubicación: ${deliveryLocationUrl}\n`;
  } else {
    msg += mode==='mesa' ? `🍽️ *Para servir*` : `🥡 *Para llevar*`;
    msg += `\n`;
  }
  if(payMethod) msg += (payMethod === 'efectivo'
    ? `💵 *Efectivo: paga con $${cashAmount.toFixed(2)}*\n`
    : `🏦 *Pago: transferencia a ${paymentBank}*\n`);
  msg += `\n*PRODUCTOS*\n`;
  entries.forEach(([id,c])=>{
    const item = MENU.find(m=>m.id===id);
    msg += `• ${c.qty}x *${productLabel(item)}* — $${(unitPrice(id)*c.qty).toFixed(2)}\n`;
    if(c.milk) msg += `  + Leche ${c.milk}\n`;
    if(c.scoop) msg += `  + Helado de vainilla\n`;
    if(c.syrup) msg += `  + Sirope de ${SYRUP_LABELS[c.syrup]}\n`;
    if(c.note) msg += `  + Nota: ${c.note}\n`;
  });
  const fees = packagingReasons();
  fees.forEach(r => { msg += `+ ${r.label}: $${r.fee.toFixed(2)}\n`; });
  msg += `\n🛒 *${totalItems} producto${totalItems===1?'':'s'} · TOTAL: $${grandTotal().toFixed(2)}*\n`;
  const prepTimeMsg = estimatedPrepTime();
  if(prepTimeMsg) msg += mode === 'delivery'
    ? `⏱ Preparación ${prepTimeMsg[0]}–${prepTimeMsg[1]} min + entrega 5 min\n`
    : `⏱ Listo en ${prepTimeMsg[0]}–${prepTimeMsg[1]} min\n`;
  // Los productos de Congelados y Más no se preparan al momento: son bajo stock/pedido,
  // así que en vez de un tiempo estimado avisamos que coordinamos la entrega aparte.
  const hasFrozenOrder = Object.keys(cart).some(id => {
    const item = MENU.find(m=>m.id===id);
    return item && item.cat === 'Congelados y Más';
  });
  if(hasFrozenOrder) msg += `📦 Producto bajo stock: coordinamos contigo la entrega o retiro.\n`;
  msg += `\n☕ *¡Gracias! Te esperamos en Clowder.*\n`;
  const transfer = payMethod === 'transferencia';
  const sharedOrder = {code:orderCode, receiptKey:orderReceiptKey, name, method:payMethod, bank:transfer ? paymentBank : '', totalCents:Math.round(grandTotal()*100), details:msg};
  // Build the complete order before the asynchronous contact check.
  const target = MenuContact.reserveWindow();
  sendingOrder = true;
  document.getElementById('contactError').hidden = true;
  document.getElementById('whatsappRecovery').hidden = true;
  document.getElementById('sendBtn').textContent = 'Conectando con WhatsApp…';
  updateBars();
  try {
    const contact = await MenuContact.refresh();
    await registerSharedOrder(contact.ordersApiUrl, sharedOrder);
    if(transfer) msg += `🏦 Cuentas: ${contact.paymentsUrl}\n`;
    msg += `📸 Instagram: ${contact.instagramUrl}\n`;
    msg += `💬 Comunidad: ${contact.communityUrl}`;
    const destination = MenuContact.url(msg);
    // Un enlace directo conserva el gesto del cliente si el navegador bloquea la apertura.
    document.getElementById('whatsappRecoveryLink').href = destination;
    document.getElementById('whatsappRecovery').hidden = false;
    try {
      MenuContact.navigate(target, destination);
    } catch (_) {
      // El pedido ya está registrado: el enlace permite continuar sin volver a registrarlo.
      try { if(target) target.close(); } catch (_) {}
    }
  const confirmation = document.getElementById('orderComplete');
  confirmation.classList.add('open');
  setTimeout(() => confirmation.classList.remove('open'), 7000);
  } catch(error) {
    try { if(target) target.close(); } catch (_) {}
    const message = document.getElementById('contactError');
    message.textContent = (error.message && error.name !== 'AbortError' ? error.message + ' ' : '') + 'No pudimos completar el envío. Revisa tu conexión e inténtalo otra vez. Tu pedido sigue guardado.';
    message.hidden = false;
  } finally {
    sendingOrder = false;
    document.getElementById('sendBtn').textContent = 'Enviar pedido por WhatsApp';
    updateBars();
  }
}

function startNewOrder(){
  if(sendingOrder) return;
  if(cartCount() && !confirm('¿Empezar un pedido nuevo? Se borrará el pedido guardado en este dispositivo.')) return;
  completeOrder();
}

function completeOrder(){
  document.getElementById('whatsappRecovery').hidden = true;
  document.getElementById('whatsappRecoveryLink').removeAttribute('href');
  // El mensaje se preparó en WhatsApp; su envío final ocurre allí.
  locationRequestVersion++;
  document.getElementById('locationStatus').textContent = '';
  try { localStorage.removeItem('clowder_order_draft'); } catch(e) {}
  try { sessionStorage.removeItem('clowder_active_order_code'); } catch(e) {}
  cart = {};
  mode = '';
  payMethod = '';
  paymentBank = '';
  orderReceiptKey = '';
  deliveryLocationUrl = '';
  currentOrderCode = '';
  ['customerName','cashAmount','deliveryManzana','deliveryVilla'].forEach(id => {
    const el = document.getElementById(id);
    if(el) el.value = '';
  });
  document.getElementById('btnEfectivo')?.classList.remove('active');
  document.getElementById('btnTransfer')?.classList.remove('active');
  closeCart();
  renderMenu();
  updateBars();
  try { localStorage.removeItem('clowder_order_draft'); } catch(e) {}
  document.getElementById('orderComplete').classList.remove('open');
}

// Prueba visible de emojis: si aqui se ven rombos, el navegador o la fuente es el problema.
// Si se ven bien aqui pero rotos en WhatsApp, el problema es otro.
(function(){
  const el = document.getElementById('emojiCheck');
  if(el) el.textContent = '\u{1F9FE}\u{1F464}\u{1F6D2}\u{2615}';
})();

/* Contador de visitas (Abacus, gratis y sin cuenta).
   Cuenta 1 por sesión, no por cada vez que se toca algo.
   Si el servicio falla, la app sigue funcionando igual. */
(function contarVisita(){
  try{
    if(sessionStorage.getItem('clowder_visita_contada')) return;
    fetch('https://abacus.jasoncameron.dev/hit/clowder-menu-pide/visitas')
      .then(r => r.ok ? r.json() : null)
      .then(() => { try{ sessionStorage.setItem('clowder_visita_contada','1'); }catch(e){} })
      .catch(() => {});
  }catch(e){}
})();

try {
  const draft = JSON.parse(localStorage.getItem('clowder_order_draft') || 'null');
  if(draft){
    if(document.getElementById('customerName')) document.getElementById('customerName').value = typeof draft.customerName === 'string' ? draft.customerName : '';
    if(document.getElementById('cashAmount')) document.getElementById('cashAmount').value = typeof draft.cashAmount === 'string' ? draft.cashAmount : '';
    if(document.getElementById('deliveryManzana')) document.getElementById('deliveryManzana').value = typeof draft.deliveryManzana === 'string' ? draft.deliveryManzana : '';
    if(document.getElementById('deliveryVilla')) document.getElementById('deliveryVilla').value = typeof draft.deliveryVilla === 'string' ? draft.deliveryVilla : '';
    if(deliveryLocationUrl && document.getElementById('locationStatus')) document.getElementById('locationStatus').textContent = 'Ubicación guardada.';
  }
} catch(e) {}
refreshBirthday();
let lastAvailability = '';
function refreshAvailability(){
  if(document.visibilityState !== 'visible' || document.activeElement?.matches('input,textarea,select')) return;
  const time = businessTime();
  const key = `${time.day}:${isMenuOpenNow()}:${JSON.stringify(birthdayState())}:${MENU.map(item => isWithinAvailability(item)).join()}`;
  if(key === lastAvailability) return;
  lastAvailability = key;
  cart = sanitizeCart(cart);
  refreshBirthday();
  renderMenu();
  updateBars();
}
setInterval(refreshAvailability, 30000);
document.addEventListener('visibilitychange', refreshAvailability);
enableMouseDrag(document.getElementById('cats'));
renderCats();
renderMenu();
updateBars();
syncHeaderCompact();

// Instalación guiada: Android ofrece el aviso nativo; iPhone muestra los pasos de Safari.
let deferredInstallPrompt = null;
const installToggle = document.getElementById('installToggle');
const isStandalone = window.matchMedia('(display-mode: standalone)').matches || window.navigator.standalone === true;
const isIOS = /iphone|ipad|ipod/i.test(navigator.userAgent);
function showInstallButton(){
  if(installToggle && !isStandalone) installToggle.style.display = 'flex';
}
window.addEventListener('beforeinstallprompt', event => {
  event.preventDefault();
  deferredInstallPrompt = event;
  showInstallButton();
});
if(!isStandalone) showInstallButton();
async function installApp(){
  if(deferredInstallPrompt){
    deferredInstallPrompt.prompt();
    await deferredInstallPrompt.userChoice;
    deferredInstallPrompt = null;
    if(installToggle) installToggle.style.display = 'none';
    return;
  }
  if(isIOS){
    alert('Para instalar Clowder: toca Compartir y luego “Agregar a pantalla de inicio”.');
  }
}
window.addEventListener('appinstalled', () => {
  if(installToggle) installToggle.style.display = 'none';
});

window.addEventListener('pagehide', persistOrderDraft);
window.addEventListener('clowder:contact-updated', () => { document.getElementById('contactError').hidden = true; });
if('serviceWorker' in navigator) navigator.serviceWorker.addEventListener('message', event => {
  if(event.data?.type === 'MENU_UPDATE_AVAILABLE') MenuContact.refresh().catch(() => {});
});

// Habilita la experiencia instalable y el funcionamiento básico sin conexión.
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('./sw.js', { scope: './', updateViaCache: 'none' }).then(registration => {
      const checkForUpdate = () => {
        if (document.visibilityState === 'visible' && navigator.onLine) {
          registration.update().catch(() => {});
        }
      };
      checkForUpdate();
      setInterval(checkForUpdate, 60000);
      document.addEventListener('visibilitychange', checkForUpdate);
      window.addEventListener('online', checkForUpdate);
    }).catch(() => {});
  });
}
