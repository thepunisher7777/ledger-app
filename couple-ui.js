(function () {
  'use strict';
  const C = window.LedgerCoupleCore,
    S = window.LedgerCoupleSync;
  let active = false,
    sync = null,
    client = null,
    personalRender = () => {},
    tab = 'home',
    filterMonth = '',
    draft = null,
    timer = null;
  const $ = (id) => document.getElementById(id),
    esc = (s) =>
      String(s ?? '').replace(
        /[&<>"']/g,
        (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c],
      ),
    today = () => new Date().toISOString().slice(0, 10),
    month = () => today().slice(0, 7);
  const money = (n, c = sync?.space?.base_currency || 'EUR') =>
    new Intl.NumberFormat('es-ES', { style: 'currency', currency: c }).format((n || 0) / 100);
  const ids = () =>
    sync?.members
      .slice()
      .sort((a, b) => a.slot - b.slot)
      .map((m) => m.user_id) || [];
  const alias = (id) => sync?.members.find((m) => m.user_id === id)?.display_name || 'Miembro';
  const rows = () => sync?.view().filter((e) => !e.deleted) || [];
  function notify(text) {
    if ($('couple-notice')) $('couple-notice').textContent = text;
  }
  function dialog(html) {
    $('couple-body').innerHTML = html;
    $('couple-dialog').showModal();
  }
  function field(name, label, value = '', type = 'text') {
    return `<label>${esc(label)}<input name="${name}" type="${type}" value="${esc(value)}" ${type === 'number' ? 'step="any"' : ''}></label>`;
  }
  function select(name, label, options, value = '') {
    return `<label>${esc(label)}<select name="${name}">${options.map(([id, n]) => `<option value="${esc(id)}" ${id === value ? 'selected' : ''}>${esc(n)}</option>`).join('')}</select></label>`;
  }
  function form(html, submit) {
    dialog(
      `<form id="couple-form">${html}<p id="couple-form-error" role="alert"></p><button class="primary-btn" type="submit">${submit}</button></form>`,
    );
  }
  function submit(fn) {
    $('couple-form').onsubmit = async (e) => {
      e.preventDefault();
      const f = e.currentTarget;
      const b = f.querySelector('[type=submit]');
      b.disabled = true;
      try {
        await fn(Object.fromEntries(new FormData(f)));
        $('couple-dialog').close();
      } catch (err) {
        $('couple-form-error').textContent = err.message;
      } finally {
        b.disabled = false;
      }
    };
  }
  function setupClient(config) {
    if (timer) {
      clearInterval(timer);
      timer = null;
    }
    if (sync?.channel) client.removeChannel(sync.channel);
    if (client) client.auth.signOut({ scope: 'local' });
    config = S.validateConfig(config);
    client = window.supabase.createClient(config.url, config.key, {
      auth: {
        persistSession: config.remember,
        storageKey: 'ledger.couple.auth.v1:' + new URL(config.url).hostname,
        autoRefreshToken: true,
        detectSessionInUrl: false,
      },
    });
    sync = new S.Sync({
      client,
      storage: localStorage,
      namespace: new URL(config.url).hostname,
      onChange: () => {
        if (active) render(tab);
      },
    });
  }
  function configure() {
    form(
      `<h2>Conectar Pareja</h2><p>Necesita un proyecto Supabase con la migración de Ledger aplicada. Solo URL y clave pública; nunca una clave administrativa. Configurar esto no sube tu espacio Personal.</p>${field('url', 'URL del proyecto', 'https://')}${field('key', 'Clave pública publishable / anon')}<label><input name=remember type=checkbox> Mantener sesión Pareja en este dispositivo privado (permite recuperar la caché offline)</label><p>No hay backend configurado por defecto. <a href="docs/COUPLE_SETUP.md" target="_blank" rel="noopener noreferrer">Instrucciones</a></p>`,
      'Guardar configuración',
    );
    submit(async (v) => {
      const cfg = S.validateConfig({ ...v, remember: v.remember === 'on' });
      localStorage.setItem(S.CONFIG_KEY, JSON.stringify(cfg));
      setupClient(cfg);
      render(tab);
    });
  }
  function login() {
    form(
      `<h2>Identidad para Pareja</h2><p>Solo el espacio compartido requiere iniciar sesión. El correo se envía al proyecto Supabase configurado.</p>${field('email', 'Correo electrónico', '', 'email')}`,
      'Enviar código',
    );
    submit(async (v) => {
      const { error } = await client.auth.signInWithOtp({
        email: v.email,
        options: { shouldCreateUser: true },
      });
      if (error) throw error;
      setTimeout(() => {
        form(
          `<h2>Verificar correo</h2>${field('email', 'Correo', v.email, 'email')}${field('code', 'Código recibido')}<p>Configura en Supabase la plantilla de correo con el código OTP.</p>`,
          'Entrar',
        );
        submit(async (x) => {
          const { error } = await client.auth.verifyOtp({
            email: x.email,
            token: x.code,
            type: 'email',
          });
          if (error) throw error;
          await sync.discover();
          await sync.flush();
          render(tab);
        });
      }, 0);
    });
  }
  function create() {
    form(
      `<h2>Crear espacio Pareja</h2>${field('name', 'Nombre del espacio', 'Hogar')}${field('alias', 'Tu nombre visible')}${select(
        'currency',
        'Moneda base histórica',
        [
          ['EUR', 'EUR'],
          ['USD', 'USD'],
        ],
        'EUR',
      )}<p>La moneda base se fija al crear el espacio. No se importa ningún dato personal.</p>`,
      'Crear espacio',
    );
    submit(async (v) => {
      await sync.rpc('create', { p_name: v.name, p_alias: v.alias, p_currency: v.currency });
      await sync.discover();
      render(tab);
    });
  }
  function join() {
    form(
      `<h2>Aceptar invitación</h2>${field('token', 'Código privado de 64 caracteres', window.LedgerCoupleInvitation?.pending || '')}${field('alias', 'Tu nombre visible')}<p>Al aceptar, compartirás únicamente los datos de Pareja con el otro miembro. La invitación caduca en 24 horas.</p>`,
      'Aceptar explícitamente',
    );
    submit(async (v) => {
      await sync.rpc('join', { p_token: v.token.trim(), p_alias: v.alias });
      window.LedgerCoupleInvitation?.clear();
      await sync.discover();
      render(tab);
    });
  }
  async function invite() {
    try {
      const x = await sync.rpc('invite', { p_space: sync.space.id });
      const link = window.LedgerCoupleInvitation.link(window.location.href, x.token);
      dialog(
        `<h2>Invitación privada</h2><p>Envía este enlace a tu pareja. Necesitará identificarse y aceptar; solo compartirá el espacio Pareja. Crear otra invitación revoca esta.</p><textarea readonly aria-label="Enlace de invitación">${esc(link)}</textarea><button id=ce-copy-invite class=primary-btn>Copiar enlace</button> <button id=ce-share-invite class=secondary-btn>Compartir</button><details><summary>Usar código manual</summary><textarea readonly aria-label="Código de invitación">${esc(x.token)}</textarea></details><p>Caduca: ${esc(new Date(x.expires_at).toLocaleString())}</p><p>Quien reciba el enlace puede aceptar: compártelo solo con tu pareja.</p>`,
      );
      $('ce-copy-invite').onclick = async () => {
        try { await navigator.clipboard.writeText(link); notify('Enlace copiado'); }
        catch { notify('Selecciona y copia el enlace del recuadro'); }
      };
      $('ce-share-invite').hidden = !navigator.share;
      $('ce-share-invite').onclick = async () => {
        try { await navigator.share({ title: 'Ledger · Invitación Pareja', url: link }); }
        catch (e) { if (e.name !== 'AbortError') notify('Puedes copiar el enlace'); }
      };
    } catch (e) {
      notify(e.message);
    }
  }
  function edit(kind = 'expense', existing = null, copy = null) {
    if (!sync?.space || ids().length !== 2 || sync.space.status !== 'active') {
      notify('Vincula a los dos miembros antes de registrar movimientos');
      return;
    }
    if (
      copy?.alreadyShared?.(
        sync.space.id,
        sync.user.id,
        [...sync.entities, ...sync.queue].map((e) => e.id),
      )
    ) {
      notify(
        'Este movimiento Personal ya tiene una copia o propuesta en este espacio. Edita la copia existente.',
      );
      return;
    }
    const p = existing?.payload || copy || {},
      members = ids().map((id) => [id, alias(id)]),
      accounts = rows()
        .filter((e) => e.kind === 'account')
        .map((e) => [e.id, e.payload.title]);
    let html = `<h2>${existing ? 'Editar' : 'Añadir'} ${esc({ expense: 'gasto', income: 'ingreso', contribution: 'aportación', settlement: 'compensación', account: 'fondo común', budget: 'presupuesto', goal: 'objetivo', recurring: 'regla recurrente' }[kind])}</h2>${field('title', 'Descripción compartida', p.title || '')}`;
    const cash = ['expense', 'income', 'contribution', 'settlement', 'recurring'].includes(kind);
    if (cash) {
      html +=
        field('amount', 'Importe', p.amount_minor || 0 ? String(p.amount_minor / 100) : '') +
        select(
          'currency',
          'Moneda',
          [
            ['EUR', 'EUR'],
            ['USD', 'USD'],
          ],
          p.currency || sync.space.base_currency,
        ) +
        field('date', 'Fecha', p.date || today(), 'date') +
        field('rate', 'Tipo de cambio a ' + sync.space.base_currency, p.fx_rate || 1, 'number') +
        field('fx_date', 'Fecha del tipo aplicado', p.fx_date || today(), 'date') +
        field('fx_source', 'Fuente del cambio', p.fx_source || 'Manual confirmado');
    }
    if (['expense', 'income', 'contribution', 'recurring', 'budget'].includes(kind))
      html += field('category', 'Categoría', p.category || 'Otros');
    if (['expense', 'income', 'contribution', 'recurring'].includes(kind))
      html +=
        select('payer', 'Quién pagó / aportó', members, p.payer || sync.user.id) +
        select(
          'account',
          'Cuenta o fondo común',
          [['', 'Pago desde fuera del fondo'], ...accounts],
          p.account_id || '',
        );
    if (['expense', 'recurring'].includes(kind)) {
      const pct = p.splits && p.amount_minor ? (100 * p.splits[ids()[0]]) / p.amount_minor : 50;
      html +=
        select(
          'mode',
          `Reparto: ${alias(ids()[0])} / ${alias(ids()[1])}`,
          [
            ['equal', '50/50'],
            ['percent', 'Porcentaje para el primer miembro'],
            ['manual', 'Importe para el primer miembro'],
            ['first', 'Todo el primer miembro'],
            ['second', 'Todo el segundo miembro'],
          ],
          p.split_mode || 'equal',
        ) +
        field(
          'share',
          'Porcentaje o importe para el primer miembro',
          p.split_mode === 'manual' ? p.splits[ids()[0]] / 100 : pct,
          'number',
        );
    }
    if (kind === 'settlement')
      html +=
        select('from', 'Quién ha transferido', members, p.from_user || sync.user.id) +
        select(
          'to',
          'Quién ha recibido',
          members,
          p.to_user || ids().find((id) => id !== sync.user.id),
        ) +
        '<p>Guarda solo cuando la transferencia ya esté pagada. No se cuenta como otro gasto.</p>';
    if (['budget', 'goal'].includes(kind))
      html +=
        field(
          'target',
          'Límite / objetivo en ' + sync.space.base_currency,
          p.target_minor ? p.target_minor / 100 : '',
          'number',
        ) +
        select('account', 'Fondo relacionado', [['', 'Todos'], ...accounts], p.account_id || '');
    if (kind === 'budget')
      html += field('month', 'Mes del presupuesto', p.month || month(), 'month');
    if (kind === 'recurring')
      html +=
        field('day', 'Día del mes (1–28)', p.day || 1, 'number') +
        select(
          'enabled',
          'Estado',
          [
            ['yes', 'Activa'],
            ['no', 'Pausada'],
          ],
          p.active === false ? 'no' : 'yes',
        ) +
        '<p>Regla para registro consciente; no genera cargos ni ejecuta tareas en segundo plano.</p>';
    if (copy)
      html +=
        '<p class="couple-warning">Copia independiente. Se compartirán únicamente descripción, importe, moneda, fecha, categoría, reparto y cambio que confirmes aquí. No se envían notas, cuenta personal, IBAN ni identificador original. El movimiento Personal permanece intacto y no se suma a Pareja.</p>';
    form(html, 'Revisar y guardar compartido');
    submit(async (v) => {
      let out = { title: v.title };
      if (cash) {
        const amount = C.minor(v.amount);
        const rate = Number(String(v.rate).replace(',', '.'));
        if (v.currency === sync.space.base_currency && rate !== 1)
          throw Error('Para la moneda base usa tipo 1');
        out = {
          ...out,
          amount_minor: amount,
          currency: v.currency,
          base_minor: Math.round(amount * rate),
          fx_rate: rate,
          fx_date: v.fx_date,
          fx_source: v.fx_source,
          date: v.date,
        };
      }
      if (v.category) out.category = v.category;
      if (v.payer) out.payer = v.payer;
      if (v.account) out.account_id = v.account;
      if (['income', 'contribution'].includes(kind) && !v.account)
        throw Error('Selecciona un fondo común');
      if (['expense', 'recurring'].includes(kind)) {
        out.splits = C.divide(out.amount_minor, ids(), v.mode, v.share);
        out.split_mode = v.mode;
      }
      if (kind === 'settlement') {
        if (v.from === v.to) throw Error('Selecciona dos miembros diferentes');
        out.from_user = v.from;
        out.to_user = v.to;
      }
      if (['goal', 'budget'].includes(kind)) out.target_minor = C.minor(v.target);
      if (kind === 'budget') out.month = v.month;
      if (kind === 'recurring') {
        out.day = Number(v.day);
        if (out.day < 1 || out.day > 28) throw Error('Día entre 1 y 28');
        out.active = v.enabled === 'yes';
      }
      if (existing?.payload.recurring_id) {
        out.recurring_id = existing.payload.recurring_id;
        out.occurrence = existing.payload.occurrence;
      }
      const review = JSON.stringify(out, null, 2);
      if (!confirm('Estos son los datos que compartes con tu pareja:\n' + review))
        throw Error('No se ha compartido nada');
      const queued = sync.enqueue(kind, out, {
        id: existing?.id,
        revision: existing?.revision || 0,
      });
      copy?.onQueued?.({ space: sync.space.id, user: sync.user.id, entity: queued.id });
      sync.flush().catch((e) => notify(e.message));
      draft = null;
      render(tab);
    });
  }
  function exportData() {
    try {
      const blob = new Blob([JSON.stringify(sync.export(), null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'ledger-pareja-' + today() + '.json';
      a.click();
      setTimeout(() => URL.revokeObjectURL(url), 1000);
    } catch (e) {
      notify(e.message);
    }
  }
  function restoreData() {
    form(
      '<h2>Restaurar copia Pareja</h2><p>Solo una copia de este mismo espacio. Se revisan los cambios, se omiten los idénticos y nunca se resucitan eliminaciones ni se importan datos Personal. Nuevos registros tendrán tu autoría de restauración.</p><input id="ce-restore-file" type="file" accept="application/json,.json" required>',
      'Revisar restauración',
    );
    submit(async () => {
      const file = $('ce-restore-file').files[0];
      if (!file || file.size > 1000000) throw Error('Copia JSON de hasta 1 MB');
      if (sync.queue.length)
        throw Error('Sincroniza o resuelve todos los cambios pendientes antes de restaurar');
      const backup = JSON.parse(await file.text());
      await sync.refresh();
      const plan = C.planRestore(backup, sync.space, sync.members, sync.entities);
      if (!plan.length) throw Error('No hay cambios que restaurar');
      if (
        !confirm(
          'Se restaurarán ' +
            plan.length +
            ' registros compartidos, con control de versiones. Revisa los campos: \n' +
            JSON.stringify(
              plan.map((p) => ({ tipo: p.kind, campos: p.payload })),
              null,
              2,
            ),
        )
      )
        throw Error('Restauración cancelada');
      for (const p of plan) sync.enqueue(p.kind, p.payload, { id: p.id, revision: p.revision });
      await sync.flush();
      if (sync.queue.length)
        notify('Algunos registros siguen pendientes o en conflicto. Revisa Ajustes.');
    });
  }
  function card(title, body) {
    return `<section class="card couple-card"><h3>${title}</h3>${body}</section>`;
  }
  function listing(items) {
    return (
      items
        .map(
          (e) =>
            `<div class="couple-row"><div><b>${esc(e.payload.title)}</b><small>${esc(e.payload.date || e.payload.month || '')} · ${esc(e.payload.category || e.kind)} ${e.pending ? ' · Pendiente de sincronizar' : ''}<br>Registró: ${esc(alias(e.created_by))} · Modificó: ${esc(alias(e.updated_by))}${e.payload.payer ? ' · Pagó: ' + esc(alias(e.payload.payer)) : ''}</small></div><strong>${money(e.payload.amount_minor || e.payload.target_minor, e.payload.currency || sync.space.base_currency)}</strong><button class="secondary-btn" data-ce-edit="${e.id}">Editar</button><button class="delete-btn" data-ce-delete="${e.id}" aria-label="Eliminar compartido">×</button></div>`,
        )
        .join('') || '<p>No hay registros compartidos.</p>'
    );
  }
  function render(route = tab) {
    if (!active) return;
    if (!['home', 'transactions', 'stats', 'plan', 'settings'].includes(route)) route = 'plan';
    tab = route;
    const root = $('main');
    $('month-menu-wrap').classList.add('hidden');
    $('fab').style.display = 'none';
    $('page-title').textContent =
      'Pareja · ' +
      ({
        home: 'Inicio',
        transactions: 'Movimientos',
        stats: 'Estadísticas',
        plan: 'Plan',
        settings: 'Ajustes',
      }[route] || 'Inicio');
    const head =
      '<p class="couple-warning">Solo finanzas compartidas. Personal sigue en este dispositivo.</p><p id="couple-notice" role="status"></p>';
    if (!client) {
      root.innerHTML =
        head +
        card(
          'Pareja necesita conexión segura',
          '<p>La sincronización no está activada: falta configurar un proyecto Supabase y sus permisos.</p><button class="primary-btn" id="ce-config">Configurar conexión</button>',
        );
      $('ce-config').onclick = configure;
      return;
    }
    if (!sync.user) {
      root.innerHTML =
        head +
        card(
          'Conectar con tu pareja',
          '<p>Inicia sesión únicamente para este espacio. No se subirán tus datos personales.</p><button class="primary-btn" id="ce-login">Entrar por correo</button> <button class="secondary-btn" id="ce-config">Cambiar conexión</button>',
        );
      $('ce-login').onclick = login;
      $('ce-config').onclick = configure;
      return;
    }
    if (!sync.space) {
      root.innerHTML =
        head +
        card(
          window.LedgerCoupleInvitation?.pending ? 'Has recibido una invitación privada' : 'Crear o unirse',
          '<button class="primary-btn" id="ce-create">Crear espacio</button> <button class="secondary-btn" id="ce-join">Aceptar invitación</button> <button class="secondary-btn" id="ce-logout">Cerrar sesión</button>',
        );
      $('ce-create').onclick = create;
      $('ce-join').onclick = join;
      $('ce-logout').onclick = () => sync.logout();
      return;
    }
    if (sync.clock() - sync.lastVerified >= 15 * 60 * 1000) {
      root.innerHTML =
        head +
        card(
          'Acceso pendiente de verificar',
          '<p>Conecta para verificar tus permisos. Los cambios pendientes se conservan.</p><button id=ce-reverify class=primary-btn>Verificar y sincronizar</button>',
        );
      $('ce-reverify').onclick = () => sync.flush().catch((e) => notify(e.message));
      return;
    }
    if (!timer && active) {
      sync.subscribe();
      timer = setInterval(() => {
        if (active && !document.hidden && navigator.onLine)
          sync.flush().catch((e) => notify(e.message));
      }, 60000);
    }
    const all = rows();
    const selected = all.filter(
      (e) =>
        !filterMonth || String(e.payload.date || e.payload.month || '').startsWith(filterMonth),
    );
    const members = ids();
    let content = '';
    const can = sync.canOffline();
    if (members.length !== 2) {
      content = card(
        'Esperando a tu pareja',
        '<p>El espacio no permite operaciones hasta que haya dos miembros.</p><button class="primary-btn" id="ce-invite">Generar invitación privada</button>',
      );
    } else {
      const total = C.summary(all, members),
        period = C.summary(selected, members),
        due = C.pendingSettlement(total, members);
      const controls = `<div class="couple-actions"><button data-ce-add="expense" class="primary-btn">Añadir gasto</button><button data-ce-add="contribution" class="secondary-btn">Aportación</button><button id="ce-sync" class="secondary-btn">Sincronizar (${sync.queue.length})</button></div><label>Mes compartido <input id="ce-month" type="month" value="${esc(filterMonth)}"></label>`;
      if (route === 'home')
        content =
          controls +
          card(
            esc(sync.space.name),
            `<div class="practical-grid"><div><small>Saldo en fondos comunes</small><h2>${money(total.balance)}</h2></div><div><small>Gastos del periodo</small><h2>${money(period.expenses)}</h2></div></div><p>${due ? `${esc(alias(due.from))} debe compensar a ${esc(alias(due.to))}: <b>${money(due.amount)}</b>` : 'No hay compensación pendiente entre ambos.'}</p><p>Saldo de aportaciones aún en el fondo: ${money(total.pool)}. No se trata como deuda entre vosotros.</p>`,
          ) +
          card(
            'Últimos movimientos',
            listing(
              selected
                .filter((e) => ['expense', 'income', 'contribution', 'settlement'].includes(e.kind))
                .sort((a, b) => String(b.payload.date).localeCompare(String(a.payload.date)))
                .slice(0, 8),
            ),
          );
      if (route === 'transactions')
        content =
          controls +
          '<div class="couple-actions"><button data-ce-add="income" class="secondary-btn">Ingreso común</button><button data-ce-add="settlement" class="secondary-btn">Registrar compensación pagada</button></div>' +
          card(
            'Movimientos compartidos',
            listing(
              selected.filter((e) =>
                ['expense', 'income', 'contribution', 'settlement'].includes(e.kind),
              ),
            ),
          );
      if (route === 'stats') {
        const cats = {};
        selected
          .filter((e) => e.kind === 'expense')
          .forEach(
            (e) =>
              (cats[e.payload.category || 'Otros'] =
                (cats[e.payload.category || 'Otros'] || 0) + e.payload.base_minor),
          );
        const max = Math.max(1, ...Object.values(cats));
        content =
          controls +
          card(
            'Gastos por categoría',
            Object.entries(cats)
              .map(
                ([k, v]) =>
                  `<p>${esc(k)} <b>${money(v)}</b><progress max="${max}" value="${v}"></progress></p>`,
              )
              .join('') || '<p>No hay gastos.</p>',
          ) +
          card(
            'Por persona',
            members
              .map(
                (id) =>
                  `<p><b>${esc(alias(id))}</b> · Adelantos / aportaciones ${money(total.paid[id])} · Asumió gastos ${money(total.owed[id])} · Crédito neto ${money(total.net[id])}</p>`,
              )
              .join(''),
          ) +
          card(
            'Importes por moneda original',
            Object.entries(period.currencies)
              .map(
                ([c, v]) =>
                  `<p>${c}: gastos ${money(v.expense, c)} · ingresos ${money(v.income, c)} · aportaciones ${money(v.contribution, c)}</p>`,
              )
              .join(''),
          ) +
          card('Historial de compensaciones', listing(all.filter((e) => e.kind === 'settlement')));
      }
      if (route === 'plan')
        content =
          controls +
          '<div class="couple-actions">' +
          ['account', 'budget', 'goal', 'recurring', 'settlement']
            .map(
              (k) =>
                `<button class="secondary-btn" data-ce-add="${k}">${{ account: 'Fondo común', budget: 'Presupuesto', goal: 'Objetivo', recurring: 'Recurrente', settlement: 'Compensación pagada' }[k]}</button>`,
            )
            .join('') +
          '</div>' +
          card(
            'Fondos comunes',
            all
              .filter((e) => e.kind === 'account')
              .map((e) => `<p>${esc(e.payload.title)} · ${money(total.accounts[e.id])}</p>`)
              .join('') + listing(all.filter((e) => e.kind === 'account')),
          ) +
          card(
            'Presupuestos',
            all
              .filter((e) => e.kind === 'budget')
              .map((e) => {
                const spent = all
                  .filter(
                    (x) =>
                      x.kind === 'expense' &&
                      x.payload.date.startsWith(e.payload.month) &&
                      (!e.payload.category || x.payload.category === e.payload.category) &&
                      (!e.payload.account_id || x.payload.account_id === e.payload.account_id),
                  )
                  .reduce((a, x) => a + x.payload.base_minor, 0);
                return `<p>${esc(e.payload.title)} (${esc(e.payload.month)}): ${money(spent)} / ${money(e.payload.target_minor)}</p>`;
              })
              .join('') + listing(all.filter((e) => e.kind === 'budget')),
          ) +
          card(
            'Objetivos de ahorro',
            all
              .filter((e) => e.kind === 'goal')
              .map(
                (e) =>
                  `<p>${esc(e.payload.title)}: ${money(e.payload.account_id ? total.accounts[e.payload.account_id] : total.balance)} / ${money(e.payload.target_minor)}</p>`,
              )
              .join('') + listing(all.filter((e) => e.kind === 'goal')),
          ) +
          card(
            'Reglas recurrentes',
            all
              .filter((e) => e.kind === 'recurring')
              .map(
                (e) =>
                  `<p>${esc(e.payload.title)} · día ${e.payload.day} · ${e.payload.active ? 'Activa' : 'Pausada'} <button class="secondary-btn" data-ce-run="${e.id}">Registrar este mes</button></p>`,
              )
              .join('') + listing(all.filter((e) => e.kind === 'recurring')),
          );
    }
    if (route === 'settings')
      content =
        card(
          'Ajustes del espacio',
          `<p>${esc(sync.space.name)} · ${esc(sync.space.base_currency)} · ${esc(sync.space.status)}</p><p>Estado de sincronización: ${sync.queue.length} cambios pendientes. ${esc(sync.error)}</p><button id="ce-sync" class="secondary-btn">Sincronizar</button> <button id="ce-export" class="secondary-btn">Exportar / copia Pareja</button> <button id="ce-restore" class="secondary-btn">Restaurar copia Pareja</button> <button id="ce-logout" class="secondary-btn">Cerrar sesión Pareja</button> <button id="ce-leave" class="secondary-btn">Abandonar y cerrar espacio</button><p>Al salir se revoca tu acceso. El otro miembro conserva lectura/exportación del archivo cerrado. Ningún dato pasa a Personal.</p><p>Las copias Pareja solo se restauran en el mismo espacio activo. Personal conserva su restauración independiente.</p>`,
        ) +
        card(
          'Conflictos',
          sync.conflicts
            .map(
              (c) =>
                `<p>${esc(c.message)}<br>Tu propuesta: ${esc(JSON.stringify(c.local.payload))}<br>Servidor: ${esc(JSON.stringify(c.remote?.payload))}<br><button class="secondary-btn" data-ce-discard="${c.operation}">Descartar mi propuesta y conservar servidor</button></p>`,
            )
            .join('') || '<p>No hay conflictos.</p>',
        ) +
        card(
          'Actividad',
          sync.activity
            .slice(-30)
            .reverse()
            .map((a) => `<p>${esc(alias(a.actor))} · ${esc(a.action)} · ${esc(a.occurred_at)}</p>`)
            .join(''),
        );
    root.innerHTML =
      head +
      (!can && sync.space.status === 'active'
        ? '<p class="couple-warning">Verificación de acceso caducada. Conecta y sincroniza; los cambios están bloqueados.</p>'
        : '') +
      content;
    root
      .querySelectorAll('[data-ce-add]')
      .forEach((b) => (b.onclick = () => edit(b.dataset.ceAdd)));
    root.querySelectorAll('[data-ce-edit]').forEach(
      (b) =>
        (b.onclick = () => {
          const e = all.find((x) => x.id === b.dataset.ceEdit);
          edit(e.kind, e);
        }),
    );
    root.querySelectorAll('[data-ce-delete]').forEach(
      (b) =>
        (b.onclick = () => {
          try {
            const e = all.find((x) => x.id === b.dataset.ceDelete);
            if (!confirm('¿Eliminar este registro compartido? Quedará constancia en el historial.'))
              return;
            sync.enqueue(e.kind, e.payload, { id: e.id, revision: e.revision, deleted: true });
            sync.flush().catch((e) => notify(e.message));
          } catch (e) {
            notify(e.message);
          }
        }),
    );
    root
      .querySelectorAll('[data-ce-discard]')
      .forEach((b) => (b.onclick = () => sync.discard(b.dataset.ceDiscard)));
    root.querySelectorAll('[data-ce-run]').forEach(
      (b) =>
        (b.onclick = () => {
          try {
            const e = all.find((x) => x.id === b.dataset.ceRun);
            if (!e.payload.active) throw Error('Regla pausada');
            if (!confirm('¿Registrar este gasto recurrente para ' + month() + '?')) return;
            const p = {
              ...e.payload,
              date: month() + '-' + String(e.payload.day).padStart(2, '0'),
              recurring_id: e.id,
              occurrence: month(),
            };
            delete p.day;
            delete p.active;
            sync.enqueue('expense', p);
            sync.flush().catch((e) => notify(e.message));
          } catch (e) {
            notify(e.message);
          }
        }),
    );
    if ($('ce-month'))
      $('ce-month').onchange = (e) => {
        filterMonth = e.target.value;
        render(tab);
      };
    if ($('ce-invite')) $('ce-invite').onclick = invite;
    if ($('ce-sync')) $('ce-sync').onclick = () => sync.flush().catch((e) => notify(e.message));
    if ($('ce-export')) $('ce-export').onclick = exportData;
    if ($('ce-restore')) $('ce-restore').onclick = restoreData;
    if ($('ce-logout'))
      $('ce-logout').onclick = () => {
        if (
          sync.queue.length &&
          !confirm(
            'Hay cambios pendientes. Cerrar sesión borrará la caché y esas propuestas. ¿Continuar?',
          )
        )
          return;
        sync.logout();
      };
    if ($('ce-leave'))
      $('ce-leave').onclick = async () => {
        if (
          !confirm(
            'Exporta antes si necesitas una copia. Abandonar revoca tu acceso y cierra el espacio; no podrás volver a unirte. ¿Confirmas?',
          )
        )
          return;
        try {
          await sync.leave();
          render(tab);
        } catch (e) {
          notify(e.message);
        }
      };
    if (draft && sync.space.status === 'active') {
      const d = draft;
      draft = null;
      setTimeout(() => edit(d.kind, null, d), 0);
    }
  }
  function switchSpace(value) {
    active = value === 'couple';
    document.querySelectorAll('[data-ledger-space]').forEach((b) => {
      const yes = (b.dataset.ledgerSpace === 'couple') === active;
      b.classList.toggle('active', yes);
      b.setAttribute('aria-pressed', String(yes));
    });
    if (timer) {
      clearInterval(timer);
      timer = null;
    }
    if (active) {
      render(tab);
      if (sync && !sync.user) sync.resume().catch((e) => notify(e.message));
      if (sync?.space) sync.flush().catch((e) => notify(e.message));
    } else {
      if (sync?.channel) {
        client.removeChannel(sync.channel);
        sync.channel = null;
      }
      $('month-menu-wrap').classList.remove('hidden');
      $('fab').style.display = '';
      personalRender();
    }
  }
  window.LedgerCouple = {
    isActive: () => active,
    render,
    configure: (h) => {
      personalRender = h.renderPersonal;
    },
    open: () => edit(),
    offerCopy: (d) => {
      draft = d;
      $('transaction-dialog').close();
      switchSpace('couple');
    },
    getSync: () => sync,
  };
  function init() {
    document
      .querySelectorAll('[data-ledger-space]')
      .forEach((b) => (b.onclick = () => switchSpace(b.dataset.ledgerSpace)));
    $('couple-close').onclick = () => $('couple-dialog').close();
    try {
      const config = localStorage.getItem(S.CONFIG_KEY);
      if (config) setupClient(JSON.parse(config));
    } catch {}
    if (window.LedgerCoupleInvitation?.pending) switchSpace('couple');
    window.addEventListener('online', () => {
      if (active && sync?.space) sync.flush().catch((e) => notify(e.message));
    });
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
  else init();
})();
