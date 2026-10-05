/* Pure currency arithmetic. Rates are EUR -> USD, never applied to stored amounts. */
(() => {
  'use strict';
  const supported = ['EUR', 'USD'];
  const currency = (value, fallback = 'EUR') => supported.includes(value) ? value : fallback;
  function convert(amount, from, to, fx) {
    if (!Number.isFinite(Number(amount))) return NaN;
    if (from === to) return Number(amount);
    if (!supported.includes(from) || !supported.includes(to)) return NaN;
    const rate = Number(fx?.eurUsd);
    if (!Number.isFinite(rate) || rate <= 0) return Number(amount) === 0 ? 0 : NaN;
    return from === 'EUR' ? Number(amount) * rate : Number(amount) / rate;
  }
  const api = {supported, currency, convert};
  if (typeof module !== 'undefined') module.exports = api;
  if (typeof window !== 'undefined') window.LedgerMoney = api;
})();
