(()=>{
  let statusFilter='', cityFilter='';
  function parcel(x){return Array.isArray(x?.ozon_parcels)?x.ozon_parcels[0]:x?.ozon_parcels||null}
  function groupStatus(v=''){
    v=String(v||'').toLowerCase();
    if(v.includes('livr')||v.includes('deliver'))return 'delivered';
    if(v.includes('refus'))return 'refused';
    if(v.includes('retour')||v.includes('return'))return 'returned';
    if(v.includes('distribution')||v.includes('livraison')||v.includes('ramass')||v.includes('pickup')||v.includes('transit')||v.includes('cours'))return 'in_progress';
    return 'other';
  }
  function applyFilters(){
    if(typeof ordersData==='undefined'||typeof renderOrders!=='function')return;
    const rows=ordersData.filter(x=>{
      const p=parcel(x), st=p?.ozon_status_label||p?.ozon_status||x.status||'';
      return (!statusFilter||groupStatus(st)===statusFilter)&&(!cityFilter||String(x.city_name||'')===cityFilter);
    });
    renderOrders(rows);
    const badge=document.getElementById('ordersFilteredBadge');
    if(badge)badge.textContent=(statusFilter||cityFilter)?`${rows.length} / ${ordersData.length}`:`${ordersData.length}`;
  }
  function refreshCities(){
    const sel=document.getElementById('orderCityFilter');if(!sel)return;
    const current=sel.value;
    const cities=[...new Set((ordersData||[]).map(x=>String(x.city_name||'').trim()).filter(Boolean))].sort((a,b)=>a.localeCompare(b,'fr'));
    sel.innerHTML='<option value="">Toutes les villes</option>'+cities.map(c=>`<option value="${c.replaceAll('&','&amp;').replaceAll('"','&quot;')}">${c}</option>`).join('');
    if(cities.includes(current))sel.value=current;else if(current){cityFilter='';}
  }
  function install(){
    const head=document.querySelector('#orders .orders-head');if(!head||document.getElementById('orderStatusFilter'))return;
    const box=document.createElement('div');box.className='order-filter-bar';
    box.innerHTML=`<select id="orderStatusFilter" class="order-filter"><option value="">Tous les états</option><option value="delivered">Livré</option><option value="in_progress">En cours</option><option value="refused">Refusé</option><option value="returned">Retourné</option><option value="other">Autre</option></select><select id="orderCityFilter" class="order-filter"><option value="">Toutes les villes</option></select><span id="ordersFilteredBadge" class="badge">0</span>`;
    head.appendChild(box);
    document.getElementById('orderStatusFilter').onchange=e=>{statusFilter=e.target.value;applyFilters()};
    document.getElementById('orderCityFilter').onchange=e=>{cityFilter=e.target.value;applyFilters()};
  }
  const originalRender=window.renderOrders;
  if(typeof originalRender==='function')window.renderOrders=function(rows=ordersData){refreshCities();return originalRender(rows)};
  const observer=new MutationObserver(()=>{install();refreshCities()});
  const start=()=>{install();const list=document.getElementById('ordersList');if(list)observer.observe(list,{childList:true});};
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',start);else start();
  const style=document.createElement('style');style.textContent='.order-filter-bar{display:flex;gap:10px;align-items:center;flex-wrap:wrap}.order-filter{min-width:160px;border:1px solid #e5d9d9;border-radius:12px;padding:10px 12px;background:#fff;font:inherit;color:#33282a;outline:none}.order-filter:focus{border-color:#7b2534}@media(max-width:700px){.order-filter-bar{width:100%}.order-filter{flex:1;min-width:135px}}';document.head.appendChild(style);
})();