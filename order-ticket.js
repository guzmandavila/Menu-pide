'use strict';
window.ClowderTicket = (()=>{
 function phone(value){
  let digits=String(value||'').replace(/[\s()+.-]/g,'');
  if(/^09\d{8}$/.test(digits))digits='593'+digits.slice(1);
  if(digits && !/^[1-9]\d{7,14}$/.test(digits))throw new Error('Escribe un celular válido: 09XXXXXXXX o código de país y número.');
  return digits;
 }
 function text(order){
  const p=order.payload||order;
  const status=order.refunded_at?'↩️ Devolución registrada':order.status==='cancelled'?'🚫 Pedido cancelado':order.status==='paid'?'✅ Cobro confirmado':'⏳ Pendiente de confirmar el cobro';
  return p.details+'\n\n'+status+'\n'+(p.createdBy?'👤 Ingresado por: '+p.createdBy+'\n':'')+(order.created_at?'🗓️ '+new Date(order.created_at).toLocaleString('es-EC',{timeZone:'America/Guayaquil'})+'\n':'');
 }
 function show(order){
  document.getElementById('virtualTicket')?.remove();
  const p=order.payload||order,content=text(order),dialog=document.createElement('dialog');dialog.id='virtualTicket';dialog.className='virtual-ticket';
  const make=(tag,value)=>{const e=document.createElement(tag);if(value)e.textContent=value;return e;};
  const heading=make('h2','🧾 Ticket virtual'),close=make('button','Cerrar'),pre=make('pre',content),actions=make('div');actions.className='ticket-actions';
  close.type='button';close.onclick=()=>dialog.close();
  const status=make('p');status.setAttribute('role','status');status.className='ticket-status';
  const copy=make('button','Copiar ticket');copy.type='button';copy.onclick=async()=>{try{await navigator.clipboard.writeText(content);status.textContent='Ticket copiado con emojis.';}catch{const range=document.createRange();range.selectNodeContents(pre);const selection=window.getSelection();selection.removeAllRanges();selection.addRange(range);status.textContent='Seleccionamos el ticket para que puedas copiarlo.';}};
  const download=make('button','Descargar ticket');download.type='button';download.onclick=()=>{const url=URL.createObjectURL(new Blob(['\ufeff'+content],{type:'text/plain;charset=utf-8'}));const a=make('a');a.href=url;a.download=(p.code||'pedido')+'.txt';a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);};
  const phoneLabel=make('label','Teléfono del cliente (opcional)'),input=make('input');input.type='tel';input.autocomplete='tel';input.placeholder='09XXXXXXXX o +593…';input.value=p.customerPhone||'';phoneLabel.append(input);
  const whatsapp=make('a','Enviar copia por WhatsApp');whatsapp.target='_blank';whatsapp.rel='noopener noreferrer';whatsapp.className='ticket-whatsapp';
  function sync(){try{const number=phone(input.value);input.setCustomValidity('');if(number){whatsapp.href='https://wa.me/'+number+'?text='+encodeURIComponent(content);whatsapp.removeAttribute('aria-disabled');}else{whatsapp.removeAttribute('href');whatsapp.setAttribute('aria-disabled','true');}}catch(error){input.setCustomValidity(error.message);whatsapp.removeAttribute('href');whatsapp.setAttribute('aria-disabled','true');}}
  input.oninput=sync;whatsapp.onclick=e=>{if(!whatsapp.hasAttribute('href')){e.preventDefault();input.focus();input.reportValidity();status.textContent='Agrega el teléfono del cliente para abrir su chat.';}};sync();
  actions.append(copy,download);dialog.append(heading,pre,actions,phoneLabel,whatsapp,make('p','WhatsApp abrirá la copia lista para revisar y enviar.'),status,close);document.body.append(dialog);dialog.showModal();
 }
 return {show,text,phone};
})();
