'use strict';
window.ClowderSalesUI=(()=>{
 const el=(tag,text,cls)=>{const e=document.createElement(tag);if(text!==undefined)e.textContent=text;if(cls)e.className=cls;return e;};
 const money=n=>new Intl.NumberFormat('es-EC',{style:'currency',currency:'USD'}).format(n/100);
 const date=d=>new Intl.DateTimeFormat('es-EC',{weekday:'short',day:'numeric',month:'short',timeZone:'America/Guayaquil'}).format(new Date(d+'T12:00:00Z')); 
 const set=(id,...children)=>document.getElementById(id).replaceChildren(...children);
 function table(head,rows){const t=el('table'),thead=el('thead'),tr=el('tr'),body=el('tbody');for(const title of head){const th=el('th',title);th.scope='col';tr.append(th);}thead.append(tr);for(const row of rows){const tr=el('tr');for(const v of row)tr.append(el('td',String(v)));body.append(tr);}t.append(thead,body);return t;}
 function bar(value,max,label){
  const svg=document.createElementNS('http://www.w3.org/2000/svg','svg');svg.setAttribute('viewBox','0 0 300 10');svg.setAttribute('preserveAspectRatio','none');svg.setAttribute('class','sales-bar');svg.setAttribute('role','img');svg.setAttribute('aria-label',label);
  for(const [width,cls] of [[300,'bar-track'],[max?300*value/max:0,'bar-fill']]){const r=document.createElementNS(svg.namespaceURI,'rect');for(const [k,v] of Object.entries({width,height:10,rx:5,class:cls}))r.setAttribute(k,v);svg.append(r);}return svg;
 }
 function ranking(id,rows,max){set(id,...(rows.length?rows.map((p,i)=>{const row=el('div',undefined,'rank-row'),heading=el('div',undefined,'rank-label');heading.append(el('span',`${id==='salesTop'&&i===0?'🏆':i+1+'.'} ${p.name}`),el('strong',`${p.qty} ${p.qty===1?'unidad':'unidades'}`));row.append(heading,bar(p.qty,max,`${p.name}: ${p.qty} unidades`));return row;}):[el('p','Sin productos identificables en este período.','muted')]));}
 function render(orders,end){
  const s=ClowderSales.analyze(orders,end,document.getElementById('salesPeriod').value);
  set('salesRange',el('span',`${s.start} al ${s.end} · Comparado con ${s.previousStart} al ${s.previousEnd}`));
  const difference=s.gross-s.previous;
  const change=s.change===null?'Antes: '+money(s.previous)+' · sin base para comparar':difference===0?'Vendimos lo mismo que antes':`${difference>0?'↑':'↓'} ${money(Math.abs(difference))} ${difference>0?'más':'menos'} que antes (${Math.abs(s.change).toFixed(0)}%)`;
  const peak=[...s.rows].sort((a,b)=>b.cents-a.cents)[0];
  set('salesStory',...[[s.count?'☕':'○',s.count?`Vendimos ${money(s.gross)}`:'Todavía no hay ventas',s.count?`En ${s.count} pedidos cobrados`:'Elige otra fecha o espera los primeros cobros'],['🏆',s.ranked[0]?.name||'Aún no hay producto líder',s.ranked.length?`${s.ranked[0].qty} unidades · el más vendido`:'Se completa con el detalle de los tickets'],['📅',s.count?date(peak.day):'Tu mejor día',s.count?`${money(peak.cents)} · fue el día con más ventas`:'Se mostrará cuando registres cobros']].map(([icon,title,note])=>{const card=el('div',undefined,'story-card');card.append(el('span',icon,'story-icon'),el('strong',title),el('span',note));return card;}));
  set('salesMetrics',...[
   ['Ventas cobradas',money(s.gross),change],['Pedidos cobrados',s.count,'Solo cobros confirmados'],['Promedio por pedido',money(s.average),'Ventas ÷ pedidos cobrados'],['Unidades identificadas',s.units,'Según el detalle de los tickets']
  ].map(([label,value,note])=>{const c=el('div',undefined,'card');c.append(el('span',label),el('strong',String(value)),el('small',note));return c;}));
  const maximum=Math.max(1,...s.rows.map(r=>r.cents));
  document.getElementById('salesTrend').className='chart-scroll'+(s.rows.length>7?' trend-long':'');
  set('salesTrend',...(s.count?[...s.rows].reverse().map(r=>{
   const isPeak=r.cents>0&&r.cents===peak.cents,row=el('div',undefined,'day-sale'+(isPeak?' day-sale--best':''));
   const head=el('div',undefined,'day-sale-heading');head.append(el('span',date(r.day)),el('strong',money(r.cents)));
   row.append(head,bar(r.cents,maximum,`${date(r.day)}: ${money(r.cents)}`),el('small',isPeak?'★ Mejor día del período':r.count?`${r.count} ${r.count===1?'pedido cobrado':'pedidos cobrados'}`:'Sin cobros registrados'));
   return row;
  }):[el('p','No hay ventas cobradas en este período. Prueba otra fecha o un período más amplio.','empty-sales')]));
  set('salesDailyTable',table(['Fecha','Cobrado','Pedidos'],s.rows.map(r=>[r.day,money(r.cents),r.count])));
  set('salesPayments',...[[ 'Efectivo',s.cash],['Transferencias',s.bank]].map(([label,value])=>{const row=el('div',undefined,'rank-row'),p=el('div',undefined,'rank-label');p.append(el('span',label),el('strong',money(value)));row.append(p,bar(value,s.gross,`${label}: ${s.gross?Math.round(value/s.gross*100):0}%`),el('small',`${s.gross?Math.round(value/s.gross*100):0}% de lo cobrado`,'muted'));return row;}));
  ranking('salesTop',s.ranked.slice(0,5),s.ranked[0]?.qty||0);
  ranking('salesBottom',[...s.ranked].sort((a,b)=>a.qty-b.qty||a.name.localeCompare(b.name,'es')).slice(0,5),s.ranked[0]?.qty||0);
  set('salesCoverage',el('span',s.unknown?`${s.unknown} de ${s.count} pedidos cobrados (${money(s.unknownCents)}) no tienen productos identificables. Su importe sí está en ventas; sus unidades no están en el ranking.`:s.count?'Todos los pedidos cobrados del período tienen productos identificables.':'El ranking se completará cuando haya pedidos cobrados con detalle de productos.'),el('span',' Los productos sin ninguna venta no aparecen. Este ranking no indica el stock ni si un producto estuvo disponible.'));
  set('salesProducts',...(s.ranked.length?[table(['Producto','Unidades','% de unidades'],s.ranked.map(p=>[p.name,p.qty,(100*p.qty/s.units).toFixed(1)+'%']))]:[el('p','Todavía no hay productos para mostrar.','muted')]));
  set('salesInsights',...[
   s.count?`Día con más ventas: ${peak.day}, con ${money(peak.cents)} y ${peak.count} pedidos.`:'Todavía no hay cobros para comparar los días.',
   s.ranked.length?`Producto líder: ${s.ranked[0].name}, con ${s.ranked[0].qty} unidades.`:'Los cobros manuales sin detalle no permiten identificar productos.',
   `Por cobrar: ${s.pending} ${s.pending===1?'pedido':'pedidos'} del período. Cancelados: ${s.cancelled}.`
  ].map(t=>el('p',t)));
 }
 function renderBalances(snapshot){
  const cash=ClowderLedger.cash(snapshot.orders,snapshot.cashMovements),bank=ClowderLedger.clowderBank(snapshot);
  const cards=[['🪙','Latita',money(cash.balance),'Efectivo registrado · cobros y movimientos de la latita.'],['🏦','Cuenta Clowder · Produbanco',bank.initialized?money(bank.balance):'Sin saldo inicial','Aumenta cuando confirmas una transferencia recibida en esta cuenta.']];
  set('mainBalances',...cards.map(([icon,label,value,note])=>{const c=el('div',undefined,'balance-card');c.append(el('span',icon+' '+label),el('strong',value),el('small',note));return c;}));
  const history=[];
  for(const m of [...bank.movements].sort((a,b)=>b.created_at.localeCompare(a.created_at))){
   const card=el('div',undefined,'bank-event');card.append(el('strong',`${m.delta>=0?'↙ Transferencia recibida':'↗ Corrección de registro'} · ${m.delta>=0?'+':'−'}${money(Math.abs(m.delta))}`),el('p',m.note),el('small',new Date(m.created_at).toLocaleString('es-EC',{timeZone:'America/Guayaquil'})));history.push(card);
  }
  if(bank.opening){const initial=el('div',undefined,'bank-event');initial.append(el('strong','Saldo inicial comprobado · '+money(bank.opening.cents)),el('small',new Date(bank.opening.at).toLocaleString('es-EC',{timeZone:'America/Guayaquil'})),el('p','Las entregas anteriores ya están contempladas en este punto de partida.'));history.push(initial);}
  set('bankHistory',...(history.length?history:[el('p','Falta registrar el saldo inicial comprobado.','muted')]));
 }
 return {render,renderBalances};
})();
