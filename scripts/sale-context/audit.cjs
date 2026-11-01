const fs=require('node:fs');const rules=require('../../public/sale-context/rules.js');
const offers=require('../../public/sale-context/offers.json').offers;
const raw=fs.readFileSync('public/site-navigation/search-index.js','utf8');
const index=JSON.parse(raw.slice(raw.indexOf('=')+1).trim().replace(/;$/,''));
const source=new Map(index.map(p=>[new URL(p.u,'https://pro-schools.ru').pathname,{path:new URL(p.u,'https://pro-schools.ru').pathname,title:p.t,category:p.s}]));
for(const p of JSON.parse(fs.readFileSync('content/blog/index.json','utf8')))source.set('/blog/'+p.slug+'/',{path:'/blog/'+p.slug+'/',title:p.title,category:p.category});
const pages=[],byOffer=Object.fromEntries(offers.map(o=>[o.id,{title:o.title,primaryPages:[],relatedPages:[],approvalRequired:o.approvalRequired}]));
for(const page of source.values()){
 const ranked=rules.rank(offers,{path:page.path,title:page.title});if(!ranked.length)continue;
 pages.push({...page,primary:ranked[0].offer.id,related:ranked.slice(1).map(r=>r.offer.id)});
 for(const [i,{offer}]of ranked.entries())byOffer[offer.id][i?'relatedPages':'primaryPages'].push(page.path);
}
const uncovered=Object.entries(byOffer).filter(([,o])=>!o.primaryPages.length&&!o.relatedPages.length).map(([id])=>id);
fs.writeFileSync('docs/sale-context/page-map.json',JSON.stringify({version:'20261101',analysedPages:source.size,matchedPages:pages.length,uncovered,pages,byOffer},null,2)+'\n');
console.log(JSON.stringify({analysedPages:source.size,matchedPages:pages.length,offers:offers.length,coveredOffers:offers.length-uncovered.length,uncovered},null,2));
