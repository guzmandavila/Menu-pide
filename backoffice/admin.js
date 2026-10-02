'use strict';
const $ = id => document.getElementById(id);
const banks = ['Guayaquil','Pichincha','Bolivariano','Pacífico','Produbanco','Efectivo'];
const money = cents => new Intl.NumberFormat('es-EC',{style:'currency',currency:'USD'}).format(cents/100);
const date = iso => new Date(iso).toLocaleString('es-EC',{timeZone:'America/Guayaquil'});
let token = '', snapshot = null, busy = false, settlementAttempt = null, manualAttempt = null, cashAttempt = null;
$('day').value = ClowderLedger.day(new Date().toISOString());
function element(tag,text,className) { const el=document.createElement(tag); if(text !== undefined) el.textContent=text; if(className) el.className=className; return el; }
async function api(path, data) {
  const response = await fetch((window.CLOWDER_API || '') + path,{method:data?'POST':'GET',cache:'no-store',headers:{Authorization:'Bearer '+token,...(data?{'Content-Type':'application/json'}:{})},body:data?JSON.stringify(data):undefined,signal:AbortSignal.timeout(15000)});
  const result=await response.json(); if(!response.ok) throw new Error(result.error || 'No se pudo completar la operación.'); return result;
}
async function refresh() { snapshot=await api('/api/admin'); render(); $('updated').textContent='Actualizado: '+date(new Date().toISOString()); }
async function run(fn) {
  if(busy) return; busy=true; $('status').textContent=''; document.querySelectorAll('button').forEach(b=>b.disabled=true);
  try { await fn(); } catch(e) { $('status').textContent=e.message+' Si hubo un problema de conexión, actualiza para verificar el resultado antes de cambiar los datos.'; }
  finally { busy=false; document.querySelectorAll('button').forEach(b=>b.disabled=false); }
}
$('login').onsubmit=e=>{e.preventDefault(); run(async()=>{token=$('token').value; await refresh(); $('token').value=''; $('login').hidden=true; $('workspace').hidden=false;});};
$('logout').onclick=()=>{token='';snapshot=null;location.reload();};
$('refresh').onclick=()=>run(refresh);
for(const id of ['day','filter','search']) $(id).oninput=()=>{if(snapshot)render();};
$('settlement').onsubmit=e=>{e.preventDefault(); const cents=Math.round(Number($('settlementAmount').value)*100),note=$('settlementNote').value.trim(); if(!Number.isSafeInteger(cents)||cents<=0)return;
  if(!confirm(`¿Confirmas que Fernanda ya recibió ${money(cents)}?`))return;
  run(async()=>{const signature=JSON.stringify({cents,note}); if(!settlementAttempt||settlementAttempt.signature!==signature)settlementAttempt={signature,id:crypto.randomUUID()}; await api('/api/settlements',{cents,note,id:settlementAttempt.id}); $('settlement').reset(); settlementAttempt=null; await refresh();});
};
$('manual').onsubmit=e=>{
 e.preventDefault();const name=$('manualName').value.trim(),totalCents=Math.round(Number($('manualAmount').value)*100),account=$('manualAccount').value;
 if(!name||!Number.isSafeInteger(totalCents)||totalCents<=0)return;
 if(!confirm(`¿Ya recibiste ${money(totalCents)} en ${account} y este cobro no está registrado?`))return;
 run(async()=>{
  const tenderCents=account==='Efectivo'?Math.round(Number($('manualTender').value||$('manualAmount').value)*100):undefined;
  const signature=JSON.stringify({name,totalCents,account,tenderCents});
  if(!manualAttempt||manualAttempt.signature!==signature)manualAttempt={signature,code:'CL-MANUAL-'+crypto.randomUUID().toUpperCase(),receiptKey:Array.from(crypto.getRandomValues(new Uint8Array(32)),b=>b.toString(16).padStart(2,'0')).join('')};
  await api('/api/manual',{code:manualAttempt.code,receiptKey:manualAttempt.receiptKey,name,totalCents,tenderCents,method:account==='Efectivo'?'efectivo':'transferencia',bank:account==='Efectivo'?'':account,details:'Cobro recibido fuera del menú · '+name});
  $('manual').reset();updateManualChange();manualAttempt=null;await refresh();
 });
};
function render() {
  renderFinance();
  const sum=ClowderLedger.summarize(snapshot.orders,snapshot.settlements,$('day').value);
  $('dailySummary').replaceChildren();
  const pendingOrders=snapshot.orders.filter(o=>o.status==='pending').length;
  const cashToday=sum.accounts.Efectivo.today;
  const transfersToday=Object.entries(sum.accounts).filter(([a])=>a!=='Efectivo').reduce((n,[,v])=>n+v.today,0);
  for(const [label,value,note] of [['Pedidos por confirmar',String(pendingOrders),'Pendientes de todos los días'],['Efectivo cobrado',money(cashToday),'Fecha de consulta'],['Transferencias cobradas',money(transfersToday),'Fecha de consulta']]){
    const card=element('div',undefined,'card');card.append(element('span',label),element('strong',value),element('small',note));$('dailySummary').append(card);
  }
  $('summary').replaceChildren();
  const bankDay=Object.entries(sum.accounts).filter(([a])=>a!=='Efectivo').reduce((n,[,v])=>n+v.today,0);
  for(const [label,value,tone,note] of [
    ['Transferencias pendientes para Fernanda',sum.pending,'pending','Acumulado por entregar · solo transferencias'],
    ['Efectivo del día · latita de Tea',sum.accounts.Efectivo.today,'cash','Se guarda en la latita · no se entrega a Fernanda'],
    ['Ya pagado a Fernanda',sum.delivered,'settled','Total de entregas registradas · todos los días'],
    ['Transferencias del día',bankDay,'','Cobros recibidos en la fecha elegida'],
    ['Devoluciones pendientes',sum.refunds,'','Dinero por devolver a clientes']
  ]){const card=element('div',undefined,'card'+(tone?' card--'+tone:''));card.append(element('span',label),element('strong',money(value)),element('small',note));$('summary').append(card);}
  $('accounts').replaceChildren(); for(const [name,v] of Object.entries(sum.accounts)){const row=element('tr',undefined,name==='Efectivo'?'account--cash':undefined);[name,money(v.today),money(v.total)].forEach(t=>row.append(element('td',t)));$('accounts').append(row);}
  $('orders').replaceChildren();
  const query=$('search').value.toLowerCase();
  for(const o of snapshot.orders.filter(o=>($('filter').value==='all'||o.status===$('filter').value)&&(o.code+' '+o.payload.name).toLowerCase().includes(query))) {
    const p=o.payload, article=element('article'); article.append(element('h3',p.name+' · '+money(o.cents ?? p.totalCents)),element('p',o.code+' · '+date(o.created_at),'muted'));
    article.append(element('p',({pending:'Pendiente de confirmar',paid:'Cobrado',cancelled:'Cancelado'})[o.status]+' · '+(o.account || (p.method==='efectivo'?'Efectivo':p.bank))));
    if(o.account==='Efectivo'&&o.tender_cents!=null)article.append(element('p','Recibido: '+money(o.tender_cents)+' · Cambio entregado: '+money(o.tender_cents-o.cents)));
    const details=element('details');details.append(element('summary','Ver pedido'),element('pre',p.details));article.append(details);
    if(o.status==='pending') {
      const form=element('form'),label=element('label','Cuenta donde recibiste el pago'),select=element('select'),amountLabel=element('label','Monto recibido ($)'),input=element('input');
      banks.forEach(b=>{const option=element('option',b);option.value=b;select.append(option);});select.value=p.method==='efectivo'?'Efectivo':p.bank;label.append(select);
      Object.assign(input,{type:'number',min:'0.01',max:'100000',step:'0.01',required:true,value:(p.totalCents/100).toFixed(2)});amountLabel.append(input);
      const tenderLabel=element('label','Efectivo recibido del cliente ($)'),receivedInput=element('input'),change=element('p');
      Object.assign(receivedInput,{type:'number',min:'0.01',max:'100000',step:'0.01'});tenderLabel.append(receivedInput);
      const updateChange=()=>{tenderLabel.hidden=select.value!=='Efectivo';const value=Math.round(Number(receivedInput.value||input.value)*100),price=Math.round(Number(input.value)*100);receivedInput.setCustomValidity(select.value==='Efectivo'&&value<price?'El efectivo no alcanza.':'');change.textContent=select.value==='Efectivo'?'Cambio a entregar: '+money(Math.max(0,value-price))+'. La caja suma '+money(price)+'.':'';};
      select.onchange=input.oninput=receivedInput.oninput=updateChange;updateChange();form.append(label,amountLabel,tenderLabel,change,element('button','Confirmar cobro'));
      form.onsubmit=e=>{e.preventDefault();const cents=Math.round(Number(input.value)*100);if(!confirm(`¿Recibiste ${money(cents)} en ${select.value}?`))return;run(async()=>{await api(`/api/orders/${o.code}/confirm`,{account:select.value,cents,...(select.value==='Efectivo'?{tenderCents:Math.round(Number(receivedInput.value||input.value)*100)}:{})});await refresh();});};article.append(form);
    }
    if(o.status!=='cancelled') { const button=element('button','Cancelar pedido','danger');button.type='button';button.onclick=()=>{if(confirm(o.status==='paid'?'¿Cancelar este pedido cobrado? Se excluirá del cierre y quedará pendiente la devolución.':'¿Cancelar este pedido? No se sumará al cierre.'))run(async()=>{await api(`/api/orders/${o.code}/cancel`,{});await refresh();});};article.append(button); }
    if(o.status==='cancelled'&&o.paid_at){article.append(element('p',o.refunded_at?'Devolución registrada: '+date(o.refunded_at):'Debes devolver '+money(o.cents)+' al cliente.'));if(!o.refunded_at){const button=element('button','Confirmar devolución realizada');button.onclick=()=>{if(confirm('¿Ya devolviste '+money(o.cents)+' al cliente?'))run(async()=>{await api(`/api/orders/${o.code}/refund`,{});await refresh();});};article.append(button);}}
    $('orders').append(article);
  }
  if(!$('orders').children.length)$('orders').append(element('p','No hay pedidos con estos filtros.'));
  $('settlements').replaceChildren(...snapshot.settlements.map(s=>{
    const row=element('p',`${date(s.created_at)} · ${money(s.cents)} · ${s.note}${s.voided_at?' · Anulada':' · Pagado a Fernanda'}`,s.voided_at?'settlement--void':'settlement--paid');
    if(!s.voided_at){const button=element('button','Anular registro','secondary');button.onclick=()=>{if(confirm('¿Este registro fue un error? Anularlo volverá a sumar el monto al pendiente. No uses esta acción si Fernanda conserva ese dinero.'))run(async()=>{await api(`/api/settlements/${s.id}/void`,{});await refresh();});};row.append(' ',button);}
    return row;
  }));
}
setInterval(()=>{if(token&&!busy&&!document.hidden&&!document.activeElement.matches('input,select,button'))run(refresh);},60000);

