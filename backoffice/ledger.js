(function(root) {
  function day(iso) {
    return new Intl.DateTimeFormat('en-CA', { timeZone:'America/Guayaquil', year:'numeric', month:'2-digit', day:'2-digit' }).format(new Date(iso));
  }
  function summarize(orders, settlements, selectedDay) {
    const accounts = Object.fromEntries(['Guayaquil','Pichincha','Bolivariano','Pacífico','Produbanco','Efectivo'].map(a => [a, {today:0,total:0}]));
    let refunds = 0;
    for (const o of orders) {
      if (o.status === 'cancelled' && o.paid_at && !o.refunded_at) refunds += o.cents;
      if (o.status !== 'paid') continue;
      accounts[o.account].total += o.cents;
      if (day(o.paid_at) === selectedDay) accounts[o.account].today += o.cents;
    }
    const bankTotal = Object.entries(accounts).filter(([a]) => a !== 'Efectivo').reduce((n,[,v]) => n+v.total,0);
    const delivered = settlements.filter(s=>!s.voided_at).reduce((n,s) => n+s.cents,0);
    return {accounts, refunds, delivered, pending:bankTotal-delivered};
  }
  // Ecuador (UTC-5). Lunes 00:00–17:59 se conserva fuera del horario de ventas.
  function week(iso) {
    const local=new Date(new Date(iso).getTime()-5*3600000);
    const weekday=local.getUTCDay();
    local.setUTCDate(local.getUTCDate()-((weekday+6)%7));
    return local.toISOString().slice(0,10);
  }
  function outside(iso) {
    const local=new Date(new Date(iso).getTime()-5*3600000);
    return local.getUTCDay()===1&&local.getUTCHours()<18;
  }
  function cash(orders,movements=[]) {
    const received=orders.filter(o=>o.account==='Efectivo'&&o.paid_at).reduce((n,o)=>n+o.cents,0);
    const returned=orders.filter(o=>o.account==='Efectivo'&&o.refunded_at).reduce((n,o)=>n+o.cents,0);
    const reserved=orders.filter(o=>o.account==='Efectivo'&&o.status==='cancelled'&&o.paid_at&&!o.refunded_at).reduce((n,o)=>n+o.cents,0);
    const balance=received-returned+movements.reduce((n,m)=>n+m.delta,0);
    return {balance,reserved,available:balance-reserved,initialized:movements.some(m=>m.kind==='count')};
  }
  function weekly(orders,asOf=new Date().toISOString()) {
    const rows=new Map(), current=week(asOf);
    function row(key){if(!rows.has(key))rows.set(key,{week:key,gross:0,cash:0,bank:0,refunds:0,count:0,outside:0});return rows.get(key);}
    row(current);
    for(const o of orders){
      if(o.paid_at){const r=row(week(o.paid_at));if(outside(o.paid_at))r.outside+=o.cents;else{r.gross+=o.cents;r.count++;r[o.account==='Efectivo'?'cash':'bank']+=o.cents;}}
      if(o.refunded_at)row(week(o.refunded_at)).refunds+=o.cents;
    }
    const first=[...rows.keys()].sort()[0];
    for(let d=new Date(first+'T12:00:00Z');d.toISOString().slice(0,10)<=current;d.setUTCDate(d.getUTCDate()+7))row(d.toISOString().slice(0,10));
    return [...rows.values()].sort((a,b)=>a.week.localeCompare(b.week)).map((r,i,all)=>({...r,net:r.gross-r.refunds,average:r.count?Math.round(r.gross/r.count):0,change:i&&all[i-1].gross?100*(r.gross-all[i-1].gross)/all[i-1].gross:null,current:r.week===current})).reverse();
  }
  root.ClowderLedger = {day, summarize, week, outside, cash, weekly};
  if (typeof module !== 'undefined') module.exports = root.ClowderLedger;
})(globalThis);
