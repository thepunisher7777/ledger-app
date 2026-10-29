(function(root,factory){const api=factory();if(typeof module==='object'&&module.exports)module.exports=api;else root.LedgerRecurring=api;})(typeof globalThis==='object'?globalThis:this,function(){
 'use strict';
 const occurrenceId=(id,cycle)=>'recurring-'+encodeURIComponent(id)+'-'+cycle;
 const clean=v=>String(v||'').trim().toLocaleLowerCase();
 function plan(rules,transactions,options){
  const {cycleKey,startISO,endISO,today,dateForDay}=options;
  const inCycle=t=>String(t.date)>=startISO&&String(t.date)<=endISO;
  return rules.map(rule=>{
   const date=dateForDay(rule.day),id=occurrenceId(rule.id,cycleKey),item={rule,date,id,cycleKey,candidates:[]};
   if(rule.active===false)return {...item,status:'paused'};
   if(rule.type==='income')return {...item,status:'manual-income'};
   if((Array.isArray(rule.skippedCycles)?rule.skippedCycles:[]).includes(cycleKey))return {...item,status:'skipped'};
   if(transactions.some(t=>t.id===id||(t.recurringId===rule.id&&(t.recurringCycle===cycleKey||inCycle(t)))))return {...item,status:'recorded'};
   // Legacy/manual imports may omit recurringId. Recognize exact descriptive matches;
   // leave other plausible matches for review rather than create a second expense.
   const matches=transactions.filter(t=>inCycle(t)&&t.type==='expense'&&!t.recurringId&&!t.liabilityId&&clean(t.account)===clean(rule.account)&&(t.currency||'EUR')===(rule.currency||'EUR')&&Math.abs(Number(t.amount)-Number(rule.amount))<0.005&&(clean(t.category)===clean(rule.category)||clean(t.note)===clean(rule.name)));
   if(matches.some(t=>clean(t.note)===clean(rule.name)))return {...item,status:'recorded'};
   if(matches.length)return {...item,status:'review',candidates:matches.map(t=>t.id)};
   return {...item,status:date<=today?'due':'pending'};
  });
 }
 return {plan,occurrenceId};
});
