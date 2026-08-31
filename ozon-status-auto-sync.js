(()=>{
  const INTERVAL=5*60*1000,BATCH=4;
  const norm=s=>String(s||'').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g,'');
  const parcel=x=>Array.isArray(x?.ozon_parcels)?x.ozon_parcels[0]:(x?.ozon_parcels||null);
  const status=x=>{const p=parcel(x);return String(p?.ozon_status_label||p?.ozon_status||x?.status||'')};
  const terminal=s=>{const t=norm(s);return t.includes('livr')||t.includes('deliver')||t.includes('retour')||t.includes('return')||t.includes('refus')||t.includes('annul')||t.includes('factur')};
  async function allOrders(){let out=[],page=1,total=1;do{const j=await api(`orders?page=${page}&limit=100`);out.push(...(j.data||[]));total=Math.max(1,Math.ceil(Number(j.count||out.length)/100));page++}while(page<=total&&page<=100);return out}
  async function syncOne(x){const tr=parcel(x)?.tracking_number;if(!tr)return false;try{await api('tracking-history',{tracking_number:tr});return true}catch{return false}}
  async function sync(force=false){if(window.__ebOzonSyncRunning)return;window.__ebOzonSyncRunning=true;try{const rows=await allOrders(),targets=rows.filter(x=>parcel(x)?.tracking_number&&(force||!terminal(status(x))));let ok=0,fail=0;for(let i=0;i<targets.length;i+=BATCH){const r=await Promise.all(targets.slice(i,i+BATCH).map(syncOne));ok+=r.filter(Boolean).length;fail+=r.filter(v=>!v).length}window.dispatchEvent(new CustomEvent('eb:ozon-status-synced',{detail:{checked:targets.length,ok,fail}}));if(window.EBRefreshSmartDashboard)setTimeout(()=>window.EBRefreshSmartDashboard(),200);if(document.getElementById('orders')?.classList.contains('active')&&window.loadOrders)setTimeout(()=>loadOrders(ordersPage||1),250)}finally{window.__ebOzonSyncRunning=false}}
  function boot(){setTimeout(()=>sync(false),900);setInterval(()=>sync(false),INTERVAL);document.addEventListener('visibilitychange',()=>{if(!document.hidden)sync(false)});window.EBSyncOzonStatuses=()=>sync(true)}
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot);else boot();
})();