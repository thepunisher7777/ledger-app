const assert=require('node:assert/strict'), fs=require('node:fs');
const A=require('../couple-auth.js');
(async()=>{
 assert.equal(A.username('  Mi_USUARIO '),'mi_usuario');
 for(const s of ['a','a@b.com','<script>','../test','éngel'])assert.throws(()=>A.username(s));
 const a=A.recoveryCode(),b=A.recoveryCode();assert.match(a,/^[a-f0-9]{64}$/);assert.notEqual(a,b);
 let sent;
 await A.login({auth:{signInWithPassword:async v=>(sent=v,{error:null})}},'Mi_usuario','fictitious-password');
 assert.equal(sent.email,'mi_usuario@ledger-users.invalid');
 await assert.rejects(A.login({auth:{signInWithPassword:async()=>({error:{message:'account-specific'}})}},'usuario','bad'),/incorrectos/);
 await assert.rejects(A.identity({}, {username:'usuario',password:'short'}),/12/);
 const html=fs.readFileSync('couple-ui.js','utf8');assert.ok(!html.includes('signInWithOtp'));assert.ok(!html.includes('verifyOtp'));
 const source=fs.readFileSync('couple-auth.js','utf8');assert.ok(!source.includes('localStorage'));assert.ok(!source.includes('service_role'));
 console.log('[OK] Username normalization, 256-bit recovery, password login, errors and no email/client secret storage');
})().catch(e=>{console.error(e);process.exitCode=1;});
