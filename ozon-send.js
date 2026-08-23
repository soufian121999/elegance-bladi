(()=>{
  document.addEventListener('click',async e=>{
    const b=e.target.closest?.('.send-ozon-btn');if(!b)return;
    e.preventDefault();e.stopPropagation();
    if(!confirm('غادي تتصيفط هاد الطلبية فعلياً لـ Ozon Express. نكمل؟'))return;
    const old=b.textContent;b.disabled=true;b.textContent='Envoi...';
    try{
      const data=await api('send-to-ozon',{order_id:b.dataset.orderId});
      if(!data?.ok)throw Error(data?.error||'Ozon error');
      alert('تم إرسال الطلبية لـ Ozon بنجاح.\nTracking: '+data.tracking_number);
      if(typeof loadOrders==='function')await loadOrders(typeof ordersPage!=='undefined'?ordersPage:1);
    }catch(err){console.error(err);alert('تعذر إرسال الطلبية لـ Ozon: '+(err?.message||err));}
    finally{b.disabled=false;b.textContent=old;}
  });
})();