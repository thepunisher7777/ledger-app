import { PGlite } from '@electric-sql/pglite';
import { pgcrypto } from '@electric-sql/pglite/contrib/pgcrypto';
import fs from 'node:fs';
import assert from 'node:assert/strict';
import { randomUUID } from 'node:crypto';
const db = new PGlite({ extensions: { pgcrypto } });
const A = 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',
  B = 'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb',
  C = 'cccccccc-cccc-4ccc-8ccc-cccccccccccc';
let n = 0;
await db.exec(
  `create schema auth;create schema extensions;create role service_role;create role anon;create role authenticated;create table auth.users(id uuid primary key);insert into auth.users values('${A}'),('${B}'),('${C}');create table auth.sessions(id uuid primary key,user_id uuid not null,not_after timestamptz);insert into auth.sessions(id,user_id)select id,id from auth.users;create function auth.jwt() returns jsonb language sql stable as $$select coalesce(nullif(current_setting('request.jwt.claims',true),''),'{}')::jsonb$$;grant execute on function auth.jwt() to anon,authenticated;create function auth.uid() returns uuid language sql stable as $$select nullif(current_setting('request.jwt.claim.sub',true),'')::uuid$$;grant usage on schema auth to anon,authenticated;grant execute on function auth.uid() to anon,authenticated;`,
);
const migrationRoot = new URL('../supabase/migrations/', import.meta.url);
for (const file of fs.readdirSync(migrationRoot).filter((name) => name.endsWith('.sql')).sort()) {
  await db.exec(fs.readFileSync(new URL(file, migrationRoot), 'utf8'));
}
const as = async (u) => {
  await db.exec(
    `reset role;select set_config('request.jwt.claim.sub','${u || ''}',false);select set_config('request.jwt.claims','${JSON.stringify(u ? { session_id: u, is_anonymous: false } : {})}',false);set role ${u ? 'authenticated' : 'anon'}`,
  );
};
async function ok(name, fn) {
  await fn();
  console.log('[OK]', name);
  n++;
}
const rpc = async (name, args = []) =>
  (
    await db.query(
      `select public.ledger_couple_${name}(${args.map((_, i) => '$' + (i + 1)).join(',')}) as result`,
      args,
    )
  ).rows[0].result;
await as(A);
const space = await rpc('create', ['Hogar ficticio', 'A ficticio', 'EUR']);
let invite = await rpc('invite', [space]);
await ok('invitación 256 bits y secreto no consultable', async () => {
  assert.match(invite.token, /^[a-f0-9]{64}$/);
  await assert.rejects(db.query('select * from public.ledger_couple_invites'));
});
await as(C);
await ok('tercero no ve espacio ni miembros', async () => {
  assert.equal((await db.query('select * from public.ledger_couple_spaces')).rows.length, 0);
  assert.equal((await db.query('select * from public.ledger_couple_members')).rows.length, 0);
});
await as(A);
await rpc('invite', [space]);
await as(B);
await ok('código revocado no sirve', () => assert.rejects(rpc('join', [invite.token, 'B'])));
await as(A);
invite = await rpc('invite', [space]);
await db.exec('reset role');
await db.query(
  "update public.ledger_couple_invites set expires_at=now()-interval '1 minute' where space_id=$1",
  [space],
);
await as(B);
await ok('código caducado no sirve', () => assert.rejects(rpc('join', [invite.token, 'B'])));
await as(A);
invite = await rpc('invite', [space]);
await ok('autor no acepta su propia invitación', () =>
  assert.rejects(rpc('join', [invite.token, 'A'])),
);
await as(B);
await rpc('join', [invite.token, 'B ficticio']);
await as(C);
await ok('código consumido y tercer miembro rechazados', () =>
  assert.rejects(rpc('join', [invite.token, 'C'])),
);
const id = randomUUID(),
  operation = randomUUID(),
  payload = {
    title: 'Alquiler FICTICIO',
    amount_minor: 110000,
    base_minor: 110000,
    currency: 'EUR',
    fx_rate: 1,
    fx_date: '2026-10-09',
    fx_source: 'misma moneda',
    date: '2026-10-09',
    category: 'Alquiler',
    payer: A,
    splits: { [A]: 55000, [B]: 55000 },
    split_mode: 'equal',
  };
