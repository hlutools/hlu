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

const ICON_PATHS=window.HLU_ICONS;
function iconSvg(name,cls='ui-icon'){
  if(!ICON_PATHS[name])throw new Error('Unknown Android icon: '+name);
  return `<svg class="${cls}" data-icon="${name}" viewBox="0 0 24 24" aria-hidden="true" focusable="false">${ICON_PATHS[name]}</svg>`;
}
const uiText=text=>window.HLUPresentation.translate(text);
function profile(){const state=window.HLU_PROFILE||{};return{fullName:t(state.fullName),username:t(state.username),workplace:t(state.workplace),phoneNumber:t(state.phoneNumber),email:t(state.email),avatarUrl:safeUrl(state.avatarUrl),isLoggedIn:state.isLoggedIn===true};}
function profileAvatar(state,size){return `<img class="profile-avatar" width="${size}" height="${size}" src="${esc(state.avatarUrl||BASE+'assets/icons/icon-192.png')}" alt="Ảnh đại diện" onerror="this.onerror=null;this.src='${BASE}assets/icons/icon-192.png'">`;}
function renderDrawerProfile(){const state=profile();$('#drawerProfile').innerHTML=`${profileAvatar(state,48)}<div><b>${esc(state.fullName||uiText('Người dùng'))}</b><small>${esc(state.username||uiText(state.isLoggedIn?'Tài khoản':'Chưa đăng nhập'))}</small></div>`;}
function hydrateStaticIcons(){document.querySelectorAll('[data-ui-icon]').forEach(el=>{const name=el.dataset.uiIcon;if(name)el.innerHTML=iconSvg(name);});}

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
let latestArticleTimer=null;
let latestArticleIndex=0;
let latestArticleIds='';
let voiceRecognizer=null;
let newsFallbackCache=null;
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
function section(v){const s=fold(v).replace(/[_-]+/g,' ').trim();if(s.includes('news')||s.includes('tin'))return'news';if(s.includes('soft')||s.includes('phan mem'))return'soft';if(s.includes('firm')||s.includes('rom'))return'firmware';if(s==='docs'||s==='doc'||s==='document'||s==='documents'||s==='tai lieu')return'docs';return'';}
function normalize(row,i,forced){
  const title=first(row,['title','Title','name','Name','ten','Tên'],'Không có tiêu đề');
  // Array.prototype.map passes the source array as argument #3. Only accept an explicit string here,
  // otherwise every API row can accidentally fall through to the default docs category.
  const forcedSection=typeof forced==='string'?forced:'';
  return{
    id:t(first(row,['id','ID','Id'],`item-${i}`)),
    section:section(forcedSection||first(row,['section','Section','category','Category'],'docs')),
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
  if(Array.isArray(payload))return payload.map((row,i)=>normalize(row,i));
  if(!payload||typeof payload!=='object')return[];
  if(payload.success===false)throw new Error(payload.message||payload.error||'API_ERROR');
  const direct=first(payload,['data','items','result','rows','resources'],null);
  if(Array.isArray(direct))return direct.map((row,i)=>normalize(row,i));
  if(direct&&typeof direct==='object')return extract(direct);
  let out=[];['news','soft','docs','firmware'].forEach(k=>{if(Array.isArray(payload[k]))out=out.concat(payload[k].map((r,i)=>normalize(r,i,k)));});
  return out;
}
function sortRows(rows){return rows.filter(x=>['news','soft','docs','firmware'].includes(x.section)&&x.visible&&x.id&&x.title).sort((a,b)=>a.section.localeCompare(b.section)||a.sortOrder-b.sortOrder||a.title.localeCompare(b.title,'vi'));}
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
function empty(icon,title,desc){return`<div class="empty"><span>${icon}</span><b>${esc(uiText(title))}</b><p>${esc(uiText(desc||''))}</p></div>`;}
function toast(msg){const el=$('#toast');if(!el)return;el.textContent=msg;el.classList.add('show');clearTimeout(toastTimer);toastTimer=setTimeout(()=>el.classList.remove('show'),2400);}
function snapshot(x){return{id:x.id,section:x.section,version:x.version||'',updatedAt:x.updatedAt||''};}
function unreadNoticeCount(){return notices().filter(n=>n.unread!==false).length;}
function notifyMessage(item,type){if(type==='VERSION_UPDATE')return item.section==='news'?'Tin tức được cập nhật':`${LABELS[item.section]||'Nội dung'} được cập nhật`;return item.section==='news'?'Tin tức mới':item.section==='soft'?'Phần mềm mới':item.section==='docs'?'Tài liệu mới':'Firmware mới';}

async function loadNewsFallback(){
  if(Array.isArray(newsFallbackCache))return newsFallbackCache;
  try{const r=await fetch(BASE+'assets/data/news_fallback.json',{cache:'no-store'});if(!r.ok)throw new Error('HTTP '+r.status);const payload=await r.json();newsFallbackCache=sortRows(extract(payload)).filter(x=>x.section==='news');}
  catch(_){newsFallbackCache=[];}
  return newsFallbackCache;
}
function mergeFallbackNews(rows,fallback){const base=Array.isArray(rows)?rows:[],fb=Array.isArray(fallback)?fallback:[];if(!fb.length)return sortRows(base);const byId=new Map();fb.forEach(x=>byId.set(x.id,x));base.forEach(x=>byId.set(x.id,x));return sortRows([...byId.values()]);}

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
  if(loading)return;loading=true;dataLoading=true;dataError='';const url=C.API_URL;const started=performance.now();
  try{
    const ctrl=new AbortController(),tm=setTimeout(()=>ctrl.abort(),C.API_TIMEOUT||20000);
    const r=await fetch(url+(url.includes('?')?'&':'?')+'_='+Date.now(),{cache:'no-store',redirect:'follow',signal:ctrl.signal});clearTimeout(tm);
    if(!r.ok)throw new Error('HTTP '+r.status);
    const payload=await r.json();let fresh=sortRows(extract(payload));if(!fresh.length)throw new Error('EMPTY_DATA');
    fresh=mergeFallbackNews(fresh,await loadNewsFallback());apiLatency=Math.round(performance.now()-started);processUpdates(fresh);resources=fresh;write(KEYS.data,fresh);write(KEYS.lastSync,new Date().toISOString());
    if(force&&!silent)toast(`Đã đồng bộ ${fresh.length} nội dung`);
  }catch(e){
    const cache=read(KEYS.data,[]);let cached=Array.isArray(cache)?sortRows(cache.map((row,i)=>normalize(row,i))):[];cached=mergeFallbackNews(cached,await loadNewsFallback());resources=cached;
    dataError=cached.length?'API trực tuyến tạm thời không khả dụng. Đang dùng dữ liệu đã lưu dự phòng.':'Không kết nối được API và chưa có dữ liệu dự phòng.';
    if(force&&!silent)toast(cached.length?'Đang dùng dữ liệu đã lưu dự phòng.':'Không đồng bộ được dữ liệu.');
  }finally{loading=false;dataLoading=false;updateChrome();if(['home','news','resources','search','section'].includes(route.name))render();}
}
async function clearSync(){remove(KEYS.data);resources=[];await loadData(true,false);}
function deviceId(){let id=localStorage.getItem(KEYS.analyticsDevice);if(!id){id=(crypto.randomUUID?crypto.randomUUID():Date.now()+'-'+Math.random());localStorage.setItem(KEYS.analyticsDevice,id);}return id;}
function track(eventName,extra={}){if(!C.API_URL)return;const payload={action:'analytics',eventName,deviceId:deviceId(),appVersion:C.APP_VERSION||'02102026',platform:'web',...extra};fetch(C.API_URL,{method:'POST',headers:{'Content-Type':'text/plain;charset=UTF-8'},body:JSON.stringify(payload),keepalive:true,redirect:'follow'}).catch(()=>{});}

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
  const h=headerConfig(),art=$('#headerArtwork');art.classList.remove('hidden');$('#headerImage').src=BASE+'assets/android-v280926/'+h.art;
  const left=$('#headerLeft'),right=$('#headerRight'),leftIcon=$('#headerLeftIcon'),rightIcon=$('#headerRightIcon');left.classList.toggle('hidden',!h.left);left.setAttribute('aria-label',uiText(h.left==='menu'?'Mở menu':'Quay lại'));leftIcon.innerHTML=h.left==='menu'?iconSvg('menu','header-svg'):iconSvg('arrowBack','header-svg');right.classList.toggle('hidden',!h.right);
  const rightName=h.right==='bell'?'notifications':h.right==='fav'?(currentItem&&saved().includes(currentItem.id)?'favorite':'favoriteBorder'):h.right==='external'?'external':'';right.setAttribute('aria-label',uiText(h.right==='fav'?(saved().includes(currentItem.id)?'Bỏ lưu nội dung':'Lưu nội dung'):h.right==='external'?'Mở nội dung':'Thông báo'));rightIcon.innerHTML=rightName?iconSvg(rightName,'header-svg'):'';
  const nb=$('#headerBadge'),cnt=unreadNoticeCount();nb.textContent=cnt>99?'99+':cnt;nb.classList.toggle('hidden',h.right!=='bell'||cnt===0);
  renderDrawerProfile();
  $$('.bottom-nav button').forEach(b=>{const selected=b.dataset.route===route.name;b.classList.toggle('active',selected);if(selected)b.setAttribute('aria-current','page');else b.removeAttribute('aria-current');});$$('#drawerNav button').forEach(b=>b.classList.toggle('active',b.dataset.route===route.name||(route.name==='section'&&b.dataset.section===route.params.section)));
  const dn=$('#drawerNewsBadge'),uc=unreadNews().length;dn.textContent=uc>99?'99+':uc;dn.classList.toggle('hidden',!uc);
}

