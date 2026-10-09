// Native Ledger DOM, fictional local fixtures. Hosted Auth is tested separately.
const { JSDOM } = require('jsdom');
const fs = require('node:fs'),
  assert = require('node:assert/strict'),
  path = require('node:path');
const root = path.resolve(__dirname, '..');
const A = 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',
  B = 'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb',
  space = 'eeeeeeee-eeee-4eee-8eee-eeeeeeeeeeee';
const fixture = {
  ledger_couple_spaces: [
    { id: space, name: 'Hogar ficticio', base_currency: 'EUR', status: 'active' },
  ],
  ledger_couple_members: [
    { space_id: space, user_id: A, slot: 1, display_name: 'A ficticio', active: true },
    { space_id: space, user_id: B, slot: 2, display_name: 'B ficticio', active: true },
  ],
  ledger_couple_entities: [
    {
      id: '11111111-1111-4111-8111-111111111111',
      space_id: space,
      kind: 'expense',
      revision: 1,
      created_by: A,
      updated_by: A,
      deleted: false,
      payload: {
        title: 'Alquiler COMPARTIDO',
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
      },
    },
  ],
  ledger_couple_activity: [],
};
const client = {
  auth: { getUser: async () => ({ data: { user: { id: A } } }), signOut: async () => {} },
  from(table) {
    const q = {
      select() {
        return q;
      },
      eq() {
        return q;
      },
      order() {
        return q;
      },
      range() {
        return q;
      },
      then(fn) {
        return Promise.resolve({ data: fixture[table], error: null }).then(fn);
      },
    };
    return q;
  },
  rpc: async () => ({ error: { message: 'Fixture is read only' } }),
};
const modules = [
  'money.js',
  'portfolio-import.js',
  'couple-core.js',
  'couple-sync.js',
  'couple-ui.js',
];
let html = fs
  .readFileSync(path.join(root, 'index.html'), 'utf8')
  .replace(/<script src="([^"]+)"><\/script>/g, (_, name) =>
    modules.includes(name)
      ? '<script>' + fs.readFileSync(path.join(root, name), 'utf8') + '</script>'
      : '',
  );
html = html.replace(
  'render();refreshExchangeRates();analyticsMaybeAsk();maybeStartFlowFiMigration();if(bootRecoveryNotice)',
  'window.audit={defaultState,setRoute,render,openTransaction,validateBackupObject,getState:()=>state,setState:s=>state=s};render();if(bootRecoveryNotice)',
);
const errors = [],
  dom = new JSDOM(html, {
    url: 'https://ledger.test/',
    runScripts: 'dangerously',
    pretendToBeVisual: true,
    beforeParse(w) {
      w.supabase = { createClient: () => client };
      w.localStorage.setItem('ledger.analytics.consent.v1', 'no');
      w.matchMedia = () => ({ matches: false, addEventListener() {} });
      w.scrollTo = () => {};
      w.confirm = () => true;
      w.fetch = async () => {
        throw Error('no external network in UI tests');
      };
      w.HTMLDialogElement.prototype.showModal = function () {
        this.open = true;
      };
      w.HTMLDialogElement.prototype.close = function () {
        this.open = false;
      };
      w.addEventListener('error', (e) => errors.push(e.error));
    },
  });
