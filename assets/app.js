(() => {
'use strict';
const C=window.HLU_CONFIG||{}, BASE=C.BASE_PATH||'/hlu/';
const $=s=>document.querySelector(s), $$=s=>[...document.querySelectorAll(s)];
const KEYS={data:'hlu_data_v4',saved:'hlu_saved_v4',downloads:'hlu_downloads_v4',seen:'hlu_seen_v4'};
let data=[], current=null, currentView='home';
const labels={news:'TIN TỨC',soft:'SOFT VNPT',docs:'TÀI LIỆU',firmware:'FIRMWARE'};
const sample=[
{id:'welcome',section:'news',title:'Chào mừng đến với HLU TOOLS',description:'Kết nối, chia sẻ và khai thác kho dữ liệu kỹ thuật tập trung.',updatedAt:'2026-09-14',visible:true,sortOrder:1},
{id:'soft-guide',section:'soft',title:'Kho phần mềm VNPT',description:'Các phần mềm và công cụ phục vụ công tác kỹ thuật.',updatedAt:'2026-09-13',visible:true,sortOrder:1},
{id:'docs-guide',section:'docs',title:'Kho tài liệu kỹ thuật',description:'Tài liệu hướng dẫn được cập nhật tập trung.',updatedAt:'2026-09-13',visible:true,sortOrder:1},
{id:'firmware-guide',section:'firmware',title:'Kho firmware thiết bị',description:'Tìm firmware theo hãng, model và phiên bản.',updatedAt:'2026-09-13',visible:true,sortOrder:1}
];
const read=(k,fallback=[])=>{try{return JSON.parse(localStorage.getItem(k))??fallback}catch{return fallback}};
const write=(k,v)=>localStorage.setItem(k,JSON.stringify(v));
const norm=(x,i)=>({id:String(x.id??i),section:String(x.section||'docs').toLowerCase(),title:String(x.title||'Không có tiêu đề'),brand:x.brand||'',model:x.model||'',version:x.version||'',size:x.size||'',description:x.description||x.note||'',viewUrl:x.viewUrl||x.viewURL||'',downloadUrl:x.downloadUrl||x.downloadURL||'',fileType:x.fileType||'',visible:!(x.visible===false||String(x.visible).toLowerCase()==='false'),sortOrder:Number(x.sortOrder||0),updatedAt:x.updatedAt||'',iconUrl:x.iconUrl||''});
function apiUrl(){return localStorage.getItem('hlu_api_url')||C.API_URL||''}
async function loadData(force=false){
 const cached=read(KEYS.data,[]);
 if(cached.length&&!force){data=cached;renderAll()}
 const url=apiUrl();
 if(!url){if(!data.length){data=sample;renderAll()} return}
 try{
   const ctrl=new AbortController(); setTimeout(()=>ctrl.abort(),C.API_TIMEOUT||15000);
   const res=await fetch(url+(url.includes('?')?'&':'?')+'_='+Date.now(),{signal:ctrl.signal,redirect:'follow'});
   if(!res.ok)throw Error('HTTP '+res.status);
   const json=await res.json(), rows=Array.isArray(json)?json:(json.data||json.items||json.result||[]);
   const fresh=rows.map(norm).filter(x=>x.visible).sort((a,b)=>a.sortOrder-b.sortOrder||String(b.updatedAt).localeCompare(String(a.updatedAt)));
   if(!fresh.length)throw Error('API không có dữ liệu');
   checkUpdates(fresh); data=fresh; write(KEYS.data,data); renderAll(); $('#offlineBanner').classList.add('hidden');
 }catch(e){data=cached.length?cached:sample; renderAll(); $('#offlineBanner').classList.remove('hidden'); toast('Không thể đồng bộ, đang dùng dữ liệu đã lưu')}
}
function checkUpdates(fresh){
 const oldIds=new Set(read(KEYS.seen,[])), added=fresh.filter(x=>!oldIds.has(x.id));
 if(oldIds.size&&added.length&&Notification.permission==='granted') new Notification('HLU TOOLS có nội dung mới',{body:added[0].title+(added.length>1?' và '+(added.length-1)+' nội dung khác':''),icon:BASE+'assets/logo.svg'});
 write(KEYS.seen,fresh.map(x=>x.id));
}
function icon(section){return section==='news'?'NEWS':section==='soft'?'⚙':section==='firmware'?'⬡':'▤'}
function itemHtml(x){
 const saved=read(KEYS.saved,[]).includes(x.id);
 return '<div class="item" data-id="'+esc(x.id)+'"><div class="item-icon">'+icon(x.section)+'</div><div><h3>'+esc(x.title)+'</h3><p>'+esc([x.brand,x.model,x.version,x.size].filter(Boolean).join(' • ')||x.description||labels[x.section]||'HLU TOOLS')+'</p></div><button class="save" data-save="'+esc(x.id)+'" aria-label="Lưu">'+(saved?'★':'☆')+'</button></div>'
}
function esc(v){return String(v??'').replace(/[&<>"']/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#039;'}[m]))}
function renderList(el,arr,msg='Chưa có nội dung'){el.innerHTML=arr.length?arr.map(itemHtml).join(''):'<div class="empty"><span>▤</span>'+msg+'</div>'}
function renderAll(){
 const news=data.filter(x=>x.section==='news').slice(0,6);
 $('#newsPreview').innerHTML=news.length?news.map(x=>'<article class="news-card" data-id="'+esc(x.id)+'"><span class="badge">NEWS</span><div><h3>'+esc(x.title)+'</h3><p>'+esc(x.description||x.updatedAt)+'</p></div></article>').join(''):'<div class="empty">Chưa có tin tức</div>';
 renderList($('#latestList'),[...data].sort((a,b)=>String(b.updatedAt).localeCompare(String(a.updatedAt))).slice(0,8));
 if(currentView==='search') search();
 if(currentView==='saved') renderSaved();
 if(currentView==='downloads') renderDownloads();
}
function openSection(section){$('#listTitle').textContent=labels[section]||'Danh mục';renderList($('#sectionList'),data.filter(x=>x.section===section));show('list')}
function show(view){
 $$('.view').forEach(x=>x.classList.remove('active')); $('#'+view+'View').classList.add('active');
 $$('.bottom-nav button').forEach(x=>x.classList.toggle('active',x.dataset.view===view));
 currentView=view; closeDrawer(); window.scrollTo(0,0); history.replaceState(null,'',BASE+(view==='home'?'':'?view='+view));
 if(view==='saved')renderSaved(); if(view==='downloads')renderDownloads(); if(view==='search'){$('#searchInput').focus();search()}
}
function details(id){
 current=data.find(x=>x.id===id)||read(KEYS.downloads,[]).find(x=>x.id===id); if(!current)return;
 const saved=read(KEYS.saved,[]).includes(current.id); $('#saveDetail').textContent=saved?'★':'☆';
 const meta=[current.brand,current.model,current.version,current.size,current.fileType,current.updatedAt].filter(Boolean).join(' • ');
 $('#detail').innerHTML='<h1>'+esc(current.title)+'</h1><p class="meta">'+esc(meta)+'</p><p>'+esc(current.description||current.note||'Nội dung đang được cập nhật.')+'</p><div class="actions">'+(current.viewUrl?'<a class="view-link" href="'+esc(current.viewUrl)+'" target="_blank" rel="noopener">Xem nội dung</a>':'')+(current.downloadUrl?'<a class="download-link" data-download="'+esc(current.id)+'" href="'+esc(current.downloadUrl)+'" target="_blank" rel="noopener">Tải xuống</a>':'')+'</div>';
 show('detail')
}
function toggleSave(id){
 let a=read(KEYS.saved,[]); a=a.includes(id)?a.filter(x=>x!==id):[id,...a];write(KEYS.saved,a);renderAll();if(current?.id===id)$('#saveDetail').textContent=a.includes(id)?'★':'☆';toast(a.includes(id)?'Đã lưu bài':'Đã bỏ lưu')
}
function renderSaved(){const ids=read(KEYS.saved,[]);renderList($('#savedList'),ids.map(id=>data.find(x=>x.id===id)).filter(Boolean),'Chưa có bài đã lưu')}
function trackDownload(id){const x=data.find(y=>y.id===id);if(!x)return;let a=read(KEYS.downloads,[]).filter(y=>y.id!==id);a.unshift({...x,downloadedAt:new Date().toISOString()});write(KEYS.downloads,a.slice(0,100));toast('Đã thêm vào lịch sử Download')}
function renderDownloads(){renderList($('#downloadList'),read(KEYS.downloads,[]),'Chưa có lịch sử download')}
function search(){const q=$('#searchInput').value.trim().toLowerCase();const a=q?data.filter(x=>[x.title,x.description,x.brand,x.model,x.version,x.fileType].join(' ').toLowerCase().includes(q)):[];renderList($('#searchList'),a,q?'Không tìm thấy kết quả':'Nhập từ khóa để tìm kiếm')}
function toast(s){const t=$('#toast');t.textContent=s;t.classList.add('show');clearTimeout(t._x);t._x=setTimeout(()=>t.classList.remove('show'),2200)}
function closeDrawer(){$('#drawer').classList.remove('open');$('#scrim').classList.remove('show');$('#drawer').setAttribute('aria-hidden','true')}
$('#menuBtn').onclick=()=>{$('#drawer').classList.add('open');$('#scrim').classList.add('show');$('#drawer').setAttribute('aria-hidden','false')};
$('#scrim').onclick=closeDrawer; $('#refreshBtn').onclick=()=>loadData(true);
document.addEventListener('click',e=>{
 const sec=e.target.closest('[data-section]');if(sec){openSection(sec.dataset.section);return}
 const nav=e.target.closest('[data-view]');if(nav){show(nav.dataset.view);return}
 const save=e.target.closest('[data-save]');if(save){e.stopPropagation();toggleSave(save.dataset.save);return}
 const dl=e.target.closest('[data-download]');if(dl){trackDownload(dl.dataset.download);return}
 const row=e.target.closest('[data-id]');if(row)details(row.dataset.id)
});
$$('.back').forEach(b=>b.onclick=()=>show('home'));$('#searchInput').oninput=search;
$('#saveDetail').onclick=()=>current&&toggleSave(current.id);
$('#clearDownloads').onclick=()=>{write(KEYS.downloads,[]);renderDownloads();toast('Đã xóa lịch sử')};
$('#apiInput').value=apiUrl();
$('#saveApi').onclick=()=>{const u=$('#apiInput').value.trim();if(u&&!/^https:\/\/script\.google\.com\/macros\/s\/.+\/exec(?:\?.*)?$/.test(u))return toast('URL Apps Script chưa đúng');if(u)localStorage.setItem('hlu_api_url',u);else localStorage.removeItem('hlu_api_url');toast('Đã lưu URL dữ liệu');loadData(true)};
$('#notifyBtn').onclick=async()=>{if(!('Notification'in window))return toast('Trình duyệt không hỗ trợ thông báo');const p=await Notification.requestPermission();toast(p==='granted'?'Đã bật thông báo':'Chưa cấp quyền thông báo')};
window.addEventListener('online',()=>loadData(true));window.addEventListener('offline',()=>$('#offlineBanner').classList.remove('hidden'));
if('serviceWorker'in navigator)window.addEventListener('load',()=>navigator.serviceWorker.register(BASE+'sw.js',{scope:BASE}));
const initial=new URLSearchParams(location.search).get('view');show(['search','saved','downloads','settings'].includes(initial)?initial:'home');loadData();
})();