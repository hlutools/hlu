import fs from 'node:fs';
const required=[
  'index.html','404.html','.nojekyll','manifest.webmanifest','sw.js','ARCHIVE_NOTICE.md','LESSONS_LEARNED.md','README.md','CHANGELOG.md',
  'assets/app.css','assets/app.js','assets/config.js','assets/exam.js','assets/toolkit.js','assets/data/exam_bank.json','assets/data/oui_vendors.csv',
  'assets/icons/icon-192.png','assets/icons/icon-512.png','assets/icons/apple-touch-icon.png',
  'archive/original-final-220926.5/index.html','archive/original-final-220926.5/manifest.webmanifest','archive/original-final-220926.5/sw.js',
  'archive/original-final-220926.5/scripts/build.mjs','archive/original-final-220926.5/scripts/verify.mjs','archive/original-final-220926.5/.github/workflows/pages.yml'
];
for(const f of required) if(!fs.existsSync(f)) throw new Error('Thiếu file archive: '+f);
const index=fs.readFileSync('index.html','utf8');
const sw=fs.readFileSync('sw.js','utf8');
const manifest=JSON.parse(fs.readFileSync('manifest.webmanifest','utf8'));
const notice=fs.readFileSync('ARCHIVE_NOTICE.md','utf8');
const lessons=fs.readFileSync('LESSONS_LEARNED.md','utf8');
const readme=fs.readFileSync('README.md','utf8');
const config=fs.readFileSync('assets/config.js','utf8');
const exam=fs.readFileSync('assets/exam.js','utf8');
const toolkit=fs.readFileSync('assets/toolkit.js','utf8');
const originalIndex=fs.readFileSync('archive/original-final-220926.5/index.html','utf8');
if(!index.includes('DỰ ÁN WEB ĐÃ DỪNG / ARCHIVED')||!index.includes('23/09/2026')) throw new Error('Landing page chưa thể hiện trạng thái archive');
for(const oldScript of ['/hlu/assets/app.js','/hlu/assets/exam.js','/hlu/assets/toolkit.js','/hlu/assets/config.js']) if(index.includes(oldScript)) throw new Error('Archive landing vẫn tải runtime cũ: '+oldScript);
if(!index.includes("serviceWorker.register('/hlu/sw.js')")) throw new Error('Landing page chưa cập nhật Service Worker archive');
if(!sw.includes("hlu-tools-archived-20260923-v1")) throw new Error('Sai cache archive');
if(!sw.includes("key.startsWith('hlu-tools-')")) throw new Error('Service Worker chưa dọn cache Web cũ');
if(manifest.id!=='/hlu/'||manifest.start_url!=='/hlu/'||manifest.scope!=='/hlu/') throw new Error('Manifest sai base /hlu/');
if(!String(manifest.name).includes('Archived')||manifest.shortcuts) throw new Error('Manifest chưa chuyển trạng thái archived hoặc còn shortcut runtime');
if(!notice.includes('DỪNG PHÁT TRIỂN / ARCHIVED')||!notice.includes('HLU TOOLS phiên bản Android')) throw new Error('ARCHIVE_NOTICE thiếu nội dung bắt buộc');
if(!lessons.includes('Safari/iOS')||!lessons.includes('WiFi Analyzer')) throw new Error('LESSONS_LEARNED thiếu giới hạn iOS/Web');
if(!readme.startsWith('> ⚠️ **DỰ ÁN ĐÃ DỪNG PHÁT TRIỂN (ARCHIVED)**')) throw new Error('README thiếu banner archive');
if(!config.includes("APP_VERSION:'220926.5'")) throw new Error('Source Web cuối không còn version 220926.5');
for(const marker of ['indexedDB','MOCK_COUNTS','action=exam_bank']) if(!exam.includes(marker)) throw new Error('E-Learning source bị ảnh hưởng: '+marker);
for(const key of ['wifi-analyzer','speed-test','lan-scan','ping','ip','traceroute','subnet','port-check','wifi-info','mac-vendor']) if(!toolkit.includes("key:'"+key+"'")) throw new Error('Toolkit source bị ảnh hưởng: '+key);
for(const oldScript of ['/hlu/assets/app.js','/hlu/assets/exam.js','/hlu/assets/toolkit.js','/hlu/assets/config.js']) if(!originalIndex.includes(oldScript)) throw new Error('Snapshot runtime gốc không đầy đủ: '+oldScript);
new Function(sw);
console.log('HLU TOOLS Web App archive verification passed: source 220926.5 preserved, archived landing ready.');