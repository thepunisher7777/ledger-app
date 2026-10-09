(function (root) {
  'use strict';
  const valid = (token) => typeof token === 'string' && /^[a-f0-9]{64}$/.test(token);
  function parse(url) {
    const match = new URL(url).hash.match(/^#couple-invite=([a-f0-9]{64})$/);
    return match ? match[1] : null;
  }
  function link(url, token) {
    if (!valid(token)) throw Error('Invitación inválida');
    const result = new URL(url);
    if (!['https:', 'http:'].includes(result.protocol)) throw Error('URL inválida');
    result.search = '';
    result.hash = 'couple-invite=' + token;
    return result.href;
  }
  const api = { parse, link, pending: null, clear() { this.pending = null; } };
  if (typeof module === 'object' && module.exports) module.exports = api;
  if (root.location && root.history) {
    // Runs in <head>, before analytics: bearer token never enters page telemetry.
    api.pending = parse(root.location.href);
    if (api.pending) root.history.replaceState(root.history.state, '', root.location.pathname + root.location.search);
    root.LedgerCoupleInvitation = api;
  }
})(typeof window === 'undefined' ? globalThis : window);
