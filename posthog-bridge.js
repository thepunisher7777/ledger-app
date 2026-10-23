(() => {
  'use strict';

  if (window.__ARX_POSTHOG_BRIDGE__) return;
  window.__ARX_POSTHOG_BRIDGE__ = true;

  const PROJECT_TOKEN = 'phc_xv9hwbyp6HaN8bekxz2skpnYo9KhZZVagECK65nPSTSE';
  const API_HOST = 'https://eu.i.posthog.com';
  const UI_HOST = 'https://eu.posthog.com';
  const CONSENT_KEY = 'ledger.analytics.consent.v1';
  const LEGACY_PREFIX = 'https://counterapi.com/api/';
  const LEGACY_NAMESPACE = 'thepunisher7777.github.io';

  const EVENT_MAP = {
    'ledger-session': 'ledger_session_started',
    'ledger-active': 'ledger_active',
    'ledger-version': 'ledger_version_seen',
    'ledger-platform': 'ledger_platform_seen',
    'ledger-screen': 'ledger_screen_view',
    'ledger-install': 'ledger_install',
    'ledger-feature': 'ledger_feature_used',
    'ledger-error': 'ledger_error',
    'ledger-milestone': 'ledger_milestone'
  };

  const originalFetch = window.fetch.bind(window);
  let sdkPromise = null;
  const FEATURES = new Set('restore-safety migration-receiver-open transaction-saved restore-json import-csv export-csv export-excel export-json feedback-open feedback-sent pwa-install-request pwa-installed budget-saved statistics-open couple-registration-start couple-space-created couple-invitation-accepted onboarding-completed'.split(' '));
  const MILESTONES = new Set('first-measured-open first-configuration first-transaction first-budget verified-pwa-install'.split(' '));
  const SCREENS = new Set('home transactions stats plan loan settings'.split(' '));
  function sanitizeEvent(event) {
    if (!consentGranted() || !event || !Object.values(EVENT_MAP).includes(event.event)) return null;
    const source = event.properties || {}, clean = {};
    // SDK routing identifiers only. Never identify an Auth user or copy application objects.
    for (const key of ['token', 'distinct_id', '$device_id', '$session_id', '$window_id', '$lib', '$lib_version']) {
      if (typeof source[key] === 'string' && /^[a-zA-Z0-9_.:$-]{1,160}$/.test(source[key])) clean[key] = source[key];
    }
    clean.product = 'ledger'; clean.telemetry_schema = 4;
    clean.$process_person_profile = false; clean.$geoip_disable = true;
    const version = source.app_version;
    if (typeof version === 'string' && /^(?:Beta )?\d+\.\d+\.\d+$/.test(version)) clean.app_version = version;
    if (SCREENS.has(source.screen)) clean.screen = source.screen;
    if (FEATURES.has(source.feature)) clean.feature = source.feature;
    if (MILESTONES.has(source.milestone)) clean.milestone = source.milestone;
    if (['ios', 'android', 'desktop'].includes(source.platform)) clean.platform = source.platform;
    if (['javascript', 'promise', 'service-worker'].includes(source.error_type)) clean.error_type = source.error_type;
    if (event.event === 'ledger_feature_used' && !clean.feature || event.event === 'ledger_screen_view' && !clean.screen || event.event === 'ledger_milestone' && !clean.milestone) return null;
    event.properties = clean; delete event.$set; delete event.$set_once;
    return event;
  }
  window.LedgerAnalyticsPrivacy = { sanitizeEvent };
  const pending = new Set();
  window.LedgerTelemetry = {
    feature(name) {
      return FEATURES.has(name) ? captureTelemetry({eventName:'ledger_feature_used',properties:{feature:name}}) : Promise.resolve(false);
    },
    async milestone(name) {
      if (!MILESTONES.has(name) || !consentGranted() || pending.has(name)) return false;
      const key = 'ledger.analytics.milestone.v1.' + name;
      try { if (localStorage.getItem(key)) return false; } catch { return false; }
      pending.add(name);
      try {
        const ok = await captureTelemetry({eventName:'ledger_milestone',properties:{milestone:name}});
        if (ok) localStorage.setItem(key, '1');
        return ok;
      } catch { return false; } finally { pending.delete(name); }
    }
  };

  function consentGranted() {
    try { return localStorage.getItem(CONSENT_KEY) === 'yes'; }
    catch { return false; }
  }

  function loadSdk() {
    if (sdkPromise) return sdkPromise;
    sdkPromise = new Promise((resolve, reject) => {
      if (window.posthog && typeof window.posthog.init === 'function') {
        resolve(window.posthog);
        return;
      }
      const script = document.createElement('script');
      script.async = true;
      script.crossOrigin = 'anonymous';
      script.src = API_HOST.replace('.i.posthog.com', '-assets.i.posthog.com') + '/static/array.js';
      script.onload = () => resolve(window.posthog);
      script.onerror = () => reject(new Error('PostHog SDK could not be loaded'));
      document.head.appendChild(script);
    }).then(ph => {
      if (!ph || typeof ph.init !== 'function') throw new Error('PostHog SDK unavailable');
      ph.init(PROJECT_TOKEN, {
        api_host: API_HOST,
        ui_host: UI_HOST,
        defaults: '2026-05-30',
        autocapture: false,
        capture_pageview: false,
        capture_pageleave: false,
        capture_exceptions: false,
        capture_performance: false,
        disable_session_recording: true,
        advanced_disable_flags: true,
        person_profiles: 'never',
        persistence: 'localStorage',
        opt_out_capturing_by_default: true,
        opt_out_persistence_by_default: true,
        opt_out_capturing_persistence_type: 'localStorage',
        before_send: sanitizeEvent,
        ip: false,
        property_denylist: ['$current_url', '$pathname', '$referrer', '$referring_domain', '$host', '$raw_user_agent']
      });
      if (consentGranted()) ph.opt_in_capturing();
      else ph.opt_out_capturing();
      return ph;
    });
    return sdkPromise;
  }

  function parseLegacyTelemetry(url) {
    let parsed;
    try { parsed = new URL(url, location.href); }
    catch { return null; }
    if (!parsed.href.startsWith(LEGACY_PREFIX)) return null;

    const parts = parsed.pathname.split('/').filter(Boolean).map(decodeURIComponent);
    if (parts.length < 4 || parts[0] !== 'api') return null;
    const [, namespace, action, key] = parts;
    if (namespace !== LEGACY_NAMESPACE || !action.startsWith('ledger-')) return null;

    const eventName = EVENT_MAP[action];
    if (!eventName) return {eventName:null,properties:{}};
    const appVersion = parsed.searchParams.get('appVersion') || 'unknown';
    const properties = {
      product: 'ledger',
      telemetry_schema: 4,
      legacy_action: action,
      event_key: key || 'event',
      app_version: appVersion
    };

    if (action === 'ledger-milestone') properties.milestone = key;
    if (action === 'ledger-screen') properties.screen = key;
    if (action === 'ledger-feature') properties.feature = key;
    if (action === 'ledger-error') properties.error_type = key;
    if (action === 'ledger-platform') properties.platform = key;
    if (action === 'ledger-version') properties.version = key;

    return { eventName, properties };
  }

  async function captureTelemetry(payload) {
    if (!payload.eventName || !consentGranted() || navigator.onLine === false) return false;
    try {
      const ph = await loadSdk();
      if (!consentGranted()) {
        ph.opt_out_capturing();
        return false;
      }
      if (ph.has_opted_out_capturing && ph.has_opted_out_capturing()) ph.opt_in_capturing();
      const event = sanitizeEvent({event:payload.eventName, properties:{app_version:window.LedgerAppVersion || 'unknown', ...payload.properties}});
      if (!event) return false;
      ph.capture(event.event, event.properties);
      return true;
    } catch (err) {
      console.warn('[ARX Analytics] PostHog capture failed', err);
      return false;
    }
  }

  window.fetch = function(input, init) {
    const url = typeof input === 'string' ? input : input && input.url;
    const telemetry = url ? parseLegacyTelemetry(url) : null;
    if (!telemetry) return originalFetch(input, init);

    return captureTelemetry(telemetry).then(ok => new Response(
      JSON.stringify({ ok, provider: 'posthog' }),
      { status: ok ? 200 : 202, headers: { 'Content-Type': 'application/json' } }
    ));
  };

  window.addEventListener('storage', e => {
    if (e.key === CONSENT_KEY && !consentGranted()) window.posthog?.opt_out_capturing?.();
  });
  if (consentGranted()) loadSdk().catch(() => {});
})();
