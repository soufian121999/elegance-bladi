(()=>{
  const KEY='eb_active_view';
  const allowed=new Set(['home','new','orders','customers','ozon','delivery']);
  function remember(v){if(!allowed.has(v))return;localStorage.setItem(KEY,v);history.replaceState(null,'','#'+v)}
  function restore(){const hash=location.hash.replace('#',''),saved=localStorage.getItem(KEY),view=allowed.has(hash)?hash:(allowed.has(saved)?saved:'home');const btn=document.querySelector(`.nav[data-view="${view}"]`);if(btn){btn.click();remember(view)}}
  document.addEventListener('click',e=>{const t=e.target.closest?.('[data-view],[data-go]');if(!t)return;const v=t.dataset.view||t.dataset.go;if(allowed.has(v))remember(v)},true);
  window.addEventListener('hashchange',()=>{const v=location.hash.replace('#','');if(!allowed.has(v))return;const btn=document.querySelector(`.nav[data-view="${v}"]`);if(btn&&!btn.classList.contains('active'))btn.click()});
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',()=>setTimeout(restore,0));else setTimeout(restore,0);
})();