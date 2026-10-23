// Actual DOM and application handlers. Every finance value below is fictitious.
const {JSDOM}=require('jsdom');
const fs=require('node:fs'),assert=require('node:assert/strict');
const rootHtml=fs.readFileSync('index.html','utf8');
const local=new Set(['money.js','portfolio-import.js','ledger-onboarding.js']);
let html=rootHtml.replace(/<script src="([^"]+)"><\/script>/g,(_,file)=>local.has(file)?'<script>'+fs.readFileSync(file,'utf8')+'</script>':'');
html=html.replace('render();refreshExchangeRates();analyticsMaybeAsk();maybeStartFlowFiMigration();if(bootRecoveryNotice)','window.audit={setRoute,getState:()=>state};render();refreshExchangeRates();analyticsMaybeAsk();maybeStartFlowFiMigration();if(bootRecoveryNotice)');
const key='flowfi.public.v27';
function fixtures(w){
 w.matchMedia=()=>({matches:false,addEventListener(){}});w.scrollTo=()=>{};w.confirm=()=>true;
 w.fetch=async()=>{throw Error('No external network in tests');};
 w.HTMLDialogElement.prototype.showModal=function(){this.open=true;};
 w.HTMLDialogElement.prototype.close=function(){this.open=false;};
}
function openApp(saved={}){
 const errors=[];const dom=new JSDOM(html,{url:'https://ledger.test/',runScripts:'dangerously',pretendToBeVisual:true,beforeParse(w){fixtures(w);Object.entries(saved).forEach(([k,v])=>w.localStorage.setItem(k,v));w.addEventListener('error',e=>errors.push(e.error));}});
 return {dom,w:dom.window,errors};
}
const delay=ms=>new Promise(r=>setTimeout(r,ms));
(async()=>{
 let page;
 try{
  page=openApp();let w=page.w;
  assert.ok(w.document.getElementById('ledger-onboarding-dialog').open);
  assert.equal(w.document.querySelectorAll('#ledger-onboarding-dialog section').length,3);
  assert.equal(w.localStorage.getItem(key),null);
  await delay(720);assert.equal(w.document.getElementById('analytics-dialog').open,false,'consent must not cover the guide');
  assert.equal(w.document.getElementById('ledger-onboarding-demo').getAttribute('href'),'demo/');
  w.document.getElementById('ledger-onboarding-start').click();assert.equal(w.localStorage.getItem('ledger.onboarding.v1'),'done');assert.equal(w.localStorage.getItem(key),null);
  page.dom.window.close();page=openApp({'ledger.onboarding.v1':'done'});w=page.w;assert.equal(w.document.getElementById('ledger-onboarding-dialog'),null);
  console.log('[OK] Fresh-user three-step guide, separate demo link, dismissal and repeat-open behavior');
  page.dom.window.close();
  const personal=JSON.stringify({version:2,settings:{currency:'EUR',cycleStartDay:28,weekStartsOn:1},accounts:['Principal'],accountDetails:[{name:'Principal',type:'Banco',balance:500}],transactions:[{id:'fictional-private-onboarding',type:'expense',amount:15,date:'2026-10-20',currency:'EUR',category:'Comida',account:'Principal',note:'PRIVATE_FICTITIOUS_SENTINEL'}],recurring:[],goals:[],liabilities:[],budgets:{},customCategories:[],source:null});
  page=openApp({[key]:personal,[key+'.safety']:'PRIVATE_FICTITIOUS_SAFETY','ledger.analytics.consent.v1':'no'});w=page.w;
  assert.equal(w.document.getElementById('ledger-onboarding-dialog'),null,'existing user should not be interrupted');
  w.audit.setRoute('settings');w.document.getElementById('ledger-guide-open').click();assert.ok(w.LedgerOnboarding.isOpen());w.document.getElementById('ledger-onboarding-start').click();
  assert.equal(w.localStorage.getItem(key),personal);assert.equal(w.localStorage.getItem(key+'.safety'),'PRIVATE_FICTITIOUS_SAFETY');assert.deepEqual(page.errors,[]);
  console.log('[OK] Existing user can reopen guide from Settings without changing personal data or safety backup');
 }finally{page?.dom.window.close();}
 const js=fs.readFileSync('demo/demo.js','utf8');
 let calls=0;const demoHtml=fs.readFileSync('demo/index.html','utf8').replace('<script src="demo.js"></script>','<script>'+js+'</script>');
 const dom=new JSDOM(demoHtml,{url:'https://ledger.test/demo/',runScripts:'dangerously',beforeParse(w){fixtures(w);w.localStorage.setItem(key,'PRIVATE_FICTITIOUS_DEMO_SENTINEL');w.localStorage.setItem('ledger.couple.auth.v1:test','PRIVATE_FICTITIOUS_TOKEN_SENTINEL');w.fetch=()=>{calls++;throw Error('Demo must not make network calls');};}});
 try{
  const w=dom.window,d=w.document,initialBalance=d.getElementById('balance').textContent;
  d.getElementById('add-demo').click();d.getElementById('movement-note').value='FICTITIOUS practice expense';d.getElementById('movement-amount').value='20';d.getElementById('movement-date').value='2026-10-20';d.getElementById('movement-form').dispatchEvent(new w.Event('submit',{cancelable:true}));
  assert.equal(d.querySelectorAll('[data-edit]').length,5);assert.notEqual(d.getElementById('balance').textContent,initialBalance);assert.ok(d.getElementById('budget-spent').textContent.includes('106,50'));
  d.querySelector('[data-edit="practice-1"]').click();d.getElementById('movement-amount').value='30';d.getElementById('movement-form').dispatchEvent(new w.Event('submit',{cancelable:true}));assert.ok(d.getElementById('budget-spent').textContent.includes('116,50'));
  d.getElementById('budget-input').value='100';d.getElementById('budget-form').dispatchEvent(new w.Event('submit',{cancelable:true}));assert.match(d.getElementById('budget-state').textContent,/superado/);
  d.querySelector('[data-remove="practice-1"]').click();assert.equal(d.querySelectorAll('[data-edit]').length,4);
  d.getElementById('reset-demo').click();assert.equal(d.getElementById('balance').textContent,initialBalance);assert.equal(d.getElementById('budget-input').value,'300');
  assert.equal(w.localStorage.getItem(key),'PRIVATE_FICTITIOUS_DEMO_SENTINEL');assert.equal(w.localStorage.getItem('ledger.couple.auth.v1:test'),'PRIVATE_FICTITIOUS_TOKEN_SENTINEL');assert.equal(w.localStorage.length,2);assert.equal(calls,0);
  for(const forbidden of ['localStorage','sessionStorage','indexedDB','fetch(','XMLHttpRequest','posthog','supabase','serviceWorker'])assert.ok(!js.includes(forbidden),'standalone demo must not contain '+forbidden);
  console.log('[OK] Demo add/edit/delete, budget and reset work in memory without reading/writing personal/Auth storage or making requests');
 }finally{dom.window.close();}
})().catch(e=>{console.error(e);process.exitCode=1;});
