// Deterministic asynchronous races; fictional identities and memory-only storage.
const assert = require('node:assert/strict');
const { Sync } = require('../couple-sync.js');
const A = 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa';
const SPACE = 'eeeeeeee-eeee-4eee-8eee-eeeeeeeeeeee';
const ENTITY = '11111111-1111-4111-8111-111111111111';
const deferred = () => { let resolve; const promise = new Promise(r => resolve = r); return {promise, resolve}; };
const rows = {
 ledger_couple_spaces: [{id:SPACE,status:'active',name:'FICTICIO',base_currency:'EUR'}],
 ledger_couple_members: [{space_id:SPACE,user_id:A,slot:1,active:true}],
 ledger_couple_entities: [{id:ENTITY,space_id:SPACE,kind:'account',payload:{title:'FICTICIO'},revision:1}],
 ledger_couple_activity: []
};
function fixture({sessionGate,activityGate,rpcGate,logoutGate} = {}) {
 const memory = new Map();
 const storage = {getItem:k=>memory.get(k)||null,setItem:(k,v)=>memory.set(k,v),removeItem:k=>memory.delete(k)};
 const client = {
  auth: {
   getSession: () => sessionGate ? sessionGate.promise : Promise.resolve({data:{session:{user:{id:A}}}}),
   getUser: async()=>({data:{user:{id:A}}}),
   signOut: () => logoutGate ? logoutGate.promise : Promise.resolve({error:null})
  },
  from(table) {const q={select:()=>q,eq:()=>q,order:()=>q,range:()=>q,then:fn=>(table==='ledger_couple_activity'&&activityGate?activityGate.promise:Promise.resolve({data:rows[table],error:null})).then(fn)};return q;},
  rpc:()=>rpcGate ? rpcGate.promise : Promise.resolve({data:null,error:null})
 };
 const sync = new Sync({client,storage});
 sync.user={id:A};sync.space=rows.ledger_couple_spaces[0];sync.members=rows.ledger_couple_members;sync.entities=rows.ledger_couple_entities;sync.lastVerified=Date.now();sync.persist();
 return {sync,memory,storage};
}
(async()=>{
 const sessionGate=deferred();let f=fixture({sessionGate});
 const resume=f.sync.resume();await f.sync.logout();sessionGate.resolve({data:{session:{user:{id:A}}}});await resume.catch(()=>{});
 assert.equal(f.sync.user,null);assert.equal(f.sync.space,null);assert.deepEqual(f.sync.entities,[]);assert.equal(f.memory.size,0);
 console.log('[OK] A late stored-session response cannot sign back in after logout');

 const activityGate=deferred();f=fixture({activityGate});let reached=false;
 // Wait until refresh reaches its final data request, without timers or a network.
 const read=f.sync.read.bind(f.sync);f.sync.read=async table=>{if(table==='ledger_couple_activity')reached=true;return read(table);};
 const refresh=f.sync.refresh();for(let n=0;n<20&&!reached;n++)await Promise.resolve();assert.ok(reached);
 await f.sync.logout();activityGate.resolve({data:[],error:null});await refresh.catch(()=>{});
 assert.equal(f.sync.user,null);assert.equal(f.sync.space,null);assert.deepEqual(f.sync.entities,[]);assert.deepEqual(f.sync.members,[]);assert.equal(f.memory.size,0);
 console.log('[OK] In-flight refresh cannot restore shared records or cache after logout');

 const rpcGate=deferred();f=fixture({rpcGate});const operation=f.sync.rpc('apply',{});await f.sync.logout();rpcGate.resolve({data:rows.ledger_couple_entities[0],error:null});
 await assert.rejects(operation,e=>e.code==='SESSION_CHANGED');assert.equal(f.memory.size,0);
 console.log('[OK] A stale write acknowledgement is rejected after session invalidation');

 const logoutGate=deferred();f=fixture({logoutGate});const logout=f.sync.logout();await Promise.resolve();
 await f.sync.resume().catch(()=>{});assert.equal(f.sync.user,null);assert.deepEqual(f.sync.entities,[]);
 logoutGate.resolve({error:null});await logout;
 console.log('[OK] Restoration stays blocked while remote sign-out is pending');
})().catch(e=>{console.error(e);process.exitCode=1;});
