import fs from 'node:fs';

const required=[
  'index.html',
  '404.html',
  '.nojekyll',
  'manifest.webmanifest',
  'sw.js',
  'assets/app.css',
  'assets/app.js',
  'assets/config.js',
  'assets/icons/icon-192.png',
  'assets/icons/icon-512.png',
  'assets/icons/apple-touch-icon.png',
  'assets/android-v130926/home-header.png',
  'assets/android-v130926/drawer-header.png',
  'assets/android-v130926/card-soft.png',
  'assets/android-v130926/card-docs.png',
  'assets/android-v130926/card-firmware.png',
  'assets/android-v130926/search-header.png',
  'assets/android-v130926/saved-header.png',
  'assets/android-v130926/notifications-header.png',
  'assets/android-v130926/downloads-header.png',
  'assets/android-v130926/metadata.json'
];

for(const file of required){
  if(!fs.existsSync(file)) throw new Error('Thiếu file: '+file);
}

const expectedPngDimensions={
  'assets/icons/icon-192.png':[192,192],
  'assets/icons/icon-512.png':[512,512],
  'assets/icons/apple-touch-icon.png':[192,192],
  'assets/android-v130926/home-header.png':[3072,512],
  'assets/android-v130926/drawer-header.png':[1361,1156],
  'assets/android-v130926/card-soft.png':[1250,272],
  'assets/android-v130926/card-docs.png':[1250,270],
  'assets/android-v130926/card-firmware.png':[1250,272],
  'assets/android-v130926/search-header.png':[3072,512],
  'assets/android-v130926/saved-header.png':[3072,512],
  'assets/android-v130926/notifications-header.png':[3072,512],
  'assets/android-v130926/downloads-header.png':[3072,512]
};

for(const [file,[expectedWidth,expectedHeight]] of Object.entries(expectedPngDimensions)){
  const png=fs.readFileSync(file);
  const signature=png.subarray(0,8).toString('hex');
  if(signature!=='89504e470d0a1a0a') throw new Error('Không phải PNG hợp lệ: '+file);
  const width=png.readUInt32BE(16);
  const height=png.readUInt32BE(20);
  if(width!==expectedWidth||height!==expectedHeight){
    throw new Error('Sai kích thước '+file+': '+width+'x'+height);
  }
}

const index=fs.readFileSync('index.html','utf8');
const css=fs.readFileSync('assets/app.css','utf8');
const app=fs.readFileSync('assets/app.js','utf8');
const config=fs.readFileSync('assets/config.js','utf8');
const sw=fs.readFileSync('sw.js','utf8');
const redirect=fs.readFileSync('404.html','utf8');
const manifest=JSON.parse(fs.readFileSync('manifest.webmanifest','utf8'));

const indexReferences=[
  '/hlu/manifest.webmanifest',
  '/hlu/assets/app.css',
  '/hlu/assets/app.js',
  '/hlu/assets/config.js',
  '/hlu/assets/icons/apple-touch-icon.png',
  '/hlu/assets/android-v130926/home-header.png',
  '/hlu/assets/android-v130926/drawer-header.png',
  '/hlu/assets/android-v130926/card-soft.png',
  '/hlu/assets/android-v130926/card-docs.png',
  '/hlu/assets/android-v130926/card-firmware.png'
];
for(const reference of indexReferences){
  if(!index.includes(reference)) throw new Error('Index thiếu đường dẫn: '+reference);
}

if(manifest.id!=='/hlu/'||manifest.start_url!=='/hlu/'||manifest.scope!=='/hlu/'){
  throw new Error('Manifest chưa cấu hình đúng base /hlu/');
}
for(const icon of manifest.icons||[]){
  if(!icon.src.startsWith('/hlu/assets/icons/')) throw new Error('Manifest có icon sai base path: '+icon.src);
}
if(!sw.includes("const BASE='/hlu/';")) throw new Error('Service worker chưa đúng base /hlu/');
for(const name of ['home-header.png','drawer-header.png','card-soft.png','card-docs.png','card-firmware.png','search-header.png','saved-header.png','notifications-header.png','downloads-header.png']){
  if(!sw.includes(name)&&!app.includes(name)&&!index.includes(name)) throw new Error('Thiếu tham chiếu tài nguyên: '+name);
}
if(!config.includes("BASE_PATH:'/hlu/'")) throw new Error('Config chưa đúng base /hlu/');
if(!config.includes('AKfycbzwUuTpjfE57a5IBFdOpomOuMPvBQySGWr4VPptnoTxEa-ubuO8-YGczIM-mzBeM0ND')) throw new Error('Thiếu URL Apps Script');
if(!redirect.includes("'/hlu/'")) throw new Error('404.html chưa chuyển hướng về /hlu/');
if(!css.includes('aspect-ratio:1250/272')||!css.includes('max-width:820px')) throw new Error('CSS không còn chuẩn giao diện Android 130926');

new Function(app);
new Function(config);
new Function(sw);

const disallowed=/\b(?:src|href)=["']\/(?!hlu\/)/g;
for(const [file,source] of [['index.html',index],['404.html',redirect]]){
  const match=source.match(disallowed);
  if(match) throw new Error(file+' có đường dẫn ngoài base /hlu/: '+match.join(', '));
}

console.log('HLU TOOLS 130926 verification passed: '+required.length+' required files, '+Object.keys(expectedPngDimensions).length+' exact PNG assets.');
