/* Progressive navigation while the large Next build is deferred. */
(() => {
  if (location.pathname.startsWith('/kursy/')) return;
  function addLinks() {
    const inner = document.querySelector('header .header-inner');
    const nav = inner?.querySelector('nav');
    if (!inner || !nav) return;
    if (!nav.querySelector('a[href="/kursy/"]')) {
      const a = document.createElement('a');
      a.href = '/kursy/'; a.textContent = 'Курсы'; a.className = 'ps-courses-nav';
      a.style.cssText = 'padding:8px 9px;border-radius:10px;color:#bd3c17;text-decoration:none;white-space:nowrap;font:700 14px var(--font-manrope, sans-serif)';
      const schoolButton = nav.querySelector('button');
      if (schoolButton) schoolButton.after(a); else nav.prepend(a);
    }
    if (!inner.querySelector('.ps-courses-mobile')) {
      const a = document.createElement('a');
      a.href = '/kursy/'; a.textContent = 'Курсы'; a.className = 'ps-courses-mobile';
      nav.after(a);
    }
    const footer = document.querySelector('footer');
    if (footer && !footer.querySelector('a[href="/kursy/"]')) {
      const target = footer.querySelector('a[href="/shkoly/"]');
      if (target) {
        const a = document.createElement('a'); a.href = '/kursy/'; a.textContent = 'Курсы для детей →';
        a.style.cssText = 'display:block;font-size:13px;font-weight:700;color:#ff9c75;text-decoration:none;margin-top:5px';
        target.after(a);
      }
    }
  }
  const style = document.createElement('style');
  style.textContent = '.ps-courses-mobile{display:none}@media(max-width:768px){.ps-courses-mobile{display:inline-flex;padding:8px;color:#bd3c17;font:700 12px var(--font-manrope,sans-serif);white-space:nowrap;text-decoration:none}}@media(max-width:480px){.header-city-label{display:none!important}}';
  document.head.append(style);
  function start() {
    const schedule = window.requestIdleCallback || (fn => setTimeout(fn, 100));
    schedule(addLinks, {timeout:1000});
    // Header persists across client navigation. Re-check only after route changes.
    addEventListener('popstate', addLinks);
  }
  if (document.readyState === 'complete') start(); else addEventListener('load', start, {once:true});
})();
