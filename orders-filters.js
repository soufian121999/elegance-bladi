(()=>{
  let statusFilter='', cityFilter='', allOrdersCache=null, filteredPage=1, loadingAll=null;
  const pageSize=100;
  const baseLoadOrders=loadOrders;
  const baseRenderPagination=renderPagination;
  function parcel(x){return Array.isArray(x?.ozon_parcels)?x.ozon_parcels[0]:x?.ozon_parcels||null}
  function statusOf(x){const p=parcel(x);return String(p?.ozon_status_label||p?.ozon_status||x.status||'').trim()}
  function customerOf(x){return Array.isArray(x?.customers)?x.customers[0]:x?.customers||{}}
  function norm(v){return String(v||'').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g,'').trim()}
  function escOpt(v){return String(v).replaceAll('&','&amp;').replaceAll('"','&quot;').replaceAll('<','&lt;').replaceAll('>','&gt;')}

  async function ensureAllOrders(force=false){
    if(allOrdersCache&&!force)return allOrdersCache;
    if(loadingAll)return loadingAll;
    loadingAll=(async()=>{
      const first=await api('orders?page=1&limit=200');
      const total=Number(first.count||0), pages=Math.max(1,Math.ceil(total/200));
      const rows=[...(first.data||[])];
      if(pages>1){
        const rest=await Promise.all(Array.from({length:pages-1},(_,i)=>api(`orders?page=${i+2}&limit=200`)));
        rest.forEach(j=>rows.push(...(j.data||[])));
      }
      allOrdersCache=rows;
      populateFilterOptions();
      return rows;
    })().finally(()=>loadingAll=null);
    return loadingAll;
  }

  function populateFilterOptions(){
    if(!allOrdersCache)return;
    const statusSel=document.getElementById('orderStatusFilter'), citySel=document.getElementById('orderCityFilter');
    if(statusSel){
      const current=statusSel.value;
      const statuses=[...new Set(allOrdersCache.map(statusOf).filter(Boolean))].sort((a,b)=>a.localeCompare(b,'fr'));
      statusSel.innerHTML='<option value="">Tous les états</option>'+statuses.map(s=>`<option value="${escOpt(s)}">${s}</option>`).join('');
      if(statuses.includes(current))statusSel.value=current;
    }
    if(citySel){
      const current=citySel.value;
      const cities=[...new Set(allOrdersCache.map(x=>String(x.city_name||'').trim()).filter(Boolean))].sort((a,b)=>a.localeCompare(b,'fr'));
      citySel.innerHTML='<option value="">Toutes les villes</option>'+cities.map(c=>`<option value="${escOpt(c)}">${c}</option>`).join('');
      if(cities.includes(current))citySel.value=current;
    }
  }

  function matchesSearch(x,q){
    if(!q)return true;
    const p=parcel(x),c=customerOf(x),hay=[x.order_number,x.city_name,x.status,x.cod_total,c?.name,c?.phone_normalized,p?.tracking_number,p?.ozon_status,p?.ozon_status_label,p?.driver_name,p?.driver_phone].map(norm).join(' ');
    return hay.includes(q);
  }

  function filteredRows(){
    const q=norm(orderSearch?.value||'');
    return (allOrdersCache||[]).filter(x=>(!statusFilter||statusOf(x)===statusFilter)&&(!cityFilter||String(x.city_name||'').trim()===cityFilter)&&matchesSearch(x,q));
  }

  function renderFiltered(page=1){
    const rows=filteredRows(), total=rows.length, pages=Math.max(1,Math.ceil(total/pageSize));
    filteredPage=Math.min(Math.max(1,page),pages);
    const start=(filteredPage-1)*pageSize;
    renderOrders(rows.slice(start,start+pageSize));
    ordersTotalBadge.textContent=total;
    const badge=document.getElementById('ordersFilteredBadge');if(badge)badge.textContent=`${total} / ${allOrdersCache?.length||0}`;
    if(pages<=1){ordersPagination.innerHTML='';return}
    let a=Math.max(1,filteredPage-3),b=Math.min(pages,a+6);a=Math.max(1,b-6);
    let html=`<button class="page-btn filter-page" data-page="${Math.max(1,filteredPage-1)}" ${filteredPage===1?'disabled':''}>‹</button>`;
    for(let i=a;i<=b;i++)html+=`<button class="page-btn filter-page ${i===filteredPage?'active':''}" data-page="${i}">${i}</button>`;
    html+=`<button class="page-btn filter-page" data-page="${Math.min(pages,filteredPage+1)}" ${filteredPage===pages?'disabled':''}>›</button><span class="page-info">${filteredPage} / ${pages}</span>`;
    ordersPagination.innerHTML=html;
    ordersPagination.querySelectorAll('.filter-page').forEach(b=>b.onclick=()=>renderFiltered(Number(b.dataset.page)));
  }

  function filtersActive(){return !!(statusFilter||cityFilter)}

  async function applyFilters(){
    const badge=document.getElementById('ordersFilteredBadge');if(badge)badge.textContent='...';
    await ensureAllOrders();
    if(filtersActive())renderFiltered(1);else await baseLoadOrders(1);
  }

  function install(){
    const head=document.querySelector('#orders .orders-head');if(!head||document.getElementById('orderStatusFilter'))return;
    const box=document.createElement('div');box.className='order-filter-bar';
    box.innerHTML='<select id="orderStatusFilter" class="order-filter"><option value="">Tous les états</option></select><select id="orderCityFilter" class="order-filter"><option value="">Toutes les villes</option></select><span id="ordersFilteredBadge" class="badge">0</span>';
    head.appendChild(box);
    document.getElementById('orderStatusFilter').onchange=e=>{statusFilter=e.target.value;applyFilters()};
    document.getElementById('orderCityFilter').onchange=e=>{cityFilter=e.target.value;applyFilters()};
    ensureAllOrders().catch(console.error);
  }

  loadOrders=async function(page=1){
    if(filtersActive()){await ensureAllOrders();renderFiltered(page);return}
    return baseLoadOrders(page);
  };

  orderSearch.oninput=()=>{
    clearTimeout(searchTimer);
    searchTimer=setTimeout(async()=>{
      if(filtersActive()){await ensureAllOrders();renderFiltered(1)}else baseLoadOrders(1);
    },350);
  };

  const start=()=>install();
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',start);else start();
  const style=document.createElement('style');style.textContent='.order-filter-bar{display:flex;gap:10px;align-items:center;flex-wrap:wrap}.order-filter{min-width:185px;border:1px solid #e5d9d9;border-radius:12px;padding:10px 12px;background:#fff;font:inherit;color:#33282a;outline:none}.order-filter:focus{border-color:#7b2534}@media(max-width:700px){.order-filter-bar{width:100%}.order-filter{flex:1;min-width:140px}}';document.head.appendChild(style);
})();