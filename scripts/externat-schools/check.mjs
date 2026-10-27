import assert from 'node:assert/strict'
import fs from 'node:fs'
import Module,{createRequire}from'node:module'
import{createHash}from'node:crypto'
const require=createRequire(import.meta.url),ts=require('typescript'),root=process.cwd(),file=root+'/src/data/schools.ts',m=new Module(file)
m.filename=file;m.paths=Module._nodeModulePaths(root);m._compile(ts.transpileModule(fs.readFileSync(file,'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2020,esModuleInterop:true}}).outputText,file)
const{schools,getSchoolsByType,getSchoolsByRegionAndType,getSchoolBySlug}=m.exports
const rows=getSchoolsByType('eksternal'),newRows=JSON.parse(fs.readFileSync('src/data/externat-catalog-schools.json')),sources=JSON.parse(fs.readFileSync('docs/externat-catalog/sources-2026-10-27.json')),covers=JSON.parse(fs.readFileSync('src/data/externat-school-covers.json'))
assert.ok(rows.length>=157)
const national=rows.filter(s=>s.externatScope==='national');assert.equal(national.length,34)
for(const row of newRows){assert.equal(schools.filter(s=>s.id===row.id).length,1,row.id);assert.equal(schools.filter(s=>s.slug===row.slug).length,1,row.slug);assert.equal(row.rating,null);assert.equal(row.reviewCount,0);assert.ok(!('priceFrom'in row));assert.ok(sources.schools.some(s=>s.slug===row.slug),row.slug);assert.ok(row.address,'New local campus must have a verified address: '+row.slug)}
for(const n of national){assert.ok(n.remoteOnly,n.slug);assert.ok(sources.schools.some(s=>s.slug===n.slug),n.slug)}
for(const[slug]of Object.entries(sources.categoryExclusions)){assert.ok(getSchoolBySlug(slug),'Retain historical detail URL');assert.ok(!rows.some(s=>s.slug===slug),'Do not inflate results with duplicate or unrelated entity')}
for(const city of ['moskva','sankt-peterburg','tomsk','kazan','ekaterinburg','nizhniy-novgorod','magadan']){const list=getSchoolsByRegionAndType(city,'eksternal');for(const n of national)assert.ok(list.includes(n),city+' receives national program once');assert.ok(list.every(s=>s.region===city||s.externatScope==='national'),'No invented local branch');assert.equal(new Set(list.map(s=>s.slug)).size,list.length)}
assert.ok(getSchoolsByRegionAndType('tomsk','eksternal').some(s=>s.slug==='shkola-top-attestaciya-tomsk'))
const spb=JSON.parse(fs.readFileSync('docs/externat-catalog/spb-official-institutions.json'));assert.equal(spb.institutions.length,18);for(const s of spb.institutions)assert.ok(rows.some(r=>r.slug===s.slug),s.slug);assert.ok(rows.some(s=>s.slug==='tsentr-obrazovaniya-80-rozhdestvenskaya-shkola-sankt-peterburg'));assert.ok(!rows.some(s=>s.slug==='shkola-80-petrogradskaya-sankt-peterburg'))
const primary=new Set(),fallback=new Set();for(const s of rows){const c=covers[s.slug];assert.ok(c,s.slug);for(const[k,set]of[['src',primary],['fallbackSrc',fallback]]){const p='public'+c[k];assert.ok(fs.existsSync(p),p);const h=createHash('sha256').update(fs.readFileSync(p)).digest('hex');assert.ok(!set.has(h),'Repeated '+k+' '+s.slug);set.add(h);if(k==='src')assert.equal(h,c.sha256)}if(c.kind==='official')assert.ok(c.sourceUrl)}
assert.equal(Object.keys(covers).length,rows.length)
console.log(JSON.stringify({result:'passed',schools:rows.length,newCards:newRows.length,national:national.length,local:rows.length-national.length,localCities:new Set(rows.filter(s=>!s.remoteOnly).map(s=>s.region)).size,uniqueCovers:primary.size,uniqueFallbacks:fallback.size,officialImages:Object.values(covers).filter(c=>c.kind==='official'||c.kind==='photo').length}))
