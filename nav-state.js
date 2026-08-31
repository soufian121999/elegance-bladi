(()=>{
  const KEY='eb_active_view';
  const allowed=new Set(['home','new','orders','customers','delivery','returns']);
  function remember(v){if(!allowed.has(v))return;localStorage.setItem(KEY,v);history.replaceState(null,'','#'+v)}
  function restore(){const hash=location.hash.replace('#',''),saved=localStorage.getItem(KEY),view=allowed.has(hash)?hash:(allowed.has(saved)?saved:'home');const click=()=>{const btn=document.querySelector(`.nav[data-view="${view}"]`);if(btn){btn.click();remember(view);return true}return false};if(!click())setTimeout(click,250)}
  document.addEventListener('click',e=>{const t=e.target.closest?.('[data-view],[data-go]');if(!t)return;const v=t.dataset.view||t.dataset.go;if(allowed.has(v))remember(v)},true);
  window.addEventListener('hashchange',()=>{const v=location.hash.replace('#','');if(!allowed.has(v))return;const btn=document.querySelector(`.nav[data-view="${v}"]`);if(btn&&!btn.classList.contains('active'))btn.click()});
  function loadScript(src,key){if(document.querySelector(`script[data-${key}]`))return;const s=document.createElement('script');s.src=src;s.setAttribute(`data-${key}`,'1');document.body.appendChild(s)}
  function boot(){loadScript('ozon-status-auto-sync.js?v=20260831-0120','eb-ozsync');loadScript('dashboard-pro.js?v=20260831-0120','eb-pro');setTimeout(()=>loadScript('returns.js?v=20260831-0120','eb-returns'),80);setTimeout(()=>loadScript('dashboard-smart-fix.js?v=20260831-0120','eb-smart'),700);setTimeout(restore,350)}
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot);else boot();
})();