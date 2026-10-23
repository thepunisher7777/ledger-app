// Product-level scenarios only. No owner backup or real financial records.
const {JSDOM}=require('jsdom'),fs=require('node:fs'),assert=require('node:assert/strict');
let html=fs.readFileSync('index.html','utf8').replace(/<script src="[^"]+"><\/script>/g,'');
html=html.replace('<script>',['money.js','portfolio-import.js'].map(p=>'<script>'+fs.readFileSync(p,'utf8')+'</script>').join('')+'<script>');
html=html.replace("const now = new Date();","const now = new Date('2026-10-23T12:00:00');");
html=html.replace('render();refreshExchangeRates();analyticsMaybeAsk();maybeStartFlowFiMigration();if(bootRecoveryNotice)',"window.audit={defaultState,normalizeState,statsPulseData,upcoming30Snapshot,loanDueStatus,applyLiabilityPayment,validateBackupObject,accountProjectedBalance,periodTotals,getState:()=>state,setState:s=>state=s};render();if(bootRecoveryNotice)");
const dom=new JSDOM(html,{url:'https://fixture.test/',runScripts:'dangerously',beforeParse(w){w.localStorage.setItem('ledger.analytics.consent.v1','no');w.matchMedia=()=>({matches:false});w.fetch=async()=>{throw Error('No network');};w.HTMLDialogElement.prototype.showModal=function(){this.open=true;};}});
try{
 const a=dom.window.audit,s=a.normalizeState(a.defaultState());s.liabilities=[{id:'fictional-bike',name:'FICTICIO moto cancelada',balance:0,principalInitial:2000,payment:120,annualInterest:0,dueDay:24,paymentHistory:[]}];s.recurring=[{id:'fictional-rule',name:'FICTICIO regla pausada',active:false,type:'expense',amount:120,day:24,account:'Principal',category:'Otros'}];a.setState(s);
 assert.equal(a.statsPulseData(a.periodTotals()).commitmentsMonthly,0);assert.equal(a.upcoming30Snapshot().expenses,0);assert.equal(a.loanDueStatus(s.liabilities[0]).label,'Liquidado');assert.equal(s.recurring[0].active,false);
 console.log('[OK] Paid-off loan and consciously paused rule add no future commitments or overdue warning');
 const loan={id:'fictional-car',name:'FICTICIO coche',balance:1000,principalInitial:1000,payment:110,annualInterest:12,paymentHistory:[]};s.liabilities=[loan];const split=a.applyLiabilityPayment(loan.id,'fixture-payment',110,'2026-10-23');assert.equal(split.interest,10);assert.equal(split.principal,100);assert.equal(loan.balance,900);
 const restored=a.validateBackupObject(JSON.parse(JSON.stringify(s)));assert.equal(restored.liabilities[0].balance,900);assert.equal(restored.liabilities[0].paymentHistory.length,1);assert.equal(restored.liabilities[0].paymentHistory[0].principal,100);
 console.log('[OK] Car principal/interest history survives backup validation without reapplying repayment');
 s.transactions=[{id:'old',type:'expense',amount:400,account:'Principal',category:'Otros',currency:'EUR',date:'2026-10-20',createdAt:50},{id:'new',type:'expense',amount:20,account:'Principal',category:'Otros',currency:'EUR',date:'2026-10-23',createdAt:101}];assert.equal(a.accountProjectedBalance({name:'Principal',balance:1000,reconciledBalance:1000,reconciledAtMs:100}),980);
 console.log('[OK] Reconciled balance is an anchor; old history is not subtracted twice');
 s.transactions=[{id:'extra',type:'income',amount:2000,account:'Principal',category:'Otros',currency:'EUR',date:'2026-10-23'},{id:'cancel',type:'expense',amount:900,account:'Principal',category:'Otros',currency:'EUR',date:'2026-10-23'}];s.liabilities=[];assert.equal(a.periodTotals().income,2000);assert.equal(a.periodTotals().expenses,900);assert.equal(a.periodTotals().balance,1100);
 console.log('[OK] Extraordinary income and debt-cancellation cash flow remain explicit, independent transaction types');
}finally{dom.window.close();}
