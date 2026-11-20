/* Shared public pages that are served outside Next.js, including static catalogs. */
(function () {
  'use strict';
  if (window.__psInformation) return;
  window.__psInformation = true;
  const privatePage = /^\/(?:api|admin|lk|education-gifts)(?:\/|$)|^\/proforientaciya\/(?:rezultat|karta-interesov)(?:\/|$)/;
  const sdk = 'https://yandex.ru/ads/system/context.js';
  const retiredDomain = /(^|\.)(?:synergy\.ru|synergy\.com|synergy-academy\.ru|syndev\.ru|school-?university\.(?:com|ru)|logos\.unis\.studio)$/i;
  const retiredUI = [
    '[data-ps-sale]', '[data-ps-sale-slot]', '[data-lektoriy]', '#lead-dialog',
    '.result-offers', '.thanks-offer:has([data-trial-form])', '.school-submission[data-mode="form"]', '#school-card-form', '[data-offer-form]',
    'a[href="#school-card-form"]', '#partner-dialog', '#partner-offers',
    '#podbor:has(form [type="tel"])', '#konsultaciya:has(form [type="tel"])',
    'form[data-growth-form]', 'form:has([type="tel"]):has([type="email"])',
    'a[href^="/podarki/#"]'
  ].join(',');
  const advertising = '.ps-site-ad, [data-ps-native-ads], [id^="yandex_rtb_"], [data-ps-ad-placement]';
  let currentPage = '';
  let scheduled = false;
  let serial = 0;

  function partnerUrl(value) {
    try { return retiredDomain.test(new URL(value, location.href).hostname); }
    catch { return false; }
  }

  function neutralText(value) {
    return value
      .replace(/(онлайн-школ[ауыое]) «Синерги[яию]»(?: \(Школьный Университет\))?/giu, '$1')
      .replace(/(?:«Академия Синергия»|Академия Синергия)/giu, 'Школа программирования')
      .replace(/Лекторий Синергии/giu, 'Лекторий онлайн-школы')
      .replace(/Synergy Kids/g, 'начальные онлайн-классы')
      .replace(/«Синергия»|Синергия(?!\p{L})|\bSynergy\b(?![./-])/gu, 'Онлайн-школа')
      .replace(/«Синергии»|Синергии(?!\p{L})/gu, 'онлайн-школы')
      .replace(/«Синергию»|Синергию(?!\p{L})/gu, 'онлайн-школу')
      .replace(/Синергией(?!\p{L})/gu, 'онлайн-школой');
  }

  function updateEditorialCopy() {
    for (const region of document.querySelectorAll('main, header, footer, #search-dialog')) {
      // Ads are managed by their SDK. Only editorial and navigation copy is touched.
      const excluded = 'script, style, iframe, ' + advertising;
      const walker = document.createTreeWalker(region, NodeFilter.SHOW_TEXT);
      for (let node = walker.nextNode(); node; node = walker.nextNode()) {
        if (!/(?:Синерги|Synergy)/.test(node.data) || node.parentElement.closest(excluded)) continue;
        const updated = neutralText(node.data);
        if (updated !== node.data) node.data = updated;
      }
    }
  }

  function removeRetiredPromotions() {
    document.querySelectorAll(retiredUI).forEach(node => { node.hidden = true; });
    document.querySelectorAll('a[href], iframe[src], script[src], link[rel="preload"][href]').forEach(node => {
      if (node.closest(advertising)) return;
      const source = node.getAttribute('href') || node.getAttribute('src');
      if (partnerUrl(source)) {
        if (node.tagName === 'A') node.removeAttribute('href');
        else node.remove();
      }
    });
  }

  function renderBanner(blockId, statId, host) {
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
        statId,
        renderTo: host.id,
        onError: function () { host.hidden = true; }
      });
    });
  }

  function addBanners() {
    if (privatePage.test(location.pathname) || document.querySelector('[data-ps-native-ads]')) {
      document.querySelectorAll('[data-ps-site-ad]').forEach(node => node.remove());
      return;
    }
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
    let section = title.closest('.hero, [data-school-gallery]') || title.parentElement;
    while (section.parentElement !== main &&
           /flex|grid/.test(getComputedStyle(section.parentElement).display)) {
      section = section.parentElement;
    }
    const schoolGallery = main.querySelector('.school-card-page > nav[aria-label="Быстро перейти в карточке"]');
    (schoolGallery || section).after(primary);
    renderBanner('R-A-19425636-2', 202611201, primary);

    if (main.getBoundingClientRect().height > 1050) {
      const secondary = document.createElement('div');
      secondary.dataset.psSiteAd = 'lower';
      main.append(secondary);
      renderBanner('R-A-19425636-3', 202611202, secondary);
    }
  }

  function update() {
    scheduled = false;
    removeRetiredPromotions();
    updateEditorialCopy();
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
