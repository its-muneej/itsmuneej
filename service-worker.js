/* Static shell only. Business data stays in IndexedDB; never in this cache. */
const CACHE_PREFIX='storeflow-'+self.registration.scope;
const CACHE=CACHE_PREFIX+'v1.0.0';
const FILES=['./','./index.html','./manifest.json','./assets/css/app.css','./assets/js/app.js','./assets/js/db.js','./assets/js/ui.js','./assets/js/scanner.js','./assets/js/transfer.js','./assets/js/demo.js','./assets/vendor/zxing.min.js','./assets/vendor/JsBarcode.all.min.js','./assets/fonts/Inter.woff2','./assets/icons/icon.svg','./assets/icons/icon-192.png','./assets/icons/icon-512.png','./assets/icons/maskable-512.png'];
self.addEventListener('install',event=>event.waitUntil(caches.open(CACHE).then(cache=>cache.addAll(FILES))));
// No forced skipWaiting: a new app version activates when old tabs close.
self.addEventListener('activate',event=>event.waitUntil(caches.keys().then(keys=>Promise.all(keys.filter(k=>k.startsWith(CACHE_PREFIX)&&k!==CACHE).map(k=>caches.delete(k)))).then(()=>self.clients.claim())));
self.addEventListener('fetch',event=>{
 const u=new URL(event.request.url);if(event.request.method!=='GET'||u.origin!==location.origin||!u.href.startsWith(self.registration.scope))return;
 event.respondWith(caches.open(CACHE).then(async cache=>{
  const cached=await cache.match(event.request,{ignoreSearch:true});
  if(cached)return cached;
  try{return await fetch(event.request);}catch(err){if(event.request.mode==='navigate')return cache.match('./index.html');throw err;}
 }));
});
