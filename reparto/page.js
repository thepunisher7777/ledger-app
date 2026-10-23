(function(){
  'use strict';
  const $=id=>document.getElementById(id),api=window.LedgerSplit;
  const money=cent=>new Intl.NumberFormat('es-ES',{style:'currency',currency:'EUR'}).format(cent/100);
  const percent=value=>value===null?'Sin ingresos':new Intl.NumberFormat('es-ES',{style:'percent',maximumFractionDigits:1}).format(value);
  let example=false;
  function fill(prefix,result){
    for(const who of ['A','B']){
      $(prefix+'-'+who.toLowerCase()).textContent=money(result[who.toLowerCase()]);
      $(prefix+'-remaining-'+who.toLowerCase()).textContent='Después de aportar: '+money(result['remaining'+who]);
      $(prefix+'-effort-'+who.toLowerCase()).textContent=result['effort'+who]===null?'Sin ingresos: no se puede calcular el porcentaje de esfuerzo.':'Esfuerzo sobre sus ingresos: '+percent(result['effort'+who]);
    }
  }
  function run(event){
    event?.preventDefault();$('form-error').textContent='';$('share-status').textContent='';
    try{
      const values=Object.fromEntries(new FormData($('split-form'))),result=api.calculate(values);
      fill('equal',result.equal);
      $('total-common').textContent=money(result.total);
      $('empty-state').hidden=true;$('results').hidden=false;
      $('proportional-values').hidden=!result.proportional;$('no-income').hidden=!!result.proportional;
      if(result.proportional)fill('proportional',result.proportional);
      $('budget-warning').hidden=!result.overBudget;
      $('example-badge').hidden=!example;
      $('result-summary').focus({preventScroll:true});
    }catch(error){$('form-error').textContent=error.message;$('results').hidden=true;$('empty-state').hidden=false;}
  }
  $('split-form').addEventListener('submit',run);
  $('split-form').addEventListener('input',()=>{example=false;$('example-badge').hidden=true;$('results').hidden=true;$('empty-state').hidden=false;$('form-error').textContent='';});
  $('example').addEventListener('click',()=>{for(const [name,value]of Object.entries({incomeA:'1800',incomeB:'2400',rent:'1000',other:'250'}))$('split-form').elements.namedItem(name).value=value;example=true;run();});
  $('share-tool').addEventListener('click',async()=>{
    const payload=api.sharePayload();
    if(navigator.share){try{await navigator.share(payload);$('share-status').textContent='Herramienta compartida sin tus cifras.';return;}catch(error){if(error.name==='AbortError')return;}}
    try{await navigator.clipboard.writeText(payload.url);$('share-status').textContent='Enlace copiado. No contiene ingresos ni importes.';}
    catch{$('share-fallback').hidden=false;$('share-link').value=payload.url;$('share-link').focus();$('share-link').select();$('share-status').textContent='Copia este enlace: no contiene tus cifras.';}
  });
})();
