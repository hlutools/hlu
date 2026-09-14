(()=>{
'use strict';
const C=window.HLU_CONFIG||{},BASE=C.BASE_PATH||'/hlu/';
const $=s=>document.querySelector(s),$$=s=>[...document.querySelectorAll(s)];
const K={data:'hlu_data_v4',saved:'hlu_saved_v4',downloads:'hlu_downloads_v4',seen:'hlu_seen_v4',notices:'hlu_notices_v4'};
const labels={news:'TIN TỨC',soft:'SOFT VNPT',docs:'DOWNLOAD TÀI LIỆU',firmware:'DOWNLOAD FIRMWARE'};
let data=[],current=null,lastView='home';
const fallback=[
{id:'welcome',section:'news',title:'Chào mừng đến với HLU TOOLS',description:'Kết nối - Chia sẻ - Hiệu quả',updatedAt:'2026-09-14',visible:true,sortOrder:1},
{id:'soft-sample',section:'soft',title:'Kho phần mềm VNPT',description:'Ứng dụng và công cụ dành cho kỹ thuật',visible:true,sortOrder:1},
{id:'docs-sample',section:'docs',title:'Kho tài liệu kỹ thuật',description:'Tài liệu hướng dẫn và kỹ thuật',visible:true,sortOrder:1},
{id:'firmware-sample',section:'firmware',title:'Kho firmware thiết bị',description:'Firmware thiết bị các hãng',visible:true,sortOrder:1}
];
const read=(k,d=[])=>{try{return JSON.parse(localStorage.getItem(k))??d}catch{return d}};
const write=(k,v)=>localStorage.setItem(k,JSON.stringify(v));
const esc=v=>String(v??'').replace(/[&<>"']/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#039;'}[m]));
const apiUrl=()=>localStorage.getItem('hlu_api_url')||C.API_URL||'';
const normalize=(x,i)=>({id:String(x.id??i),section:String(x.section||'docs').toLowerCase(),title:String(x.title||'Không có tiêu đề'),brand:x.brand||'',model:x.model||'',version:x.version||'',size:x.size||'',description:x.description||x.note||'',viewUrl:x.viewUrl||x.viewURL||'',downloadUrl:x.downloadUrl||x.downloadURL||'',fileType:x.fileType||'',visible:!(x.visible===false||String(x.visible).toLowerCase()==='false'),sortOrder:Number(x.sortOrder||0),updatedAt:x.updatedAt||'',iconUrl:x.iconUrl||'',note:x.note||''});
function toast(s){const t=$('#toast');t.textContent=s;t.classList.add('show');clearTimeout(t._t);t._t=setTimeout(()=>t.classList.remove('show'),2000)}
function icon(s){return s==='news'?'NEWS':s==='soft'?'⚙':s==='firmware'?'⬡':'▤'}
function item(x){
 const on=read(K.saved).includes(x.id);
 const sub=[x.brand,x.model,x.version,x.size].filter(Boolean).join(' • ')||x.description||labels[x.section]||'HLU TOOLS';
 return '<article class="item" data-id="'+esc(x.id)+'"><div class="item-icon">'+icon(x.section)+'</div><div><h3>'+esc(x.title)+'</h3><p>'+esc(sub)+'</p></div><button class="save" data-save="'+esc(x.id)+'">'+(on?'★':'☆')+'</button></article>'
}
function list(el,arr,msg){el.innerHTML=arr.length?arr.map(item).join(''):'<div class="empty"><span>▤</span>'+msg+'</div>'}
function renderHome(){
 const news=data.filter(x=>x.section==='news').slice(0,4);
 $('#newsPreview').innerHTML=news.length?news.map(x=>'<article class="news-card" data-id="'+esc(x.id)+'"><div class="news-thumb">'+(x.iconUrl?'<img src="'+esc(x.iconUrl)+'" alt="">':'NEWS')+'</div><div class="news-copy"><b>'+esc(x.title)+'</b><small>'+esc(x.updatedAt||x.description)+'</small></div><i>›</i></article>').join(''):'<div class="empty-news">Chưa có tin tức.</div>';
 for(const s of ['soft','docs','firmware'])$('#'+s+'Count').textContent=data.filter(x=>x.section===s).length+' mục'
}
function renderSaved(){const ids=read(K.saved);list($('#savedList'),ids.map(id=>data.find(x=>x.id===id)).filter(Boolean),'Chưa có bài đã lưu')}
function renderDownloads(){list($('#downloadList'),read(K.downloads),'Chưa có lịch sử download')}
function renderNotices(){
 const a=read(K.notices);
 list($('#notificationList'),a.map(n=>data.find(x=>x.id===n.id)||n).filter(Boolean),'Chưa có thông báo mới');
 $('#notifyBadge').textContent=a.length;$('#notifyBadge').classList.toggle('hidden',!a.length)
}
function render(){renderHome();renderSaved();renderDownloads();renderNotices();if(lastView==='search')search()}
function checkNew(fresh){
 const old=new Set(read(K.seen)),added=fresh.filter(x=>!old.has(x.id));
 if(old.size&&added.length){write(K.notices,[...added,...read(K.notices)].slice(0,50));if('Notification'in window&&Notification.permission==='granted')new Notification('HLU TOOLS có nội dung mới',{body:added[0].title,icon:BASE+'assets/logo.svg'})}
 write(K.seen,fresh.map(x=>x.id))
}
async function load(force=false){
 const cached=read(K.data);if(cached.length&&!force){data=cached;render()}
 const url=apiUrl();if(!url){if(!data.length)data=fallback;render();return}
 try{const ctl=new AbortController();setTimeout(()=>ctl.abort(),C.API_TIMEOUT||15000);const r=await fetch(url+(url.includes('?')?'&':'?')+'_='+Date.now(),{signal:ctl.signal,redirect:'follow'});if(!r.ok)throw Error(r.status);const j=await r.json(),rows=Array.isArray(j)?j:(j.data||j.items||j.result||[]);const fresh=rows.map(normalize).filter(x=>x.visible).sort((a,b)=>a.sortOrder-b.sortOrder||String(b.updatedAt).localeCompare(String(a.updatedAt)));if(!fresh.length)throw Error('empty');checkNew(fresh);data=fresh;write(K.data,data);$('#offlineBanner').classList.add('hidden');render()}catch{data=cached.length?cached:fallback;render();$('#offlineBanner').classList.remove('hidden');toast('Không thể đồng bộ, đang dùng dữ liệu đã lưu')}}
function closeMenu(){$('#drawer').classList.remove('open');$('#scrim').classList.remove('show');$('#drawer').setAttribute('aria-hidden','true')}
function show(v){
 $$('.view').forEach(x=>x.classList.remove('active'));const page=$('#'+v+'View');if(!page)return;page.classList.add('active');
 $$('.bottom-nav button').forEach(x=>x.classList.toggle('active',x.dataset.view===v));lastView=v;closeMenu();scrollTo(0,0);
 history.replaceState(null,'',BASE+(v==='home'?'':'?view='+v));
 if(v==='saved')renderSaved();if(v==='downloads')renderDownloads();if(v==='notifications')renderNotices();if(v==='search'){search();setTimeout(()=>$('#searchInput').focus(),80)}
}
function section(s){$('#listTitle').textContent=labels[s]||'Danh mục';list($('#sectionList'),data.filter(x=>x.section===s),'Chưa có nội dung');show('list')}
function search(){const q=$('#searchInput').value.trim().toLowerCase();const a=q?data.filter(x=>[x.title,x.description,x.brand,x.model,x.version,x.fileType].join(' ').toLowerCase().includes(q)):[];list($('#searchList'),a,q?'Không tìm thấy kết quả':'Nhập từ khóa để tìm kiếm')}
function toggle(id){let a=read(K.saved);a=a.includes(id)?a.filter(x=>x!==id):[id,...a];write(K.saved,a);render();if(current?.id===id)$('#saveDetail').textContent=a.includes(id)?'★':'☆';toast(a.includes(id)?'Đã lưu':'Đã bỏ lưu')}
function detail(id){current=data.find(x=>x.id===id)||read(K.downloads).find(x=>x.id===id);if(!current)return;$('#saveDetail').textContent=read(K.saved).includes(id)?'★':'☆';const meta=[current.brand,current.model,current.version,current.size,current.fileType,current.updatedAt].filter(Boolean).join(' • ');$('#detail').innerHTML='<h1>'+esc(current.title)+'</h1><p class="meta">'+esc(meta)+'</p><p>'+esc(current.description||current.note||'Nội dung đang được cập nhật.')+'</p><div class="actions">'+(current.viewUrl?'<a class="view-link" href="'+esc(current.viewUrl)+'" target="_blank" rel="noopener">Xem nội dung</a>':'')+(current.downloadUrl?'<a class="download-link" data-download="'+esc(id)+'" href="'+esc(current.downloadUrl)+'" target="_blank" rel="noopener">Tải xuống</a>':'')+'</div>';show('detail')}
function downloaded(id){const x=data.find(y=>y.id===id);if(!x)return;let a=read(K.downloads).filter(y=>y.id!==id);a.unshift({...x,downloadedAt:new Date().toISOString()});write(K.downloads,a.slice(0,100));renderDownloads();toast('Đã lưu vào lịch sử Download')}
$('#menuBtn').onclick=()=>{$('#drawer').classList.add('open');$('#scrim').classList.add('show');$('#drawer').setAttribute('aria-hidden','false')};$('#scrim').onclick=closeMenu;$('#homeSearch').onclick=()=>show('search');$('#searchInput').oninput=search;
document.addEventListener('click',e=>{const sec=e.target.closest('[data-section]');if(sec)return section(sec.dataset.section);const nav=e.target.closest('[data-view]');if(nav)return show(nav.dataset.view);const save=e.target.closest('[data-save]');if(save){e.stopPropagation();return toggle(save.dataset.save)}const dl=e.target.closest('[data-download]');if(dl)return downloaded(dl.dataset.download);const row=e.target.closest('[data-id]');if(row)detail(row.dataset.id)});
$$('.back').forEach(x=>x.onclick=()=>show('home'));$('#saveDetail').onclick=()=>current&&toggle(current.id);$('#clearDownloads').onclick=()=>{write(K.downloads,[]);renderDownloads();toast('Đã xóa lịch sử')};$('#markRead').onclick=()=>{write(K.notices,[]);renderNotices();toast('Đã đánh dấu đã đọc')};
$('#apiInput').value=apiUrl();$('#saveApi').onclick=()=>{const u=$('#apiInput').value.trim();if(u&&!/^https:\/\/script\.google\.com\/macros\/s\/.+\/exec(?:\?.*)?$/.test(u))return toast('URL Apps Script chưa đúng');u?localStorage.setItem('hlu_api_url',u):localStorage.removeItem('hlu_api_url');toast('Đã lưu URL dữ liệu');load(true)};
$('#notifyBtn').onclick=async()=>{if(!('Notification'in window))return toast('Trình duyệt không hỗ trợ thông báo');toast(await Notification.requestPermission()==='granted'?'Đã bật thông báo':'Chưa cấp quyền thông báo')};
addEventListener('online',()=>load(true));addEventListener('offline',()=>$('#offlineBanner').classList.remove('hidden'));if('serviceWorker'in navigator)addEventListener('load',()=>navigator.serviceWorker.register(BASE+'sw.js',{scope:BASE}));
const v=new URLSearchParams(location.search).get('view');show(['search','notifications','saved','downloads','settings'].includes(v)?v:'home');load();
})();