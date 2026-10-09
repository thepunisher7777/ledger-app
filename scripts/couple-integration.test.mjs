// Fictional users, real PostgreSQL RLS and real local HTTP transport.
// This harness does NOT replace acceptance tests against hosted Supabase Auth/Realtime.
import { PGlite } from '@electric-sql/pglite';
import { pgcrypto } from '@electric-sql/pglite/contrib/pgcrypto';
import { createServer } from 'node:http';
import { randomUUID } from 'node:crypto';
import fs from 'node:fs';
import assert from 'node:assert/strict';
import Core from '../couple-core.js';
import SyncModule from '../couple-sync.js';

const { Sync, validateConfig } = SyncModule;
const A = 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',
  B = 'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb',
  C = 'cccccccc-cccc-4ccc-8ccc-cccccccccccc';
const db = new PGlite({ extensions: { pgcrypto } });
await db.exec(`create schema auth; create schema extensions; create role service_role; create role anon; create role authenticated;
 create table auth.users(id uuid primary key); insert into auth.users values('${A}'),('${B}'),('${C}');
 create table auth.sessions(id uuid primary key,user_id uuid not null,not_after timestamptz);insert into auth.sessions(id,user_id)select id,id from auth.users;
 create function auth.jwt() returns jsonb language sql stable as $$select coalesce(nullif(current_setting('request.jwt.claims',true),''),'{}')::jsonb$$;grant execute on function auth.jwt() to anon,authenticated;
 create function auth.uid() returns uuid language sql stable as $$select nullif(current_setting('request.jwt.claim.sub',true),'')::uuid$$;
 grant usage on schema auth to anon,authenticated; grant execute on function auth.uid() to anon,authenticated;`);