function card(item,options={}){
  const isNew=item.section==='news'&&unreadNews().includes(item.id),fav=saved().includes(item.id),img=bestImage(item),showDownload=options.download===true,canDownload=!!safeUrl(downloadRequest(item));
  const tag=isNew?'Mới':item.section==='soft'?(item.version||'SOFT'):item.section==='firmware'?(item.version||'Firmware'):(item.section==='docs'?(item.fileType||'Tài liệu'):(item.brand||'Tin tức'));
  const actions=showDownload?`<div class="card-actions"><button class="fav-btn ${fav?'saved':''}" data-fav="${esc(item.id)}" type="button" aria-label="${fav?'Bỏ lưu nội dung':'Lưu nội dung'}">${iconSvg(options.saved?(fav?'star':'starBorder'):(fav?'favorite':'favoriteBorder'))}</button>${canDownload?`<button class="download-btn" data-download-item="${esc(item.id)}" type="button" aria-label="Tải nhanh" data-i18n-aria-label="Tải nhanh">${iconSvg('download','card-action-icon')}</button>`:''}</div>`:`<button class="fav-btn ${fav?'saved':''}" data-fav="${esc(item.id)}" type="button">${iconSvg(options.saved?(fav?'star':'starBorder'):(fav?'favorite':'favoriteBorder'))}</button>`;
  return`<article class="content-card ${showDownload?'resource-list-card':''} ${isNew?'new':''}" data-open-item="${esc(item.id)}"><div class="content-thumb">${img?`<img src="${esc(img)}" alt="" loading="lazy" referrerpolicy="no-referrer">`:iconSvg(item.section==='news'?'article':'insertDriveFile')}</div><div class="content-copy"><span class="tag ${isNew?'new':''}">${esc(tag)}</span><h3>${esc(item.title)}</h3><p>${esc(item.description||item.note||item.brand||SECTION_SUB[item.section])}</p>${displayDate(item)?`<time>${iconSvg('calendarMonth')}${esc(fmtDate(displayDate(item)))}</time>`:''}</div>${actions}</article>`;
}
function filterItems(query,sec='',brand=''){const q=fold(query).trim();return resources.filter(x=>(!sec||x.section===sec)&&(!brand||fold(x.brand)===fold(brand))&&(!q||fold([x.title,x.brand,x.model,x.version,x.description,x.note,x.fileType].join(' ')).includes(q)));}
function sortedNews(){const un=new Set(unreadNews());return resources.filter(x=>x.section==='news').sort((a,b)=>(un.has(b.id)-un.has(a.id))||dateMs(displayDate(b))-dateMs(displayDate(a))||a.sortOrder-b.sortOrder);}
function resourceCard(sec,title,sub,count,img){const attrs=sec==='exam'?'data-route="exam"':`data-section="${sec}"`;return`<button class="resource-card" ${attrs} aria-label="${esc(uiText(title)+', '+uiText(sub)+', '+count)}"><img src="${BASE}assets/android-v02102026/${img}" alt=""><span class="resource-copy"><b>${esc(uiText(title))}</b></span></button>`;}

function connectionType(){const c=navigator.connection||navigator.mozConnection||navigator.webkitConnection;if(!c)return'Web';return c.effectiveType?String(c.effectiveType).toUpperCase():(c.type||'Web');}
async function loadPublicIp(force=false){if(!navigator.onLine){publicIpValue='Offline';if(route.name==='home')renderHome();return;}if(publicIpValue!=='--'&&!force)return;try{const ctrl=new AbortController(),tm=setTimeout(()=>ctrl.abort(),6000);const r=await fetch(C.PUBLIC_IP_URL||'https://api64.ipify.org?format=json',{cache:'no-store',signal:ctrl.signal});clearTimeout(tm);const j=await r.json();publicIpValue=j.ip||'Không xác định';}catch(_){publicIpValue='Không xác định';}if(route.name==='home')renderHome();}
function latestResourceArticles(){
  return resources.filter(x=>['soft','docs','firmware'].includes(x.section)).sort((a,b)=>(dateMs(b.createdAt)||dateMs(b.updatedAt)||-Infinity)-(dateMs(a.createdAt)||dateMs(a.updatedAt)||-Infinity)||a.sortOrder-b.sortOrder||a.id.localeCompare(b.id)).slice(0,5);
}
function renderLatestArticle(){
  const rows=latestResourceArticles(),ids=rows.map(x=>x.id).join('|');
  if(ids!==latestArticleIds){latestArticleIds=ids;latestArticleIndex=0;}
  latestArticleIndex=Math.min(latestArticleIndex,Math.max(0,rows.length-1));
  if(!rows.length)return `<span data-i18n="${dataLoading?'Đang tải nội dung...':dataError?'Chưa tải được nội dung.':'Chưa có bài viết mới.'}">${uiText(dataLoading?'Đang tải nội dung...':dataError?'Chưa tải được nội dung.':'Chưa có bài viết mới.')}</span>`;
  const item=rows[latestArticleIndex];return `<button data-open-item="${esc(item.id)}">${esc(uiText({soft:'Soft',docs:'Tài liệu',firmware:'Firmware'}[item.section]))} · ${esc(item.title)}</button>`;
}
function bindLatestArticles(){
  clearInterval(latestArticleTimer);latestArticleTimer=null;
  if(latestResourceArticles().length<2||document.hidden)return;
  latestArticleTimer=setInterval(()=>{
    if(route.name!=='home'||document.hidden){clearInterval(latestArticleTimer);latestArticleTimer=null;return;}
    const strip=ROOT.querySelector('.latest-articles');if(!strip||strip.matches(':hover')||strip.contains(document.activeElement))return;
    const rows=latestResourceArticles();latestArticleIndex=(latestArticleIndex+1)%rows.length;strip.innerHTML=renderLatestArticle();
  },4000);
}
function renderHome(){
  const news=sortedNews().slice(0,3),un=unreadNews().length,last=read(KEYS.lastSync,'');
  const updated=last?new Intl.DateTimeFormat('vi-VN',{hour:'2-digit',minute:'2-digit'}).format(new Date(last)):'--';
  ROOT.innerHTML=`<div class="latest-articles" aria-label="Bài viết mới" data-i18n-aria-label="Bài viết mới">${renderLatestArticle()}</div><div class="page no-pad">
    <section class="status-card"><div class="status-head"><strong data-i18n="Tình trạng kết nối">Tình trạng kết nối</strong><small>Cập nhật: ${esc(updated)}</small><button data-network-refresh aria-label="Làm mới" data-i18n-aria-label="Làm mới">${iconSvg('refresh')}</button></div><div class="status-grid">
      <div class="status-cell ${navigator.onLine?'online':''}"><span>${iconSvg('public')}</span><b>${navigator.onLine?'Online':'Offline'}</b><small>Internet</small></div>
      <div class="status-cell"><span>${iconSvg('wifi')}</span><b>${esc(connectionType())}</b><small data-i18n="Kết nối">Kết nối</small></div>
      <div class="status-cell"><span>${iconSvg('devices')}</span><b id="homeIp">${esc(publicIpValue)}</b><small data-i18n="IP Public">IP Public</small></div>
      <div class="status-cell"><span>${iconSvg('speed')}</span><b>${apiLatency==null?'--':apiLatency+' ms'}</b><small data-i18n="API RTT">API RTT</small></div>
    </div></section>
    <div class="section-title"><span data-i18n="Tài nguyên">Tài nguyên</span><button data-route="resources">Xem tất cả ›</button></div>
    <div class="resource-grid">${resourceCard('soft','SOFT','Ứng dụng & công cụ',resources.filter(x=>x.section==='soft').length+' ứng dụng','home_card_soft_300926.png')}${resourceCard('docs','TÀI LIỆU','Hướng dẫn kỹ thuật',resources.filter(x=>x.section==='docs').length+' tài liệu','home_card_docs_300926.png')}${resourceCard('firmware','FIRMWARE','Firmware thiết bị',resources.filter(x=>x.section==='firmware').length+' phiên bản','home_card_firmware_300926.png')}${resourceCard('exam','E-LEARNING','Ôn tập & kỳ thi','Học tập nội bộ','home_card_learning_300926.png')}</div>
    <section class="home-news-wrap"><div class="section-title"><span>Tin tức ${un?`<em class="menu-badge">${un} mới</em>`:''}</span><button data-route="news">Xem tất cả ›</button></div><div class="home-news-carousel">${renderHomeNewsCarousel(news)}</div></section>
  </div>`;
  bindHomeCarousel(news.length);bindLatestArticles();track('HOME_VIEW');if(publicIpValue==='--')loadPublicIp(false);
}
function renderHomeNewsCarousel(news){
  if(dataLoading&&!news.length)return empty('◌','Đang tải tin tức','');
  if(!news.length&&dataError)return`<div class="home-news-empty"><b data-i18n="Không tải được tin tức">Không tải được tin tức</b><p>${esc(dataError)}</p><button class="btn secondary" data-network-refresh data-i18n="Thử lại">Thử lại</button></div>`;
  if(!news.length)return empty(iconSvg('article'),'Chưa có tin tức','Dữ liệu đang được cập nhật.');
  const idx=Math.min(homeNewsIndex,news.length-1);homeNewsIndex=idx;const item=news[idx],img=bestImage(item),isNew=unreadNews().includes(item.id);
  return`<div class="home-news-slide" data-open-news="${esc(item.id)}"><div class="home-news-thumb">${img?`<img src="${esc(img)}" alt="" referrerpolicy="no-referrer">`:'NEWS'}</div><div class="home-news-copy"><div><h3>${esc(item.title)}</h3>${isNew?'<span class="tag new" data-i18n="MỚI">MỚI</span>':''}</div><p>${esc(item.description||item.note||'')}</p>${displayDate(item)?`<time>${iconSvg('calendarMonth')}${esc(fmtDate(displayDate(item)))}</time>`:''}</div></div><div class="home-news-dots">${news.map((_,i)=>`<button class="${i===idx?'active':''}" data-news-page="${i}" aria-label="Tin ${i+1}"></button>`).join('')}</div>`;
}
function bindHomeCarousel(count){clearInterval(homeNewsTimer);homeNewsTimer=null;if(count<2)return;homeNewsTimer=setInterval(()=>{if(route.name!=='home'){clearInterval(homeNewsTimer);homeNewsTimer=null;return;}homeNewsIndex=(homeNewsIndex+1)%count;const wrap=ROOT.querySelector('.home-news-carousel');if(wrap)wrap.innerHTML=renderHomeNewsCarousel(sortedNews().slice(0,3));},5000);}