function updateManualChange(){
 const cash=$('manualAccount').value==='Efectivo';$('manualTenderLabel').hidden=!cash;
 const amount=Math.round(Number($('manualAmount').value)*100),received=Math.round(Number($('manualTender').value||$('manualAmount').value)*100);
 $('manualTender').setCustomValidity(cash&&received<amount?'El efectivo no alcanza.':'');
 $('manualChange').textContent=cash?'Cambio a entregar: '+money(Math.max(0,received-amount))+'. La caja suma '+money(amount)+'.':'';
}
for(const id of ['manualAmount','manualTender','manualAccount'])$(id).addEventListener('input',updateManualChange);
$('cashForm').onsubmit=e=>{e.preventDefault();run(async()=>{
 const kind=$('cashKind').value,cents=Math.round(Number($('cashAmount').value)*100),note=$('cashNote').value.trim(),expected=ClowderLedger.cash(snapshot.orders,snapshot.cashMovements).balance;
 const signature=JSON.stringify({kind,cents,note});
 if(!cashAttempt||cashAttempt.signature!==signature)cashAttempt={signature,id:crypto.randomUUID(),expected};
 if(!confirm(kind==='count'?`¿Contaste ${money(cents)} en total, incluyendo los cobros recientes? Se ajustará la diferencia con el saldo registrado.`:`¿Registrar ${kind==='in'?'entrada':'salida'} de ${money(cents)}?`))return;
 await api('/api/cash',{id:cashAttempt.id,kind,cents,note,expected:cashAttempt.expected});cashAttempt=null;$('cashForm').reset();await refresh();
});};
$('refresh').onclick=()=>run(async()=>{await refresh();cashAttempt=null;});
function weekLabel(key){const d=new Date(key+'T12:00:00Z');d.setUTCDate(d.getUTCDate()+1);const start=d.toISOString().slice(0,10);d.setUTCDate(d.getUTCDate()+5);return start+' a '+d.toISOString().slice(0,10);}
function renderFinance(){
 const c=ClowderLedger.cash(snapshot.orders,snapshot.cashMovements);$('cashSummary').replaceChildren();
 for(const [label,value] of [['Saldo de caja',c.balance],['Reservado para devoluciones',c.reserved],['Efectivo disponible',c.available]]){const card=element('div',undefined,'card card--cash');card.append(element('span',label),element('strong',money(value)));$('cashSummary').append(card);}
 $('cashHint').textContent=c.initialized?'El saldo suma los cobros y movimientos, y resta las devoluciones realizadas. El disponible también reserva las devoluciones pendientes.':'Falta contar la latita: estos valores solo incluyen el efectivo registrado. Guarda el total físico para incluir lo que ya tenías.';
 $('cashHistory').replaceChildren(...(snapshot.cashMovements||[]).map(m=>element('p',date(m.created_at)+' · '+({count:'Conteo',in:'Entrada',out:'Salida'})[m.kind]+' · '+money(m.delta)+(m.counted_cents===null?'':' · Total contado: '+money(m.counted_cents))+' · '+m.note)));
 $('weeks').replaceChildren(...ClowderLedger.weekly(snapshot.orders).map(w=>{const tr=element('tr');[weekLabel(w.week)+(w.current?' · Parcial':''),money(w.cash),money(w.bank),money(w.gross),money(w.refunds),money(w.net),String(w.count),money(w.average),w.current?'En curso':w.change===null?'Sin base':(w.change>0?'+':'')+w.change.toFixed(1)+'%',money(w.outside)].forEach(v=>tr.append(element('td',v)));return tr;}));
}
function download(name,content,type){const url=URL.createObjectURL(new Blob([content],{type})),a=element('a');a.href=url;a.download=name;a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);}
$('backup').onclick=()=>run(async()=>{const data=await api('/api/backup');download('clowder-respaldo-'+ClowderLedger.day(new Date().toISOString())+'.json',JSON.stringify(data,null,2),'application/json');});
$('exportWeeks').onclick=()=>{const rows=[['Semana martes a domingo','Estado','Efectivo','Transferencias','Cobrado','Devoluciones','Neto','Pedidos','Promedio','Variación %','Lunes antes de 18:00'],...ClowderLedger.weekly(snapshot.orders).map(w=>[weekLabel(w.week),w.current?'Parcial':'Completa',...[w.cash,w.bank,w.gross,w.refunds,w.net].map(v=>(v/100).toFixed(2)),w.count,(w.average/100).toFixed(2),w.current||w.change===null?'':w.change.toFixed(1),(w.outside/100).toFixed(2)])];download('clowder-semanas.csv','\ufeff'+rows.map(r=>r.join(';')).join('\r\n'),'text/csv;charset=utf-8');};

