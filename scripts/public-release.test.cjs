// Ephemeral browser profile; consent denied BEFORE navigation. No real accounts.
const {chromium,webkit}=require('playwright-core'),assert=require('node:assert/strict'),fs=require('node:fs/promises');
const base=process.env.LEDGER_TEST_BASE||'https://thepunisher7777.github.io/ledger-app/';
if(process.env.LEDGER_TEST_BASE&&!/^http:\/\/127\.0\.0\.1:\d+\/ledger-app\/$/.test(base))throw Error('Only isolated loopback override is allowed');
(async()=>{
 const expectedHtml=await fs.readFile(require('node:path').join(__dirname,'../index.html'),'utf8'),expectedWorker=await fs.readFile(require('node:path').join(__dirname,'../sw.js'),'utf8');
 let ready=false;for(let i=0;i<60;i++){try{const [r,w]=await Promise.all([fetch(base,{cache:'no-store'}),fetch(base+'sw.js',{cache:'no-store'})]);if(r.ok&&w.ok&&(await r.text())===expectedHtml&&(await w.text())===expectedWorker){ready=true;break;}}catch{}await new Promise(r=>setTimeout(r,5000));}assert.ok(ready,'Pages did not publish this exact HTML and service worker within five minutes');
 const engine=process.env.BROWSER_ENGINE||'chromium',browser=engine==='webkit'?await webkit.launch({headless:true}):await chromium.launch({headless:true,executablePath:process.env.CHROME_BIN||undefined,channel:process.env.CHROME_BIN?undefined:'chrome'});
 try{
  const ctx=await browser.newContext({viewport:{width:390,height:844},isMobile:true,hasTouch:true,locale:'es-ES'}),blocked=[],errors=[];
  await ctx.addInitScript(()=>localStorage.setItem('ledger.analytics.consent.v1','no'));
  await ctx.route('**/*',r=>{const u=new URL(r.request().url());if(u.origin!==new URL(base).origin){blocked.push(u.origin);return r.abort();}return r.continue();});
  const page=await ctx.newPage();page.on('pageerror',e=>errors.push(e.message));page.on('dialog',d=>d.accept());
  await page.goto(base);assert.equal(await page.evaluate(()=>window.LedgerAppVersion),'Beta 1.6.2');await page.locator('#ledger-onboarding-start').click();
  await page.locator('#fab').click();await page.locator('#tx-amount').fill('0,01');await page.locator('#tx-note').fill('FICTICIO · validación de publicación');await page.locator('#save-transaction').click();
  await page.locator('[data-route="stats"]').click();await page.locator('#export-excel-stats').waitFor();
  console.log('[DIAG] '+JSON.stringify(await page.locator('[data-route="settings"]').evaluate(e=>{const r=e.getBoundingClientRect(),f=document.getElementById('fab').getBoundingClientRect();return{nav:{x:r.x,y:r.y,width:r.width,height:r.height},fab:{x:f.x,y:f.y,width:f.width,height:f.height},viewport:{width:innerWidth,height:innerHeight,scale:visualViewport?.scale},hit:document.elementFromPoint(r.x+r.width/2,r.y+r.height/2)?.tagName};})));
  await page.locator('[data-route="settings"]').click();const download=page.waitForEvent('download');await page.locator('#export-json').click();const file=await download;const exported=JSON.parse(await fs.readFile(await file.path(),'utf8'));assert.equal(exported.transactions.length,1);assert.equal(exported.transactions[0].amount,0.01);
  await page.reload();assert.equal(await page.evaluate(()=>JSON.parse(localStorage.getItem('flowfi.public.v27')).transactions.length),1);
  await page.goto(base+'reparto/');await page.locator('#example').click();assert.match(await page.locator('#total-common').innerText(),/1[.\s]?250,00/);
  await page.goto(base+'descubre/');await page.locator('#screens-title').waitFor();assert.equal(await page.locator('h1').count(),1);
  assert.deepEqual(errors,[]);assert.ok(!blocked.some(x=>/posthog|counterapi/.test(x)));
  await fs.mkdir('browser-artifacts',{recursive:true});await fs.writeFile('browser-artifacts/public-'+engine+'.json',JSON.stringify({engine,url:base,version:'Beta 1.6.2',checks:['published version','native transaction form','statistics','JSON export','local reload','calculator','landing','consent denied'],realFinancialDataUsed:false,remoteFinancialWrites:false},null,2));
  console.log('[OK] Published Beta 1.6.2: '+engine+' public UI, local fictional movement/export/reload, calculator, landing and denied telemetry');await ctx.close();
 }finally{await browser.close();}
})().catch(e=>{console.error(e);process.exitCode=1;});
