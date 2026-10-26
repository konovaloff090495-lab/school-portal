import assert from 'node:assert/strict'
import fs from 'node:fs'
import path from 'node:path'
import Module, { createRequire } from 'node:module'
const require=createRequire(import.meta.url), ts=require('typescript'),root=process.cwd()
const file=path.join(root,'src/data/schools.ts'),m=new Module(file);m.filename=file;m.paths=Module._nodeModulePaths(root)
m._compile(ts.transpileModule(fs.readFileSync(file,'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2020,esModuleInterop:true}}).outputText,file)
const {schools,getSchoolsByType,schoolMatchesType}=m.exports
const list=getSchoolsByType('online'), sources=JSON.parse(fs.readFileSync('docs/online-catalog/sources-2026-10-26.json','utf8'))
assert.ok(list.length>=50,'Online catalog must retain the verified expansion')
const additions=JSON.parse(fs.readFileSync('src/data/online-catalog-schools.json','utf8'))
for(const row of additions){assert.equal(schools.filter(s=>s.id===row.id).length,1,'New school ID collision '+row.id);assert.equal(schools.filter(s=>s.slug===row.slug).length,1,'New school URL collision '+row.slug)}
for(const s of list){assert.equal(s.onlineSchoolScope,'national');assert.ok(s.website);assert.ok(s.remoteOnly);assert.ok(sources.schools.some(r=>r.slug===s.slug),'Traceable source '+s.slug);assert.notEqual(s.priceFrom,0,'Unknown online tuition is not free '+s.slug)}
for(const [slug]of Object.entries(sources.resources)){const school=schools.find(s=>s.slug===slug);assert.ok(school,'Keep existing card URL');assert.equal(schoolMatchesType(school,'online'),false,'Exclude resource from school results')}
for(const s of schools.filter(s=>s.onlineSchoolScope==='regional'))assert.equal(schoolMatchesType(s,'online'),false,'Do not present unverified regional intake as nationwide')
const city=fs.readFileSync('src/app/shkoly/[region]/[type]/CityOnlinePage.tsx','utf8')
assert.match(city,/allowedSchoolSlugs=\{list\.map/)
assert.match(city,/seoContent=/)
assert.doesNotMatch(city,/<SchoolCard/)
console.log(JSON.stringify({result:'passed',schools:list.length,newCards:JSON.parse(fs.readFileSync('src/data/online-catalog-schools.json')).length,resources:Object.keys(sources.resources).length,regionalReview:schools.filter(s=>s.onlineSchoolScope==='regional').length}))
