const CACHE_NAME='hlu-tools-archived-20260923-v1';
const BASE='/hlu/';
const ARCHIVE_SHELL=[
  BASE,
  BASE+'index.html',
  BASE+'manifest.webmanifest',
  BASE+'assets/icons/icon-192.png',
  BASE+'assets/icons/icon-512.png',
  BASE+'assets/icons/apple-touch-icon.png'
];
self.addEventListener('install',event=>{
  event.waitUntil(caches.open(CACHE_NAME).then(cache=>cache.addAll(ARCHIVE_SHELL)).then(()=>self.skipWaiting()));
});
self.addEventListener('activate',event=>{
  event.waitUntil(caches.keys().then(keys=>Promise.all(keys.filter(key=>key!==CACHE_NAME&&(key.startsWith('hlu-tools-')||key.startsWith('hlu-'))).map(key=>caches.delete(key)))).then(()=>self.clients.claim()));
});
self.addEventListener('fetch',event=>{
  if(event.request.method!=='GET')return;
  const url=new URL(event.request.url);
  if(url.origin!==self.location.origin)return;
  if(event.request.mode==='navigate'){
    event.respondWith(fetch(BASE+'index.html',{cache:'no-store'}).then(response=>{
      const copy=response.clone();caches.open(CACHE_NAME).then(cache=>cache.put(BASE+'index.html',copy));return response;
    }).catch(()=>caches.match(BASE+'index.html')));
    return;
  }
  if(ARCHIVE_SHELL.some(path=>url.pathname===new URL(path,self.location.origin).pathname)){
    event.respondWith(caches.match(event.request).then(cached=>cached||fetch(event.request)));
  }
});