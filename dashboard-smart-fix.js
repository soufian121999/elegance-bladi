(()=>{
  const norm=s=>String(s??'').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g,'');
  const num=v=>Number(String(v??0).replace(',','.').replace(/[^0-9.-]/g,''))||0;
  const fmt=v=>num(v).toLocaleString('fr-MA',{maximumFractionDigits:2});
  const parcel=x=>Array.isArray(x?.ozon_parcels)?x.ozon_parcels[0]:(x?.ozon_parcels||null);
  const status=x=>{const p=parcel(x);return String(p?.ozon_status_label||p?.ozon_status||x?.status||'')};
  const isDelivered=s=>norm(s).includes('livr')||norm(s).includes('deliver');
  const isReturn=s=>norm(s).includes('retour')||norm(s).includes('return');
  const isRefused=s=>norm(s).includes('refus');
  const isCancelled=s=>norm(s).includes('annul');
  const isProgress=s=>!isDelivered(s)&&!isReturn(s)&&!isRefused(s)&&!isCancelled(s);
  const objectText=o=>{try{return norm(JSON.stringify(o||{}))}catch{return ''}};
  const isFactured=x=>{const t=objectText(x);return t.includes('facture')||t.includes('facturee')||t.includes('facturer')};
  async function allOrders(){let out=[],page=1,total=1;do{const j=await api(`orders?page=${page}&limit=100`);out.push(...(j.data||[]));total=Math.max(1,Math.ceil(Number(j.count||out.length)/100));page++}while(page<=total&&page<=100);return out}
  const key=s=>norm(s).replace(/[^a-z0-9]/g,'');
  const pick=(o,names)=>{if(!o||typeof o!=='object')return null;const set=new Set(names.map(key));for(const [k,v] of Object.entries(o))if(set.has(key(k))&&v!==null&&v!==undefined&&v!=='')return v;return null};
  function cityRecords(root){const out=[],seen=new Set();function walk(v,d=0){if(v==null||d>6)return;if(Array.isArray(v)){v.forEach(x=>walk(x,d+1));return}if(typeof v!=='object'||seen.has(v))return;seen.add(v);const n=pick(v,['CITY_NAME','city_name','name','ville','city','label']);const dp=pick(v,['DELIVERED-PRICE','DELIVERED_PRICE','delivered_price','delivery_price','frais_livraison','livraison']);const rp=pick(v,['REFUSED-PRICE','REFUSED_PRICE','refused_price','RETURNED-PRICE','RETURNED_PRICE','returned_price','return_price','frais_refus','refus']);if(n&&(dp!==null||rp!==null)){out.push(v);return}Object.values(v).forEach(x=>walk(x,d+1))}walk(root);return out}
  async function tariffs(){try{const j=await fetch(EB.API+'/cities',{cache:'no-store'}).then(r=>r.json()),map=new Map();cityRecords(j?.data??j).forEach(o=>{const n=pick(o,['CITY_NAME','city_name','name','ville','city','label']),d=pick(o,['DELIVERED-PRICE','DELIVERED_PRICE','delivered_price','delivery_price','frais_livraison','livraison']),r=pick(o,['REFUSED-PRICE','REFUSED_PRICE','refused_price','RETURNED-PRICE','RETURNED_PRICE','returned_price','return_price','frais_refus','refus']);if(n)map.set(norm(n).trim(),{delivered:num(d),refused:num(r)})});return map}catch{return new Map()}}
  function feeFor(x,map,type){const t=map.get(norm(x?.city_name).trim());return t?num(type==='delivered'?t.delivered:t.refused):0}
  function returnCache(){for(const k of ['eb_return_analysis_v4','eb_return_analysis_v3','eb_return_analysis_v2']){try{const c=JSON.parse(localStorage.getItem(k)||'null');if(c?.items)return c.items}catch{}}return {}}
  function cachedType(x,cache){const tr=String(parcel(x)?.tracking_number||'');return tr&&cache[tr]?cache[tr].type:null}
  function findMini(label){return [...document.querySelectorAll('#proDashboard .miniStat')].find(d=>norm(d.querySelector('span')?.textContent).trim()===norm(label).trim())}
  function setMini(label,value,sub,newLabel){const d=findMini(label);if(!d)return false;if(newLabel)d.querySelector('span').textContent=newLabel;const b=d.querySelector('b');if(b)b.textContent=value;const e=d.querySelector('em');if(e&&sub)e.textContent=sub;return true}
  function ensureMini(label,value,sub,color){const stats=document.querySelector('#proDashboard .proStats');if(!stats)return;if([...stats.querySelectorAll('.miniStat span')].some(s=>norm(s.textContent)===norm(label)))return;const d=document.createElement('div');d.className='miniStat';d.style.setProperty('--c',color);d.innerHTML=`<span>${label}</span><b>${value}</b><em>${sub}</em>`;stats.appendChild(d)}
  function setHero(index,title,value,sub,breakdown){const cards=document.querySelectorAll('#proDashboard .proHero .proCard');const c=cards[index];if(!c)return;c.innerHTML=`<small>${title}</small><b>${value}</b><small>${sub}</small>${breakdown||''}`}
  function today(d){if(!d)return false;const a=new Date(d),b=new Date();return a.getFullYear()===b.getFullYear()&&a.getMonth()===b.getMonth()&&a.getDate()===b.getDate()}
  async function refresh(){try{
    const [rows,tar]=await Promise.all([allOrders(),tariffs()]);const sent=rows.filter(x=>parcel(x)?.tracking_number),cache=returnCache();
    const returns=sent.filter(x=>isReturn(status(x))),plainReturn=returns.filter(x=>cachedType(x,cache)==='Retour'||!cachedType(x,cache)),exchange=returns.filter(x=>cachedType(x,cache)==='Échange'),refRet=returns.filter(x=>cachedType(x,cache)==='Refusé et retourné'),annRet=returns.filter(x=>cachedType(x,cache)==='Annulé et retourné');
    const currentRef=sent.filter(x=>isRefused(status(x))&&!isReturn(status(x))),currentAnn=sent.filter(x=>isCancelled(status(x))&&!isReturn(status(x)));const refused=currentRef.length+refRet.length,cancelled=currentAnn.length+annRet.length;
    const delivered=sent.filter(x=>isDelivered(status(x))&&!isReturn(status(x))),factured=delivered.filter(isFactured),nonFactured=delivered.filter(x=>!isFactured(x));
    const progress=sent.filter(x=>isProgress(status(x))),unsent=rows.filter(x=>!parcel(x)?.tracking_number);
    const grossDue=nonFactured.reduce((a,x)=>a+num(x.cod_total),0),deliveryFees=nonFactured.reduce((a,x)=>a+feeFor(x,tar,'delivered'),0);
    const feeOrders=[...plainReturn,...refRet,...annRet,...currentRef,...currentAnn].filter(x=>!isFactured(x));const returnFees=feeOrders.reduce((a,x)=>a+feeFor(x,tar,'refused'),0);const netDue=Math.max(0,grossDue-deliveryFees-returnFees);
    const settled=factured.reduce((a,x)=>a+Math.max(0,num(x.cod_total)-feeFor(x,tar,'delivered')),0),totalCOD=rows.reduce((a,x)=>a+num(x.cod_total),0);
    setHero(0,'Net estimé à recevoir de Ozon',`${fmt(netDue)} DH`,`${nonFactured.length} Livré Non Facturé`,`<div class="moneyBreak"><div><span>COD brut en attente</span><strong>${fmt(grossDue)} DH</strong></div><div><span>− Frais livraison</span><strong>${fmt(deliveryFees)} DH</strong></div><div><span>− Frais refus/retour</span><strong>${fmt(returnFees)} DH</strong></div></div>`);
    setHero(1,'Déjà facturé / réglé par Ozon',`${fmt(settled)} DH`,`${factured.length} commandes Livré Facturé`);
    setHero(2,"Chiffre d'affaires COD total",`${fmt(totalCOD)} DH`,`${rows.length} commandes enregistrées`);
    setMini('Livré',delivered.length,`${delivered.filter(x=>today(parcel(x)?.updated_at||x.updated_at)).length} livrées aujourd'hui`);
    setMini('En cours',progress.length,'Chez Ozon');
    if(!setMini('Livré Payé',nonFactured.length,'Pas encore facturé','Livré Non Facturé'))setMini('Livré Non Facturé',nonFactured.length,'Pas encore facturé');
    setMini('Livré Facturé',factured.length,'Déjà réglé');
    setMini('Retourné',plainReturn.length,'Retours simples; voir page Retours');
    setMini('Refusé',refused,`${refRet.length} Refusé et retourné`);
    setMini('Annulé',cancelled,`${annRet.length} Annulé et retourné`);
    ensureMini('Échange',exchange.length,'Livré puis retourné','#3979b8');
    const note=document.querySelector('#proDashboard .proNote');if(note)note.textContent='Calcul intelligent: Livré Non Facturé = restant à recevoir; Livré Facturé = déjà réglé. Refusé, Annulé, Échange et Retour utilisent aussi l’historique analysé dans Retours.';
  }catch(e){console.error('dashboard smart fix',e)}}
  function boot(){setTimeout(refresh,1800);setTimeout(refresh,6500);document.querySelector('.nav[data-view="home"]')?.addEventListener('click',()=>setTimeout(refresh,900));window.EBRefreshSmartDashboard=refresh}
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot);else boot();
})();