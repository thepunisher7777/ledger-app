(function(root,factory){
  const api=factory();
  if(typeof module==='object'&&module.exports)module.exports=api;
  else root.LedgerSplit=api;
})(typeof globalThis!=='undefined'?globalThis:this,function(){
  'use strict';
  const MAX_CENTS=99999999999;
  function cents(value){
    const raw=String(value??'').trim();
    if(!/^\d+(?:[.,]\d{1,2})?$/.test(raw))throw Error('Introduce cantidades positivas o cero, con un máximo de dos decimales y sin separadores de miles.');
    const [whole,fraction='']=raw.replace(',','.').split('.');
    const total=Number(whole)*100+Number(fraction.padEnd(2,'0'));
    if(!Number.isSafeInteger(total)||total>MAX_CENTS)throw Error('La cantidad supera el límite de esta calculadora.');
    return total;
  }
  function calculate(values){
    const incomeA=cents(values.incomeA),incomeB=cents(values.incomeB),rent=cents(values.rent),other=cents(values.other);
    const total=rent+other,income=incomeA+incomeB;
    if(!Number.isSafeInteger(total)||!Number.isSafeInteger(income))throw Error('El total es demasiado grande.');
    const make=(a,b)=>({a,b,remainingA:incomeA-a,remainingB:incomeB-b,effortA:incomeA?a/incomeA:null,effortB:incomeB?b/incomeB:null});
    const firstHalf=Math.round(total/2);
    const proportional=income?Number((BigInt(total)*BigInt(incomeA)+BigInt(Math.floor(income/2)))/BigInt(income)):null;
    return {incomeA,incomeB,rent,other,total,income,equal:make(firstHalf,total-firstHalf),proportional:proportional===null?null:make(proportional,total-proportional),overBudget:total>income};
  }
  // This intentionally shares only the public tool, never form values or results.
  function sharePayload(){return{title:'Calculadora de gastos en pareja · Ledger',text:'Compara el reparto de gastos al 50/50 y proporcional a los ingresos, sin registro y con cálculos en tu dispositivo.',url:'https://thepunisher7777.github.io/ledger-app/reparto/'};}
  return{cents,calculate,sharePayload};
});
