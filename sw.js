const CACHE_NAME='hlu-tools-150926-3-v1';
const BASE='/hlu/';
const APP_SHELL=[
  BASE,
  BASE+'index.html',
  BASE+'manifest.webmanifest',
  BASE+'assets/app.css',
  BASE+'assets/app.js',
  BASE+'assets/config.js',
  BASE+'assets/icons/icon-192.png',
  BASE+'assets/icons/icon-512.png',
  BASE+'assets/icons/apple-touch-icon.png',
  BASE+'assets/android-v130926/home-header.png',
  BASE+'assets/android-v130926/drawer-header.png',
  BASE+'assets/android-v130926/card-soft.png',
  BASE+'assets/android-v130926/card-docs.png',
  BASE+'assets/android-v130926/card-firmware.png',
  BASE+'assets/android-v130926/search-header.png',
  BASE+'assets/android-v130926/saved-header.png',
  BASE+'assets/android-v130926/notifications-header.png',
  BASE+'assets/android-v130926/downloads-header.png'
];
self.addEventListener('install',event=>{
  event.waitUntil(caches.open(CACHE_NAME).then(cache=>cache.addAll(APP_SHELL)).then(()=>self.skipWaiting()));
});
self.addEventListener('activate',event=>{
  event.waitUntil(caches.keys().then(keys=>Promise.all(keys.filter(key=>key.startsWith('hlu-tools-')&&key!==CACHE_NAME).map(key=>caches.delete(key)))).then(()=>self.clients.claim()));
});
self.addEventListener('fetch',event=>{
  const request=event.request;
  if(request.method!=='GET') return;
  const url=new URL(request.url);
  if(url.origin!==self.location.origin) return;
  if(request.mode==='navigate'){
    event.respondWith(fetch(request).then(response=>{
      const copy=response.clone();
      caches.open(CACHE_NAME).then(cache=>cache.put(BASE+'index.html',copy));
      return response;
    }).catch(()=>caches.match(BASE+'index.html')));
    return;
  }
  if(url.pathname.startsWith(BASE)){
    event.respondWith(caches.match(request).then(cached=>cached||fetch(request).then(response=>{
      if(response.ok){const copy=response.clone();caches.open(CACHE_NAME).then(cache=>cache.put(request,copy));}
      return response;
    })));
  }
});
