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
   const fit=async()=>{const d=await page.evaluate(()=>({scroll:document.documentElement.scrollWidth,client:document.documentElement.clientWidth,inner:innerWidth,wide:[...document.querySelectorAll('main *')].filter(x=>x.getBoundingClientRect().right>document.documentElement.clientWidth+1).slice(0,12).map(x=>({tag:x.tagName,cls:typeof x.className==='string'?x.className:'svg',right:x.getBoundingClientRect().right}))}));if(d.scroll>d.client+1)await page.screenshot({path:path.join(out,'layout-failure-'+label+'.png'),fullPage:false});assert.ok(d.scroll<=d.client+1,'Horizontal overflow: '+page.url()+' '+JSON.stringify(d));};
   await page.goto(base);await page.locator('#ledger-onboarding-dialog[open]').waitFor();await page.locator('#ledger-onboarding-start').click();
   await page.locator('#analytics-dialog[open]').waitFor();await page.locator('#analytics-decline').click();
   await page.locator('#fab').click();await page.locator('#tx-amount').fill('12,34');await page.locator('#tx-note').fill('FICTICIO · compra de ejemplo');await page.locator('#save-transaction').click();
   const saved=await page.evaluate(()=>localStorage.getItem('flowfi.public.v27'));assert.equal(JSON.parse(saved).transactions[0].amount,12.34);fixtureBackup=saved;
   await fit();await page.waitForFunction(()=>!document.querySelector('#toast').classList.contains('show'));await page.screenshot({path:path.join(out,'ledger-home-'+label+'.png'),fullPage:false});
   await page.locator('[data-route="stats"]').click();await page.locator('#export-excel-stats').waitFor();await fit();await page.screenshot({path:path.join(out,'stats-before-settings-'+label+'.png'),fullPage:false});console.log('[NAV] '+JSON.stringify(await page.locator('[data-route="settings"]').evaluate(e=>{const r=e.getBoundingClientRect(),f=document.getElementById('fab').getBoundingClientRect();return{nav:{x:r.x,y:r.y,width:r.width,height:r.height},fab:{x:f.x,y:f.y,width:f.width,height:f.height},innerWidth,innerHeight,scrollY,scale:visualViewport?.scale,overflow:[...document.querySelectorAll('#main *')].filter(x=>x.getBoundingClientRect().right>document.documentElement.clientWidth+1).slice(0,12).map(x=>({tag:x.tagName,cls:x.className?.baseVal||x.className,right:x.getBoundingClientRect().right})),hit:document.elementFromPoint(r.x+r.width/2,r.y+r.height/2)?.outerHTML?.slice(0,180)};})));await page.locator('[data-route="settings"]').click();await page.locator('#export-json').waitFor();await fit();
   await page.reload();assert.equal(await page.evaluate(()=>localStorage.getItem('flowfi.public.v27')),saved);
   await page.goto(base+'demo/');await page.locator('#add-demo').click();await page.locator('#movement-note').fill('FICTICIO · práctica');await page.locator('#movement-amount').fill('19.99');await page.locator('#movement-form .primary').click();
   assert.ok((await page.locator('#transactions').innerText()).includes('FICTICIO · práctica'));await fit();assert.equal(await page.evaluate(()=>localStorage.getItem('flowfi.public.v27')),saved);
   await page.screenshot({path:path.join(out,'demo-'+label+'.png'),fullPage:false});
   await page.goto(base+'reparto/');await page.locator('#example').click();assert.match(await page.locator('#total-common').innerText(),/1[.\s]?250,00/);await fit();await page.screenshot({path:path.join(out,'calculator-'+label+'.png'),fullPage:true});
   assert.equal(await page.evaluate(()=>localStorage.getItem('flowfi.public.v27')),saved);
   await page.goto(base+'descubre/');await fit();await page.screenshot({path:path.join(out,'landing-'+label+'.png'),fullPage:true});
   // Wait for the actual service worker to control this context, then exercise real offline navigations.
   await page.evaluate(()=>navigator.serviceWorker.ready);await page.reload();await page.waitForFunction(()=>navigator.serviceWorker.controller!==null);
   assert.equal(await page.evaluate(base=>caches.match(base+'demo/').then(Boolean),base),true,'Demo must be cached before network failure');
   // Playwright WebKit setOffline can abort navigation before the SW handles it.
   // Break the server transport instead: fetch really fails and the actual SW must recover.
   if(engine==='webkit')networkDown=true;else await context.setOffline(true);
   await page.goto(base+'demo/');await page.locator('#add-demo').waitFor();
   await page.goto(base+'reparto/');await page.locator('#example').click();assert.match(await page.locator('#total-common').innerText(),/1[.\s]?250,00/);
   await page.goto(base);await page.locator('#fab').waitFor();assert.equal(await page.evaluate(()=>localStorage.getItem('flowfi.public.v27')),saved);
   assert.deepEqual(errors,[]);assert.ok(!blocked.some(x=>/posthog|counterapi/.test(x)),'Telemetry attempted without consent');
   evidence.runs.push({label,viewport,offlineTransport:engine==='webkit'?'server connection reset':'browser network offline',checks:['native onboarding/dialogs','transaction save/reload','statistics navigation','isolated demo CRUD','local calculator','no horizontal overflow','real service worker offline routes','no finance overwrite','no analytics without consent'],blockedExternalOrigins:[...new Set(blocked)]});
   networkDown=false;await context.setOffline(false);
   const recurring=await browser.newContext({viewport,isMobile:label==='mobile',hasTouch:label==='mobile',locale:'es-ES',timezoneId:'Europe/Madrid'});
   await recurring.route('**/*',r=>new URL(r.request().url()).origin===origin?r.continue():r.abort());
   await recurring.addInitScript(()=>{if(!localStorage.getItem('recurring.fixture')){const name='FICTICIO Gimnasio mensual e inversión de Trade Republic',day=new Date().getDate();localStorage.setItem('ledger.analytics.consent.v1','no');localStorage.setItem('recurring.fixture','yes');localStorage.setItem('flowfi.public.v27',JSON.stringify({version:2,settings:{currency:'EUR',cycleStartDay:28},accounts:['Principal'],accountDetails:[{name:'Principal',currency:'EUR',balance:0}],transactions:[],recurring:[{id:'browser-gym',name,amount:35,day,currency:'EUR',category:'Deportes',account:'Principal',active:true,type:'expense'},{id:'browser-cancelled',name:'FICTICIO Moto cancelada',amount:120,day,currency:'EUR',category:'Otros',account:'Principal',active:true,type:'expense'}]}));}});
   const rp=await recurring.newPage();await rp.goto(base);await rp.locator('#recurring-setup').click();await rp.locator('[data-review-rec="1"]').uncheck();await rp.locator('#recurring-review-save').click();
   assert.equal(await rp.evaluate(()=>JSON.parse(localStorage.getItem('flowfi.public.v27')).transactions.length),1);await rp.reload();assert.equal(await rp.evaluate(()=>JSON.parse(localStorage.getItem('flowfi.public.v27')).transactions.length),1);
   await rp.locator('[data-route="plan"]').click();const title=rp.locator('.recurring-row .row-title').first();assert.ok((await title.innerText()).includes('FICTICIO Gimnasio mensual e inversión de Trade Republic'));assert.equal(await title.evaluate(e=>getComputedStyle(e).whiteSpace),'normal');assert.ok(await title.evaluate(e=>e.scrollWidth<=e.clientWidth+1));
   await title.scrollIntoViewIfNeeded();await rp.screenshot({path:path.join(out,'recurring-'+label+'.png'),fullPage:false});const historyBefore=await rp.evaluate(()=>JSON.stringify(JSON.parse(localStorage.getItem('flowfi.public.v27')).transactions));rp.once('dialog',dialog=>dialog.accept());await rp.locator('[data-delete-rec="browser-gym"]').click();await rp.reload();assert.equal(await rp.evaluate(()=>JSON.stringify(JSON.parse(localStorage.getItem('flowfi.public.v27')).transactions)),historyBefore);assert.equal(await rp.evaluate(()=>JSON.parse(localStorage.getItem('flowfi.public.v27')).recurring.some(r=>r.id==='browser-gym')),false);await recurring.close();
   evidence.runs[evidence.runs.length-1].checks.push('native recurring review and no duplicate after reload','complete multiline recurring title');
   await context.close();console.log('[OK] Real '+engine+' '+label+': finance, demo, calculator, layout and offline routes');
  }
  // Replay the public check unchanged against the candidate BEFORE deployment.
  await new Promise((resolve,reject)=>require('node:child_process').execFile(process.execPath,[path.join(__dirname,'public-release.test.cjs')],{env:{...process.env,LEDGER_TEST_BASE:base}},(error,stdout,stderr)=>{console.log(stdout);if(error)reject(Error(stderr||error.message));else resolve();}));
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
  await changeRevision(false);assert.equal(await page.evaluate(()=>window.LedgerAppVersion),'Beta 1.6.2');
  await changeRevision(true);assert.ok((await page.content()).includes("const APP_VERSION = 'Beta 1.6.0'"));
  evidence.upgradeRollback={from:'c1d4145 / Beta 1.6.0',to:'Beta 1.6.2',rollback:'Beta 1.6.0',sameOrigin:true,financialBackup:'byte-identical'};
  console.log('[OK] Actual service worker upgrade and rollback preserve fictional financial backup byte for byte');
  servingOld=false;await upgrade.close();
 }finally{await fs.writeFile(path.join(out,'evidence.json'),JSON.stringify(evidence,null,2)+'\n');await browser.close();}
})().catch(e=>{console.error(e);process.exitCode=1;}).finally(()=>server.close());
