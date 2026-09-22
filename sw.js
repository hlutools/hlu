const CACHE_NAME='hlu-tools-220926-5-v1';
const BASE='/hlu/';
const APP_SHELL=[
  BASE,BASE+'index.html',BASE+'manifest.webmanifest',BASE+'assets/app.css',BASE+'assets/app.js',BASE+'assets/config.js',BASE+'assets/exam.js',BASE+'assets/toolkit.js',
  BASE+'assets/icons/icon-192.png',BASE+'assets/icons/icon-512.png',BASE+'assets/icons/apple-touch-icon.png',
  BASE+'assets/android-v220926/home_header_mockup_210926.webp',BASE+'assets/android-v220926/drawer_header_mockup_210926.webp',BASE+'assets/android-v220926/toolkit_header_mockup_210926.webp',BASE+'assets/android-v220926/resources_header_220926.webp',
  BASE+'assets/android-v220926/search_header_v508.webp',BASE+'assets/android-v220926/saved_header_v508.webp',BASE+'assets/android-v220926/downloads_header_v508.webp',BASE+'assets/android-v220926/notifications_header_v508.webp',
  BASE+'assets/android-v220926/home_card_soft_bg_210926.webp',BASE+'assets/android-v220926/home_card_docs_bg_210926.webp',BASE+'assets/android-v220926/home_card_firmware_bg_210926.webp',BASE+'assets/android-v220926/home_card_learning_bg_210926.webp',
  BASE+'assets/data/exam_bank.json',BASE+'assets/data/oui_vendors.csv'
];
self.addEventListener('install',event=>{event.waitUntil(caches.open(CACHE_NAME).then(cache=>cache.addAll(APP_SHELL)).then(()=>self.skipWaiting()));});
self.addEventListener('activate',event=>{event.waitUntil(caches.keys().then(keys=>Promise.all(keys.filter(key=>key.startsWith('hlu-tools-')&&key!==CACHE_NAME).map(key=>caches.delete(key)))).then(()=>self.clients.claim()));});
self.addEventListener('fetch',event=>{const request=event.request;if(request.method!=='GET')return;const url=new URL(request.url);if(url.origin!==self.location.origin)return;if(request.mode==='navigate'){event.respondWith(fetch(request).then(response=>{const copy=response.clone();caches.open(CACHE_NAME).then(cache=>cache.put(BASE+'index.html',copy));return response;}).catch(()=>caches.match(BASE+'index.html')));return;}if(url.pathname.startsWith(BASE)){event.respondWith(caches.match(request).then(cached=>cached||fetch(request).then(response=>{if(response.ok){const copy=response.clone();caches.open(CACHE_NAME).then(cache=>cache.put(request,copy));}return response;})));}});
