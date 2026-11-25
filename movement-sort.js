(function(root,factory){const api=factory();if(typeof module==='object'&&module.exports)module.exports=api;else root.LedgerMovementSort=api;})(typeof globalThis==='object'?globalThis:this,function(){
 'use strict';
 const modes=['date-desc','date-asc','amount-desc','amount-asc'];
 function sort(items,mode='date-desc',amount=t=>t.amount,date=t=>t.date,id=t=>t.id){
  if(!modes.includes(mode))mode='date-desc';
  return items.map((item,index)=>({item,index})).sort((a,b)=>{
   if(mode.startsWith('amount-')){const x=Math.abs(amount(a.item)),y=Math.abs(amount(b.item)),xf=Number.isFinite(x),yf=Number.isFinite(y);if(xf!==yf)return xf?-1:1;if(xf&&x!==y)return (x-y)*(mode==='amount-asc'?1:-1);}
   const byDate=String(date(a.item)||'').localeCompare(String(date(b.item)||''));if(byDate)return byDate*(mode==='date-asc'?1:-1);
   const timestamp=t=>Number(t.createdAt)||Date.parse(t.created_at)||0,time=timestamp(a.item)-timestamp(b.item);if(time)return time*(mode==='date-asc'?1:-1);
   return String(id(a.item)||'').localeCompare(String(id(b.item)||''))||a.index-b.index;
  }).map(x=>x.item);
 }
 return {sort,modes};
});