function resourceTabFor(item){if(item.section!=='docs')return 'other';const title=fold(item.title).replace(/đ/g,'d');if(['mau bieu','bieu mau','bien ban','template'].some(x=>title.includes(x)))return 'templates';if(['huong dan','guide','manual'].some(x=>title.includes(x)))return 'guides';return 'documents';}
function renderResources(){
  const tab=route.params.tab||'all';const allowed=['all','documents','guides','templates','other'];const active=allowed.includes(tab)?tab:'all';
  const rows=resources.filter(x=>['soft','docs','firmware'].includes(x.section)&&(active==='all'||resourceTabFor(x)===active)).sort((a,b)=>dateMs(b.updatedAt)-dateMs(a.updatedAt)||a.sortOrder-b.sortOrder);
  ROOT.innerHTML=`<div class="page resources-page"><div class="chip-row resource-tabs">${[['all','Tất cả'],['documents','Tài liệu'],['guides','Hướng dẫn'],['templates','Mẫu biểu'],['other','Khác']].map(([k,l])=>`<button class="chip ${active===k?'active':''}" data-resource-tab="${k}">${esc(uiText(l))}</button>`).join('')}</div>${dataLoading?'<div class="linear-loading"></div>':''}${dataError?`<div class="banner error">${esc(dataError)}</div>`:''}<div class="content-list" style="padding:0">${rows.length?rows.map(x=>card(x,{download:true})).join(''):empty(iconSvg('insertDriveFile'),'Chưa có dữ liệu phù hợp','')}</div></div>`;
}
function popularTerms(){
  const counts=new Map();for(const x of resources){const src=[x.brand,x.model].filter(Boolean);src.forEach(v=>{const s=t(v).trim();if(s.length>=2&&s.length<=28)counts.set(s,(counts.get(s)||0)+1);});}
  const ranked=[...counts.entries()].sort((a,b)=>b[1]-a[1]).map(x=>x[0]);const fallback=resources.flatMap(x=>x.title.split(/\s+/)).map(x=>x.replace(/^[.,:;()]+|[.,:;()]+$/g,'')).filter(x=>x.length>=4&&x.length<=20&&/\p{L}/u.test(x));const seen=new Set();return [...ranked,...fallback].filter(x=>{const key=x.toLowerCase();if(seen.has(key))return false;seen.add(key);return true;}).slice(0,6);
}
function searchSuggestions(q){const f=fold(q).trim();if(!f)return[];const pool=[...new Set([...searchHistory(),...resources.flatMap(x=>[x.title,x.brand,x.model]).filter(Boolean)])];return pool.filter(x=>fold(x).includes(f)).slice(0,5);}
function recordSearch(q){q=t(q).trim();if(!q)return;write(KEYS.searchHistory,[q,...searchHistory().filter(x=>fold(x)!==fold(q))].slice(0,20));}
function startVoiceSearch(){
  const R=window.SpeechRecognition||window.webkitSpeechRecognition;if(!R){toast('Trình duyệt này chưa hỗ trợ nhận dạng giọng nói. Bạn vẫn có thể nhập từ khóa bằng bàn phím.');return;}
  try{if(voiceRecognizer)voiceRecognizer.abort();voiceRecognizer=new R();voiceRecognizer.lang=window.HLUPresentation.preferences().language==='en'?'en-US':'vi-VN';voiceRecognizer.interimResults=false;voiceRecognizer.maxAlternatives=1;voiceRecognizer.onresult=e=>{const text=e.results?.[0]?.[0]?.transcript||'';if(text){route.params.q=text;recordSearch(text);history.replaceState({route},'',routeUrl('search',route.params));renderSearch();track('SEARCH',{searchQuery:text,resultCount:filterItems(text).length,source:'voice'});}};voiceRecognizer.onerror=e=>toast(e.error==='not-allowed'?'Chưa cấp quyền Micro cho trình duyệt.':'Không nhận dạng được giọng nói. Vui lòng thử lại.');voiceRecognizer.start();toast('Đang nghe...');}catch(_){toast('Không thể khởi động nhận dạng giọng nói.');}
}
function renderSearch(){
  const q=route.params.q||'',sec=route.params.section||'',rows=filterItems(q,sec),hist=searchHistory(),terms=popularTerms(),sugs=searchSuggestions(q);
  ROOT.innerHTML=`<div class="page search-page"><div class="search-box"><span>${iconSvg('search')}</span><input id="searchInput" value="${esc(q)}" placeholder="Tìm kiếm tài liệu, công cụ, hướng dẫn..." data-i18n-placeholder="Tìm kiếm tài liệu, công cụ, hướng dẫn..."><button class="voice-btn" data-voice-search aria-label="Tìm kiếm bằng giọng nói" data-i18n-aria-label="Tìm kiếm bằng giọng nói">${iconSvg('mic')}</button></div>
  ${q&&sugs.length?`<div class="search-discovery"><b>Gợi ý</b><div class="chip-row">${sugs.map(x=>`<button class="chip" data-search-term="${esc(x)}">${iconSvg('search')}${esc(x)}</button>`).join('')}</div></div>`:''}
  ${!q&&hist.length?`<div class="search-discovery"><div class="search-head"><b>Lịch sử tìm kiếm</b><button data-clear-search-history>${iconSvg('deleteOutline')}<span data-i18n="Xóa">Xóa</span></button></div><div class="chip-row">${hist.slice(0,5).map(x=>`<button class="chip" data-search-term="${esc(x)}">${iconSvg('history')}${esc(x)}</button>`).join('')}</div></div>`:''}
  ${!q&&terms.length?`<div class="search-discovery"><b>${iconSvg('localFireDepartment')} <span data-i18n="Từ khóa phổ biến">Từ khóa phổ biến</span></b><div class="popular-grid">${terms.map(x=>`<button class="chip" data-search-term="${esc(x)}">${esc(x)}</button>`).join('')}</div></div>`:''}
  <div class="chip-row"><button class="chip ${!sec?'active':''}" data-search-section="">Tất cả</button>${[['soft','Soft'],['docs','Tài liệu'],['firmware','Firmware'],['news','Tin tức']].map(([k,l])=>`<button class="chip ${sec===k?'active':''}" data-search-section="${k}">${esc(uiText(l))}</button>`).join('')}</div>
  <div class="summary">${q?`${rows.length} kết quả cho “${esc(q)}”`:`Tất cả nội dung · ${rows.length} mục`}</div><div class="content-list" style="padding:0">${rows.length?rows.map(card).join(''):empty(iconSvg('search'),'Không tìm thấy kết quả','Thử một từ khóa khác.')}</div></div>`;
}
function renderSection(){
  const sec=route.params.section||'soft',q=route.params.q||'',brand=route.params.brand||'';const brands=['docs','firmware'].includes(sec)?[...new Set(resources.filter(x=>x.section===sec&&x.brand).map(x=>x.brand))].sort((a,b)=>a.localeCompare(b,'vi')):[];const rows=filterItems(q,sec,brand);
  ROOT.innerHTML=`<div class="page"><label class="search-box"><span>${iconSvg('search')}</span><input id="sectionSearch" value="${esc(q)}" placeholder="Tìm ${LABELS[sec]||'nội dung'}..."></label>${brands.length?`<div class="chip-row"><button class="chip ${!brand?'active':''}" data-brand="">Tất cả</button>${brands.map(x=>`<button class="chip ${brand===x?'active':''}" data-brand="${esc(x)}">${esc(x)}</button>`).join('')}</div>`:''}<div class="summary">${rows.length} mục • ${esc(SECTION_SUB[sec])}</div><div class="content-list" style="padding:0">${rows.length?rows.map(x=>card(x,{download:true})).join(''):empty(iconSvg('insertDriveFile'),'Chưa có nội dung','Dữ liệu đang được cập nhật.')}</div></div>`;track('SECTION_VIEW',{section:sec});
}
function renderNews(){const rows=sortedNews(),n=unreadNews().length;ROOT.innerHTML=`<div class="page no-pad">${dataLoading?'<div class="linear-loading"></div>':''}${dataError?`<div class="banner error">${esc(dataError)} <button data-network-refresh data-i18n="Thử lại">Thử lại</button></div>`:''}${n?`<div class="banner">${n} bài viết mới chưa đọc</div>`:''}<div class="news-list">${rows.length?rows.map(card).join(''):empty(iconSvg('article'),'Chưa có tin tức','')}</div></div>`;}
function fileKind(x){const f=fold(x.fileType||'');const u=fold(bestView(x)||downloadRequest(x));if(f.includes('video')||/\.(mp4|webm|mov)(\?|$)/.test(u))return'video';if(f.includes('image')||/\.(png|jpg|jpeg|webp|gif)(\?|$)/.test(u))return'image';if(f||/\.(pdf|docx?|xlsx?|pptx?|txt|zip|rar)(\?|$)/.test(u))return'document';return'other';}
function renderSaved(){
  const ids=saved(),all=ids.map(id=>resources.find(x=>x.id===id)).filter(Boolean),q=route.params.q||'',kind=route.params.kind||'',sort=route.params.sort||'new',grid=route.params.grid==='1';let rows=all.filter(x=>(!q||fold(x.title).includes(fold(q)))&&(!kind||fileKind(x)===kind));
  rows=sort==='az'?rows.sort((a,b)=>a.title.localeCompare(b.title,'vi')):sort==='old'?rows.sort((a,b)=>dateMs(displayDate(a))-dateMs(displayDate(b))):rows.sort((a,b)=>dateMs(displayDate(b))-dateMs(displayDate(a)));
  ROOT.innerHTML=`<div class="page saved-page"><div class="search-box"><span>${iconSvg('search')}</span><input id="savedSearch" value="${esc(q)}" placeholder="Tìm kiếm file đã lưu..." data-i18n-placeholder="Tìm kiếm file đã lưu..."></div><div class="chip-row"><button class="chip ${!kind?'active':''}" data-saved-kind="">${iconSvg('folderOpen')}Tất cả (${all.length})</button>${[['video','Video'],['image','Hình ảnh'],['document','Tài liệu']].map(([k,l])=>`<button class="chip ${kind===k?'active':''}" data-saved-kind="${k}">${iconSvg({video:'playCircleOutline',image:'image',document:'description'}[k])}${esc(uiText(l))} (${all.filter(x=>fileKind(x)===k).length})</button>`).join('')}</div><div class="catalog-toolbar"><select id="savedSort"><option value="new" ${sort==='new'?'selected':''}>Mới nhất</option><option value="old" ${sort==='old'?'selected':''}>Cũ nhất</option><option value="az" ${sort==='az'?'selected':''}>Tên A–Z</option></select><div><button data-saved-grid="0" class="${!grid?'active':''}">${iconSvg('viewList')}</button><button data-saved-grid="1" class="${grid?'active':''}">${iconSvg('gridView')}</button></div></div><div class="content-list ${grid?'saved-grid':''}" style="padding:0">${rows.length?rows.map(x=>card(x,{saved:true})).join(''):empty(iconSvg('bookmark'),'Chưa có mục đã lưu','')}</div></div>`;
}
function renderDownloads(){
  const all=downloads(),q=route.params.q||'',sort=route.params.sort||'new';let rows=all.filter(x=>!q||fold(x.title).includes(fold(q)));rows=sort==='az'?rows.sort((a,b)=>a.title.localeCompare(b.title,'vi')):sort==='old'?rows.slice().reverse():rows;
  ROOT.innerHTML=`<div class="page downloads-page"><div class="search-box"><span>${iconSvg('search')}</span><input id="downloadSearch" value="${esc(q)}" placeholder="Tìm kiếm tệp đã tải..."></div><div class="chip-row"><button class="chip active">Tất cả (${all.length})</button><button class="chip">Yêu cầu tải (${all.length})</button></div><div class="catalog-toolbar"><select id="downloadSort"><option value="new" ${sort==='new'?'selected':''}>Mới nhất</option><option value="old" ${sort==='old'?'selected':''}>Cũ nhất</option><option value="az" ${sort==='az'?'selected':''}>Tên A–Z</option></select>${all.length?'<button data-clear-downloads class="link-button">Xóa lịch sử</button>':''}</div><div class="download-list">${rows.length?rows.map(x=>`<article class="download-row" data-download-title="${esc(x.title)}"><span>${iconSvg('download')}</span><div><b>${esc(x.title)}</b>${x.at?`<small>${esc(fmtDate(x.at))}</small>`:''}</div></article>`).join(''):empty(iconSvg('download'),'Chưa có yêu cầu tải xuống','Trình duyệt sẽ quản lý file tải; HLU TOOLS lưu lịch sử tại đây.')}</div></div>`;
}
function renderNotifications(){const rows=notices(),un=rows.filter(x=>x.unread!==false).length;ROOT.innerHTML=`<div class="page no-pad"><div class="notice-toolbar"><b>THÔNG BÁO</b>${un?'<button data-mark-all>ĐỌC HẾT</button>':''}</div><div class="notice-list">${rows.length?rows.map(n=>`<article class="notice-card ${n.unread!==false?'unread':''}" data-notice="${esc(n.notificationId)}" data-notice-item="${esc(n.itemId)}"><span class="emoji">${iconSvg({news:'article',soft:'computer',docs:'description',firmware:'memory'}[n.section]||'info')}</span><h3>${esc(n.title)}</h3><p>${esc(n.message)}</p><time>${esc(fmtDate(n.createdAt))}</time></article>`).join(''):empty(iconSvg('notifications'),'Chưa có thông báo','Nội dung mới hoặc cập nhật sẽ hiển thị tại đây.')}</div></div>`;}
function renderDetail(){if(!currentItem){ROOT.innerHTML=empty(iconSvg('insertDriveFile'),'Không tìm thấy nội dung','');return;}const x=currentItem,img=bestImage(x),meta=[['Phiên bản',x.version],['Dung lượng',x.size],['Định dạng',x.fileType],['Hãng',x.brand],['Model',x.model]].filter(v=>v[1]);ROOT.innerHTML=`<article class="detail"><h2>${esc(x.title)}</h2>${displayDate(x)?`<time>${esc(fmtDate(displayDate(x)))}</time>`:''}${x.description?`<div class="detail-text">${esc(x.description)}</div>`:''}${x.note?`<div class="detail-note">${esc(x.note)}</div>`:''}${img?`<img src="${esc(img)}" alt="" referrerpolicy="no-referrer">`:''}${meta.length?`<div class="meta">${meta.map(v=>`<div><b>${v[0]}:</b> ${esc(v[1])}</div>`).join('')}</div>`:''}<div class="actions">${downloadRequest(x)?`<button class="primary" data-download-current>${iconSvg('download')} <span data-i18n="TẢI XUỐNG">TẢI XUỐNG</span></button>`:''}${previewUrl(x)?`<button class="secondary" data-view-current>${iconSvg(x.section==='news'?'article':'visibility')} ${x.section==='news'?'XEM TIN':'XEM TÀI LIỆU'}</button>`:''}</div></article>`;}
function renderViewer(){const url=currentItem&&previewUrl(currentItem);ROOT.innerHTML=url?`<div class="viewer"><iframe src="${esc(url)}" title="${esc(currentItem.title)}"></iframe></div>`:empty(iconSvg('insertDriveFile'),'Không thể mở nội dung','Liên kết xem không hợp lệ.');}
function settingsSection(title,html){return`<section class="settings-section"><div class="settings-title">${esc(uiText(title))}</div><div class="settings-card">${html}</div></section>`;}
const SETTINGS_GROUPS=Object.freeze([
 {key:'account',label:'Tài khoản & hồ sơ',summary:'Thông tin và tài khoản',icon:'person',tone:'blue'},{key:'appearance',label:'Giao diện',summary:'Chủ đề và hiển thị',icon:'palette',tone:'purple'},{key:'language',label:'Ngôn ngữ',summary:'Tiếng Việt / English',icon:'language',tone:'green'},{key:'sync',label:'Đồng bộ dữ liệu',summary:'Lấy dữ liệu mới nhất từ máy chủ',icon:'sync',tone:'blue'},{key:'about',label:'Giới thiệu',summary:'Phiên bản và hỗ trợ',icon:'info',tone:'blue'}]);
