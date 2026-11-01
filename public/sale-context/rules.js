/* Shared by the browser widget and the offline coverage audit. No page-body scraping. */
(function (root, factory) {
  if (typeof module === 'object' && module.exports) module.exports = factory();
  else root.ProSchoolsSaleRules = factory();
})(typeof window === 'undefined' ? globalThis : window, function () {
  'use strict';
  const normalize = value => String(value || '').toLowerCase().replace(/ё/g, 'е').replace(/[—–_]/g, '-');
  const excluded = /^\/(?:api|admin|lk|poisk|spasibo|politika|soglasie|reklamodatel|dobavit|razmestit)(?:\/|-|$)/;
  const adult = /(?:vzrosl|vechern|ne-zakonchil-shkolu|аттестат.*взросл|вечерн.*школ)/;
  const career = /(?:kolledzh|college|университет|universitet|university|колледж|професси|profess|карьер|karier|факультет|fakultet|абитуриент|abiturient|поступ|postup|выбор.*вуз|vybor.*vuz|после\s*(?:9|11)|posle-(?:9|11))/;
  const facultyGeneric = /(?:куда.поступ|kuda-postup|vybor-profess|выбор.професс|proforient|профориент|spetsialnost|специальност)/;
  function context(input) {
    const path = normalize(input.path).split('?')[0];
    const title = normalize(input.title);
    const text = path + ' ' + title + ' ' + normalize(input.category);
    const gradeMatch = (path + ' ' + title).match(/(?:^|[\s/\-])(1[01]|[1-9])(?:-|\s)*(?:klass|класс)/);
    const grade = gradeMatch ? Number(gradeMatch[1]) : null;
    return { path, title, text, grade, adult: adult.test(text), career: career.test(text) };
  }
  function rank(offers, input) {
    const c = context(input);
    if (!c.path || excluded.test(c.path) || /(?:дубликат|dublikat|потерял.*аттестат|poteryal.*attestat)/.test(c.text)) return [];
    const university = /^(?:university|college)-/;
    const scored = [];
    for (const o of offers) {
      const faculty = university.test(o.id);
      if (c.adult && !faculty && o.id !== 'externat') continue;
      if (faculty && !c.career) continue;
      if (faculty && /(?:college|kolledzh|колледж)/.test(c.text) && o.id.startsWith('university-')) continue;
      if (faculty && /(?:universitet|университет|vuz|\bвуз)/.test(c.text) && !/(?:колледж|kolledzh)/.test(c.text) && o.id.startsWith('college-')) continue;
      const match = o.keywords.filter(k => new RegExp(k, 'i').test(c.text));
      let score = match.length ? 30 + Math.min(match.length, 3) * 4 : 0;
      if (match.some(k => new RegExp(k, 'i').test(c.path))) score += 8;
      if (faculty && !score && facultyGeneric.test(c.text)) score = 10;
      if (/^\/(?:uchebnik|gdz)\//.test(c.path) && ['school-tutor', 'tutor'].includes(o.id)) score = Math.max(score, 12);
      if (/^\/(?:ege|oge)(?:\/|$)/.test(c.path) && o.id === (c.path.startsWith('/oge') ? 'oge-pair' : 'ege-pair')) score = Math.max(score, 45);
      if (/^\/shkoly\/(?:[^/]+\/)?$/.test(c.path) || c.path === '/') {
        if (o.id === 'homeschool') score = Math.max(score, 18);
        if (['comfort', 'standard', 'premium'].includes(o.id)) score = Math.max(score, 14);
      }
      if (/^\/kursy\/?$/.test(c.path) && !faculty && !['Домашняя школа', 'Экзамены'].includes(o.category)) score = Math.max(score, 10);
      if (/^\/olimpiady\//.test(c.path) && o.id.startsWith('lektoriy-olimpiad')) score += 8;
      if (c.adult && o.id === 'externat') score = 60;
      // Exam subject bundles are specifically Russian + maths; other subjects get an individual tutor.
      if (/ege|егэ/.test(c.text)) {
        if (o.id === 'oge-pair' || o.id === 'oge-tutor') continue;
        if (o.id === 'ege-tutor' && /(?:fizik|физик|himi|хими|biolog|биолог|angli|англи|istor|истор|obshchestv|обществ|informat|информат)/.test(c.text)) score = Math.max(score, 52);
      }
      if (/oge|огэ/.test(c.text)) {
        if (o.id === 'ege-pair' || o.id === 'ege-tutor') continue;
        if (o.id === 'oge-tutor' && /(?:fizik|физик|himi|хими|biolog|биолог|angli|англи|istor|истор|obshchestv|обществ|informat|информат)/.test(c.text)) score = Math.max(score, 52);
      }
      // Never advertise grades 5–11 to a page explicitly about primary school.
      if (c.grade && c.grade < 5 && (/класс/.test(o.age) || /(?:tutor|lecture|lektoriy|school|comfort|standard|premium|externat|profile)/.test(o.id))) continue;
      if (c.grade && c.grade < 9 && /^(?:ege|oge)-|^(?:university|college)-/.test(o.id)) continue;
      if (c.grade && o.id.startsWith('lektoriy-')) {
        const grades = (o.age.match(/\d+/g) || []).map(Number);
        if (!grades.includes(c.grade)) continue;
      }
      if (c.grade && c.grade < 7 && ['artist-teen', 'world-teen', 'fullstack', 'future', 'money'].includes(o.id)) score -= 15;
      if (c.grade && c.grade > 4 && ['artist-young', 'world-junior'].includes(o.id)) continue;
      if (!c.grade && ['artist-young', 'world-junior'].includes(o.id)) {
        if (/6.9|6-9|7.лет|7-let|8.лет|8-let|начальн|nachaln|младш|mladsh|scratch|roblox|minecraft/.test(c.text)) score += 10;
        else score -= 8;
      }
      if (o.id === 'profile' && /(?:proforient|профориент)/.test(c.text)) score -= 5;
      if (score >= 10) scored.push({ offer: o, score });
    }
    return scored.sort((a, b) => b.score - a.score || a.offer.id.localeCompare(b.offer.id));
  }
  function link(id, path, placement) {
    const url = new URL('https://school-university.com/sale/');
    url.searchParams.set('utm_source', 'gerasimov_lav');
    url.searchParams.set('utm_medium', 'lkpartners');
    url.searchParams.set('utm_campaign', 'proschools_sale_202611');
    url.searchParams.set('utm_content', path);
    url.searchParams.set('utm_term', placement + '-' + id);
    url.hash = 'offer=' + encodeURIComponent(id);
    return url.href;
  }
  return { context, rank, link };
});
