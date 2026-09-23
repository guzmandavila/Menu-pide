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
    const delivered = settlements.reduce((n,s) => n+s.cents,0);
    return {accounts, refunds, delivered, pending:bankTotal-delivered};
  }
  root.ClowderLedger = {day, summarize};
  if (typeof module !== 'undefined') module.exports = root.ClowderLedger;
})(globalThis);
