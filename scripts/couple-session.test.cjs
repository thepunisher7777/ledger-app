// Actual pinned Auth SDK + actual Ledger DOM. Network responses are fictional.
const {JSDOM}=require('jsdom');
const {createClient}=require('@supabase/supabase-js');
const fs=require('node:fs');
const assert=require('node:assert/strict');
const A='aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa';
const space='eeeeeeee-eeee-4eee-8eee-eeeeeeeeeeee';
const user={id:A,aud:'authenticated',role:'authenticated',email:'ficticio@ledger-users.invalid',app_metadata:{},user_metadata:{},created_at:'2026-10-20T00:00:00Z'};
const authKey='ledger.couple.auth.v1:fictional.supabase.co';
const personal='PRIVATE_PERSONAL_SESSION_FIXTURE';
const jwt=exp=>[Buffer.from(JSON.stringify({alg:'HS256',typ:'JWT'})).toString('base64url'),Buffer.from(JSON.stringify({sub:A,aud:'authenticated',role:'authenticated',exp,session_id:space})).toString('base64url'),'fictional-test-signature'].join('.');
let refreshes=0,logouts=0;
function session(){return{access_token:jwt(Math.floor(Date.now()/1000)+3600),refresh_token:'fictional-refresh-token-'+refreshes,token_type:'bearer',expires_in:3600,expires_at:Math.floor(Date.now()/1000)+3600,user};}
const modules=['couple-invite.js','money.js','portfolio-import.js','couple-core.js','couple-sync.js','couple-auth.js','couple-ui.js'];
let html=fs.readFileSync('index.html','utf8').replace(/<script src="([^"]+)"><\/script>/g,(_,name)=>modules.includes(name)?'<script>'+fs.readFileSync(name,'utf8')+'</script>':'');
html=html.replace('render();refreshExchangeRates();analyticsMaybeAsk();maybeStartFlowFiMigration();if(bootRecoveryNotice)','render();if(bootRecoveryNotice)');
const clients=[];
const fixture={ledger_couple_spaces:[{id:space,name:'FICTICIO hogar',base_currency:'EUR',status:'active'}],ledger_couple_members:[{space_id:space,user_id:A,slot:1,display_name:'A ficticio',active:true}],ledger_couple_entities:[],ledger_couple_activity:[]};
function open(saved={}){
 const errors=[];
 const dom=new JSDOM(html,{url:'https://ledger.test/',runScripts:'dangerously',pretendToBeVisual:true,beforeParse(w){
  Object.entries(saved).forEach(([k,v])=>w.localStorage.setItem(k,v));
  w.localStorage.setItem('ledger.analytics.consent.v1','no');
  w.LedgerCoupleDefaultConfig={url:'https://fictional.supabase.co',key:'sb_publishable_fictional_session_test',remember:true};
  w.supabase={createClient:(url,key,options)=>{
   const sdk=createClient(url,key,{...options,global:{fetch:async(input)=>{const u=String(input);if(u.includes('/token?grant_type=refresh_token')){refreshes++;return Response.json(session());}if(u.includes('/token?grant_type=password'))return Response.json(session());if(u.includes('/user'))return Response.json(user);if(u.includes('/logout')){logouts++;return new Response(null,{status:204});}throw Error('Unexpected request in fixture');}}});
   clients.push(sdk);
   return {auth:sdk.auth,from:table=>{const q={select:()=>q,eq:()=>q,order:()=>q,range:()=>q,then:fn=>Promise.resolve({data:fixture[table],error:null}).then(fn)};return q;},rpc:async()=>({error:null,data:null})};
  }};
  w.matchMedia=()=>({matches:false,addEventListener(){}});w.scrollTo=()=>{};w.confirm=()=>true;
  w.fetch=async()=>{throw Error('No browser network in fixture');};
  w.HTMLDialogElement.prototype.showModal=function(){this.open=true;};w.HTMLDialogElement.prototype.close=function(){this.open=false;};
  w.addEventListener('error',e=>errors.push(e.error));
 }});
 return{dom,w:dom.window,errors};
}
const tick=()=>new Promise(r=>setTimeout(r,30));
const snapshot=w=>Object.fromEntries(Array.from({length:w.localStorage.length},(_,i)=>{const k=w.localStorage.key(i);return[k,w.localStorage.getItem(k)];}));
(async()=>{
 let page;
 try{
  page=open();await tick();let w=page.w;
  w.document.querySelector('[data-ledger-space=couple]').click();await tick();
  w.localStorage.setItem('session-test-personal',personal);
  w.document.getElementById('ce-login').click();
  assert.equal(w.document.querySelector('[name=rememberSession]').checked,true);
  w.document.querySelector('[name=username]').value='ficticio';w.document.querySelector('[name=password]').value='fictional-test-password';
  w.document.getElementById('couple-form').dispatchEvent(new w.Event('submit',{cancelable:true}));await tick();await tick();
  assert.ok(w.localStorage.getItem(authKey));assert.equal(w.LedgerCouple.getSync().user.id,A);assert.equal(w.localStorage.getItem('ledger.workspace.v1'),'couple');
  let saved=snapshot(w);page.dom.window.close();await clients.at(-1).auth.stopAutoRefresh();
  page=open(saved);await tick();await tick();w=page.w;
  assert.equal(w.LedgerCouple.isActive(),true);assert.equal(w.LedgerCouple.getSync().user.id,A);assert.equal(w.LedgerCouple.getSync().space.id,space);assert.equal(w.localStorage.getItem('session-test-personal'),personal);assert.equal(logouts,0);
  console.log('[OK] Real SDK sign-in persists and reopens actual Couple UI without password or unsolicited logout');
  const stored=JSON.parse(w.localStorage.getItem(authKey));stored.access_token=jwt(Math.floor(Date.now()/1000)-60);stored.expires_at=Math.floor(Date.now()/1000)-60;saved=snapshot(w);saved[authKey]=JSON.stringify(stored);page.dom.window.close();await clients.at(-1).auth.stopAutoRefresh();
  page=open(saved);await tick();await tick();w=page.w;
  assert.ok(refreshes>0);assert.equal(w.LedgerCouple.getSync().user.id,A);assert.equal(w.localStorage.getItem('session-test-personal'),personal);
  console.log('[OK] Expired access token is refreshed from persistent refresh token on reopen');
  w.document.querySelector('[data-ledger-space=personal]').click();saved=snapshot(w);page.dom.window.close();await clients.at(-1).auth.stopAutoRefresh();page=open(saved);await tick();w=page.w;
  assert.equal(w.LedgerCouple.isActive(),false);assert.ok(w.localStorage.getItem(authKey));
  w.document.querySelector('[data-ledger-space=couple]').click();await tick();await tick();
  await w.LedgerCouple.getSync().logout();await tick();assert.equal(w.localStorage.getItem(authKey),null);assert.equal(w.LedgerCouple.getSync().user,null);assert.equal(w.localStorage.getItem('session-test-personal'),personal);
  saved=snapshot(w);page.dom.window.close();await clients.at(-1).auth.stopAutoRefresh();page=open(saved);await tick();await tick();w=page.w;assert.equal(w.LedgerCouple.getSync().user,null);
  console.log('[OK] Last selected Personal is respected; explicit logout stays logged out on reopen');
  w.document.getElementById('ce-login').click();w.document.querySelector('[name=rememberSession]').checked=false;w.document.querySelector('[name=username]').value='ficticio';w.document.querySelector('[name=password]').value='fictional-test-password';w.document.getElementById('couple-form').dispatchEvent(new w.Event('submit',{cancelable:true}));await tick();await tick();assert.equal(w.localStorage.getItem(authKey),null);assert.equal(JSON.parse(w.localStorage.getItem('ledger.couple.config.v1')).remember,false);
  assert.deepEqual(page.errors,[]);console.log('[OK] Shared-device opt-out keeps Auth session in memory only');
 }finally{page?.dom.window.close();for(const c of clients)await c.auth.stopAutoRefresh();}
})().catch(e=>{console.error(e);process.exitCode=1;});
