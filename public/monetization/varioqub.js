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
  var clearance = 0;
  var layoutPending = false;
  var topRequestedGeneration = -1;
  var topSuppressed = false;

  function topEnabled() {
    return eligible() && config.topAd && config.topAd.enabled === true;
  }

  function clearTopSpace() {
    document.documentElement.style.removeProperty('--ps-top-clearance');
    document.documentElement.removeAttribute('data-ps-top-visible');
  }

  function suppressTop() {
    if (!topEnabled()) return;
    topSuppressed = true;
    destroyFloor();
    clearTopSpace();
    document.documentElement.setAttribute('data-ps-top-status', 'suppressed');
  }

  function updateTopSpace() {
    if (!topEnabled() || topSuppressed) { clearTopSpace(); return; }
    var dialog = document.querySelector('dialog[open], [role="dialog"][aria-modal="true"]');
    var widget = document.getElementById('Logos-widget');
    if ((dialog && dialog.getBoundingClientRect().height > 0) ||
        (widget && widget.shadowRoot && widget.shadowRoot.querySelector('.uc-main.open'))) {
      suppressTop(); return;
    }
    var height = 0;
    Array.prototype.forEach.call(document.body.children, function (element) {
      if (element.tagName !== 'DIV') return;
      var box = element.getBoundingClientRect();
      if (box.width >= window.innerWidth * 0.7 && box.height >= 40 &&
          box.height <= 150 && Math.abs(box.top) < 3 &&
          window.getComputedStyle(element).position === 'fixed' &&
          element.querySelector('[data-ad-id],iframe')) height = Math.max(height, Math.ceil(box.height));
    });
    var next = height ? (height + 12) + 'px' : '';
    if (document.documentElement.style.getPropertyValue('--ps-top-clearance') !== next) {
      if (height) {
        document.documentElement.style.setProperty('--ps-top-clearance', next);
        document.documentElement.setAttribute('data-ps-top-visible', 'true');
      } else clearTopSpace();
    }
  }

  function requestTop(current) {
    if (!topEnabled() || !window.matchMedia('(max-width: 1023px)').matches || topSuppressed ||
        topRequestedGeneration === current) return;
    topRequestedGeneration = current;
    if (!document.getElementById('ps-top-controls')) {
      var style = document.createElement('style');
      style.id = 'ps-top-controls';
      style.textContent = 'html[data-ps-top-visible="true"] .ps-chrome-header{padding-top:var(--ps-top-clearance)}html[data-ps-top-visible="true"] .ps-chrome #header{top:var(--ps-top-clearance)}html[data-ps-top-visible="true"] .ps-chrome #first-city-prompt{top:calc(88px + var(--ps-top-clearance))}';
      document.head.appendChild(style);
    }
    document.documentElement.setAttribute('data-ps-top-status', 'queued');
    window.yaContextCb = window.yaContextCb || [];
    window.yaContextCb.push(function () {
      if (current !== generation || !topEnabled() || topSuppressed) return;
      var manager = window.Ya && window.Ya.Context && window.Ya.Context.AdvManager;
      if (!manager || typeof manager.render !== 'function') return;
      document.documentElement.setAttribute('data-ps-top-status', 'requested');
      try {
        manager.render({blockId: config.topAd.blockId, type: 'topAd',
          onRender: function () {
            if (current !== generation || !topEnabled() || topSuppressed) { destroyFloor(); return; }
            document.documentElement.setAttribute('data-ps-top-status', 'rendered');
            scheduleLayout();
          },
          onError: function () {
            if (current !== generation) return;
            clearTopSpace();
            document.documentElement.setAttribute('data-ps-top-status', 'error');
          }
        });
      } catch (_) {
        clearTopSpace();
        document.documentElement.setAttribute('data-ps-top-status', 'error');
      }
    });
  }

  document.addEventListener('focusin', function (event) {
    if (event.target && event.target.closest && event.target.closest('form')) suppressTop();
  });

  function updateFloatingControls() {
    updateTopSpace();
    var height = 0;
    if (eligible() && loaderStarted) {
      Array.prototype.forEach.call(document.body.children, function (element) {
        if (element.tagName !== 'DIV') return;
        var box = element.getBoundingClientRect();
        if (box.width >= window.innerWidth * 0.7 && box.height >= 40 &&
            box.height <= window.innerHeight * 0.4 && Math.abs(box.bottom - window.innerHeight) < 3 &&
            window.getComputedStyle(element).position === 'fixed' && element.querySelector('[data-ad-id],iframe')) {
          height = Math.max(height, Math.ceil(box.height));
        }
      });
    }
    var next = height ? height + 24 : 0;
    if (next !== clearance) {
      clearance = next;
      if (next) {
        document.documentElement.style.setProperty('--ps-floor-clearance', next + 'px');
        document.documentElement.setAttribute('data-ps-floor-visible', 'true');
      } else {
        document.documentElement.style.removeProperty('--ps-floor-clearance');
        document.documentElement.removeAttribute('data-ps-floor-visible');
      }
    }
    if (!height) return;
    if (!document.getElementById('ps-floor-controls')) {
      var style = document.createElement('style');
      style.id = 'ps-floor-controls';
      style.textContent = 'html[data-ps-floor-visible="true"] button[aria-label="Наверх"]{bottom:calc(24px + var(--ps-floor-clearance))!important}html[data-ps-floor-visible="true"] body{padding-bottom:var(--ps-floor-clearance)}';
      document.head.appendChild(style);
    }
    var host = document.getElementById('Logos-widget');
    var shadow = host && host.shadowRoot;
    if (shadow && !shadow.getElementById('ps-floor-widget-clearance')) {
      var widgetStyle = document.createElement('style');
      widgetStyle.id = 'ps-floor-widget-clearance';
      widgetStyle.textContent = ':host .uc-main:not(.open){bottom:calc(24px + var(--ps-widget-clearance,0px) + var(--ps-floor-clearance,0px))!important}';
      shadow.appendChild(widgetStyle);
    }
    if (shadow && shadow.querySelector('.uc-main.open')) destroyFloor();
  }

  function scheduleLayout() {
    if (layoutPending) return;
    layoutPending = true;
    window.requestAnimationFrame(function () { layoutPending = false; updateFloatingControls(); });
  }

  function eligible() {
    return !stopped && config && config.enabled === true &&
      config.allowedPathPrefixes.some(function (prefix) {
        return window.location.pathname.indexOf(prefix) === 0;
      });
  }

  function destroyFloor() {
    var manager = window.Ya && window.Ya.Context && window.Ya.Context.AdvManager;
    if (!manager || typeof manager.destroy !== 'function') return;
    (config && config.floorBlockIds || ['R-A-19425636-4']).concat(config && config.topAd ? [config.topAd.blockId] : []).forEach(function (blockId) {
      try { manager.destroy({blockId: blockId}); } catch (_) { /* Already closed. */ }
    });
  }

  function updateGuard() {
    if (guard) { guard.disconnect(); guard = null; }
    if (eligible()) return;
    document.documentElement.removeAttribute('data-ps-varioqub-ready');
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
    document.documentElement.removeAttribute('data-ps-varioqub-ready');
    var current = ++generation;
    topSuppressed = false;
    clearTopSpace();
    document.documentElement.removeAttribute('data-ps-top-status');
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
            value.counterId !== 108789843 || (value.topAd &&
            (value.topAd.blockId !== 'R-A-19425636-5' || typeof value.topAd.enabled !== 'boolean'))) throw new Error('invalid_config');
        config = value;
        updateGuard();
        if (!eligible()) {
          window.__psVarioqubStatus = value.enabled === true ? 'excluded' : 'disabled';
          return;
        }
        if (config.topAd && config.topAd.enabled === true) {
          window.__psVarioqubStatus = 'direct_mobile_top_pilot';
          requestTop(current);
          return;
        }
        loadVendor();
        window.__psVarioqubStatus = 'initializing';
        // Required by the RSYA experiment embed to associate ad revenue with a visitor.
        window.ymab('metrika.' + config.counterId, 'setConfig', {enableSetYmUid: true});
        window.ymab('metrika.' + config.counterId, 'init', {}, function () {
          if (current !== generation || !eligible()) { destroyFloor(); return; }
          window.__psVarioqubStatus = 'ready';
          document.documentElement.setAttribute('data-ps-varioqub-ready', 'true');
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
  window.addEventListener('resize', scheduleLayout);
  var layoutObserver = new MutationObserver(scheduleLayout);
  layoutObserver.observe(document.body, {childList: true, subtree: true});
  window.setInterval(scheduleLayout, 1000);
  window.addEventListener('ps:monetization-stop', function () {
    stopped = true;
    ++generation;
    window.__psVarioqubStatus = 'disabled';
    updateGuard();
    clearTopSpace();
    updateFloatingControls();
  });
  routeChanged();
})();