let count = 0;
function check(name, fn) {
  fn();
  count++;
  console.log('[OK]', name);
}
(async () => {
  const w = dom.window,
    d = w.document,
    a = w.audit;
  await new Promise((r) => w.setTimeout(r, 0));
  try {
    const state = a.defaultState();
    state.transactions = [
      {
        id: 'personal-fixture',
        type: 'expense',
        amount: 9000,
        date: '2026-10-09',
        category: 'Otros',
        account: 'Principal',
        note: 'PRIVATE_PERSONAL_A',
        currency: 'EUR',
      },
    ];
    a.setState(state);
    w.localStorage.setItem('flowfi.public.v27', JSON.stringify(state));
    const original = w.localStorage.getItem('flowfi.public.v27');
    const switchTo = (s) => d.querySelector(`[data-ledger-space="${s}"]`).click();
    switchTo('couple');
    check('sin backend: estado explícito y configuración operativa', () => {
      assert.match(d.getElementById('main').textContent, /falta configurar/);
      d.getElementById('ce-config').click();
      assert.equal(d.getElementById('couple-dialog').open, true);
      assert.ok(d.querySelector('[name=url]'));
      d.getElementById('couple-close').click();
    });
    check('navegación sin configurar nunca muestra finanzas personales', () => {
      for (const route of ['home', 'transactions', 'stats', 'plan', 'settings']) {
        a.setRoute(route);
        assert.doesNotMatch(d.getElementById('main').textContent, /PRIVATE_PERSONAL_A|9.000/);
      }
      assert.equal(w.localStorage.getItem('flowfi.public.v27'), original);
    });
    // Configure through the actual form, then discover through the read-only test transport.
    d.getElementById('ce-config').click();
    d.querySelector('[name=url]').value = 'https://fictional-project.supabase.co';
    d.querySelector('[name=key]').value = 'sb_publishable_fixture_for_dom_tests';
    d.getElementById('couple-form').dispatchEvent(new w.Event('submit', { cancelable: true }));
    await new Promise((r) => w.setTimeout(r, 0));
    const sync = w.LedgerCouple.getSync();
    sync.uuid = () => require('node:crypto').randomUUID();
    await sync.discover();
    check('todas las rutas Pareja usan solo el espacio compartido', () => {
      for (const route of ['home', 'transactions', 'stats', 'plan', 'settings']) {
        a.setRoute(route);
        assert.doesNotMatch(d.getElementById('main').textContent, /PRIVATE_PERSONAL_A|9.000/);
      }
      assert.equal(sync.entities.length, 1);
      assert.equal(w.localStorage.getItem('flowfi.public.v27'), original);
    });
    a.setRoute('transactions');
    check('movimientos y estadísticas reflejan alquiler compartido de 1100', () => {
      assert.match(d.getElementById('main').textContent, /Alquiler COMPARTIDO/);
      a.setRoute('stats');
      assert.match(d.getElementById('main').textContent, /1\.?100,00/);
      assert.doesNotMatch(d.getElementById('main').textContent, /9\.?000,00/);
    });
    check('filtro de mes compartido no modifica datos ni periodo Personal', () => {
      d.getElementById('ce-month').value = '2026-09';
      d.getElementById('ce-month').dispatchEvent(new w.Event('change'));
      assert.match(d.getElementById('main').textContent, /No hay gastos/);
      d.getElementById('ce-month').value = '';
      d.getElementById('ce-month').dispatchEvent(new w.Event('change'));
      assert.equal(w.localStorage.getItem('flowfi.public.v27'), original);
    });
    switchTo('personal');
    a.setRoute('transactions');
    check('volver a Personal restaura datos privados y oculta Pareja', () => {
      assert.match(d.getElementById('main').textContent, /PRIVATE_PERSONAL_A/);
      assert.doesNotMatch(d.getElementById('main').textContent, /Alquiler COMPARTIDO/);
      assert.equal(d.getElementById('month-menu-wrap').classList.contains('hidden'), false);
      assert.deepEqual(
        JSON.parse(w.localStorage.getItem('flowfi.public.v27')),
        JSON.parse(original),
      );
    });
    a.openTransaction(null, 'personal-fixture');
    d.getElementById('copy-to-couple').click();
    await new Promise((r) => w.setTimeout(r, 0));
    check('traspaso abre revisión editable sin enviar ni compartir notas', () => {
      assert.equal(d.getElementById('couple-dialog').open, true);
      assert.equal(d.querySelector('[name=title]').value, 'Movimiento compartido');
      assert.equal(d.querySelector('[name=amount]').value, '9000');
      assert.doesNotMatch(
        d.getElementById('couple-body').textContent,
        /PRIVATE_PERSONAL_A|Principal/,
      );
      assert.equal(sync.queue.length, 0);
      assert.equal(sync.entities.length, 1);
      assert.equal(w.localStorage.getItem('flowfi.public.v27'), original);
    });
    d.getElementById('couple-form').dispatchEvent(new w.Event('submit', { cancelable: true }));
    await new Promise((r) => w.setTimeout(r, 0));
    switchTo('personal');
    a.openTransaction(null, 'personal-fixture');
    d.getElementById('copy-to-couple').click();
    await new Promise((r) => w.setTimeout(r, 0));
    check('repetir copia consciente en el mismo dispositivo no duplica registros', () => {
      assert.equal(sync.queue.length, 1);
      assert.equal(d.getElementById('couple-dialog').open, false);
      assert.match(d.getElementById('couple-notice').textContent, /ya tiene una copia/);
      assert.equal(w.localStorage.getItem('flowfi.public.v27'), original);
      assert.ok(w.localStorage.getItem('ledger.couple.copy-receipts.v1'));
    });
    check('no hay errores de ejecución en la interfaz nativa', () => assert.deepEqual(errors, []));
    const secondErrors = [];
    const second = new JSDOM(html, {
      url: 'https://ledger.test/',
      runScripts: 'dangerously',
      pretendToBeVisual: true,
      beforeParse(v) {
        v.supabase = {
          createClient: () => ({
            ...client,
            auth: { getUser: async () => ({ data: { user: { id: B } } }), signOut: async () => {} },
          }),
        };
        v.localStorage.setItem(
          'ledger.couple.config.v1',
          JSON.stringify({
            url: 'https://fictional-project.supabase.co',
            key: 'sb_publishable_fixture_for_dom_tests',
          }),
        );
        v.localStorage.setItem('ledger.analytics.consent.v1', 'no');
        v.matchMedia = () => ({ matches: false, addEventListener() {} });
        v.scrollTo = () => {};
        v.confirm = () => true;
        v.HTMLDialogElement.prototype.showModal = function () {
          this.open = true;
        };
        v.HTMLDialogElement.prototype.close = function () {
          this.open = false;
        };
        v.addEventListener('error', (e) => secondErrors.push(e.error));
      },
    });
    try {
      await new Promise((r) => second.window.setTimeout(r, 0));
      const v = second.window,
        da = v.document,
        ab = v.audit;
      const own = ab.defaultState();
      own.transactions = [
        {
          id: 'personal-B',
          type: 'income',
          amount: 15000,
          date: '2026-10-09',
          currency: 'EUR',
          category: 'Salario',
          account: 'Principal',
          note: 'PRIVATE_PERSONAL_B',
        },
      ];
      ab.setState(own);
      v.localStorage.setItem('flowfi.public.v27', JSON.stringify(own));
      da.querySelector('[data-ledger-space=couple]').click();
      await v.LedgerCouple.getSync().discover();
      check('segundo dispositivo B: finanzas diferentes, mismo espacio sin mezcla', () => {
        for (const route of ['home', 'transactions', 'stats', 'plan', 'settings']) {
          ab.setRoute(route);
          assert.doesNotMatch(
            da.getElementById('main').textContent,
            /PRIVATE_PERSONAL_A|PRIVATE_PERSONAL_B|15\.?000,00/,
          );
        }
        assert.equal(v.LedgerCouple.getSync().user.id, B);
        assert.equal(v.LedgerCouple.getSync().entities[0].payload.amount_minor, 110000);
        da.querySelector('[data-ledger-space=personal]').click();
        ab.setRoute('transactions');
        assert.match(da.getElementById('main').textContent, /PRIVATE_PERSONAL_B/);
        assert.doesNotMatch(
          da.getElementById('main').textContent,
          /PRIVATE_PERSONAL_A|Alquiler COMPARTIDO/,
        );
        assert.deepEqual(
          JSON.parse(v.localStorage.getItem('flowfi.public.v27')),
          JSON.parse(JSON.stringify(own)),
        );
        assert.deepEqual(secondErrors, []);
      });
    } finally {
      second.window.close();
    }
    console.log(`${count} pruebas de aislamiento e interfaz aprobadas`);
  } finally {
    dom.window.close();
  }
})().catch((e) => {
  console.error(e);
  process.exitCode = 1;
});