const migrationRoot = new URL('../supabase/migrations/', import.meta.url);
for (const file of fs.readdirSync(migrationRoot).filter((name) => name.endsWith('.sql')).sort()) {
  await db.exec(fs.readFileSync(new URL(file, migrationRoot), 'utf8'));
}
const tokens = new Map([
  ['fixture-A', A],
  ['fixture-B', B],
  ['fixture-C', C],
]);
const tables = [
  'ledger_couple_spaces',
  'ledger_couple_members',
  'ledger_couple_entities',
  'ledger_couple_activity',
];
const args = {
  create: ['p_name', 'p_alias', 'p_currency'],
  invite: ['p_space'],
  join: ['p_token', 'p_alias'],
  apply: ['p_space', 'p_id', 'p_kind', 'p_payload', 'p_revision', 'p_delete', 'p_operation'],
  leave: ['p_space'],
};
let serial = Promise.resolve();
const sent = [];
const server = createServer((req, res) => {
  serial = serial
    .catch(() => {})
    .then(async () => {
      const u = tokens.get((req.headers.authorization || '').replace('Bearer ', ''));
      let body = '';
      for await (const part of req) body += part;
      res.setHeader('Content-Type', 'application/json');
      if (!u) {
        res.statusCode = 401;
        res.end(JSON.stringify({ message: 'AUTH_REQUIRED', code: '42501' }));
        return;
      }
      const url = new URL(req.url, 'http://test'),
        table = url.pathname.slice(1);
      await db.exec('begin');
      try {
        await db.query("select set_config('request.jwt.claim.sub',$1,true)", [u]);
        await db.query("select set_config('request.jwt.claims',$1,true)", [
          JSON.stringify({ session_id: u, is_anonymous: false }),
        ]);
        await db.exec('set local role authenticated');
        let result;
        if (table.startsWith('rpc/')) {
          const name = table.slice(4);
          if (!args[name]) throw Error('Unknown RPC');
          const input = JSON.parse(body);
          sent.push({ user: u, name, input });
          result = (
            await db.query(
              `select public.ledger_couple_${name}(${args[name].map((_, i) => '$' + (i + 1)).join(',')}) as result`,
              args[name].map((k) => input[k] ?? null),
            )
          ).rows[0].result;
        } else {
          if (!tables.includes(table)) throw Error('Unknown table');
          const column = url.searchParams.get('column'),
            value = url.searchParams.get('value');
          if (column && !['space_id', 'id'].includes(column)) throw Error('Unknown filter');
          const order = table === 'ledger_couple_members' ? 'slot' : 'id';
          const offset = Number(url.searchParams.get('offset') || 0),
            limit = Number(url.searchParams.get('limit') || 500);
          if (!Number.isInteger(offset) || !Number.isInteger(limit) || offset < 0 || limit > 500)
            throw Error('Invalid page');
          const query = `select * from public.${table}${column ? ` where ${column}=$1` : ''} order by ${order} limit ${limit} offset ${offset}`;
          result = (await db.query(query, column ? [value] : [])).rows;
        }
        await db.exec('commit');
        res.end(JSON.stringify({ data: result, error: null }));
      } catch (e) {
        await db.exec('rollback');
        res.statusCode = 400;
        res.end(JSON.stringify({ data: null, error: { message: e.message, code: e.code } }));
      }
    });
});
await new Promise((resolve) => server.listen(0, '127.0.0.1', resolve));
const origin = `http://127.0.0.1:${server.address().port}`;
function client(user, token) {
  const x = {
    online: true,
    authenticated: true,
    loseResponse: false,
    auth: {
      getUser: async () =>
        x.online
          ? { data: { user: x.authenticated ? { id: user } : null } }
          : { data: null, error: { message: 'OFFLINE', status: 0 } },
      getSession: async () => ({
        data: { session: x.authenticated ? { user: { id: user } } : null },
      }),
      signOut: async () => {
        x.authenticated = false;
      },
    },
  };
  async function request(path, input) {
    if (!x.online) throw Error('OFFLINE');
    const response = await fetch(origin + path, {
      method: input ? 'POST' : 'GET',
      headers: {
        Authorization: 'Bearer ' + (x.authenticated ? token : 'invalid'),
        'Content-Type': 'application/json',
      },
      body: input ? JSON.stringify(input) : undefined,
    });
    const data = await response.json();
    if (x.loseResponse && path.includes('/rpc/apply') && !data.error) {
      x.loseResponse = false;
      throw Error('LOST_RESPONSE');
    }
    return data;
  }
  x.rpc = (name, input) => request('/rpc/' + name.replace('ledger_couple_', ''), input);
  x.from = (table) => {
    const q = {
      select() {
        return q;
      },
      eq(column, value) {
        q.column = column;
        q.value = value;
        return q;
      },
      order() {
        return q;
      },
      range(start, end) {
        q.offset = start;
        q.limit = end - start + 1;
        return q;
      },
      then(resolve, reject) {
        const p = new URLSearchParams();
        for (const k of ['column', 'value', 'offset', 'limit'])
          if (q[k] !== undefined) p.set(k, q[k]);
        return request('/' + table + '?' + p).then(resolve, reject);
      },
    };
    return q;
  };
  return x;
}
class Storage {
  constructor(personal) {
    this.values = new Map([['flowfi.public.v27', personal]]);
    this.read = [];
  }
  getItem(k) {
    this.read.push(k);
    return this.values.get(k) || null;
  }
  setItem(k, v) {
    this.values.set(k, v);
  }
  removeItem(k) {
    this.values.delete(k);
  }
}
let n = 0;
async function check(name, fn) {
  await fn();
  console.log('[OK]', name);
  n++;
}
const ca = client(A, 'fixture-A'),
  cb = client(B, 'fixture-B');
const sa = new Storage('PRIVATE_A_9000'),
  sb = new Storage('PRIVATE_B_15000');
let clock = Date.now();
const a = new Sync({ client: ca, storage: sa, uuid: randomUUID, clock: () => clock }),
  b = new Sync({ client: cb, storage: sb, uuid: randomUUID, clock: () => clock });
