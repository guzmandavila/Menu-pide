'use strict';
window.ClowderInventoryUI=(()=>{
 let api,run,data=null,uploadBusy=false,adjustmentAttempt=null;
 const $=id=>document.getElementById(id);
 const el=(tag,text,cls)=>{const e=document.createElement(tag);if(text!==undefined)e.textContent=text;if(cls)e.className=cls;return e;};
 const qty=n=>new Intl.NumberFormat('es-EC',{maximumFractionDigits:3}).format(n/1000);
 const money=n=>new Intl.NumberFormat('es-EC',{style:'currency',currency:'USD'}).format(n/100);
 const millis=value=>Math.round(Number(value)*1000);
 function ingredientOptions(select){select.replaceChildren();for(const i of data.ingredients){const o=el('option',i.name+' · '+i.unit);o.value=i.id;select.append(o);}}
 function componentRow(container,costs=false){
  const row=el('div',undefined,'inventory-line'),label=el('label','Ingrediente'),select=el('select');select.className='component-id';ingredientOptions(select);label.append(select);
  const amount=el('label','Cantidad (g / ml / unidades)'),input=el('input');Object.assign(input,{type:'number',min:'0.001',step:'0.001',required:true});input.className='component-qty';amount.append(input);row.append(label,amount);
  if(costs){const cost=el('label','Costo total de esta línea ($)'),input=el('input');Object.assign(input,{type:'number',min:'0',step:'0.01',required:true});input.className='component-cost';cost.append(input);row.append(cost);}
  const remove=el('button','Quitar','secondary');remove.type='button';remove.onclick=()=>row.remove();row.append(remove);container.append(row);
 }
 function readLines(container,costs=false){return [...container.querySelectorAll('.inventory-line')].map(row=>({ingredientId:row.querySelector('.component-id').value,qtyMilli:millis(row.querySelector('.component-qty').value),...(costs?{totalCents:Math.round(Number(row.querySelector('.component-cost').value)*100)}:{})}));}
 function render(){
  const low=data.ingredients.filter(i=>i.stock_milli<=i.minimum_milli),empty=data.ingredients.filter(i=>i.stock_milli<=0);
  $('inventoryMetrics').replaceChildren(...[['Ingredientes',data.ingredients.length],['Por reponer',low.length],['Sin existencias',empty.length],['Facturas por revisar',data.invoices.filter(i=>i.status==='draft').length]].map(([label,n])=>{const card=el('div',undefined,'card');card.append(el('span',label),el('strong',String(n)));return card;}));
  $('inventoryAlerts').replaceChildren(...(low.length?low.map(i=>el('p',`${i.stock_milli<=0?'🔴 Sin existencias':'🟠 Reponer pronto'}: ${i.name} · quedan ${qty(i.stock_milli)} ${i.unit}`)):[el('p',data.ingredients.length?'🟢 Los ingredientes están por encima del mínimo.':'Agrega ingredientes y cuenta lo que tienes para empezar.')]));
  $('inventoryStock').replaceChildren(...data.ingredients.map(i=>{const card=el('div',undefined,'stock-card'+(i.stock_milli<=i.minimum_milli?' stock-card--low':''));card.append(el('h4',i.name),el('strong',qty(i.stock_milli)+' '+i.unit),el('small','Avisar al llegar a '+qty(i.minimum_milli)+' '+i.unit));const edit=el('button','Editar ingrediente y mínimo','secondary');edit.type='button';edit.onclick=()=>{$('ingredientEditId').value=i.id;$('ingredientName').value=i.name;$('ingredientUnit').value=i.unit;$('ingredientUnit').disabled=true;$('ingredientMinimum').value=i.minimum_milli/1000;$('ingredientForm').closest('details').open=true;$('ingredientForm').scrollIntoView({block:'center',behavior:'smooth'});};card.append(edit);return card;}));
  ingredientOptions($('adjustIngredient'));
  $('inventoryRecipes').replaceChildren(...data.recipes.map(r=>{const card=el('div',undefined,'stock-card');card.append(el('h4',r.product),el('strong',r.ready?'✓ Lista para descontar':'Borrador · no descuenta'));for(const c of r.components){const i=data.ingredients.find(i=>i.id===c.ingredientId);card.append(el('p',`${i?.name||'Ingrediente'}: ${qty(c.qtyMilli)} ${i?.unit||''}`));}if(r.notes)card.append(el('p',r.notes,'muted'));if(r.ready){const portions=Math.max(0,Math.min(...r.components.map(c=>Math.floor((data.ingredients.find(i=>i.id===c.ingredientId)?.stock_milli||0)/c.qtyMilli))));card.append(el('p',`Alcanza para ${portions} porciones según los ingredientes registrados.`));}const edit=el('button','Revisar receta','secondary');edit.type='button';edit.onclick=()=>{$('recipeForm').closest('details').open=true;$('recipeProduct').value=r.product;$('recipeNotes').value=r.notes||'';$('recipeReady').checked=false;$('recipeLines').replaceChildren();for(const c of r.components){componentRow($('recipeLines'));const row=$('recipeLines').lastElementChild;row.querySelector('.component-id').value=c.ingredientId;row.querySelector('.component-qty').value=c.qtyMilli/1000;}$('recipeForm').scrollIntoView({block:'center',behavior:'smooth'});};card.append(edit);return card;}));
  $('inventoryInvoices').replaceChildren(...data.invoices.map(invoice=>{
   const card=el('div',undefined,'invoice-card');card.append(el('h4',invoice.filename),el('strong',invoice.status==='posted'?'✓ Aprobada · ingredientes sumados':'Por revisar · aún no suma ingredientes'));
   const download=el('button','Descargar original','secondary');download.type='button';download.onclick=()=>run(async()=>{
    const response=await fetch((window.CLOWDER_API||'')+'/api/inventory/files/'+invoice.file_hash,{headers:{Authorization:'Bearer '+api.token()}});if(!response.ok)throw new Error('No se pudo descargar la factura.');const url=URL.createObjectURL(await response.blob()),a=el('a');a.href=url;a.download=invoice.filename;a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);
   });card.append(download);
   if(invoice.status==='draft'){
    const open=el('button','Revisar y organizar ingredientes');open.type='button';open.onclick=()=>{$('invoiceReview').hidden=false;$('invoiceReviewId').value=invoice.id;$('invoiceReviewTitle').textContent='Revisar: '+invoice.filename;$('invoiceLines').replaceChildren();componentRow($('invoiceLines'),true);$('invoiceReview').scrollIntoView({behavior:'smooth',block:'start'});};card.append(open);
   }else card.append(el('p',`${invoice.vendor} · ${invoice.number} · ${invoice.purchased_on}`));return card;
  }));
  $('inventoryMovements').replaceChildren(...data.movements.slice(0,30).map(m=>{const i=data.ingredients.find(i=>i.id===m.ingredient_id);return el('p',`${({purchase:'📦 Compra',preparation:'🥤 Preparación',count:'✓ Conteo',waste:'↗ Desperdicio'})[m.kind]} · ${i?.name} · ${m.delta_milli>0?'+':''}${qty(m.delta_milli)} ${i?.unit} · ${m.note} · ${new Date(m.created_at).toLocaleString('es-EC',{timeZone:'America/Guayaquil'})}`);}));
  const draftNote=$('recipeDraftNote');draftNote.replaceChildren();draftNote.hidden=!data.recipeDraft;
  if(data.recipeDraft){
   draftNote.append(el('strong',data.recipeDraft.product+' · receta por completar'),el('p',data.recipeDraft.parts.map(([name,unit,n])=>`${name}: ${n} ${unit}`).join(' · ')),el('p',data.recipeDraft.notes));
   const button=el('button','Guardar esta receta como borrador','secondary');button.id='milkiDraft';button.type='button';draftNote.append(button);
   button.onclick=()=>run(async()=>{
   data=await api.call('/api/inventory');
   const product=data.recipeDraft.product;if(data.recipes.some(r=>r.product===product))throw new Error('Esta receta ya existe. Usa Revisar receta para actualizarla.');
   const parts=[];for(const [name,unit,amount] of data.recipeDraft.parts){
    const old=data.ingredients.find(i=>i.name.toLocaleLowerCase('es')===name.toLocaleLowerCase('es'));if(old&&old.unit!==unit)throw new Error('La unidad de '+name+' no coincide con la receta.');
    const id=old?.id||crypto.randomUUID();if(!old)await api.call('/api/inventory/ingredients',{id,name,unit,minimumMilli:0});parts.push({ingredientId:id,qtyMilli:amount*1000});
   }
   await api.call('/api/inventory/recipes',{product,components:parts,ready:false,notes:data.recipeDraft.notes});await load();
  });
  }
  $('inventoryLoaded').hidden=false;
 }
 async function load(){
  $('inventoryStatus').textContent='Cargando inventario…';
  try{data=await api.call('/api/inventory');render();$('inventoryStatus').textContent='Las facturas y el inventario se guardan en el servicio, compartidos entre el personal.';}catch(e){$('inventoryLoaded').hidden=true;$('inventoryStatus').textContent='El módulo de inventario necesita estar activado en el servicio. '+e.message;}
 }
 function init(options){
  api=options.api;run=options.run;
  $('inventoryReload').onclick=()=>run(load);
  $('ingredientForm').onsubmit=e=>{e.preventDefault();run(async()=>{await api.call('/api/inventory/ingredients',{id:$('ingredientEditId').value||crypto.randomUUID(),name:$('ingredientName').value,unit:$('ingredientUnit').value,minimumMilli:millis($('ingredientMinimum').value)});$('ingredientForm').reset();$('ingredientEditId').value='';$('ingredientUnit').disabled=false;await load();});};
  $('recipeAddLine').onclick=()=>componentRow($('recipeLines'));
  $('recipeForm').onsubmit=e=>{e.preventDefault();run(async()=>{await api.call('/api/inventory/recipes',{product:$('recipeProduct').value,components:readLines($('recipeLines')),ready:$('recipeReady').checked,notes:$('recipeNotes').value});$('recipeForm').reset();$('recipeLines').replaceChildren();await load();});};
  $('adjustForm').onsubmit=e=>{e.preventDefault();run(async()=>{const i=data.ingredients.find(i=>i.id===$('adjustIngredient').value);const entry={ingredientId:i.id,kind:$('adjustKind').value,qtyMilli:millis($('adjustQty').value),note:$('adjustNote').value};const signature=JSON.stringify(entry);if(!adjustmentAttempt||adjustmentAttempt.signature!==signature)adjustmentAttempt={signature,id:crypto.randomUUID(),expected:i.stock_milli};await api.call('/api/inventory/adjust',{...entry,id:adjustmentAttempt.id,expected:adjustmentAttempt.expected});adjustmentAttempt=null;$('adjustForm').reset();await load();});};
  $('invoiceAddLine').onclick=()=>componentRow($('invoiceLines'),true);
  $('invoiceReview').onsubmit=e=>{e.preventDefault();run(async()=>{const items=readLines($('invoiceLines'),true);if(!confirm('¿Revisaste la factura y las unidades? Se sumarán estos ingredientes. No se registrará una salida de caja.'))return;await api.call('/api/inventory/approve',{id:$('invoiceReviewId').value,vendor:$('invoiceVendor').value,number:$('invoiceNumber').value,purchasedOn:$('invoiceDate').value,items});$('invoiceReview').reset();$('invoiceReview').hidden=true;await load();});};
  $('invoiceUpload').onsubmit=e=>{e.preventDefault();if(uploadBusy)return;run(async()=>{uploadBusy=true;try{const form=new FormData();form.append('file',$('invoiceFile').files[0]);const response=await fetch((window.CLOWDER_API||'')+'/api/inventory/upload',{method:'POST',headers:{Authorization:'Bearer '+api.token()},body:form});const result=await response.json();if(!response.ok)throw new Error(result.error||'No se pudo subir.');$('invoiceUpload').reset();await load();$('inventoryStatus').textContent=result.duplicate?'Esta factura ya estaba guardada. No se duplicó.':'Factura guardada por revisar. Aún no cambió el inventario.';}finally{uploadBusy=false;}});};
 }
 return {init,load};
})();