function settingsGroupRow(g){return`<button class="settings-group-row" data-settings-group="${g.key}"><span class="settings-group-icon ${g.tone}">${iconSvg(g.icon)}</span><span class="settings-copy"><b>${esc(uiText(g.label))}</b><small>${esc(uiText(g.summary))}</small></span>${iconSvg('chevron','settings-chevron')}</button>`;}
function renderSettings(){
 const ct=C.CONTACT||{},group=route.params.group||'',q=fold(route.params.q||''),theme=read(KEYS.theme,'system');
 if(!group){const groups=SETTINGS_GROUPS.filter(g=>!q||fold(uiText(g.label)+' '+uiText(g.summary)).includes(q));ROOT.innerHTML=`<div class="settings settings-android"><label class="settings-search">${iconSvg('search')}<input id="settingsSearch" value="${esc(route.params.q||'')}" placeholder="Tìm kiếm cài đặt..." data-i18n-placeholder="Tìm kiếm cài đặt..."></label><div class="settings-group-list">${groups.length?groups.map(settingsGroupRow).join(''):`<div class="settings-empty" data-i18n="Không tìm thấy cài đặt phù hợp.">Không tìm thấy cài đặt phù hợp.</div>`}</div></div>`;return;}
 const meta=SETTINGS_GROUPS.find(g=>g.key===group);if(!meta){go('settings',{},true);return;}const crumb=`<div class="settings-breadcrumb"><button data-settings-home data-i18n="Cài đặt">Cài đặt</button><span>/</span><span>${esc(uiText(meta.label))}</span></div>`;const hero=['about','account'].includes(group)?'':`<div class="settings-hero"><span class="settings-group-icon ${meta.tone}">${iconSvg(meta.icon)}</span><div><b>${esc(uiText(meta.label))}</b><small>${esc(uiText(meta.summary))}</small></div></div>`;let content='';
 if(group==='account'){const state=profile();content=`<div class="settings-profile">${profileAvatar(state,56)}<div><b>${esc(state.fullName||uiText('Người dùng'))}</b><small>${esc(state.workplace||uiText('Chưa cập nhật'))}</small></div></div>`+settingsSection(uiText('TÀI KHOẢN & HỒ SƠ'),[['Tài khoản',state.username],['Số điện thoại',state.phoneNumber],['Email',state.email]].map(([label,value])=>`<div class="settings-profile-row"><b>${esc(uiText(label))}</b><span>${esc(value||uiText('Chưa cập nhật'))}</span></div>`).join(''));}
 else if(group==='appearance'){const prefs=window.HLUPresentation.preferences();content=settingsSection('CHỦ ĐỀ ỨNG DỤNG',`<div class="settings-row"><span class="settings-copy"><b data-i18n="Chế độ giao diện">Chế độ giao diện</b><small data-i18n="Chọn giao diện sáng, tối hoặc theo hệ thống">Chọn giao diện sáng, tối hoặc theo hệ thống</small></span><select id="themeSelect"><option value="system" ${theme==='system'?'selected':''}>Hệ thống</option><option value="light" ${theme==='light'?'selected':''}>Sáng</option><option value="dark" ${theme==='dark'?'selected':''}>Tối</option></select></div><div class="settings-row"><span class="settings-copy"><b data-i18n="Màu nhấn">Màu nhấn</b></span><div class="accent-choices" role="radiogroup" aria-label="Màu nhấn" data-i18n-aria-label="Màu nhấn">${[['blue','Xanh dương'],['purple','Tím'],['orange','Cam']].map(([key,label])=>`<button class="accent-choice ${prefs.accent===key?'active':''}" data-accent="${key}" role="radio" aria-checked="${prefs.accent===key}" aria-label="${esc(uiText(label))}" style="--choice:${window.HLUPresentation.ACCENTS[key]}">${prefs.accent===key?iconSvg('check'):''}</button>`).join('')}</div></div>`)+settingsSection('HIỂN THỊ',`<div class="settings-row"><span class="settings-copy"><b data-i18n="Kích cỡ">Kích cỡ</b><small data-i18n="Kích thước chữ trong ứng dụng">Kích thước chữ trong ứng dụng</small></span><select id="textScaleSelect">${[.75,1,1.2].map(scale=>`<option value="${scale}" ${prefs.textScale===scale?'selected':''}>${scale*100}%</option>`).join('')}</select></div><div class="settings-row"><span class="settings-copy"><b data-i18n="Hiển thị ảnh chất lượng cao">Hiển thị ảnh chất lượng cao</b><small data-i18n="Độ phân giải ảnh hiển thị">Độ phân giải ảnh hiển thị</small></span><input id="qualityToggle" type="checkbox" role="switch" aria-label="Hiển thị ảnh chất lượng cao" data-i18n-aria-label="Hiển thị ảnh chất lượng cao" ${prefs.highQualityImages?'checked':''}></div>`);}
 else if(group==='language'){const prefs=window.HLUPresentation.preferences();content=settingsSection('NGÔN NGỮ',['vi','en'].map(lang=>`<button class="settings-row settings-language ${prefs.language===lang?'active':''}" data-language="${lang}" role="radio" aria-checked="${prefs.language===lang}"><span class="settings-radio"></span><span class="settings-copy"><b>${lang==='vi'?'Tiếng Việt':'English'}</b></span></button>`).join(''));}
 else if(group==='sync'){const last=read(KEYS.lastSync,'');content=settingsSection('ĐỒNG BỘ DỮ LIỆU',`<div class="settings-sync-copy"><p data-i18n="Cập nhật danh sách tài nguyên và tin tức từ máy chủ.">Cập nhật danh sách tài nguyên và tin tức từ máy chủ.</p><b>${dataError?'Đồng bộ trực tuyến chưa thành công':'Nguồn dữ liệu: máy chủ'}</b>${last?`<small>Lần đồng bộ: ${esc(new Date(last).toLocaleString('vi-VN'))}</small>`:''}<small>${resources.length} tài nguyên</small>${dataError?`<small class="settings-error">${esc(dataError)}</small>`:''}<button class="btn primary" data-sync>${iconSvg('sync')} Đồng bộ ngay</button></div>`);}
 else if(group==='about')content=settingsSection('THÔNG TIN ỨNG DỤNG',`<div class="settings-app-info"><img src="${BASE}assets/icons/icon-192.png" alt="HLU TOOLS"><div><b>HLU TOOLS</b><small class="settings-app-tagline" data-i18n="Kết nối - Chia sẻ - Hiệu Quả">Kết nối - Chia sẻ - Hiệu Quả</small><small class="settings-app-version">v${esc(C.ANDROID_SOURCE_VERSION||'02102026')}</small></div></div><button class="settings-row settings-link-plain" data-route="about"><span class="settings-copy"><b data-i18n="Giới thiệu HLU TOOLS">Giới thiệu HLU TOOLS</b><small data-i18n="Thông tin về ứng dụng">Thông tin về ứng dụng</small></span>${iconSvg('chevron','settings-chevron')}</button><div class="settings-row settings-link-plain"><span class="settings-copy"><b data-i18n="Kiểm tra cập nhật">Kiểm tra cập nhật</b><small data-i18n="Tìm và tải phiên bản mới nhất">Tìm và tải phiên bản mới nhất</small></span></div><button class="settings-row settings-link-plain" data-release-history><span class="settings-copy"><b data-i18n="Nhật ký phiên bản">Nhật ký phiên bản</b><small data-i18n="Danh sách phiên bản">Danh sách phiên bản</small></span>${iconSvg('chevron','settings-chevron')}</button>`)+settingsSection('LIÊN HỆ & HỖ TRỢ',`<a class="settings-row" href="${esc(ct.facebook||'#')}" target="_blank" rel="noopener"><span class="settings-icon settings-facebook">${iconSvg('facebook')}</span><span class="settings-copy"><b>Facebook</b><small data-i18n="Theo dõi fanpage HLU TOOLS">Theo dõi fanpage HLU TOOLS</small></span>${iconSvg('chevron','settings-chevron')}</a><a class="settings-row" href="${esc(ct.zalo||'#')}" target="_blank" rel="noopener"><span class="settings-zalo"><img src="${BASE}assets/android-v280926/ic_zalo.png" alt="Zalo"></span><span class="settings-copy"><b>Zalo</b><small data-i18n="Liên hệ qua Zalo">Liên hệ qua Zalo</small></span>${iconSvg('chevron','settings-chevron')}</a><a class="settings-row" href="tel:${esc(ct.phone||'')}"><span class="settings-icon settings-phone">${iconSvg('phone')}</span><span class="settings-copy"><b data-i18n="Điện thoại">Điện thoại</b><small data-i18n="Liên hệ hỗ trợ trực tiếp">Liên hệ hỗ trợ trực tiếp</small></span>${iconSvg('chevron','settings-chevron')}</a><button class="settings-row" data-route="feedback"><span class="settings-icon settings-email">${iconSvg('email')}</span><span class="settings-copy"><b data-i18n="Góp ý cho nhà phát triển">Góp ý cho nhà phát triển</b><small data-i18n="Báo lỗi, đề xuất tính năng hoặc góp ý khác">Báo lỗi, đề xuất tính năng hoặc góp ý khác</small></span>${iconSvg('chevron','settings-chevron')}</button>`)+settingsSection('ĐƠN VỊ PHÁT TRIỂN',`<div class="settings-row"><span class="settings-icon settings-business">${iconSvg('business')}</span><span class="settings-copy"><b>${esc(C.UNIT_NAME||'VNPT HOA LƯ')}</b><small data-i18n="Đơn vị phát triển và vận hành">Đơn vị phát triển và vận hành</small></span></div>`)
 ROOT.innerHTML=`<div class="settings settings-android ${group==='about'?'settings-about':''}">${crumb}${hero}${content}</div>`;
}
function renderFeedback(){ROOT.innerHTML=`<form id="feedbackForm" class="feedback-form"><label data-i18n="Loại góp ý">Loại góp ý<select id="feedbackType"><option>Báo lỗi</option><option>Đề xuất tính năng</option><option>Link tải lỗi</option><option>Nội dung sai</option><option>Khác</option></select></label><label data-i18n="Tiêu đề">Tiêu đề<input id="feedbackTitle" maxlength="120" required></label><label>Nội dung<textarea id="feedbackContent" maxlength="1500" rows="7" required></textarea></label><label data-i18n="Thông tin liên hệ (không bắt buộc)">Thông tin liên hệ (không bắt buộc)<input id="feedbackContact" maxlength="100"></label><button class="btn primary" type="submit">GỬI GÓP Ý</button></form>`;track('FEEDBACK_OPEN');}
function renderAbout(){const webUrl=C.WEB_URL||'https://hlutools.github.io/hlu/';ROOT.innerHTML=`<article class="about-card android-about"><h2>HLU TOOLS</h2><p class="about-tagline" data-i18n="Kết nối - Chia sẻ - Hiệu Quả">Kết nối - Chia sẻ - Hiệu Quả</p><p class="about-copy" data-i18n="HLU TOOLS là ứng dụng Android hỗ trợ tập trung và tra cứu nhanh các tài nguyên phục vụ công việc kỹ thuật như phần mềm, tài liệu, firmware và cập nhật tin tức. Ứng dụng cho phép tìm kiếm, xem nội dung, lưu mục cần thiết, tải tài nguyên, nhận biết nội dung mới và cập nhật dữ liệu trực tuyến từ một nguồn quản lý tập trung.">HLU TOOLS là ứng dụng Android hỗ trợ tập trung và tra cứu nhanh các tài nguyên phục vụ công việc kỹ thuật như phần mềm, tài liệu, firmware và cập nhật tin tức. Ứng dụng cho phép tìm kiếm, xem nội dung, lưu mục cần thiết, tải tài nguyên, nhận biết nội dung mới và cập nhật dữ liệu trực tuyến từ một nguồn quản lý tập trung.</p><p class="about-copy" data-i18n="Mục tiêu của HLU TOOLS là giúp người dùng tiết kiệm thời gian tìm kiếm, giảm phụ thuộc vào nhiều nguồn rời rạc và tiếp cận thông tin kỹ thuật nhanh hơn trên thiết bị di động.">Mục tiêu của HLU TOOLS là giúp người dùng tiết kiệm thời gian tìm kiếm, giảm phụ thuộc vào nhiều nguồn rời rạc và tiếp cận thông tin kỹ thuật nhanh hơn trên thiết bị di động.</p><p class="about-copy about-copy-last" data-i18n="Hiện tại cũng đã có phiên bản cho người sử dụng hệ điều hành iOS đang trong quá trình hoàn thiện tại địa chỉ:">Hiện tại cũng đã có phiên bản cho người sử dụng hệ điều hành iOS đang trong quá trình hoàn thiện tại địa chỉ:</p><p class="about-link"><a href="${esc(webUrl)}" target="_blank" rel="noopener">${esc(webUrl)}</a></p><p class="about-slogan" data-i18n="HLU TOOLS – Kết nối • Chia sẻ • Hiệu Quả">HLU TOOLS – Kết nối • Chia sẻ • Hiệu Quả</p></article>`;}

