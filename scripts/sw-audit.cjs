const vm=require('node:vm'),fs=require('node:fs'),assert=require('node:assert/strict');
const listeners={},puts=[],waits=[];let response,networkFails=false;
const context={URL,self:{location:{origin:'https://ledger.test',href:'https://ledger.test/sw.js'},addEventListener:(n,cb)=>listeners[n]=cb,skipWaiting:async()=>{},clients:{claim:async()=>{}}},caches:{open:async()=>({put:async(...args)=>puts.push(args),addAll:async()=>{}}),match:async key=>key.endsWith('/demo/')?'offline-demo':'offline-shell',keys:async()=>['ledger-app-old','other-app'],delete:async()=>{}},fetch:async()=>{if(networkFails)throw Error('offline');return response}};
vm.runInNewContext(fs.readFileSync(require('node:path').join(__dirname,'../sw.js'),'utf8'),context);
(async()=>{let result;function event(request){return {request,respondWith:p=>result=p,waitUntil:p=>waits.push(p)}}
listeners.fetch(event({method:'GET',url:'https://analytics.test/event',mode:'cors'}));assert.equal(result,undefined);
response={ok:false,clone(){throw Error('must not cache HTTP errors')}};listeners.fetch(event({method:'GET',url:'https://ledger.test/',mode:'navigate'}));await result;assert.equal(puts.length,0);
response={ok:true,clone:()=> 'valid-shell'};listeners.fetch(event({method:'GET',url:'https://ledger.test/',mode:'navigate'}));await result;await Promise.all(waits);assert.equal(puts.length,1);
networkFails=true;listeners.fetch(event({method:'GET',url:'https://ledger.test/',mode:'navigate'}));assert.equal(await result,'offline-shell');
listeners.fetch(event({method:'GET',url:'https://ledger.test/demo/',mode:'navigate'}));assert.equal(await result,'offline-demo');
result=undefined;listeners.fetch(event({method:'GET',url:'https://ledger.test/private-export.json',mode:'cors'}));assert.equal(result,undefined);
const projectHandlers={};vm.runInNewContext(fs.readFileSync(require('node:path').join(__dirname,'../sw.js'),'utf8'),{...context,self:{...context.self,location:{origin:'https://ledger.test',href:'https://ledger.test/ledger-app/sw.js'},addEventListener:(name,fn)=>projectHandlers[name]=fn}});projectHandlers.fetch(event({method:'GET',url:'https://ledger.test/ledger-app/demo/index.html',mode:'navigate'}));assert.equal(await result,'offline-demo');
console.log('[OK] Service worker: foreign origin excluded, HTTP errors excluded, successful shell cached, offline fallback');})().catch(e=>{console.error(e);process.exitCode=1});
