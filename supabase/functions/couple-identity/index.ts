import { createClient } from 'npm:@supabase/supabase-js@2.117.3';
// Public enrollment/recovery endpoint. Authentication is password (Supabase Auth)
// or a 256-bit recovery secret. Admin key exists only in Edge runtime secrets.
const url = Deno.env.get('SUPABASE_URL')!;
const admin = createClient(url, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!, {auth:{persistSession:false,autoRefreshToken:false}});
const headers = {'Access-Control-Allow-Origin':'*','Access-Control-Allow-Headers':'authorization, apikey, content-type, x-client-info','Content-Type':'application/json','Cache-Control':'no-store'};
const reply = (status:number, body:unknown) => new Response(JSON.stringify(body),{status,headers});
const digest = async (s:string) => Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256',new TextEncoder().encode(s)))).map(x=>x.toString(16).padStart(2,'0')).join('');
Deno.serve(async req => {
 if(req.method==='OPTIONS') return new Response(null,{status:204,headers});
 if(req.method!=='POST') return reply(405,{error:'Método no permitido'});
 try {
  const raw = await req.text(); if(raw.length>4096) return reply(413,{error:'Solicitud demasiado grande'});
  const v=JSON.parse(raw);
  const username=String(v.username||'').trim().toLowerCase();
  if(!/^[a-z0-9_]{4,32}$/.test(username) || typeof v.password!=='string' || v.password.length<12 || v.password.length>128 || !/^[a-f0-9]{64}$/.test(v.newRecoveryCode||'')) return reply(400,{error:'Usuario: 4–32 letras, números o _. Contraseña: 12–128 caracteres.'});
  if(!['register','recover'].includes(v.action)) return reply(400,{error:'Acción inválida'});
  // x-forwarded-for is supplied by the gateway; global/account limits remain
  // effective even if a caller attempts to spoof an IP header.
  const ip=req.headers.get('x-forwarded-for')?.split(',')[0].trim()||'unknown';
  for(const [bucket,max] of [[`ip:${await digest(ip)}`,20],[`user:${username}`,8],['global',100]] as [string,number][]) {
   const {data,error}=await admin.rpc('ledger_identity_limit',{p_bucket:bucket,p_max:max});
   if(error) return reply(503,{error:'Servicio temporalmente no disponible'});
   if(!data) return reply(429,{error:'Demasiados intentos. Prueba más tarde.'});
  }
  const recoveryHash=await digest(v.newRecoveryCode);
  // Reserved .invalid domain is an internal Auth identifier, never a mailbox.
  const email=`${username}@ledger-users.invalid`;
  if(v.action==='register') {
   const {data,error}=await admin.auth.admin.createUser({email,password:v.password,email_confirm:true,app_metadata:{ledger_identity:'username-v1'}});
   if(error||!data.user) return reply(400,{error:'No se ha podido crear la cuenta. Prueba otro usuario.'});
   const saved=await admin.rpc('ledger_identity_register',{p_username:username,p_user:data.user.id,p_hash:recoveryHash});
   if(saved.error) {await admin.auth.admin.deleteUser(data.user.id);return reply(503,{error:'No se ha podido crear la cuenta'});}
   return reply(200,{ok:true});
  }
  if(!/^[a-f0-9]{64}$/.test(v.recoveryCode||'')) return reply(400,{error:'Credenciales de recuperación inválidas'});
  const claim=await admin.rpc('ledger_identity_recover',{p_username:username,p_hash:await digest(v.recoveryCode),p_new_hash:recoveryHash});
  if(claim.error||!claim.data) return reply(400,{error:'Credenciales de recuperación inválidas'});
  const changed=await admin.auth.admin.updateUserById(claim.data,{password:v.password});
  // The browser knows the new recovery secret before submitting. If the admin
  // update fails or the response is lost, retry using that new secret.
  if(changed.error) return reply(503,{error:'Código rotado, pero cambio de contraseña pendiente. Conserva el nuevo código y vuelve a recuperar.'});
  const revoked=await admin.rpc('ledger_identity_finish_recovery',{p_username:username,p_hash:recoveryHash});
  if(revoked.error) return reply(503,{error:'Contraseña actualizada; vuelve a recuperar con el nuevo código para terminar de revocar las sesiones.'});
  return reply(200,{ok:true});
 } catch {return reply(400,{error:'Solicitud inválida'});}
});
