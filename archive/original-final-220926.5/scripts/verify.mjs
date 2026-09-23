import fs from 'node:fs';
const must=[
 'index.html','404.html','.nojekyll','manifest.webmanifest','sw.js','assets/app.css','assets/app.js','assets/config.js','assets/exam.js','assets/toolkit.js',
 'assets/icons/icon-192.png','assets/icons/icon-512.png','assets/icons/apple-touch-icon.png',
 'assets/android-v220926/home_header_mockup_210926.webp','assets/android-v220926/drawer_header_mockup_210926.webp','assets/android-v220926/toolkit_header_mockup_210926.webp','assets/android-v220926/resources_header_220926.webp',
 'assets/android-v220926/search_header_v508.webp','assets/android-v220926/saved_header_v508.webp','assets/android-v220926/downloads_header_v508.webp','assets/android-v220926/notifications_header_v508.webp',
 'assets/android-v220926/home_card_soft_bg_210926.webp','assets/android-v220926/home_card_docs_bg_210926.webp','assets/android-v220926/home_card_firmware_bg_210926.webp','assets/android-v220926/home_card_learning_bg_210926.webp',
 'assets/data/exam_bank.json','assets/data/oui_vendors.csv'
];
for(const f of must) if(!fs.existsSync(f)) throw new Error('Thiếu file: '+f);
const index=fs.readFileSync('index.html','utf8'),app=fs.readFileSync('assets/app.js','utf8'),exam=fs.readFileSync('assets/exam.js','utf8'),toolkit=fs.readFileSync('assets/toolkit.js','utf8'),config=fs.readFileSync('assets/config.js','utf8'),sw=fs.readFileSync('sw.js','utf8'),css=fs.readFileSync('assets/app.css','utf8');
const manifest=JSON.parse(fs.readFileSync('manifest.webmanifest','utf8'));
if(manifest.id!=='/hlu/'||manifest.start_url!=='/hlu/'||manifest.scope!=='/hlu/') throw new Error('Manifest sai base /hlu/');
if(!config.includes("APP_VERSION:'220926.5'")) throw new Error('Sai version Web');
if(!sw.includes("hlu-tools-220926-5-v1")) throw new Error('Service Worker chưa đổi cache 220926.5');
for(const m of ['/hlu/assets/exam.js','/hlu/assets/toolkit.js','android-v220926/drawer_header_mockup_210926.webp']) if(!index.includes(m)) throw new Error('index thiếu '+m);
for(const label of ['Trang chủ','Tin tức & cập nhật','Soft','Tài liệu','Firmware','E-Learning','Network Toolkit','Tìm kiếm','Đã lưu','Download','Cài đặt','Giới thiệu']) if(!index.includes(label)) throw new Error('Drawer thiếu '+label);
const bottom=['Trang chủ','Tìm kiếm','Toolkit','Đã lưu','Download'];let cursor=0;for(const label of bottom){const p=index.indexOf('<small>'+label+'</small>',cursor);if(p<0)throw new Error('Bottom nav thiếu/sai thứ tự '+label);cursor=p+label.length;}
if(index.includes('<small>Thông báo</small>')) throw new Error('Bottom nav vẫn còn Thông báo');
for(const marker of ['renderResources','renderToolkit','renderExamHub','renderSettings','renderNotifications','markNewsRead','processUpdates','indexedDB','Notification']){const hay=app+exam+toolkit;if(!hay.includes(marker))throw new Error('Thiếu logic: '+marker);}
for(const marker of ['multi_choice','true_false','MOCK_COUNTS','ExamHistoryStore','refreshOnline','action=exam_bank','deadline']){if(!(exam+app).includes(marker))throw new Error('E-Learning thiếu: '+marker);}
for(const key of ['wifi-analyzer','speed-test','lan-scan','ping','ip','traceroute','subnet','port-check','wifi-info','mac-vendor']) if(!toolkit.includes("key:'"+key+"'")) throw new Error('Toolkit thiếu '+key);
if(!toolkit.includes('trình duyệt')&&!toolkit.includes('Trình duyệt')) throw new Error('Toolkit thiếu cảnh báo giới hạn Web');
if(!css.includes('.resource-grid')||!css.includes('.toolkit-grid')||!css.includes('.exam-wrap')) throw new Error('CSS thiếu UI 220926.5');
new Function(app);new Function(exam);new Function(toolkit);new Function(config);new Function(sw);
const bank=JSON.parse(fs.readFileSync('assets/data/exam_bank.json','utf8'));
if(bank.schemaVersion!==3) throw new Error('exam_bank local không phải schema 3');
if(!Array.isArray(bank.topics)||!Array.isArray(bank.questions)||!bank.topics.length||!bank.questions.length) throw new Error('exam_bank local rỗng');
const types=new Set(bank.questions.map(q=>q.questionType||'multi_choice'));if(!types.has('multi_choice')) throw new Error('exam_bank local thiếu multi_choice');
for(const topic of bank.topics){const d=Number(topic.durationMinutes??topic.timeMinutes);if(!Number.isInteger(d)||d<=0)throw new Error('Topic duration không hợp lệ: '+topic.id);}
const dataFiles=fs.readdirSync('assets/android-v220926').filter(x=>x.endsWith('.webp'));if(dataFiles.length<12)throw new Error('Thiếu asset Web 220926');
console.log(`HLU TOOLS Web/PWA 220926.5 verification passed: ${must.length} required files, ${dataFiles.length} Android-derived WebP assets, ${bank.topics.length} exam topics, ${bank.questions.length} local questions.`);
