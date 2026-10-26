import assert from 'node:assert/strict'
import { readFileSync, mkdtempSync, rmSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
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

// Mock the transport: no requests, emails or CRM test leads leave this process.
const nativeFetch = globalThis.fetch
let received
globalThis.fetch = async (_url, options) => {
  received = JSON.parse(options.body).variables
  return Response.json({ data: { sendLead: { success: true, lead: { id: 'test-crm-id' } } } })
}
const { sendLeadToSynergy } = await jiti.import('../../src/lib/synergy.ts')
const input = { name: 'Test', phone: '+79001234568', formTitle: 'Evening test', formId: 'evening-v1', product: 'attestat-online', pageUrl: 'https://pro-schools.ru/attestat-vzroslomu/?goal=9', landingUrl: context.landing_url, firstReferrer: context.first_referrer, personalDataAgree: true, marketingAgree: false }
assert.equal((await sendLeadToSynergy(input)).ok, true)
assert.equal(received.utmData.utm_source, 'gerasimov_lav')
assert.equal(received.utmData.utm_content, '/attestat-vzroslomu/')
assert.equal(received.customAttributes.landing_url, context.landing_url)
assert.equal(received.customAttributes.form_id, 'evening-v1')
await sendLeadToSynergy({ ...input, utm: { utm_source: 'yandex', utm_content: 'visitor-content' } })
assert.equal(received.utmData.utm_content, 'visitor-content')
assert.equal(received.customAttributes.original_utm.utm_source, 'yandex')
globalThis.fetch = nativeFetch

const temp = mkdtempSync(join(tmpdir(), 'ps-lead-check-'))
process.env.LEAD_JOURNAL_PATH = join(temp, 'journal.jsonl')
try {
  const { recordLeadSubmission } = await jiti.import('../../src/lib/lead-journal.ts')
  await recordLeadSubmission({ page_url: input.pageUrl, landing_url: input.landingUrl, form_id: input.formId }, { status: 'accepted', id: 'test-crm-id' })
  const entry = JSON.parse(readFileSync(process.env.LEAD_JOURNAL_PATH, 'utf8').trim())
  assert.equal(entry.crm.id, 'test-crm-id')
  assert.equal(entry.landing_url, undefined, 'Receipt journal must not retain visitor data')
} finally { rmSync(temp, { recursive: true, force: true }) }
console.log('Passed: class coverage, first-entry attribution, UTM preservation, CRM mapping and private receipt')
