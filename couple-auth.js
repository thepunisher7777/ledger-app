(function(root){
 'use strict';
 function username(v){const n=String(v||'').trim().toLowerCase();if(!/^[a-z0-9_]{4,32}$/.test(n))throw Error('Usuario: entre 4 y 32 letras, números o _.');return n;}
 function recoveryCode(){const a=new Uint8Array(32);root.crypto.getRandomValues(a);return Array.from(a,x=>x.toString(16).padStart(2,'0')).join('');}
 const unavailable='El servicio de Pareja no está disponible en este momento. Vuelve a intentarlo en unos minutos con el mismo usuario y conserva tu código de recuperación.';
 function failure(message,code){const e=Error(message);e.code=code;return e;}
 async function login(client,name,password){
  const email=username(name)+'@ledger-users.invalid';
  let result;
  try{result=await client.auth.signInWithPassword({email,password});}
  catch{throw failure(unavailable,'service_unavailable');}
  const error=result.error;
  if(error){
   if(!error.status||error.status>=500||error.name==='AuthRetryableFetchError')throw failure(unavailable,'service_unavailable');
   if(error.status===429)throw failure('Demasiados intentos. Espera unos minutos y vuelve a entrar.','rate_limited');
   throw failure('Usuario o contraseña incorrectos, o acceso temporalmente limitado.','login_failed');
  }
 }
 async function identity(client,v){
  username(v.username);
  if(typeof v.password!=='string'||v.password.length<12||v.password.length>128)throw Error('La contraseña debe tener entre 12 y 128 caracteres.');
  let response;
  try{response=await client.functions.invoke('couple-identity',{body:v});}
  catch{throw failure(unavailable,'service_unavailable');}
  const {data,error}=response;let body=data;
  const status=error?.context?.status;
  if(error?.context&&typeof error.context.json==='function'){try{body=await error.context.json();}catch{}}
  if(error||!body?.ok){
   // Gateway failures use {message}, not the function's {error}. Do not turn
   // paused projects, unavailable infrastructure or transport errors into a
   // misleading credential error. Never display raw gateway/internal details.
   if(!body?.error&&((status>=500)||error||!body?.ok))throw failure(unavailable,'service_unavailable');
   const message=typeof body.error==='string'?body.error.slice(0,500):unavailable;
   throw failure(message,body.code||'identity_failed');
  }
 }
 const api={username,recoveryCode,login,identity};root.LedgerCoupleAuth=api;if(typeof module==='object')module.exports=api;
})(typeof window==='object'?window:globalThis);
