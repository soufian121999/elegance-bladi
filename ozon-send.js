(()=>{
  function rowsData(){
    try{return Array.isArray(ordersData)?ordersData:[]}catch{return []}
  }
  function addSendButtons(){
    const rows=rowsData();
    const trs=[...document.querySelectorAll('#ordersList tr')];
    if(!rows.length||!trs.length)return;
    trs.forEach((tr,i)=>{
      const x=rows[i]; if(!x)return;
      const p=Array.isArray(x.ozon_parcels)?x.ozon_parcels[0]:x.ozon_parcels;
      const last=tr.lastElementChild;
      if(!last||p?.tracking_number||last.querySelector('.send-ozon-btn'))return;
      last.innerHTML=`<button type="button" class="btn primary send-ozon-btn" data-order-id="${x.id}">Envoyer Ozon</button>`;
    });
  }

  const observer=new MutationObserver(()=>setTimeout(addSendButtons,0));
  const start=()=>{
    const list=document.getElementById('ordersList');
    if(list){observer.observe(list,{childList:true,subtree:true});addSendButtons();}
  };
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',start);else start();

  document.addEventListener('click',async e=>{
    const b=e.target.closest?.('.send-ozon-btn');if(!b)return;
    e.preventDefault();e.stopPropagation();
    if(!confirm('غادي تتصيفط هاد الطلبية فعلياً لـ Ozon Express. نكمل؟'))return;
    const old=b.textContent;b.disabled=true;b.textContent='Envoi...';
    try{
      const s=(await sb.auth.getSession()).data.session;
      if(!s)throw Error('LOGIN_REQUIRED');
      const r=await fetch(`${EB.SUPABASE_URL}/functions/v1/ozon-send-order`,{
        method:'POST',
        headers:{
          'Authorization':'Bearer '+s.access_token,
          'apikey':EB.SUPABASE_KEY,
          'Content-Type':'application/json'
        },
        body:JSON.stringify({order_id:b.dataset.orderId})
      });
      const txt=await r.text();
      let data={};try{data=JSON.parse(txt)}catch{data={error:txt}}
      if(!r.ok||data?.ok===false)throw Error(data?.error||('HTTP '+r.status));
      alert('تم إرسال الطلبية لـ Ozon بنجاح.\nTracking: '+data.tracking_number);
      if(typeof loadOrders==='function')await loadOrders(typeof ordersPage!=='undefined'?ordersPage:1);
    }catch(err){console.error(err);alert('تعذر إرسال الطلبية لـ Ozon: '+(err?.message||err));}
    finally{b.disabled=false;b.textContent=old;}
  });
})();