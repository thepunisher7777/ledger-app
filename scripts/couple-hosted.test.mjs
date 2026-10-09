// Optional, MUTATING acceptance runner for an isolated authorized test project.
// Never run against production or real financial identities. No admin key is used.
import { createClient } from '@supabase/supabase-js';
import { randomUUID } from 'node:crypto';
import assert from 'node:assert/strict';
import SyncModule from '../couple-sync.js';
const env = process.env;
if (env.COUPLE_E2E_ALLOW_MUTATIONS !== 'fictional-only')
  throw Error(
    'Set COUPLE_E2E_ALLOW_MUTATIONS=fictional-only only for an isolated authorized test project',
  );
const config = SyncModule.validateConfig({
  url: env.COUPLE_E2E_URL,
  key: env.COUPLE_E2E_PUBLIC_KEY,
});
const clients = [];
let count = 0,
  space;
async function check(name, fn) {
  await fn();
  count++;
  console.log('[OK]', name);
}
async function rpc(c, name, args) {
  const { data, error } = await c.rpc('ledger_couple_' + name, args);
  if (error) {
    const e = Error(error.message);
    e.code = error.code;
    throw e;
  }
  return data;
}
try {
  for (const alias of ['A', 'B', 'C']) {
    const email = env['COUPLE_E2E_' + alias + '_EMAIL'],
      password = env['COUPLE_E2E_' + alias + '_PASSWORD'];
    if (!email || !password)
      throw Error('Three pre-created fictional test identities are required');
    const client = createClient(config.url, config.key, {
      auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false },
    });
    const { data, error } = await client.auth.signInWithPassword({ email, password });
    if (error) throw Error('Unable to authenticate fictional test identity ' + alias);
    const existing = await client.from('ledger_couple_spaces').select('id');
    if (existing.error || existing.data.length)
      throw Error('Fixture identity already has an accessible space; aborting without altering it');
    clients.push({ client, id: data.user.id });
  }
  const [{ client: a, id: A }, { client: b, id: B }, { client: c }] = clients;
  space = await rpc(a, 'create', {
    p_name: 'COUPLE E2E FICTICIO ' + randomUUID().slice(0, 8),
    p_alias: 'A FICTICIO',
    p_currency: 'EUR',
  });
  const invite = await rpc(a, 'invite', { p_space: space });
  await rpc(b, 'join', { p_token: invite.token, p_alias: 'B FICTICIO' });
  const id = randomUUID(),
    op = randomUUID(),
    p = {
      title: 'Alquiler FICTICIO',
      amount_minor: 110000,
      base_minor: 110000,
      currency: 'EUR',
      fx_rate: 1,
      fx_date: '2026-10-09',
      fx_source: 'test misma moneda',
      date: '2026-10-09',
      payer: A,
      splits: { [A]: 55000, [B]: 55000 },
    };
  const input = {
    p_space: space,
    p_id: id,
    p_kind: 'expense',
    p_payload: p,
    p_revision: 0,
    p_delete: false,
    p_operation: op,
  };
  await check('Supabase HTTP: outsider cannot mutate even with a known UUID', () =>
    assert.rejects(rpc(c, 'apply', input)),
  );
  await check('Supabase HTTP: private fields rejected', () =>
    assert.rejects(
      rpc(a, 'apply', {
        ...input,
        p_payload: { ...p, personal_account: 'FICTICIO' },
        p_operation: randomUUID(),
      }),
    ),
  );
  let received = false;
  const channel = b.channel('couple-e2e-' + space).on(
    'postgres_changes',
    {
      event: 'INSERT',
      schema: 'public',
      table: 'ledger_couple_entities',
      filter: 'space_id=eq.' + space,
    },
    () => {
      received = true;
    },
  );
  await new Promise((resolve, reject) => {
    const timeout = setTimeout(() => reject(Error('Realtime subscription timeout')), 15000);
    channel.subscribe((status) => {
      if (status === 'SUBSCRIBED') {
        clearTimeout(timeout);
        resolve();
      }
      if (['CHANNEL_ERROR', 'TIMED_OUT'].includes(status)) {
        clearTimeout(timeout);
        reject(Error('Realtime subscription failed'));
      }
    });
  });
  const entity = await rpc(a, 'apply', input);
  await check('Supabase Realtime: B receives A shared insertion', async () => {
    const deadline = Date.now() + 15000;
    while (!received && Date.now() < deadline) await new Promise((r) => setTimeout(r, 100));
    assert.equal(received, true);
  });
  await b.removeChannel(channel);
  await check('Supabase HTTP: B reads shared, C sees zero rows', async () => {
    const rb = await b.from('ledger_couple_entities').select('*').eq('space_id', space),
      rc = await c.from('ledger_couple_entities').select('*').eq('space_id', space);
    assert.equal(rb.error, null);
    assert.equal(rb.data.length, 1);
    assert.equal(rc.error, null);
    assert.equal(rc.data.length, 0);
  });
  await check('Supabase HTTP: direct table writes denied', async () => {
    const r = await b.from('ledger_couple_entities').update({ payload: {} }).eq('id', id);
    assert.ok(r.error);
  });
  await check('Supabase HTTP: idempotent retry retains single record', async () => {
    assert.deepEqual(await rpc(a, 'apply', input), entity);
    const r = await a.from('ledger_couple_entities').select('id').eq('space_id', space);
    assert.equal(r.data.length, 1);
  });
  await rpc(b, 'apply', {
    ...input,
    p_revision: 1,
    p_payload: { ...p, title: 'B edit FICTICIO' },
    p_operation: randomUUID(),
  });
  await check('Supabase HTTP: stale edit rejected', () =>
    assert.rejects(
      rpc(a, 'apply', {
        ...input,
        p_revision: 1,
        p_payload: { ...p, title: 'A stale FICTICIO' },
        p_operation: randomUUID(),
      }),
    ),
  );
  await check('Supabase HTTP: consumed invitation rejects outsider', () =>
    assert.rejects(rpc(c, 'join', { p_token: invite.token, p_alias: 'C FICTICIO' })),
  );
  const beforeLogout = await b.auth.getSession();
  const revokedToken = beforeLogout.data.session.access_token;
  await b.auth.signOut({ scope: 'local' });
  await check('Supabase HTTP: replay of signed JWT after logout cannot read or write', async () => {
    const headers = { apikey: config.key, Authorization: 'Bearer ' + revokedToken };
    const read = await fetch(config.url + '/rest/v1/ledger_couple_entities?space_id=eq.' + space, {
      headers,
    });
    if (read.ok) assert.deepEqual(await read.json(), []);
    else assert.ok([401, 403].includes(read.status));
    const write = await fetch(config.url + '/rest/v1/rpc/ledger_couple_apply', {
      method: 'POST',
      headers: { ...headers, 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...input, p_revision: 2, p_operation: randomUUID() }),
    });
    assert.ok([401, 403].includes(write.status));
  });
  const relogin = await b.auth.signInWithPassword({
    email: env.COUPLE_E2E_B_EMAIL,
    password: env.COUPLE_E2E_B_PASSWORD,
  });
  if (relogin.error) throw Error('Unable to reauthenticate fictional identity B');
  await rpc(a, 'leave', { p_space: space });
  await check(
    'Supabase HTTP: leaving revokes reads and even old idempotent operations',
    async () => {
      const r = await a.from('ledger_couple_entities').select('*').eq('space_id', space);
      assert.equal(r.data.length, 0);
      await assert.rejects(rpc(a, 'apply', input));
    },
  );
  await check('Supabase HTTP: remaining member can read closed space but not write', async () => {
    const r = await b.from('ledger_couple_spaces').select('status').eq('id', space);
    assert.equal(r.data[0].status, 'closed');
    await assert.rejects(rpc(b, 'apply', { ...input, p_revision: 2, p_operation: randomUUID() }));
  });
  await rpc(b, 'leave', { p_space: space });
  await a.auth.signOut();
  await check('Supabase HTTP: signed-out client cannot call shared RPC', () =>
    assert.rejects(
      rpc(a, 'create', { p_name: 'FICTICIO', p_alias: 'FICTICIO', p_currency: 'EUR' }),
    ),
  );
  console.log(
    `${count} hosted acceptance checks passed. Fictional closed audit archive retained; no hard deletion performed.`,
  );
} finally {
  for (const x of clients) {
    await x.client.removeAllChannels();
    await x.client.auth.signOut();
  }
}
