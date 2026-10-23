const CACHE='ledger-app-beta-1-6-1-growth-3';
const CACHE_PREFIX='ledger-app-';
const CORE=['./','./index.html','./manifest.webmanifest','./ledger-icon-192-v2.png','./ledger-icon-512-v2.png','./ledger-apple-touch-v2.png','./posthog-stub.js','./posthog-bridge.js','./arx-analytics-guard.js','./i18n.js','./money.js','./portfolio-import.js','./couple.css','./couple-core.js','./couple-sync.js','./couple-auth.js','./couple-config.js','./couple-ui.js','./couple-invite.js','./vendor/supabase.js','./ledger-onboarding.js','./descubre/','./marketing.css','./reparto/','./reparto/calculator.js','./reparto/page.js','./demo/','./demo/demo.css','./demo/demo.js','./assets/screenshots/ledger-home-mobile.png','./assets/screenshots/demo-mobile.png'];
const base=new URL('./',self.location.href);
const allowed=new Set(CORE.map(path=>new URL(path,base).pathname));
function publicKey(url){
  let path=url.pathname;
  if(path===base.pathname+'index.html')path=base.pathname;
  for(const route of ['descubre','reparto','demo'])if(path===base.pathname+route+'/index.html')path=base.pathname+route+'/';
  return allowed.has(path)?new URL(path,base).href:null;
}
self.addEventListener('install',e=>e.waitUntil(caches.open(CACHE).then(c=>c.addAll(CORE)).then(()=>self.skipWaiting())));
self.addEventListener('activate',e=>e.waitUntil(caches.keys().then(keys=>Promise.all(keys.filter(k=>k.startsWith(CACHE_PREFIX)&&k!==CACHE).map(k=>caches.delete(k)))).then(()=>self.clients.claim())));
self.addEventListener('fetch',e=>{
  const url=new URL(e.request.url);
  if(e.request.method!=='GET'||url.origin!==self.location.origin)return;
  const key=publicKey(url);
  // Only public application assets. Never cache arbitrary same-origin endpoints or exports.
  if(!key)return;
  if(e.request.mode==='navigate'){
    e.respondWith(fetch(e.request,{cache:'no-store'}).then(r=>{if(r.ok){const copy=r.clone();e.waitUntil(caches.open(CACHE).then(c=>c.put(key,copy)));}return r;}).catch(()=>caches.match(key).then(hit=>hit||Response.error())));
    return;
  }
  e.respondWith(caches.match(key).then(hit=>hit||fetch(e.request).then(r=>{if(r.ok){const copy=r.clone();e.waitUntil(caches.open(CACHE).then(c=>c.put(key,copy)));}return r;})));
});
