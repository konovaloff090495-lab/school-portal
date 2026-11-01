const assert = require('node:assert/strict');
const rules = require('../../public/sale-context/rules.js');
const data = require('../../public/sale-context/offers.json');
const primary = (path,title='') => rules.rank(data.offers,{path,title})[0]?.offer.id;
assert.equal(data.offers.length,137);
assert.equal(new Set(data.offers.map(o=>o.id)).size,137);
assert.equal(primary('/blog/python-dlya-detej/','Python для детей'),'world-teen');
assert.equal(primary('/blog/vechernyaya-shkola-dlya-vzroslyh/'),'externat');
assert.equal(primary('/blog/kak-poluchit-dublikat-attestata/'),undefined);
assert.equal(primary('/oge/','Подготовка к ОГЭ'),'oge-pair');
assert.equal(primary('/ege/fizika/','ЕГЭ по физике'),'ege-tutor');
assert.equal(primary('/blog/fullstack-dlya-podrostkov/'),'fullstack');
assert.equal(primary('/blog/ispanskiy-dlya-detej/'),'lektoriy-ispanskiy');
assert.equal(primary('/blog/anglijskij-alfavit-dlya-detej/'),'lektoriy-angliyskiy');
assert.equal(primary('/uchebnik/algebra/9-klass/uravneniya/'),'lektoriy-algebra');
assert.equal(primary('/uchebnik/russkiy/1-klass/zvuki/'),undefined);
assert.equal(primary('/admin/otzyvy/','Образование'),undefined);
assert.equal(primary('/blog/kak-vybrat-yuridicheskiy-kolledzh/'),'college-4');
assert.equal(rules.rank(data.offers,{path:'/blog/python-dlya-detej/'}).some(x=>x.offer.id.startsWith('university')),false);
for(const o of data.offers) {
 assert.ok(o.keywords.length,o.id);
 if(o.approvalRequired) assert.equal(o.benefit,'Спецусловия',o.id);
 const u=new URL(rules.link(o.id,'/blog/test/','popup'));
 assert.equal(u.pathname,'/sale/');assert.equal(u.hash,'#offer='+o.id);assert.equal(u.searchParams.get('utm_source'),'gerasimov_lav');
}
console.log('Passed: 137 offers, topic/age exclusions, 14 page scenarios, approval flags and sale deep links');
