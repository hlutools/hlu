import fs from 'node:fs';

const must=[
  'assets/icons.js','assets/presentation.js','assets/parity.css','assets/icons/MATERIAL_LICENSE.txt',
  'index.html','404.html','.nojekyll','manifest.webmanifest','sw.js','assets/app.css','assets/app.js','assets/config.js','assets/exam.js',
  'assets/icons/icon-192.png','assets/icons/icon-512.png','assets/icons/apple-touch-icon.png',
  'assets/android-v280926/drawer_header_mockup_210926.webp',
  'assets/android-v280926/header_260926_home.webp','assets/android-v280926/header_260926_tim_kiem.webp','assets/android-v280926/header_260926_da_luu.webp','assets/android-v280926/header_260926_download.webp',
  'assets/android-v280926/header_260926_thong_bao.webp','assets/android-v280926/header_260926_tai_nguyen.webp','assets/android-v280926/header_260926_cai_dat.webp','assets/android-v280926/header_260926_gioi_thieu.webp',
  'assets/android-v280926/header_260926_tin_tuc.webp','assets/android-v280926/header_260926_soft.webp','assets/android-v280926/header_260926_tai_lieu.webp','assets/android-v280926/header_260926_firmware.webp','assets/android-v280926/header_260926_e_learning.webp',
  'assets/android-v280926/home_card_soft_bg_210926.webp','assets/android-v280926/home_card_docs_bg_210926.webp','assets/android-v280926/home_card_firmware_bg_210926.webp','assets/android-v280926/home_card_learning_bg_210926.webp',
  'assets/android-v280926/resources_hero_270926_1.webp','assets/android-v280926/ic_zalo.png','assets/data/exam_bank.json','assets/data/news_fallback.json','assets/data/release_history.json','BACKUP_ROLLBACK.md'
];
for(const f of must) if(!fs.existsSync(f)) throw new Error('Thiếu file: '+f);

const forbiddenFiles=['assets/toolkit.js','assets/data/oui_vendors.csv'];
for(const f of forbiddenFiles) if(fs.existsSync(f)) throw new Error('Toolkit Web vẫn còn file: '+f);

const index=fs.readFileSync('index.html','utf8');
const app=fs.readFileSync('assets/app.js','utf8');
const exam=fs.readFileSync('assets/exam.js','utf8');
const config=fs.readFileSync('assets/config.js','utf8');
const sw=fs.readFileSync('sw.js','utf8');
const css=fs.readFileSync('assets/app.css','utf8');
const manifestRaw=fs.readFileSync('manifest.webmanifest','utf8');
const manifest=JSON.parse(manifestRaw);

if(manifest.id!=='/hlu/'||manifest.start_url!=='/hlu/'||manifest.scope!=='/hlu/') throw new Error('Manifest sai base /hlu/');
if(!config.includes("APP_VERSION:'02102026'")) throw new Error('Sai version Web 280926');
if(!sw.includes("hlu-tools-02102026-v1")) throw new Error('Service Worker sai cache 280926');
if(!index.includes('data-web-version="02102026"')) throw new Error('index thiếu marker version 280926');

for(const label of ['Trang chủ','Tin tức','Soft','Tài liệu','Firmware','E-Learning','Tìm kiếm','Đã lưu','Download','Cài đặt']){
  if(!index.includes(label)) throw new Error('Drawer thiếu '+label);
}
const bottom=['Trang chủ','Tìm kiếm','Đã lưu','Download'];let cursor=0;
for(const label of bottom){const p=index.indexOf('>'+label+'</small>',cursor);if(p<0)throw new Error('Bottom nav thiếu/sai thứ tự '+label);cursor=p+label.length;}

const activeText=[index,app,config,sw,manifestRaw,css,...['assets/icons.js','assets/presentation.js'].map(f=>fs.readFileSync(f,'utf8'))].join('\n');
for(const marker of ['assets/toolkit.js','data-route="toolkit"','?view=toolkit','renderToolkit','HLUToolkit','data-tool=','toolkit-grid','home-tools','home-tool','network-toolkit','wifi-analyzer','lan-scan','wifi-info','traceroute','subnet','port-check','mac-vendor']){
  if(activeText.includes(marker)) throw new Error('Toolkit Web còn marker: '+marker);
}

