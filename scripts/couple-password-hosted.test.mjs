// Runs only on an explicitly authorized test project; all accounts are fictitious.
import { createClient } from '@supabase/supabase-js';
import { randomBytes } from 'node:crypto';
import assert from 'node:assert/strict';
const url=process.env.COUPLE_E2E_URL,key=process.env.COUPLE_E2E_PUBLIC_KEY;
if(!url||!key||process.env.COUPLE_E2E_ALLOW_MUTATIONS!=='fictional-only')throw Error('Test project and fictional-only authorization required');
const secret=()=>randomBytes(32).toString('hex');
const password=secret();
const codeA=secret(),codeB=secret(),next=secret();
const prefix='test_'+Date.now().toString(36);
const A=createClient(url,key,{auth:{persistSession:false,autoRefreshToken:false}}),B=createClient(url,key,{auth:{persistSession:false,autoRefreshToken:false}});
async function endpoint(body){const r=await fetch(url+'/functions/v1/couple-identity',{method:'POST',headers:{apikey:key,'Content-Type':'application/json'},body:JSON.stringify(body)});return {status:r.status,body:await r.json()};}
async function rpc(c,n,args){const r=await c.rpc('ledger_couple_'+n,args);assert.ifError(r.error);return r.data;}
for(const [name,code,c] of [[prefix+'a',codeA,A],[prefix+'b',codeB,B]]){
 const r=await endpoint({action:'register',username:name,password,newRecoveryCode:code});assert.equal(r.status,200,JSON.stringify(r.body));
 assert.ifError((await c.auth.signInWithPassword({email:name+'@ledger-users.invalid',password})).error);
}
console.log('[OK] Two fictitious accounts created and signed in without email');
const id=await rpc(A,'create',{p_name:'FICTICIO sin correo',p_alias:'A ficticio',p_currency:'EUR'});
const invite=await rpc(A,'invite',{p_space:id});await rpc(B,'join',{p_token:invite.token,p_alias:'B ficticio'});
assert.equal((await B.from('ledger_couple_spaces').select('id')).data[0].id,id);
console.log('[OK] Invitation joins exactly two independently authenticated accounts');
const old=(await A.auth.getSession()).data.session.access_token;
const denied=await A.rpc('ledger_identity_recover',{p_username:prefix+'a',p_hash:'a'.repeat(64),p_new_hash:'b'.repeat(64)});assert.ok(denied.error);
assert.equal((await endpoint({action:'recover',username:prefix+'a',password:secret(),recoveryCode:secret(),newRecoveryCode:secret()})).status,400);
console.log('[OK] Recovery RPC is inaccessible to client and incorrect code is rejected');
const newPassword=secret();assert.equal((await endpoint({action:'recover',username:prefix+'a',password:newPassword,recoveryCode:codeA,newRecoveryCode:next})).status,200);
const replay=await fetch(url+'/rest/v1/ledger_couple_spaces?select=id',{headers:{apikey:key,Authorization:'Bearer '+old}});assert.deepEqual(await replay.json(),[]);
assert.ok((await A.auth.signInWithPassword({email:prefix+'a@ledger-users.invalid',password})).error);
assert.ifError((await A.auth.signInWithPassword({email:prefix+'a@ledger-users.invalid',password:newPassword})).error);
assert.equal((await endpoint({action:'recover',username:prefix+'a',password:secret(),recoveryCode:codeA,newRecoveryCode:secret()})).status,400);
assert.equal((await A.from('ledger_couple_spaces').select('id')).data[0].id,id);
console.log('[OK] Recovery rotates code, blocks old password/JWT and preserves membership');
assert.equal((await endpoint({action:'register',username:prefix+'a',password,newRecoveryCode:secret()})).status,400);
assert.equal((await endpoint({action:'register',username:'ab',password:'short',newRecoveryCode:secret()})).status,400);
console.log('[OK] Duplicate username and invalid input rejected');
await rpc(A,'leave',{p_space:id});await A.auth.signOut();await B.auth.signOut();
console.log('[OK] Fictitious space closed; sessions ended. No real data touched.');
