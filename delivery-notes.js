(()=>{
  const FN=()=>`${EB.SUPABASE_URL}/functions/v1/ozon-delivery-notes`;
  let ready=[];

  async function callDelivery(method='GET',body=null){
    const s=(await sb.auth.getSession()).data.session;
    if(!s)throw Error('LOGIN_REQUIRED');
    const r=await fetch(FN(),{method,headers:{authorization:'Bearer '+s.access_token,'content-type':'application/json'},body:body?JSON.stringify(body):undefined});
    const j=await r.json().catch(()=>({}));
    if(!r.ok||j.ok===false)throw Error(j.error||'DELIVERY_NOTE_API');
    return j;
  }
  const e=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const ord=x=>Array.isArray(x.orders)?x.orders[0]:(x.orders||{});
  const cust=o=>Array.isArray(o.customers)?o.customers[0]:(o.customers||{});
  const when=v=>{try{return new Date(v).toLocaleString('fr-MA',{dateStyle:'short',timeStyle:'short'})}catch{return v||''}};

  function install(){
    const side=document.querySelector('.side'),main=document.querySelector('.main'),logout=document.getElementById('logout');
    if(!side||!main||document.getElementById('delivery'))return;
    const nav=document.createElement('button');nav.className='nav';nav.dataset.view='delivery';nav.innerHTML='▣ <span>Bon de Livraison</span>';
    side.insertBefore(nav,logout);
    const sec=document.createElement('section');sec.id='delivery';sec.className='view';sec.innerHTML=`
      <div class="card bl-card">
        <div class="bl-head"><div><h2>Bon de Livraison Ozon</h2><div class="muted">جمع الطلبيات المرسلة لـ Ozon وإنشاء BL واحد</div></div><button id="blRefresh" class="btn soft">تحديث</button></div>
        <div class="bl-summary"><div><span>Colis prêts</span><b id="blReadyCount">0</b></div><div><span>Sélectionnés</span><b id="blSelectedCount">0</b></div></div>
        <div class="bl-toolbar"><label class="bl-checkall"><input type="checkbox" id="blSelectAll"> تحديد الكل</label><button id="blCreate" class="btn primary" disabled>Créer Bon de Livraison</button></div>
        <div class="order-table-wrap"><table class="order-table bl-table"><thead><tr><th></th><th>الطلب</th><th>Tracking</th><th>الزبون</th><th>المدينة</th><th>COD</th><th>التاريخ</th></tr></thead><tbody id="blReadyRows"><tr><td colspan="7">جاري التحميل...</td></tr></tbody></table></div>
        <div id="blMsg"></div>
      </div>
      <div class="card"><h2>Derniers Bons de Livraison</h2><div id="blHistory" class="bl-history">جاري التحميل...</div></div>`;
    main.appendChild(sec);
    nav.onclick=()=>{go('delivery');pageTitle.textContent='Bon de Livraison';loadDeliveryNotes()};
    document.getElementById('blRefresh').onclick=loadDeliveryNotes;
    document.getElementById('blSelectAll').onchange=ev=>{document.querySelectorAll('.bl-pick').forEach(x=>x.checked=ev.target.checked);syncSelected()};
    document.getElementById('blReadyRows').addEventListener('change',ev=>{if(ev.target.classList.contains('bl-pick'))syncSelected()});
    document.getElementById('blCreate').onclick=createBL;
  }

  function syncSelected(){
    const boxes=[...document.querySelectorAll('.bl-pick')],selected=boxes.filter(x=>x.checked);
    blSelectedCount.textContent=selected.length;blCreate.disabled=!selected.length;
    blSelectAll.checked=boxes.length>0&&selected.length===boxes.length;blSelectAll.indeterminate=selected.length>0&&selected.length<boxes.length;
  }

  function renderReady(){
    blReadyCount.textContent=ready.length;
    blReadyRows.innerHTML=ready.length?ready.map(x=>{const o=ord(x),c=cust(o);return `<tr><td><input class="bl-pick" type="checkbox" value="${e(x.tracking_number)}" checked></td><td><b>${e(o.order_number||'—')}</b></td><td><span class="tracking-code">${e(x.tracking_number)}</span></td><td>${e(c.name||'—')}<br><small>${e(c.phone_normalized||'')}</small></td><td>${e(o.city_name||'')}</td><td>${Number(o.cod_total||0).toFixed(2)} DH</td><td>${e(when(o.created_at))}</td></tr>`}).join(''):'<tr><td colspan="7">ما كاين حتى colis واجد دابا. أي طلب تصيفط لـOzon ومازال ما دخلش فـBL غادي يبان هنا.</td></tr>';
    syncSelected();
  }
  function renderHistory(notes=[]){
    blHistory.innerHTML=notes.length?notes.map(n=>`<div class="bl-note"><div><b>BL ${e(n.ref)}</b><small>${e(when(n.created_at))} · ${Number(n.parcel_count||0)} colis</small></div><div class="bl-links"><a href="${e(n.pdf_url)}" target="_blank" rel="noopener">PDF BL</a><a href="${e(n.tickets_a4_url)}" target="_blank" rel="noopener">Étiquettes A4</a><a href="${e(n.tickets_10x10_url)}" target="_blank" rel="noopener">Tickets 10×10</a></div></div>`).join(''):'مازال ما تخلق حتى Bon de Livraison من السيستيم.';
  }

  async function loadDeliveryNotes(){
    if(!document.getElementById('blReadyRows'))return;
    blReadyRows.innerHTML='<tr><td colspan="7">جاري التحميل...</td></tr>';blMsg.textContent='';
    try{const j=await callDelivery();ready=j.ready||[];renderReady();renderHistory(j.notes||[])}catch(err){blReadyRows.innerHTML=`<tr><td colspan="7">تعذر التحميل: ${e(err.message)}</td></tr>`}
  }

  async function createBL(){
    const tracking=[...document.querySelectorAll('.bl-pick:checked')].map(x=>x.value);
    if(!tracking.length)return;
    if(!confirm(`غادي نخلق Bon de Livraison فـOzon فيه ${tracking.length} colis. نكمل؟`))return;
    blCreate.disabled=true;blCreate.textContent='Création...';blMsg.className='msg';blMsg.textContent='جاري إنشاء Bon de Livraison في Ozon...';
    try{
      const j=await callDelivery('POST',{action:'create',tracking_numbers:tracking});
      blMsg.className='msg ok';blMsg.innerHTML=`تم إنشاء Bon de Livraison بنجاح.<br><b>Référence: ${e(j.ref)}</b> · ${Number(j.parcel_count||0)} colis<div class="bl-success-links"><a target="_blank" rel="noopener" href="${e(j.pdf_url)}">فتح PDF BL</a><a target="_blank" rel="noopener" href="${e(j.tickets_a4_url)}">Étiquettes A4</a><a target="_blank" rel="noopener" href="${e(j.tickets_10x10_url)}">Tickets 10×10</a></div>`;
      await loadDeliveryNotes();
    }catch(err){blMsg.className='msg err';blMsg.textContent='تعذر إنشاء BL: '+(err.message||err)}finally{blCreate.textContent='Créer Bon de Livraison';syncSelected()}
  }

  const style=document.createElement('style');style.textContent=`
    .bl-head,.bl-toolbar,.bl-note{display:flex;align-items:center;justify-content:space-between;gap:14px;flex-wrap:wrap}.bl-summary{display:grid;grid-template-columns:repeat(2,minmax(150px,220px));gap:12px;margin:18px 0}.bl-summary>div{background:#faf7f4;border:1px solid #eee2dd;border-radius:14px;padding:14px}.bl-summary span{display:block;color:#806f69;font-size:12px}.bl-summary b{font-size:24px}.bl-toolbar{margin:10px 0 14px}.bl-checkall{display:flex;gap:8px;align-items:center;font-weight:700}.bl-pick,#blSelectAll{width:18px;height:18px;accent-color:#321d1b}.bl-note{padding:14px 0;border-bottom:1px solid #eee2dd}.bl-note:last-child{border-bottom:0}.bl-note small{display:block;color:#80736f;margin-top:5px}.bl-links,.bl-success-links{display:flex;gap:8px;flex-wrap:wrap}.bl-links a,.bl-success-links a{background:#f1e9e5;color:#321d1b;border-radius:10px;padding:8px 11px;text-decoration:none;font-weight:700}.bl-success-links{margin-top:12px}.bl-table small{direction:ltr;display:inline-block}@media(max-width:720px){.bl-summary{grid-template-columns:1fr 1fr}.bl-table{min-width:900px}}
  `;document.head.appendChild(style);
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',install);else install();
})();