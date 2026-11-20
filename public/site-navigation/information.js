/* Shared public pages that are served outside Next.js, including static catalogs. */
(function () {
  'use strict';
  if (window.__psInformation) return;
  window.__psInformation = true;
  const privatePage = /^\/(?:api|admin|lk|education-gifts)(?:\/|$)|^\/proforientaciya\/(?:rezultat|karta-interesov)(?:\/|$)/;
  const sdk = 'https://yandex.ru/ads/system/context.js';
  const retiredDomain = /(^|\.)(?:synergy\.ru|synergy\.com|synergy-academy\.ru|syndev\.ru|school-?university\.(?:com|ru)|logos\.unis\.studio)$/i;
  const retiredUI = [
    '[data-ps-sale]', '[data-ps-sale-slot]', '[data-lektoriy]', '#lead-dialog', '#school-card-form', '[data-offer-form]',
    'a[href="#school-card-form"]', '#partner-dialog', '#partner-offers',
    '#podbor:has(form [type="tel"])', '#konsultaciya:has(form [type="tel"])',
    'form[data-growth-form]', 'form:has([type="tel"]):has([type="email"])',
    'a[href^="/podarki/#"]'
  ].join(',');
  let currentPage = '';
  let scheduled = false;
  let serial = 0;

  function partnerUrl(value) {
    try { return retiredDomain.test(new URL(value, location.href).hostname); }
    catch { return false; }
  }

  function removeRetiredPromotions() {
    document.querySelectorAll(retiredUI).forEach(node => { node.hidden = true; });
    document.querySelectorAll('a[href], iframe[src], script[src], link[rel="preload"][href]').forEach(node => {
      const source = node.getAttribute('href') || node.getAttribute('src');
      if (partnerUrl(source)) {
        if (node.tagName === 'A') node.removeAttribute('href');
        else node.remove();
      }
    });
  }

  function renderBanner(blockId, host) {
    host.className = 'ps-site-ad';
    host.id = 'ps-site-ad-' + (++serial);
    host.setAttribute('aria-label', 'Реклама');
    window.yaContextCb = window.yaContextCb || [];
    if (!window.Ya?.Context && !document.querySelector('script[src="' + sdk + '"]') &&
        !document.querySelector('#ya-rtb-loader')) {
      const script = document.createElement('script');
      script.src = sdk;
      script.async = true;
      document.head.append(script);
    }
    window.yaContextCb.push(function () {
      if (!host.isConnected) return;
      window.Ya?.Context.AdvManager.render({
        blockId,
        renderTo: host.id,
        onError: function () { host.hidden = true; }
      });
    });
  }

  function addBanners() {
    if (privatePage.test(location.pathname) || document.querySelector('[data-ps-native-ads]')) return;
    const main = document.querySelector('main, #main, [role="main"]');
    const title = main?.querySelector('h1');
    if (!title) return;
    // Next templates and static articles with existing units keep their placements.
    const legacyUnits = document.querySelector('[id^="yandex_rtb_"], [data-ps-ad-placement], [data-ps-blog-ad]');
    const nextOwnsAds = document.querySelector('script[src*="/_next/"]') &&
      /^\/(?:blog\/[^/]+\/?$|gdz\/|olimpiady\/|uchebnik\/[^/]+\/[^/]+\/)/.test(location.pathname);
    if (legacyUnits || nextOwnsAds) {
      document.querySelectorAll('[data-ps-site-ad]').forEach(node => node.remove());
      return;
    }

    const page = location.pathname + location.search;
    if (currentPage === page && document.querySelector('[data-ps-site-ad]')) return;
    document.querySelectorAll('[data-ps-site-ad]').forEach(node => node.remove());
    currentPage = page;

    const primary = document.createElement('div');
    primary.dataset.psSiteAd = 'early';
    // Put the unit after the title's main section, outside image/hero wrappers.
    let section = title;
    while (section.parentElement && section.parentElement !== main) {
      if (section.parentElement.parentElement === main && section.parentElement.children.length > 4) break;
      section = section.parentElement;
    }
    const schoolGallery = main.querySelector('.school-card-page > nav[aria-label="Быстро перейти в карточке"]');
    (schoolGallery || section).after(primary);
    renderBanner('R-A-19425636-2', primary);

    if (main.scrollHeight > 1050) {
      const secondary = document.createElement('div');
      secondary.dataset.psSiteAd = 'lower';
      main.append(secondary);
      renderBanner('R-A-19425636-3', secondary);
    }
  }

  function update() {
    scheduled = false;
    removeRetiredPromotions();
    addBanners();
  }

  function schedule() {
    if (!scheduled) {
      scheduled = true;
      setTimeout(update, 60);
    }
  }

  function start() {
    update();
    new MutationObserver(records => {
      if (records.some(record => !record.target.closest?.('.ps-site-ad, [id^="yandex_rtb_"]'))) schedule();
    }).observe(document.body, { childList: true, subtree: true });
    window.addEventListener('popstate', schedule);
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', start, { once: true });
  else start();
})();