const apply = (
  p = payload,
  rev = 0,
  del = false,
  eid = id,
  op = randomUUID(),
  sid = space,
  kind = 'expense',
) => rpc('apply', [sid, eid, kind, p, rev, del, op]);
await ok('IDOR no permite escribir', () => assert.rejects(apply()));
await as(A);
let entity = await apply(payload, 0, false, id, operation);
await ok('reintento idempotente no duplica', async () => {
  assert.deepEqual(await apply(payload, 0, false, id, operation), entity);
  assert.equal((await db.query('select * from public.ledger_couple_entities')).rows.length, 1);
});
await ok('no se puede reutilizar operación para cambiar importes', () =>
  assert.rejects(apply({ ...payload, title: 'Otro' }, 0, false, id, operation)),
);
await ok('campos personales rechazados en el servidor', () =>
  assert.rejects(apply({ ...payload, personal_account: 'IBAN FICTICIO' }, 0, false, randomUUID())),
);
await ok('reparto ajeno rechazado', () =>
  assert.rejects(apply({ ...payload, splits: { [A]: 55000, [C]: 55000 } }, 0, false, randomUUID())),
);
await ok('reparto que no suma rechazado', () =>
  assert.rejects(apply({ ...payload, splits: { [A]: 1, [B]: 2 } }, 0, false, randomUUID())),
);
await ok('cuenta personal/ajena no puede referenciarse', () =>
  assert.rejects(apply({ ...payload, account_id: randomUUID() }, 0, false, randomUUID())),
);
await ok('cambio histórico incoherente rechazado', () =>
  assert.rejects(apply({ ...payload, fx_rate: 2 }, 0, false, randomUUID())),
);
for (const key of [
  'amount_minor',
  'base_minor',
  'currency',
  'fx_rate',
  'fx_date',
  'fx_source',
  'date',
  'splits',
  'payer',
])
  await ok('campo obligatorio ' + key + ' ausente rechazado', async () => {
    const p = { ...payload };
    delete p[key];
    await assert.rejects(apply(p, 0, false, randomUUID()));
  });
