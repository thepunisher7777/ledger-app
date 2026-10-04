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
    'ledger-error': 'ledger_error'
  };

  const originalFetch = window.fetch.bind(window);
  let sdkPromise = null;

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
        property_denylist: ['$current_url', '$pathname', '$referrer', '$referring_domain', '$host']
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

    const eventName = EVENT_MAP[action] || 'ledger_telemetry';
    const appVersion = parsed.searchParams.get('appVersion') || 'unknown';
    const properties = {
      product: 'ledger',
      telemetry_schema: 3,
      legacy_action: action,
      event_key: key || 'event',
      app_version: appVersion
    };

    if (action === 'ledger-screen') properties.screen = key;
    if (action === 'ledger-feature') properties.feature = key;
    if (action === 'ledger-error') properties.error_type = key;
    if (action === 'ledger-platform') properties.platform = key;
    if (action === 'ledger-version') properties.version = key;

    return { eventName, properties };
  }

  async function captureTelemetry(payload) {
    if (!consentGranted()) return false;
    try {
      const ph = await loadSdk();
      if (!consentGranted()) {
        ph.opt_out_capturing();
        return false;
      }
      if (ph.has_opted_out_capturing && ph.has_opted_out_capturing()) ph.opt_in_capturing();
      ph.capture(payload.eventName, payload.properties);
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
      { status: ok ? 200 : 204, headers: { 'Content-Type': 'application/json' } }
    ));
  };

  if (consentGranted()) loadSdk().catch(() => {});
})();
