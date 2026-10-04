(() => {
  'use strict';

  if (window.__ARX_ANALYTICS_GUARD__) return;
  window.__ARX_ANALYTICS_GUARD__ = true;

  const CONSENT_KEY = 'ledger.analytics.consent.v1';
  const VIRTUAL_ORIGIN = 'https://arx.local';
  const VIRTUAL_PREFIX = '/telemetry/ledger/';
  const LEGACY_TRANSPORT = 'https://counterapi.com/api';
  const LEGACY_NAMESPACE = 'thepunisher7777.github.io';
  const priorFetch = window.fetch.bind(window);

  const ALLOWED_PROPERTIES = new Set([
    'token','distinct_id','$device_id','$session_id','$window_id','$lib','$lib_version','$process_person_profile',
    'product','telemetry_schema','legacy_action','event_key','app_version','screen','feature','error_type','platform','version'
  ]);

  function consentGranted(){
    try{return localStorage.getItem(CONSENT_KEY)==='yes';}
    catch{return false;}
  }

  function sanitizeEvent(event){
    if(!event || !String(event.event||'').startsWith('ledger_')) return null;
    const source=event.properties||{};
    const clean={};
    for(const key of ALLOWED_PROPERTIES){
      if(Object.prototype.hasOwnProperty.call(source,key)) clean[key]=source[key];
    }
    event.properties=clean;
    event.$set={};
    event.$set_once={};
    return event;
  }

  function hardenPostHog(){
    const ph=window.posthog;
    if(!ph || typeof ph.set_config!=='function') return false;
    if(!window.__ARX_POSTHOG_HARDENED__){
      ph.set_config({
        autocapture:false,
        capture_pageview:false,
        capture_pageleave:false,
        capture_exceptions:false,
        capture_performance:false,
        disable_session_recording:true,
        advanced_disable_flags:true,
        person_profiles:'never',
        property_denylist:['$current_url','$pathname','$referrer','$referring_domain','$host','$raw_user_agent'],
        before_send:sanitizeEvent
      });
      window.__ARX_POSTHOG_HARDENED__=true;
    }
    if(consentGranted()){
      if(ph.has_opted_out_capturing && ph.has_opted_out_capturing()) ph.opt_in_capturing();
    }else if(typeof ph.opt_out_capturing==='function'){
      ph.opt_out_capturing();
    }
    return true;
  }

  function translateVirtualTelemetry(url){
    let parsed;
    try{parsed=new URL(url,location.href);}catch{return null;}
    if(parsed.origin!==VIRTUAL_ORIGIN || !parsed.pathname.startsWith(VIRTUAL_PREFIX)) return null;
    const parts=parsed.pathname.slice(VIRTUAL_PREFIX.length).split('/').filter(Boolean).map(decodeURIComponent);
    if(parts.length<2) return null;
    const action=parts[0], key=parts[1]||'event';
    if(!action.startsWith('ledger-')) return null;
    const q=parsed.searchParams.toString();
    return `${LEGACY_TRANSPORT}/${encodeURIComponent(LEGACY_NAMESPACE)}/${encodeURIComponent(action)}/${encodeURIComponent(key)}${q?`?${q}`:''}`;
  }

  window.fetch=function(input,init){
    const url=typeof input==='string'?input:input&&input.url;
    const translated=url?translateVirtualTelemetry(url):null;
    if(!translated) return priorFetch(input,init);
    return priorFetch(translated,init).then(response=>{
      setTimeout(hardenPostHog,0);
      return response;
    });
  };

  window.addEventListener('storage',event=>{if(event.key===CONSENT_KEY)setTimeout(hardenPostHog,0);});
  setInterval(hardenPostHog,1000);
  hardenPostHog();
})();
