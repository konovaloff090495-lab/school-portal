import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { createJiti } from '../../node_modules/jiti/lib/jiti.mjs'

const jiti = createJiti(import.meta.url)
const { explicitSchoolGrades } = await jiti.import('../../src/lib/school-grades.ts')
assert.deepEqual(explicitSchoolGrades('8–12'), [8, 9, 10, 11, 12])
assert.deepEqual(explicitSchoolGrades('с 8 лет'), [])
assert.deepEqual(explicitSchoolGrades('9–7'), [])
const { getSchoolLevels } = await jiti.import('../../src/lib/school-levels.ts')
assert.deepEqual(getSchoolLevels('8–12'), ['middle', 'high'])
const pages = JSON.parse(readFileSync('src/data/school-format-catalog-pages.json', 'utf8'))
const { getSchoolsByType } = await jiti.import('../../src/data/schools.ts')
for (const path of ['/shkoly/tipy/vechernie/9-klass/', '/shkoly/tipy/vechernie/posle-9-klassa/', '/shkoly/tipy/vechernie/starshie-klassy/']) {
  const p = pages.find(p => p.path === path)
  const selected = getSchoolsByType(p.type).filter(s => p.grades.every(g => explicitSchoolGrades(s.grades).includes(g)))
  assert.ok(selected.length > 0, path)
  assert.ok(selected.every(s => p.grades.every(g => explicitSchoolGrades(s.grades).includes(g))))
}

// A real two-page visit must retain its first entry and UTM; internal URLs cannot replace it.
const storage = new Map()
globalThis.sessionStorage = { getItem: k => storage.get(k) ?? null, setItem: (k, v) => storage.set(k, v) }
globalThis.window = { location: { origin: 'https://pro-schools.ru', pathname: '/shkoly/ekaterinburg/vechernie/', search: '?utm_source=yandex&utm_campaign=search', href: 'https://pro-schools.ru/shkoly/ekaterinburg/vechernie/?utm_source=yandex&utm_campaign=search' } }
globalThis.document = { referrer: 'https://yandex.ru/', cookie: '_ym_uid=1783964360209898384' }
const { rememberUtm, getLeadContext } = await jiti.import('../../src/lib/leadContext.ts')
rememberUtm()
window.location = { ...window.location, pathname: '/attestat-vzroslomu/', search: '?utm_source=internal', href: 'https://pro-schools.ru/attestat-vzroslomu/?utm_source=internal' }
document.referrer = 'https://pro-schools.ru/shkoly/ekaterinburg/vechernie/'
const context = getLeadContext()
assert.equal(context.landing_url, 'https://pro-schools.ru/shkoly/ekaterinburg/vechernie/')
assert.equal(context.page_url, window.location.href)
assert.equal(context.first_referrer, 'https://yandex.ru/')
assert.equal(context.utm.utm_source, 'yandex')
assert.equal(context.ym_client_id, '1783964360209898384')
storage.clear()
window.location.search = ''
rememberUtm()
window.location.search = '?utm_source=internal'
assert.deepEqual(getLeadContext().utm, {}, 'An organic entry must not become an internal tagged campaign')

const { rememberGrowthRoute, selectedGrowthRoute } = await jiti.import('../../src/lib/growth-tracking.ts')
rememberGrowthRoute('attestat-9')
assert.equal(selectedGrowthRoute(), 'attestat-9')
rememberGrowthRoute('email@example.invalid')
assert.equal(selectedGrowthRoute(), 'attestat-9', 'Reject values outside the route enum')
assert.equal(getLeadContext().selected_route, 'attestat-9')
assert.equal(getLeadContext().growth_release, 'leads-growth-20261026-recovery')

delete globalThis.window
delete globalThis.document
delete globalThis.sessionStorage

console.log('Passed: class coverage, first-entry attribution and UTM preservation')
