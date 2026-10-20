#!/usr/bin/env node
// Read-only QA of the children's programming cluster. Run after changing article HTML.
import fs from 'node:fs'
import path from 'node:path'

const BLOG = 'content/blog'
const mapping = {
  age: '/blog/programmirovanie-dlya-detej-po-vozrastam/',
  price: '/blog/skolko-stoyat-kursy-programmirovaniya-dlya-detej/',
  free: '/blog/besplatnye-kursy-programmirovaniya-dlya-detej/',
  online: '/blog/onlajn-kursy-programmirovaniya-dlya-detej/',
  courses: '/blog/programmirovaniye-kursy-dlya-detej/',
  scratch: '/blog/scratch-dlya-detej/',
  python: '/blog/python-dlya-detej/',
  games: '/blog/sozdanie-igr-dlya-detej-kursy/',
  clubs: '/blog/kruzhki-programmirovaniya-dlya-detej/',
}
const topic = /programmirov|scratch|python|roblox|minecraft|unity|godot|sozdanie-(igr|sajtov)|kodland|kodabra|coddy|algoritmika|easycode|moskovskaya-shkola-programmistov|kiberbezopasnosti|progkids|codim|kvantastik|skillbox-kids/i
const findings = []
let checked = 0
for (const file of fs.readdirSync(BLOG).filter(s => s.endsWith('.json'))) {
  let doc
  try { doc = JSON.parse(fs.readFileSync(path.join(BLOG, file), 'utf8')) } catch { continue }
  if (!doc || Array.isArray(doc) || typeof doc.content !== 'string' || !topic.test(file)) continue
  checked++
  const html = doc.content
  for (const m of html.matchAll(/'\+a\('([^']+)','([^']+)'\)\+'/g)) {
    const href = mapping[m[1]]
    findings.push({file: path.join(BLOG, file), kind:'unrendered-link-helper', match:m[0], key:m[1], replacement:href ? `<a href="${href}">${m[2]}</a>` : null})
  }
  const patterns = [
    ['template-expression', /\$\{[^}]{1,140}\}/g],
    ['template-braces', /\{\{.{1,100}?\}\}/g],
    ['editor-placeholder', /\b(?:TODO|TBD|PLACEHOLDER|INSERT_HERE)\b|\[(?:ВСТАВИТЬ|ССЫЛКА|НАЗВАНИЕ)[^\]]*\]/gi],
    ['bad-link-value', /href\s*=\s*["'](?:undefined|null|#|javascript:[^"']*)["']/gi],
    ['remaining-link-helper', /\+\s*a\s*\([^)]{0,200}\)\s*\+/g],
  ]
  for (const [kind, re] of patterns) for (const m of html.matchAll(re)) {
    if (kind === 'remaining-link-helper' && findings.some(f => f.file === path.join(BLOG,file) && f.match.includes(m[0]))) continue
    findings.push({file:path.join(BLOG,file),kind,match:m[0]})
  }
  for (const m of html.matchAll(/href=["'](\/blog\/([^/"']+)\/)["']/g)) {
    if (!fs.existsSync(path.join(BLOG, `${m[2]}.json`))) findings.push({file:path.join(BLOG,file), kind:'missing-blog-target', match:m[1]})
  }
}
const report = {checked, findingCount:findings.length, generatedAt:new Date().toISOString(), mapping, findings}
const output = process.argv.find(s => s.startsWith('--output='))?.slice('--output='.length)
if (output) { fs.mkdirSync(path.dirname(output),{recursive:true});fs.writeFileSync(output, JSON.stringify(report,null,2)+'\n') }
console.log(JSON.stringify({checked,findingCount:findings.length,findings},null,2))
process.exitCode = findings.length ? 1 : 0
