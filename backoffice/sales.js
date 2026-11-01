/* Consulta de ventas: no modifica pedidos ni movimientos contables. */
(function(root){
 const day=iso=>new Intl.DateTimeFormat('en-CA',{timeZone:'America/Guayaquil',year:'numeric',month:'2-digit',day:'2-digit'}).format(new Date(iso));
 function shift(value,days){const d=new Date(value+'T12:00:00Z');d.setUTCDate(d.getUTCDate()+days);return d.toISOString().slice(0,10);}
 function products(details){
  const section=String(details||'').split(/\*PRODUCTOS\*\r?\n/)[1];
  if(!section)return [];
  const lines=section.split(/\r?\n/),result=[];
  for(const line of lines){
   if(/^🛒/.test(line))break;
   const m=line.match(/^•\s+(\d+)x\s+\*(.+)\*\s+—\s+\$(\d+\.\d{2})\s*$/);
   if(m&&Number(m[1])>0)result.push({name:m[2].trim(),qty:Number(m[1]),cents:Math.round(Number(m[3])*100)});
  }
  return result;
 }
 function analyze(orders,end,days=7){
  days=[1,7,30].includes(Number(days))?Number(days):7;
  const start=shift(end,1-days),previousStart=shift(start,-days),previousEnd=shift(start,-1);
  const rows=Array.from({length:days},(_,i)=>({day:shift(start,i),cents:0,count:0})),byDay=new Map(rows.map(r=>[r.day,r]));
  let gross=0,count=0,previous=0,cash=0,bank=0,unknown=0,unknownCents=0,units=0,pending=0,cancelled=0;
  const ranking=new Map();
  for(const o of orders){
   const created=day(o.created_at);
   if(created>=start&&created<=end){if(o.status==='pending')pending++;if(o.status==='cancelled')cancelled++;}
   if(o.status!=='paid'||!o.paid_at)continue;
   const paid=day(o.paid_at),cents=o.cents??o.payload.totalCents;
   if(paid>=previousStart&&paid<=previousEnd)previous+=cents;
   if(!byDay.has(paid))continue;
   gross+=cents;count++;byDay.get(paid).cents+=cents;byDay.get(paid).count++;
   if(o.account==='Efectivo')cash+=cents;else bank+=cents;
   const items=products(o.payload?.details);
   if(!items.length){unknown++;unknownCents+=cents;}
   for(const item of items){
    const key=item.name.normalize('NFC').toLocaleLowerCase('es');
    if(!ranking.has(key))ranking.set(key,{name:item.name,qty:0});
    ranking.get(key).qty+=item.qty;units+=item.qty;
   }
  }
  const ranked=[...ranking.values()].sort((a,b)=>b.qty-a.qty||a.name.localeCompare(b.name,'es'));
  return {start,end,previousStart,previousEnd,rows,gross,count,previous,cash,bank,unknown,unknownCents,units,pending,cancelled,ranked,average:count?Math.round(gross/count):0,change:previous?100*(gross-previous)/previous:null};
 }
 root.ClowderSales={analyze,products,shift};
 if(typeof module!=='undefined')module.exports=root.ClowderSales;
})(globalThis);
