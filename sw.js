const CACHE_NAME='hlu-tools-280926-4-v1';
const BASE='/hlu/';
const APP_SHELL=[
  BASE,BASE+'index.html',BASE+'manifest.webmanifest',BASE+'assets/app.css',BASE+'assets/app.js',BASE+'assets/config.js',BASE+'assets/exam.js',
  BASE+'assets/icons/icon-192.png',BASE+'assets/icons/icon-512.png',BASE+'assets/icons/apple-touch-icon.png',
  BASE+'assets/android-v280926/header_260926_home.webp',BASE+'assets/android-v280926/header_260926_tim_kiem.webp',BASE+'assets/android-v280926/header_260926_da_luu.webp',BASE+'assets/android-v280926/header_260926_download.webp',
  BASE+'assets/android-v280926/header_260926_thong_bao.webp',BASE+'assets/android-v280926/header_260926_tai_nguyen.webp',BASE+'assets/android-v280926/header_260926_cai_dat.webp',BASE+'assets/android-v280926/header_260926_gioi_thieu.webp',
  BASE+'assets/android-v280926/header_260926_tin_tuc.webp',BASE+'assets/android-v280926/header_260926_soft.webp',BASE+'assets/android-v280926/header_260926_tai_lieu.webp',BASE+'assets/android-v280926/header_260926_firmware.webp',BASE+'assets/android-v280926/header_260926_e_learning.webp',
  BASE+'assets/android-v280926/drawer_header_mockup_210926.webp',BASE+'assets/android-v280926/home_card_soft_bg_210926.webp',BASE+'assets/android-v280926/home_card_docs_bg_210926.webp',BASE+'assets/android-v280926/home_card_firmware_bg_210926.webp',BASE+'assets/android-v280926/home_card_learning_bg_210926.webp',
  BASE+'assets/data/exam_bank.json',BASE+'assets/data/news_fallback.json',BASE+'assets/data/release_history.json',BASE+'assets/android-v280926/ic_zalo.png'
];
self.addEventListener('install',event=>{event.waitUntil(caches.open(CACHE_NAME).then(cache=>cache.addAll(APP_SHELL)).then(()=>self.skipWaiting()));});
self.addEventListener('activate',event=>{event.waitUntil(caches.keys().then(keys=>Promise.all(keys.filter(key=>key.startsWith('hlu-tools-')&&key!==CACHE_NAME).map(key=>caches.delete(key)))).then(()=>self.clients.claim()));});
self.addEventListener('fetch',event=>{
  const request=event.request;if(request.method!=='GET')return;const url=new URL(request.url);if(url.origin!==self.location.origin)return;
  if(request.mode==='navigate'){
    event.respondWith(fetch(request).then(response=>{const copy=response.clone();caches.open(CACHE_NAME).then(cache=>cache.put(BASE+'index.html',copy));return response;}).catch(()=>caches.match(BASE+'index.html')));return;
  }
  if(url.pathname.startsWith(BASE))event.respondWith(caches.match(request).then(cached=>cached||fetch(request).then(response=>{if(response.ok){const copy=response.clone();caches.open(CACHE_NAME).then(cache=>cache.put(request,copy));}return response;})));
});