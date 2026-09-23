import {createInterface} from 'node:readline';
import {createRequire} from 'node:module';
import assert from 'node:assert/strict';
import fs from 'node:fs';
const require=createRequire(import.meta.url);
const {chromium}=require(require.resolve('playwright',{paths:['/Users/rnnld/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules']}));
process.stdout.write('Ready for private test JSON on stdin (input is hidden).\n');
if(process.stdin.isTTY)process.stdin.setRawMode(true);
let input='';const settings=await new Promise(resolve=>{process.stdin.on('data',function read(chunk){for(const c of chunk.toString()){if(c==='\n'||c==='\r'){process.stdin.off('data',read);if(process.stdin.isTTY)process.stdin.setRawMode(false);process.stdin.pause();resolve(JSON.parse(input));return;}input+=c;}});});
const {url,token,bypass,menuUrl,adminUrl}=settings;
const base=new URL(url).origin;
const privateHeaders=bypass?{'OAI-Sites-Authorization':'Bearer '+bypass}:{};
async function api(path,body,authorized=true){const r=await fetch(base+path,{method:body?'POST':'GET',headers:{...privateHeaders,...(authorized?{Authorization:'Bearer '+token}:{}),...(body?{'Content-Type':'application/json'}:{})},body:body?JSON.stringify(body):undefined});return {status:r.status,data:await r.json()};}
const before=await api('/api/admin');assert.equal(before.status,200);fs.mkdirSync('.sites-runtime',{recursive:true});fs.writeFileSync('.sites-runtime/before-live-test.json',JSON.stringify(before.data,null,2),{mode:0o600});const unauthorized=await api('/api/admin',null,false);assert.equal(unauthorized.status,401);
const browser=await chromium.launch({executablePath:'/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',headless:true});
const created=[];let deliveryId=null;
try{
 const context=await browser.newContext({viewport:{width:1280,height:950},serviceWorkers:'block',locale:'es-EC',timezoneId:'America/Guayaquil'});
 await context.route('**/*',route=>{const origin=new URL(route.request().url()).origin;if(![base,new URL(menuUrl||base).origin,new URL(adminUrl||base).origin].includes(origin))return route.abort();return route.continue({headers:{...route.request().headers(),...(origin===base?privateHeaders:{})}});});
 const errors=[];context.on('page',page=>{page.on('pageerror',e=>errors.push(e.message));page.on('dialog',d=>d.accept());});
 const menu=await context.newPage();await menu.addInitScript(()=>{localStorage.setItem('clowder_seen_guide','1');window.__whatsapp=[];window.open=()=>({closed:false,opener:null,close(){},location:{replace(url){window.__whatsapp.push(url);}}});});
 await menu.goto(menuUrl||base,{waitUntil:'networkidle'});assert.ok(await menu.locator('#paymentBank').count());
 async function makeOrder(method){
  return menu.evaluate(async method=>{completeOrder();cart={};changeQty('catpuccino',1);document.getElementById('customerName').value='PRUEBA TÉCNICA · NO PREPARAR';setMode('mesa');paymentBank='Pichincha';setPay(method);if(method==='efectivo')setExactCash();openCart();if(document.getElementById('sendBtn').disabled)throw new Error('Pedido de prueba no disponible en este horario.');await sendOrder();if(!document.getElementById('contactError').hidden)throw new Error(document.getElementById('contactError').textContent);return{code:currentOrderCode,cents:Math.round(grandTotal()*100)};},method);
 }
 const bank=await makeOrder('transferencia');created.push(bank.code);await menu.evaluate(()=>sendOrder());
 let state=(await api('/api/admin')).data;assert.equal(state.orders.filter(o=>o.code===bank.code).length,1);
 const admin=await context.newPage();await admin.goto(adminUrl||base+'/cobros',{waitUntil:'networkidle'});await admin.fill('#token',token);await admin.click('#login button');await admin.waitForSelector('#workspace:visible');
 await admin.fill('#search',bank.code);await admin.getByRole('button',{name:'Confirmar cobro',exact:true}).click();await admin.waitForFunction(()=>document.querySelector('#orders').textContent.includes('No hay pedidos'));
 const cash=await makeOrder('efectivo');created.push(cash.code);await admin.click('#refresh');await admin.fill('#search',cash.code);await admin.getByRole('button',{name:'Confirmar cobro',exact:true}).click();await admin.waitForFunction(()=>document.querySelector('#orders').textContent.includes('No hay pedidos'));
 state=(await api('/api/admin')).data;assert.equal(state.orders.find(o=>o.code===cash.code).account,'Efectivo');assert.equal(state.orders.find(o=>o.code===bank.code).account,'Pichincha');
 const summary=await admin.evaluate(()=>ClowderLedger.summarize(snapshot.orders,snapshot.settlements,document.querySelector('#day').value));
 // La base de esta publicación es nueva. Si en el futuro hubiera registros, comparar deltas.
 const beforeSum=await admin.evaluate(data=>ClowderLedger.summarize(data.orders,data.settlements,document.querySelector('#day').value),before.data);
 assert.equal(summary.pending-beforeSum.pending,bank.cents);assert.equal(summary.accounts.Efectivo.total-beforeSum.accounts.Efectivo.total,cash.cents);
 await admin.fill('#settlementAmount',(bank.cents/100).toFixed(2));await admin.fill('#settlementNote','PRUEBA TÉCNICA · sin transferencia real');await admin.click('#settlement button');await admin.waitForFunction(()=>document.querySelector('#settlements').textContent.includes('PRUEBA TÉCNICA'));
 state=(await api('/api/admin')).data;deliveryId=state.settlements.find(s=>!before.data.settlements.some(b=>b.id===s.id)).id;
 assert.equal(await admin.evaluate(()=>ClowderLedger.summarize(snapshot.orders,snapshot.settlements,document.querySelector('#day').value).pending),beforeSum.pending);
 await admin.selectOption('#filter','paid');await admin.fill('#search',bank.code);await admin.getByRole('button',{name:'Cancelar pedido',exact:true}).click();await admin.waitForFunction(()=>document.querySelector('#orders').textContent.includes('No hay pedidos'));
 await admin.selectOption('#filter','cancelled');await admin.getByRole('button',{name:'Confirmar devolución realizada',exact:true}).click();await admin.waitForFunction(()=>document.querySelector('#orders').textContent.includes('Devolución registrada'));
 await admin.locator('#manualEntry summary').click();await admin.fill('#manualName','PRUEBA TÉCNICA · COBRO MANUAL');await admin.fill('#manualAmount','0.01');await admin.selectOption('#manualAccount','Efectivo');await admin.click('#manual button');
 await admin.waitForFunction(()=>document.querySelector('#manualName').value==='');
 const manual=(await api('/api/admin')).data.orders.find(o=>o.payload.name==='PRUEBA TÉCNICA · COBRO MANUAL'&&!before.data.orders.some(b=>b.code===o.code));assert.ok(manual);created.push(manual.code);assert.equal(manual.status,'paid');assert.equal(manual.cents,1);
 await admin.setViewportSize({width:390,height:844});assert.equal(await admin.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),true);
 await admin.screenshot({path:'.sites-runtime/panel-publicado.png',fullPage:true});
 assert.deepEqual(errors,[]);assert.ok((await menu.evaluate(()=>window.__whatsapp.length))>=2);
 console.log('OK en línea: menú, persistencia, banco, efectivo separado, entrega a Fernanda, cancelación, devolución, acceso protegido y móvil. WhatsApp interceptado; ningún mensaje enviado.');
}finally{
 for(const code of created){await api('/api/orders/'+code+'/cancel',{});const state=(await api('/api/admin')).data;const o=state.orders.find(o=>o.code===code);if(o?.paid_at&&!o.refunded_at)await api('/api/orders/'+code+'/refund',{});}
 if(deliveryId)await api('/api/settlements/'+deliveryId+'/void',{});
 await browser.close();
 const after=(await api('/api/admin')).data;
 assert.ok(created.every(code=>after.orders.find(o=>o.code===code)?.status==='cancelled'));
 if(deliveryId)assert.ok(after.settlements.find(s=>s.id===deliveryId)?.voided_at);
 console.log('Pruebas anuladas y conservadas en historial; no afectan el pendiente ni los cobros.');
}
