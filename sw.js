const CACHE='ledger-app-beta-1-6-0-couple-preview-1';
const CACHE_PREFIX='ledger-app-';
const CORE=['./','./index.html','./manifest.webmanifest','./ledger-icon-192-v2.png','./ledger-icon-512-v2.png','./ledger-apple-touch-v2.png','./posthog-stub.js','./posthog-bridge.js','./arx-analytics-guard.js','./i18n.js','./money.js','./portfolio-import.js','./couple.css','./couple-core.js','./couple-sync.js','./couple-ui.js','./vendor/supabase.js'];
self.addEventListener('install',e=>e.waitUntil(caches.open(CACHE).then(c=>c.addAll(CORE)).then(()=>self.skipWaiting())));
self.addEventListener('activate',e=>e.waitUntil(caches.keys().then(keys=>Promise.all(keys.filter(k=>k.startsWith(CACHE_PREFIX)&&k!==CACHE).map(k=>caches.delete(k)))).then(()=>self.clients.claim())));
self.addEventListener('fetch',e=>{
  if(e.request.method!=='GET'||new URL(e.request.url).origin!==self.location.origin) return;
  if(e.request.mode==='navigate'){
    e.respondWith(fetch(e.request,{cache:'no-store'}).then(r=>{if(r.ok){const copy=r.clone();e.waitUntil(caches.open(CACHE).then(c=>c.put('./index.html',copy)));}return r;}).catch(()=>caches.match('./index.html')));
    return;
  }
  e.respondWith(caches.match(e.request).then(hit=>hit||fetch(e.request).then(r=>{if(r.ok){const copy=r.clone();e.waitUntil(caches.open(CACHE).then(c=>c.put(e.request,copy)));}return r;})));
});
