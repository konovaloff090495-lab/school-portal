import assert from 'node:assert/strict'
import fs from 'node:fs'
import {createHash} from 'node:crypto'
const covers=JSON.parse(fs.readFileSync('src/data/online-school-covers.json'))
const schools=JSON.parse(fs.readFileSync('docs/online-catalog/sources-2026-10-26.json')).schools
assert.equal(Object.keys(covers).length,schools.length)
const hashes=new Set(),fallbackHashes=new Set()
for(const school of schools){const c=covers[school.slug];assert.ok(c,school.slug)
 for(const [key,set]of [['src',hashes],['fallbackSrc',fallbackHashes]]){const file='public'+c[key];assert.ok(fs.existsSync(file),file);const hash=createHash('sha256').update(fs.readFileSync(file)).digest('hex');assert.ok(!set.has(hash),'Repeated '+key+' for '+school.slug);set.add(hash)}
 if(c.kind==='official'){assert.ok(c.sourceUrl);assert.ok(c.website);assert.equal(c.sha256,createHash('sha256').update(fs.readFileSync('public'+c.src)).digest('hex'))}
}
console.log(JSON.stringify({result:'passed',schools:schools.length,distinctCovers:hashes.size,distinctFallbacks:fallbackHashes.size,official:Object.values(covers).filter(c=>c.kind==='official').length}))
