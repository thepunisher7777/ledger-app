const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs'),path=require('node:path');
const {JSDOM}=require(process.env.LEDGER_JSDOM_PATH||'jsdom');
const Split=require('../reparto/calculator.js');
const root=path.resolve(__dirname,'..');
test('Spanish/decimal inputs and strict validation',()=>{
 assert.equal(Split.cents(' 1234,56 '),123456);assert.equal(Split.cents('1234.56'),123456);assert.equal(Split.cents('0'),0);assert.equal(Split.cents('1.2'),120);
 for(const value of ['','-1','NaN','Infinity','1,234.56','1.234,56','2.345','1e3','<script>','1000000000'])assert.throws(()=>Split.cents(value),value);
});
test('Proportional split rounds to cents and sums exactly',()=>{
 const x=Split.calculate({incomeA:'1800',incomeB:'2400',rent:'1000',other:'250'});
 assert.equal(x.total,125000);assert.deepEqual([x.equal.a,x.equal.b],[62500,62500]);assert.deepEqual([x.proportional.a,x.proportional.b],[53571,71429]);assert.equal(x.proportional.a+x.proportional.b,x.total);
 assert.equal(x.proportional.remainingA,126429);assert.equal(x.proportional.remainingB,168571);
 for(let a=0;a<23;a++)for(let b=0;b<23;b++){
  const r=Split.calculate({incomeA:String(a),incomeB:String(b),rent:'3.17',other:'0.02'});assert.equal(r.equal.a+r.equal.b,r.total);if(r.proportional){assert.equal(r.proportional.a+r.proportional.b,r.total);assert.ok(r.proportional.a>=0&&r.proportional.b>=0);}
 }
});
test('Zero incomes, one payer, odd cent and negative remaining income are explicit',()=>{
 const zero=Split.calculate({incomeA:'0',incomeB:'0',rent:'1',other:'0'});assert.equal(zero.proportional,null);assert.equal(zero.equal.effortA,null);assert.equal(zero.overBudget,true);
 const one=Split.calculate({incomeA:'0',incomeB:'1000',rent:'100',other:'0'});assert.equal(one.proportional.a,0);assert.equal(one.proportional.b,10000);
 const odd=Split.calculate({incomeA:'1',incomeB:'1',rent:'0.01',other:'0'});assert.equal(odd.equal.a+odd.equal.b,1);assert.equal(odd.proportional.a+odd.proportional.b,1);
 const over=Split.calculate({incomeA:'10',incomeB:'10',rent:'30',other:'0'});assert.equal(over.equal.remainingA,-500);assert.equal(over.overBudget,true);
 const max=Split.calculate({incomeA:'999999999.99',incomeB:'999999999.98',rent:'999999999.99',other:'999999999.99'});assert.equal(max.proportional.a+max.proportional.b,max.total);
});
test('Sharing has a fixed public URL and never includes input or result values',()=>{
 const p=Split.sharePayload();assert.equal(p.url,'https://thepunisher7777.github.io/ledger-app/reparto/');assert.equal(new URL(p.url).search,'');assert.equal(new URL(p.url).hash,'');assert.ok(!JSON.stringify(p).includes('1800'));assert.ok(!JSON.stringify(p).includes('2400'));
 const source=fs.readFileSync(path.join(root,'reparto/page.js'),'utf8')+fs.readFileSync(path.join(root,'reparto/calculator.js'),'utf8');
 assert.ok(!/fetch\(|localStorage|sessionStorage|XMLHttpRequest|posthog/i.test(source));
});
test('Real calculator DOM submits, updates, validates and shares no financial information',async()=>{
 let html=fs.readFileSync(path.join(root,'reparto/index.html'),'utf8').replace(/<script src="([^"]+)"><\/script>/g,(_,file)=>'<script>'+fs.readFileSync(path.join(root,'reparto',file),'utf8')+'</script>');
 const errors=[];let copied;
 const dom=new JSDOM(html,{url:'https://ledger.test/ledger-app/reparto/',runScripts:'dangerously',beforeParse(w){w.addEventListener('error',e=>errors.push(e.error));Object.defineProperty(w.navigator,'clipboard',{value:{writeText:async text=>copied=text}});}});
 try{
  const w=dom.window,d=w.document;d.getElementById('example').click();assert.equal(d.getElementById('results').hidden,false);assert.equal(d.getElementById('example-badge').hidden,false);assert.match(d.getElementById('total-common').textContent,/1\.?250,00/);
  await d.getElementById('share-tool').click();await Promise.resolve();assert.equal(copied,Split.sharePayload().url);
  d.getElementById('income-a').value='-12';d.getElementById('split-form').dispatchEvent(new w.Event('submit',{cancelable:true}));assert.match(d.getElementById('form-error').textContent,/positivas/);assert.equal(d.getElementById('results').hidden,true);
  assert.equal(w.localStorage.length,0);assert.equal(w.sessionStorage.length,0);assert.deepEqual(errors,[]);
 }finally{dom.window.close();}
});
test('Landing/calculator internal links resolve and metadata is parseable and honest',()=>{
 for(const page of ['descubre/index.html','reparto/index.html']){
  const document=new JSDOM(fs.readFileSync(path.join(root,page),'utf8')).window.document;
  assert.equal(document.documentElement.lang,'es');assert.equal(document.querySelectorAll('h1').length,1);assert.ok(document.querySelector('meta[name=description]').content.length>80);assert.ok(document.querySelector('link[rel=canonical]').href.includes('/ledger-app/'));
  for(const json of document.querySelectorAll('script[type="application/ld+json"]')){const data=JSON.parse(json.textContent);assert.ok(!data.aggregateRating);assert.ok(!data.review);assert.equal(data.offers.price,'0');}
  for(const a of document.querySelectorAll('a[href],link[href],img[src],script[src]')){const target=a.getAttribute('href')||a.getAttribute('src');if(!target||target.startsWith('#')||/^https?:/.test(target))continue;const resolved=path.resolve(root,path.dirname(page),target.split('#')[0]);assert.ok(resolved.startsWith(root));assert.ok(fs.existsSync(resolved),'Broken asset/link: '+page+' -> '+target);}
 }
 assert.ok(fs.readFileSync(path.join(root,'sitemap.xml'),'utf8').includes('/ledger-app/reparto/'));
});
