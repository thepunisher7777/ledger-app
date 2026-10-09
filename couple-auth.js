(function(root){
 'use strict';
 function username(v){const n=String(v||'').trim().toLowerCase();if(!/^[a-z0-9_]{4,32}$/.test(n))throw Error('Usuario: entre 4 y 32 letras, números o _.');return n;}
 function recoveryCode(){const a=new Uint8Array(32);root.crypto.getRandomValues(a);return Array.from(a,x=>x.toString(16).padStart(2,'0')).join('');}
 async function login(client,name,password){const {error}=await client.auth.signInWithPassword({email:username(name)+'@ledger-users.invalid',password});if(error)throw Error('Usuario o contraseña incorrectos, o acceso temporalmente limitado.');}
 async function identity(client,v){username(v.username);if(v.password.length<12||v.password.length>128)throw Error('La contraseña debe tener entre 12 y 128 caracteres.');const {data,error}=await client.functions.invoke('couple-identity',{body:v});if(error||!data?.ok)throw Error(data?.error||'No se ha completado la operación. Conserva el nuevo código si has solicitado recuperar.');}
 const api={username,recoveryCode,login,identity};root.LedgerCoupleAuth=api;if(typeof module==='object')module.exports=api;
})(typeof window==='object'?window:globalThis);
