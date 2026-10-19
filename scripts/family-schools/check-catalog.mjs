import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { createJiti } from '../../node_modules/jiti/lib/jiti.mjs'

const jiti = createJiti(import.meta.url, { interopDefault: true })
const data = await jiti.import('../../src/data/schools.ts')
const verified = JSON.parse(readFileSync(new URL('../../src/data/family-schools-verified.json', import.meta.url)))
const matches = JSON.parse(readFileSync(new URL('../../src/data/family-school-matches.json', import.meta.url)))
const redirects = JSON.parse(readFileSync(new URL('../removed-schools.json', import.meta.url)))
const family = data.getSchoolsByType('semejnye')
const ids = new Set()
const slugs = new Set()

for (const school of verified) {
  assert.ok(!ids.has(school.id), `Duplicate imported id: ${school.id}`)
  assert.ok(!slugs.has(school.slug), `Duplicate imported slug: ${school.slug}`)
  ids.add(school.id)
  slugs.add(school.slug)
  assert.match(school.slug, /^[a-z0-9-]+$/)
  if (!school.remoteOnly) assert.ok(data.regionSlugs.includes(school.region), `Missing city route: ${school.name}`)
  if (!school.remoteOnly) assert.ok(data.regionLabelsIn[school.region], `Missing city grammar: ${school.name}`)
  assert.equal(data.schools.filter(s => s.slug === school.slug).length, 1, school.slug)
  assert.ok(family.some(s => s.slug === school.slug), `School absent from family catalog: ${school.name}`)
  assert.ok(!redirects[school.slug], `Live school redirects away: ${school.slug}`)
  assert.ok(school.website?.startsWith('https://') || school.website?.startsWith('http://'), school.slug)
  assert.equal(school.rating, null, `Unsupported rating on newly verified school: ${school.slug}`)
  assert.equal(school.reviewCount, 0)
  assert.equal(school.photoCount, 0)
  assert.equal(school.priceFrom, undefined)
  if (school.remoteOnly) {
    assert.equal(school.region, 'russia-online')
    assert.equal(school.address, '')
    assert.equal(school.type, 'online')
    assert.ok(!data.regionSlugs.includes(school.region))
  }
  if (school.region === 'moskovskaya-oblast') {
    assert.ok(Object.values(data.moCityLabels).includes(school.city), `MO city absent from routes: ${school.city}`)
  }
}

for (const slug of matches) {
  const school = data.getSchoolBySlug(slug)
  assert.ok(school && data.schoolMatchesType(school, 'semejnye'), `Family alias lost: ${slug}`)
}
assert.ok(!data.getSchoolBySlug('semejnaya-shkola-rostok-moskva'), 'Generated seed restored')
assert.ok(redirects['semejnaya-shkola-rostok-moskva'], 'Retired seed link has no redirect')
assert.equal(family.filter(s => s.city === 'Дмитров').length, 5)
assert.equal(family.filter(s => s.city === 'Рыбное').length, 1)
assert.equal(family.filter(s => s.city === 'Зеленоград').length, 3)
const { getSchoolLevels } = await jiti.import('../../src/lib/school-levels.ts')
assert.deepEqual(getSchoolLevels(''), [])
assert.deepEqual(getSchoolLevels('Уточняйте классы'), [])
assert.deepEqual(getSchoolLevels('Школьники 6–14 лет'), [])
assert.deepEqual(getSchoolLevels('0'), [])
assert.deepEqual(getSchoolLevels('1'), ['elementary'])
assert.deepEqual(getSchoolLevels('5–9'), ['middle'])
assert.deepEqual(getSchoolLevels('1–4, 6'), ['elementary', 'middle'])
assert.deepEqual(getSchoolLevels('Начальная школа'), ['elementary'])
const klimovsk = data.getSchoolsByMoCity('Климовск').filter(s => data.schoolMatchesType(s, 'semejnye'))
assert.equal(klimovsk.length, 1)
assert.equal(klimovsk[0].slug, 'semejnaya-shkola-lyumos-podolsk')
assert.equal(klimovsk[0].city, 'Подольск')
assert.ok(family.some(s => s.city === 'Московский' && s.region === 'moskva'))
assert.ok(family.some(s => s.city === 'Троицк' && s.region === 'moskva'))
console.log(`Family catalog OK: ${family.length} schools, ${verified.length} verified imports, ${matches.length} secondary types, ${new Set(family.filter(s => !s.remoteOnly).map(s => s.city)).size} physical cities`)
