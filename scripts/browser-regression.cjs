// Real browser, isolated contexts and local files only. Never reaches production/Auth.
const {chromium,webkit}=require('playwright-core');
const engine=process.env.BROWSER_ENGINE||'chromium';
if(!['chromium','webkit'].includes(engine))throw Error('Unknown browser engine');
const http=require('node:http'),fs=require('node:fs/promises'),path=require('node:path'),assert=require('node:assert/strict');
const {execFileSync}=require('node:child_process');
let servingOld=false,networkDown=false;const oldFiles=new Map();
const root=path.resolve(__dirname,'..'),out=path.join(root,'browser-artifacts');
const mime={'.html':'text/html; charset=utf-8','.js':'text/javascript; charset=utf-8','.css':'text/css; charset=utf-8','.png':'image/png','.webmanifest':'application/manifest+json'};
const server=http.createServer(async(req,res)=>{
 if(networkDown){req.socket.destroy();return;}
 try{
  const pathname=decodeURIComponent(new URL(req.url,'http://localhost').pathname);
  if(!pathname.startsWith('/ledger-app/')){res.writeHead(404);res.end();return;}
  let file=path.resolve(root,pathname.slice('/ledger-app/'.length)||'index.html');
  if(!file.startsWith(root+path.sep)){res.writeHead(403);res.end();return;}
  if((await fs.stat(file)).isDirectory())file=path.join(file,'index.html');
  res.writeHead(200,{'Content-Type':mime[path.extname(file)]||'application/octet-stream','Cache-Control':'no-store'});if(servingOld){const relative=path.relative(root,file);if(!oldFiles.has(relative))oldFiles.set(relative,execFileSync('git',['show','c1d414530e9ba9c07c642d9b9927e54ff15f3bef:'+relative]));res.end(oldFiles.get(relative));}else res.end(await fs.readFile(file));
 }catch{res.writeHead(404);res.end();}
});
(async()=>{
 await fs.mkdir(out,{recursive:true});await new Promise(r=>server.listen(0,'127.0.0.1',r));
 const origin='http://127.0.0.1:'+server.address().port,base=origin+'/ledger-app/';
 const browser=engine==='webkit'?await webkit.launch({headless:true}):await chromium.launch({channel:process.env.CHROME_BIN?undefined:'chrome',executablePath:process.env.CHROME_BIN||undefined,headless:true});
 const evidence={engine:await browser.version(),scope:engine+' automated desktop + mobile emulation, not Safari or a physical iPhone',runs:[]};
 try{
  let fixtureBackup;
  for(const [label,viewport]of [['mobile',{width:390,height:844}],['desktop',{width:1440,height:1000}]]){
   const context=await browser.newContext({viewport,isMobile:label==='mobile',hasTouch:label==='mobile',locale:'es-ES',timezoneId:'Europe/Madrid'});
   const blocked=[],errors=[];await context.route('**/*',route=>{const url=new URL(route.request().url());if(url.origin!==origin){blocked.push(url.origin);return route.abort();}return route.continue();});
   const page=await context.newPage();page.on('pageerror',e=>errors.push(e.message));
   const fit=async()=>assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1),'Horizontal overflow: '+page.url());
   await page.goto(base);await page.locator('#ledger-onboarding-dialog[open]').waitFor();await page.locator('#ledger-onboarding-start').click();
   await page.locator('#analytics-dialog[open]').waitFor();await page.locator('#analytics-decline').click();
   await page.locator('#fab').click();await page.locator('#tx-amount').fill('12,34');await page.locator('#tx-note').fill('FICTICIO · compra de ejemplo');await page.locator('#save-transaction').click();
   const saved=await page.evaluate(()=>localStorage.getItem('flowfi.public.v27'));assert.equal(JSON.parse(saved).transactions[0].amount,12.34);fixtureBackup=saved;
   await fit();await page.waitForFunction(()=>!document.querySelector('#toast').classList.contains('show'));await page.screenshot({path:path.join(out,'ledger-home-'+label+'.png'),fullPage:false});
   await page.locator('[data-route="stats"]').click();await page.locator('#export-excel-stats').waitFor();await fit();
   await page.reload();assert.equal(await page.evaluate(()=>localStorage.getItem('flowfi.public.v27')),saved);
   await page.goto(base+'demo/');await page.locator('#add-demo').click();await page.locator('#movement-note').fill('FICTICIO · práctica');await page.locator('#movement-amount').fill('19.99');await page.locator('#movement-form .primary').click();
   assert.ok((await page.locator('#transactions').innerText()).includes('FICTICIO · práctica'));await fit();assert.equal(await page.evaluate(()=>localStorage.getItem('flowfi.public.v27')),saved);
   await page.screenshot({path:path.join(out,'demo-'+label+'.png'),fullPage:false});
   await page.goto(base+'reparto/');await page.locator('#example').click();assert.match(await page.locator('#total-common').innerText(),/1[.\s]?250,00/);await fit();await page.screenshot({path:path.join(out,'calculator-'+label+'.png'),fullPage:true});
   assert.equal(await page.evaluate(()=>localStorage.getItem('flowfi.public.v27')),saved);
   await page.goto(base+'descubre/');await fit();await page.screenshot({path:path.join(out,'landing-'+label+'.png'),fullPage:true});
   // Wait for the actual service worker to control this context, then exercise real offline navigations.
   await page.evaluate(()=>navigator.serviceWorker.ready);await page.reload();await page.waitForFunction(()=>navigator.serviceWorker.controller!==null);
   assert.equal(await page.evaluate(()=>caches.match(new URL('demo/',location.href).href).then(Boolean)),true,'Demo must be cached before network failure');
   // Playwright WebKit setOffline can abort navigation before the SW handles it.
   // Break the server transport instead: fetch really fails and the actual SW must recover.
   if(engine==='webkit')networkDown=true;else await context.setOffline(true);
   await page.goto(base+'demo/');await page.locator('#add-demo').waitFor();
   await page.goto(base+'reparto/');await page.locator('#example').click();assert.match(await page.locator('#total-common').innerText(),/1[.\s]?250,00/);
   await page.goto(base);await page.locator('#fab').waitFor();assert.equal(await page.evaluate(()=>localStorage.getItem('flowfi.public.v27')),saved);
   assert.deepEqual(errors,[]);assert.ok(!blocked.some(x=>/posthog|counterapi/.test(x)),'Telemetry attempted without consent');
   evidence.runs.push({label,viewport,offlineTransport:engine==='webkit'?'server connection reset':'browser network offline',checks:['native onboarding/dialogs','transaction save/reload','statistics navigation','isolated demo CRUD','local calculator','no horizontal overflow','real service worker offline routes','no finance overwrite','no analytics without consent'],blockedExternalOrigins:[...new Set(blocked)]});
   networkDown=false;await context.close();console.log('[OK] Real '+engine+' '+label+': finance, demo, calculator, layout and offline routes');
  }
  // Exercise an actual 1.6.0 worker -> 1.6.1 -> rollback, on the SAME origin/storage.
  const upgrade=await browser.newContext({locale:'es-ES'});
  await upgrade.route('**/*',r=>new URL(r.request().url()).origin===origin?r.continue():r.abort());
  await upgrade.addInitScript(backup=>{if(!localStorage.getItem('release.fixture.seeded')){localStorage.setItem('release.fixture.seeded','yes');localStorage.setItem('flowfi.public.v27',backup);localStorage.setItem('ledger.analytics.consent.v1','no');}},fixtureBackup);
  const page=await upgrade.newPage();servingOld=true;
  await page.goto(base);await page.evaluate(()=>navigator.serviceWorker.ready);await page.reload();await page.waitForFunction(()=>navigator.serviceWorker.controller!==null);
  assert.equal(await page.evaluate(()=>localStorage.getItem('flowfi.public.v27')),fixtureBackup);
  async function changeRevision(old){
    servingOld=old;
    await page.evaluate(async()=>{window.releaseOldController=navigator.serviceWorker.controller;const r=await navigator.serviceWorker.getRegistration();await r.update();});
    await page.waitForFunction(()=>navigator.serviceWorker.controller!==window.releaseOldController);
    await page.reload();
    assert.equal(await page.evaluate(()=>localStorage.getItem('flowfi.public.v27')),fixtureBackup);
  }
  await changeRevision(false);assert.equal(await page.evaluate(()=>window.LedgerAppVersion),'Beta 1.6.1');
  await changeRevision(true);assert.ok((await page.content()).includes("const APP_VERSION = 'Beta 1.6.0'"));
  evidence.upgradeRollback={from:'c1d4145 / Beta 1.6.0',to:'Beta 1.6.1',rollback:'Beta 1.6.0',sameOrigin:true,financialBackup:'byte-identical'};
  console.log('[OK] Actual service worker upgrade and rollback preserve fictional financial backup byte for byte');
  servingOld=false;await upgrade.close();
 }finally{await fs.writeFile(path.join(out,'evidence.json'),JSON.stringify(evidence,null,2)+'\n');await browser.close();}
})().catch(e=>{console.error(e);process.exitCode=1;}).finally(()=>server.close());