const workspaceTabs=['orders','accounting'];
function selectWorkspaceTab(name,focus=false){
 if(!workspaceTabs.includes(name))name='orders';
 for(const key of workspaceTabs){const selected=key===name,tab=$('tab-'+key);tab.setAttribute('aria-selected',String(selected));tab.tabIndex=selected?0:-1;$('panel-'+key).hidden=!selected;}
 if(focus)$('tab-'+name).focus();
}
for(const [index,key] of workspaceTabs.entries()){
 const tab=$('tab-'+key);
 tab.onclick=()=>{selectWorkspaceTab(key);history.replaceState(null,'','#'+(key==='accounting'?'contabilidad':'pedidos'));};
 tab.onkeydown=e=>{let next;if(e.key==='ArrowRight'||e.key==='ArrowLeft')next=workspaceTabs[1-index];else if(e.key==='Home')next=workspaceTabs[0];else if(e.key==='End')next=workspaceTabs[1];else return;e.preventDefault();selectWorkspaceTab(next,true);history.replaceState(null,'','#'+(next==='accounting'?'contabilidad':'pedidos'));};
}
function tabFromHash(){selectWorkspaceTab(location.hash==='#contabilidad'?'accounting':'orders');}
window.addEventListener('hashchange',tabFromHash);tabFromHash();
