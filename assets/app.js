(()=>{
'use strict';

const C=window.HLU_CONFIG||{};
const BASE=C.BASE_PATH||'/hlu/';
const $=s=>document.querySelector(s);
const $$=s=>Array.from(document.querySelectorAll(s));
const KEYS={
  data:'hlu_tools_data_130926',
  saved:'hlu_tools_saved_130926',
  downloads:'hlu_tools_downloads_130926',
  seen:'hlu_tools_seen_130926',
  notices:'hlu_tools_notices_130926',
  lastSync:'hlu_tools_last_sync_130926'
};
const LABELS={
  news:'TIN TỨC',
  soft:'SOFT VNPT',
  docs:'DOWNLOAD TÀI LIỆU',
  firmware:'DOWNLOAD FIRMWARE'
};
const HEADER_IMAGES={
  home:'home-header.png',
  search:'search-header.png',
  notifications:'notifications-header.png',
  saved:'saved-header.png',
  downloads:'downloads-header.png'
};
const FALLBACK=[
  {id:'welcome-130926',section:'news',title:'Chào mừng đến với HLU TOOLS',description:'Kết nối - Chia sẻ - Hiệu quả',updatedAt:'2026-09-14',visible:true,sortOrder:1},
  {id:'soft-130926',section:'soft',title:'Kho phần mềm VNPT',description:'Ứng dụng và công cụ dành cho kỹ thuật',visible:true,sortOrder:1},
  {id:'docs-130926',section:'docs',title:'Kho tài liệu kỹ thuật',description:'Tài liệu hướng dẫn và kỹ thuật',visible:true,sortOrder:1},
  {id:'firmware-130926',section:'firmware',title:'Kho firmware thiết bị',description:'Firmware thiết bị các hãng',visible:true,sortOrder:1}
];

let resources=[];
let currentItem=null;
let currentView='home';
let currentSection='news';
let deferredInstallPrompt=null;
let toastTimer=0;

function storageRead(key,fallback){
  try{
    const raw=localStorage.getItem(key);
    return raw===null?fallback:JSON.parse(raw);
  }catch(error){
    return fallback;
  }
}
function storageWrite(key,value){
  try{localStorage.setItem(key,JSON.stringify(value));}catch(error){}
}
function text(value){
  return String(value===undefined||value===null?'':value);
}
function escapeHtml(value){
  return text(value).replace(/[&<>"']/g,function(char){
    return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#039;'}[char];
  });
}
function stripHtml(value){
  const node=document.createElement('div');
  node.innerHTML=text(value);
  return (node.textContent||node.innerText||'').trim();
}
function fold(value){
  return text(value).normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase();
}
function first(object,names,fallback){
  for(let i=0;i<names.length;i+=1){
    const value=object[names[i]];
    if(value!==undefined&&value!==null&&value!=='') return value;
  }
  return fallback;
}
function boolValue(value){
  if(value===undefined||value===null||value==='') return true;
  if(typeof value==='boolean') return value;
  return !['false','0','no','off','ẩn','an','không','khong','inactive'].includes(fold(value).trim());
}
function safeUrl(value){
  const raw=text(value).trim();
  if(!raw) return '';
  try{
    const parsed=new URL(raw,location.href);
    return ['http:','https:'].includes(parsed.protocol)?parsed.href:'';
  }catch(error){
    return '';
  }
}
function imageUrl(value){
  const url=safeUrl(value);
  if(!url) return '';
  try{
    const parsed=new URL(url);
    const host=parsed.hostname.toLowerCase();
    if(host==='drive.google.com'||host.endsWith('.drive.google.com')){
      let id='';
      const fileMatch=parsed.pathname.match(/\/file\/d\/([^/?#]+)/i);
      if(fileMatch) id=fileMatch[1];
      if(!id) id=parsed.searchParams.get('id')||'';
      if(id) return 'https://drive.google.com/thumbnail?id='+encodeURIComponent(id)+'&sz=w1200';
    }
  }catch(error){}
  return url;
}
function normalizeSection(value){
  const name=fold(value).replace(/[_-]+/g,' ').trim();
  if(!name) return 'docs';
  if(name.includes('tin')||name.includes('news')||name.includes('thong bao')) return 'news';
  if(name.includes('firm')||name.includes('rom')) return 'firmware';
  if(name.includes('soft')||name.includes('phan mem')||name.includes('app')) return 'soft';
  if(name.includes('doc')||name.includes('tai lieu')||name.includes('document')) return 'docs';
  return ['news','soft','docs','firmware'].includes(name)?name:'docs';
}
function normalizeItem(row,index,forcedSection){
  const source=row&&typeof row==='object'?row:{title:row};
  const title=first(source,['title','Title','name','Name','ten','Tên','tieuDe','TieuDe','tiêu đề'],'Không có tiêu đề');
  const id=first(source,['id','ID','Id','key','ma','mã'],'item-'+fold(title).replace(/[^a-z0-9]+/g,'-')+'-'+index);
  const section=normalizeSection(forcedSection||first(source,['section','Section','category','Category','type','Type','danhMuc','DanhMuc','loai','Loai','nhom','Nhom'],'docs'));
  const visibility=first(source,['visible','Visible','isVisible','published','Published','hienThi','HienThi','trangThai','status'],true);
  return {
    id:text(id),
    section:section,
    title:text(title),
    brand:text(first(source,['brand','Brand','hang','Hãng','thuongHieu','ThuongHieu'],'')),
    model:text(first(source,['model','Model','dongMay','DongMay','thietBi','ThietBi'],'')),
    version:text(first(source,['version','Version','phienBan','PhienBan'],'')),
    size:text(first(source,['size','Size','dungLuong','DungLuong'],'')),
    description:stripHtml(first(source,['description','Description','moTa','MoTa','note','Note','ghiChu','GhiChu'],'')),
    viewUrl:safeUrl(first(source,['viewUrl','viewURL','previewUrl','previewURL','url','URL','linkView','linkXem','xem'],'')),
    downloadUrl:safeUrl(first(source,['downloadUrl','downloadURL','fileUrl','fileURL','linkDownload','linkTai','tai'],'')),
    resolvedDownloadUrl:safeUrl(first(source,['resolvedDownloadUrl','directDownloadUrl','directUrl'],'')),
    iconUrl:imageUrl(first(source,['iconUrl','iconURL','imageUrl','imageURL','thumbnail','thumb','anh'],'')),
    fileType:text(first(source,['fileType','FileType','format','dinhDang','DinhDang'],'')),
    updatedAt:text(first(source,['updatedAt','updated','date','Date','ngayCapNhat','NgayCapNhat','createdAt','created'],'')),
    sortOrder:Number(first(source,['sortOrder','order','thuTu','ThuTu','stt','STT'],0))||0,
    visible:boolValue(visibility)
  };
}
function extractRows(payload){
  if(Array.isArray(payload)) return payload.map(function(row,index){return normalizeItem(row,index);});
  if(!payload||typeof payload!=='object') return [];
  const direct=first(payload,['data','items','result','rows','resources'],null);
  if(Array.isArray(direct)) return direct.map(function(row,index){return normalizeItem(row,index);});
  if(direct&&typeof direct==='object'&&direct!==payload) return extractRows(direct);
  let combined=[];
  ['news','soft','docs','firmware'].forEach(function(section){
    const candidates=[section,section.toUpperCase(),LABELS[section]];
    for(let i=0;i<candidates.length;i+=1){
      const rows=payload[candidates[i]];
      if(Array.isArray(rows)){
        combined=combined.concat(rows.map(function(row,index){return normalizeItem(row,index,section);}));
        break;
      }
    }
  });
  return combined;
}
function sortResources(rows){
  return rows.filter(function(item){return item.visible;}).sort(function(a,b){
    return a.sortOrder-b.sortOrder||text(b.updatedAt).localeCompare(text(a.updatedAt),'vi')||a.title.localeCompare(b.title,'vi');
  });
}
function apiUrl(){
  return C.API_URL||'';
}
function showToast(message){
  const toast=$('#toast');
  toast.textContent=message;
  toast.classList.add('show');
  clearTimeout(toastTimer);
  toastTimer=setTimeout(function(){toast.classList.remove('show');},2300);
}
function svg(name){
  return '<svg class="icon" aria-hidden="true"><use href="#i-'+name+'"></use></svg>';
}
function sectionIcon(section){
  if(section==='news') return 'news';
  if(section==='soft') return 'package';
  if(section==='firmware') return 'chip';
  return 'file';
}
function dateLabel(value){
  if(!value) return '';
  const raw=text(value);
  const date=new Date(raw);
  if(Number.isNaN(date.getTime())) return raw;
  return new Intl.DateTimeFormat('vi-VN',{day:'2-digit',month:'2-digit',year:'numeric'}).format(date);
}
function itemMeta(item){
  return [item.brand,item.model,item.version,item.size,item.fileType].filter(Boolean).join(' • ')||
    item.description||LABELS[item.section]||'HLU TOOLS';
}
function thumbHtml(item,className){
  const classValue=className||'resource-thumb';
  if(item.iconUrl){
    return '<div class="'+classValue+'"><img src="'+escapeHtml(item.iconUrl)+'" alt="" loading="lazy" referrerpolicy="no-referrer"></div>';
  }
  return '<div class="'+classValue+'">'+svg(sectionIcon(item.section))+'</div>';
}
function emptyHtml(icon,title,description){
  return '<div class="empty-state">'+svg(icon)+'<strong>'+escapeHtml(title)+'</strong><p>'+escapeHtml(description||'')+'</p></div>';
}
function savedIds(){
  const value=storageRead(KEYS.saved,[]);
  return Array.isArray(value)?value.map(text):[];
}
function resourceRow(item,downloadContext){
  const saved=savedIds().includes(item.id);
  const time=downloadContext&&item.downloadedAt?dateLabel(item.downloadedAt):dateLabel(item.updatedAt);
  return '<article class="resource-row" data-id="'+escapeHtml(item.id)+'"'+(downloadContext?' data-download-context="1"':'')+'>'+
    thumbHtml(item)+
    '<div class="resource-copy"><h3>'+escapeHtml(item.title)+'</h3><p>'+escapeHtml(itemMeta(item))+'</p>'+
    (time?'<time>'+escapeHtml(downloadContext?'Đã tải: '+time:time)+'</time>':'')+'</div>'+
    '<button class="save-button'+(saved?' saved':'')+'" type="button" data-save="'+escapeHtml(item.id)+'" aria-label="'+(saved?'Bỏ lưu':'Lưu bài')+'">'+svg('bookmark')+'</button>'+
    '</article>';
}
function renderList(element,items,emptyTitle,emptyDescription,downloadContext){
  element.innerHTML=items.length?items.map(function(item){return resourceRow(item,downloadContext);}).join(''):
    emptyHtml('file',emptyTitle,emptyDescription);
}
function renderHome(){
  const news=resources.filter(function(item){return item.section==='news';}).slice(0,2);
  $('#homeNews').innerHTML=news.length?news.map(function(item){
    const image=item.iconUrl?'<img src="'+escapeHtml(item.iconUrl)+'" alt="" loading="lazy" referrerpolicy="no-referrer">':'NEWS';
    return '<article class="home-news-row" data-id="'+escapeHtml(item.id)+'"><div class="home-news-thumb">'+image+'</div>'+
      '<div class="home-news-copy"><strong>'+escapeHtml(item.title)+'</strong><small>'+escapeHtml(dateLabel(item.updatedAt)||item.description||'HLU TOOLS')+'</small></div>'+
      svg('chevron-right')+'</article>';
  }).join(''):emptyHtml('news','Chưa có tin tức','Kéo xuống hoặc đồng bộ lại dữ liệu.');
}
function renderSaved(){
  const ids=savedIds();
  const items=ids.map(function(id){
    return resources.find(function(item){return item.id===id;});
  }).filter(Boolean);
  $('#savedSummary').textContent=items.length+' nội dung đã lưu';
  renderList($('#savedList'),items,'Chưa có bài đã lưu','Nhấn biểu tượng đánh dấu ở một nội dung để lưu lại.');
}
function downloadItems(){
  const value=storageRead(KEYS.downloads,[]);
  return Array.isArray(value)?value:[];
}
function renderDownloads(){
  const items=downloadItems();
  $('#downloadSummary').textContent=items.length+' lượt tải gần đây';
  renderList($('#downloadList'),items,'Chưa có lịch sử download','Các nội dung đã tải sẽ xuất hiện tại đây.',true);
  $('#clearDownloads').classList.toggle('hidden',!items.length);
}
function noticeItems(){
  const value=storageRead(KEYS.notices,[]);
  return Array.isArray(value)?value:[];
}
function unreadCount(){
  return noticeItems().filter(function(notice){return notice.unread!==false;}).length;
}
function updateBadges(){
  const count=unreadCount();
  ['#notificationBadge','#drawerBadge'].forEach(function(selector){
    const badge=$(selector);
    badge.textContent=count>99?'99+':count;
    badge.classList.toggle('hidden',count===0);
  });
}
function renderNotifications(){
  const notices=noticeItems();
  $('#notificationSummary').textContent=notices.length?notices.length+' thông báo':'Thông báo nội dung mới';
  $('#markRead').classList.toggle('hidden',unreadCount()===0);
  $('#notificationList').innerHTML=notices.length?notices.map(function(notice){
    const item=resources.find(function(entry){return entry.id===notice.id;})||notice.item||notice;
    return '<article class="notification-card'+(notice.unread===false?'':' unread')+'" data-notice="'+escapeHtml(notice.id)+'" data-id="'+escapeHtml(item.id)+'">'+
      '<span class="notice-icon">'+svg('bell')+'</span>'+
      '<h3>'+escapeHtml(item.title||'Nội dung mới')+'</h3><p>'+escapeHtml(itemMeta(item))+'</p>'+
      '<time>'+escapeHtml(dateLabel(notice.createdAt||item.updatedAt)||'Mới cập nhật')+'</time>'+
      (notice.unread===false?'':'<i class="unread-dot"></i>')+'</article>';
  }).join(''):emptyHtml('bell','Chưa có thông báo','Nội dung mới từ Google Apps Script sẽ được hiển thị tại đây.');
  updateBadges();
}
function searchResources(query,section,brand){
  const q=fold(query).trim();
  return resources.filter(function(item){
    if(section&&item.section!==section) return false;
    if(brand&&fold(item.brand)!==fold(brand)) return false;
    if(!q) return true;
    return fold([item.title,item.description,item.brand,item.model,item.version,item.fileType,item.section].join(' ')).includes(q);
  });
}
function renderSearch(){
  const query=$('#searchInput').value.trim();
  const results=query?searchResources(query):[];
  $('#clearSearch').classList.toggle('hidden',!query);
  $('#searchSummary').textContent=query?(results.length+' kết quả cho “'+query+'”'):'Nhập từ khóa để tìm kiếm';
  renderList($('#searchList'),results,query?'Không tìm thấy kết quả':'Tìm kiếm HLU TOOLS',query?'Thử một từ khóa khác.':'Tìm phần mềm, tài liệu, firmware và tin tức.');
}
function populateBrands(section){
  const select=$('#brandFilter');
  const selected=select.value;
  const brands=Array.from(new Set(resources.filter(function(item){return item.section===section&&item.brand;}).map(function(item){return item.brand;}))).sort(function(a,b){return a.localeCompare(b,'vi');});
  select.innerHTML='<option value="">Tất cả hãng</option>'+brands.map(function(brand){return '<option value="'+escapeHtml(brand)+'">'+escapeHtml(brand)+'</option>';}).join('');
  if(brands.includes(selected)) select.value=selected;
}
function renderSection(){
  populateBrands(currentSection);
  const results=searchResources($('#sectionSearch').value,currentSection,$('#brandFilter').value);
  $('#sectionSummary').textContent=results.length+' mục trong '+(LABELS[currentSection]||'danh mục');
  renderList($('#sectionList'),results,'Chưa có nội dung','Dữ liệu danh mục đang được cập nhật.');
}
function renderAll(){
  renderHome();
  renderSaved();
  renderDownloads();
  renderNotifications();
  if(currentView==='search') renderSearch();
  if(currentView==='section') renderSection();
}
function checkForNewItems(fresh){
  const seenRaw=storageRead(KEYS.seen,[]);
  const seen=Array.isArray(seenRaw)?seenRaw.map(text):[];
  if(seen.length){
    const known=new Set(seen);
    const added=fresh.filter(function(item){return !known.has(item.id);});
    if(added.length){
      const old=noticeItems();
      const byId=new Map();
      added.forEach(function(item){
        byId.set(item.id,{id:item.id,item:item,createdAt:new Date().toISOString(),unread:true});
      });
      old.forEach(function(notice){if(!byId.has(notice.id)) byId.set(notice.id,notice);});
      storageWrite(KEYS.notices,Array.from(byId.values()).slice(0,80));
      if('Notification' in window&&Notification.permission==='granted'){
        try{
          new Notification('HLU TOOLS có '+added.length+' nội dung mới',{
            body:added[0].title,
            icon:BASE+'assets/icons/icon-192.png',
            tag:'hlu-tools-update'
          });
        }catch(error){}
      }
    }
  }
  storageWrite(KEYS.seen,fresh.map(function(item){return item.id;}));
}
function syncStatus(){
  const last=storageRead(KEYS.lastSync,'');
  $('#syncStatus').textContent=last?'Đồng bộ: '+dateLabel(last):'Google Apps Script';
}
async function loadData(force){
  const cached=storageRead(KEYS.data,[]);
  if(Array.isArray(cached)&&cached.length&&!force){
    resources=sortResources(cached.map(function(item,index){return normalizeItem(item,index);}));
    renderAll();
  }
  const url=apiUrl();
  if(!url){
    if(!resources.length) resources=FALLBACK;
    renderAll();
    return;
  }
  if(force) showToast('Đang đồng bộ dữ liệu...');
  let timeoutId=0;
  try{
    const controller=new AbortController();
    timeoutId=setTimeout(function(){controller.abort();},C.API_TIMEOUT||20000);
    const requestUrl=url+(url.includes('?')?'&':'?')+'_='+Date.now();
    const response=await fetch(requestUrl,{signal:controller.signal,redirect:'follow',cache:'no-store'});
    if(!response.ok) throw new Error('HTTP '+response.status);
    const payload=await response.json();
    const fresh=sortResources(extractRows(payload));
    if(!fresh.length) throw new Error('Dữ liệu trống');
    checkForNewItems(fresh);
    resources=fresh;
    storageWrite(KEYS.data,resources);
    storageWrite(KEYS.lastSync,new Date().toISOString());
    $('#offlineBanner').classList.add('hidden');
    syncStatus();
    renderAll();
    if(force) showToast('Đã đồng bộ '+fresh.length+' nội dung');
  }catch(error){
    if(!resources.length) resources=Array.isArray(cached)&&cached.length?cached:FALLBACK;
    $('#offlineBanner').classList.remove('hidden');
    renderAll();
    showToast('Không thể đồng bộ, đang dùng dữ liệu đã lưu');
  }finally{
    clearTimeout(timeoutId);
  }
}
function openDrawer(){
  $('#drawer').classList.add('open');
  $('#drawerScrim').classList.remove('hidden');
  $('#drawer').setAttribute('aria-hidden','false');
}
function closeDrawer(){
  $('#drawer').classList.remove('open');
  $('#drawerScrim').classList.add('hidden');
  $('#drawer').setAttribute('aria-hidden','true');
}
function setHeader(view){
  const useImage=Object.prototype.hasOwnProperty.call(HEADER_IMAGES,view);
  $('#imageHeader').classList.toggle('hidden',!useImage);
  $('#techHeader').classList.toggle('hidden',useImage);
  if(useImage){
    $('#headerImage').src=BASE+'assets/android-v130926/'+HEADER_IMAGES[view];
    $('#headerLeftAction').setAttribute('aria-label',view==='home'?'Mở menu':'Quay lại');
  }else{
    $('#techTitle').textContent=view==='settings'?'CÀI ĐẶT':(LABELS[currentSection]||'HLU TOOLS');
    $('#techAction').classList.toggle('invisible',view!=='section');
  }
}
function setUrl(view){
  let query='';
  if(view!=='home'){
    query='?view='+encodeURIComponent(view);
    if(view==='section') query+='&section='+encodeURIComponent(currentSection);
  }
  history.replaceState({view:view,section:currentSection},'',BASE+query);
}
function showView(view,options){
  const valid=['home','search','notifications','saved','downloads','section','settings'];
  if(!valid.includes(view)) view='home';
  currentView=view;
  $$('.view').forEach(function(element){element.classList.remove('active');});
  const target=$('#'+view+'View');
  if(target) target.classList.add('active');
  $$('.bottom-nav button').forEach(function(button){
    const homeForSection=view==='section'&&button.dataset.view==='home';
    button.classList.toggle('active',button.dataset.view===view||homeForSection);
  });
  $$('.drawer-menu button').forEach(function(button){
    button.classList.toggle('active',button.dataset.view===view||(view==='section'&&button.dataset.section===currentSection));
  });
  closeDrawer();
  closeSheets();
  setHeader(view);
  if(!options||!options.keepUrl) setUrl(view);
  window.scrollTo(0,0);
  if(view==='saved') renderSaved();
  if(view==='downloads') renderDownloads();
  if(view==='notifications') renderNotifications();
  if(view==='search'){
    renderSearch();
    if(options&&options.focus) setTimeout(function(){$('#searchInput').focus();},120);
  }
  if(view==='section') renderSection();
  if(view==='settings') syncStatus();
}
function openSection(section){
  currentSection=normalizeSection(section);
  $('#sectionSearch').value='';
  $('#brandFilter').value='';
  showView('section');
}
function toggleSaved(id){
  let ids=savedIds();
  const wasSaved=ids.includes(id);
  ids=wasSaved?ids.filter(function(value){return value!==id;}):[id].concat(ids);
  storageWrite(KEYS.saved,ids);
  renderAll();
  if(currentItem&&currentItem.id===id) updateDetailSaveButton();
  showToast(wasSaved?'Đã bỏ lưu':'Đã lưu nội dung');
}
function previewUrl(item){
  let url=safeUrl(item.viewUrl||item.downloadUrl);
  if(!url) return '';
  let match=url.match(/drive\.google\.com\/file\/d\/([^/?#]+)/i);
  if(match) return 'https://drive.google.com/file/d/'+match[1]+'/preview';
  try{
    const parsed=new URL(url);
    if(parsed.hostname==='drive.google.com'){
      const id=parsed.searchParams.get('id');
      if(id) return 'https://drive.google.com/file/d/'+encodeURIComponent(id)+'/preview';
    }
  }catch(error){}
  return url;
}
function directDownloadUrl(item){
  const explicit=safeUrl(item.resolvedDownloadUrl||item.downloadUrl);
  if(explicit) return explicit;
  return safeUrl(item.viewUrl);
}
function updateDetailSaveButton(){
  const button=$('#detailContent [data-detail-save]');
  if(!button||!currentItem) return;
  const saved=savedIds().includes(currentItem.id);
  button.classList.toggle('saved',saved);
  button.innerHTML=svg('bookmark')+(saved?'Đã lưu':'Lưu bài');
}
function showModalScrim(){
  $('#modalScrim').classList.remove('hidden');
}
function updateModalScrim(){
  const visible=!$('#detailSheet').classList.contains('hidden')||!$('#installSheet').classList.contains('hidden');
  $('#modalScrim').classList.toggle('hidden',!visible);
}
function closeSheet(id){
  const sheet=$('#'+id);
  if(sheet) sheet.classList.add('hidden');
  if(id==='viewerSheet') $('#contentViewer').src='about:blank';
  updateModalScrim();
}
function closeSheets(){
  ['detailSheet','viewerSheet','installSheet'].forEach(function(id){
    $('#'+id).classList.add('hidden');
  });
  $('#contentViewer').src='about:blank';
  $('#modalScrim').classList.add('hidden');
}
function openDetail(id){
  currentItem=resources.find(function(item){return item.id===id;})||
    downloadItems().find(function(item){return item.id===id;});
  if(!currentItem) return;
  const meta=[currentItem.brand,currentItem.model,currentItem.version,currentItem.size,currentItem.fileType,dateLabel(currentItem.updatedAt)].filter(Boolean).join(' • ');
  const canView=Boolean(previewUrl(currentItem));
  const canDownload=Boolean(directDownloadUrl(currentItem));
  $('#detailTitle').textContent=LABELS[currentItem.section]||'Chi tiết';
  $('#detailContent').innerHTML=
    '<div class="detail-heading">'+thumbHtml(currentItem)+'<div><h3>'+escapeHtml(currentItem.title)+'</h3><p>'+escapeHtml(meta||LABELS[currentItem.section]||'HLU TOOLS')+'</p></div></div>'+
    '<div class="detail-description">'+escapeHtml(currentItem.description||'Nội dung đang được cập nhật.')+'</div>'+
    '<div class="detail-actions">'+
      (canView?'<button type="button" class="secondary" data-view-item>'+svg('external')+'Xem nội dung</button>':'<button type="button" class="secondary" disabled>'+svg('external')+'Chưa có link xem</button>')+
      (canDownload?'<button type="button" class="primary" data-download-item>'+svg('download')+'Tải xuống</button>':'<button type="button" class="primary" disabled>'+svg('download')+'Chưa có link tải</button>')+
    '</div>'+
    '<div class="detail-extra-actions"><button type="button" data-detail-save>'+svg('bookmark')+'Lưu bài</button><button type="button" data-share-item>'+svg('share')+'Chia sẻ</button></div>';
  updateDetailSaveButton();
  $('#detailSheet').classList.remove('hidden');
  showModalScrim();
}
function markDownloaded(item){
  let items=downloadItems().filter(function(entry){return entry.id!==item.id;});
  items.unshift(Object.assign({},item,{downloadedAt:new Date().toISOString()}));
  storageWrite(KEYS.downloads,items.slice(0,100));
  renderDownloads();
}
function startDownload(){
  if(!currentItem) return;
  const url=directDownloadUrl(currentItem);
  if(!url) return showToast('Nội dung chưa có liên kết tải xuống');
  markDownloaded(currentItem);
  const anchor=document.createElement('a');
  anchor.href=url;
  anchor.target='_blank';
  anchor.rel='noopener';
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  showToast('Đã lưu vào lịch sử Download');
}
function openViewer(){
  if(!currentItem) return;
  const url=previewUrl(currentItem);
  if(!url) return showToast('Nội dung chưa có liên kết xem');
  $('#viewerTitle').textContent=currentItem.title;
  $('#viewerExternal').href=url;
  $('#contentViewer').src=url;
  $('#viewerSheet').classList.remove('hidden');
}
async function shareCurrent(){
  if(!currentItem) return;
  const url=safeUrl(currentItem.viewUrl||currentItem.downloadUrl)||location.href;
  const payload={title:currentItem.title,text:currentItem.description||'Nội dung từ HLU TOOLS',url:url};
  try{
    if(navigator.share) await navigator.share(payload);
    else{
      await navigator.clipboard.writeText(url);
      showToast('Đã sao chép liên kết');
    }
  }catch(error){
    if(error&&error.name!=='AbortError') showToast('Không thể chia sẻ liên kết');
  }
}
function markNoticeRead(id){
  const notices=noticeItems().map(function(notice){
    return notice.id===id?Object.assign({},notice,{unread:false}):notice;
  });
  storageWrite(KEYS.notices,notices);
  renderNotifications();
}
function markAllRead(){
  storageWrite(KEYS.notices,noticeItems().map(function(notice){return Object.assign({},notice,{unread:false});}));
  renderNotifications();
  showToast('Đã đánh dấu tất cả là đã đọc');
}
function clearDownloadHistory(){
  if(!downloadItems().length) return;
  if(window.confirm('Xóa toàn bộ lịch sử download?')){
    storageWrite(KEYS.downloads,[]);
    renderDownloads();
    showToast('Đã xóa lịch sử download');
  }
}
function installInstructions(){
  const standalone=window.matchMedia('(display-mode: standalone)').matches||window.navigator.standalone===true;
  const ios=/iphone|ipad|ipod/i.test(navigator.userAgent);
  let body='<img class="install-logo" src="'+BASE+'assets/icons/icon-192.png" alt="HLU TOOLS"><h3>HLU TOOLS</h3>';
  if(standalone){
    body+='<p>Ứng dụng đã được cài trên thiết bị này.</p>';
  }else if(deferredInstallPrompt){
    body+='<p>Cài Web App để mở nhanh và sử dụng dữ liệu đã lưu khi ngoại tuyến.</p><button id="nativeInstall" class="install-native-button" type="button">Cài ứng dụng</button>';
  }else if(ios){
    body+='<p>Trên Safari của iPhone hoặc iPad:</p><ol class="install-steps"><li>Chạm nút Chia sẻ ở thanh công cụ Safari.</li><li>Chọn “Thêm vào Màn hình chính”.</li><li>Chạm “Thêm” để hoàn tất.</li></ol>';
  }else{
    body+='<p>Mở menu trình duyệt rồi chọn “Cài đặt ứng dụng” hoặc “Thêm vào màn hình chính”.</p>';
  }
  $('#installInstructions').innerHTML=body;
}
function showInstall(){
  installInstructions();
  $('#installSheet').classList.remove('hidden');
  showModalScrim();
}
async function requestNotifications(){
  if(!('Notification' in window)){
    showToast('Trình duyệt không hỗ trợ thông báo');
    return;
  }
  try{
    const permission=await Notification.requestPermission();
    updateNotificationPermission();
    showToast(permission==='granted'?'Đã bật quyền thông báo':'Chưa cấp quyền thông báo');
  }catch(error){
    showToast('Không thể yêu cầu quyền thông báo');
  }
}
function updateNotificationPermission(){
  const label=$('#notificationPermission');
  if(!('Notification' in window)) label.textContent='Trình duyệt không hỗ trợ';
  else if(Notification.permission==='granted') label.textContent='Đã bật';
  else if(Notification.permission==='denied') label.textContent='Đã từ chối';
  else label.textContent='Chưa cấp quyền';
}
function routeInitial(){
  const query=new URLSearchParams(location.search);
  const view=query.get('view')||'home';
  if(view==='section') currentSection=normalizeSection(query.get('section')||'news');
  showView(view,{keepUrl:true});
}
function bindEvents(){
  $('#headerLeftAction').addEventListener('click',function(){
    if(currentView==='home') openDrawer();
    else showView('home');
  });
  $('#techBack').addEventListener('click',function(){showView('home');});
  $('#techAction').addEventListener('click',function(){loadData(true);});
  $('#drawerScrim').addEventListener('click',closeDrawer);
  $('#modalScrim').addEventListener('click',closeSheets);
  $('#homeSearch').addEventListener('click',function(){showView('search',{focus:true});});
  $('#searchInput').addEventListener('input',renderSearch);
  $('#clearSearch').addEventListener('click',function(){
    $('#searchInput').value='';
    renderSearch();
    $('#searchInput').focus();
  });
  $('#sectionSearch').addEventListener('input',renderSection);
  $('#brandFilter').addEventListener('change',renderSection);
  $('#markRead').addEventListener('click',markAllRead);
  $('#clearDownloads').addEventListener('click',clearDownloadHistory);
  $('#installApp').addEventListener('click',showInstall);
  $('#refreshData').addEventListener('click',function(){loadData(true);});
  $('#enableNotifications').addEventListener('click',requestNotifications);
  document.addEventListener('click',function(event){
    const close=event.target.closest('[data-close-sheet]');
    if(close){closeSheet(close.dataset.closeSheet);return;}
    const nativeInstall=event.target.closest('#nativeInstall');
    if(nativeInstall&&deferredInstallPrompt){
      deferredInstallPrompt.prompt();
      deferredInstallPrompt.userChoice.finally(function(){deferredInstallPrompt=null;closeSheet('installSheet');});
      return;
    }
    const save=event.target.closest('[data-save]');
    if(save){event.stopPropagation();toggleSaved(save.dataset.save);return;}
    const detailSave=event.target.closest('[data-detail-save]');
    if(detailSave&&currentItem){toggleSaved(currentItem.id);return;}
    if(event.target.closest('[data-view-item]')){openViewer();return;}
    if(event.target.closest('[data-download-item]')){startDownload();return;}
    if(event.target.closest('[data-share-item]')){shareCurrent();return;}
    const notice=event.target.closest('[data-notice]');
    if(notice) markNoticeRead(notice.dataset.notice);
    const row=event.target.closest('[data-id]');
    if(row){openDetail(row.dataset.id);return;}
    const section=event.target.closest('[data-section]');
    if(section){openSection(section.dataset.section);return;}
    const navigation=event.target.closest('[data-view]');
    if(navigation){showView(navigation.dataset.view,{focus:navigation.dataset.view==='search'});}
  });
  window.addEventListener('beforeinstallprompt',function(event){
    event.preventDefault();
    deferredInstallPrompt=event;
  });
  window.addEventListener('appinstalled',function(){
    deferredInstallPrompt=null;
    showToast('Đã cài HLU TOOLS');
  });
  window.addEventListener('online',function(){loadData(true);});
  window.addEventListener('offline',function(){$('#offlineBanner').classList.remove('hidden');});
  window.addEventListener('popstate',routeInitial);
  document.addEventListener('keydown',function(event){
    if(event.key==='Escape'){
      closeSheets();
      closeDrawer();
    }
  });
}
async function registerServiceWorker(){
  if(!('serviceWorker' in navigator)) return;
  try{
    const registration=await navigator.serviceWorker.register(BASE+'sw.js',{scope:BASE});
    registration.update();
  }catch(error){}
}
function start(){
  bindEvents();
  updateNotificationPermission();
  syncStatus();
  routeInitial();
  loadData(false);
  if(!navigator.onLine) $('#offlineBanner').classList.remove('hidden');
  window.addEventListener('load',registerServiceWorker,{once:true});
}

start();
})();