for(const marker of ['renderHome','renderResources','renderSearch','renderSaved','renderDownloads','renderNews','renderSettings','renderNotifications','renderExamHub','markNewsRead','sourceSection','sourceId','openNewsItem']){
  if(!(app+exam).includes(marker)) throw new Error('Thiếu logic 280926: '+marker);
}
for(const marker of ['multi_choice','true_false','MOCK_COUNTS','ExamHistoryStore','refreshOnline','action=exam_bank','deadline']){
  if(!(exam+app).includes(marker)) throw new Error('E-Learning thiếu: '+marker);
}
for(const marker of ['SpeechRecognition','webkitSpeechRecognition','popular','take']){
  // Web implementation is not a literal Kotlin port, so require browser voice + popular search behavior markers only where applicable.
  if(marker==='take') continue;
  if(!(app+index).includes(marker)) throw new Error('Search 280926 thiếu: '+marker);
}
if(!css.includes('.resource-grid')||!css.includes('.exam-wrap')||!css.includes('.popular-grid')||!css.includes('.bottom-nav-four')) throw new Error('CSS thiếu UI 280926');

for(const marker of ['ICON_PATHS','notifications','settingsGroupRow','SETTINGS_GROUPS','loadNewsFallback','news_fallback.json']){if(!(app+index+sw).includes(marker))throw new Error('Thiếu fix 02102026: '+marker);}
for(const stale of ['Đồng hành cùng VNPT','vì một kết nối tốt đẹp hơn','drawerVersion']){if((index+app).includes(stale))throw new Error('Drawer còn text cũ: '+stale);}
const fallback=JSON.parse(fs.readFileSync('assets/data/news_fallback.json','utf8'));const fallbackNews=Array.isArray(fallback.data)?fallback.data.filter(x=>x.section==='news'&&x.visible!==false&&x.id&&x.title):[];if(fallbackNews.length<3)throw new Error('news_fallback không đủ dữ liệu Tin tức');

for(const icon of ['data-ui-icon="home"','data-ui-icon="search"','data-ui-icon="bookmark"','data-ui-icon="download"']){if(!index.includes(icon))throw new Error('Bottom Navigation sai icon Android: '+icon);}
for(const marker of ['data-download-item','card-actions','downloadItem(','mock-timer-icon','data-release-history','ic_zalo.png','Nhật ký phiên bản','settings-profile-row']){if(!(app+index+css).includes(marker))throw new Error('Thiếu parity 02102026: '+marker);}
if(!app.includes("mergeFallbackNews(initial,await loadNewsFallback())"))throw new Error('Tin tức chưa bootstrap fallback trước render');

// Regression guard for 02102026: never pass normalize directly to Array.map because map's third
// argument is the source array and would be mistaken for the optional forced section.
if(app.includes('map(normalize)')) throw new Error('Regression category: không được dùng map(normalize) trực tiếp');
for(const marker of [
  "const forcedSection=typeof forced==='string'?forced:''",
  'payload.map((row,i)=>normalize(row,i))',
  'direct.map((row,i)=>normalize(row,i))',
  'cache.map((row,i)=>normalize(row,i))',
  "rows.map(x=>card(x,{download:true}))",
  'canDownload=!!safeUrl(downloadRequest(item))'
]){if(!app.includes(marker))throw new Error('Thiếu fix 02102026 news/category/download: '+marker);}
const releaseHistory=JSON.parse(fs.readFileSync('assets/data/release_history.json','utf8'));
const androidReleaseVersions=['280926','270926.4','270926.3','270926.2','270926.1','270926','260926.5','260926.4','260926.3','260926.2','260926.1','260926','250926.4','250926.3','250926.2','250926.1','250926','240926','220926.5'];
if(JSON.stringify(releaseHistory.map(x=>x.version))!==JSON.stringify(androidReleaseVersions)) throw new Error('Nhật ký phiên bản chưa khớp Android 280926');


