(function (root, factory) {
  const api = factory();
  if (typeof module === 'object' && module.exports) module.exports = api;
  else root.LedgerCoupleCore = api;
})(typeof globalThis !== 'undefined' ? globalThis : this, function () {
  'use strict';
  function validDate(s) {
    return (
      typeof s === 'string' &&
      /^\d{4}-\d{2}-\d{2}$/.test(s) &&
      !Number.isNaN(Date.parse(s)) &&
      new Date(s).toISOString().slice(0, 10) === s
    );
  }
  const kinds = [
    'expense',
    'income',
    'contribution',
    'settlement',
    'account',
    'budget',
    'goal',
    'recurring',
  ];
  const fields = [
    'title',
    'amount_minor',
    'currency',
    'base_minor',
    'fx_rate',
    'fx_date',
    'fx_source',
    'date',
    'category',
    'payer',
    'splits',
    'account_id',
    'from_user',
    'to_user',
    'month',
    'target_minor',
    'day',
    'active',
    'recurring_id',
    'occurrence',
    'split_mode',
  ];
  function minor(value) {
    const s = String(value).trim().replace(',', '.');
    if (!/^\d+(\.\d{1,2})?$/.test(s)) throw Error('Introduce un importe con hasta dos decimales');
    const [a, b = ''] = s.split('.');
    const n = Number(a) * 100 + Number(b.padEnd(2, '0'));
    if (!Number.isSafeInteger(n) || n <= 0 || n > 1e11) throw Error('Importe fuera de rango');
    return n;
  }
  function divide(amount, ids, mode, value) {
    if (ids.length !== 2 || new Set(ids).size !== 2) throw Error('Se necesitan dos miembros');
    let a;
    if (mode === 'equal') a = Math.floor(amount / 2);
    else if (mode === 'percent') {
      const pct = Number(String(value).replace(',', '.'));
      if (!Number.isFinite(pct) || pct < 0 || pct > 100) throw Error('Porcentaje inválido');
      a = Math.round((amount * pct) / 100);
    } else if (mode === 'manual') a = String(value) === '0' ? 0 : minor(value);
    else if (mode === 'first') a = amount;
    else if (mode === 'second') a = 0;
    else throw Error('Reparto inválido');
    if (a < 0 || a > amount) throw Error('El reparto supera el gasto');
    return { [ids[0]]: a, [ids[1]]: amount - a };
  }
  function baseSplits(p, ids) {
    const first = Math.round(Number(p.splits[ids[0]]) * Number(p.fx_rate));
    return { [ids[0]]: first, [ids[1]]: p.base_minor - first };
  }
  function summary(rows, ids) {
    const paid = Object.fromEntries(ids.map((id) => [id, 0])),
      owed = { ...paid },
      net = { ...paid };
    let expenses = 0,
      income = 0,
      contributions = 0;
    const accounts = {};
    const currencies = {};
    for (const e of rows.filter((x) => !x.deleted)) {
      const p = e.payload;
      const n = p.base_minor || 0;
      const account = p.account_id;
      if (e.kind === 'account') {
        accounts[e.id] ??= 0;
        continue;
      }
      if (['expense', 'income', 'contribution'].includes(e.kind)) {
        currencies[p.currency] ??= { expense: 0, income: 0, contribution: 0 };
        currencies[p.currency][e.kind] += p.amount_minor;
      }
      if (e.kind === 'expense') {
        expenses += n;
        const shares = baseSplits(p, ids);
        for (const id of ids) owed[id] += shares[id];
        if (account) {
          accounts[account] = (accounts[account] || 0) - n;
          for (const id of ids) net[id] -= shares[id];
        } else {
          paid[p.payer] += n;
          net[p.payer] += n;
          for (const id of ids) net[id] -= shares[id];
        }
      }
      if (e.kind === 'income') {
        income += n;
        if (account) accounts[account] = (accounts[account] || 0) + n;
      }
      if (e.kind === 'contribution') {
        contributions += n;
        paid[p.payer] += n;
        net[p.payer] += n;
        if (account) accounts[account] = (accounts[account] || 0) + n;
      }
      if (e.kind === 'settlement') {
        net[p.from_user] += n;
        net[p.to_user] -= n;
      }
    }
    return {
      expenses,
      income,
      contributions,
      paid,
      owed,
      net,
      accounts,
      currencies,
      balance: Object.values(accounts).reduce((a, b) => a + b, 0),
      pool: Object.values(net).reduce((a, b) => a + b, 0),
    };
  }
  function pendingSettlement(s, ids) {
    const [a, b] = ids;
    if (s.net[a] > 0 && s.net[b] < 0)
      return { from: b, to: a, amount: Math.min(s.net[a], -s.net[b]) };
    if (s.net[b] > 0 && s.net[a] < 0)
      return { from: a, to: b, amount: Math.min(s.net[b], -s.net[a]) };
    return null;
  }
  function payload(kind, input) {
    if (!kinds.includes(kind)) throw Error('Tipo inválido');
    const out = {};
    for (const k of fields) if (Object.hasOwn(input, k)) out[k] = input[k];
    if (typeof out.title !== 'string' || !out.title.trim() || out.title.length > 160)
      throw Error('Descripción obligatoria (máximo 160 caracteres)');
    if (['expense', 'income', 'contribution', 'settlement', 'recurring'].includes(kind)) {
      if (
        !['EUR', 'USD'].includes(out.currency) ||
        !Number.isSafeInteger(out.amount_minor) ||
        out.amount_minor <= 0 ||
        out.amount_minor > 1e11 ||
        !Number.isSafeInteger(out.base_minor) ||
        out.base_minor <= 0 ||
        out.base_minor > 1e11 ||
        !Number.isFinite(out.fx_rate) ||
        out.fx_rate <= 0 ||
        out.fx_rate > 1000 ||
        Math.round(out.amount_minor * out.fx_rate) !== out.base_minor
      )
        throw Error('Importe o conversión inválida');
      if (
        !validDate(out.date) ||
        !validDate(out.fx_date) ||
        typeof out.fx_source !== 'string' ||
        !out.fx_source ||
        out.fx_source.length > 80
      )
        throw Error('Fecha y fuente de cambio obligatorias');
    }
    return out;
  }
  // Explicit sanitised copy: no account, note, splits, balance or bank identifier travels.
  function personalDraft(tx) {
    if (!['expense', 'income'].includes(tx.type))
      throw Error('Solo se copian ingresos o gastos individuales');
    if (!['EUR', 'USD'].includes(tx.currency)) throw Error('Moneda no compatible');
    return {
      kind: tx.type,
      title: 'Movimiento compartido',
      amount_minor: minor(tx.amount),
      currency: ['EUR', 'USD'].includes(tx.currency) ? tx.currency : 'EUR',
      date: String(tx.date).slice(0, 10),
      category: String(tx.category || 'Otros').slice(0, 80),
    };
  }
  function exportShared(space, members, entities, activity) {
    return {
      format: 'ledger.couple.v1',
      exported_at: new Date().toISOString(),
      space: {
        id: space.id,
        name: space.name,
        base_currency: space.base_currency,
        status: space.status,
      },
      members: members
        .filter((m) => m.space_id === space.id)
        .map((m) => ({
          user_id: m.user_id,
          display_name: m.display_name,
          slot: m.slot,
          active: m.active,
        })),
      entities: entities
        .filter((e) => e.space_id === space.id)
        .map((e) => ({
          id: e.id,
          space_id: e.space_id,
          kind: e.kind,
          payload: payload(e.kind, e.payload),
          revision: e.revision,
          deleted: e.deleted,
          created_by: e.created_by,
          updated_by: e.updated_by,
          created_at: e.created_at,
          updated_at: e.updated_at,
        })),
      activity: activity
        .filter((a) => a.space_id === space.id)
        .map((a) => ({
          actor: a.actor,
          action: a.action,
          entity_id: a.entity_id,
          revision: a.revision,
          occurred_at: a.occurred_at,
        })),
    };
  }
  function planRestore(backup, space, members, current) {
    if (
      backup?.format !== 'ledger.couple.v1' ||
      backup.space?.id !== space.id ||
      backup.space?.base_currency !== space.base_currency ||
      !Array.isArray(backup.entities) ||
      backup.entities.length > 500
    )
      throw Error('Solo copias Pareja del mismo espacio y moneda (máximo 500 registros)');
    const ids = members.filter((m) => m.active).map((m) => m.user_id),
      seen = new Set(),
      plan = [];
    if (ids.length !== 2 || space.status !== 'active')
      throw Error('La restauración requiere un espacio activo con dos miembros');
    for (const row of backup.entities) {
      if (
        !/^[a-f0-9-]{36}$/.test(row.id) ||
        seen.has(row.id) ||
        row.space_id !== space.id ||
        typeof row.deleted !== 'boolean'
      )
        throw Error('Copia con identificadores inválidos, duplicados o de otro espacio');
      seen.add(row.id);
      if (row.deleted) continue;
      if (Object.keys(row.payload || {}).some((k) => !fields.includes(k)))
        throw Error('La copia contiene campos no compartidos');
      const p = payload(row.kind, row.payload);
      if (
        ['expense', 'recurring'].includes(row.kind) &&
        (!ids.includes(p.payer) ||
          !p.splits ||
          Object.keys(p.splits).length !== 2 ||
          ids.some((id) => !Number.isSafeInteger(p.splits[id]) || p.splits[id] < 0) ||
          ids.reduce((n, id) => n + p.splits[id], 0) !== p.amount_minor)
      )
        throw Error('Reparto o miembros no válidos');
      if (['income', 'contribution'].includes(row.kind) && !ids.includes(p.payer))
        throw Error('Pagador no válido');
      if (
        row.kind === 'settlement' &&
        (!ids.includes(p.from_user) || !ids.includes(p.to_user) || p.from_user === p.to_user)
      )
        throw Error('Compensación no válida');
      const existing = current.find((e) => e.id === row.id);
      if (existing?.deleted)
        throw Error('Un registro eliminado no puede resucitarse desde una copia');
      if (existing && existing.kind !== row.kind) throw Error('Tipo de registro cambiado');
      if (
        existing &&
        JSON.stringify(payload(existing.kind, existing.payload)) === JSON.stringify(p)
      )
        continue;
      plan.push({ id: row.id, kind: row.kind, payload: p, revision: existing?.revision || 0 });
    }
    return plan.sort((a, b) => (a.kind === 'account' ? 0 : 1) - (b.kind === 'account' ? 0 : 1));
  }
  return {
    minor,
    divide,
    baseSplits,
    summary,
    pendingSettlement,
    payload,
    personalDraft,
    exportShared,
    planRestore,
    kinds,
  };
});
