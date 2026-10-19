(() => {
  'use strict';
  const form = document.querySelector('#course-filters');
  const initialTitle = document.title;
  const initialDescription = document.querySelector('meta[name="description"]')?.content || '';
  const initialRobots = document.querySelector('meta[name="robots"]')?.content || 'index,follow';
  const gradePaths = JSON.parse(document.body.dataset.schoolPaths || '{}');
  const h1 = document.querySelector('h1');
  const initialH1 = h1?.innerHTML;
  const cards = [...document.querySelectorAll('[data-course-card]')];
  const results = document.querySelector('#course-results');
  const count = document.querySelector('#result-count');
  const loadMore = document.querySelector('#load-more');
  const search = document.querySelector('#course-search');
  const sort = document.querySelector('#sort');
  let limit = 18;
  const value = name => form?.elements.namedItem(name)?.value || '';
  const checked = name => Boolean(form?.elements.namedItem(name)?.checked);
  const setMeta = (selector, attr, text) => { const el = document.querySelector(selector); if (el) el.setAttribute(attr, text); };
  const normalize = text => text.toLocaleLowerCase('ru').replaceAll('ё', 'е').trim();
  function readURL() {
    if (!form) return;
    const params = new URLSearchParams(location.search);
    for (const name of ['brand', 'age', 'grade', 'unit']) {
      const el = form.elements.namedItem(name);
      if (el) el.value = params.get(name) || (name === 'brand' ? document.body.dataset.baseBrand || '' : name === 'grade' ? document.body.dataset.baseGrade || '' : '');
    }
    for (const name of ['offer', 'discount', 'online']) {
      const el = form.elements.namedItem(name);
      if (el) el.checked = params.get(name) === '1';
    }
    if (search) search.value = params.get('q') || '';
    if (sort) sort.value = params.get('sort') || '';
    limit = 18;
  }
  function syncURL(replace = false) {
    const p = new URLSearchParams();
    for (const name of ['brand', 'age', 'grade', 'unit']) if (value(name) && !(name === 'brand' && value(name) === document.body.dataset.baseBrand) && !(name === 'grade' && value(name) === document.body.dataset.baseGrade)) p.set(name, value(name));
    for (const name of ['offer', 'discount', 'online']) if (checked(name)) p.set(name, '1');
    if (search?.value.trim()) p.set('q', search.value.trim());
    if (sort?.value) p.set('sort', sort.value);
    const url = location.pathname + (p.size ? '?' + p.toString() : '');
    if (url !== location.pathname + location.search) history[replace ? 'replaceState' : 'pushState']({}, '', url);
  }
  function apply() {
    if (!form || !results) return;
    const brand = value('brand'), age = Number(value('age')), grade = Number(value('grade')), unit = value('unit');
    const q = normalize(search?.value || '');
    const sortVal = sort?.value || '';
    const matching = cards.filter(card => {
      const d = card.dataset;
      if (brand && d.brand !== brand) return false;
      if (age && (!d.ageMin || age < Number(d.ageMin) || age > Number(d.ageMax))) return false;
      if (grade && (d.grades ? !d.grades.split(',').includes(String(grade)) : (!d.gradeMin || grade < Number(d.gradeMin) || grade > Number(d.gradeMax)))) return false;
      if (unit && d.unit !== unit) return false;
      if (checked('offer') && d.offer !== '1') return false;
      if (checked('discount') && d.discount !== '1') return false;
      if (checked('online') && d.online !== '1') return false;
      if (q && !normalize(d.search || '').includes(q)) return false;
      if (sortVal === 'price-lesson' && !['урок', 'занятие'].includes(d.unit)) return false;
      if (sortVal === 'price-month' && d.unit !== 'месяц') return false;
      if (sortVal === 'price-course' && d.unit !== 'курс') return false;
      return true;
    });
    if (sortVal === 'title') matching.sort((a, b) => a.dataset.title.localeCompare(b.dataset.title, 'ru'));
    if (sortVal.startsWith('price-')) matching.sort((a, b) => Number(a.dataset.price) - Number(b.dataset.price));
    cards.forEach(card => { card.hidden = true; });
    matching.forEach((card, index) => { card.hidden = index >= limit; results.append(card); });
    if (count) count.textContent = String(matching.length);
    const word = document.querySelector('#programme-word');
    if (word) { const n = matching.length; word.textContent = n%10===1&&n%100!==11 ? 'программа' : [2,3,4].includes(n%10)&&![12,13,14].includes(n%100) ? 'программы' : 'программ'; }
    if (loadMore) loadMore.hidden = matching.length <= limit;
    const empty = document.querySelector('#empty');
    if (empty) empty.hidden = matching.length > 0;
    const fragments = [];
    if (brand && brand !== document.body.dataset.baseBrand) fragments.push(form.elements.namedItem('brand').selectedOptions[0].textContent.trim());
    if (age) fragments.push('возраст ' + age + ' лет');
    if (grade && String(grade) !== document.body.dataset.baseGrade) fragments.push(grade + ' класс');
    if (checked('offer')) fragments.push('с бесплатным первым уроком');
    if (checked('discount')) fragments.push('со скидкой');
    if (checked('online')) fragments.push('онлайн');
    if (unit) fragments.push('оплата за ' + unit);
    if (q) fragments.push('поиск: ' + search.value.trim());
    if (sortVal.startsWith('price-')) fragments.push(sort.selectedOptions[0].textContent.trim().toLocaleLowerCase('ru'));
    const active = new URLSearchParams(location.search).size > 0;
    const headingText = document.body.dataset.heading || '';
    if (h1) {
      if (fragments.length) h1.textContent = headingText + ': ' + fragments.join(', ');
      else h1.innerHTML = initialH1;
    }
    document.title = fragments.length ? headingText + ' — ' + fragments.join(', ') + ' | ProSchools' : initialTitle;
    const description = fragments.length ? headingText + ': ' + matching.length + ' программ. ' + fragments.join(', ') + '. Сравните цены, формат и условия занятий.' : initialDescription;
    setMeta('meta[name="description"]', 'content', description);
    setMeta('meta[name="robots"]', 'content', active ? 'noindex,follow' : initialRobots);
    setMeta('meta[property="og:title"]', 'content', document.title);
    setMeta('meta[property="og:description"]', 'content', description);
    setMeta('meta[property="og:url"]', 'content', location.origin + location.pathname + location.search);
    if (active) document.querySelector('#list-schema')?.remove();
  }
  if (form) {
    document.querySelector('#filter-toggle')?.addEventListener('click', event => {
      const open = form.classList.toggle('open');
      event.currentTarget.setAttribute('aria-expanded', String(open));
    });
    form.addEventListener('submit', event => {
      event.preventDefault();
      const target = value('direction');
      if (target && target !== location.pathname) { location.assign(target); return; }
      limit = 18; syncURL(); apply();
    });
    form.addEventListener('change', event => {
      if (['direction','programme','goal'].includes(event.target.name)) { location.assign(event.target.value); return; }
      if (event.target.name === 'grade' && Object.hasOwn(gradePaths, event.target.value)) { location.assign(gradePaths[event.target.value]); return; }
      if (event.target.name === 'brand' && document.body.dataset.baseBrand) { location.assign(event.target.value ? '/kursy/shkoly/' + event.target.value + '/' : '/kursy/'); return; }
      limit = 18; syncURL(); apply();
    });
    document.querySelectorAll('[data-reset]').forEach(button => button.addEventListener('click', () => {
      for (const name of ['brand', 'age', 'grade', 'unit']) form.elements.namedItem(name).value = '';
      form.elements.namedItem('brand').value = document.body.dataset.baseBrand || '';
      form.elements.namedItem('grade').value = document.body.dataset.baseGrade || '';
      for (const name of ['offer', 'discount', 'online']) form.elements.namedItem(name).checked = false;
      if (search) search.value = '';
      if (sort) sort.value = '';
      limit = 18; syncURL(); apply();
    }));
    let timer;
    search?.addEventListener('input', () => { clearTimeout(timer); timer = setTimeout(() => { limit = 18; syncURL(true); apply(); }, 200); });
    sort?.addEventListener('change', () => { limit = 18; syncURL(); apply(); });
    loadMore?.addEventListener('click', () => { limit += 18; apply(); });
    addEventListener('popstate', () => { readURL(); apply(); });
    readURL(); apply();
  }
  document.querySelectorAll('[data-partner-link]').forEach(link => link.addEventListener('click', () => {
    if (typeof window.ym === 'function') window.ym(108789843, 'reachGoal', 'course_partner_click', {course: link.dataset.course, brand: link.dataset.brand});
  }));
})();
