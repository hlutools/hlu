import fs from 'node:fs';

const required=[
  'index.html','404.html','.nojekyll','manifest.webmanifest','sw.js','assets/app.css','assets/app.js','assets/config.js',
  'assets/icons/icon-192.png','assets/icons/icon-512.png','assets/icons/apple-touch-icon.png',
  'assets/android-v130926/home-header.png','assets/android-v130926/drawer-header.png','assets/android-v130926/card-soft.png',
  'assets/android-v130926/card-docs.png','assets/android-v130926/card-firmware.png','assets/android-v130926/search-header.png',
  'assets/android-v130926/saved-header.png','assets/android-v130926/notifications-header.png','assets/android-v130926/downloads-header.png',
  'assets/android-v130926/metadata.json'
];
for(const file of required){if(!fs.existsSync(file))throw new Error('Thiếu file: '+file);}
const expectedPngDimensions={
  'assets/icons/icon-192.png':[192,192],'assets/icons/icon-512.png':[512,512],'assets/icons/apple-touch-icon.png':[192,192],
  'assets/android-v130926/home-header.png':[3072,512],'assets/android-v130926/drawer-header.png':[1361,1156],
  'assets/android-v130926/card-soft.png':[1250,272],'assets/android-v130926/card-docs.png':[1250,270],
  'assets/android-v130926/card-firmware.png':[1250,272],'assets/android-v130926/search-header.png':[3072,512],
  'assets/android-v130926/saved-header.png':[3072,512],'assets/android-v130926/notifications-header.png':[3072,512],
  'assets/android-v130926/downloads-header.png':[3072,512]
};
for(const [file,[w,h]] of Object.entries(expectedPngDimensions)){
  const png=fs.readFileSync(file);if(png.subarray(0,8).toString('hex')!=='89504e470d0a1a0a')throw new Error('Không phải PNG: '+file);
  if(png.readUInt32BE(16)!==w||png.readUInt32BE(20)!==h)throw new Error('Sai kích thước '+file);
}
const index=fs.readFileSync('index.html','utf8');
const css=fs.readFileSync('assets/app.css','utf8');
const app=fs.readFileSync('assets/app.js','utf8');
const config=fs.readFileSync('assets/config.js','utf8');
const sw=fs.readFileSync('sw.js','utf8');
const redirect=fs.readFileSync('404.html','utf8');
const manifest=JSON.parse(fs.readFileSync('manifest.webmanifest','utf8'));
for(const ref of ['/hlu/manifest.webmanifest','/hlu/assets/app.css','/hlu/assets/app.js','/hlu/assets/config.js','/hlu/assets/android-v130926/home-header.png','/hlu/assets/android-v130926/drawer-header.png','/hlu/assets/android-v130926/card-soft.png','/hlu/assets/android-v130926/card-docs.png','/hlu/assets/android-v130926/card-firmware.png']){if(!index.includes(ref))throw new Error('Index thiếu: '+ref);}
if(manifest.id!=='/hlu/'||manifest.start_url!=='/hlu/'||manifest.scope!=='/hlu/')throw new Error('Manifest sai base /hlu/');
if(!sw.includes("const BASE='/hlu/';")||!sw.includes("hlu-tools-150926-3-v3"))throw new Error('Service worker chưa lên cache v3 cho image fix');
if(!config.includes("APP_VERSION:'150926.3'"))throw new Error('Config chưa là 150926.3');
if(!config.includes('AKfycbzwUuTpjfE57a5IBFdOpomOuMPvBQySGWr4VPptnoTxEa-ubuO8-YGczIM-mzBeM0ND'))throw new Error('Thiếu Apps Script URL');
for(const marker of ['installHluImageRecovery','MutationObserver','lh3.googleusercontent.com/d/','drive.google.com/thumbnail?id=','drive.google.com/uc?export=view&id=','hluDrivePrepared']){if(!config.includes(marker))throw new Error('Thiếu image recovery v3: '+marker);}
if(!redirect.includes("'/hlu/'"))throw new Error('404.html sai base path');
const drawerOrder=['Trang chủ','Tin tức','Soft','Tài liệu','Firmware','Đã lưu','Download','Cài đặt'];
let cursor=0;for(const label of drawerOrder){const pos=index.indexOf('<span>'+label+'</span>',cursor);if(pos<0)throw new Error('Drawer thiếu/sai thứ tự: '+label);cursor=pos+label.length;}
for(const marker of ['DỮ LIỆU','HỖ TRỢ','LIÊN HỆ','THÔNG TIN','Góp ý cho nhà phát triển','Cường VNPT - 0912862162','HLU TOOLS v150926.3']){if(!index.includes(marker))throw new Error('Settings thiếu: '+marker);}
for(const marker of ['unreadNews','markNewsItemViewed','processFreshNotifications','VERSION_UPDATE',"action:'feedback'",'markAllNotificationsRead','60000']){if(!app.includes(marker))throw new Error('App thiếu logic 150926.3: '+marker);}
if(!app.includes("if(currentItem.section==='news')markNewsItemViewed(currentItem.id)"))throw new Error('Badge Mới chưa gắn với thao tác mở chi tiết tin');
if(/markAllNotificationsRead[^}]*unreadNews/s.test(app))throw new Error('Đọc hết notification đang làm mất badge Mới');
if(!css.includes('.news-unread-banner')||!css.includes('.settings-group-title')||!css.includes('.content-card.news-new'))throw new Error('CSS chưa có giao diện 150926.3');
new Function(app);new Function(config);new Function(sw);
const disallowed=/\b(?:src|href)=["']\/(?!hlu\/)/g;for(const [file,source] of [['index.html',index],['404.html',redirect]]){const match=source.match(disallowed);if(match)throw new Error(file+' có đường dẫn ngoài /hlu/: '+match.join(', '));}
console.log('HLU TOOLS Web/PWA 150926.3 verification passed with proactive Drive image recovery v3: '+required.length+' required files, '+Object.keys(expectedPngDimensions).length+' exact PNG assets.');
