import {PGlite} from '@electric-sql/pglite';import fs from 'node:fs';import assert from 'node:assert/strict';
const db=new PGlite();
await db.exec("create schema auth;create role anon;create role authenticated;create role service_role;create table auth.users(id uuid primary key);create table auth.sessions(id uuid primary key,user_id uuid);insert into auth.users values('aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa');insert into auth.sessions values('bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb','aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa');");
for(const file of ['20261009234152_couple_password_identity.sql','20261009234440_preserve_couple_policy_schema_access.sql'])await db.exec(fs.readFileSync(new URL('../supabase/migrations/'+file,import.meta.url),'utf8'));
await db.query('select ledger_identity_register($1,$2,$3)',['ficticio','aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa','old-hash']);
for(const role of ['anon','authenticated']){
 await db.exec('set role '+role);await assert.rejects(db.query('select * from ledger_private.identities'));await assert.rejects(db.query("select ledger_identity_recover('ficticio','old-hash','new-hash')"));await assert.rejects(db.query("select ledger_identity_limit('x',100)"));await db.exec('reset role');
}
await assert.rejects(db.query("select ledger_identity_recover('ficticio','wrong','new-hash')"));
await assert.rejects(db.query("select ledger_identity_recover('ficticio','old-hash','old-hash')"));
assert.equal((await db.query("select ledger_identity_recover('ficticio','old-hash','new-hash') as id")).rows[0].id,'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa');
assert.equal((await db.query('select count(*)::int as n from auth.sessions')).rows[0].n,0);
await assert.rejects(db.query("select ledger_identity_recover('ficticio','old-hash','another-hash')"));
assert.equal((await db.query("select ledger_identity_limit('test',1) as allowed")).rows[0].allowed,true);
assert.equal((await db.query("select ledger_identity_limit('test',1) as allowed")).rows[0].allowed,false);
console.log('[OK] Private recovery/limits deny anon and authenticated; wrong/replayed codes rejected; sessions revoked; attempts bounded');await db.close();
