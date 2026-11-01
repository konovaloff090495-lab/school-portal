/* One contextual promotion runtime for Next pages and static catalogues. */
(function () {
  'use strict';
  if (window.__psSaleBooted) return;
  window.__psSaleBooted = true;
  const VERSION = '20261101';
  const PREFIX = '/sale-context/';
  const VALID_UNTIL = Date.parse('2026-12-07T00:00:00+03:00');
  if (Date.now() >= VALID_UNTIL) return;
  const loadScript = src => new Promise((resolve, reject) => {
    const el = document.createElement('script'); el.src = src; el.onload = resolve; el.onerror = reject; document.head.append(el);
  });
  const css = document.createElement('link');css.rel = 'stylesheet';css.href = PREFIX + 'style.css?v=' + VERSION;document.head.append(css);
  let offers, rules, state, observer, timer, routeTimer;
  const read = (storage, key) => { try { return storage.getItem(key); } catch { return null; } };
  const write = (storage, key, value) => { try { storage.setItem(key, value); } catch {} };
  const track = (event, offer, placement) => {
    const data = { offer_id: offer.id, page_path: location.pathname, placement, campaign: 'sale_202611' };
    try { if (typeof window.ym === 'function') {
      window.ym(108789843, 'reachGoal', 'sale_' + event, data);
      if (placement === 'popup' && ['shown', 'click'].includes(event)) window.ym(108789843, 'reachGoal', 'partner_popup_' + event, data);
      if (placement === 'banner' && event === 'click') window.ym(108789843, 'reachGoal', 'partner_banner_click', data);
    }} catch {}
  };
  function el(tag, cls, text) { const node = document.createElement(tag); if (cls) node.className = cls; if (text) node.textContent = text; return node; }
  function button(text, cls, action) { const b = el('button', cls, text); b.type = 'button'; b.addEventListener('click', action); return b; }
  function photo(o) { const img = el('img', 'ps-sale-photo');img.src = PREFIX + 'images/' + o.id + '.webp';img.alt = '';img.width = 600;img.height = 500;img.loading = 'lazy';img.addEventListener('error', () => {img.hidden = true;});return img; }
  function cta(o, placement) {
    const a = el('a', 'ps-sale-cta', o.free ? 'Записаться бесплатно' : o.approvalRequired ? 'Посмотреть условия' : 'Получить предложение');
    a.href = rules.link(o.id, location.pathname, placement);a.target = '_blank';a.rel = 'noopener sponsored';
    const arrow = el('span', '', '↗');arrow.setAttribute('aria-hidden', 'true');a.append(arrow);
    a.addEventListener('click', () => {track('click', o, placement);write(sessionStorage, 'ps_sale_clicked', String(Date.now()));if (state?.dialog.open) state.dialog.close();});return a;
  }
  function selection(o) {
    if (!state) return;
    state.active = o;
    const wrap = state.content;wrap.replaceChildren();
    const art = el('div', 'ps-sale-art');art.setAttribute('aria-hidden', 'true');art.append(photo(o), el('span', 'ps-sale-percent ps-sale-percent-one', '%'), el('span', 'ps-sale-percent ps-sale-percent-two', '%'), el('span', 'ps-sale-seal', o.benefit));
    const copy = el('div', 'ps-sale-copy');
    copy.append(el('span', 'ps-sale-eyebrow', 'РЕКЛАМА · ' + o.brand), el('span', 'ps-sale-hand', 'Главная распродажа'), el('h2', 'ps-sale-title', o.title));
    copy.querySelector('h2').id = 'ps-sale-dialog-title';
    copy.append(el('p', 'ps-sale-description', o.description));
    const meta = el('div', 'ps-sale-meta');meta.append(el('span', '', o.age), el('span', '', o.category));copy.append(meta);
    if (rules.context({path: location.pathname, title: state.title}).adult && o.id === 'externat') copy.append(el('p','ps-sale-note','Приём взрослых, документы и условия экзаменов уточните у консультанта Синергии.'));
    copy.append(cta(o, 'popup'), el('p','ps-sale-note', o.approvalRequired ? 'Состав программы, набор и скидки требуют подтверждения на странице предложения.' : 'Условия и доступность предложения — на странице распродажи партнёра.'));
    wrap.append(copy, art);
    const alternatives = state.related;
    alternatives.replaceChildren();
    if (state.ranked.length > 1) {
      const details = el('details', 'ps-sale-alternatives');const summary=el('summary','','Ещё предложения по этой теме · '+(state.ranked.length-1));details.append(summary);
      const list=el('div','ps-sale-related-list');
      state.ranked.filter(item => item.offer.id !== o.id).forEach(({offer}) => list.append(button(offer.title,'ps-sale-related',()=>{selection(offer);track('shown',offer,'popup');state.dialog.querySelector('.ps-sale-cta')?.focus();})));
      details.append(list);alternatives.append(details);
    }
  }
  function close() { state?.dialog.close(); }
  function show(manual) {
    if (!state || state.dialog.open || (!manual && (Date.now() >= VALID_UNTIL || suppressed()))) return;
    if (document.querySelector('dialog[open], [role="dialog"][aria-modal="true"]')) return;
    const focus = document.activeElement;
    if (!manual && (focus?.matches('input,textarea,select,[contenteditable="true"]') || Array.from(document.querySelectorAll('form')).some(f=>{const r=f.getBoundingClientRect();return r.height>0&&r.top<innerHeight&&r.bottom>0;}))) return;
    state.opener = focus;state.oldOverflow = document.body.style.overflow;
    selection(state.active);state.dialog.showModal();document.body.style.overflow = 'hidden';
    write(sessionStorage, 'ps_sale_seen:' + state.path, '1');track('shown',state.active,'popup');
  }
  function suppressed() {
    return !state || !!read(sessionStorage,'ps_sale_seen:'+state.path) || Date.now()-Number(read(localStorage,'ps_sale_closed')||0)<10*60*1000 || Date.now()-Number(read(sessionStorage,'ps_sale_clicked')||0)<30*60*1000;
  }
  function scroll() {
    if (!state || state.dialog.open) return;
    const progress=window.scrollY / Math.max(document.documentElement.scrollHeight-innerHeight,1);
    if (Date.now()-state.started>12000 && progress>.3) show(false);
  }
  function teardown() {
    clearTimeout(timer);observer?.disconnect();
    if (!state) return;
    if (state.dialog.open) state.dialog.close();
    state.banner.remove();state.dialog.remove();state=null;
  }
  function mount() {
    const heading=document.querySelector('#main h1, main h1, h1');
    if (!heading) return;
    const title=heading.textContent.trim();const signature=location.pathname+'|'+title;
    if (state?.signature === signature && state.banner.isConnected) return;
    teardown();
    const ranked=rules.rank(offers,{path:location.pathname,title});
    if (!ranked.length) return;
    const o=ranked[0].offer;
    const banner=el('aside','ps-sale-banner');banner.setAttribute('aria-label','Спецпредложение по теме страницы');banner.dataset.psSale='banner';banner.dataset.offer=o.id;
    const label=el('div','ps-sale-banner-label');label.append(el('span','ps-sale-eyebrow','РЕКЛАМА · ГЛАВНАЯ'),el('strong','','распродажа'),el('span','ps-sale-benefit',o.benefit));
    const copy=el('div','ps-sale-banner-copy');copy.append(el('span','ps-sale-brand',o.brand+' · '+o.age),el('h2','',o.title),el('p','',o.description));
    const actions=el('div','ps-sale-banner-actions');actions.append(cta(o,'banner'),button('Предложения по теме','ps-sale-more',()=>show(true)));
    banner.append(label,copy,actions);
    const slots=Array.from(document.querySelectorAll('[data-ps-sale-slot]'));const slot=slots.find(n=>n.getBoundingClientRect().width>0);
    const cardAnchor=document.querySelector('[data-school-card-release] .school-card-layout');
    const lessonAnchor=location.pathname.startsWith('/uchebnik/') ? document.querySelector('.textbook-content') : location.pathname.startsWith('/gdz/') ? Array.from(document.querySelectorAll('article.gdz-solve')).at(-1) : null;
    if (slot) slot.append(banner);
    else if (cardAnchor) cardAnchor.insertAdjacentElement('afterend',banner);
    // Keep the short answer, existing mobile ad and worked solution in their original order.
    else if (lessonAnchor) lessonAnchor.insertAdjacentElement('afterend',banner);
    else {
      const anchor=heading.closest('header,.hero-wrap,.ps-hero,.hero,.page-hero,.gdz-pagehead') || heading.parentElement;
      if (!anchor || anchor===document.body || anchor===document.documentElement) return;
      if (anchor.matches('[class*="max-w-"]')) anchor.append(banner);
      else anchor.insertAdjacentElement('afterend',banner);
    }
    const dialog=el('dialog','ps-sale-dialog');dialog.dataset.psSale='popup';dialog.setAttribute('aria-labelledby','ps-sale-dialog-title');
    const content=el('div','ps-sale-content');const related=el('div','ps-sale-related-wrap');
    const dismiss=button('×','ps-sale-close',close);dismiss.setAttribute('aria-label','Закрыть предложение');const closebar=el('div','ps-sale-closebar');closebar.append(dismiss);dialog.append(closebar,content,related);document.body.append(dialog);
    state={path:location.pathname,title,signature,ranked,active:o,banner,dialog,content,related,started:Date.now(),opener:null,oldOverflow:''};
    dialog.addEventListener('click',e=>{if(e.target===dialog){const r=dialog.getBoundingClientRect();if(e.clientX<r.left||e.clientX>r.right||e.clientY<r.top||e.clientY>r.bottom)close();}});
    const mounted=state;dialog.addEventListener('close',()=>{document.body.style.overflow=mounted.oldOverflow||'';write(localStorage,'ps_sale_closed',String(Date.now()));if(mounted.opener?.isConnected)mounted.opener.focus();});
    observer=new IntersectionObserver(entries=>{if(entries.some(e=>e.isIntersecting)){track('shown',o,'banner');observer.disconnect();}},{threshold:.25});observer.observe(banner);
    timer=setTimeout(()=>show(false),30000);
  }
  function route() {clearTimeout(routeTimer);routeTimer=setTimeout(mount,100);}
  Promise.all([
    fetch(PREFIX+'offers.json?v='+VERSION).then(r=>{if(!r.ok)throw Error('offers');return r.json();}),
    window.ProSchoolsSaleRules ? Promise.resolve() : loadScript(PREFIX+'rules.js?v='+VERSION)
  ]).then(([data])=>{
    offers=data.offers;rules=window.ProSchoolsSaleRules;mount();
    window.addEventListener('ps:navigation-route',route);window.addEventListener('popstate',route);window.addEventListener('scroll',scroll,{passive:true});
    // Next can stream a page after the route notification; only react to heading/path changes.
    const changes=new MutationObserver(()=>{const h=document.querySelector('#main h1,main h1,h1');if(h&&(!state||state.signature!==location.pathname+'|'+h.textContent.trim()))route();});
    changes.observe(document.querySelector('#main')||document.body,{childList:true,subtree:true});
  }).catch(()=>{css.remove();window.__psSaleBooted=false;});
})();
