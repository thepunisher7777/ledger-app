(function (root, factory) {
  if (typeof module === 'object' && module.exports)
    module.exports = factory(require('./couple-core.js'));
  else root.LedgerCoupleSync = factory(root.LedgerCoupleCore);
})(typeof globalThis !== 'undefined' ? globalThis : this, function (Core) {
  'use strict';
  const CONFIG_KEY = 'ledger.couple.config.v1';
  function validateConfig(config) {
    let u;
    try {
      u = new URL(config.url);
    } catch {
      throw Error('URL de Supabase inválida');
    }
    if (
      u.protocol !== 'https:' ||
      !/^([a-z0-9-]+)\.supabase\.co$/.test(u.hostname) ||
      u.username ||
      u.password ||
      u.port ||
      u.pathname !== '/' ||
      u.search ||
      u.hash
    )
      throw Error('Usa la URL HTTPS oficial del proyecto Supabase');
    const key = String(config.key || '');
    if (!key.startsWith('sb_publishable_')) {
      try {
        const claim = JSON.parse(atob(key.split('.')[1].replace(/-/g, '+').replace(/_/g, '/')));
        if (claim.role !== 'anon') throw Error();
      } catch {
        throw Error('Solo se permite la clave pública publishable o anon; nunca service_role');
      }
    }
    return { url: u.origin, key, remember: config.remember === true };
  }
  class Sync {
    constructor({
      client,
      storage,
      namespace = 'local-test',
      onChange = () => {},
      uuid = () => crypto.randomUUID(),
      clock = () => Date.now(),
    }) {
      this.client = client;
      this.storage = storage;
      this.namespace = namespace;
      this.onChange = onChange;
      this.uuid = uuid;
      this.clock = clock;
      this.user = null;
      this.space = null;
      this.members = [];
      this.entities = [];
      this.activity = [];
      this.queue = [];
      this.conflicts = [];
      this.channel = null;
      this.syncing = false;
      this.lastVerified = 0;
      this.error = '';
    }
    key() {
      if (!this.user || !this.space) throw Error('Acceso compartido no establecido');
      return `ledger.couple.cache.v1:${this.namespace}:${this.user.id}:${this.space.id}`;
    }
    pointer() {
      return `ledger.couple.last.v1:${this.namespace}:${this.user.id}`;
    }
    snapshot() {
      return {
        version: 1,
        space: this.space,
        members: this.members,
        entities: this.entities,
        activity: this.activity,
        queue: this.queue,
        conflicts: this.conflicts,
        lastVerified: this.lastVerified,
      };
    }
    persist() {
      this.storage.setItem(this.key(), JSON.stringify(this.snapshot()));
      this.storage.setItem(this.pointer(), this.space.id);
    }
    loadCache(cached) {
      if (
        cached.version !== 1 ||
        cached.space?.id !== this.space.id ||
        !Array.isArray(cached.queue) ||
        cached.queue.length > 1000 ||
        !Array.isArray(cached.members) ||
        !cached.members.some(
          (m) => m.user_id === this.user.id && m.active && m.space_id === this.space.id,
        ) ||
        !Array.isArray(cached.entities) ||
        !Number.isFinite(cached.lastVerified) ||
        cached.lastVerified > this.clock()
      )
        throw Error('Caché Pareja dañada: no se sobrescribirá');
      for (const q of cached.queue) {
        if (
          !/^[a-f0-9-]{36}$/.test(q.id) ||
          !/^[a-f0-9-]{36}$/.test(q.operation) ||
          !Number.isInteger(q.revision) ||
          q.revision < 0
        )
          throw Error('Cambio pendiente no válido');
        q.payload = Core.payload(q.kind, q.payload);
      }
      this.entities = cached.entities || [];
      this.members = cached.members;
      this.queue = cached.queue;
      this.activity = cached.activity || [];
      this.conflicts = cached.conflicts || [];
      this.lastVerified = cached.lastVerified || 0;
    }
    async resume() {
      if (!this.client.auth.getSession) return;
      const { data } = await this.client.auth.getSession();
      if (!data?.session?.user) return;
      this.user = data.session.user;
      const id = this.storage.getItem(this.pointer());
      if (id && /^[a-f0-9-]{36}$/.test(id)) {
        this.space = { id };
        const raw = this.storage.getItem(this.key());
        if (raw) {
          const cached = JSON.parse(raw);
          if (cached.space?.id !== id) throw Error('Caché de otro espacio');
          this.space = cached.space;
          this.loadCache(cached);
          this.onChange();
        } else this.space = null;
      }
      try {
        await this.discover();
      } catch (e) {
        this.error = e.message;
        this.onChange();
      }
    }
    async identify() {
      const { data, error } = await this.client.auth.getUser();
      if (error && ![401, 403].includes(error.status))
        throw Error(error.message || 'No se ha podido verificar la sesión');
      if (error || !data?.user) {
        await this.clear();
        this.user = null;
        throw Error('Inicia sesión para usar Pareja');
      }
      if (this.user && this.user.id !== data.user.id) await this.clear();
      this.user = data.user;
      return this.user;
    }
    async rpc(name, args) {
      const { data, error } = await this.client.rpc('ledger_couple_' + name, args);
      if (error) {
        const e = Error(error.message || 'Error de servidor');
        e.code = error.code;
        throw e;
      }
      return data;
    }
    async discover() {
      await this.identify();
      const { data, error } = await this.client.from('ledger_couple_spaces').select('*');
      if (error) throw Error(error.message);
      if (!data.length) {
        await this.clear();
        return;
      }
      this.space = data[0];
      const raw = this.storage.getItem(this.key());
      if (raw) this.loadCache(JSON.parse(raw));
      await this.refresh();
      this.subscribe();
    }
    async read(table) {
      const rows = [];
      for (let offset = 0; ; offset += 500) {
        const { data, error } = await this.client
          .from(table)
          .select('*')
          .eq('space_id', this.space.id)
          .order(table === 'ledger_couple_members' ? 'slot' : 'id')
          .range(offset, offset + 499);
        if (error) {
          const e = Error(error.message);
          e.code = error.code;
          throw e;
        }
        rows.push(...data);
        if (data.length < 500) return rows;
      }
    }
    async refresh() {
      if (!this.space) return;
      await this.identify();
      const { data, error } = await this.client
        .from('ledger_couple_spaces')
        .select('*')
        .eq('id', this.space.id);
      if (error) throw Error(error.message);
      if (!data.length) {
        await this.clear();
        throw Error('Acceso revocado al espacio Pareja');
      }
      this.space = data[0];
      const members = await this.read('ledger_couple_members');
      const entities = await this.read('ledger_couple_entities');
      const activity = await this.read('ledger_couple_activity');
      this.members = members;
      this.entities = entities;
      this.activity = activity;
      this.lastVerified = this.clock();
      this.error = '';
      this.persist();
      this.onChange();
    }
    subscribe() {
      if (this.channel) this.client.removeChannel(this.channel);
      if (!this.space || !this.client.channel) return;
      this.channel = this.client
        .channel('ledger-couple:' + this.space.id)
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'ledger_couple_entities',
            filter: 'space_id=eq.' + this.space.id,
          },
          () =>
            this.refresh().catch((e) => {
              this.error = e.message;
              this.onChange();
            }),
        )
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'ledger_couple_members',
            filter: 'space_id=eq.' + this.space.id,
          },
          () =>
            this.refresh().catch((e) => {
              this.error = e.message;
              this.onChange();
            }),
        )
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'ledger_couple_spaces',
            filter: 'id=eq.' + this.space.id,
          },
          () =>
            this.refresh().catch((e) => {
              this.error = e.message;
              this.onChange();
            }),
        )
        .subscribe();
    }
    canOffline() {
      return (
        !!this.user &&
        !!this.space &&
        this.space.status === 'active' &&
        this.clock() - this.lastVerified < 15 * 60 * 1000
      );
    }
    view() {
      if (!this.user || !this.space) return [];
      if (this.clock() - this.lastVerified >= 15 * 60 * 1000)
        throw Error('Verifica el acceso antes de consultar la caché');
      const rows = new Map(
        this.entities.filter((e) => e.space_id === this.space.id).map((e) => [e.id, e]),
      );
      for (const q of this.queue) {
        if (!q.blocked)
          rows.set(q.id, {
            ...(rows.get(q.id) || {}),
            id: q.id,
            space_id: this.space.id,
            kind: q.kind,
            payload: q.payload,
            revision: q.revision + 1,
            deleted: q.deleted,
            pending: true,
            created_by: rows.get(q.id)?.created_by || this.user.id,
            updated_by: this.user.id,
          });
      }
      return [...rows.values()];
    }
    enqueue(kind, input, { id = this.uuid(), revision = 0, deleted = false } = {}) {
      if (!this.canOffline()) throw Error('Verifica tu acceso en línea antes de registrar cambios');
      if (this.queue.length >= 1000) throw Error('Sincroniza antes de añadir más cambios');
      if (this.queue.some((q) => q.id === id))
        throw Error('Sincroniza o resuelve primero el cambio pendiente de este registro');
      const payload = Core.payload(kind, input);
      const q = { operation: this.uuid(), id, kind, payload, revision, deleted, blocked: false };
      const next = [...this.queue, q];
      this.storage.setItem(this.key(), JSON.stringify({ ...this.snapshot(), queue: next }));
      this.queue = next;
      this.onChange();
      return q;
    }
    async flush() {
      if (this.syncing || !this.space) return;
      this.syncing = true;
      try {
        await this.refresh();
        for (const q of [...this.queue]) {
          if (q.blocked) continue;
          try {
            const result = await this.rpc('apply', {
              p_space: this.space.id,
              p_id: q.id,
              p_kind: q.kind,
              p_payload: q.payload,
              p_revision: q.revision,
              p_delete: q.deleted,
              p_operation: q.operation,
            });
            this.queue = this.queue.filter((x) => x.operation !== q.operation);
            this.entities = this.entities.filter((x) => x.id !== result.id).concat(result);
            this.persist();
          } catch (e) {
            if (e.code === '42501') {
              await this.clear();
              throw e;
            }
            const versionConflict = e.code === 'PT409' || e.code === '40001' || /EDIT_CONFLICT/.test(e.message);
            const invalidProposal =
              (e.code === 'P0001' && !/RATE_LIMIT/.test(e.message)) || /^22/.test(e.code || '');
            if (versionConflict || invalidProposal) {
              q.blocked = true;
              this.conflicts.push({
                operation: q.operation,
                id: q.id,
                message: versionConflict
                  ? 'Otra sesión ha editado o eliminado este registro. Tu cambio no se ha sobrescrito.'
                  : 'El servidor rechazó esta propuesta: ' +
                    e.message +
                    '. Puedes descartarla y revisar sus campos.',
                local: q,
                remote: this.entities.find((x) => x.id === q.id) || null,
              });
              this.persist();
              continue;
            }
            this.error = e.message;
            break;
          }
        }
        this.onChange();
      } finally {
        this.syncing = false;
      }
    }
    discard(operation) {
      this.queue = this.queue.filter((q) => q.operation !== operation);
      this.conflicts = this.conflicts.filter((c) => c.operation !== operation);
      this.persist();
      this.onChange();
    }
    async leave() {
      await this.rpc('leave', { p_space: this.space.id });
      await this.clear();
    }
    export() {
      if (!this.user || !this.space || this.clock() - this.lastVerified >= 15 * 60 * 1000)
        throw Error('Verifica tu acceso en línea antes de exportar');
      const out = Core.exportShared(this.space, this.members, this.view(), this.activity);
      out.pending_count = this.queue.length;
      return out;
    }
    async clear() {
      if (this.user && this.space) this.storage.removeItem(this.key());
      if (this.user) this.storage.removeItem(this.pointer());
      if (this.channel) {
        this.client.removeChannel(this.channel);
        this.channel = null;
      }
      this.space = null;
      this.members = [];
      this.entities = [];
      this.activity = [];
      this.queue = [];
      this.conflicts = [];
      this.lastVerified = 0;
      this.onChange();
    }
    async logout() {
      await this.clear();
      await this.client.auth.signOut({ scope: 'local' });
      this.user = null;
      this.onChange();
    }
  }
  return { Sync, validateConfig, CONFIG_KEY };
});
