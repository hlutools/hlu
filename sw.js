const VERSION = '130926-4';
const BASE = '/hlu/';
const STATIC_CACHE = 'hlu-static-' + VERSION;
const DATA_CACHE = 'hlu-data-' + VERSION;
const SHELL = [
  BASE, BASE+'index.html', BASE+'404.html', BASE+'manifest.webmanifest',
  BASE+'assets/app.css', BASE+'assets/app.js', BASE+'assets/config.js', BASE+'assets/logo.svg'
];

self.addEventListener('install', event => {
  event.waitUntil(caches.open(STATIC_CACHE).then(cache => cache.addAll(SHELL)).then(() => self.skipWaiting()));
});
self.addEventListener('activate', event => {
  event.waitUntil(caches.keys().then(keys => Promise.all(keys.filter(k => ![STATIC_CACHE,DATA_CACHE].includes(k)).map(k => caches.delete(k)))).then(() => self.clients.claim()));
});
self.addEventListener('fetch', event => {
  if(event.request.method !== 'GET') return;
  const url = new URL(event.request.url);
  if(url.origin !== location.origin) return;
  if(url.pathname.startsWith(BASE+'assets/') || url.pathname === BASE+'manifest.webmanifest'){
    event.respondWith(caches.match(event.request).then(cached => cached || fetch(event.request).then(r => {const copy=r.clone(); caches.open(STATIC_CACHE).then(c=>c.put(event.request,copy)); return r;})));
    return;
  }
  event.respondWith(fetch(event.request).then(r => {const copy=r.clone(); caches.open(DATA_CACHE).then(c=>c.put(event.request,copy)); return r;}).catch(() => caches.match(event.request).then(r => r || caches.match(BASE+'index.html'))));
});
self.addEventListener('message', event => { if(event.data==='SKIP_WAITING') self.skipWaiting(); });
