// Real browser, isolated contexts and local files only. Never reaches production/Auth.
const {chromium}=require('playwright-core');
const http=require('node:http'),fs=require('node:fs/promises'),path=require('node:path'),assert=require('node:assert/strict');
const root=path.resolve(__dirname,'..'),out=path.join(root,'browser-artifacts');
const mime={'.html':'text/html; charset=utf-8','.js':'text/javascript; charset=utf-8','.css':'text/css; charset=utf-8','.png':'image/png','.webmanifest':'application/manifest+json'};
const server=http.createServer(async(req,res)=>{
 try{
  const pathname=decodeURIComponent(new URL(req.url,'http://localhost').pathname);
  if(!pathname.startsWith('/ledger-app/')){res.writeHead(404);res.end();return;}
  let file=path.resolve(root,pathname.slice('/ledger-app/'.length)||'index.html');
  if(!file.startsWith(root+path.sep)){res.writeHead(403);res.end();return;}
  if((await fs.stat(file)).isDirectory())file=path.join(file,'index.html');
  res.writeHead(200,{'Content-Type':mime[path.extname(file)]||'application/octet-stream','Cache-Control':'no-store'});res.end(await fs.readFile(file));
 }catch{res.writeHead(404);res.end();}
});
(async()=>{
 await fs.mkdir(out,{recursive:true});await new Promise(r=>server.listen(0,'127.0.0.1',r));
 const origin='http://127.0.0.1:'+server.address().port,base=origin+'/ledger-app/';
 const browser=await chromium.launch({channel:process.env.CHROME_BIN?undefined:'chrome',executablePath:process.env.CHROME_BIN||undefined,headless:true});
 const evidence={engine:await browser.version(),scope:'Chromium desktop + mobile emulation, not Safari or a physical iPhone',runs:[]};
 try{
  for(const [label,viewport]of [['mobile',{width:390,height:844}],['desktop',{width:1440,height:1000}]]){
   const context=await browser.newContext({viewport,isMobile:label==='mobile',hasTouch:label==='mobile',locale:'es-ES',timezoneId:'Europe/Madrid'});
   const blocked=[],errors=[];await context.route('**/*',route=>{const url=new URL(route.request().url());if(url.origin!==origin){blocked.push(url.origin);return route.abort();}return route.continue();});
   const page=await context.newPage();page.on('pageerror',e=>errors.push(e.message));
   const fit=async()=>assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1),'Horizontal overflow: '+page.url());
   await page.goto(base);await page.locator('#ledger-onboarding-dialog[open]').waitFor();await page.locator('#ledger-onboarding-start').click();
   await page.locator('#analytics-dialog[open]').waitFor();await page.locator('#analytics-decline').click();
   await page.locator('#fab').click();await page.locator('#tx-amount').fill('12,34');await page.locator('#tx-note').fill('FICTICIO · compra de ejemplo');await page.locator('#save-transaction').click();
   const saved=await page.evaluate(()=>localStorage.getItem('flowfi.public.v27'));assert.equal(JSON.parse(saved).transactions[0].amount,12.34);
   await fit();await page.screenshot({path:path.join(out,'ledger-home-'+label+'.png'),fullPage:false});
   await page.locator('[data-route="stats"]').click();await page.locator('#export-excel-stats').waitFor();await fit();
   await page.reload();assert.equal(await page.evaluate(()=>localStorage.getItem('flowfi.public.v27')),saved);
   await page.goto(base+'demo/');await page.locator('#add-demo').click();await page.locator('#movement-note').fill('FICTICIO · práctica');await page.locator('#movement-amount').fill('19.99');await page.locator('#movement-form button[type="submit"]').click();
   assert.ok((await page.locator('#transactions').innerText()).includes('FICTICIO · práctica'));await fit();assert.equal(await page.evaluate(()=>localStorage.getItem('flowfi.public.v27')),saved);
   await page.screenshot({path:path.join(out,'demo-'+label+'.png'),fullPage:false});
   await page.goto(base+'reparto/');await page.locator('#example').click();assert.match(await page.locator('#total-common').innerText(),/1[.\s]?250,00/);await fit();await page.screenshot({path:path.join(out,'calculator-'+label+'.png'),fullPage:true});
   assert.equal(await page.evaluate(()=>localStorage.getItem('flowfi.public.v27')),saved);
   await page.goto(base+'descubre/');await fit();await page.screenshot({path:path.join(out,'landing-'+label+'.png'),fullPage:true});
   // Wait for the actual service worker to control this context, then exercise real offline navigations.
   await page.evaluate(()=>navigator.serviceWorker.ready);await page.reload();await page.waitForFunction(()=>navigator.serviceWorker.controller!==null);
   await context.setOffline(true);
   await page.goto(base+'demo/');await page.locator('#add-demo').waitFor();
   await page.goto(base+'reparto/');await page.locator('#example').click();assert.match(await page.locator('#total-common').innerText(),/1[.\s]?250,00/);
   await page.goto(base);await page.locator('#fab').waitFor();assert.equal(await page.evaluate(()=>localStorage.getItem('flowfi.public.v27')),saved);
   assert.deepEqual(errors,[]);assert.ok(!blocked.some(x=>/posthog|counterapi/.test(x)),'Telemetry attempted without consent');
   evidence.runs.push({label,viewport,checks:['native onboarding/dialogs','transaction save/reload','statistics navigation','isolated demo CRUD','local calculator','no horizontal overflow','real service worker offline routes','no finance overwrite','no analytics without consent'],blockedExternalOrigins:[...new Set(blocked)]});
   await context.close();console.log('[OK] Real Chrome '+label+': finance, demo, calculator, layout and offline routes');
  }
 }finally{await fs.writeFile(path.join(out,'evidence.json'),JSON.stringify(evidence,null,2)+'\n');await browser.close();}
})().catch(e=>{console.error(e);process.exitCode=1;}).finally(()=>server.close());