async function ensureExam(refresh=true){if(examRuntime.bank)return examRuntime.bank;if(examRuntime.loading)return null;examRuntime.loading=true;renderExamHub();try{examRuntime.bank=await Exam.ExamRepository.load();examRuntime.source=Exam.ExamRepository.source;renderExamHub();if(refresh){const r=await Exam.ExamRepository.refreshOnline();examRuntime.bank=r.bank;examRuntime.source=r.source;examRuntime.message=r.userMessage||'';renderExamHub();}}finally{examRuntime.loading=false;}return examRuntime.bank;}
function renderExamHub(){const bank=examRuntime.bank,history=Exam.ExamHistoryStore.load();if(!bank){ROOT.innerHTML=`<div class="exam-wrap">${empty(iconSvg('school'),'Đang tải E-Learning','')}</div>`;setTimeout(()=>ensureExam(true),0);return;}const topics=bank.topics||[],best=history.reduce((m,x)=>Math.max(m,Number(x.percent)||0),-1);ROOT.innerHTML=`${examRuntime.message?`<div class="exam-sync">${esc(examRuntime.message)}</div>`:''}<div class="exam-wrap"><section class="exam-overview"><h2>${iconSvg('school')}HLU TOOLS E-Learning</h2><p>${topics.length} chủ đề • ${bank.totalQuestionCount} câu hỏi</p><div class="exam-metrics"><div class="exam-metric"><b>${history.length}</b><small data-i18n="Lượt đã làm">Lượt đã làm</small></div><div class="exam-metric"><b>${best<0?'--':best+'%'}</b><small data-i18n="Điểm cao nhất">Điểm cao nhất</small></div><div class="exam-metric"><b>${bank.meta.bankVersion?'v'+esc(bank.meta.bankVersion):'Local'}</b><small data-i18n="Ngân hàng">Ngân hàng</small></div></div>${bank.meta.updatedAt?`<p style="font-size:11px;color:var(--muted2)">Cập nhật ngân hàng: ${esc(bank.meta.updatedAt)}</p>`:''}</section><div class="exam-title"><h3>LUYỆN TẬP THEO CHỦ ĐỀ</h3><p data-i18n="Chọn một chủ đề để ôn tập và xem đáp án ngay sau khi trả lời.">Chọn một chủ đề để ôn tập và xem đáp án ngay sau khi trả lời.</p></div>${topics.length?`<div class="practice-scroll">${topics.map(tp=>`<article class="exam-card practice-card"><h4>${iconSvg('quiz')}${esc(tp.title)}</h4><p>${esc(tp.subtitle)}</p><small>${Exam.ExamRepository.questionsFor(tp.id).length} câu hiện có</small><button class="btn primary" data-practice="${esc(tp.id)}" ${Exam.ExamRepository.questionsFor(tp.id).length?'':'disabled'}>${iconSvg('playArrow')} <span data-i18n="Luyện tập">Luyện tập</span></button></article>`).join('')}</div>`:empty(iconSvg('school'),'Chưa có ngân hàng câu hỏi','')}<div class="exam-title"><h3>THI THỬ</h3><p data-i18n="Làm đề theo thời gian và số câu đã cấu hình cho từng chủ đề.">Làm đề theo thời gian và số câu đã cấu hình cho từng chủ đề.</p></div>${topics.length?`<section class="exam-card">${topics.map(tp=>`<button class="mock-row" data-exam-config="${esc(tp.id)}" style="width:100%;border:0;background:transparent;text-align:left"><span class="round">${iconSvg('timer','mock-timer-icon')}</span><div><b>${esc(tp.title)}</b><small>${Math.min(tp.examQuestionCount,Exam.ExamRepository.questionsFor(tp.id).length)} câu • ${tp.durationMinutes} phút</small></div><span>${iconSvg('chevron')}</span></button>`).join('')}</section>`:''}<div class="exam-title"><h3>LỊCH SỬ KẾT QUẢ</h3><p>${history.length?'Hiển thị 5 kết quả gần nhất trên thiết bị này.':'Chưa có lượt luyện tập hoặc thi thử nào.'}</p></div>${history.length?history.slice(0,5).map(historyCard).join(''):`<div class="platform-note" data-i18n="Kết quả sau khi hoàn thành bài sẽ được lưu tại đây.">Kết quả sau khi hoàn thành bài sẽ được lưu tại đây.</div>`}</div>`;}
function historyCard(x){let date='';try{date=new Intl.DateTimeFormat('vi-VN',{day:'2-digit',month:'2-digit',year:'numeric',hour:'2-digit',minute:'2-digit'}).format(new Date(x.finishedAt));}catch(_){}return`<article class="history-row"><span class="history-score">${esc(x.percent)}%</span><div><b>${esc(x.topicTitle)}</b><small>${x.mode==='test'?'Thi thử':'Luyện tập'} • ${esc(x.correct)}/${esc(x.total)} câu</small></div><small>${esc(date)}</small></article>`;}
async function renderExamConfig(){const bank=examRuntime.bank||await ensureExam(false);if(!bank)return;const tp=bank.topics.find(x=>x.id===route.params.topic);if(!tp){ROOT.innerHTML=empty(iconSvg('school'),'Không tìm thấy chủ đề thi','');return;}const current=Exam.MOCK_COUNTS.includes(tp.examQuestionCount)?tp.examQuestionCount:Exam.DEFAULT_MOCK_COUNT;examRuntime.configCount=Exam.MOCK_COUNTS.includes(examRuntime.configCount)?examRuntime.configCount:current;ROOT.innerHTML=`<div class="exam-wrap"><section class="exam-card"><h2 style="margin:0;font-size:18px">${esc(tp.title)}</h2><p style="color:var(--muted)">${Exam.ExamRepository.questionsFor(tp.id).length} câu hiện có • ${tp.durationMinutes} phút</p></section><section class="exam-card"><label style="display:flex;align-items:center;gap:10px"><input id="customExam" type="checkbox" ${examRuntime.configCustom?'checked':''}><span><b data-i18n="Tùy chỉnh đề thi">Tùy chỉnh đề thi</b><small style="display:block;color:var(--muted)">${examRuntime.configCustom?'Chọn số lượng câu muốn làm':`Dùng mặc định hiện tại: ${tp.examQuestionCount} câu`}</small></span></label>${examRuntime.configCustom?`<div class="exam-config-choice">${Exam.MOCK_COUNTS.map(n=>`<button class="chip ${examRuntime.configCount===n?'active':''}" data-exam-count="${n}">${n} câu</button>`).join('')}</div>`:''}</section><section class="exam-card"><b>${iconSvg('timer')} <span data-i18n="Thời gian thi">Thời gian thi</span></b><p style="color:var(--muted)">${tp.durationMinutes} phút • cấu hình riêng theo chủ đề</p></section><button class="btn primary" data-start-mock="${esc(tp.id)}">${iconSvg('playArrow')} <span data-i18n="BẮT ĐẦU THI">BẮT ĐẦU THI</span></button></div>`;}
async function startAttempt(topicId,mode,count){const bank=examRuntime.bank||await ensureExam(false);const tp=bank&&bank.topics.find(x=>x.id===topicId);if(!tp)return toast('Không tìm thấy chủ đề');const attempt=Exam.ExamEngine.createAttempt(bank,tp,mode,count);if(!attempt.questions.length)return toast('Chưa có câu hỏi cho chủ đề này');examRuntime={...examRuntime,attempt,selected:{},marked:{},revealed:{},index:0,submitted:false,timedOut:false,deadline:mode==='test'?Date.now()+tp.durationMinutes*60000:0,historySaved:false};go('exam-run',{topic:topicId,mode,count:count||''});}
function ensureAttemptFromRoute(){if(examRuntime.attempt&&examRuntime.attempt.topic.id===route.params.topic&&examRuntime.attempt.mode===route.params.mode)return true;const bank=examRuntime.bank;if(!bank)return false;const tp=bank.topics.find(x=>x.id===route.params.topic);if(!tp)return false;const count=Number(route.params.count)||undefined;examRuntime.attempt=Exam.ExamEngine.createAttempt(bank,tp,route.params.mode||'practice',count);examRuntime.selected={};examRuntime.marked={};examRuntime.revealed={};examRuntime.index=0;examRuntime.submitted=false;examRuntime.timedOut=false;examRuntime.deadline=(route.params.mode==='test')?Date.now()+tp.durationMinutes*60000:0;examRuntime.historySaved=false;return true;}
async function renderExamRun(){if(!examRuntime.bank){await ensureExam(false);}if(!ensureAttemptFromRoute()){ROOT.innerHTML=empty(iconSvg('school'),'Không tìm thấy câu hỏi cho chủ đề này','');return;}const at=examRuntime.attempt;if(examRuntime.submitted){clearExamTimer();const score=Exam.ExamEngine.score(at,examRuntime.selected);if(!examRuntime.historySaved){Exam.ExamHistoryStore.add(at,score);examRuntime.historySaved=true;}ROOT.innerHTML=`<div class="exam-wrap">${examRuntime.timedOut?'<div class="exam-sync" data-i18n="Hết thời gian. Bài thi đã được tự động nộp và khóa thao tác.">Hết thời gian. Bài thi đã được tự động nộp và khóa thao tác.</div>':''}<section class="exam-card result-score"><div class="trophy">${iconSvg('emojiEvents')}</div><h2>${esc(at.topic.title)}</h2><strong>${score.percent}%</strong><p>Đúng ${score.correct}/${score.total} câu</p><button class="btn primary" data-route="exam" data-i18n="VỀ DANH SÁCH CHỦ ĐỀ">VỀ DANH SÁCH CHỦ ĐỀ</button></section><div class="exam-title"><h3>${iconSvg('listAlt')}<span data-i18n="XEM LẠI ĐÁP ÁN">XEM LẠI ĐÁP ÁN</span></h3></div>${at.questions.map(q=>reviewQuestion(q,examRuntime.selected[q.source.id]||[])).join('')}</div>`;return;}const q=at.questions[examRuntime.index],sel=new Set(examRuntime.selected[q.source.id]||[]),revealed=at.mode==='practice'&&examRuntime.revealed[q.source.id]===true,correct=Exam.ExamEngine.isAnswerCorrect(q.source,[...sel]),remaining=at.mode==='test'?Math.max(0,Math.ceil((examRuntime.deadline-Date.now())/1000)):0;ROOT.innerHTML=`<div class="exam-wrap"><section class="exam-card"><h3 style="margin:0;color:#015acb">${esc(at.topic.title)}</h3><div class="exam-metrics"><div class="exam-metric"><b>${iconSvg('article')}${at.questions.length} câu</b><small>Tổng</small></div><div class="exam-metric">${iconSvg(at.mode==='test'?'timer':'menuBook')}<b id="examTimer">${at.mode==='test'?formatTime(remaining):'Luyện tập'}</b><small>${at.mode==='test'?'Thời gian':'Chế độ'}</small></div><div class="exam-metric"><b data-i18n="Xáo trộn">Xáo trộn</b><small>Đề</small></div></div></section><section class="exam-card"><div class="exam-run-head"><b>Câu ${examRuntime.index+1}/${at.questions.length}</b><span class="progress"><i style="width:${((examRuntime.index+1)/at.questions.length*100).toFixed(1)}%"></i></span></div><div class="question-text">${esc(q.source.text)}</div><div class="question-help">${q.source.type==='true_false'?'Chọn Đúng hoặc Sai.':'Có thể chọn một hoặc nhiều đáp án.'}</div><div class="option-list">${q.options.map((o,i)=>optionHtml(q,o,i,sel,revealed)).join('')}</div>${at.mode==='practice'&&q.source.type==='multi_choice'&&!revealed?`<button class="btn primary" data-reveal ${sel.size?'':'disabled'}>${iconSvg('checkCircle')} <span data-i18n="KIỂM TRA ĐÁP ÁN">KIỂM TRA ĐÁP ÁN</span></button>`:''}${revealed?`<div class="exam-feedback ${correct?'ok':''}"><b>${correct?'Chính xác':'Chưa chính xác'}</b>${q.source.explanation?`<p>${esc(q.source.explanation)}</p>`:''}</div>`:''}</section><div class="question-nav">${at.questions.map((qq,i)=>`<button class="${i===examRuntime.index?'active':(examRuntime.selected[qq.source.id]||[]).length?'answered':examRuntime.marked[qq.source.id]?'marked':''}" data-q-index="${i}">${i+1}</button>`).join('')}</div><div class="exam-actions"><button class="btn secondary" data-mark>${iconSvg(examRuntime.marked[q.source.id]?'bookmarkFilled':'bookmark')} <span data-i18n="Đánh dấu">Đánh dấu</span></button><button class="btn secondary" data-prev ${examRuntime.index===0?'disabled':''}>${iconSvg('arrowBack')} <span data-i18n="Trước">Trước</span></button><button class="btn primary" data-next ${(at.mode==='practice'&&!revealed)?'disabled':''}>${examRuntime.index<at.questions.length-1?'Câu tiếp':'Nộp'} ${iconSvg(examRuntime.index<at.questions.length-1?'chevron':'send')}</button></div>${at.mode==='test'&&examRuntime.index<at.questions.length-1?`<button class="btn primary" data-submit-exam>${iconSvg('send')} <span data-i18n="NỘP BÀI">NỘP BÀI</span></button>`:''}</div>`;if(at.mode==='test')startExamTimer();}
function optionHtml(q,o,i,sel,revealed){const selected=sel.has(o.id);let cls=selected?'selected ':'';if(revealed){if(o.correct)cls+='correct ';else if(selected)cls+='wrong ';}const key=q.source.type==='true_false'?(o.id==='true'?'Đ':'S'):String.fromCharCode(65+i);return`<button class="option ${cls}" data-option="${esc(o.id)}"><span class="option-key">${key}</span><span>${esc(o.text)}</span>${revealed&&o.correct?`<b style="margin-left:auto;color:#1e9e57">${iconSvg('checkCircle')}</b>`:''}</button>`;}
function reviewQuestion(q,ids){const chosen=q.source.options.filter(o=>ids.includes(o.id)).map(o=>o.text).join('; ')||'Chưa trả lời',correct=q.source.options.filter(o=>o.correct).map(o=>o.text).join('; '),ok=Exam.ExamEngine.isAnswerCorrect(q.source,ids);return`<article class="review-card"><h4>${iconSvg(ok?'checkCircle':'cancel')} ${esc(q.source.text)}</h4><p>Bạn chọn: ${esc(chosen)}</p><p class="correct-text">Đáp án đúng: ${esc(correct)}</p>${q.source.explanation?`<p>${esc(q.source.explanation)}</p>`:''}</article>`;}
function formatTime(s){s=Math.max(0,s|0);return`${String(Math.floor(s/60)).padStart(2,'0')}:${String(s%60).padStart(2,'0')}`;}
function clearExamTimer(){if(examRuntime.timer){clearInterval(examRuntime.timer);examRuntime.timer=null;}}
function startExamTimer(){clearExamTimer();examRuntime.timer=setInterval(()=>{if(route.name!=='exam-run'||examRuntime.submitted){clearExamTimer();return;}const left=Math.max(0,Math.ceil((examRuntime.deadline-Date.now())/1000)),el=$('#examTimer');if(el)el.textContent=formatTime(left);if(left<=0){examRuntime.timedOut=true;examRuntime.submitted=true;clearExamTimer();render();}},500);}

