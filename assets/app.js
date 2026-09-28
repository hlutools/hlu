(function(){
'use strict';

const C=window.HLU_CONFIG||{};
const BASE=C.BASE_PATH||'/hlu/';
const Exam=window.HLUExam;
const $=s=>document.querySelector(s);
const $$=s=>Array.from(document.querySelectorAll(s));
const ROOT=$('#viewRoot');
const HEADER=$('#appHeader');

const KEYS={
  data:'hlu_tools_data_280926',
  saved:'hlu_tools_saved_280926',
  downloads:'hlu_tools_downloads_280926',
  snapshot:'hlu_tools_snapshot_280926',
  notices:'hlu_tools_notices_280926',
  unreadNews:'hlu_tools_unread_news_280926',
  lastSync:'hlu_tools_last_sync_280926',
  searchHistory:'hlu_tools_search_history_280926',
  theme:'hlu_tools_theme_280926',
  analyticsDevice:'hlu_tools_analytics_device'
};
const LEGACY={
  data:['hlu_tools_data_2209265','hlu_tools_data_150926_3','hlu_tools_data_130926'],
  saved:['hlu_tools_saved_2209265','hlu_tools_saved_150926_3','hlu_tools_saved_130926'],
  downloads:['hlu_tools_downloads_2209265','hlu_tools_downloads_150926_3','hlu_tools_downloads_130926'],
  snapshot:['hlu_tools_snapshot_2209265','hlu_tools_content_snapshot_150926_3'],
  notices:['hlu_tools_notices_2209265','hlu_tools_content_notifications_150926_3','hlu_tools_notices_130926'],
  unreadNews:['hlu_tools_unread_news_2209265','hlu_tools_unread_news_item_ids_150926_3'],
  lastSync:['hlu_tools_last_sync_2209265','hlu_tools_last_sync_150926_3','hlu_tools_last_sync_130926']
};

const LABELS={news:'TIN TỨC',soft:'SOFT',docs:'TÀI LIỆU',firmware:'FIRMWARE'};
const SECTION_SUB={
  soft:'Ứng dụng & công cụ dành cho kỹ thuật',
  docs:'Tài liệu hướng dẫn và kỹ thuật',
  firmware:'Firmware thiết bị các hãng',
  news:'Tin tức & cập nhật VNPT'
};
const ART={
  home:'header_260926_home.webp',
  search:'header_260926_tim_kiem.webp',
  saved:'header_260926_da_luu.webp',
  downloads:'header_260926_download.webp',
  notifications:'header_260926_thong_bao.webp',
  resources:'header_260926_tai_nguyen.webp',
  settings:'header_260926_cai_dat.webp',
  about:'header_260926_gioi_thieu.webp',
  news:'header_260926_tin_tuc.webp',
  soft:'header_260926_soft.webp',
  docs:'header_260926_tai_lieu.webp',
  firmware:'header_260926_firmware.webp',
  exam:'header_260926_e_learning.webp'
};

let resources=[];
let route={name:'home',params:{}};
let currentItem=null;
let detailBack='home';
let toastTimer=0;
let loading=false;
let apiLatency=null;
let publicIpValue='--';
let dataError='';
let dataLoading=false;
let homeNewsTimer=null;
let homeNewsIndex=0;
let voiceRecognizer=null;
let examRuntime={bank:null,source:'',message:'',loading:false,attempt:null,selected:{},marked:{},revealed:{},index:0,submitted:false,timedOut:false,deadline:0,historySaved:false,timer:null,configCount:20,configCustom:false};

function read(k,f){try{const v=localStorage.getItem(k);return v==null?f:JSON.parse(v);}catch(_){return f;}}
function write(k,v){try{localStorage.setItem(k,JSON.stringify(v));}catch(_){}}
function remove(k){try{localStorage.removeItem(k);}catch(_){}}
function migrate(){
  for(const [target,sources] of Object.entries(LEGACY)){
    const key=KEYS[target];
    if(localStorage.getItem(key)!=null)continue;
    for(const old of sources){const raw=localStorage.getItem(old);if(raw!=null){localStorage.setItem(key,raw);break;}}
  }
  if(localStorage.getItem(KEYS.unreadNews)==null)write(KEYS.unreadNews,[]);
  if(localStorage.getItem(KEYS.notices)==null)write(KEYS.notices,[]);
  if(localStorage.getItem(KEYS.searchHistory)==null)write(KEYS.searchHistory,[]);
}

function t(v){return String(v==null?'':v);}
function esc(v){return t(v).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#039;'}[c]));}
function strip(v){const d=document.createElement('div');d.innerHTML=t(v);return(d.textContent||'').trim();}
function fold(v){return t(v).normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase();}
function first(o,names,f=''){for(const n of names){if(o&&o[n]!=null&&o[n]!=='')return o[n];}return f;}
function bool(v){if(v==null||v==='')return true;if(typeof v==='boolean')return v;return!['false','0','no','off','ẩn','an','không','khong','inactive'].includes(fold(v).trim());}
function safeUrl(v){const raw=t(v).trim();if(!raw)return'';try{const u=new URL(raw,location.href);return['http:','https:'].includes(u.protocol)?u.href:'';}catch(_){return'';}}
function section(v){const s=fold(v).replace(/[_-]+/g,' ').trim();if(s.includes('news')||s.includes('tin'))return'news';if(s.includes('soft')||s.includes('phan mem'))return'soft';if(s.includes('firm')||s.includes('rom'))return'firmware';return'docs';}
function normalize(row,i,forced){
  const title=first(row,['title','Title','name','Name','ten','Tên'],'Không có tiêu đề');
  return{
    id:t(first(row,['id','ID','Id'],`item-${i}`)),
    section:section(forced||first(row,['section','Section','category','Category'],'docs')),
    title:t(title),brand:t(first(row,['brand','Brand','hang','Hãng'],'')),model:t(first(row,['model','Model'],'')),
    version:t(first(row,['version','Version'],'')),size:t(first(row,['size','Size'],'')),
    description:strip(first(row,['description','Description','moTa','MoTa'],'')),
    viewUrl:safeUrl(first(row,['viewUrl','viewURL','url','URL'],'')),
    downloadUrl:safeUrl(first(row,['downloadUrl','downloadURL','fileUrl','fileURL'],'')),
    resolvedViewUrl:safeUrl(first(row,['resolvedViewUrl','resolvedViewURL'],'')),
    resolvedDownloadUrl:safeUrl(first(row,['resolvedDownloadUrl','resolvedDownloadURL'],'')),
    fileType:t(first(row,['fileType','FileType'],'')),visible:bool(first(row,['visible','Visible'],true)),
    sortOrder:Number(first(row,['sortOrder','order'],0))||0,createdAt:t(first(row,['createdAt','created'],'')),
    updatedAt:t(first(row,['updatedAt','updated','date','Date'],'')),iconUrl:safeUrl(first(row,['iconUrl','iconURL','thumbnail','thumb'],'')),
    imageUrl:safeUrl(first(row,['imageUrl','imageURL','anh','image'],'')),note:strip(first(row,['note','Note','ghiChu'],'')),
    sourceSection:t(first(row,['sourceSection','SourceSection'],'' )).trim().toLowerCase(),
    sourceId:t(first(row,['sourceId','SourceId'],'' )).trim()
  };
}
function extract(payload){
  if(Array.isArray(payload))return payload.map(normalize);
  if(!payload||typeof payload!=='object')return[];
  if(payload.success===false)throw new Error(payload.message||payload.error||'API_ERROR');
  const direct=first(payload,['data','items','result','rows','resources'],null);
  if(Array.isArray(direct))return direct.map(normalize);
  if(direct&&typeof direct==='object')return extract(direct);
  let out=[];['news','soft','docs','firmware'].forEach(k=>{if(Array.isArray(payload[k]))out=out.concat(payload[k].map((r,i)=>normalize(r,i,k)));});
  return out;
}
function sortRows(rows){return rows.filter(x=>x.visible&&x.id&&x.title).sort((a,b)=>a.section.localeCompare(b.section)||a.sortOrder-b.sortOrder||a.title.localeCompare(b.title,'vi'));}
function saved(){const v=read(KEYS.saved,[]);return Array.isArray(v)?v.map(t):[];}
function downloads(){const v=read(KEYS.downloads,[]);return Array.isArray(v)?v.map(x=>typeof x==='string'?{title:x,at:''}:x).filter(x=>x&&x.title):[];}
function notices(){const v=read(KEYS.notices,[]);return Array.isArray(v)?v:[];}
function unreadNews(){const v=read(KEYS.unreadNews,[]);return Array.isArray(v)?v.map(t):[];}
function searchHistory(){const v=read(KEYS.searchHistory,[]);return Array.isArray(v)?v.map(t).filter(Boolean):[];}
function bestImage(x){return x.imageUrl||x.iconUrl||'';}
function bestView(x){return x.resolvedViewUrl||x.viewUrl||'';}
function downloadRequest(x){return x.resolvedDownloadUrl||x.downloadUrl||'';}
function displayDate(x){return x.createdAt||x.updatedAt||'';}
function fmtDate(v){if(!v)return'';const d=new Date(v);if(Number.isNaN(d.getTime()))return t(v).slice(0,10);return new Intl.DateTimeFormat('vi-VN',{day:'2-digit',month:'2-digit',year:'numeric'}).format(d);}
function dateMs(v){const n=Date.parse(v||'');return Number.isNaN(n)?0:n;}
function driveId(url){const m=t(url).match(/\/file\/d\/([^/?#]+)|[?&]id=([^&#]+)/i);return m?(m[1]||m[2]||''):'';}
function previewUrl(x){const u=safeUrl(bestView(x)||x.downloadUrl);if(!u)return'';const id=driveId(u);return id?`https://drive.google.com/file/d/${encodeURIComponent(id)}/preview`:u;}
function empty(icon,title,desc){return`<div class="empty"><span>${icon}</span><b>${esc(title)}</b><p>${esc(desc||'')}</p></div>`;}
function toast(msg){const el=$('#toast');if(!el)return;el.textContent=msg;el.classList.add('show');clearTimeout(toastTimer);toastTimer=setTimeout(()=>el.classList.remove('show'),2400);}
function snapshot(x){return{id:x.id,section:x.section,version:x.version||'',updatedAt:x.updatedAt||''};}
function unreadNoticeCount(){return notices().filter(n=>n.unread!==false).length;}
function notifyMessage(item,type){if(type==='VERSION_UPDATE')return item.section==='news'?'Tin tức được cập nhật':`${LABELS[item.section]||'Nội dung'} được cập nhật`;return item.section==='news'?'Tin tức mới':item.section==='soft'?'Phần mềm mới':item.section==='docs'?'Tài liệu mới':'Firmware mới';}
function processUpdates(fresh){
  const old=read(KEYS.snapshot,[]);
  if(!Array.isArray(old)||!old.length){write(KEYS.snapshot,fresh.map(snapshot));return;}
  const map=new Map(old.map(x=>[t(x.id),x])),un=new Set(unreadNews()),all=notices(),add=[];
  fresh.forEach((item,i)=>{
    const prev=map.get(item.id);let type='';
    if(!prev){type='NEW_ITEM';if(item.section==='news')un.add(item.id);}
    else if(item.section==='news'&&prev.updatedAt&&item.updatedAt&&prev.updatedAt!==item.updatedAt)type='VERSION_UPDATE';
    else if(item.section!=='news'&&item.version&&prev.version!==item.version)type='VERSION_UPDATE';
    if(type)add.push({notificationId:`${type}-${item.id}-${item.updatedAt||item.version||Date.now()+i}`,itemId:item.id,section:item.section,type,title:item.title,message:notifyMessage(item,type),createdAt:new Date().toISOString(),unread:true});
  });
  if(add.length){
    const m=new Map();[...add,...all].forEach(n=>{if(!m.has(n.notificationId))m.set(n.notificationId,n);});write(KEYS.notices,[...m.values()].slice(0,100));
    if('Notification'in window&&Notification.permission==='granted'){try{new Notification(`HLU TOOLS có ${add.length} nội dung mới/cập nhật`,{body:add[0].title,icon:BASE+'assets/icons/icon-192.webp'});}catch(_){}}
  }
  const valid=new Set(fresh.filter(x=>x.section==='news').map(x=>x.id));write(KEYS.unreadNews,[...un].filter(id=>valid.has(id)));write(KEYS.snapshot,fresh.map(snapshot));
}

async function loadData(force=false,silent=false){
  if(loading)return;loading=true;dataLoading=true;dataError='';const url=C.API_URL;const start=performance.now();
  try{
    const ctrl=new AbortController(),tm=setTimeout(()=>ctrl.abort(),C.API_TIMEOUT||20000);
    const r=await fetch(url+(url.includes('?')?'&':'?')+'_='+Date.now(),{cache:'no-store',redirect:'follow',signal:ctrl.signal});clearTimeout(tm);
    if(!r.ok)throw new Error('HTTP '+r.status);
    const payload=await r.json();const fresh=sortRows(extract(payload));if(!fresh.length)throw new Error('EMPTY_DATA');
    apiLatency=Math.round(performance.now()-start);processUpdates(fresh);resources=fresh;write(KEYS.data,fresh);write(KEYS.lastSync,new Date().toISOString());
    if(force&&!silent)toast(`Đã đồng bộ ${fresh.length} nội dung`);
  }catch(e){
    dataError='Không kết nối được API. Đang dùng dữ liệu đã lưu.';
    const cache=read(KEYS.data,[]);if(Array.isArray(cache)&&cache.length)resources=sortRows(cache.map(normalize));
    if(force&&!silent)toast('Không đồng bộ được. Đang dùng dữ liệu đã lưu.');
  }finally{
    loading=false;dataLoading=false;updateChrome();if(['home','news','resources','search','section'].includes(route.name))render();
  }
}
async function clearSync(){remove(KEYS.data);resources=[];await loadData(true,false);}
function deviceId(){let id=localStorage.getItem(KEYS.analyticsDevice);if(!id){id=(crypto.randomUUID?crypto.randomUUID():Date.now()+'-'+Math.random());localStorage.setItem(KEYS.analyticsDevice,id);}return id;}
function track(eventName,extra={}){if(!C.API_URL)return;const payload={action:'analytics',eventName,deviceId:deviceId(),appVersion:C.APP_VERSION||'280926',platform:'web',...extra};fetch(C.API_URL,{method:'POST',headers:{'Content-Type':'text/plain;charset=UTF-8'},body:JSON.stringify(payload),keepalive:true,redirect:'follow'}).catch(()=>{});}

function openDrawer(){$('#drawer').classList.add('open');$('#drawer').setAttribute('aria-hidden','false');$('#scrim').classList.remove('hidden');}
function closeDrawer(){$('#drawer').classList.remove('open');$('#drawer').setAttribute('aria-hidden','true');$('#scrim').classList.add('hidden');}
function parseRoute(){const q=new URLSearchParams(location.search);return{name:q.get('view')||'home',params:Object.fromEntries(q.entries())};}
function routeUrl(name,params={}){const q=new URLSearchParams({view:name});for(const[k,v]of Object.entries(params)){if(v!=null&&v!=='')q.set(k,v);}return BASE+'?'+q.toString();}
function go(name,params={},replace=false){closeDrawer();const url=routeUrl(name,params);history[replace?'replaceState':'pushState']({route:{name,params}},'',url);route={name,params};render();}
function back(){if(history.length>1)history.back();else go('home',{},true);}
function sectionArt(sec){return ART[sec]||ART.resources;}
function articleArt(){if(route.params.origin==='news')return ART.news;return currentItem?sectionArt(currentItem.section):ART.resources;}
function headerConfig(){
  const n=route.name;
  if(n==='home')return{art:ART.home,left:'menu',right:'bell'};
  if(n==='search')return{art:ART.search,left:'back'};
  if(n==='saved')return{art:ART.saved,left:'back'};
  if(n==='downloads')return{art:ART.downloads,left:'back'};
  if(n==='notifications')return{art:ART.notifications,left:'back'};
  if(n==='resources')return{art:ART.resources,left:'back'};
  if(n==='settings')return{art:ART.settings,left:'back'};
  if(n==='about')return{art:ART.about,left:'back'};
  if(n==='news')return{art:ART.news,left:'back'};
  if(n==='section')return{art:sectionArt(route.params.section),left:'back'};
  if(n==='detail')return{art:articleArt(),left:'back',right:currentItem?'fav':''};
  if(n==='viewer')return{art:articleArt(),left:'back',right:'external'};
  if(n==='feedback')return{art:ART.settings,left:'back'};
  if(n.startsWith('exam'))return{art:ART.exam,left:'back'};
  return{art:ART.home,left:'back'};
}
function updateChrome(){
  const h=headerConfig(),art=$('#headerArtwork');
  art.classList.remove('hidden');$('#headerImage').src=BASE+'assets/android-v280926/'+h.art;
  const left=$('#headerLeft'),right=$('#headerRight');left.classList.toggle('hidden',!h.left);$('#headerLeftIcon').textContent=h.left==='menu'?'☰':'‹';
  right.classList.toggle('hidden',!h.right);$('#headerRightIcon').textContent=h.right==='bell'?'♢':h.right==='fav'?(currentItem&&saved().includes(currentItem.id)?'♥':'♡'):h.right==='external'?'↗':'';
  const nb=$('#headerBadge'),cnt=unreadNoticeCount();nb.textContent=cnt>99?'99+':cnt;nb.classList.toggle('hidden',h.right!=='bell'||cnt===0);
  const net=navigator.onLine;$('#drawerStatusDot').classList.toggle('online',net);$('#drawerStatusText').textContent=net?'Dịch vụ đang hoạt động':'Đang chờ kết nối';
  $('#drawerVersion').textContent='Version '+(C.APP_VERSION||'280926');
  $$('.bottom-nav button').forEach(b=>b.classList.toggle('active',b.dataset.route===(['home','search','saved','downloads'].includes(route.name)?route.name:'home')));
  $$('#drawerNav button').forEach(b=>b.classList.toggle('active',b.dataset.route===route.name||(route.name==='section'&&b.dataset.section===route.params.section)));
  const dn=$('#drawerNewsBadge'),uc=unreadNews().length;dn.textContent=uc>99?'99+':uc;dn.classList.toggle('hidden',!uc);
}

function card(item){
  const isNew=item.section==='news'&&unreadNews().includes(item.id),fav=saved().includes(item.id),img=bestImage(item);
  const tag=isNew?'Mới':item.section==='soft'?(item.version||'SOFT'):item.section==='firmware'?(item.version||'Firmware'):(item.section==='docs'?(item.fileType||'Tài liệu'):(item.brand||'Tin tức'));
  return`<article class="content-card ${isNew?'new':''}" data-open-item="${esc(item.id)}"><div class="content-thumb">${img?`<img src="${esc(img)}" alt="" loading="lazy" referrerpolicy="no-referrer">`:(item.section==='news'?'NEWS':'▣')}</div><div class="content-copy"><span class="tag ${isNew?'new':''}">${esc(tag)}</span><h3>${esc(item.title)}</h3><p>${esc(item.description||item.note||item.brand||SECTION_SUB[item.section])}</p>${displayDate(item)?`<time>${esc(fmtDate(displayDate(item)))}</time>`:''}</div><button class="fav-btn ${fav?'saved':''}" data-fav="${esc(item.id)}" type="button">${fav?'♥':'♡'}</button></article>`;
}
function filterItems(query,sec='',brand=''){const q=fold(query).trim();return resources.filter(x=>(!sec||x.section===sec)&&(!brand||fold(x.brand)===fold(brand))&&(!q||fold([x.title,x.brand,x.model,x.version,x.description,x.note,x.fileType].join(' ')).includes(q)));}
function sortedNews(){const un=new Set(unreadNews());return resources.filter(x=>x.section==='news').sort((a,b)=>(un.has(b.id)-un.has(a.id))||dateMs(displayDate(b))-dateMs(displayDate(a))||a.sortOrder-b.sortOrder);}
function resourceCard(sec,title,sub,count,img){const attrs=sec==='exam'?'data-route="exam"':`data-section="${sec}"`;return`<button class="resource-card" ${attrs}><img src="${BASE}assets/android-v280926/${img}" alt=""><span class="resource-copy"><b>${title}</b><span>${sub}</span><small>${count}</small></span></button>`;}

function connectionType(){const c=navigator.connection||navigator.mozConnection||navigator.webkitConnection;if(!c)return'Web';return c.effectiveType?String(c.effectiveType).toUpperCase():(c.type||'Web');}
async function loadPublicIp(force=false){if(!navigator.onLine){publicIpValue='Offline';if(route.name==='home')renderHome();return;}if(publicIpValue!=='--'&&!force)return;try{const ctrl=new AbortController(),tm=setTimeout(()=>ctrl.abort(),6000);const r=await fetch(C.PUBLIC_IP_URL||'https://api64.ipify.org?format=json',{cache:'no-store',signal:ctrl.signal});clearTimeout(tm);const j=await r.json();publicIpValue=j.ip||'Không xác định';}catch(_){publicIpValue='Không xác định';}if(route.name==='home')renderHome();}
function renderHome(){
  const news=sortedNews().slice(0,3),un=unreadNews().length,last=read(KEYS.lastSync,'');
  const updated=last?new Intl.DateTimeFormat('vi-VN',{hour:'2-digit',minute:'2-digit'}).format(new Date(last)):'--';
  ROOT.innerHTML=`<div class="page no-pad">
    <section class="status-card"><div class="status-head"><strong>Tình trạng kết nối</strong><small>Cập nhật: ${esc(updated)}</small><button data-network-refresh aria-label="Làm mới">↻</button></div><div class="status-grid">
      <div class="status-cell ${navigator.onLine?'online':''}"><span>◎</span><b>${navigator.onLine?'Online':'Offline'}</b><small>Internet</small></div>
      <div class="status-cell"><span>⌁</span><b>${esc(connectionType())}</b><small>Kết nối</small></div>
      <div class="status-cell"><span>◉</span><b id="homeIp">${esc(publicIpValue)}</b><small>IP Public</small></div>
      <div class="status-cell"><span>◴</span><b>${apiLatency==null?'--':apiLatency+' ms'}</b><small>API RTT</small></div>
    </div></section>
    <div class="section-title"><span>Tài nguyên</span><button data-route="resources">Xem tất cả ›</button></div>
    <div class="resource-grid">${resourceCard('soft','SOFT','Ứng dụng & công cụ',resources.filter(x=>x.section==='soft').length+' ứng dụng','home_card_soft_bg_210926.webp')}${resourceCard('docs','TÀI LIỆU','Hướng dẫn kỹ thuật',resources.filter(x=>x.section==='docs').length+' tài liệu','home_card_docs_bg_210926.webp')}${resourceCard('firmware','FIRMWARE','Firmware thiết bị',resources.filter(x=>x.section==='firmware').length+' phiên bản','home_card_firmware_bg_210926.webp')}${resourceCard('exam','E-LEARNING','Ôn tập & kỳ thi','Học tập nội bộ','home_card_learning_bg_210926.webp')}</div>
    <section class="home-news-wrap"><div class="section-title"><span>Tin tức ${un?`<em class="menu-badge">${un} mới</em>`:''}</span><button data-route="news">Xem tất cả ›</button></div><div class="home-news-carousel">${renderHomeNewsCarousel(news)}</div></section>
  </div>`;
  bindHomeCarousel(news.length);track('HOME_VIEW');if(publicIpValue==='--')loadPublicIp(false);
}
function renderHomeNewsCarousel(news){
  if(dataLoading&&!news.length)return empty('◌','Đang tải tin tức','');
  if(!news.length&&dataError)return`<div class="home-news-empty"><b>Không tải được tin tức</b><p>${esc(dataError)}</p><button class="btn secondary" data-network-refresh>Thử lại</button></div>`;
  if(!news.length)return empty('📰','Chưa có tin tức','Dữ liệu đang được cập nhật.');
  const idx=Math.min(homeNewsIndex,news.length-1);homeNewsIndex=idx;const item=news[idx],img=bestImage(item),isNew=unreadNews().includes(item.id);
  return`<div class="home-news-slide" data-open-news="${esc(item.id)}"><div class="home-news-thumb">${img?`<img src="${esc(img)}" alt="" referrerpolicy="no-referrer">`:'NEWS'}</div><div class="home-news-copy"><div><h3>${esc(item.title)}</h3>${isNew?'<span class="tag new">MỚI</span>':''}</div><p>${esc(item.description||item.note||'')}</p>${displayDate(item)?`<time>${esc(fmtDate(displayDate(item)))}</time>`:''}</div></div><div class="home-news-dots">${news.map((_,i)=>`<button class="${i===idx?'active':''}" data-news-page="${i}" aria-label="Tin ${i+1}"></button>`).join('')}</div>`;
}
function bindHomeCarousel(count){clearInterval(homeNewsTimer);homeNewsTimer=null;if(count<2)return;homeNewsTimer=setInterval(()=>{if(route.name!=='home'){clearInterval(homeNewsTimer);homeNewsTimer=null;return;}homeNewsIndex=(homeNewsIndex+1)%count;const wrap=ROOT.querySelector('.home-news-carousel');if(wrap)wrap.innerHTML=renderHomeNewsCarousel(sortedNews().slice(0,3));},5000);}

function renderResources(){
  const tab=route.params.tab||'all';const allowed=['all','soft','docs','firmware'];const active=allowed.includes(tab)?tab:'all';
  const rows=resources.filter(x=>['soft','docs','firmware'].includes(x.section)&&(active==='all'||x.section===active)).sort((a,b)=>dateMs(b.updatedAt)-dateMs(a.updatedAt)||a.sortOrder-b.sortOrder);
  ROOT.innerHTML=`<div class="page resources-page"><div class="chip-row resource-tabs">${[['all','Tất cả'],['soft','Soft'],['docs','Tài liệu'],['firmware','Firmware']].map(([k,l])=>`<button class="chip ${active===k?'active':''}" data-resource-tab="${k}">${l}</button>`).join('')}</div>${dataLoading?'<div class="linear-loading"></div>':''}${dataError?`<div class="banner error">${esc(dataError)}</div>`:''}<div class="content-list" style="padding:0">${rows.length?rows.map(card).join(''):empty('▣','Chưa có dữ liệu phù hợp','')}</div></div>`;
}
function popularTerms(){
  const counts=new Map();for(const x of resources){const src=[x.brand,x.model,x.fileType].filter(Boolean);src.forEach(v=>{const s=t(v).trim();if(s.length>=2&&s.length<=28)counts.set(s,(counts.get(s)||0)+1);});}
  return[...counts.entries()].sort((a,b)=>b[1]-a[1]||a[0].localeCompare(b[0],'vi')).slice(0,6).map(x=>x[0]);
}
function searchSuggestions(q){const f=fold(q).trim();if(!f)return[];const pool=[...new Set([...searchHistory(),...resources.flatMap(x=>[x.title,x.brand,x.model]).filter(Boolean)])];return pool.filter(x=>fold(x).includes(f)).slice(0,5);}
function recordSearch(q){q=t(q).trim();if(!q)return;write(KEYS.searchHistory,[q,...searchHistory().filter(x=>fold(x)!==fold(q))].slice(0,20));}
function startVoiceSearch(){
  const R=window.SpeechRecognition||window.webkitSpeechRecognition;if(!R){toast('Trình duyệt này chưa hỗ trợ nhận dạng giọng nói. Bạn vẫn có thể nhập từ khóa bằng bàn phím.');return;}
  try{if(voiceRecognizer)voiceRecognizer.abort();voiceRecognizer=new R();voiceRecognizer.lang='vi-VN';voiceRecognizer.interimResults=false;voiceRecognizer.maxAlternatives=1;voiceRecognizer.onresult=e=>{const text=e.results?.[0]?.[0]?.transcript||'';if(text){route.params.q=text;recordSearch(text);history.replaceState({route},'',routeUrl('search',route.params));renderSearch();track('SEARCH',{searchQuery:text,resultCount:filterItems(text).length,source:'voice'});}};voiceRecognizer.onerror=e=>toast(e.error==='not-allowed'?'Chưa cấp quyền Micro cho trình duyệt.':'Không nhận dạng được giọng nói. Vui lòng thử lại.');voiceRecognizer.start();toast('Đang nghe...');}catch(_){toast('Không thể khởi động nhận dạng giọng nói.');}
}
function renderSearch(){
  const q=route.params.q||'',sec=route.params.section||'',rows=filterItems(q,sec),hist=searchHistory(),terms=popularTerms(),sugs=searchSuggestions(q);
  ROOT.innerHTML=`<div class="page search-page"><div class="search-box"><span>⌕</span><input id="searchInput" value="${esc(q)}" placeholder="Tìm kiếm tài liệu, công cụ, hướng dẫn..."><button class="voice-btn" data-voice-search aria-label="Tìm kiếm bằng giọng nói">◉</button></div>
  ${q&&sugs.length?`<div class="search-discovery"><b>Gợi ý</b><div class="chip-row">${sugs.map(x=>`<button class="chip" data-search-term="${esc(x)}">${esc(x)}</button>`).join('')}</div></div>`:''}
  ${!q&&hist.length?`<div class="search-discovery"><div class="search-head"><b>Lịch sử tìm kiếm</b><button data-clear-search-history>Xóa</button></div><div class="chip-row">${hist.slice(0,5).map(x=>`<button class="chip" data-search-term="${esc(x)}">${esc(x)}</button>`).join('')}</div></div>`:''}
  ${!q&&terms.length?`<div class="search-discovery"><b>🔥 Từ khóa phổ biến</b><div class="popular-grid">${terms.map(x=>`<button class="chip" data-search-term="${esc(x)}">${esc(x)}</button>`).join('')}</div></div>`:''}
  <div class="chip-row"><button class="chip ${!sec?'active':''}" data-search-section="">Tất cả</button>${[['soft','Soft'],['docs','Tài liệu'],['firmware','Firmware'],['news','Tin tức']].map(([k,l])=>`<button class="chip ${sec===k?'active':''}" data-search-section="${k}">${l}</button>`).join('')}</div>
  <div class="summary">${q?`${rows.length} kết quả cho “${esc(q)}”`:`Tất cả nội dung · ${rows.length} mục`}</div><div class="content-list" style="padding:0">${rows.length?rows.map(card).join(''):empty('⌕','Không tìm thấy kết quả','Thử một từ khóa khác.')}</div></div>`;
}
function renderSection(){
  const sec=route.params.section||'soft',q=route.params.q||'',brand=route.params.brand||'';const brands=['docs','firmware'].includes(sec)?[...new Set(resources.filter(x=>x.section===sec&&x.brand).map(x=>x.brand))].sort((a,b)=>a.localeCompare(b,'vi')):[];const rows=filterItems(q,sec,brand);
  ROOT.innerHTML=`<div class="page"><label class="search-box"><span>⌕</span><input id="sectionSearch" value="${esc(q)}" placeholder="Tìm ${LABELS[sec]||'nội dung'}..."></label>${brands.length?`<div class="chip-row"><button class="chip ${!brand?'active':''}" data-brand="">Tất cả</button>${brands.map(x=>`<button class="chip ${brand===x?'active':''}" data-brand="${esc(x)}">${esc(x)}</button>`).join('')}</div>`:''}<div class="summary">${rows.length} mục • ${esc(SECTION_SUB[sec])}</div><div class="content-list" style="padding:0">${rows.length?rows.map(card).join(''):empty('▣','Chưa có nội dung','Dữ liệu đang được cập nhật.')}</div></div>`;track('SECTION_VIEW',{section:sec});
}
function renderNews(){const rows=sortedNews(),n=unreadNews().length;ROOT.innerHTML=`<div class="page no-pad">${dataLoading?'<div class="linear-loading"></div>':''}${dataError?`<div class="banner error">${esc(dataError)} <button data-network-refresh>Thử lại</button></div>`:''}${n?`<div class="banner">${n} bài viết mới chưa đọc</div>`:''}<div class="news-list">${rows.length?rows.map(card).join(''):empty('📰','Chưa có tin tức','')}</div></div>`;}
function fileKind(x){const f=fold(x.fileType||'');const u=fold(bestView(x)||downloadRequest(x));if(f.includes('video')||/\.(mp4|webm|mov)(\?|$)/.test(u))return'video';if(f.includes('image')||/\.(png|jpg|jpeg|webp|gif)(\?|$)/.test(u))return'image';if(f||/\.(pdf|docx?|xlsx?|pptx?|txt|zip|rar)(\?|$)/.test(u))return'document';return'other';}
function renderSaved(){
  const ids=saved(),all=ids.map(id=>resources.find(x=>x.id===id)).filter(Boolean),q=route.params.q||'',kind=route.params.kind||'',sort=route.params.sort||'new',grid=route.params.grid==='1';let rows=all.filter(x=>(!q||fold(x.title).includes(fold(q)))&&(!kind||fileKind(x)===kind));
  rows=sort==='az'?rows.sort((a,b)=>a.title.localeCompare(b.title,'vi')):sort==='old'?rows.sort((a,b)=>dateMs(displayDate(a))-dateMs(displayDate(b))):rows.sort((a,b)=>dateMs(displayDate(b))-dateMs(displayDate(a)));
  ROOT.innerHTML=`<div class="page saved-page"><div class="search-box"><span>⌕</span><input id="savedSearch" value="${esc(q)}" placeholder="Tìm kiếm file đã lưu..."></div><div class="chip-row"><button class="chip ${!kind?'active':''}" data-saved-kind="">Tất cả (${all.length})</button>${[['video','Video'],['image','Hình ảnh'],['document','Tài liệu']].map(([k,l])=>`<button class="chip ${kind===k?'active':''}" data-saved-kind="${k}">${l} (${all.filter(x=>fileKind(x)===k).length})</button>`).join('')}</div><div class="catalog-toolbar"><select id="savedSort"><option value="new" ${sort==='new'?'selected':''}>Mới nhất</option><option value="old" ${sort==='old'?'selected':''}>Cũ nhất</option><option value="az" ${sort==='az'?'selected':''}>Tên A–Z</option></select><div><button data-saved-grid="0" class="${!grid?'active':''}">☷</button><button data-saved-grid="1" class="${grid?'active':''}">▦</button></div></div><div class="content-list ${grid?'saved-grid':''}" style="padding:0">${rows.length?rows.map(card).join(''):empty('♡','Chưa có mục đã lưu','')}</div></div>`;
}
function renderDownloads(){
  const all=downloads(),q=route.params.q||'',sort=route.params.sort||'new';let rows=all.filter(x=>!q||fold(x.title).includes(fold(q)));rows=sort==='az'?rows.sort((a,b)=>a.title.localeCompare(b.title,'vi')):sort==='old'?rows.slice().reverse():rows;
  ROOT.innerHTML=`<div class="page downloads-page"><div class="search-box"><span>⌕</span><input id="downloadSearch" value="${esc(q)}" placeholder="Tìm kiếm tệp đã tải..."></div><div class="chip-row"><button class="chip active">Tất cả (${all.length})</button><button class="chip">Hoàn tất (${all.length})</button></div><div class="catalog-toolbar"><select id="downloadSort"><option value="new" ${sort==='new'?'selected':''}>Mới nhất</option><option value="old" ${sort==='old'?'selected':''}>Cũ nhất</option><option value="az" ${sort==='az'?'selected':''}>Tên A–Z</option></select>${all.length?'<button data-clear-downloads class="link-button">Xóa lịch sử</button>':''}</div><div class="download-list">${rows.length?rows.map(x=>`<article class="download-row" data-download-title="${esc(x.title)}"><span>⇩</span><div><b>${esc(x.title)}</b>${x.at?`<small>${esc(fmtDate(x.at))}</small>`:''}</div></article>`).join(''):empty('⇩','Chưa có yêu cầu tải xuống','Trình duyệt sẽ quản lý file tải; HLU TOOLS lưu lịch sử tại đây.')}</div></div>`;
}
function renderNotifications(){const rows=notices(),un=rows.filter(x=>x.unread!==false).length;ROOT.innerHTML=`<div class="page no-pad"><div class="notice-toolbar"><b>THÔNG BÁO</b>${un?'<button data-mark-all>ĐỌC HẾT</button>':''}</div><div class="notice-list">${rows.length?rows.map(n=>`<article class="notice-card ${n.unread!==false?'unread':''}" data-notice="${esc(n.notificationId)}" data-notice-item="${esc(n.itemId)}"><span class="emoji">${n.section==='news'?'📰':n.section==='soft'?'🧰':n.section==='docs'?'📄':'⚙️'}</span><h3>${esc(n.title)}</h3><p>${esc(n.message)}</p><time>${esc(fmtDate(n.createdAt))}</time></article>`).join(''):empty('♢','Chưa có thông báo','Nội dung mới hoặc cập nhật sẽ hiển thị tại đây.')}</div></div>`;}
function renderDetail(){if(!currentItem){ROOT.innerHTML=empty('▣','Không tìm thấy nội dung','');return;}const x=currentItem,img=bestImage(x),meta=[['Phiên bản',x.version],['Dung lượng',x.size],['Định dạng',x.fileType],['Hãng',x.brand],['Model',x.model]].filter(v=>v[1]);ROOT.innerHTML=`<article class="detail"><h2>${esc(x.title)}</h2>${displayDate(x)?`<time>${esc(fmtDate(displayDate(x)))}</time>`:''}${x.description?`<div class="detail-text">${esc(x.description)}</div>`:''}${x.note?`<div class="detail-note">${esc(x.note)}</div>`:''}${img?`<img src="${esc(img)}" alt="" referrerpolicy="no-referrer">`:''}${meta.length?`<div class="meta">${meta.map(v=>`<div><b>${v[0]}:</b> ${esc(v[1])}</div>`).join('')}</div>`:''}<div class="actions">${downloadRequest(x)?'<button class="primary" data-download-current>⇩ TẢI XUỐNG</button>':''}${previewUrl(x)?`<button class="secondary" data-view-current>↗ ${x.section==='news'?'XEM TIN':'XEM TÀI LIỆU'}</button>`:''}</div></article>`;}
function renderViewer(){const url=currentItem&&previewUrl(currentItem);ROOT.innerHTML=url?`<div class="viewer"><iframe src="${esc(url)}" title="${esc(currentItem.title)}"></iframe></div>`:empty('▣','Không thể mở nội dung','Liên kết xem không hợp lệ.');}
function settingsSection(title,html){return`<section class="settings-section"><div class="settings-title">${title}</div><div class="settings-card">${html}</div></section>`;}
function renderSettings(){
  const ct=C.CONTACT||{},theme=read(KEYS.theme,'system');
  ROOT.innerHTML=`<div class="settings">${settingsSection('GIAO DIỆN',`<div class="settings-row"><span class="settings-icon">◐</span><span class="settings-copy"><b>Chế độ giao diện</b><small>Theo hệ thống, sáng hoặc tối</small></span><select id="themeSelect"><option value="system" ${theme==='system'?'selected':''}>Hệ thống</option><option value="light" ${theme==='light'?'selected':''}>Sáng</option><option value="dark" ${theme==='dark'?'selected':''}>Tối</option></select></div>`)}${settingsSection('DỮ LIỆU',`<button class="settings-row" data-sync><span class="settings-icon">↻</span><span class="settings-copy"><b>Đồng bộ dữ liệu</b><small>Cập nhật dữ liệu mới nhất từ máy chủ</small></span><span>›</span></button><button class="settings-row" data-notify-enable><span class="settings-icon">♢</span><span class="settings-copy"><b>Thông báo Web</b><small>${'Notification'in window?(Notification.permission==='granted'?'Đã cấp quyền':'Nhấn để cấp quyền trình duyệt'):'Trình duyệt không hỗ trợ Web Notification'}</small></span><span>›</span></button>`)}${settingsSection('HỖ TRỢ',`<button class="settings-row" data-route="feedback"><span class="settings-icon">✉</span><span class="settings-copy"><b>Góp ý cho nhà phát triển</b><small>Báo lỗi, đề xuất tính năng hoặc góp ý khác</small></span><span>›</span></button>`)}${settingsSection('LIÊN HỆ',`<a class="settings-row" href="${esc(ct.facebook||'#')}" target="_blank" rel="noopener"><span class="settings-icon">f</span><span class="settings-copy"><b>Facebook</b><small>${esc(ct.developer||'Cường VNPT')}</small></span></a><a class="settings-row" href="${esc(ct.zalo||'#')}" target="_blank" rel="noopener"><span class="settings-icon">Z</span><span class="settings-copy"><b>Zalo</b><small>${esc(ct.developer||'Cường VNPT')}</small></span></a><a class="settings-row" href="tel:${esc(ct.phone||'')}"><span class="settings-icon">☎</span><span class="settings-copy"><b>Điện thoại</b><small>${esc(ct.phone||'')}</small></span></a>`)}${settingsSection('THÔNG TIN',`<div class="settings-row"><span class="settings-icon">⌂</span><span class="settings-copy"><b>Đơn vị</b><small>${esc(C.UNIT_NAME||'VNPT HOA LƯ')}</small></span></div><button class="settings-row" data-route="about"><span class="settings-icon">ⓘ</span><span class="settings-copy"><b>Thông tin phiên bản</b><small>HLU TOOLS v${esc(C.APP_VERSION||'280926')} • Web/PWA</small></span><span>›</span></button>`)}<div class="thanks">“Cảm ơn bạn đã đồng hành cùng HLU TOOLS”<br>Kết nối - Chia sẻ - Hiệu Quả</div></div>`;
}
function renderFeedback(){ROOT.innerHTML=`<form id="feedbackForm" class="feedback-form"><label>Loại góp ý<select id="feedbackType"><option>Báo lỗi</option><option>Đề xuất tính năng</option><option>Link tải lỗi</option><option>Nội dung sai</option><option>Khác</option></select></label><label>Tiêu đề<input id="feedbackTitle" maxlength="120" required></label><label>Nội dung<textarea id="feedbackContent" maxlength="1500" rows="7" required></textarea></label><label>Thông tin liên hệ (không bắt buộc)<input id="feedbackContact" maxlength="100"></label><button class="btn primary" type="submit">GỬI GÓP Ý</button></form>`;track('FEEDBACK_OPEN');}
function renderAbout(){ROOT.innerHTML=`<article class="about-card"><h2>HLU TOOLS</h2><p style="color:var(--muted)">Kết nối - Chia sẻ - Hiệu Quả</p><p>HLU TOOLS hỗ trợ tập trung và tra cứu nhanh các tài nguyên phục vụ công việc kỹ thuật như phần mềm, tài liệu, firmware, tin tức và E‑Learning.</p><p>Phiên bản Web/PWA được dựng theo source Android 280926, giữ các chức năng phù hợp với nền tảng trình duyệt.</p><p>Phiên bản Web: <b>${esc(C.APP_VERSION||'280926')}</b></p><p><a href="${esc(C.WEB_URL||location.origin+BASE)}" target="_blank" rel="noopener">${esc(C.WEB_URL||location.href)}</a></p><p style="text-align:center;color:var(--deep);font-weight:800">HLU TOOLS – Kết nối • Chia sẻ • Hiệu Quả</p></article>`;}

async function ensureExam(refresh=true){if(examRuntime.bank)return examRuntime.bank;if(examRuntime.loading)return null;examRuntime.loading=true;renderExamHub();try{examRuntime.bank=await Exam.ExamRepository.load();examRuntime.source=Exam.ExamRepository.source;renderExamHub();if(refresh){const r=await Exam.ExamRepository.refreshOnline();examRuntime.bank=r.bank;examRuntime.source=r.source;examRuntime.message=r.userMessage||'';renderExamHub();}}finally{examRuntime.loading=false;}return examRuntime.bank;}
function renderExamHub(){const bank=examRuntime.bank,history=Exam.ExamHistoryStore.load();if(!bank){ROOT.innerHTML=`<div class="exam-wrap">${empty('♟','Đang tải E-Learning','')}</div>`;setTimeout(()=>ensureExam(true),0);return;}const topics=bank.topics||[],best=history.reduce((m,x)=>Math.max(m,Number(x.percent)||0),-1);ROOT.innerHTML=`${examRuntime.message?`<div class="exam-sync">${esc(examRuntime.message)}</div>`:''}<div class="exam-wrap"><section class="exam-overview"><h2>HLU TOOLS E-Learning</h2><p>${topics.length} chủ đề • ${bank.totalQuestionCount} câu hỏi</p><div class="exam-metrics"><div class="exam-metric"><b>${history.length}</b><small>Lượt đã làm</small></div><div class="exam-metric"><b>${best<0?'--':best+'%'}</b><small>Điểm cao nhất</small></div><div class="exam-metric"><b>${bank.meta.bankVersion?'v'+esc(bank.meta.bankVersion):'Local'}</b><small>Ngân hàng</small></div></div>${bank.meta.updatedAt?`<p style="font-size:11px;color:var(--muted2)">Cập nhật ngân hàng: ${esc(bank.meta.updatedAt)}</p>`:''}</section><div class="exam-title"><h3>LUYỆN TẬP THEO CHỦ ĐỀ</h3><p>Chọn một chủ đề để ôn tập và xem đáp án ngay sau khi trả lời.</p></div>${topics.length?`<div class="practice-scroll">${topics.map(tp=>`<article class="exam-card practice-card"><h4>${esc(tp.title)}</h4><p>${esc(tp.subtitle)}</p><small>${Exam.ExamRepository.questionsFor(tp.id).length} câu hiện có</small><button class="btn primary" data-practice="${esc(tp.id)}" ${Exam.ExamRepository.questionsFor(tp.id).length?'':'disabled'}>▶ Luyện tập</button></article>`).join('')}</div>`:empty('♟','Chưa có ngân hàng câu hỏi','')}<div class="exam-title"><h3>THI THỬ</h3><p>Làm đề theo thời gian và số câu đã cấu hình cho từng chủ đề.</p></div>${topics.length?`<section class="exam-card">${topics.map(tp=>`<button class="mock-row" data-exam-config="${esc(tp.id)}" style="width:100%;border:0;background:transparent;text-align:left"><span class="round">◴</span><div><b>${esc(tp.title)}</b><small>${Math.min(tp.examQuestionCount,Exam.ExamRepository.questionsFor(tp.id).length)} câu • ${tp.durationMinutes} phút</small></div><span>›</span></button>`).join('')}</section>`:''}<div class="exam-title"><h3>LỊCH SỬ KẾT QUẢ</h3><p>${history.length?'Hiển thị 5 kết quả gần nhất trên thiết bị này.':'Chưa có lượt luyện tập hoặc thi thử nào.'}</p></div>${history.length?history.slice(0,5).map(historyCard).join(''):`<div class="platform-note">Kết quả sau khi hoàn thành bài sẽ được lưu tại đây.</div>`}</div>`;}
function historyCard(x){let date='';try{date=new Intl.DateTimeFormat('vi-VN',{day:'2-digit',month:'2-digit',year:'numeric',hour:'2-digit',minute:'2-digit'}).format(new Date(x.finishedAt));}catch(_){}return`<article class="history-row"><span class="history-score">${esc(x.percent)}%</span><div><b>${esc(x.topicTitle)}</b><small>${x.mode==='test'?'Thi thử':'Luyện tập'} • ${esc(x.correct)}/${esc(x.total)} câu</small></div><small>${esc(date)}</small></article>`;}
async function renderExamConfig(){const bank=examRuntime.bank||await ensureExam(false);if(!bank)return;const tp=bank.topics.find(x=>x.id===route.params.topic);if(!tp){ROOT.innerHTML=empty('♟','Không tìm thấy chủ đề thi','');return;}const current=Exam.MOCK_COUNTS.includes(tp.examQuestionCount)?tp.examQuestionCount:Exam.DEFAULT_MOCK_COUNT;examRuntime.configCount=Exam.MOCK_COUNTS.includes(examRuntime.configCount)?examRuntime.configCount:current;ROOT.innerHTML=`<div class="exam-wrap"><section class="exam-card"><h2 style="margin:0;font-size:18px">${esc(tp.title)}</h2><p style="color:var(--muted)">${Exam.ExamRepository.questionsFor(tp.id).length} câu hiện có • ${tp.durationMinutes} phút</p></section><section class="exam-card"><label style="display:flex;align-items:center;gap:10px"><input id="customExam" type="checkbox" ${examRuntime.configCustom?'checked':''}><span><b>Tùy chỉnh đề thi</b><small style="display:block;color:var(--muted)">${examRuntime.configCustom?'Chọn số lượng câu muốn làm':`Dùng mặc định hiện tại: ${tp.examQuestionCount} câu`}</small></span></label>${examRuntime.configCustom?`<div class="exam-config-choice">${Exam.MOCK_COUNTS.map(n=>`<button class="chip ${examRuntime.configCount===n?'active':''}" data-exam-count="${n}">${n} câu</button>`).join('')}</div>`:''}</section><section class="exam-card"><b>Thời gian thi</b><p style="color:var(--muted)">${tp.durationMinutes} phút • cấu hình riêng theo chủ đề</p></section><button class="btn primary" data-start-mock="${esc(tp.id)}">▶ BẮT ĐẦU THI</button></div>`;}
async function startAttempt(topicId,mode,count){const bank=examRuntime.bank||await ensureExam(false);const tp=bank&&bank.topics.find(x=>x.id===topicId);if(!tp)return toast('Không tìm thấy chủ đề');const attempt=Exam.ExamEngine.createAttempt(bank,tp,mode,count);if(!attempt.questions.length)return toast('Chưa có câu hỏi cho chủ đề này');examRuntime={...examRuntime,attempt,selected:{},marked:{},revealed:{},index:0,submitted:false,timedOut:false,deadline:mode==='test'?Date.now()+tp.durationMinutes*60000:0,historySaved:false};go('exam-run',{topic:topicId,mode,count:count||''});}
function ensureAttemptFromRoute(){if(examRuntime.attempt&&examRuntime.attempt.topic.id===route.params.topic&&examRuntime.attempt.mode===route.params.mode)return true;const bank=examRuntime.bank;if(!bank)return false;const tp=bank.topics.find(x=>x.id===route.params.topic);if(!tp)return false;const count=Number(route.params.count)||undefined;examRuntime.attempt=Exam.ExamEngine.createAttempt(bank,tp,route.params.mode||'practice',count);examRuntime.selected={};examRuntime.marked={};examRuntime.revealed={};examRuntime.index=0;examRuntime.submitted=false;examRuntime.timedOut=false;examRuntime.deadline=(route.params.mode==='test')?Date.now()+tp.durationMinutes*60000:0;examRuntime.historySaved=false;return true;}
async function renderExamRun(){if(!examRuntime.bank){await ensureExam(false);}if(!ensureAttemptFromRoute()){ROOT.innerHTML=empty('♟','Không tìm thấy câu hỏi cho chủ đề này','');return;}const at=examRuntime.attempt;if(examRuntime.submitted){clearExamTimer();const score=Exam.ExamEngine.score(at,examRuntime.selected);if(!examRuntime.historySaved){Exam.ExamHistoryStore.add(at,score);examRuntime.historySaved=true;}ROOT.innerHTML=`<div class="exam-wrap">${examRuntime.timedOut?'<div class="exam-sync">Hết thời gian. Bài thi đã được tự động nộp và khóa thao tác.</div>':''}<section class="exam-card result-score"><div class="trophy">🏆</div><h2>${esc(at.topic.title)}</h2><strong>${score.percent}%</strong><p>Đúng ${score.correct}/${score.total} câu</p><button class="btn primary" data-route="exam">VỀ DANH SÁCH CHỦ ĐỀ</button></section><div class="exam-title"><h3>XEM LẠI ĐÁP ÁN</h3></div>${at.questions.map(q=>reviewQuestion(q,examRuntime.selected[q.source.id]||[])).join('')}</div>`;return;}const q=at.questions[examRuntime.index],sel=new Set(examRuntime.selected[q.source.id]||[]),revealed=at.mode==='practice'&&examRuntime.revealed[q.source.id]===true,correct=Exam.ExamEngine.isAnswerCorrect(q.source,[...sel]),remaining=at.mode==='test'?Math.max(0,Math.ceil((examRuntime.deadline-Date.now())/1000)):0;ROOT.innerHTML=`<div class="exam-wrap"><section class="exam-card"><h3 style="margin:0;color:#015acb">${esc(at.topic.title)}</h3><div class="exam-metrics"><div class="exam-metric"><b>${at.questions.length} câu</b><small>Tổng</small></div><div class="exam-metric"><b id="examTimer">${at.mode==='test'?formatTime(remaining):'Luyện tập'}</b><small>${at.mode==='test'?'Thời gian':'Chế độ'}</small></div><div class="exam-metric"><b>Xáo trộn</b><small>Đề</small></div></div></section><section class="exam-card"><div class="exam-run-head"><b>Câu ${examRuntime.index+1}/${at.questions.length}</b><span class="progress"><i style="width:${((examRuntime.index+1)/at.questions.length*100).toFixed(1)}%"></i></span></div><div class="question-text">${esc(q.source.text)}</div><div class="question-help">${q.source.type==='true_false'?'Chọn Đúng hoặc Sai.':'Có thể chọn một hoặc nhiều đáp án.'}</div><div class="option-list">${q.options.map((o,i)=>optionHtml(q,o,i,sel,revealed)).join('')}</div>${at.mode==='practice'&&q.source.type==='multi_choice'&&!revealed?`<button class="btn primary" data-reveal ${sel.size?'':'disabled'}>✓ KIỂM TRA ĐÁP ÁN</button>`:''}${revealed?`<div class="exam-feedback ${correct?'ok':''}"><b>${correct?'Chính xác':'Chưa chính xác'}</b>${q.source.explanation?`<p>${esc(q.source.explanation)}</p>`:''}</div>`:''}</section><div class="question-nav">${at.questions.map((qq,i)=>`<button class="${i===examRuntime.index?'active':(examRuntime.selected[qq.source.id]||[]).length?'answered':examRuntime.marked[qq.source.id]?'marked':''}" data-q-index="${i}">${i+1}</button>`).join('')}</div><div class="exam-actions"><button class="btn secondary" data-mark>☆ Đánh dấu</button><button class="btn secondary" data-prev ${examRuntime.index===0?'disabled':''}>‹ Trước</button><button class="btn primary" data-next ${(at.mode==='practice'&&!revealed)?'disabled':''}>${examRuntime.index<at.questions.length-1?'Câu tiếp':'Nộp'} ›</button></div>${at.mode==='test'&&examRuntime.index<at.questions.length-1?'<button class="btn primary" data-submit-exam>NỘP BÀI</button>':''}</div>`;if(at.mode==='test')startExamTimer();}
function optionHtml(q,o,i,sel,revealed){const selected=sel.has(o.id);let cls=selected?'selected ':'';if(revealed){if(o.correct)cls+='correct ';else if(selected)cls+='wrong ';}const key=q.source.type==='true_false'?(o.id==='true'?'Đ':'S'):String.fromCharCode(65+i);return`<button class="option ${cls}" data-option="${esc(o.id)}"><span class="option-key">${key}</span><span>${esc(o.text)}</span>${revealed&&o.correct?'<b style="margin-left:auto;color:#1e9e57">✓</b>':''}</button>`;}
function reviewQuestion(q,ids){const chosen=q.source.options.filter(o=>ids.includes(o.id)).map(o=>o.text).join('; ')||'Chưa trả lời',correct=q.source.options.filter(o=>o.correct).map(o=>o.text).join('; '),ok=Exam.ExamEngine.isAnswerCorrect(q.source,ids);return`<article class="review-card"><h4>${ok?'✅':'❌'} ${esc(q.source.text)}</h4><p>Bạn chọn: ${esc(chosen)}</p><p class="correct-text">Đáp án đúng: ${esc(correct)}</p>${q.source.explanation?`<p>${esc(q.source.explanation)}</p>`:''}</article>`;}
function formatTime(s){s=Math.max(0,s|0);return`${String(Math.floor(s/60)).padStart(2,'0')}:${String(s%60).padStart(2,'0')}`;}
function clearExamTimer(){if(examRuntime.timer){clearInterval(examRuntime.timer);examRuntime.timer=null;}}
function startExamTimer(){clearExamTimer();examRuntime.timer=setInterval(()=>{if(route.name!=='exam-run'||examRuntime.submitted){clearExamTimer();return;}const left=Math.max(0,Math.ceil((examRuntime.deadline-Date.now())/1000)),el=$('#examTimer');if(el)el.textContent=formatTime(left);if(left<=0){examRuntime.timedOut=true;examRuntime.submitted=true;clearExamTimer();render();}},500);}

function render(){
  clearExamTimer();clearInterval(homeNewsTimer);homeNewsTimer=null;
  currentItem=(route.params.id&&resources.find(x=>x.id===route.params.id))||currentItem;updateChrome();
  switch(route.name){
    case'home':renderHome();break;case'resources':renderResources();break;case'search':renderSearch();break;case'section':renderSection();break;case'news':renderNews();break;case'saved':renderSaved();break;case'downloads':renderDownloads();break;case'notifications':renderNotifications();break;case'detail':renderDetail();break;case'viewer':renderViewer();break;case'settings':renderSettings();break;case'feedback':renderFeedback();break;case'about':renderAbout();break;case'exam':renderExamHub();if(!examRuntime.bank)setTimeout(()=>ensureExam(true),0);break;case'exam-config':renderExamConfig();break;case'exam-run':renderExamRun();break;default:go('home',{},true);
  }
}
function toggleFav(id){const s=new Set(saved());s.has(id)?s.delete(id):s.add(id);write(KEYS.saved,[...s]);render();}
function markNewsRead(id){write(KEYS.unreadNews,unreadNews().filter(x=>x!==id));}
function markItemNotices(id){write(KEYS.notices,notices().map(n=>n.itemId===id?{...n,unread:false}:n));}
function openNewsItem(id){
  const news=resources.find(x=>x.id===id);if(!news)return;
  markNewsRead(news.id);markItemNotices(news.id);track('NEWS_READ',{section:'news',contentId:news.id,contentTitle:news.title});
  let target=news;if(['soft','docs','firmware'].includes(news.sourceSection)&&news.sourceId){const original=resources.find(x=>x.section===news.sourceSection&&x.id===news.sourceId);if(original)target=original;}
  currentItem=target;detailBack='news';track('CONTENT_VIEW',{section:target.section,contentId:target.id,contentTitle:target.title,origin:'news'});go('detail',{id:target.id,origin:'news'});
}
function openItem(id,from){const item=resources.find(x=>x.id===id);if(!item)return;if(item.section==='news'){openNewsItem(id);return;}currentItem=item;detailBack=from||route.name;markItemNotices(id);track('CONTENT_VIEW',{section:item.section,contentId:id,contentTitle:item.title});go('detail',{id});}
function recordDownload(item){const rows=downloads().filter(x=>x.title!==item.title);rows.unshift({title:item.title,at:new Date().toISOString(),id:item.id});write(KEYS.downloads,rows.slice(0,100));track('DOWNLOAD_CLICK',{section:item.section,contentId:item.id,contentTitle:item.title});}
function doDownload(){if(!currentItem)return;const u=safeUrl(downloadRequest(currentItem)||bestView(currentItem));if(!u)return toast('Nội dung chưa có liên kết tải');recordDownload(currentItem);window.open(u,'_blank','noopener');toast('Đã chuyển tải xuống cho trình duyệt và lưu lịch sử.');}
async function feedbackSubmit(e){e.preventDefault();const p={action:'feedback',type:$('#feedbackType').value,title:$('#feedbackTitle').value.trim(),content:$('#feedbackContent').value.trim(),contact:$('#feedbackContact').value.trim(),appVersion:C.APP_VERSION||'280926',device:navigator.userAgent,androidVersion:'Web/PWA'};if(!p.title||!p.content)return toast('Vui lòng nhập tiêu đề và nội dung');try{const r=await fetch(C.API_URL,{method:'POST',headers:{'Content-Type':'text/plain;charset=UTF-8'},body:JSON.stringify(p),redirect:'follow'});const j=await r.json();if(j.success!==true)throw new Error();toast('Đã gửi góp ý. Cảm ơn bạn!');track('FEEDBACK_SENT');go('settings',{},true);}catch(_){toast('Không thể gửi góp ý. Vui lòng thử lại.');track('FEEDBACK_ERROR');}}
async function enableNotifications(){if(!('Notification'in window))return toast('Trình duyệt không hỗ trợ Web Notification');try{const p=await Notification.requestPermission();toast(p==='granted'?'Đã bật thông báo Web':'Chưa cấp quyền thông báo');renderSettings();}catch(_){toast('Không thể yêu cầu quyền thông báo');}}
function applyTheme(value){write(KEYS.theme,value);document.documentElement.dataset.theme=value;if(value==='dark'||(value==='system'&&matchMedia('(prefers-color-scheme: dark)').matches))document.documentElement.classList.add('theme-dark');else document.documentElement.classList.remove('theme-dark');}

async function handleClick(e){
  const el=e.target.closest('button,a,[data-open-item],[data-open-news]');if(!el)return;
  if(el.dataset.route){e.preventDefault();go(el.dataset.route);return;}
  if(el.dataset.section){openSection(el.dataset.section);return;}
  if(el.dataset.openNews){openNewsItem(el.dataset.openNews);return;}
  if(el.dataset.openItem){openItem(el.dataset.openItem,route.name);return;}
  if(el.dataset.fav){e.stopPropagation();toggleFav(el.dataset.fav);return;}
  if(el.hasAttribute('data-network-refresh')){apiLatency=null;publicIpValue='--';loadData(true,true);loadPublicIp(true);return;}
  if(el.dataset.newsPage!=null){homeNewsIndex=Number(el.dataset.newsPage)||0;const wrap=ROOT.querySelector('.home-news-carousel');if(wrap)wrap.innerHTML=renderHomeNewsCarousel(sortedNews().slice(0,3));bindHomeCarousel(Math.min(3,sortedNews().length));return;}
  if(el.dataset.resourceTab!=null){go('resources',{tab:el.dataset.resourceTab},true);return;}
  if(el.hasAttribute('data-voice-search')){startVoiceSearch();return;}
  if(el.dataset.searchTerm!=null){recordSearch(el.dataset.searchTerm);go('search',{q:el.dataset.searchTerm,section:route.params.section||''},true);return;}
  if(el.hasAttribute('data-clear-search-history')){write(KEYS.searchHistory,[]);renderSearch();return;}
  if(el.dataset.searchSection!=null){go('search',{q:route.params.q||'',section:el.dataset.searchSection},true);return;}
  if(el.dataset.savedKind!=null){go('saved',{q:route.params.q||'',kind:el.dataset.savedKind,sort:route.params.sort||'new',grid:route.params.grid||''},true);return;}
  if(el.dataset.savedGrid!=null){go('saved',{q:route.params.q||'',kind:route.params.kind||'',sort:route.params.sort||'new',grid:el.dataset.savedGrid},true);return;}
  if(el.hasAttribute('data-mark-all')){write(KEYS.notices,notices().map(n=>({...n,unread:false})));render();return;}
  if(el.dataset.notice){write(KEYS.notices,notices().map(n=>n.notificationId===el.dataset.notice?{...n,unread:false}:n));track('NOTIFICATION_OPEN');openItem(el.dataset.noticeItem,'notifications');return;}
  if(el.dataset.downloadTitle){const item=resources.find(x=>x.title===el.dataset.downloadTitle);if(item)openItem(item.id,'downloads');return;}
  if(el.hasAttribute('data-clear-downloads')){if(confirm('Xóa toàn bộ lịch sử Download?')){write(KEYS.downloads,[]);render();}return;}
  if(el.hasAttribute('data-download-current')){doDownload();return;}
  if(el.hasAttribute('data-view-current')){if(currentItem){track('VIEW_CLICK',{section:currentItem.section,contentId:currentItem.id,contentTitle:currentItem.title});go('viewer',{id:currentItem.id,origin:route.params.origin||''});}return;}
  if(el.hasAttribute('data-sync')){track('SYNC_START');clearSync().then(()=>track('SYNC_SUCCESS',{resultCount:resources.length}));return;}
  if(el.hasAttribute('data-notify-enable')){enableNotifications();return;}
  if(el.dataset.brand!=null){go('section',{section:route.params.section,brand:el.dataset.brand,q:route.params.q||''},true);return;}
  if(el.dataset.practice){await startAttempt(el.dataset.practice,'practice',10);return;}
  if(el.dataset.examConfig){examRuntime.configCustom=false;examRuntime.configCount=20;go('exam-config',{topic:el.dataset.examConfig});return;}
  if(el.dataset.examCount){examRuntime.configCount=Number(el.dataset.examCount);renderExamConfig();return;}
  if(el.dataset.startMock){const bank=examRuntime.bank,tp=bank.topics.find(x=>x.id===el.dataset.startMock),count=examRuntime.configCustom?examRuntime.configCount:tp.examQuestionCount;await startAttempt(tp.id,'test',count);return;}
  if(el.dataset.option){const at=examRuntime.attempt,q=at.questions[examRuntime.index],id=q.source.id;let s=new Set(examRuntime.selected[id]||[]);if(q.source.type==='true_false'){s=new Set([el.dataset.option]);if(at.mode==='practice')examRuntime.revealed[id]=true;}else{s.has(el.dataset.option)?s.delete(el.dataset.option):s.add(el.dataset.option);}examRuntime.selected[id]=[...s];renderExamRun();return;}
  if(el.hasAttribute('data-reveal')){const q=examRuntime.attempt.questions[examRuntime.index];examRuntime.revealed[q.source.id]=true;renderExamRun();return;}
  if(el.dataset.qIndex!=null){examRuntime.index=Number(el.dataset.qIndex);renderExamRun();return;}
  if(el.hasAttribute('data-mark')){const q=examRuntime.attempt.questions[examRuntime.index];examRuntime.marked[q.source.id]=!examRuntime.marked[q.source.id];renderExamRun();return;}
  if(el.hasAttribute('data-prev')){examRuntime.index=Math.max(0,examRuntime.index-1);renderExamRun();return;}
  if(el.hasAttribute('data-next')){if(examRuntime.index<examRuntime.attempt.questions.length-1)examRuntime.index++;else examRuntime.submitted=true;renderExamRun();return;}
  if(el.hasAttribute('data-submit-exam')){if(confirm('Nộp bài thi?')){examRuntime.submitted=true;renderExamRun();}return;}
}
function openSection(sec){go('section',{section:sec});}
function handleInput(e){
  if(e.target.id==='searchInput'){const q=e.target.value;route.params.q=q;history.replaceState({route},'',routeUrl('search',route.params));clearTimeout(handleInput.timer);handleInput.timer=setTimeout(()=>{recordSearch(q);track(filterItems(q,route.params.section||'').length?'SEARCH':'SEARCH_NO_RESULT',{searchQuery:q,resultCount:filterItems(q,route.params.section||'').length});renderSearch();const input=$('#searchInput');if(input){input.focus();input.setSelectionRange(q.length,q.length);}},250);}
  if(e.target.id==='sectionSearch'){const q=e.target.value;route.params.q=q;history.replaceState({route},'',routeUrl('section',route.params));renderSection();const input=$('#sectionSearch');if(input){input.focus();input.setSelectionRange(q.length,q.length);}}
  if(e.target.id==='savedSearch'){const q=e.target.value;route.params.q=q;history.replaceState({route},'',routeUrl('saved',route.params));renderSaved();const input=$('#savedSearch');if(input){input.focus();input.setSelectionRange(q.length,q.length);}}
  if(e.target.id==='downloadSearch'){const q=e.target.value;route.params.q=q;history.replaceState({route},'',routeUrl('downloads',route.params));renderDownloads();const input=$('#downloadSearch');if(input){input.focus();input.setSelectionRange(q.length,q.length);}}
  if(e.target.id==='savedSort'){route.params.sort=e.target.value;history.replaceState({route},'',routeUrl('saved',route.params));renderSaved();}
  if(e.target.id==='downloadSort'){route.params.sort=e.target.value;history.replaceState({route},'',routeUrl('downloads',route.params));renderDownloads();}
  if(e.target.id==='themeSelect'){applyTheme(e.target.value);}
  if(e.target.id==='customExam'){examRuntime.configCustom=e.target.checked;renderExamConfig();}
}
function headerLeft(){const h=headerConfig();if(h.left==='menu')openDrawer();else back();}
function headerRight(){const h=headerConfig();if(h.right==='bell')go('notifications');else if(h.right==='fav'&&currentItem)toggleFav(currentItem.id);else if(h.right==='external'&&currentItem){const u=previewUrl(currentItem);if(u)window.open(u,'_blank','noopener');}}
function bind(){document.addEventListener('click',handleClick);document.addEventListener('input',handleInput);document.addEventListener('change',handleInput);$('#headerLeft').addEventListener('click',headerLeft);$('#headerRight').addEventListener('click',headerRight);$('#scrim').addEventListener('click',closeDrawer);document.addEventListener('submit',e=>{if(e.target.id==='feedbackForm')feedbackSubmit(e);});window.addEventListener('popstate',()=>{route=parseRoute();render();});window.addEventListener('online',()=>{updateChrome();loadData(true,true);});window.addEventListener('offline',updateChrome);document.addEventListener('visibilitychange',()=>{if(document.visibilityState==='visible'&&navigator.onLine)loadData(false,true);});}
async function serviceWorker(){if('serviceWorker'in navigator)try{const r=await navigator.serviceWorker.register(BASE+'sw.js',{scope:BASE});r.update();}catch(_){}}
function start(){migrate();applyTheme(read(KEYS.theme,'system'));const cache=read(KEYS.data,[]);if(Array.isArray(cache)&&cache.length)resources=sortRows(cache.map(normalize));route=parseRoute();const ct=C.CONTACT||{};$('#developerLink').href=ct.zalo||'#';bind();render();track('SESSION_START');track('APP_OPEN');loadData(false,true);setInterval(()=>{if(navigator.onLine)loadData(false,true);},60000);window.addEventListener('load',serviceWorker,{once:true});}
start();
})();
