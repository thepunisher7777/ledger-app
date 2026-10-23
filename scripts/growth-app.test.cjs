const {JSDOM}=require('jsdom');const fs=require('node:fs'),assert=require('node:assert/strict');
let html=fs.readFileSync('index.html','utf8').replace(/<script src="[^"]+"><\/script>/g,'');
html=html.replace('<script>',['money.js','portfolio-import.js'].map(p=>'<script>'+fs.readFileSync(p,'utf8')+'</script>').join('')+'<script>');
html=html.replace('render();refreshExchangeRates();analyticsMaybeAsk();maybeStartFlowFiMigration();if(bootRecoveryNotice)',"window.audit={defaultState,normalizeState,setRoute,saveBudget,openBudget,saveState,getState:()=>state,setState:s=>state=s};render();if(bootRecoveryNotice)");
const errors=[],milestones=[];const dom=new JSDOM(html,{url:'https://ledger.test/',runScripts:'dangerously',beforeParse(w){w.localStorage.setItem('ledger.analytics.consent.v1','no');w.matchMedia=()=>({matches:false});w.scrollTo=()=>{};w.confirm=()=>true;w.fetch=async()=>{throw Error('No network');};w.LedgerTelemetry={milestone:name=>milestones.push(name)};w.HTMLDialogElement.prototype.showModal=function(){this.open=true;};w.HTMLDialogElement.prototype.close=function(){this.open=false;};w.addEventListener('error',e=>errors.push(e.error));}});
try{
 const w=dom.window,a=w.audit,d=w.document;a.setState(a.normalizeState(a.defaultState()));a.saveState();
 const original=w.Storage.prototype.setItem;let blocked=false;w.Storage.prototype.setItem=function(k,v){if(blocked&&k==='flowfi.public.v27')throw Error('FICTITIOUS storage quota');return original.call(this,k,v);};w.console.error=()=>{};
 a.openBudget();d.getElementById('budget-amount').value='75';const before=JSON.stringify(a.getState().budgets);const durable=w.localStorage.getItem('flowfi.public.v27');blocked=true;a.saveBudget();
 assert.equal(JSON.stringify(a.getState().budgets),before);assert.equal(w.localStorage.getItem('flowfi.public.v27'),durable);assert.ok(d.getElementById('budget-dialog').open);assert.equal(milestones.length,0);
 blocked=false;a.saveBudget();assert.equal(d.getElementById('budget-dialog').open,false);assert.equal(milestones[0],'first-budget');assert.ok(Object.values(JSON.parse(w.localStorage.getItem('flowfi.public.v27')).budgets).includes(75));a.openBudget();d.getElementById('budget-amount').value='90';a.saveBudget();assert.equal(milestones.length,1);
 console.log('[OK] Failed budget persistence rolls back memory, preserves durable data and emits no success; retry saves');
 a.setRoute('settings');const cycle=a.getState().settings.cycleStartDay;blocked=true;d.getElementById('cycle-start-day').value=String(cycle===28?1:28);d.getElementById('cycle-start-day').dispatchEvent(new w.Event('change'));assert.equal(a.getState().settings.cycleStartDay,cycle);
 assert.deepEqual(errors,[]);console.log('[OK] Cycle configuration is also transactional on storage failure');
}finally{dom.window.close();}
