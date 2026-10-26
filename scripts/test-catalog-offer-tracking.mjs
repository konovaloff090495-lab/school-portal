import assert from 'node:assert/strict'
import fs from 'node:fs'
import { trackCatalogOffer } from '../src/lib/catalog-offer-tracking.ts'

const calls = []
globalThis.window = { ym: (...args) => calls.push(args) }
const expected = JSON.parse(fs.readFileSync(new URL('../docs/catalog-synergy/goals.json', import.meta.url), 'utf8'))
for (const kind of ['trial', 'attestat']) {
  for (const action of ['banner_click', 'form_view', 'form_start', 'cta_click']) {
    const before = calls.length
    trackCatalogOffer(kind, action, action === 'banner_click' ? undefined : 'top')
    assert.equal(calls.length, before + 1)
    assert.equal(calls.at(-1)[2], `catalog_${kind}_${action}`)
  }
  for (const placement of ['top', 'middle', 'bottom']) {
    const before = calls.length
    trackCatalogOffer(kind, 'lead_success', placement)
    assert.equal(calls.length, before + 2)
    assert.equal(calls.at(-2)[2], `catalog_${kind}_lead_success`)
    assert.equal(calls.at(-1)[2], `catalog_${kind}_lead_${placement}`)
  }
}
for (const [counter, action, event, params] of calls) {
  assert.equal(counter, expected.counter)
  assert.equal(action, 'reachGoal')
  assert.ok(expected.goals.some(goal => goal.event === event), `Unregistered goal: ${event}`)
  assert.deepEqual(Object.keys(params).sort(), params.placement ? ['offer', 'placement'] : ['offer'])
}
assert.deepEqual([...new Set(calls.map(call => call[2]))].sort(), expected.goals.map(goal => goal.event).sort())
window.ym = () => { throw new Error('Unavailable analytics') }
assert.doesNotThrow(() => trackCatalogOffer('trial', 'banner_click'))
assert.doesNotThrow(() => trackCatalogOffer('attestat', 'lead_success', 'bottom'))
delete globalThis.window
assert.doesNotThrow(() => trackCatalogOffer('trial', 'form_view', 'top'))
console.log('Catalog offer goals: registered event coverage, count semantics, fixed non-personal parameters and non-blocking analytics passed.')
