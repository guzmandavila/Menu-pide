'use strict';
const $ = id => document.getElementById(id);
const banks = ['Guayaquil','Pichincha','Bolivariano','Pacífico','Produbanco','Efectivo'];
const money = cents => new Intl.NumberFormat('es-EC',{style:'currency',currency:'USD'}).format(cents/100);
const date = iso => new Date(iso).toLocaleString('es-EC',{timeZone:'America/Guayaquil'});
let token = '', snapshot = null, busy = false, settlementAttempt = null;
$('day').value = ClowderLedger.day(new Date().toISOString());
function element(tag,text,className) { const el=document.createElement(tag); if(text !== undefined) el.textContent=text; if(className) el.className=className; return el; }
async function api(path, data) {
  const response = await fetch(path,{method:data?'POST':'GET',cache:'no-store',headers:{Authorization:'Bearer '+token,...(data?{'Content-Type':'application/json'}:{})},body:data?JSON.stringify(data):undefined,signal:AbortSignal.timeout(15000)});
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
function render() {
  const sum=ClowderLedger.summarize(snapshot.orders,snapshot.settlements,$('day').value);
  $('summary').replaceChildren();
  const bankDay=Object.entries(sum.accounts).filter(([a])=>a!=='Efectivo').reduce((n,[,v])=>n+v.today,0);
  for(const [label,value] of [['Pendiente para Fernanda',sum.pending],['Transferencias del día',bankDay],['Efectivo del día',sum.accounts.Efectivo.today],['Devoluciones pendientes',sum.refunds]]){const card=element('div',undefined,'card');card.append(element('span',label),element('strong',money(value)));$('summary').append(card);}
  $('accounts').replaceChildren(); for(const [name,v] of Object.entries(sum.accounts)){const row=element('tr');[name,money(v.today),money(v.total)].forEach(t=>row.append(element('td',t)));$('accounts').append(row);}
  $('orders').replaceChildren();
  const query=$('search').value.toLowerCase();
  for(const o of snapshot.orders.filter(o=>($('filter').value==='all'||o.status===$('filter').value)&&(o.code+' '+o.payload.name).toLowerCase().includes(query))) {
    const p=o.payload, article=element('article'); article.append(element('h3',p.name+' · '+money(o.cents ?? p.totalCents)),element('p',o.code+' · '+date(o.created_at),'muted'));
    article.append(element('p',({pending:'Pendiente de confirmar',paid:'Cobrado',cancelled:'Cancelado'})[o.status]+' · '+(o.account || (p.method==='efectivo'?'Efectivo':p.bank))));
    const details=element('details');details.append(element('summary','Ver pedido'),element('pre',p.details));article.append(details);
    if(o.status==='pending') {
      const form=element('form'),label=element('label','Cuenta donde recibiste el pago'),select=element('select'),amountLabel=element('label','Monto recibido ($)'),input=element('input');
      banks.forEach(b=>{const option=element('option',b);option.value=b;select.append(option);});select.value=p.method==='efectivo'?'Efectivo':p.bank;label.append(select);
      Object.assign(input,{type:'number',min:'0.01',max:'100000',step:'0.01',required:true,value:(p.totalCents/100).toFixed(2)});amountLabel.append(input);form.append(label,amountLabel,element('button','Confirmar cobro'));
      form.onsubmit=e=>{e.preventDefault();const cents=Math.round(Number(input.value)*100);if(!confirm(`¿Recibiste ${money(cents)} en ${select.value}?`))return;run(async()=>{await api(`/api/orders/${o.code}/confirm`,{account:select.value,cents});await refresh();});};article.append(form);
    }
    if(o.status!=='cancelled') { const button=element('button','Cancelar pedido','danger');button.type='button';button.onclick=()=>{if(confirm(o.status==='paid'?'¿Cancelar este pedido cobrado? Se excluirá del cierre y quedará pendiente la devolución.':'¿Cancelar este pedido? No se sumará al cierre.'))run(async()=>{await api(`/api/orders/${o.code}/cancel`,{});await refresh();});};article.append(button); }
    if(o.status==='cancelled'&&o.paid_at){article.append(element('p',o.refunded_at?'Devolución registrada: '+date(o.refunded_at):'Debes devolver '+money(o.cents)+' al cliente.'));if(!o.refunded_at){const button=element('button','Confirmar devolución realizada');button.onclick=()=>{if(confirm('¿Ya devolviste '+money(o.cents)+' al cliente?'))run(async()=>{await api(`/api/orders/${o.code}/refund`,{});await refresh();});};article.append(button);}}
    $('orders').append(article);
  }
  if(!$('orders').children.length)$('orders').append(element('p','No hay pedidos con estos filtros.'));
  $('settlements').replaceChildren(...snapshot.settlements.map(s=>element('p',`${date(s.created_at)} · ${money(s.cents)} · ${s.note}`)));
}
setInterval(()=>{if(token&&!busy&&!document.hidden&&!document.activeElement.matches('input,select,button'))run(refresh);},60000);
