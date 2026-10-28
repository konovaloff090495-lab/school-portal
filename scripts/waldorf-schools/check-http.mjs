import assert from 'node:assert/strict'
import fs from 'node:fs/promises'
import { spawn } from 'node:child_process'
const root = new URL('../../', import.meta.url)
const read = async name => JSON.parse(await fs.readFile(new URL(name, root)))
const registry = await read('docs/waldorf-catalog/sources-2026-10-28.json')
const retired = await read('src/data/waldorf-retired-schools.json')
const redirects = await read('scripts/removed-schools.json')
const cityRedirects = await read('scripts/seo/waldorf-city-redirects.json')
const base = process.env.WALDORF_QA_BASE || 'http://127.0.0.1:3194'
const child = process.env.WALDORF_QA_BASE ? null : spawn(process.execPath, ['node_modules/next/dist/bin/next','start','-p','3194'],{ detached:true,stdio:'ignore' })
let checked = 0
async function get(path, redirect='follow') {
  const r = await fetch(base+path,{redirect,signal:AbortSignal.timeout(45000)})
  return {r,html:await r.text()}
}
try {
  for(let i=0;i<60;i++) {try{if((await get('/shkoly/tipy/valdorfskie/')).r.ok)break}catch{};await new Promise(r=>setTimeout(r,500))}
  const {html:hub,r} = await get('/shkoly/tipy/valdorfskie/')
  assert.equal(r.status,200)
  assert.ok(hub.includes(`${registry.length} школ, подразделений и семейных классов`))
  assert.match(hub,/Источники и актуальность списка/)
  for(const row of registry) {
    const {r,html} = await get('/shkola/'+row.slug+'/')
    assert.equal(r.status,200,row.slug)
    assert.equal((html.match(/<h1\b/g)||[]).length,1,row.slug)
    assert.ok(html.includes(row.name.replaceAll('«','&laquo;')) || html.includes(row.name) || html.includes(row.slug),row.slug)
    assert.match(html,/school-card-form/)
    checked++
  }
  for(const region of new Set(registry.map(r=>r.region))) {
    const path='/shkoly/'+region+'/valdorfskie/'
    const {r,html}=await get(path)
    assert.equal(r.status,200,path)
    assert.ok(!/<meta name="robots" content="noindex/.test(html),path)
    assert.ok(html.includes('https://pro-schools.ru'+path),path)
    checked++
  }
  for(const [source,dest] of Object.entries(cityRedirects)) {
    const {r}=await get(source+'/','manual')
    assert.equal(r.status,308,source)
    assert.equal(new URL(r.headers.get('location'),base).pathname,dest,source)
    checked++
  }
  for(const slug of Object.keys(retired)) {
    const {r}=await get('/shkola/'+slug+'/','manual')
    assert.equal(r.status,308,slug)
    assert.equal(new URL(r.headers.get('location'),base).pathname,redirects[slug],slug)
    checked++
  }
  const {html:sitemap}=await get('/sitemap.xml')
  for(const row of registry)assert.ok(sitemap.includes('/shkola/'+row.slug+'/'),row.slug)
  for(const slug of Object.keys(retired))assert.ok(!sitemap.includes('/shkola/'+slug+'/'),slug)
  console.log(JSON.stringify({result:'passed',pages:checked,cards:registry.length,retired:Object.keys(retired).length}))
} finally {if(child){try{process.kill(-child.pid,'SIGTERM')}catch{}}}
