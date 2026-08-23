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
      const data=await api('send-to-ozon',{order_id:orderId});
      if(!data?.ok)throw new Error(data?.error||'OZON_SEND_FAILED');
      alert('تم إرسال الطلبية لـ Ozon بنجاح.\nTracking: '+(data.tracking_number||'—'));
      location.reload();
    }catch(err){
      console.error('Ozon send error',err);
      alert('تعذر إرسال الطلبية لـ Ozon:\n'+(err?.message||String(err)));
      b.disabled=false;b.textContent=old;
    }
  },true);
})();