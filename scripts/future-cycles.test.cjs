// Actual Ledger handlers, synthetic local data only; deterministic financial date.
const {JSDOM}=require('jsdom');
const fs=require('node:fs'),assert=require('node:assert/strict');
const exposed=['defaultState','normalizeState','setRoute','render','availableCycleMonths','monthKey','cycleBounds','currentCycleMonth','periodTransactions','openTransaction','saveTransaction'];
let html=fs.readFileSync('index.html','utf8').replace(/<script src="[^"]+"><\/script>/g,'');
html=html.replace('<script>',['money.js','portfolio-import.js'].map(p=>'<script>'+fs.readFileSync(p,'utf8')+'</script>').join('')+'<script>');
html=html.replace('const now = new Date();',"const now = new Date('2026-10-23T12:00:00');");
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
 const s=a.normalizeState(a.defaultState());s.settings.cycleStartDay=28;
 s.recurring=[{id:'fictitious-gym',name:'FICTICIO Gym',amount:34.99,currency:'EUR',day:28,type:'expense',category:'Deportes',account:'Principal',active:true}];
 s.transactions=[
  {id:'gym-recorded',type:'expense',date:'2026-10-28',amount:34.99,currency:'EUR',category:'Deportes',account:'Principal',note:'FICTICIO gimnasio recurrente',recurringId:'fictitious-gym',createdAt:1},
  {id:'gym-duplicate',type:'expense',date:'2026-10-28',amount:34.99,currency:'EUR',category:'Deportes',account:'Principal',note:'FICTICIO gimnasio duplicado',createdAt:2},
  {id:'history',type:'income',date:'2010-02-12',amount:100,currency:'EUR',category:'Salario',account:'Principal',note:'FICTICIO historia'},
  {id:'far-future',type:'expense',date:'2042-12-28',amount:1,currency:'EUR',category:'Otros',account:'Principal',note:'FICTICIO futuro lejano'}
 ];
 a.setState(s);a.setRoute('transactions');const recurringBefore=JSON.stringify(a.getState().recurring);
 menu();assert.ok(d.querySelector('[data-month-value="2027-10"]'));assert.ok(d.querySelector('[data-month-value="2043-01"]'));assert.ok(d.querySelector('[data-month-value="2010-02"]'));
 choose('2026-11');assert.equal(a.cycleBounds().startISO,'2026-10-28');assert.equal(a.cycleBounds().endISO,'2026-11-27');assert.equal(a.periodTransactions().length,2);
 assert.ok(d.querySelector('[data-edit-tx="gym-duplicate"]'));assert.ok(d.querySelector('[data-edit-tx="gym-recorded"]'));
 console.log('[OK] Future and far-recorded cycles are reachable; payday boundary includes October 28 in November');
 const beforeNavigation=JSON.stringify(a.getState());
 menu();d.querySelector('[data-month-step="1"]').click();assert.equal(a.monthKey(a.getMonth()),'2026-12');d.querySelector('[data-month-step="1"]').click();assert.equal(a.monthKey(a.getMonth()),'2027-01');d.querySelector('[data-month-step="-1"]').click();assert.equal(a.monthKey(a.getMonth()),'2026-12');
 jump('2035-02');assert.equal(a.monthKey(a.getMonth()),'2035-02');a.setRoute('plan');a.setRoute('stats');assert.equal(JSON.stringify(a.getState()),beforeNavigation);
 console.log('[OK] Next/previous across years and direct far-month selection never create or modify financial records');
 a.setRoute('transactions');choose('2026-11');d.querySelector('[data-edit-tx="gym-duplicate"]').click();assert.equal(d.getElementById('tx-date').value,'2026-10-28');
 d.getElementById('tx-note').value='FICTICIO corrección';d.getElementById('tx-amount').value='35,99';d.getElementById('tx-date').value='2026-10-29';d.getElementById('save-transaction').click();
 assert.equal(a.getState().transactions.find(t=>t.id==='gym-duplicate').date,'2026-10-29');assert.equal(a.getState().transactions.find(t=>t.id==='gym-duplicate').amount,35.99);assert.equal(JSON.stringify(a.getState().recurring),recurringBefore);
 d.querySelector('[data-delete-tx="gym-duplicate"]').click();assert.ok(!a.getState().transactions.some(t=>t.id==='gym-duplicate'));assert.ok(a.getState().transactions.some(t=>t.id==='gym-recorded'));assert.equal(JSON.stringify(a.getState().recurring),recurringBefore);
 let persisted=JSON.parse(w.localStorage.getItem('flowfi.public.v27'));assert.ok(!persisted.transactions.some(t=>t.id==='gym-duplicate'));assert.equal(persisted.recurring.length,1);
 d.getElementById('undo-delete').click();assert.ok(a.getState().transactions.some(t=>t.id==='gym-duplicate'));assert.equal(JSON.stringify(a.getState().recurring),recurringBefore);
 console.log('[OK] Actual future-transaction edit/delete/undo persists changes and preserves the recurring rule and other occurrence');
 a.getState().settings.cycleStartDay=1;choose('2026-10');assert.equal(a.periodTransactions().length,2);assert.equal(a.cycleBounds().startISO,'2026-10-01');
 a.getState().settings.cycleStartDay=15;menu();assert.ok(d.querySelector('[data-month-value="2026-11"]'));choose('2026-11');assert.equal(a.cycleBounds().startISO,'2026-10-15');assert.equal(a.periodTransactions().length,2);
 const invalidBefore=a.monthKey(a.getMonth());jump('');assert.equal(a.monthKey(a.getMonth()),invalidBefore);
 choose('2026-10');assert.equal(a.monthKey(a.getMonth()),'2026-10');assert.deepEqual(errors,[]);
 console.log('[OK] Calendar months, custom payday cycles, invalid input and return to current cycle work without runtime errors');
  w.eval(fs.readFileSync('i18n.js','utf8'));
  for(const [lang,label] of Object.entries({en:'Go to month or cycle',fr:'Aller au mois ou au cycle',de:'Zu Monat oder Zyklus wechseln',it:'Vai al mese o al ciclo',pt:'Ir para mês ou ciclo'})){
    w.localStorage.setItem('ledger.ui.language.v1',lang);
    assert.equal(w.LedgerI18n.t('Ir a mes o ciclo'),label);
  }
  console.log('[OK] New navigation labels are translated in all supported languages');
}finally{w.close();}
