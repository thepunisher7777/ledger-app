(function (root) {
  'use strict';
  const KEY = 'ledger.onboarding.v1';
  let dialog = null, initialized = false;
  const steps = [
    ['1', 'Añade tu primer movimiento', 'Registra un ingreso o gasto con su fecha y cuenta. Puedes editarlo después desde Movimientos.'],
    ['2', 'Decide tu ritmo', 'Configura tu día de cobro, tus gastos fijos y un presupuesto. Los ciclos respetan tu fecha de inicio.'],
    ['3', 'Revisa y conserva tus datos', 'Consulta Estadísticas y guarda una copia JSON desde Ajustes. Personal funciona sin registro; Pareja comparte solo lo que añadas allí.'],
  ];
  function remembered() { try { return root.localStorage.getItem(KEY) === 'done'; } catch { return false; } }
  function finish() {
    try { root.localStorage.setItem(KEY, 'done'); } catch {}
    dialog?.close();
    root.dispatchEvent(new root.CustomEvent('ledger:onboarding:closed'));
  }
  function ensureDialog() {
    if (dialog) return dialog;
    dialog = root.document.createElement('dialog');
    dialog.id = 'ledger-onboarding-dialog';
    dialog.className = 'sheet small-sheet';
    dialog.setAttribute('aria-labelledby', 'ledger-onboarding-title');
    const header = root.document.createElement('div');
    header.className = 'dialog-head';
    const title = root.document.createElement('h2');
    title.id = 'ledger-onboarding-title';
    title.textContent = 'Tu dinero, en tres pasos';
    header.append(title);
    const body = root.document.createElement('div');
    body.style.cssText = 'display:grid;gap:16px;margin:16px 0';
    for (const [number, heading, text] of steps) {
      const row = root.document.createElement('section');
      row.style.cssText = 'display:grid;grid-template-columns:30px 1fr;gap:10px';
      const badge = root.document.createElement('span');
      badge.className = 'status-chip';
      badge.style.alignSelf = 'start';
      badge.textContent = number;
      const copy = root.document.createElement('div');
      const h = root.document.createElement('h3'); h.textContent = heading;
      const p = root.document.createElement('p'); p.textContent = text;
      p.style.cssText = 'font-size:13px;color:var(--muted);line-height:1.6;margin:6px 0 0';
      copy.append(h, p); row.append(badge, copy); body.append(row);
    }
    const demo = root.document.createElement('a');
    demo.id = 'ledger-onboarding-demo'; demo.href = 'demo/';
    demo.className = 'secondary-btn';
    demo.style.cssText = 'display:block;text-align:center;text-decoration:none;margin:12px 0';
    demo.textContent = 'Probar una demo con datos ficticios';
    const info = root.document.createElement('p');
    info.style.cssText = 'font-size:12px;color:var(--muted);line-height:1.5';
    info.textContent = 'La demo es una pantalla de práctica separada. Nunca abre ni modifica tu biblioteca personal.';
    const start = root.document.createElement('button');
    start.id = 'ledger-onboarding-start'; start.type = 'button';
    start.className = 'primary-btn'; start.style.width = '100%';
    start.textContent = 'Empezar con mis datos'; start.onclick = finish;
    dialog.append(header, body, demo, info, start);
    dialog.addEventListener('cancel', () => finish());
    root.document.body.append(dialog);
    return dialog;
  }
  function open() {
    const element = ensureDialog();
    if (!element.open) element.showModal();
  }
  function init({ isNew = false } = {}) {
    if (initialized) return;
    initialized = true;
    if (isNew && !remembered()) open();
  }
  function mountSettings(container) {
    if (!container || container.querySelector('#ledger-guide-open')) return;
    const card = root.document.createElement('section'); card.className = 'card'; card.style.marginBottom = '14px';
    const title = root.document.createElement('h3'); title.textContent = 'Primeros pasos';
    const text = root.document.createElement('p'); text.textContent = 'Repasa la guía o practica en una demo independiente con datos ficticios.';
    const row = root.document.createElement('div'); row.className = 'safety-row';
    const guide = root.document.createElement('button'); guide.id = 'ledger-guide-open'; guide.type = 'button'; guide.className = 'secondary-btn'; guide.textContent = 'Ver guía de tres pasos'; guide.onclick = open;
    const demo = root.document.createElement('a'); demo.href = 'demo/'; demo.className = 'secondary-btn'; demo.textContent = 'Probar demo segura'; demo.style.cssText = 'text-decoration:none;text-align:center;display:inline-flex;align-items:center;justify-content:center';
    row.append(guide, demo); card.append(title, text, row); const discover=root.document.createElement('a');discover.href='descubre/';discover.textContent='Conocer Ledger y calculadora de gastos en pareja';discover.style.cssText='display:block;margin-top:12px;color:var(--primary,#4caaff)';card.append(discover);container.prepend(card);
  }
  root.LedgerOnboarding = { init, open, mountSettings, isOpen: () => !!dialog?.open, finish };
})(window);
