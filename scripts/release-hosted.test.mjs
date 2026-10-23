// Explicit release-only acceptance. Uses NEW fictional identities, never owner accounts.
import {createClient} from '@supabase/supabase-js';
import {randomUUID,randomBytes} from 'node:crypto';
import {writeFile} from 'node:fs/promises';
import assert from 'node:assert/strict';
import Auth from '../couple-auth.js';
import SyncModule from '../couple-sync.js';
const url='https://tsmdkrllkafmlqcwzsii.supabase.co',key='sb_publishable_8qqomT5Kq4W5KcwGhw-lVw_yCPcDmQ_';
if(process.env.LEDGER_RELEASE_FIXTURES!=='authorized-fictional-only')throw Error('Explicit fictional release authorization required');
const secret=()=>randomBytes(32).toString('hex'),password=secret(),prefix='rel161_'+Date.now().toString(36);
const manifest={prefix,createdAt:new Date().toISOString(),identities:[],space:null};
const record=()=>writeFile('/tmp/ledger-release-fixtures.json',JSON.stringify(manifest,null,2));
const stores=[new Map(),new Map()];let online=true;const clients=[];
function client(index=0){const store=stores[index];const c=createClient(url,key,{auth:{persistSession:true,autoRefreshToken:false,detectSessionInUrl:false,storageKey:prefix+index,storage:{getItem:k=>store.get(k)||null,setItem:(k,v)=>store.set(k,v),removeItem:k=>store.delete(k)}},global:{fetch:(u,i={})=>{if(!online)throw Error('FICTITIOUS OFFLINE');return fetch(u,{...i,signal:i.signal||AbortSignal.timeout(30000)});}}});clients.push(c);return c;}
const A=client(0),B=client(1),codes=[secret(),secret()];
async function rpc(c,name,args){const r=await c.rpc('ledger_couple_'+name,args);if(r.error){const e=Error(r.error.message);e.code=r.error.code;throw e;}return r.data;}
async function rejected(p){await assert.rejects(p,e=>['42501','PT409','P0001'].includes(e.code));}
let count=0;async function check(name,fn){await fn();count++;console.log('[OK] '+name);}
const cache=()=>{const m=new Map([['flowfi.public.v27','FICTICIO PERSONAL NO COMPARTIR']]);return{getItem:k=>m.get(k)||null,setItem:(k,v)=>m.set(k,v),removeItem:k=>m.delete(k),m};};
let a,b;
try{
 for(const [index,c]of [[0,A],[1,B]]){
  const username=prefix+(index?'b':'a');await Auth.identity(c,{action:'register',username,password,newRecoveryCode:codes[index]});await Auth.login(c,username,password);
  const {data,error}=await c.auth.getUser();assert.ifError(error);manifest.identities.push({username,id:data.user.id});await record();
  const spaces=await c.from('ledger_couple_spaces').select('id');assert.ifError(spaces.error);assert.deepEqual(spaces.data,[]);
 }
 const [u,v]=manifest.identities.map(x=>x.id);
 console.log('[OK] Two NEW fictional identities registered and logged in; no pre-existing spaces');count++;
 await check('Stored SDK session reopens in an independent client',async()=>{const reopened=client(0);const session=await reopened.auth.getSession();assert.equal(session.data.session.user.id,u);assert.equal((await reopened.auth.getUser()).data.user.id,u);});
 manifest.space=await rpc(A,'create',{p_name:'FICTICIO RELEASE '+prefix,p_alias:'A ficticio',p_currency:'EUR'});await record();
 const invite=await rpc(A,'invite',{p_space:manifest.space});await rpc(B,'join',{p_token:invite.token,p_alias:'B ficticio'});
 await check('Secure invitation accepted by second identity and cannot be replayed',()=>rejected(rpc(B,'join',{p_token:invite.token,p_alias:'B ficticio'})));
 const sa=cache(),sb=cache();a=new SyncModule.Sync({client:A,storage:sa,namespace:prefix,uuid:randomUUID});b=new SyncModule.Sync({client:B,storage:sb,namespace:prefix,uuid:randomUUID});await a.discover();await b.discover();
 const payload={title:'FICTICIO alquiler',amount_minor:110000,currency:'EUR',base_minor:110000,fx_rate:1,fx_date:'2026-10-23',fx_source:'misma moneda',date:'2026-10-23',category:'Alquiler',payer:u,splits:{[u]:55000,[v]:55000}};
 const q=a.enqueue('expense',payload);await a.flush();await b.refresh();
 await check('Hosted Sync sends only explicit shared expense to both clients',async()=>{assert.equal(a.queue.length,0);assert.equal(b.entities.find(e=>e.id===q.id).payload.base_minor,110000);assert.equal(sa.m.get('flowfi.public.v27'),'FICTICIO PERSONAL NO COMPARTIR');assert.equal(sb.m.get('flowfi.public.v27'),'FICTICIO PERSONAL NO COMPARTIR');});
 await check('RLS blocks anonymous reads and foreign-space IDOR',async()=>{const anon=createClient(url,key,{auth:{persistSession:false,autoRefreshToken:false}});const r=await anon.from('ledger_couple_entities').select('id').eq('space_id',manifest.space);assert.ok(r.error||r.data.length===0);await rejected(rpc(A,'apply',{p_space:randomUUID(),p_id:randomUUID(),p_kind:'expense',p_payload:payload,p_revision:0,p_delete:false,p_operation:randomUUID()}));});
 await check('Concurrent edits retain remote change and local conflict',async()=>{a.enqueue('expense',{...payload,title:'FICTICIO edit A'},{id:q.id,revision:1});b.enqueue('expense',{...payload,title:'FICTICIO edit B'},{id:q.id,revision:1});await b.flush();await a.flush();assert.equal(a.conflicts.length,1);assert.equal(a.entities.find(x=>x.id===q.id).payload.title,'FICTICIO edit B');});
 await check('Hosted budgets and goals synchronize without personal fields',async()=>{b.enqueue('budget',{title:'FICTICIO presupuesto',month:'2026-10',target_minor:150000,category:'Alquiler'});b.enqueue('goal',{title:'FICTICIO objetivo',target_minor:500000});await b.flush();await a.refresh();assert.ok(a.entities.some(e=>e.kind==='budget'));assert.ok(a.entities.some(e=>e.kind==='goal'));});
 await check('Connection failure preserves queued change then retries without duplication',async()=>{online=false;const offline=b.enqueue('expense',{...payload,title:'FICTICIO offline'});await assert.rejects(b.flush());assert.ok(b.queue.some(x=>x.id===offline.id));online=true;await b.flush();await b.flush();await a.refresh();assert.equal(a.entities.filter(x=>x.id===offline.id).length,1);});
 const old=(await A.auth.getSession()).data.session.access_token,next=secret(),newPassword=secret();
 await check('Recovery rotates password/code and invalidates old JWT',async()=>{await Auth.identity(A,{action:'recover',username:manifest.identities[0].username,password:newPassword,recoveryCode:codes[0],newRecoveryCode:next});await assert.rejects(Auth.login(A,manifest.identities[0].username,password));await Auth.login(A,manifest.identities[0].username,newPassword);await assert.rejects(Auth.identity(A,{action:'recover',username:manifest.identities[0].username,password:newPassword,recoveryCode:codes[0],newRecoveryCode:secret()}));const r=await fetch(url+'/rest/v1/ledger_couple_entities?select=id&space_id=eq.'+manifest.space,{headers:{apikey:key,Authorization:'Bearer '+old}});assert.ok([401,403].includes(r.status)||(r.ok&&(await r.json()).length===0));});
 await check('Leaving revokes access but preserves the other authorized member',async()=>{await rpc(A,'leave',{p_space:manifest.space});const r=await A.from('ledger_couple_entities').select('id').eq('space_id',manifest.space);assert.ifError(r.error);assert.deepEqual(r.data,[]);const remaining=await B.from('ledger_couple_spaces').select('status').eq('id',manifest.space);assert.equal(remaining.data[0].status,'closed');await rejected(rpc(A,'apply',{p_space:manifest.space,p_id:randomUUID(),p_kind:'expense',p_payload:payload,p_revision:0,p_delete:false,p_operation:randomUUID()}));await rpc(B,'leave',{p_space:manifest.space});});
 await check('Explicit logout removes stored session',async()=>{await b.logout();assert.equal((await B.auth.getSession()).data.session,null);assert.equal(b.user,null);});
 console.log(`${count} release hosted acceptance groups passed. Fixture UUIDs retained in /tmp manifest for scoped cleanup.`);
}finally{online=true;for(const c of clients){await c.removeAllChannels();await c.auth.signOut({scope:'local'}).catch(()=>{});}await record();}
