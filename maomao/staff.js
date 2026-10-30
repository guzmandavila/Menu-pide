'use strict';
(() => {
  const key = 'clowder_staff_session';
  const $ = id => document.getElementById(id);
  let session = null, busy = false;
  try { session = JSON.parse(sessionStorage.getItem(key) || 'null'); } catch (_) {}
  async function api(path, data){
    const response = await fetch((window.CLOWDER_API || '') + path, {
      method:data ? 'POST' : 'GET', cache:'no-store',
      headers:{...(session?.token ? {Authorization:'Bearer '+session.token} : {}), ...(data ? {'Content-Type':'application/json'} : {})},
      ...(data ? {body:JSON.stringify(data)} : {}), signal:AbortSignal.timeout(15000)
    });
    const result = await response.json();
    if(!response.ok){
      if(response.status === 401){session=null;sessionStorage.removeItem(key);showSession();}
      throw new Error(result.error || 'No pudimos verificar la sesión. Inténtalo de nuevo.');
    }
    return result;
  }
  function showSession(){
    $('login').hidden = !!session;
    $('workspace').hidden = !session;
    $('signedIn').textContent = session ? 'Tomas los pedidos como '+session.user+'.' : '';
  }
  async function run(action){
    if(busy) return;
    busy=true; $('status').textContent='';
    document.querySelectorAll('button').forEach(button => {button.disabled=true;});
    try {await action();} catch(error){$('status').textContent=error.name==='TimeoutError' ? 'La conexión tardó demasiado. Inténtalo de nuevo.' : error.message;}
    finally {busy=false;document.querySelectorAll('button').forEach(button => {button.disabled=false;});}
  }
  $('login').onsubmit = event => {event.preventDefault();run(async () => {
    const result = await api('/api/login', {user:$('staffUser').value, pin:$('token').value});
    sessionStorage.setItem(key, JSON.stringify(result));session=result;$('token').value='';showSession();
  });};
  $('logout').onclick = () => run(async () => {await api('/api/logout',{});session=null;sessionStorage.removeItem(key);showSession();});
  // Verificar la identidad en el servicio; este acceso no consulta cobros ni contabilidad.
  showSession();
  if(session) {
    $('workspace').hidden=true; $('login').hidden=false;
    run(async () => {const current=await api('/api/me');session={...session,user:current.user};sessionStorage.setItem(key,JSON.stringify(session));showSession();});
  }
})();
