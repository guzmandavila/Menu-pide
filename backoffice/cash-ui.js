'use strict';
window.ClowderCashUI=(()=>{
 let data=null,limit=12;
 const el=(tag,text,cls)=>{const e=document.createElement(tag);if(text!==undefined)e.textContent=text;if(cls)e.className=cls;return e;};
 const money=n=>new Intl.NumberFormat('es-EC',{style:'currency',currency:'USD'}).format(n/100);
 const labels={sale:['↙','Venta cobrada','Entró'],in:['＋','Dinero para cambio','Entró'],out:['↗','Salida de la latita','Salió'],refund:['↗','Devolución al cliente','Salió'],count:['✓','Contamos la latita','Total contado']};
 function draw(){
  if(!data)return;
  const filter=document.getElementById('cashHistoryFilter').value;
  const events=ClowderLedger.cashTimeline(data.orders,data.cashMovements).filter(e=>filter==='all'||e.kind===filter||(filter==='out'&&e.kind==='refund'));
  const rows=events.slice(0,limit).map(e=>{
   const [icon,title,direction]=labels[e.kind],card=el('div',undefined,'cash-event cash-event--'+e.kind),head=el('div',undefined,'cash-event-head'),titles=el('div');
   titles.append(el('strong',icon+' '+title),el('small',new Date(e.at).toLocaleString('es-EC',{timeZone:'America/Guayaquil',dateStyle:'medium',timeStyle:'short'})));
   const amount=el('div',undefined,'cash-event-amount');amount.append(el('span',direction),el('strong',money(e.kind==='count'?e.counted_cents:Math.abs(e.delta))));head.append(titles,amount);
   const note=String(e.note||'').replace(/^\[Saldos comprobados\] Produbanco: \$\d+\.\d{2};\s*/,'');
   card.append(head,el('p',note),el('div',`Antes: ${money(e.before)}  →  Quedó: ${money(e.after)}`,'cash-event-balance'));
   if(e.kind==='count')card.append(el('small',e.delta===0?'El dinero contado coincide con el saldo registrado.':`Ajuste del registro: ${e.delta>0?'+':'−'}${money(Math.abs(e.delta))}. No se cuenta como venta.`,'cash-event-note'));
   if(e.kind==='count'&&e.after!==e.counted_cents)card.append(el('small','El saldo reconstruido difiere del conteo de ese momento por el orden de los registros. Revisa las fechas de los movimientos.','cash-event-note'));
   const bank=ClowderLedger.bankReference([e]);if(bank)card.append(el('p',`🏦 Produbanco: ${money(bank.cents)} · saldo informado en este conteo`,'cash-bank-note'));
   return card;
  });
  if(!rows.length)rows.push(el('p','No hay movimientos con este filtro.','muted'));
  document.getElementById('cashHistory').replaceChildren(...rows);document.getElementById('cashHistoryMore').hidden=events.length<=limit;
 }
 document.getElementById('cashHistoryFilter').onchange=()=>{limit=12;draw();};
 document.getElementById('cashHistoryMore').onclick=()=>{limit+=12;draw();};
 return {render(snapshot){data=snapshot;draw();}};
})();
