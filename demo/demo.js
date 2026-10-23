// Deliberately standalone: no storage, network, auth, imports or telemetry APIs.
(function () {
  'use strict';
  const $ = id => document.getElementById(id);
  const currency = n => new Intl.NumberFormat('es-ES', { style:'currency', currency:'EUR' }).format(n / 100);
  const date = new Date();
  const today = new Date(date.getTime() - date.getTimezoneOffset() * 60000).toISOString().slice(0,10);
  const seed = () => [
    {id:'sample-income', type:'income', amount:210000, note:'Nómina de ejemplo', category:'Salario', date:today},
    {id:'sample-rent', type:'expense', amount:65000, note:'Alquiler de ejemplo', category:'Casa', date:today},
    {id:'sample-food', type:'expense', amount:8650, note:'Compra de ejemplo', category:'Comida', date:today},
    {id:'sample-transport', type:'expense', amount:2800, note:'Transporte de ejemplo', category:'Transporte', date:today},
  ];
  let items = seed(), budget = 30000, editing = null, next = 0;
  function node(tag, className, text) { const n = document.createElement(tag); if(className)n.className=className;if(text!==undefined)n.textContent=text;return n; }
  function amount(value) { const n=Number(value); if(!Number.isFinite(n)||n<=0||n>1000000)return null;return Math.round(n*100); }
  function validDate(value) { if(!/^\d{4}-\d{2}-\d{2}$/.test(value))return false;const d=new Date(value+'T12:00:00');return Number.isFinite(d.getTime())&&d.getFullYear()===Number(value.slice(0,4))&&d.getMonth()+1===Number(value.slice(5,7))&&d.getDate()===Number(value.slice(8,10)); }
  function announce(message) { $('demo-status').textContent=message; }
  function render() {
    const income=items.filter(x=>x.type==='income').reduce((sum,x)=>sum+x.amount,0);
    const expenses=items.filter(x=>x.type==='expense');
    const spent=expenses.reduce((sum,x)=>sum+x.amount,0);
    $('income').textContent=currency(income);$('expense').textContent=currency(spent);$('balance').textContent=currency(income-spent);
    const food=expenses.filter(x=>x.category==='Comida').reduce((sum,x)=>sum+x.amount,0);
    $('budget-spent').textContent=currency(food);$('budget-limit').textContent='de '+currency(budget);
    $('budget-progress').style.width=Math.min(100,food/budget*100)+'%';
    $('budget-progress').style.background=food>budget?'var(--bad)':'var(--accent)';
    $('budget-state').textContent=food>budget?'Presupuesto del ejemplo superado en '+currency(food-budget):'Quedan '+currency(budget-food)+' en este ejemplo.';
    $('transactions').replaceChildren();
    for(const item of [...items].sort((a,b)=>b.date.localeCompare(a.date))){
      const row=node('article','transaction');
      const edit=node('button','edit-transaction');edit.type='button';edit.dataset.edit=item.id;
      edit.setAttribute('aria-label','Editar '+item.note);edit.append(node('strong','',item.note),node('span','',item.category+' · '+new Date(item.date+'T12:00:00').toLocaleDateString('es-ES')));edit.onclick=()=>open(item);
      const value=node('span','transaction-amount '+item.type,(item.type==='income'?'+':'−')+currency(item.amount));
      const remove=node('button','delete-transaction','×');remove.type='button';remove.dataset.remove=item.id;remove.setAttribute('aria-label','Eliminar '+item.note);remove.onclick=()=>{items=items.filter(x=>x.id!==item.id);render();announce('Movimiento ficticio eliminado.');};
      row.append(edit,value,remove);$('transactions').append(row);
    }
    if(!items.length)$('transactions').append(node('p','hint','No quedan movimientos en esta demo. Añade uno o reinicia el ejemplo.'));
    const categories=new Map();expenses.forEach(x=>categories.set(x.category,(categories.get(x.category)||0)+x.amount));
    $('categories').replaceChildren();for(const [name,total] of [...categories.entries()].sort((a,b)=>b[1]-a[1])){const row=node('div','category-row');row.append(node('span','',name),node('strong','',currency(total)));$('categories').append(row);}
    if(!categories.size)$('categories').append(node('p','hint','Añade un gasto para ver el reparto.'));
  }
  function open(item=null) {
    editing=item?.id||null;$('movement-title').textContent=item?'Editar movimiento ficticio':'Añadir movimiento ficticio';
    $('movement-type').value=item?.type||'expense';$('movement-note').value=item?.note||'';
    $('movement-amount').value=item?String(item.amount/100):'';$('movement-date').value=item?.date||today;$('movement-category').value=item?.category||'Comida';$('form-error').textContent='';$('movement-dialog').showModal();$('movement-note').focus();
  }
  $('add-demo').onclick=()=>open();$('close-dialog').onclick=()=>$('movement-dialog').close();
  $('movement-form').onsubmit=e=>{
    e.preventDefault();const total=amount($('movement-amount').value), note=$('movement-note').value.trim(), when=$('movement-date').value;
    if(total===null||!note||!validDate(when)){$('form-error').textContent='Introduce una descripción, una fecha válida y un importe entre 0,01 y 1.000.000 €.';return;}
    const item={id:editing||'practice-'+(++next),type:$('movement-type').value==='income'?'income':'expense',amount:total,note:note.slice(0,80),date:when,category:$('movement-category').value};
    if(editing)items=items.map(x=>x.id===editing?item:x);else items.push(item);
    render();$('movement-dialog').close();announce('Movimiento ficticio guardado.');
  };
  $('budget-form').onsubmit=e=>{e.preventDefault();const value=amount($('budget-input').value);if(value===null){announce('Introduce un presupuesto válido.');return;}budget=value;render();announce('Presupuesto ficticio actualizado.');};
  $('reset-demo').onclick=()=>{items=seed();budget=30000;editing=null;next=0;$('budget-input').value='300';render();announce('Demo reiniciada.');};
  render();
})();