await ok('null, moneda ajena y fechas imposibles rechazados', async () => {
  for (const p of [
    { ...payload, fx_rate: null },
    { ...payload, currency: 'GBP' },
    { ...payload, date: '2026-02-31' },
    { ...payload, amount_minor: '110000' },
  ])
    await assert.rejects(apply(p, 0, false, randomUUID()));
});
await ok('mutaciones SQL directas a tabla denegadas', () =>
  assert.rejects(db.query("update public.ledger_couple_entities set payload='{}'")),
);
await ok('presupuestos y recurrencias incompletos rechazados', async () => {
  for (const kind of ['budget', 'goal', 'recurring'])
    await assert.rejects(
      apply({ title: 'Ficticio' }, 0, false, randomUUID(), randomUUID(), space, kind),
    );
});
await ok('argumentos CAS nulos rechazados', () =>
  assert.rejects(apply(payload, null, false, randomUUID())),
);
await as(B);
await ok('B lee solo compartidos y metadatos del autor', async () => {
  const r = (await db.query('select * from public.ledger_couple_entities')).rows;
  assert.equal(r.length, 1);
  assert.equal(r[0].created_by, A);
  assert.equal(r[0].payload.amount_minor, 110000);
});
entity = await apply({ ...payload, title: 'Editado por B' }, 1);
await as(A);
await ok('ediciones simultáneas conservan la primera y rechazan la obsoleta', () =>
  assert.rejects(apply({ ...payload, title: 'Conflicto A' }, 1)),
);
await ok('auditoría conserva autor y editor', async () => {
  const r = (await db.query('select * from public.ledger_couple_entities')).rows[0];
  assert.equal(r.created_by, A);
  assert.equal(r.updated_by, B);
  assert.equal(r.revision, 2);
});
await as(C);
await ok('consultas filtradas por UUID ajeno siguen vacías', async () => {
  assert.equal(
    (await db.query('select * from public.ledger_couple_entities where id=$1', [id])).rows.length,
    0,
  );
  assert.equal((await db.query('select * from public.ledger_couple_activity')).rows.length, 0);
});
await as(null);
await ok('sesión cerrada no lee ni llama RPC', async () => {
  await assert.rejects(db.query('select * from public.ledger_couple_entities'));
  await assert.rejects(rpc('create', ['x', 'x', 'EUR']));
});
await as(A);
await apply(payload, 2, true);
await ok('eliminación versionada y sin borrado de auditoría', async () => {
  const r = (await db.query('select * from public.ledger_couple_entities')).rows[0];
  assert.equal(r.deleted, true);
  assert.equal(r.revision, 3);
  await assert.rejects(db.query('delete from public.ledger_couple_activity'));
});
await db.exec('reset role');
await db.query('delete from auth.sessions where user_id=$1', [A]);
await as(A);
await ok('JWT anterior tras logout no lee ni escribe aunque conserve el subject', async () => {
  assert.equal((await db.query('select * from public.ledger_couple_entities')).rows.length, 0);
  await assert.rejects(apply(payload, 3));
  await assert.rejects(rpc('create', ['Sesión ficticia', 'A', 'EUR']));
});
await db.exec('reset role');
await db.query('insert into auth.sessions(id,user_id)values($1,$1)', [A]);
await as(A);
await ok('sesión expirada bloqueada aun existiendo su fila', async () => {
  await db.exec('reset role');
  await db.query("update auth.sessions set not_after=now()-interval '1 minute' where user_id=$1", [
    A,
  ]);
  await as(A);
  assert.equal((await db.query('select * from public.ledger_couple_entities')).rows.length, 0);
  await assert.rejects(apply(payload, 3));
  await db.exec('reset role');
  await db.query('update auth.sessions set not_after=null where user_id=$1', [A]);
  await as(A);
});
await as(B);
await ok('session_id de otro usuario no autoriza', async () => {
  await db.query("select set_config('request.jwt.claims',$1,false)", [
    JSON.stringify({ session_id: A, is_anonymous: false }),
  ]);
  assert.equal((await db.query('select * from public.ledger_couple_entities')).rows.length, 0);
  await assert.rejects(apply(payload, 3));
});
await as(A);
await ok('identidad anónima y session_id malformado rechazados', async () => {
  for (const claims of [
    { session_id: A, is_anonymous: true },
    { session_id: 'invalid-uuid', is_anonymous: false },
  ]) {
    await db.query("select set_config('request.jwt.claims',$1,false)", [JSON.stringify(claims)]);
    assert.equal((await db.query('select * from public.ledger_couple_entities')).rows.length, 0);
    await assert.rejects(rpc('create', ['Ficticio', 'A', 'EUR']));
  }
});
await as(A);
await rpc('leave', [space]);
await ok('saliente pierde lectura y escritura de inmediato', async () => {
  assert.equal((await db.query('select * from public.ledger_couple_entities')).rows.length, 0);
  await assert.rejects(apply(payload, 3));
});
await as(B);
await ok('espacio cerrado conserva exportación del restante y bloquea edición', async () => {
  assert.equal(
    (await db.query('select * from public.ledger_couple_spaces')).rows[0].status,
    'closed',
  );
  assert.equal((await db.query('select * from public.ledger_couple_entities')).rows.length, 1);
  await assert.rejects(apply(payload, 3));
});
console.log(`${n} pruebas de autorización PostgreSQL aprobadas`);
await db.close();
