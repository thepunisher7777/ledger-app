(() => {
  'use strict';
  if (window.posthog && window.posthog.__SV) return;

  const root = window.posthog || [];
  root._i = [];

  function addStub(target, method) {
    target[method] = function () {
      target.push([method].concat(Array.prototype.slice.call(arguments, 0)));
    };
  }

  root.init = function (token, config, name) {
    const script = document.createElement('script');
    script.type = 'text/javascript';
    script.crossOrigin = 'anonymous';
    script.async = true;
    script.src = config.api_host.replace('.i.posthog.com', '-assets.i.posthog.com') + '/static/array.js';
    const firstScript = document.getElementsByTagName('script')[0];
    firstScript.parentNode.insertBefore(script, firstScript);

    let instance = root;
    if (name !== undefined) instance = root[name] = [];
    else name = 'posthog';

    instance.people = instance.people || [];
    const methods = 'init capture register register_once register_for_session unregister unregister_for_session getFeatureFlag getFeatureFlagResult isFeatureEnabled reloadFeatureFlags updateEarlyAccessFeatureEnrollment getEarlyAccessFeatures on onFeatureFlags onSessionId getSurveys getActiveMatchingSurveys renderSurvey canRenderSurvey getNextSurveyStep identify setPersonProperties group resetGroups setPersonPropertiesForFlags resetPersonPropertiesForFlags setGroupPropertiesForFlags resetGroupPropertiesForFlags reset get_distinct_id getGroups get_session_id get_session_replay_url alias set_config startSessionRecording stopSessionRecording sessionRecordingStarted captureException loadToolbar get_property getSessionProperty createPersonProfile opt_in_capturing opt_out_capturing has_opted_in_capturing has_opted_out_capturing clear_opt_in_out_capturing debug'.split(' ');
    methods.forEach(method => addStub(instance, method));
    root._i.push([token, config, name]);
  };

  root.__SV = 1;
  window.posthog = root;
})();
