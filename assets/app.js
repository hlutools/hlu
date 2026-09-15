(()=>{
'use strict';

const C=window.HLU_CONFIG||{};
const BASE=C.BASE_PATH||'/hlu/';
const $=selector=>document.querySelector(selector);
const $$=selector=>Array.from(document.querySelectorAll(selector));
const KEYS={
  data:'hlu_tools_data_150926_3',
  saved:'hlu_tools_saved_150926_3',
  downloads:'hlu_tools_downloads_150926_3',
  snapshot:'hlu_tools_content_snapshot_150926_3',
  notices:'hlu_tools_content_notifications_150926_3',
  unreadNews:'hlu_tools_unread_news_item_ids_150926_3',
  lastSync:'hlu_tools_last_sync_150926_3'
};
const LEGACY={
  data:'hlu_tools_data_130926',saved:'hlu_tools_saved_130926',downloads:'hlu_tools_downloads_130926',
  seen:'hlu_tools_seen_130926',notices:'hlu_tools_notices_130926',lastSync:'hlu_tools_last_sync_130926'
};
const LABELS={news:'TIN TỨC',soft:'SOFT VNPT',docs:'TÀI LIỆU',firmware:'FIRMWARE'};
const HEADER_IMAGES={home:'home-header.png',search:'search-header.png',notifications:'notifications-header.png',saved:'saved-header.png',downloads:'downloads-header.png'};
const SECTION_PLACEHOLDER={soft:'Tìm phần mềm...',docs:'Tìm tài liệu...',firmware:'Tìm firmware...'};
const SECTION_EMOJI={news:'📰',soft:'🧰',docs:'📄',firmware:'⚙️'};
const FALLBACK=[
  {id:'welcome-1509263',section:'news',title:'Chào mừng đến với HLU TOOLS',description:'Kết nối - Chia sẻ - Hiệu Quả',updatedAt:'2026-09-15',visible:true,sortOrder:1},
  {id:'soft-1509263',section:'soft',title:'Kho phần mềm VNPT',description:'Ứng dụng và công cụ dành cho kỹ thuật',visible:true,sortOrder:1},
  {id:'docs-1509263',section:'docs',title:'Kho tài liệu kỹ thuật',description:'Tài liệu hướng dẫn và kỹ thuật',visible:true,sortOrder:1},
  {id:'firmware-1509263',section:'firmware',title:'Kho firmware thiết bị',description:'Firmware thiết bị các hãng',visible:true,sortOrder:1}
];
let resources=[];
let currentView='home';
let currentSection='soft';
let currentItem=null;
let detailBackView='home';
let selectedBrand='';
let toastTimer=0;
let loading=false;

function storageRead(key,fallback){try{const raw=localStorage.getItem(key);return raw===null?fallback:JSON.parse(raw);}catch(error){return fallback;}}
function storageWrite(key,value){try{localStorage.setItem(key,JSON.stringify(value));}catch(error){}}
function storageRemove(key){try{localStorage.removeItem(key);}catch(error){}}
function text(value){return String(value===undefined||value===null?'':value);}
function escapeHtml(value){return text(value).replace(/[&<>"']/g,char=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#039;'}[char]));}
function stripHtml(value){const node=document.createElement('div');node.innerHTML=text(value);return (node.textContent||node.innerText||'').trim();}
function fold(value){return text(value).normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase();}
function first(object,names,fallback){for(const name of names){const value=object[name];if(value!==undefined&&value!==null&&value!=='')return value;}return fallback;}
function boolValue(value){if(value===undefined||value===null||value==='')return true;if(typeof value==='boolean')return value;return !['false','0','no','off','ẩn','an','không','khong','inactive'].includes(fold(value).trim());}
function safeUrl(value){const raw=text(value).trim();if(!raw)return '';try{const parsed=new URL(raw,location.href);return ['http:','https:'].includes(parsed.protocol)?parsed.href:'';}catch(error){return '';}}
function driveFileId(value){const url=safeUrl(value);if(!url)return '';try{const parsed=new URL(url);if(!/drive\.google\.com$/i.test(parsed.hostname)&&!/\.drive\.google\.com$/i.test(parsed.hostname))return '';const match=parsed.pathname.match(/\/file\/d\/([^/?#]+)/i);return match?match[1]:(parsed.searchParams.get('id')||'');}catch(error){return '';}}
function imageUrl(value){const url=safeUrl(value);if(!url)return '';const id=driveFileId(url);return id?'https://drive.google.com/thumbnail?id='+encodeURIComponent(id)+'&sz=w1200':url;}
function normalizeSection(value){const name=fold(value).replace(/[_-]+/g,' ').trim();if(!name)return 'docs';if(name.includes('tin')||name.includes('news')||name.includes('thong bao'))return 'news';if(name.includes('firm')||name.includes('rom'))return 'firmware';if(name.includes('soft')||name.includes('phan mem')||name==='app')return 'soft';if(name.includes('doc')||name.includes('tai lieu')||name.includes('document'))return 'docs';return ['news','soft','docs','firmware'].includes(name)?name:'docs';}
function normalizeItem(row,index,forcedSection){
  const source=row&&typeof row==='object'?row:{title:row};
  const title=first(source,['title','Title','name','Name','ten','Tên','tieuDe','TieuDe','tiêu đề'],'Không có tiêu đề');
  const id=first(source,['id','ID','Id','key','ma','mã'],'item-'+fold(title).replace(/[^a-z0-9]+/g,'-')+'-'+index);
  return {
    id:text(id),section:normalizeSection(forcedSection||first(source,['section','Section','category','Category','type','Type','danhMuc','DanhMuc','loai','Loai','nhom','Nhom'],'docs')),
    title:text(title),brand:text(first(source,['brand','Brand','hang','Hãng','thuongHieu','ThuongHieu'],'')),model:text(first(source,['model','Model','dongMay','DongMay','thietBi','ThietBi'],'')),
    version:text(first(source,['version','Version','phienBan','PhienBan'],'')),size:text(first(source,['size','Size','dungLuong','DungLuong'],'')),
    description:stripHtml(first(source,['description','Description','moTa','MoTa'],'')),note:stripHtml(first(source,['note','Note','ghiChu','GhiChu'],'')),
    viewUrl:safeUrl(first(source,['viewUrl','viewURL','previewUrl','previewURL','url','URL','linkView','linkXem','xem'],'')),
    downloadUrl:safeUrl(first(source,['downloadUrl','downloadURL','fileUrl','fileURL','linkDownload','linkTai','tai'],'')),
    resolvedViewUrl:safeUrl(first(source,['resolvedViewUrl','resolvedViewURL','directViewUrl'],'')),resolvedDownloadUrl:safeUrl(first(source,['resolvedDownloadUrl','resolvedDownloadURL','directDownloadUrl','directUrl'],'')),
    iconUrl:imageUrl(first(source,['iconUrl','iconURL','thumbnail','thumb'],'')),imageUrl:imageUrl(first(source,['imageUrl','imageURL','anh','image'],'')),
    fileType:text(first(source,['fileType','FileType','format','dinhDang','DinhDang'],'')),createdAt:text(first(source,['createdAt','created','ngayTao','NgayTao'],'')),updatedAt:text(first(source,['updatedAt','updated','date','Date','ngayCapNhat','NgayCapNhat'],'')),
    sortOrder:Number(first(source,['sortOrder','order','thuTu','ThuTu','stt','STT'],0))||0,visible:boolValue(first(source,['visible','Visible','isVisible','published','Published','hienThi','HienThi','trangThai','status'],true))
  };
}
function extractRows(payload){
  if(Array.isArray(payload))return payload.map((row,index)=>normalizeItem(row,index));
  if(!payload||typeof payload!=='object')return [];
  if(payload.success===false)throw new Error(payload.message||payload.error||'API báo lỗi');
  const direct=first(payload,['data','items','result','rows','resources'],null);
  if(Array.isArray(direct))return direct.map((row,index)=>normalizeItem(row,index));
  if(direct&&typeof direct==='object'&&direct!==payload)return extractRows(direct);
  let combined=[];
  ['news','soft','docs','firmware'].forEach(section=>{
    const candidates=[section,section.toUpperCase(),LABELS[section]];
    for(const candidate of candidates){if(Array.isArray(payload[candidate])){combined=combined.concat(payload[candidate].map((row,index)=>normalizeItem(row,index,section)));break;}}
  });
  return combined;
}
function baseSort(rows){return rows.filter(item=>item.visible).sort((a,b)=>a.sortOrder-b.sortOrder||text(b.updatedAt).localeCompare(text(a.updatedAt),'vi')||a.title.localeCompare(b.title,'vi'));}
function dateMs(value){const parsed=Date.parse(value||'');return Number.isNaN(parsed)?0:parsed;}
function displayDate(item){return item.createdAt||item.updatedAt||'';}
function dateLabel(value){if(!value)return '';const date=new Date(value);if(Number.isNaN(date.getTime()))return text(value);return new Intl.DateTimeFormat('vi-VN',{day:'2-digit',month:'2-digit',year:'numeric'}).format(date);}
function bestImage(item){return item.imageUrl||item.iconUrl||'';}
function bestView(item){return item.resolvedViewUrl||item.viewUrl||'';}
function bestDownload(item){return item.resolvedDownloadUrl||item.downloadUrl||'';}
function previewUrl(item){const url=safeUrl(bestView(item)||item.downloadUrl);if(!url)return '';const id=driveFileId(url);return id?'https://drive.google.com/file/d/'+encodeURIComponent(id)+'/preview':url;}
function svg(name){return '<svg class="icon" aria-hidden="true"><use href="#i-'+name+'"></use></svg>';}
function sectionIcon(section){return section==='news'?'news':section==='soft'?'package':section==='firmware'?'chip':'file';}
function emptyHtml(icon,title,description){return '<div class="empty-state">'+svg(icon)+'<strong>'+escapeHtml(title)+'</strong><p>'+escapeHtml(description||'')+'</p></div>';}
function showToast(message){const toast=$('#toast');toast.textContent=message;toast.classList.add('show');clearTimeout(toastTimer);toastTimer=setTimeout(()=>toast.classList.remove('show'),2300);}
function apiUrl(){return C.API_URL||'';}

function migrateLegacy(){
  if(localStorage.getItem(KEYS.data)===null){const old=storageRead(LEGACY.data,[]);if(Array.isArray(old)&&old.length)storageWrite(KEYS.data,old);}
  if(localStorage.getItem(KEYS.saved)===null){const old=storageRead(LEGACY.saved,[]);if(Array.isArray(old))storageWrite(KEYS.saved,old.map(text));}
  if(localStorage.getItem(KEYS.downloads)===null){const old=storageRead(LEGACY.downloads,[]);if(Array.isArray(old))storageWrite(KEYS.downloads,old.map(entry=>typeof entry==='string'?entry:text(entry&&entry.title)).filter(Boolean));}
  if(localStorage.getItem(KEYS.lastSync)===null){const old=storageRead(LEGACY.lastSync,'');if(old)storageWrite(KEYS.lastSync,old);}
  if(localStorage.getItem(KEYS.notices)===null){
    const old=storageRead(LEGACY.notices,[]);
    if(Array.isArray(old)&&old.length){storageWrite(KEYS.notices,old.map((notice,index)=>{
      const item=notice.item||notice;
      return {notificationId:'legacy-'+index+'-'+text(notice.id||item.id),itemId:text(notice.id||item.id),section:normalizeSection(item.section),type:'NEW_ITEM',title:text(item.title||'Nội dung mới'),message:'Nội dung mới',createdAt:notice.createdAt||item.updatedAt||new Date().toISOString(),unread:notice.unread!==false,item:normalizeItem(item,index)};
    }).slice(0,100));}
  }
  if(localStorage.getItem(KEYS.unreadNews)===null)storageWrite(KEYS.unreadNews,[]);
  if(localStorage.getItem(KEYS.snapshot)===null){
    const cached=storageRead(KEYS.data,[]);const legacySeen=storageRead(LEGACY.seen,[]);
    if(Array.isArray(cached)&&cached.length&&Array.isArray(legacySeen)&&legacySeen.length){const normalized=baseSort(cached.map((item,index)=>normalizeItem(item,index)));storageWrite(KEYS.snapshot,normalized.map(snapshotEntry));}
  }
}
function savedIds(){const value=storageRead(KEYS.saved,[]);return Array.isArray(value)?value.map(text):[];}
function unreadNewsIds(){const value=storageRead(KEYS.unreadNews,[]);return Array.isArray(value)?value.map(text):[];}
function noticeItems(){const value=storageRead(KEYS.notices,[]);return Array.isArray(value)?value:[];}
function downloadTitles(){const value=storageRead(KEYS.downloads,[]);return Array.isArray(value)?value.map(entry=>typeof entry==='string'?entry:text(entry&&entry.title)).filter(Boolean):[];}
function snapshotEntry(item){return {id:item.id,section:item.section,version:item.version||'',updatedAt:item.updatedAt||''};}
function unreadNotificationCount(){return noticeItems().filter(notice=>notice.unread!==false).length;}
function pruneUnreadNews(fresh){const valid=new Set(fresh.filter(item=>item.section==='news').map(item=>item.id));storageWrite(KEYS.unreadNews,unreadNewsIds().filter(id=>valid.has(id)));}
function notificationMessage(item,type){if(type==='VERSION_UPDATE')return item.section==='news'?'Tin tức được cập nhật':(LABELS[item.section]||'Nội dung')+' được cập nhật';return item.section==='soft'?'Phần mềm mới':item.section==='docs'?'Tài liệu mới':item.section==='firmware'?'Firmware mới':'Tin tức mới';}
function processFreshNotifications(fresh){
  const oldSnapshot=storageRead(KEYS.snapshot,[]);
  if(!Array.isArray(oldSnapshot)||!oldSnapshot.length){storageWrite(KEYS.snapshot,fresh.map(snapshotEntry));pruneUnreadNews(fresh);return;}
  const oldMap=new Map(oldSnapshot.map(entry=>[text(entry.id),entry]));
  const unreadNews=new Set(unreadNewsIds());
  const notices=noticeItems();
  const created=[];
  const now=Date.now();
  fresh.forEach((item,index)=>{
    const old=oldMap.get(item.id);let type='';
    if(!old){type='NEW_ITEM';if(item.section==='news')unreadNews.add(item.id);}
    else if(item.section==='news'&&old.updatedAt&&item.updatedAt&&old.updatedAt!==item.updatedAt)type='VERSION_UPDATE';
    else if(item.section!=='news'&&item.version&&old.version!==item.version)type='VERSION_UPDATE';
    if(type){created.push({notificationId:type+'-'+item.id+'-'+(item.updatedAt||item.version||now+'-'+index),itemId:item.id,section:item.section,type,title:item.title,message:notificationMessage(item,type),createdAt:new Date().toISOString(),unread:true,item});}
  });
  if(created.length){
    const byId=new Map();created.forEach(n=>byId.set(n.notificationId,n));notices.forEach(n=>{if(!byId.has(n.notificationId))byId.set(n.notificationId,n);});
    storageWrite(KEYS.notices,Array.from(byId.values()).slice(0,100));
    if('Notification' in window&&Notification.permission==='granted'){try{new Notification('HLU TOOLS có '+created.length+' nội dung mới/cập nhật',{body:created[0].title,icon:BASE+'assets/icons/icon-192.png',tag:'hlu-tools-update'});}catch(error){}}
  }
  storageWrite(KEYS.unreadNews,Array.from(unreadNews));storageWrite(KEYS.snapshot,fresh.map(snapshotEntry));pruneUnreadNews(fresh);
}

function thumbHtml(item){const image=bestImage(item);return image?'<div class="content-thumb"><img src="'+escapeHtml(image)+'" alt="" loading="lazy" referrerpolicy="no-referrer"></div>':'<div class="content-thumb">'+svg(sectionIcon(item.section))+'</div>';}
function badgeFor(item,isNew){if(item.section==='news')return isNew?'Mới':(item.brand||'Tin tức');if(item.section==='soft')return item.version||'SOFT';if(item.section==='firmware')return item.version||'Firmware';return (item.fileType||'Tài liệu').toUpperCase();}
function contentCard(item){
  const isNew=item.section==='news'&&unreadNewsIds().includes(item.id);const saved=savedIds().includes(item.id);const badge=badgeFor(item,isNew);
  return '<article class="content-card'+(isNew?' news-new':'')+'" data-id="'+escapeHtml(item.id)+'">'+thumbHtml(item)+'<div class="content-copy"><span class="content-badge'+(isNew?' new':'')+'">'+escapeHtml(badge)+'</span><h3>'+escapeHtml(item.title)+'</h3><p>'+escapeHtml(item.description||item.note||item.brand||LABELS[item.section])+'</p>'+(displayDate(item)?'<time>'+escapeHtml(dateLabel(displayDate(item)))+'</time>':'')+'</div><button class="favorite-button'+(saved?' saved':'')+'" type="button" data-favorite="'+escapeHtml(item.id)+'" aria-label="'+(saved?'Bỏ lưu':'Lưu')+'">'+svg('heart')+'</button></article>';
}
function renderList(element,items,title,description){element.innerHTML=items.length?items.map(contentCard).join(''):emptyHtml('file',title,description);}
function sortedNews(){const unread=new Set(unreadNewsIds());return resources.filter(item=>item.section==='news').sort((a,b)=>Number(unread.has(b.id))-Number(unread.has(a.id))||dateMs(b.updatedAt)-dateMs(a.updatedAt)||a.sortOrder-b.sortOrder||a.title.localeCompare(b.title,'vi'));}
function renderHome(){
  const all=sortedNews();const news=all.slice(0,2);const unreadCount=all.filter(item=>unreadNewsIds().includes(item.id)).length;
  const badge=$('#homeNewsBadge');badge.textContent=unreadCount+' mới';badge.classList.toggle('hidden',unreadCount===0);
  const drawerBadge=$('#drawerNewsBadge');drawerBadge.textContent=unreadCount>99?'99+':unreadCount;drawerBadge.classList.toggle('hidden',unreadCount===0);
  $('#homeNews').classList.toggle('single',news.length===1);
  $('#homeNews').innerHTML=news.length?news.map(item=>{
    const isNew=unreadNewsIds().includes(item.id);const image=bestImage(item)?'<img src="'+escapeHtml(bestImage(item))+'" alt="" loading="lazy" referrerpolicy="no-referrer">':'NEWS';
    return '<article class="home-news-row'+(isNew?' new':'')+'" data-id="'+escapeHtml(item.id)+'"><div class="home-news-thumb">'+image+'</div><div class="home-news-copy"><div class="home-news-title-line"><strong>'+escapeHtml(item.title)+'</strong>'+(isNew?'<i class="new-pill">Mới</i>':'')+'</div><p>'+escapeHtml(item.description||item.note||'Tin tức HLU TOOLS')+'</p><small>'+escapeHtml(dateLabel(item.updatedAt||item.createdAt))+'</small></div>'+svg('chevron-right')+'</article>';
  }).join(''):emptyHtml('news','Chưa có tin tức','Dữ liệu đang được cập nhật.');
}
function renderNews(){const items=sortedNews();const count=items.filter(item=>unreadNewsIds().includes(item.id)).length;const banner=$('#newsUnreadBanner');banner.textContent=count+' bài viết mới chưa đọc';banner.classList.toggle('hidden',count===0);renderList($('#newsList'),items,'Chưa có tin tức','Dữ liệu tin tức đang được cập nhật.');}
function searchResources(query,section,brand){const q=fold(query).trim();return resources.filter(item=>{if(section&&item.section!==section)return false;if(brand&&fold(item.brand)!==fold(brand))return false;if(!q)return true;return fold([item.title,item.brand,item.model,item.version,item.description,item.note,item.fileType].join(' ')).includes(q);});}
function renderSearch(){const query=$('#searchInput').value.trim();const results=searchResources(query);$('#clearSearch').classList.toggle('hidden',!query);$('#searchSummary').textContent=query?results.length+' kết quả cho “'+query+'”':'Tất cả nội dung · '+results.length+' mục';renderList($('#searchList'),results,'Không tìm thấy kết quả','Thử một từ khóa khác.');}
function renderBrands(){
  const container=$('#brandChips');if(!['docs','firmware'].includes(currentSection)){container.classList.add('hidden');container.innerHTML='';return;}
  const brands=Array.from(new Set(resources.filter(item=>item.section===currentSection&&item.brand).map(item=>item.brand))).sort((a,b)=>a.localeCompare(b,'vi'));
  container.innerHTML=[''].concat(brands).map(brand=>'<button type="button" class="brand-chip'+(selectedBrand===brand?' active':'')+'" data-brand="'+escapeHtml(brand)+'">'+escapeHtml(brand||'Tất cả')+'</button>').join('');container.classList.remove('hidden');
}
function renderSection(){renderBrands();$('#sectionSearch').placeholder=SECTION_PLACEHOLDER[currentSection]||'Tìm trong danh mục...';const results=searchResources($('#sectionSearch').value,currentSection,selectedBrand);$('#sectionSummary').textContent=results.length+' mục trong '+(LABELS[currentSection]||'danh mục');renderList($('#sectionList'),results,'Chưa có nội dung','Dữ liệu danh mục đang được cập nhật.');}
function renderSaved(){const ids=savedIds();const items=ids.map(id=>resources.find(item=>item.id===id)).filter(Boolean);$('#savedSummary').textContent=items.length+' nội dung đã lưu';renderList($('#savedList'),items,'Chưa có nội dung đã lưu','Nhấn biểu tượng trái tim để lưu nội dung cần dùng.');}
function renderDownloads(){const titles=downloadTitles();$('#downloadSummary').textContent=titles.length+' mục đã tải';$('#clearDownloads').classList.toggle('hidden',!titles.length);$('#downloadList').innerHTML=titles.length?titles.map(title=>'<article class="download-row" data-download-title="'+escapeHtml(title)+'"><span class="download-icon">'+svg('download')+'</span><strong>'+escapeHtml(title)+'</strong></article>').join(''):emptyHtml('download','Chưa có lịch sử Download','Các nội dung đã tải sẽ xuất hiện tại đây.');}
function notificationStats(){const unread=noticeItems().filter(n=>n.unread!==false);return {all:unread.length,soft:unread.filter(n=>n.section==='soft').length,docs:unread.filter(n=>n.section==='docs').length,firmware:unread.filter(n=>n.section==='firmware').length,news:unread.filter(n=>n.section==='news').length};}
function renderNotifications(){
  const notices=noticeItems();const stats=notificationStats();$('#markRead').classList.toggle('hidden',stats.all===0);
  const chips=[['bell','Chưa đọc',stats.all],['package','Phần mềm mới',stats.soft],['file','Tài liệu mới',stats.docs],['chip','Firmware mới',stats.firmware],['news','Tin tức mới',stats.news]];
  $('#notificationChips').innerHTML=chips.map(([icon,label,count])=>'<div class="summary-chip">'+svg(icon)+'<b>'+count+'</b><span>'+escapeHtml(label)+'</span></div>').join('');
  $('#notificationList').innerHTML=notices.length?notices.map(notice=>'<article class="notification-card'+(notice.unread===false?'':' unread')+'" data-notice="'+escapeHtml(notice.notificationId)+'" data-notice-item="'+escapeHtml(notice.itemId)+'"><span class="notice-emoji">'+(SECTION_EMOJI[notice.section]||'🔔')+'</span><h3>'+escapeHtml(notice.title||'Nội dung mới')+'</h3><p>'+escapeHtml(notice.message||'Nội dung mới / cập nhật')+'</p><time>'+escapeHtml(dateLabel(notice.createdAt)||'Mới cập nhật')+'</time>'+(notice.unread===false?'':'<i class="unread-dot"></i>')+'</article>').join(''):emptyHtml('bell','Chưa có thông báo','Nội dung mới hoặc cập nhật sẽ hiển thị tại đây.');
  updateNotificationBadge();
}
function updateNotificationBadge(){const count=unreadNotificationCount();const badge=$('#notificationBadge');badge.textContent=count>99?'99+':count;badge.classList.toggle('hidden',count===0);}
function renderDetail(){
  if(!currentItem){$('#detailContent').innerHTML=emptyHtml('file','Không tìm thấy nội dung','Nội dung có thể đã được cập nhật.');return;}
  currentItem=resources.find(item=>item.id===currentItem.id)||currentItem;const item=currentItem;const image=bestImage(item);const meta=[['Phiên bản',item.version],['Dung lượng',item.size],['Định dạng',item.fileType],['Hãng',item.brand],['Model',item.model]].filter(([,value])=>value);
  $('#detailContent').innerHTML='<article class="detail-card"><h2>'+escapeHtml(item.title)+'</h2>'+(displayDate(item)?'<time class="detail-date">'+escapeHtml(dateLabel(displayDate(item)))+'</time>':'')+(item.description?'<div class="detail-description">'+escapeHtml(item.description)+'</div>':'')+(item.note?'<div class="detail-note">'+escapeHtml(item.note)+'</div>':'')+(image?'<img class="detail-image" src="'+escapeHtml(image)+'" alt="" referrerpolicy="no-referrer">':'')+(meta.length?'<div class="detail-meta">'+meta.map(([label,value])=>'<div><b>'+escapeHtml(label)+':</b><span>'+escapeHtml(value)+'</span></div>').join('')+'</div>':'')+'<div class="detail-actions">'+(bestDownload(item)?'<button type="button" class="primary" data-download-current>'+svg('download')+'TẢI XUỐNG</button>':'')+(previewUrl(item)?'<button type="button" class="secondary" data-view-current>'+svg('external')+(item.section==='news'?'XEM TIN':'XEM TÀI LIỆU')+'</button>':'')+'</div></article>';
  updateTechAction();
}
function renderAll(){renderHome();renderNews();renderSaved();renderDownloads();renderNotifications();if(currentView==='search')renderSearch();if(currentView==='section')renderSection();if(currentView==='detail')renderDetail();}

function openDrawer(){$('#drawer').classList.add('open');$('#drawerScrim').classList.remove('hidden');$('#drawer').setAttribute('aria-hidden','false');}
function closeDrawer(){$('#drawer').classList.remove('open');$('#drawerScrim').classList.add('hidden');$('#drawer').setAttribute('aria-hidden','true');}
function techTitle(view){if(view==='news')return 'TIN TỨC';if(view==='section')return LABELS[currentSection]||'HLU TOOLS';if(view==='detail')return currentItem?(LABELS[currentItem.section]||'CHI TIẾT'):'CHI TIẾT';if(view==='viewer')return currentItem?currentItem.title:'XEM NỘI DUNG';if(view==='settings')return 'CÀI ĐẶT';if(view==='feedback')return 'GÓP Ý';return 'HLU TOOLS';}
function setHeader(view){const imageName=HEADER_IMAGES[view];$('#imageHeader').classList.toggle('hidden',!imageName);$('#techHeader').classList.toggle('hidden',Boolean(imageName));if(imageName){$('#headerImage').src=BASE+'assets/android-v130926/'+imageName;$('#headerLeftAction').setAttribute('aria-label',view==='home'?'Mở menu':'Về Trang chủ');}else{$('#techTitle').textContent=techTitle(view);updateTechAction();}}
function updateTechAction(){const action=$('#techAction');const use=$('#techActionIcon use');if(currentView==='detail'&&currentItem){const saved=savedIds().includes(currentItem.id);action.classList.remove('invisible');action.classList.toggle('saved',saved);use.setAttribute('href','#i-heart');action.setAttribute('aria-label',saved?'Bỏ lưu':'Lưu nội dung');}else if(currentView==='viewer'&&currentItem){action.classList.remove('invisible','saved');use.setAttribute('href','#i-external');action.setAttribute('aria-label','Mở ngoài');}else{action.classList.add('invisible');action.classList.remove('saved');}}
function setUrl(view,replace){const params=new URLSearchParams();if(view!=='home')params.set('view',view);if(view==='section')params.set('section',currentSection);if((view==='detail'||view==='viewer')&&currentItem)params.set('id',currentItem.id);const url=BASE+(params.toString()?'?'+params.toString():'');const state={view,section:currentSection,id:currentItem&&currentItem.id};if(replace)history.replaceState(state,'',url);else history.pushState(state,'',url);}
function showView(view,options={}){const valid=['home','search','notifications','saved','downloads','news','section','detail','viewer','settings','feedback'];if(!valid.includes(view))view='home';currentView=view;$$('.view').forEach(el=>el.classList.remove('active'));const target=$('#'+view+'View');if(target)target.classList.add('active');const navActive=['home','search','notifications','saved','downloads'].includes(view)?view:'home';$$('.bottom-nav button').forEach(button=>button.classList.toggle('active',button.dataset.view===navActive));$$('.drawer-menu button').forEach(button=>button.classList.toggle('active',button.dataset.view===view||(view==='section'&&button.dataset.section===currentSection)));closeDrawer();setHeader(view);if(!options.keepUrl)setUrl(view,Boolean(options.replace));window.scrollTo(0,0);if(view==='search')renderSearch();if(view==='notifications')renderNotifications();if(view==='saved')renderSaved();if(view==='downloads')renderDownloads();if(view==='news')renderNews();if(view==='section')renderSection();if(view==='detail')renderDetail();if(view==='settings'){$('#versionLabel').textContent='HLU TOOLS v'+(C.APP_VERSION||'150926.3');}if(view==='search'&&options.focus)setTimeout(()=>$('#searchInput').focus(),100);}
function openSection(section){currentSection=normalizeSection(section);selectedBrand='';$('#sectionSearch').value='';showView('section');}
function goBack(){if(currentView==='feedback'){showView('settings',{replace:true});return;}if(currentView==='viewer'){showView('detail',{replace:true});return;}if(currentView==='detail'){showView(detailBackView||'home',{replace:true});return;}showView('home',{replace:true});}
function routeInitial(){const params=new URLSearchParams(location.search);const view=params.get('view')||'home';if(view==='section')currentSection=normalizeSection(params.get('section')||'soft');if(view==='detail'||view==='viewer'){const id=params.get('id');currentItem=resources.find(item=>item.id===id)||null;if(!currentItem){showView('home',{keepUrl:true});return;}}showView(view,{keepUrl:true});}

function toggleSaved(id){let ids=savedIds();const wasSaved=ids.includes(id);ids=wasSaved?ids.filter(value=>value!==id):[id].concat(ids);storageWrite(KEYS.saved,ids);renderAll();updateTechAction();showToast(wasSaved?'Đã bỏ lưu':'Đã lưu nội dung');}
function markNewsItemViewed(id){const ids=unreadNewsIds().filter(value=>value!==id);storageWrite(KEYS.unreadNews,ids);renderHome();renderNews();}
function markNotificationRead(notificationId){storageWrite(KEYS.notices,noticeItems().map(n=>n.notificationId===notificationId?Object.assign({},n,{unread:false}):n));renderNotifications();}
function markItemNotificationsRead(itemId){storageWrite(KEYS.notices,noticeItems().map(n=>n.itemId===itemId?Object.assign({},n,{unread:false}):n));renderNotifications();}
function markAllNotificationsRead(){storageWrite(KEYS.notices,noticeItems().map(n=>Object.assign({},n,{unread:false})));renderNotifications();showToast('Đã đánh dấu tất cả là đã đọc');}
function openDetail(id,fromView){currentItem=resources.find(item=>item.id===id)||currentItem;if(!currentItem)return;detailBackView=fromView||currentView||'home';if(currentItem.section==='news')markNewsItemViewed(currentItem.id);markItemNotificationsRead(currentItem.id);showView('detail');}
function openViewer(){if(!currentItem)return;const url=previewUrl(currentItem);if(!url)return showToast('Nội dung chưa có liên kết xem');$('#contentViewer').src=url;showView('viewer');}
function recordDownload(item){const titles=downloadTitles().filter(title=>title!==item.title);titles.unshift(item.title);storageWrite(KEYS.downloads,titles.slice(0,100));renderDownloads();}
function startDownload(){if(!currentItem)return;const url=safeUrl(bestDownload(currentItem)||bestView(currentItem));if(!url)return showToast('Nội dung chưa có liên kết tải xuống');recordDownload(currentItem);const anchor=document.createElement('a');anchor.href=url;anchor.target='_blank';anchor.rel='noopener';document.body.appendChild(anchor);anchor.click();anchor.remove();showToast('Đã lưu vào lịch sử Download');}
function clearDownloads(){if(!downloadTitles().length)return;if(window.confirm('Xóa toàn bộ lịch sử Download?')){storageWrite(KEYS.downloads,[]);renderDownloads();showToast('Đã xóa lịch sử Download');}}

async function loadData(force=false,silent=false){
  if(loading)return;const url=apiUrl();if(!url){if(!resources.length)resources=FALLBACK;renderAll();return;}
  loading=true;if(force&&!silent)showToast('Đang đồng bộ dữ liệu...');let timeoutId=0;
  try{const controller=new AbortController();timeoutId=setTimeout(()=>controller.abort(),C.API_TIMEOUT||20000);const requestUrl=url+(url.includes('?')?'&':'?')+'_='+Date.now();const response=await fetch(requestUrl,{signal:controller.signal,redirect:'follow',cache:'no-store'});if(!response.ok)throw new Error('HTTP '+response.status);const payload=await response.json();const fresh=baseSort(extractRows(payload));if(!fresh.length)throw new Error('Dữ liệu trống');processFreshNotifications(fresh);resources=fresh;storageWrite(KEYS.data,resources);storageWrite(KEYS.lastSync,new Date().toISOString());$('#offlineBanner').classList.add('hidden');if(currentItem)currentItem=resources.find(item=>item.id===currentItem.id)||currentItem;renderAll();if(force&&!silent)showToast('Đã đồng bộ '+fresh.length+' nội dung');}
  catch(error){if(!resources.length){const cached=storageRead(KEYS.data,[]);resources=Array.isArray(cached)&&cached.length?baseSort(cached.map((item,index)=>normalizeItem(item,index))):FALLBACK;}$('#offlineBanner').classList.remove('hidden');renderAll();if(!silent)showToast('Không thể đồng bộ, đang dùng dữ liệu đã lưu');}
  finally{clearTimeout(timeoutId);loading=false;}
}
async function syncData(){storageRemove(KEYS.data);await loadData(true,false);}
async function submitFeedback(event){
  event.preventDefault();const button=$('#sendFeedback');const payload={action:'feedback',type:$('#feedbackType').value,title:$('#feedbackTitle').value.trim(),content:$('#feedbackContent').value.trim(),contact:$('#feedbackContact').value.trim(),appVersion:C.APP_VERSION||'150926.3',device:navigator.userAgent,androidVersion:navigator.platform||''};if(!payload.title||!payload.content)return showToast('Vui lòng nhập đầy đủ tiêu đề và nội dung');button.disabled=true;button.textContent='ĐANG GỬI...';
  try{const controller=new AbortController();const timeout=setTimeout(()=>controller.abort(),C.API_TIMEOUT||20000);const response=await fetch(apiUrl(),{method:'POST',headers:{'Content-Type':'text/plain;charset=UTF-8'},body:JSON.stringify(payload),redirect:'follow',signal:controller.signal});clearTimeout(timeout);if(!response.ok)throw new Error('HTTP '+response.status);const raw=await response.text();let result={};try{result=JSON.parse(raw);}catch(error){}if(result.success!==true)throw new Error(result.message||'Gửi góp ý thất bại');$('#feedbackTitle').value='';$('#feedbackContent').value='';$('#feedbackContact').value='';showToast('Đã gửi góp ý. Cảm ơn bạn!');showView('settings',{replace:true});}catch(error){showToast('Không thể gửi góp ý. Vui lòng thử lại.');}finally{button.disabled=false;button.innerHTML=svg('send')+'GỬI GÓP Ý';}
}
function bindEvents(){
  $('#headerLeftAction').addEventListener('click',()=>currentView==='home'?openDrawer():showView('home',{replace:true}));$('#techBack').addEventListener('click',goBack);$('#drawerScrim').addEventListener('click',closeDrawer);$('#homeSearch').addEventListener('click',()=>showView('search',{focus:true}));$('#searchInput').addEventListener('input',renderSearch);$('#clearSearch').addEventListener('click',()=>{$('#searchInput').value='';renderSearch();$('#searchInput').focus();});$('#sectionSearch').addEventListener('input',renderSection);$('#markRead').addEventListener('click',markAllNotificationsRead);$('#clearDownloads').addEventListener('click',clearDownloads);$('#refreshData').addEventListener('click',syncData);$('#feedbackForm').addEventListener('submit',submitFeedback);
  $('#techAction').addEventListener('click',()=>{if(currentView==='detail'&&currentItem)toggleSaved(currentItem.id);else if(currentView==='viewer'&&currentItem){const url=previewUrl(currentItem);if(url)window.open(url,'_blank','noopener');}});
  document.addEventListener('click',event=>{
    const favorite=event.target.closest('[data-favorite]');if(favorite){event.stopPropagation();toggleSaved(favorite.dataset.favorite);return;}
    if(event.target.closest('[data-download-current]')){startDownload();return;}if(event.target.closest('[data-view-current]')){openViewer();return;}
    const notice=event.target.closest('[data-notice]');if(notice){markNotificationRead(notice.dataset.notice);const itemId=notice.dataset.noticeItem;if(itemId)openDetail(itemId,'notifications');return;}
    const downloadRow=event.target.closest('[data-download-title]');if(downloadRow){const item=resources.find(entry=>entry.title===downloadRow.dataset.downloadTitle);if(item)openDetail(item.id,'downloads');return;}
    const brand=event.target.closest('[data-brand]');if(brand){selectedBrand=brand.dataset.brand;renderSection();return;}
    const row=event.target.closest('[data-id]');if(row){openDetail(row.dataset.id,currentView);return;}
    const section=event.target.closest('[data-section]');if(section){openSection(section.dataset.section);return;}
    const navigation=event.target.closest('[data-view]');if(navigation){showView(navigation.dataset.view,{focus:navigation.dataset.view==='search'});}
  });
  window.addEventListener('online',()=>loadData(true,true));window.addEventListener('offline',()=>$('#offlineBanner').classList.remove('hidden'));window.addEventListener('popstate',routeInitial);document.addEventListener('visibilitychange',()=>{if(document.visibilityState==='visible')loadData(false,true);});
}
async function registerServiceWorker(){if(!('serviceWorker' in navigator))return;try{const registration=await navigator.serviceWorker.register(BASE+'sw.js',{scope:BASE});registration.update();}catch(error){}}
function start(){migrateLegacy();const cached=storageRead(KEYS.data,[]);if(Array.isArray(cached)&&cached.length)resources=baseSort(cached.map((item,index)=>normalizeItem(item,index)));else resources=[];bindEvents();routeInitial();renderAll();loadData(false,true);if(!navigator.onLine)$('#offlineBanner').classList.remove('hidden');window.setInterval(()=>{if(currentView==='home'&&navigator.onLine)loadData(false,true);},60000);window.addEventListener('load',registerServiceWorker,{once:true});}
start();
})();
