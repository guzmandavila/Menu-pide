'use strict';
const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),os=require('node:os'),http=require('node:http'),{spawn}=require('node:child_process');
const {chromium}=require(require.resolve('playwright',{paths:['/Users/rnnld/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules']}));
const root=path.resolve(__dirname,'..'), tmp=fs.mkdtempSync(path.join(os.tmpdir(),'clowder-ledger-')), token='test-only-private-key-01234567890123456789';
(async()=>{
 const reserve=http.createServer();await new Promise(r=>reserve.listen(0,'127.0.0.1',r));const port=reserve.address().port;await new Promise(r=>reserve.close(r));const api=`http://127.0.0.1:${port}`;
 const backend=spawn('/usr/bin/python3',['cobros/server.py'],{cwd:root,env:{...process.env,CLOWDER_DB:path.join(tmp,'db.sqlite3'),CLOWDER_ADMIN_TOKEN:token,PORT:String(port)}});
 const menu=http.createServer((req,res)=>{let filename=path.resolve(root,'.'+new URL(req.url,'http://localhost').pathname);if(filename===root)filename=path.join(root,'index.html');if(!filename.startsWith(root+path.sep)){res.writeHead(403).end();return;}fs.readFile(filename,(err,data)=>{if(err){res.writeHead(404).end();return;}res.setHeader('Content-Type',({'.js':'text/javascript','.html':'text/html','.json':'application/json','.css':'text/css'})[path.extname(filename)]||'application/octet-stream');res.end(data);});});
 let browser;
 try{
 for(let i=0;i<60;i++){try{if((await fetch(api+'/health')).ok)break;}catch{}await new Promise(r=>setTimeout(r,100));}
 assert.equal((await fetch(api+'/api/admin')).status,401);
 assert.equal((await fetch(api+'/data.sqlite3')).status,404);
 await new Promise(r=>menu.listen(0,'127.0.0.1',r));const base=`http://127.0.0.1:${menu.address().port}`;
 browser=await chromium.launch({executablePath:process.env.CHROME_PATH||'/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',headless:true});
 const page=await browser.newPage({viewport:{width:390,height:844},serviceWorkers:'block'});const errors=[];page.on('pageerror',e=>errors.push(e.message));page.on('dialog',d=>d.accept());
 await page.addInitScript(()=>{const D=Date;globalThis.Date=class extends D{constructor(...args){super(...(args.length?args:['2026-09-18T01:00:00Z']));}static now(){return new D('2026-09-18T01:00:00Z').getTime();}};window.open=()=>({opener:null,closed:false,close(){},location:{replace(){}}});localStorage.setItem('clowder_seen_guide','1');});
 await page.route('**/menu-config.json',r=>r.fulfill({contentType:'application/json',body:JSON.stringify({...JSON.parse(fs.readFileSync(path.join(root,'menu-config.json'))),ordersApiUrl:api})}));
 // El navegador usa el endpoint real; el proxy de prueba mantiene el origen del menú.
 await page.route(api+'/**',async route=>{const response=await route.fetch();await route.fulfill({response,headers:{...response.headers(),'access-control-allow-origin':base}});});
 await page.goto(base);await page.evaluate(()=>{cart={};changeQty('catpuccino',1);document.getElementById('customerName').value='Cliente de prueba';setMode('mesa');setPay('transferencia');openCart();});
 assert.equal(await page.locator('#sendBtn').isDisabled(),true);
 await page.selectOption('#paymentBank','Pichincha');assert.equal(await page.locator('#sendBtn').isDisabled(),false);
 await page.route(api+'/api/orders',r=>r.fulfill({status:503,contentType:'application/json',headers:{'access-control-allow-origin':base},body:JSON.stringify({error:'Servicio temporalmente no disponible'})}));
 await page.evaluate(()=>sendOrder());assert.equal(await page.locator('#contactError').isVisible(),true);assert.equal(await page.evaluate(()=>document.querySelector('#orderComplete').classList.contains('open')),false);
 await page.unroute(api+'/api/orders');
 await page.reload();assert.equal(await page.evaluate(()=>paymentBank),'Pichincha');
 await page.evaluate(()=>sendOrder());await page.evaluate(()=>sendOrder());
 const snapshot=async()=>{const r=await fetch(api+'/api/admin',{headers:{Authorization:'Bearer '+token}});return r.json();};
 let data=await snapshot();assert.equal(data.orders.length,1);assert.equal(data.orders[0].status,'pending');assert.equal(data.orders[0].payload.bank,'Pichincha');
 const admin=await browser.newPage({viewport:{width:1280,height:900}});admin.on('pageerror',e=>errors.push(e.message));admin.on('dialog',d=>d.accept());await admin.goto(api);await admin.fill('#token',token);await admin.click('#login button');await admin.waitForSelector('#workspace:visible');
 await admin.getByRole('button',{name:'Confirmar cobro',exact:true}).click();await admin.waitForFunction(()=>document.querySelector('#orders').textContent.includes('No hay pedidos'));
 data=await snapshot();const cents=data.orders[0].cents;assert.equal(data.orders[0].status,'paid');
 await admin.fill('#settlementAmount',(cents/100).toFixed(2));await admin.fill('#settlementNote','Desde Produbanco personal');await admin.click('#settlement button');await admin.waitForFunction(()=>document.querySelector('#settlements').textContent.includes('Desde Produbanco'));
 await admin.selectOption('#filter','paid');await admin.screenshot({path:path.join(tmp,'panel-desktop.png'),fullPage:true});
 await admin.getByRole('button',{name:'Cancelar pedido',exact:true}).click();await admin.waitForFunction(()=>document.querySelector('#orders').textContent.includes('No hay pedidos'));
 await admin.selectOption('#filter','cancelled');await admin.getByRole('button',{name:'Confirmar devolución realizada',exact:true}).click();await admin.waitForFunction(()=>document.querySelector('#orders').textContent.includes('Devolución registrada'));
 data=await snapshot();assert.equal(data.orders[0].status,'cancelled');assert.ok(data.orders[0].refunded_at);assert.equal(data.settlements.length,1);
 await admin.setViewportSize({width:390,height:844});assert.equal(await admin.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),true);await admin.screenshot({path:path.join(tmp,'panel-mobile.png'),fullPage:true});
 assert.deepEqual(errors,[]);console.log('OK: acceso privado, banco obligatorio, envío real, reintento sin duplicar, cobro, entrega, cancelación, devolución y panel móvil.');console.log('Capturas: '+tmp);
 }finally{if(browser)await browser.close();backend.kill();menu.close();}
})().catch(e=>{console.error(e);process.exitCode=1;});
