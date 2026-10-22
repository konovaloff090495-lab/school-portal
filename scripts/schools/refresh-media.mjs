/** Audit local galleries and cache official website cover images. No image-search guesses. */
import fs from 'node:fs'
import path from 'node:path'
import Module from 'node:module'
import { createRequire } from 'node:module'
const require = createRequire(import.meta.url)
const ts = require('typescript'), sharp = require('sharp')
const root = path.resolve(import.meta.dirname, '../..')
const file = path.join(root, 'src/data/schools.ts')
const mod = new Module(file); mod.filename = file; mod.paths = Module._nodeModulePaths(root)
mod._compile(ts.transpileModule(fs.readFileSync(file, 'utf8'), { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020, esModuleInterop: true } }).outputText, file)
const schools = mod.exports.schools
const args = Object.fromEntries(process.argv.slice(2).map(v => v.replace(/^--/, '').split('=')))
const photoDir = path.join(args['source-public'] || path.join(root, 'public'), 'schools')
const dataFile = path.join(root, 'src/data/school-media.json')
const data = fs.existsSync(dataFile) ? JSON.parse(fs.readFileSync(dataFile)) : { photos: {}, websites: {} }
data.photos = {}
for (const s of schools) {
  let count = 0
  for (let i = 1; i <= 3; i++) {
    const p = path.join(photoDir, `${s.slug}-${i}.jpg`)
    if (!fs.existsSync(p) || fs.statSync(p).size < 1000) break
    count++
  }
  if (count) data.photos[s.slug] = count
}
const hosts = new Map()
for (const s of schools.filter(s => !data.photos[s.slug] && s.website)) {
  try { const h = new URL(s.website).hostname.replace(/^www\./, ''); if (['t.me','vk.com','vk.ru','ok.ru','tilda.ws','taplink.cc'].includes(h)) continue; const item = hosts.get(h) || { count: 0, urls: [] }; item.count++; if (!item.urls.includes(s.website)) item.urls.push(s.website); hosts.set(h, item) } catch {}
}
const queue = [...hosts].sort((a,b) => b[1].count-a[1].count).slice(0, Number(args.limit || 80))
// Always include the schools from the reported screenshot.
for (const h of ['coddyschool.com', 'mshp.informatics.ru', 'moscow.kiber-one.com']) if (hosts.has(h) && !queue.some(([k]) => k === h)) queue.push([h, hosts.get(h)])
const out = path.join(root, 'public/schools/official'); fs.mkdirSync(out, {recursive:true})
const decode = s => s.replace(/&amp;/g,'&').replace(/&#(?:x([0-9a-f]+)|(\d+));/gi, (_,h,d) => String.fromCodePoint(parseInt(h || d,h?16:10)))
async function cover(host, info) {
  if (data.websites[host] && fs.existsSync(path.join(root, 'public', data.websites[host].src))) return
  for (const website of info.urls.slice(0, 2)) {
    try {
      const page = await fetch(website, {signal:AbortSignal.timeout(9000),headers:{'User-Agent':'Mozilla/5.0'}})
      if (!page.ok) continue
      const html = await page.text(); let source
      for (const tag of html.match(/<meta\b[^>]*>/gi) || []) {
        const attrs = Object.fromEntries([...tag.matchAll(/([\w:-]+)\s*=\s*["']([^"']*)["']/g)].map(m=>[m[1].toLowerCase(),m[2]]))
        if (/^(og:image|twitter:image)$/.test(attrs.property || attrs.name || '') && attrs.content) { source = new URL(decode(attrs.content), page.url).href; break }
      }
      if (!source) continue
      const r = await fetch(source, {signal:AbortSignal.timeout(10000)}); if (!r.ok || !r.headers.get('content-type')?.startsWith('image/')) continue
      const bytes = Buffer.from(await r.arrayBuffer()); if (bytes.length > 15000000) continue
      const meta = await sharp(bytes).metadata(); if (meta.width < 300 || meta.height < 140) continue
      const filename = host.replace(/[^a-z0-9.-]/gi,'_')+'.webp'
      await sharp(bytes).rotate().resize({width:1200,height:800,fit:'inside',withoutEnlargement:true}).webp({quality:82}).toFile(path.join(out,filename))
      data.websites[host] = {src:'/schools/official/'+filename, sourceUrl:source, website, checkedAt:'2026-10-22'}
      console.log(host, info.count, 'official cover'); return
    } catch {}
  }
}
let cursor = 0
await Promise.all(Array.from({length:4},async()=>{while(cursor<queue.length){const [h,i]=queue[cursor++];await cover(h,i)}}))
fs.writeFileSync(dataFile,JSON.stringify(data,null,2)+'\n')
console.log(JSON.stringify({schools:schools.length,withPhotos:Object.keys(data.photos).length,officialWebsites:Object.keys(data.websites).length}))