function render(){
  clearExamTimer();clearInterval(homeNewsTimer);homeNewsTimer=null;clearInterval(latestArticleTimer);latestArticleTimer=null;
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
function downloadItem(item){if(!item)return;const u=safeUrl(downloadRequest(item));if(!u)return toast('Nội dung chưa có liên kết tải');recordDownload(item);window.open(u,'_blank','noopener');toast('Đã chuyển tải xuống cho trình duyệt và lưu lịch sử.');}
function doDownload(){downloadItem(currentItem);}
async function showReleaseHistory(){
  try{const r=await fetch(BASE+'assets/data/release_history.json',{cache:'no-store'});if(!r.ok)throw new Error('HTTP '+r.status);const rows=await r.json();const body=(Array.isArray(rows)?rows:[]).slice(0,30).map(x=>`<div class="release-row"><b>v${esc(x.version)}</b><span>${esc(x.date||'')}</span></div>`).join('');const wrap=document.createElement('div');wrap.className='release-modal';wrap.innerHTML=`<div class="release-dialog" role="dialog" aria-modal="true" aria-label="Nhật ký phiên bản" data-i18n-aria-label="Nhật ký phiên bản"><div class="release-title" data-i18n="Nhật ký phiên bản">Nhật ký phiên bản</div><div class="release-list">${body||'<p>Chưa có lịch sử phiên bản.</p>'}</div><div class="release-actions"><button class="release-close" type="button" data-close-release data-i18n="Đóng">Đóng</button></div></div>`;document.body.appendChild(wrap);wrap.addEventListener('click',e=>{if(e.target===wrap||e.target.closest('[data-close-release]'))wrap.remove();});}
  catch(_){toast('Không tải được nhật ký phiên bản.');}
}
async function feedbackSubmit(e){e.preventDefault();const p={action:'feedback',type:$('#feedbackType').value,title:$('#feedbackTitle').value.trim(),content:$('#feedbackContent').value.trim(),contact:$('#feedbackContact').value.trim(),appVersion:C.APP_VERSION||'02102026',device:navigator.userAgent,androidVersion:'Web/PWA'};if(!p.title||!p.content)return toast('Vui lòng nhập tiêu đề và nội dung');try{const r=await fetch(C.API_URL,{method:'POST',headers:{'Content-Type':'text/plain;charset=UTF-8'},body:JSON.stringify(p),redirect:'follow'});const j=await r.json();if(j.success!==true)throw new Error();toast('Đã gửi góp ý. Cảm ơn bạn!');track('FEEDBACK_SENT');go('settings',{},true);}catch(_){toast('Không thể gửi góp ý. Vui lòng thử lại.');track('FEEDBACK_ERROR');}}
async function enableNotifications(){if(!('Notification'in window))return toast('Trình duyệt không hỗ trợ Web Notification');try{const p=await Notification.requestPermission();toast(p==='granted'?'Đã bật thông báo Web':'Chưa cấp quyền thông báo');renderSettings();}catch(_){toast('Không thể yêu cầu quyền thông báo');}}
function applyTheme(value){write(KEYS.theme,value);document.documentElement.dataset.theme=value;if(value==='dark'||(value==='system'&&matchMedia('(prefers-color-scheme: dark)').matches))document.documentElement.classList.add('theme-dark');else document.documentElement.classList.remove('theme-dark');}

async function handleClick(e){
  const el=e.target.closest('button,a,[data-open-item],[data-open-news]');if(!el)return;
  if(el.dataset.route){e.preventDefault();go(el.dataset.route);return;}
  if(el.dataset.language){window.HLUPresentation.update({language:el.dataset.language});render();return;}
  if(el.dataset.accent){window.HLUPresentation.update({accent:el.dataset.accent});renderSettings();return;}
  if(el.dataset.settingsGroup){e.preventDefault();go('settings',{group:el.dataset.settingsGroup});return;}
  if(el.hasAttribute('data-settings-home')){e.preventDefault();go('settings');return;}
  if(el.dataset.section){openSection(el.dataset.section);return;}
  if(el.dataset.openNews){openNewsItem(el.dataset.openNews);return;}
  if(el.dataset.openItem){openItem(el.dataset.openItem,route.name);return;}
  if(el.dataset.fav){e.stopPropagation();toggleFav(el.dataset.fav);return;}
  if(el.dataset.downloadItem){e.preventDefault();e.stopPropagation();downloadItem(resources.find(x=>x.id===el.dataset.downloadItem));return;}
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
  if(el.hasAttribute('data-release-history')){showReleaseHistory();return;}
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
  if(e.target.id==='settingsSearch'){const q=e.target.value;route.params.q=q;history.replaceState({route},'',routeUrl('settings',route.params));renderSettings();const input=$('#settingsSearch');if(input){input.focus();input.setSelectionRange(q.length,q.length);}}
  if(e.target.id==='themeSelect'){applyTheme(e.target.value);}
  if(e.target.id==='textScaleSelect'){window.HLUPresentation.update({textScale:Number(e.target.value)});}
  if(e.target.id==='qualityToggle'){window.HLUPresentation.update({highQualityImages:e.target.checked});}
  if(e.target.id==='customExam'){examRuntime.configCustom=e.target.checked;renderExamConfig();}
}
function headerLeft(){const h=headerConfig();if(h.left==='menu')openDrawer();else back();}
function headerRight(){const h=headerConfig();if(h.right==='bell')go('notifications');else if(h.right==='fav'&&currentItem)toggleFav(currentItem.id);else if(h.right==='external'&&currentItem){const u=previewUrl(currentItem);if(u)window.open(u,'_blank','noopener');}}
function bind(){let stripStart=null;ROOT.addEventListener('pointerdown',e=>{if(e.target.closest('.latest-articles'))stripStart=e.clientX;});ROOT.addEventListener('pointerup',e=>{if(stripStart==null)return;const dx=e.clientX-stripStart;stripStart=null;if(Math.abs(dx)<40)return;const rows=latestResourceArticles();if(rows.length<2)return;latestArticleIndex=(latestArticleIndex+(dx<0?1:-1)+rows.length)%rows.length;const strip=ROOT.querySelector('.latest-articles');if(strip)strip.innerHTML=renderLatestArticle();});document.addEventListener('click',handleClick);document.addEventListener('input',handleInput);document.addEventListener('change',handleInput);$('#headerLeft').addEventListener('click',headerLeft);$('#headerRight').addEventListener('click',headerRight);$('#scrim').addEventListener('click',closeDrawer);document.addEventListener('submit',e=>{if(e.target.id==='feedbackForm')feedbackSubmit(e);});window.addEventListener('popstate',()=>{route=parseRoute();render();});window.addEventListener('online',()=>{updateChrome();loadData(true,true);});window.addEventListener('offline',updateChrome);document.addEventListener('visibilitychange',()=>{if(document.hidden){clearInterval(latestArticleTimer);latestArticleTimer=null;}else{if(route.name==='home')bindLatestArticles();if(navigator.onLine)loadData(false,true);}});}
async function serviceWorker(){if('serviceWorker'in navigator)try{const r=await navigator.serviceWorker.register(BASE+'sw.js',{scope:BASE});r.update();}catch(_){}}
async function start(){migrate();hydrateStaticIcons();applyTheme(read(KEYS.theme,'system'));const cache=read(KEYS.data,[]);let initial=Array.isArray(cache)?sortRows(cache.map((row,i)=>normalize(row,i))):[];initial=mergeFallbackNews(initial,await loadNewsFallback());resources=initial;route=parseRoute();const ct=C.CONTACT||{};$('#developerLink').href=ct.zalo||'#';bind();render();track('SESSION_START');track('APP_OPEN');loadData(false,true);setInterval(()=>{if(navigator.onLine)loadData(false,true);},60000);if(document.readyState==='complete')serviceWorker();else window.addEventListener('load',serviceWorker,{once:true});}
start();
})();
