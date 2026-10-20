/** Reviewed source adapters. Keeps brands, physical branches and online delivery distinct. */
import fs from 'node:fs'
import path from 'node:path'
import crypto from 'node:crypto'
import { createJiti } from '../../node_modules/jiti/lib/jiti.mjs'
const root=path.resolve(import.meta.dirname,'../..')
const read=(p,fallback)=>fs.existsSync(path.join(root,p))?JSON.parse(fs.readFileSync(path.join(root,p),'utf8')):fallback
const write=(p,x)=>{fs.mkdirSync(path.dirname(path.join(root,p)),{recursive:true});fs.writeFileSync(path.join(root,p),JSON.stringify(x,null,2)+'\n')}
const jiti=createJiti(import.meta.url,{interopDefault:true})
const previous=read('src/data/programming-imported-schools.json',[])
const previousIds=new Set(previous.map(x=>x.id))
const data=await jiti.import('../../src/data/schools.ts')
const legacy=data.schools.filter(s=>s.type==='programmirovanie'&&!previousIds.has(s.id))
const local=[...read('src/data/programming-local-verified.json',[]),...read('src/data/programming-local-extra-verified.json',[])]
const online=read('src/data/programming-online-verified.json',{brands:[],courses:[]})
const checked='2026-10-19'
const normal=s=>String(s||'').toLowerCase().replaceAll('ё','е').replace(/(?:улица|проспект|просп\.|переулок|пер\.|ул\.|дом|д\.)/g,'').replace(/[^а-яa-z0-9]/g,'')
function ages(value){if(Array.isArray(value))return value;const n=String(value||'').match(/\d+/g)?.map(Number);return n?.length===2&&n[0]>=2&&n[0]<=n[1]&&n[1]<=18?n:undefined}
function brand(s){
 const t=(s.brand||s.name||'')+' '+(s.website||'')
 if(/kiber.?one|киберван|киберон/i.test(t))return 'kiberone'
 if(/алгоритмик|algoritmika/i.test(t))return 'algoritmika'
 if(/coddy|кодди/i.test(t))return 'coddy'
 if(/top-academy|академия TOP/i.test(t))return 'top-academy'
 if(/мшп|школа программистов|informatics\.ru/i.test(t))return 'mshp'
 return s.brandId||s.programmingBrandId||'local-'+normal(s.name).slice(0,35)
}
const updates={}
const moCities={...data.moCityLabels}
const translit=s=>String(s).toLowerCase().replaceAll('ё','е').split('').map(c=>({'а':'a','б':'b','в':'v','г':'g','д':'d','е':'e','ж':'zh','з':'z','и':'i','й':'y','к':'k','л':'l','м':'m','н':'n','о':'o','п':'p','р':'r','с':'s','т':'t','у':'u','ф':'f','х':'kh','ц':'ts','ч':'ch','ш':'sh','щ':'shch','ъ':'','ы':'y','ь':'','э':'e','ю':'yu','я':'ya'}[c]??c)).join('').replace(/[^a-z0-9]+/g,'-').replace(/^-|-$/g,'')
const extraMo={}
for(const r of local){if(r.region!=='moskovskaya-oblast')continue;const present=Object.entries(moCities).find(([,label])=>normal(label)===normal(r.city));if(present)r.city=present[1];else{const slug=translit(r.city);moCities[slug]=r.city;extraMo[slug]=r.city}}
// Preserve generated locality labels on subsequent runs too.
Object.assign(extraMo,read('src/data/programming-geography.json',{moCities:{}}).moCities)
write('src/data/programming-geography.json',{moCities:extraMo})
for(const s of legacy){
 const p={programmingBrandId:brand(s)}
 const m=(s.description||'').match(/Оценка на Яндекс Картах\s*[—–-]\s*(\d(?:[,.]\d)?)(?:,\s*отзывов:\s*(\d+))?/)
 if(m){p.yandexRating=Number(m[1].replace(',','.'));if(m[2])p.yandexReviewCount=Number(m[2]);p.yandexMapsUrl='https://yandex.ru/maps/?text='+encodeURIComponent([s.name,s.city,s.address].join(' '))}
 if(s.city==='Северск')p.region='seversk'
 // Retain a correct region when a street prefix was misread as a settlement.
 if((s.region==='sankt-peterburg'&&s.city==='Энгельс')||(s.region==='tula'&&s.city==='Энгельс')||(s.region==='vladivostok'&&s.city==='Бор'))p.city=data.regionLabels[s.region]
 if(['kompyuternaya-akademiya-top-33-engels','algoritmika-113-engels','algoritmika-154-engels'].includes(s.slug)){
  p.address='проспект Энгельса, '+s.address
  p.name=s.name.replace('Энгельс,','проспект Энгельса,')
  p.sourceUrl=s.slug.startsWith('kompyuternaya')?'https://spb.top-academy.ru/':'https://spb-vb.algoritmika.org/'
  p.checkedAt='2026-10-20'
 }
 if(s.slug==='svetit-engels'){p.address='улица Фридриха Энгельса, 133';p.sourceUrl='https://svetit71.ru/';p.checkedAt='2026-10-20'}
 if(s.slug==='algoritmika-102-bor'){p.address='улица Борисенко, 102';p.sourceUrl='https://vladivostok.spravker.ru/kompyuternyie-kursyi/';p.checkedAt='2026-10-20'}
 updates[s.slug]=p
}
let physical=legacy.map(s=>({...s,...updates[s.slug]}))
const imported=[]
function addressKey(s){
 let v=String(s.address||'').toLowerCase().replaceAll('ё','е').replace(/\([^)]*\)/g,'')
 const city=String(s.city||'').toLowerCase().replaceAll('ё','е');v=v.replace(city,'')
 v=v.replace(/^(?:жк|тц|бц|мкр|золотая нива)[^,]*,\s*/i,'')
 v=v.split(/,\s*(?:оф(?:ис)?\b|оф\.|кабинет|каб\.|школа|лицей|тц|рк|бц|квартал|отдельный|\d+\s*этаж|\d+-й\s*этаж|первый этаж|второй этаж)/i)[0]
 v=v.replace(/корпус|корп\./g,'к').replace(/\b(?:ул|улица|проспект|просп|пр-т|проезд|пр|переулок|пер|бульвар|бул|шоссе|ш|дом|д|г)\b\.?/g,'')
 // JS word boundaries do not cover Cyrillic; remove address labels explicitly.
 v=v.replace(/(?:^|[\s,])(?:ул\.?|улица|проспект|просп\.?|пр-т|проезд|пр\.|переулок|пер\.?|бульвар|бул\.?|шоссе|ш\.|дом|д\.|г\.)\s*/g,' ')
 return normal(v)
}
const key=s=>brand(s)+'|'+normal(s.city)+'|'+addressKey(s)
const keys=new Map(physical.map(s=>[key(s),s]))
const importsBySource=new Map()
for(const r of local){
 if(!r.address||!r.city||!/^https:\/\//.test(r.sourceUrl||''))throw Error('Unverified physical record '+r.id)
 const id=r.id||'programming-'+crypto.createHash('sha256').update(r.sourceUrl+'|'+r.address).digest('hex').slice(0,16)
 if(importsBySource.has(id))continue
 importsBySource.set(id,true)
 const existing=(r.existingSlug&&physical.find(s=>s.slug===r.existingSlug))||keys.get(key(r))
 const extra={sourceUrl:r.sourceUrl,checkedAt:r.checkedAt||checked,address:r.address,city:r.city,region:r.region,programmingBrandId:brand(r),programmingFormat:'Очные занятия',ageRange:ages(r.ageRange),programmingTopics:r.directionsScope==='branch'?r.directions:[],website:r.website||r.sourceUrl,phone:r.phone||'',...(r.lat!=null?{lat:r.lat,lon:r.lon}:{}),...(r.metro?{metro:r.metro}:{})}
 if(existing){updates[existing.slug]={...updates[existing.slug],...extra};continue}
 const s={id,slug:id,name:r.name||r.brand,type:'programmirovanie',region:r.region,city:r.city,address:r.address,phone:r.phone||'',...extra,description:`${r.brand||r.name} — очная школа программирования для детей в городе ${r.city}. Учебная локация: ${r.address}. Адрес подтверждён на официальном сайте школы.`,fullDescription:`${r.brand||r.name}: учебная локация в городе ${r.city}, ${r.address}. Адрес и контакты подтверждены по официальной городской странице ${r.checkedAt||checked}. Программу и наличие свободных мест следует уточнить именно для этого адреса. Общая программа сети не означает, что все направления доступны в каждом филиале.`,grades:extra.ageRange?`Дети ${extra.ageRange[0]}–${extra.ageRange[1]} лет`:'Возраст уточняется',features:['Программирование для детей','Очные занятия'],rating:null,reviewCount:0,photoCount:0,imageAlt:`${r.brand||r.name}: школа программирования в городе ${r.city}`}
 imported.push(s);keys.set(key(s),s)
}
const courseCatalog=read('data/courses/catalog.json',[])
const aliases={}
for(const b of online.brands){
 const old=data.schools.find(s=>s.type==='online'&&((b.id==='algoritmika'&&s.slug==='onlain-shkola-algoritmika-moskva')||(b.id==='kodabra'&&s.slug==='onlain-shkola-kodabra-moskva')))
 const slug=old?.slug||'onlayn-programmirovanie-'+b.id
 const s={id:old?.id||slug,slug,name:b.name,type:'programmirovanie',region:'russia-online',city:'Онлайн',address:'',phone:b.phone||'',website:b.website,remoteOnly:true,sourceUrl:b.sourceUrl||b.website,checkedAt:b.checkedAt||checked,ageRange:b.ageRange||undefined,programmingTopics:b.topics||[],programmingBrandId:b.id,programmingFormat:b.format||'Онлайн',description:b.description,fullDescription:b.description,grades:b.ageRange?`Дети ${b.ageRange[0]}–${b.ageRange[1]} лет`:'Возраст зависит от программы',features:['Программирование для детей','Онлайн'],rating:null,reviewCount:0,photoCount:0,imageAlt:b.name+' — программирование для детей онлайн'}
 if(old)updates[old.slug]={...s,type:'online'};else imported.push(s)
 aliases[b.id]=slug
}
write('src/data/programming-school-updates.json',updates)
write('src/data/programming-imported-schools.json',imported)
write('data/courses/programming-brand-map.json',aliases)
physical=legacy.map(s=>({...s,...updates[s.slug]})).concat(imported.filter(s=>!s.remoteOnly))
const onlineCards=online.brands.map(b=>({...b,slug:aliases[b.id],courses:courseCatalog.filter(c=>c.active&&c.brandId===b.id&&c.online)}))
write('work/programming/runtime.json',{checkedAt:checked,regions:data.regionLabels,locatives:data.regionLabelsIn,moCities,metro:data.metroSlugToName,districtLabels:data.moscowDistrictLabels,physical,online:onlineCards,courses:courseCatalog.filter(c=>c.active),legacySlugs:legacy.map(s=>s.slug),stats:{legacy:legacy.length,physical:physical.length,importedPhysical:imported.filter(s=>!s.remoteOnly).length,onlineBrands:online.brands.length,regionGroups:new Set(physical.map(s=>s.region)).size}})
console.log(JSON.stringify({legacy:legacy.length,newPhysical:imported.filter(s=>!s.remoteOnly).length,online:onlineCards.length,total:physical.length,regions:new Set(physical.map(s=>s.region)).size}))