const aboutStart=app.indexOf("else if(group==='about')");
const aboutEnd=app.indexOf('ROOT.innerHTML=`<div class="settings settings-android',aboutStart);
const aboutBlock=app.slice(aboutStart,aboutEnd);
let aboutCursor=0;
for(const label of ['Giới thiệu HLU TOOLS','Kiểm tra cập nhật','Nhật ký phiên bản','Facebook','Zalo','Điện thoại','Góp ý cho nhà phát triển','VNPT HOA LƯ']){
  const pos=aboutBlock.indexOf(label,aboutCursor);if(pos<0)throw new Error('Giới thiệu thiếu/sai thứ tự: '+label);aboutCursor=pos+label.length;
}
for(const marker of ["ANDROID_SOURCE_VERSION:'02102026'",'settings-about','settings-app-tagline','settings-app-version','settings-profile-row','release-title','release-actions','about-copy-last']){
  if(!(app+config+css).includes(marker))throw new Error('Thiếu parity Giới thiệu Android: '+marker);
}
if(aboutBlock.includes('Giấy phép mã nguồn'))throw new Error('Web có mục Giấy phép mã nguồn nhưng Android 280926 không có');
if(app.includes('data-close-release>×'))throw new Error('Nhật ký Web còn nút × không có trên Android');
if(aboutBlock.includes('settings-check-button')||aboutBlock.includes('data-sync'))throw new Error('Android 02102026 không có action Kiểm tra cập nhật');

for(const f of ['assets/icons.js','assets/presentation.js'])new Function(fs.readFileSync(f,'utf8'));
new Function(app);new Function(exam);new Function(config);new Function(sw);
const bank=JSON.parse(fs.readFileSync('assets/data/exam_bank.json','utf8'));
if(bank.schemaVersion!==3) throw new Error('exam_bank local không phải schema 3');
if(!Array.isArray(bank.topics)||!Array.isArray(bank.questions)||!bank.topics.length||!bank.questions.length) throw new Error('exam_bank local rỗng');
const types=new Set(bank.questions.map(q=>q.questionType||'multi_choice'));
if(!types.has('multi_choice')) throw new Error('exam_bank local thiếu multi_choice');
for(const topic of bank.topics){const d=Number(topic.durationMinutes??topic.timeMinutes);if(!Number.isInteger(d)||d<=0) throw new Error('Topic duration không hợp lệ: '+topic.id);}

const headers=fs.readdirSync('assets/android-v280926').filter(x=>x.startsWith('header_260926_')&&x.endsWith('.webp'));
if(headers.length!==13) throw new Error('Số header 280926 không đúng: '+headers.length);

console.log(`HLU TOOLS Web/PWA 02102026 verification passed: ${must.length} required files, ${headers.length} dedicated headers, ${bank.topics.length} exam topics, ${bank.questions.length} local questions, Toolkit Web removed.`);

for(const name of ['soft','docs','firmware','learning']){const asset=`assets/android-v02102026/home_card_${name}_300926.png`;if(!fs.existsSync(asset)||!sw.includes(asset))throw new Error('Missing new Home card '+asset);}
for(const marker of ['latestResourceArticles','bindLatestArticles','renderDrawerProfile','settings-profile-row','textScaleSelect','qualityToggle','data-language','data-accent'])if(!app.includes(marker))throw new Error('Missing Android 02102026 behavior '+marker);
if(!fs.readFileSync('assets/parity.css','utf8').includes('.latest-articles{height:48px'))throw new Error('Latest strip must be 48px');
if(index.includes('drawer-head')||index.includes('drawer-service'))throw new Error('Drawer must use current Android profile header');
for(const name of ['drawerHome','drawerNews','drawerSoft','drawerDocs','drawerFirmware','drawerLearning','drawerSearch','drawerSaved','drawerDownload','drawerSettings'])if(!index.includes('data-ui-icon="'+name+'"'))throw new Error('Wrong drawer drawable '+name);
if(app.includes("ICON_PATHS[name]||"))throw new Error('Unknown icons must not silently fall back');
