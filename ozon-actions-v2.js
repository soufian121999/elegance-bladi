(()=>{
  document.addEventListener('click',async e=>{
    const b=e.target.closest?.('.send-ozon-btn');
    if(!b)return;
    e.preventDefault();e.stopPropagation();
    const orderId=String(b.dataset.orderId||'').trim();
    if(!orderId){alert('Order ID manquant.');return}
    if(!confirm('غادي تتصيفط هاد الطلبية فعلياً لـ Ozon Express. نكمل؟'))return;
    const old=b.textContent;
    b.disabled=true;b.textContent='Envoi...';
    try{
      const s=(await sb.auth.getSession()).data.session;
      if(!s)throw new Error('LOGIN_REQUIRED');
      const r=await fetch(EB.SUPABASE_URL+'/functions/v1/ozon-send-order-v2',{
        method:'POST',
        headers:{'authorization':'Bearer '+s.access_token,'content-type':'application/json'},
        body:JSON.stringify({order_id:orderId})
      });
      const data=await r.json().catch(()=>({}));
      if(!r.ok||!data?.ok)throw new Error(data?.error||('HTTP_'+r.status));
      alert((data.already_sent?'الطلبية راه كانت ديجا مرسلة لـ Ozon.':'تم إرسال الطلبية لـ Ozon بنجاح.')+'\nTracking: '+(data.tracking_number||'—'));
      location.reload();
    }catch(err){
      console.error('Ozon send error',err);
      alert('تعذر إرسال الطلبية لـ Ozon:\n'+(err?.message||String(err)));
      b.disabled=false;b.textContent=old;
    }
  },true);
})();