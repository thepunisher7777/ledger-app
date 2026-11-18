// Actual Ledger handlers, synthetic local data only; deterministic financial date.
const {JSDOM}=require('jsdom');
const fs=require('node:fs'),assert=require('node:assert/strict');
const exposed=['defaultState','normalizeState','setRoute','render','availableCycleMonths','monthKey','cycleBounds','currentCycleMonth','periodTransactions','openTransaction','saveTransaction','selectCycleMonth','periodTotals','defaultTransactionDate'];
let html=fs.readFileSync('index.html','utf8').replace(/<script src="[^"]+"><\/script>/g,'');
html=html.replace('<script>',['money.js','portfolio-import.js'].map(p=>'<script>'+fs.readFileSync(p,'utf8')+'</script>').join('')+'<script>');
html=html.replace('const now = new Date();',"const now = new Date('2026-11-18T12:00:00');");
html=html.replace('render();refreshExchangeRates();analyticsMaybeAsk();maybeStartFlowFiMigration();if(bootRecoveryNotice)',`window.audit={${exposed.join(',')},getState:()=>state,setState:s=>state=s,getMonth:()=>selectedMonth};render();if(bootRecoveryNotice)`);
const errors=[];
const dom=new JSDOM(html,{url:'https://ledger.test/',runScripts:'dangerously',pretendToBeVisual:true,beforeParse(w){
 w.localStorage.setItem('ledger.analytics.consent.v1','no');w.matchMedia=()=>({matches:false,addEventListener(){}});w.scrollTo=()=>{};w.confirm=()=>true;
 w.HTMLDialogElement.prototype.showModal=function(){this.open=true;};w.HTMLDialogElement.prototype.close=function(){this.open=false;};
 w.fetch=async()=>{throw Error('No external network in fixture');};w.addEventListener('error',e=>errors.push(e.error));
}});
const w=dom.window,d=w.document,a=w.audit;
const menu=()=>{if(!d.getElementById('month-menu-wrap').classList.contains('open'))d.getElementById('month-button').click();};
const choose=value=>{menu();const item=d.querySelector('[data-month-value="'+value+'"]');assert.ok(item,'missing month '+value);item.click();};
const jump=value=>{menu();d.getElementById('month-jump').value=value;d.querySelector('[data-month-jump]').click();};
try{
 const s=a.normalizeState(a.defaultState());s.settings.cycleStartDay=28;s.transactions=[{id:'fict-recovery',type:'income',date:'2026-10-20',amount:640,currency:'EUR',category:'Otros ingresos',account:'Principal',note:'FICTICIO devolución prevista'},{id:'fict-salary',type:'income',date:'2026-10-28',amount:2400,currency:'EUR',category:'Salario',account:'Principal',note:'FICTICIO nómina noviembre'}];a.setState(s);a.setRoute('transactions');choose('2026-11');const november=JSON.stringify(a.periodTotals());choose('2026-10');a.openTransaction('expense');assert.equal(d.getElementById('tx-date').value,'2026-10-27');assert.match(d.getElementById('tx-cycle-hint').textContent,/Octubre de 2026/);d.getElementById('tx-amount').value='640';d.getElementById('tx-note').value='FICTICIO corrección devolución no recibida';a.saveTransaction();assert.equal(a.periodTotals().expenses,640);assert.equal(a.periodTotals().balance,0);const correction=a.getState().transactions.at(-1);assert.equal(correction.date,'2026-10-27');choose('2026-11');assert.equal(JSON.stringify(a.periodTotals()),november);
 console.log('[OK] Backdated 640 correction defaults inside October 28–27 cycle and leaves November financial totals unchanged');
 choose('2026-10');a.openTransaction('expense');d.getElementById('tx-amount').value='10';d.getElementById('tx-date').value='2026-10-28';d.getElementById('tx-date').dispatchEvent(new w.Event('input'));assert.match(d.getElementById('tx-cycle-hint').textContent,/Noviembre de 2026/);assert.match(d.getElementById('tx-cycle-hint').textContent,/fuera/);const count=a.getState().transactions.length;w.confirm=()=>false;a.saveTransaction();assert.equal(a.getState().transactions.length,count);assert.ok(d.getElementById('transaction-dialog').open);w.confirm=()=>true;a.saveTransaction();assert.equal(a.getState().transactions.at(-1).date,'2026-10-28');
 console.log('[OK] Payday boundary is explained before save; cross-cycle confirmation can cancel or consciously save without changing the chosen date');
 choose('2026-11');assert.equal(a.defaultTransactionDate(),'2026-11-18');choose('2027-01');a.openTransaction('transfer');assert.equal(d.getElementById('tx-transfer-date').value,'2026-12-28');d.getElementById('transaction-dialog').close();choose('2026-10');a.openTransaction(null,'fict-salary');assert.equal(d.getElementById('tx-date').value,'2026-10-28');d.getElementById('transaction-dialog').close();
 a.getState().settings.cycleStartDay=1;assert.equal(a.defaultTransactionDate(),'2026-10-31');a.getState().settings.cycleStartDay=15;assert.equal(a.defaultTransactionDate(),'2026-10-14');a.getState().settings.cycleStartDay=28;
 console.log('[OK] Current/future/historical default dates honor cycle 1/15/28; editing preserves original dates and transfers use the selected cycle');
 choose('2026-11');menu();const keys=Array.from(d.querySelectorAll('.month-options [data-month-value]'),e=>e.dataset.monthValue);assert.deepEqual(keys,keys.slice().sort());assert.equal(keys.filter(k=>k==='2026-11').length,1);const i=keys.indexOf('2026-10');assert.deepEqual(keys.slice(i,i+4),['2026-10','2026-11','2026-12','2027-01']);assert.ok(d.querySelector('.month-options [data-month-value="2026-11"].active'));d.querySelector('[data-month-step="1"]').click();assert.equal(a.monthKey(a.getMonth()),'2026-12');d.querySelector('[data-month-step="1"]').click();assert.equal(a.monthKey(a.getMonth()),'2027-01');jump('2030-01');menu();assert.ok(d.querySelector('[data-month-value="2029-12"]'));assert.ok(d.querySelector('[data-month-value="2030-02"]'));assert.deepEqual(errors,[]);
 console.log('[OK] Cycle list is chronological, unique and includes consecutive October/November/December/January, with adjacent cycles even after distant jumps');
}finally{w.close();}
