/* Varioqub assigns visitors and renders experiment blocks; do not render them here. */
(function () {
  'use strict';
  if (window.__psVarioqubInstalled) return;
  window.__psVarioqubInstalled = true;
  var config = null;
  var generation = 0;
  var previousUrl = '';
  var loaderStarted = false;
  var stopped = false;
  var guard = null;

  function eligible() {
    return !stopped && config && config.enabled === true &&
      config.allowedPathPrefixes.some(function (prefix) {
        return window.location.pathname.indexOf(prefix) === 0;
      });
  }

  function destroyFloor() {
    var manager = window.Ya && window.Ya.Context && window.Ya.Context.AdvManager;
    if (!manager || typeof manager.destroy !== 'function') return;
    (config && config.floorBlockIds || ['R-A-19425636-4']).forEach(function (blockId) {
      try { manager.destroy({blockId: blockId}); } catch (_) { /* Already closed. */ }
    });
  }

  function updateGuard() {
    if (guard) { guard.disconnect(); guard = null; }
    if (eligible()) return;
    destroyFloor();
    // Also remove a late vendor render after an SPA transition out of a test page.
    guard = new MutationObserver(function (records) {
      if (!eligible() && records.some(function (record) { return record.addedNodes.length; })) destroyFloor();
    });
    guard.observe(document.body, {childList: true, subtree: true});
  }

  function loadVendor() {
    if (loaderStarted) return;
    loaderStarted = true;
    window.ymab = window.ymab || function () {
      (window.ymab.a = window.ymab.a || []).push(arguments);
    };
    var script = document.createElement('script');
    script.id = 'ps-varioqub-vendor';
    script.async = true;
    script.src = 'https://abt.s3.yandex.net/expjs/latest/exp.js';
    script.onerror = function () {
      window.__psVarioqubStatus = 'vendor_error';
      destroyFloor();
    };
    document.head.appendChild(script);
  }

  function routeChanged() {
    var url = window.location.href;
    if (url === previousUrl) return;
    previousUrl = url;
    var current = ++generation;
    destroyFloor();
    updateGuard();
    fetch('/monetization/experiments.json', {cache: 'no-store', credentials: 'same-origin'})
      .then(function (response) {
        if (!response.ok) throw new Error('config_unavailable');
        return response.json();
      })
      .then(function (value) {
        if (current !== generation) return;
        if (!Array.isArray(value.allowedPathPrefixes) || !Array.isArray(value.floorBlockIds) ||
            value.counterId !== 108789843) throw new Error('invalid_config');
        config = value;
        updateGuard();
        if (!eligible()) {
          window.__psVarioqubStatus = value.enabled === true ? 'excluded' : 'disabled';
          return;
        }
        loadVendor();
        window.__psVarioqubStatus = 'initializing';
        // Required by the RSYA experiment embed to associate ad revenue with a visitor.
        window.ymab('metrika.' + config.counterId, 'setConfig', {enableSetYmUid: true});
        window.ymab('metrika.' + config.counterId, 'init', {}, function () {
          if (current !== generation || !eligible()) { destroyFloor(); return; }
          window.__psVarioqubStatus = 'ready';
        });
      })
      .catch(function () {
        if (current !== generation) return;
        config = null;
        window.__psVarioqubStatus = 'config_error';
        updateGuard();
      });
  }

  window.addEventListener('ps:navigation-route', routeChanged);
  window.addEventListener('popstate', routeChanged);
  window.addEventListener('ps:monetization-stop', function () {
    stopped = true;
    ++generation;
    window.__psVarioqubStatus = 'disabled';
    updateGuard();
  });
  routeChanged();
})();