try {
  const space = await a.rpc('create', {
    p_name: 'Hogar FICTICIO',
    p_alias: 'A ficticio',
    p_currency: 'EUR',
  });
  const invite = await a.rpc('invite', { p_space: space });
  await b.rpc('join', { p_token: invite.token, p_alias: 'B ficticio' });
  await a.discover();
  await b.discover();
  const p = {
    title: 'Alquiler ficticio',
    amount_minor: 110000,
    base_minor: 110000,
    currency: 'EUR',
    fx_rate: 1,
    fx_date: '2026-10-09',
    fx_source: 'misma moneda',
    date: '2026-10-09',
    category: 'Alquiler',
    payer: A,
    splits: Core.divide(110000, [A, B], 'equal'),
  };
  await check('1100 EUR al 50/50: B debe 550 a A', () => {
    const s = Core.summary([{ kind: 'expense', payload: p }], [A, B]);
    assert.deepEqual(Core.pendingSettlement(s, [A, B]), { from: B, to: A, amount: 55000 });
  });
  await check('repartos porcentual, manual y pago íntegro conservan céntimos', () => {
    assert.deepEqual(Core.divide(101, [A, B], 'equal'), { [A]: 50, [B]: 51 });
    assert.equal(Core.divide(10000, [A, B], 'percent', '33.33')[A], 3333);
    assert.equal(Core.divide(10000, [A, B], 'manual', '40')[A], 4000);
    assert.equal(Core.divide(10000, [A, B], 'second')[B], 10000);
    assert.throws(() => Core.divide(100, [A, B], 'manual', 2));
  });
  await check('compensación pagada liquida sin duplicar gastos', () => {
    const s = Core.summary(
      [
        { kind: 'expense', payload: p },
        { kind: 'settlement', payload: { base_minor: 55000, from_user: B, to_user: A } },
      ],
      [A, B],
    );
    assert.equal(s.expenses, 110000);
    assert.equal(Core.pendingSettlement(s, [A, B]), null);
  });
  await check('aportaciones y gasto del fondo no cuentan dos veces', () => {
    const s = Core.summary(
      [
        { kind: 'account', id: 'fund', payload: {} },
        {
          kind: 'contribution',
          payload: {
            amount_minor: 100000,
            base_minor: 100000,
            payer: A,
            currency: 'EUR',
            account_id: 'fund',
          },
        },
        {
          kind: 'expense',
          payload: {
            ...p,
            amount_minor: 20000,
            base_minor: 20000,
            account_id: 'fund',
            splits: { [A]: 10000, [B]: 10000 },
          },
        },
      ],
      [A, B],
    );
    assert.equal(s.balance, 80000);
    assert.equal(s.pool, 80000);
    assert.deepEqual(Core.pendingSettlement(s, [A, B]), { from: B, to: A, amount: 10000 });
  });
  await check('cambio histórico USD reproducible y suma exacta', () => {
    const converted = {
      ...p,
      currency: 'USD',
      amount_minor: 101,
      base_minor: 93,
      fx_rate: 0.92,
      splits: Core.divide(101, [A, B], 'equal'),
    };
    const shares = Core.baseSplits(converted, [A, B]);
    assert.equal(shares[A] + shares[B], 93);
    assert.equal(Core.summary([{ kind: 'expense', payload: converted }], [A, B]).expenses, 93);
  });
  await check('copia personal saneada no incluye notas, IBAN ni cuenta', () => {
    const d = Core.personalDraft({
      type: 'expense',
      amount: 11,
      date: '2026-10-09',
      currency: 'EUR',
      category: 'Otros',
      note: 'PRIVATE_A',
      account: 'IBAN_PRIVATE',
      id: 'PERSONAL_ID',
    });
    assert.equal(d.amount_minor, 1100);
    assert.doesNotMatch(JSON.stringify(d), /PRIVATE|PERSONAL_ID|IBAN/);
    assert.throws(() => Core.personalDraft({ type: 'transfer' }));
  });
  await check('configuración rechaza service_role, destinos ajenos y HTTP', () => {
    assert.throws(() =>
      validateConfig({
        url: 'https://project.supabase.co',
        key: 'x.' + btoa(JSON.stringify({ role: 'service_role' })) + '.x',
      }),
    );
    assert.throws(() =>
      validateConfig({ url: 'https://attacker.test', key: 'sb_publishable_foo' }),
    );
    assert.throws(() =>
      validateConfig({ url: 'http://project.supabase.co', key: 'sb_publishable_foo' }),
    );
  });
  const q = a.enqueue('expense', p);
  ca.online = false;
  await check('sin conexión: cambio persistido, ningún envío ni pérdida', async () => {
    await assert.rejects(a.flush(), /OFFLINE/);
    assert.equal(a.queue.length, 1);
    assert.equal(b.view().length, 0);
    assert.equal(JSON.parse(sa.getItem(a.key())).queue[0].operation, q.operation);
  });
  await check('recarga offline conserva propuesta e identidad previamente verificada', async () => {
    const reloaded = new Sync({ client: ca, storage: sa, uuid: randomUUID, clock: () => clock });
    await reloaded.resume();
    assert.equal(reloaded.queue[0].operation, q.operation);
    assert.equal(reloaded.view()[0].payload.title, p.title);
    assert.equal(reloaded.canOffline(), true);
  });
  ca.online = true;
  await a.flush();
  await b.refresh();
  await check('dos clientes distintos reciben solo el gasto compartido', () => {
    assert.equal(a.queue.length, 0);
    assert.equal(b.entities[0].payload.amount_minor, 110000);
    assert.equal(a.entities[0].id, b.entities[0].id);
    assert.equal(sa.values.get('flowfi.public.v27'), 'PRIVATE_A_9000');
    assert.equal(sb.values.get('flowfi.public.v27'), 'PRIVATE_B_15000');
    assert.ok(!sa.read.includes('flowfi.public.v27'));
    assert.ok(!sb.read.includes('flowfi.public.v27'));
    assert.doesNotMatch(JSON.stringify(sent), /PRIVATE_A|PRIVATE_B|9000|15000/);
  });
  a.enqueue('expense', { ...p, title: 'Propuesta A' }, { id: q.id, revision: 1 });
  b.enqueue('expense', { ...p, title: 'Editado B' }, { id: q.id, revision: 1 });
  await b.flush();
  await a.flush();
  await check('conflicto: servidor conserva B y A conserva propuesta separada', () => {
    assert.equal(a.entities[0].payload.title, 'Editado B');
    assert.equal(a.conflicts[0].local.payload.title, 'Propuesta A');
    assert.equal(a.queue[0].blocked, true);
    assert.equal(a.view()[0].payload.title, 'Editado B');
  });
  a.discard(a.queue[0].operation);
  const q2 = a.enqueue('expense', { ...p, title: 'Respuesta perdida' });
  ca.loseResponse = true;
  await a.flush();
  await a.flush();
  await b.refresh();
  await check('respuesta perdida: reintento idempotente crea un solo registro', () => {
    assert.equal(a.queue.length, 0);
    assert.equal(b.entities.filter((e) => e.id === q2.id).length, 1);
    assert.equal(b.entities.length, 2);
  });
  await check('exportación y backup contienen exclusivamente Pareja', () => {
    const out = a.export();
    assert.equal(out.entities.length, 2);
    assert.equal(out.space.id, space);
    assert.doesNotMatch(JSON.stringify(out), /PRIVATE|flowfi|IBAN|email/);
    const mixed = Core.exportShared(
      a.space,
      a.members,
      [...a.entities, { space_id: randomUUID(), payload: { private: 'SECRET' } }],
      [],
    );
    assert.equal(mixed.entities.length, 2);
  });
  await check('restauración solo mismo espacio; reimportación idempotente y CAS', () => {
    const out = a.export();
    assert.deepEqual(Core.planRestore(out, a.space, a.members, a.entities), []);
    out.entities[0].payload.title = 'Restauración revisada';
    const plan = Core.planRestore(out, a.space, a.members, a.entities);
    assert.equal(plan.length, 1);
    assert.equal(plan[0].revision, a.entities[0].revision);
    assert.throws(() =>
      Core.planRestore(
        { ...out, space: { ...out.space, id: randomUUID() } },
        a.space,
        a.members,
        a.entities,
      ),
    );
    assert.throws(() =>
      Core.planRestore({ ...out, format: 'ledger.personal' }, a.space, a.members, a.entities),
    );
    assert.throws(() =>
      Core.planRestore(
        out,
        a.space,
        a.members,
        a.entities.map((e) => ({ ...e, deleted: true })),
      ),
    );
  });
  await check('petición HTTP alterada por tercero sigue sin leer ni escribir', async () => {
    const c = client(C, 'fixture-C');
    assert.equal(
      (await c.from('ledger_couple_entities').select('*').eq('space_id', space)).data.length,
      0,
    );
    const result = await c.rpc('ledger_couple_apply', {
      p_space: space,
      p_id: q.id,
      p_kind: 'expense',
      p_payload: p,
      p_revision: 2,
      p_delete: false,
      p_operation: randomUUID(),
      auth_uid: A,
    });
    assert.equal(result.error.code, '42501');
  });
  await check('acceso offline caduca: no escribe ni exporta con caché vieja', () => {
    clock += 16 * 60 * 1000;
    assert.throws(() => a.enqueue('expense', p));
    assert.throws(() => a.export());
  });
  await a.refresh();
  await check('registros inválidos quedan separados y no bloquean posteriores', async () => {
    const invalid = a.enqueue('expense', { ...p, splits: { [A]: 1, [B]: 2 } });
    const account = a.enqueue('account', { title: 'Fondo FICTICIO' });
    await a.flush();
    assert.equal(a.queue.find((x) => x.id === invalid.id).blocked, true);
    assert.ok(a.entities.some((x) => x.id === account.id));
    a.discard(invalid.operation);
    a.enqueue('contribution', {
      ...p,
      title: 'Aportación ficticia',
      account_id: account.id,
      amount_minor: 100000,
      base_minor: 100000,
    });
    a.enqueue('income', {
      ...p,
      title: 'Ingreso común ficticio',
      account_id: account.id,
      amount_minor: 20000,
      base_minor: 20000,
    });
    a.enqueue('budget', {
      title: 'Presupuesto ficticio',
      month: '2026-10',
      target_minor: 150000,
      category: 'Alquiler',
      account_id: account.id,
    });
    a.enqueue('goal', { title: 'Meta ficticia', target_minor: 500000, account_id: account.id });
    const rule = a.enqueue('recurring', { ...p, title: 'Regla ficticia', day: 9, active: true });
    await a.flush();
    assert.equal(a.queue.length, 0);
    await b.refresh();
    for (const kind of ['account', 'contribution', 'income', 'budget', 'goal', 'recurring'])
      assert.ok(b.entities.some((x) => x.kind === kind));
    assert.equal(Core.summary(b.view(), [A, B]).balance, 120000);
    const duplicate = {
      ...p,
      title: 'Ocurrencia ficticia',
      recurring_id: rule.id,
      occurrence: '2026-10',
    };
    a.enqueue('expense', duplicate);
    await a.flush();
    const second = a.enqueue('expense', duplicate);
    await a.flush();
    assert.equal(a.queue[0].id, second.id);
    assert.equal(a.queue[0].blocked, true);
    assert.match(a.conflicts[0].message, /DUPLICATE_OCCURRENCE/);
    a.discard(second.operation);
  });
  const cache = a.key();
  await a.leave();
  await check('revocación elimina caché y deniega peticiones futuras', async () => {
    assert.equal(sa.getItem(cache), null);
    assert.equal(a.space, null);
    const result = await ca.rpc('ledger_couple_apply', {
      p_space: space,
      p_id: q.id,
      p_kind: 'expense',
      p_payload: p,
      p_revision: 2,
      p_delete: false,
      p_operation: randomUUID(),
    });
    assert.equal(result.error.code, '42501');
  });
  await b.refresh();
  await check('restante conserva archivo cerrado: lectura sin nuevas escrituras', () => {
    assert.equal(b.space.status, 'closed');
    assert.equal(b.export().entities.length, 9);
    assert.throws(() => b.enqueue('expense', p));
  });
  const bkey = b.key();
  await b.logout();
  await check('cerrar sesión borra solo caché Pareja y protege API', async () => {
    assert.equal(sb.getItem(bkey), null);
    assert.equal(sb.values.get('flowfi.public.v27'), 'PRIVATE_B_15000');
    assert.equal(b.user, null);
    assert.throws(() => b.export());
    assert.equal((await cb.from('ledger_couple_entities').select('*')).code, '42501');
  });
  console.log(`${n} pruebas de dominio, sincronización y HTTP aprobadas`);
} finally {
  await new Promise((resolve) => server.close(resolve));
  await db.close();
}
