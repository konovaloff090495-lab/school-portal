import assert from 'node:assert/strict'
import { readFileSync, existsSync } from 'node:fs'
import { createJiti } from '../../node_modules/jiti/lib/jiti.mjs'

const root = new URL('../../', import.meta.url)
const json = p => JSON.parse(readFileSync(new URL(p, root), 'utf8'))
const jiti = createJiti(import.meta.url, { interopDefault: true })
const { schools } = await jiti.import('../../src/data/schools.ts')
const { explicitSchoolGrades } = await jiti.import('../../src/lib/school-grades.ts')
const { hasConfirmedFreePrice } = await jiti.import('../../src/lib/school-price.ts')
const { getOnlineBrand } = await jiti.import('../../src/data/online-brands.ts')

assert.deepEqual(explicitSchoolGrades('1–4, 6'), [1, 2, 3, 4, 6])
assert.deepEqual(explicitSchoolGrades('Школьники 6–14 лет'), [])
assert.deepEqual(explicitSchoolGrades('Уточняйте классы'), [])
assert.equal(hasConfirmedFreePrice({}), false)
assert.equal(hasConfirmedFreePrice({ priceFrom: 0 }), true)
assert.equal(hasConfirmedFreePrice({ priceFrom: 1500 }), false)
for (const slug of ['ekst-barnaul-7', 'ekst-tolyatti-1']) assert.ok(!schools.some(s => s.slug === slug), slug)
for (const slug of ['otkrytaya-shkola-88-moskva-2', 'eksternal-shkola-185-moskva']) {
  const school = schools.find(s => s.slug === slug)
  assert.ok(school)
  assert.equal(school.priceFrom, undefined, slug)
}
assert.equal(getOnlineBrand('hochu-uchitsya').attestation, 'partner')
assert.equal(getOnlineBrand('hochu-uchitsya').priceFrom, 0)
assert.equal(getOnlineBrand('ibls').priceFrom, 0)
assert.equal(getOnlineBrand('sinergiya').grades, '5–11')

const grades = json('src/data/online-grade-pages.json')
assert.equal(grades.length, 13)
assert.equal(new Set(grades.map(p => p.slug)).size, 13)
assert.deepEqual(grades.filter(p => p.grades.length === 1).flatMap(p => p.grades).sort((a, b) => a - b), Array.from({ length: 11 }, (_, i) => i + 1))
for (const page of json('src/data/school-format-catalog-pages.json')) {
  const selected = schools.filter(s => s.type === page.type && page.grades.every(g => explicitSchoolGrades(s.grades).includes(g)) && (!page.freeOnly || hasConfirmedFreePrice(s)))
  if (page.freeOnly) assert.ok(selected.every(s => s.priceFrom === 0))
  if (page.grades.length) assert.ok(selected.every(s => page.grades.every(g => explicitSchoolGrades(s.grades).includes(g))))
}

const manifest = json('content/blog/index.json')
const slugs = new Set(manifest.map(p => p.slug))
assert.equal(slugs.size, manifest.length)
assert.ok(!slugs.has('domashee-obuchenie-plyusy-minusy-2026'))
const redirects = json('scripts/seo/school-blog-redirects.json')
assert.equal(redirects['/blog/domashee-obuchenie-plyusy-minusy-2026'], '/blog/domashnee-obuchenie-plyusy-minusy/')
const newSlugs = ['materinskij-kapital-na-onlajn-shkolu', 'besplatnaya-onlajn-shkola', 'foxford-ili-onlajn-shkola-1', 'vozvrat-deneg-onlajn-shkola', 'vechernyaya-shkola-posle-korrekcionnoj']
for (const slug of newSlugs) assert.ok(slugs.has(slug), slug)
const refreshed = manifest.filter(p => p.updatedAt === '2026-10-22')
const broken = []
for (const meta of refreshed) {
  const post = json(`content/blog/${meta.slug}.json`)
  assert.equal(post.title, meta.title)
  assert.equal(post.excerpt, meta.excerpt)
  assert.ok(!/<h1\b/i.test(post.content), meta.slug)
  for (const [, url] of post.content.matchAll(/href="(\/[^"#?]*)/g)) {
    const blog = url.match(/^\/blog\/([a-z0-9-]+)\/$/)
    if (blog && !slugs.has(blog[1])) broken.push({ from: meta.slug, url })
    if (url.startsWith('/documents/')) assert.ok(existsSync(new URL('public' + url, root)), url)
  }
}
assert.deepEqual(broken, [], 'Broken article links in changed content')
const indexText = readFileSync(new URL('public/site-navigation/search-index.js', root), 'utf8')
const search = JSON.parse(indexText.replace(/^window.PRO_SEARCH_INDEX=/, '').trim().replace(/;$/, ''))
for (const slug of newSlugs) assert.ok(search.some(x => x.u.endsWith(`/blog/${slug}/`)))
for (const page of grades) assert.ok(search.some(x => x.u.endsWith(`/online/${page.slug}/`)))
console.log(JSON.stringify({ result: 'passed', schools: schools.length, newGradePages: grades.length, newArticles: newSlugs.length, refreshedArticles: refreshed.length, articleLinks: 'valid' }))
