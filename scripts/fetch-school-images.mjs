/**
 * Fetches real school photos:
 * 1. og:image from school websites (where available)
 * 2. Curated Unsplash stock photos by school type as fallback
 */

import { createWriteStream, existsSync, mkdirSync } from 'fs'
import { pipeline } from 'stream/promises'
import path from 'path'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const OUT_DIR = path.join(__dirname, '../public/schools')

if (!existsSync(OUT_DIR)) mkdirSync(OUT_DIR, { recursive: true })

// Schools data — slug | website (from data/schools.ts)
const SCHOOLS = [
  // Moscow government
  { slug: 'gbou-shkola-179-moskva',         type: 'gov',     website: 'https://school179.ru' },
  { slug: 'gbou-shkola-57-moskva',          type: 'gov',     website: null },
  { slug: 'gbou-gimnazia-1543-moskva',      type: 'gov',     website: 'https://gym1543.ru' },
  { slug: 'gbou-litsei-1502-meh-moskva',    type: 'gov',     website: null },
  { slug: 'gbou-shkola-2086-moskva',        type: 'gov',     website: null },
  // Moscow private
  { slug: 'lomonosovskaya-shkola-moskva',   type: 'private', website: 'https://lomonosovschool.ru' },
  { slug: 'shkola-prezident-moskva',        type: 'private', website: 'https://president-school.ru' },
  { slug: 'chstnaya-shkola-zolotoe-sechenie-moskva', type: 'private', website: 'https://goldschool.ru' },
  { slug: 'abs-shkola-moskva',              type: 'private', website: 'https://abs-school.ru' },
  { slug: 'shkola-intellect-moskva',        type: 'private', website: null },
  // Moscow online
  { slug: 'onlain-shkola-foxford-moskva',   type: 'online',  website: 'https://foxford.ru' },
  { slug: 'onlain-shkola-skysmart-moskva',  type: 'online',  website: 'https://skysmart.ru' },
  { slug: 'onlain-shkola-sinergiya-moskva', type: 'online',  website: 'https://school.synergy.ru' },
  { slug: 'onlain-shkola-interneturok-moskva', type: 'online', website: 'https://interneturok.ru' },
  { slug: 'onlain-platforma-uchiru-moskva', type: 'online',  website: 'https://uchi.ru' },
  // Moscow evening
  { slug: 'vechernyaya-shkola-156-moskva',  type: 'evening', website: null },
  { slug: 'co-1865-vechernyaya-forma-moskva', type: 'evening', website: null },
  { slug: 'vechernyaya-shkola-baumanka-moskva', type: 'evening', website: null },
  { slug: 'vechernyaya-shkola-attestat-online-moskva', type: 'online', website: 'https://attestat.ru' },
  // Moscow external
  { slug: 'eksternal-foxford-moskva',       type: 'online',  website: 'https://foxford.ru/externat' },
  { slug: 'eksternal-rf-moskva',            type: 'external', website: 'https://externat.rf' },
  { slug: 'internet-shkola-extren-moskva',  type: 'online',  website: null },
  { slug: 'smartia-eksternal-moskva',       type: 'online',  website: 'https://smartia.ru' },
  // MO government
  { slug: 'gbou-shkola-1-himki-mo',         type: 'gov',     website: null },
  { slug: 'mou-litsei-podolsk-mo',          type: 'gov',     website: null },
  { slug: 'mbou-shkola-14-odintsovo-mo',    type: 'gov',     website: null },
  { slug: 'mbou-gimn-16-mytishchi-mo',      type: 'gov',     website: null },
  { slug: 'mbou-shkola-5-balashiha-mo',     type: 'gov',     website: null },
  // MO private
  { slug: 'chast-shkola-eidos-reutov-mo',   type: 'private', website: null },
  { slug: 'chast-shkola-skolkovo-odintsovo-mo', type: 'private', website: null },
  { slug: 'chast-shkola-rodnoy-kray-korolev-mo', type: 'private', website: null },
  { slug: 'chast-shkola-lider-dolgoprudny-mo', type: 'private', website: null },
  { slug: 'chast-shkola-solnechnaya-ruza-mo', type: 'private', website: null },
  // MO online
  { slug: 'onlain-shkola-internet-klass-mo', type: 'online', website: null },
  { slug: 'onlain-shkola-podolsk-repet-mo', type: 'online',  website: null },
  { slug: 'onlain-shkola-digital-himki-mo', type: 'online',  website: null },
  // MO evening
  { slug: 'vechernyaya-shkola-himki-mo',    type: 'evening', website: null },
  { slug: 'vechernyaya-shkola-podolsk-mo',  type: 'evening', website: null },
  { slug: 'vechernyaya-shkola-mytishchi-mo', type: 'evening', website: null },
  // MO external
  { slug: 'eksternal-centr-himki-mo',       type: 'external', website: null },
  { slug: 'eksternal-shkola-krasnogorsk-mo', type: 'external', website: null },
  { slug: 'eksternal-odintsovo-mo',         type: 'external', website: null },
  // Extra Moscow gov
  { slug: 'gbou-litsei-1580-baumanка-moskva', type: 'gov',   website: 'https://licey1580.ru' },
  { slug: 'gbou-gimnazia-45-moskva',        type: 'gov',     website: null },
  { slug: 'gbou-litsei-hse-moskva',         type: 'gov',     website: 'https://lyceum.hse.ru' },
  { slug: 'gbou-shkola-444-moskva',         type: 'gov',     website: null },
  { slug: 'gbou-litsei-2086-letovo-moskva', type: 'gov',     website: null },
  { slug: 'evropeyskaya-gimnazia-moskva',   type: 'private', website: 'https://eurogymnasium.ru' },
  { slug: 'shkola-letovo-moskva',           type: 'private', website: 'https://letovo.ru' },
  { slug: 'shkola-pokrovskiy-kvartal-moskva', type: 'private', website: null },
  { slug: 'angliiskaya-shkola-first-moskva', type: 'private', website: null },
  { slug: 'shkola-retra-moskva',            type: 'private', website: null },
  // Extra online
  { slug: 'onlain-shkola-algoritmika-moskva', type: 'online', website: 'https://algoritmika.org' },
  { slug: 'onlain-shkola-kodabra-moskva',   type: 'online',  website: 'https://kodabra.ru' },
  { slug: 'onlain-platforma-infourok-moskva', type: 'online', website: 'https://infourok.ru/school' },
  { slug: 'yandeks-uchebnik-onlain-moskva', type: 'online',  website: 'https://education.yandex.ru' },
  { slug: 'onlain-shkola-rostok-moskva',    type: 'online',  website: null },
  // Extra evening
  { slug: 'vechernyaya-shkola-72-moskva',   type: 'evening', website: null },
  { slug: 'vechernyaya-shkola-novye-vozmozhnosti-moskva', type: 'evening', website: null },
  { slug: 'vechernyaya-shkola-kuntsevo-moskva', type: 'evening', website: null },
  // Extra external
  { slug: 'centr-eksternata-veda-moskva',   type: 'external', website: null },
  { slug: 'shkola-eksternata-diplom-moskva', type: 'external', website: null },
  // Extra MO gov
  { slug: 'mbou-gimn-zheleznodorozhny-mo',  type: 'gov',     website: null },
  { slug: 'mbou-litsei-shchelkovo-mo',      type: 'gov',     website: null },
  { slug: 'mbou-shkola-4-lyubertsy-mo',     type: 'gov',     website: null },
  { slug: 'mbou-gimn-domodedovo-mo',        type: 'gov',     website: null },
  { slug: 'mbou-shkola-2-serpuhov-mo',      type: 'gov',     website: null },
  // Extra MO private
  { slug: 'chast-shkola-alyye-parusa-ramenskoe-mo', type: 'private', website: null },
  { slug: 'chast-shkola-formula-kolomna-mo', type: 'private', website: null },
  { slug: 'chast-shkola-dmitrov-mo',        type: 'private', website: null },
  { slug: 'chast-shkola-uspeh-klin-mo',     type: 'private', website: null },
  { slug: 'chast-shkola-znanie-noginsk-mo', type: 'private', website: null },
  // Extra MO online/evening/external
  { slug: 'onlain-repetitor-serpuhov-mo',   type: 'online',  website: null },
  { slug: 'onlain-shkola-kolomna-mo',       type: 'online',  website: null },
  { slug: 'onlain-shkola-programmirovanie-balashiha-mo', type: 'online', website: null },
  { slug: 'vechernyaya-shkola-serpuhov-mo', type: 'evening', website: null },
  { slug: 'vechernyaya-shkola-korolev-mo',  type: 'evening', website: null },
  { slug: 'vechernyaya-shkola-reutov-mo',   type: 'evening', website: null },
  { slug: 'vechernyaya-shkola-ramenskoe-mo', type: 'evening', website: null },
  { slug: 'vechernyaya-shkola-domodedovo-mo', type: 'evening', website: null },
  { slug: 'eksternal-lyubertsy-mo',         type: 'external', website: null },
  { slug: 'eksternal-balashiha-mo',         type: 'external', website: null },
  { slug: 'eksternal-noginsk-mo',           type: 'external', website: null },
  { slug: 'eksternal-korolev-mo',           type: 'external', website: null },
  { slug: 'eksternal-ramenskoe-mo',         type: 'external', website: null },
  // Novosibirsk gov
  { slug: 'mbou-licey-22-nadezhda-sibiri-novosibirsk', type: 'gov', website: 'https://licey22.nios.ru' },
  { slug: 'mbou-gimnazia-1-novosibirsk',    type: 'gov',     website: null },
  { slug: 'mbou-licey-9-novosibirsk',       type: 'gov',     website: null },
  { slug: 'mbou-shkola-54-inostrannye-yazyki-novosibirsk', type: 'gov', website: null },
  { slug: 'mbou-shkola-inform-tech-novosibirsk', type: 'gov', website: null },
  // Novosibirsk private
  { slug: 'chastnaya-shkola-erudit-novosibirsk', type: 'private', website: 'https://erudit-nsk.ru' },
  { slug: 'chastnaya-shkola-lomonosov-novosibirsk', type: 'private', website: null },
  { slug: 'chastnaya-shkola-akademiya-novosibirsk', type: 'private', website: null },
  { slug: 'chastnaya-shkola-umka-novosibirsk', type: 'private', website: null },
  // Novosibirsk online
  { slug: 'onlayn-shkola-sibirskaya-novosibirsk', type: 'online', website: 'https://sibonline.school' },
  { slug: 'onlayn-shkola-znanie-novosibirsk', type: 'online', website: null },
  { slug: 'onlayn-shkola-progress-nsk',     type: 'online',  website: null },
  // Novosibirsk evening
  { slug: 'mbou-vechernyaya-shkola-1-novosibirsk', type: 'evening', website: null },
  { slug: 'mbou-vechernyaya-shkola-3-novosibirsk', type: 'evening', website: null },
  { slug: 'centr-obrazovaniya-vzroslykh-novosibirsk', type: 'evening', website: null },
  // Novosibirsk external
  { slug: 'chou-shkola-ekstern-21vek-novosibirsk', type: 'external', website: 'https://extern21.ru' },
  { slug: 'sibirskiy-eksternat-centr-novosibirsk', type: 'external', website: null },
  { slug: 'centr-eksternal-oge-ege-novosibirsk', type: 'external', website: null },
]

// Curated Unsplash photo IDs — actual school/education building photos
// Multiple per type to add variety (assigned by hash of slug)
const FALLBACK_PHOTOS = {
  gov: [
    'photo-1580582932707-520aed937b7b', // school building exterior
    'photo-1523050854058-8df90110c9f1', // university building
    'photo-1562774053-701939374585', // school hallway
    'photo-1509062522246-3755977927d7', // school exterior Soviet style
    'photo-1544717305-2782549b5136', // modern school building
    'photo-1497633762265-9d179a990aa6', // education building
  ],
  private: [
    'photo-1571260899304-425eee4c7efc', // modern private school
    'photo-1580582932707-520aed937b7b', // school building
    'photo-1515187029135-18ee286d815b', // modern classroom
    'photo-1508850089801-5f5c14f18d1a', // private school building
    'photo-1592280771190-3e2e4d571952', // school campus
    'photo-1580582932707-520aed937b7b', // school exterior
  ],
  online: [
    'photo-1588702547923-7093a6c3ba33', // laptop studying
    'photo-1610484826967-09c5720778c7', // online learning
    'photo-1619468129361-605ebea04b44', // e-learning
    'photo-1593642632559-0c6d3fc62b89', // home studying laptop
    'photo-1486312338219-ce68d2c6f44d', // laptop education
    'photo-1498050108023-c5249f4df085', // computer learning
  ],
  evening: [
    'photo-1580582932707-520aed937b7b', // school building
    'photo-1523050854058-8df90110c9f1', // education building
    'photo-1562774053-701939374585', // hallway lights
    'photo-1509062522246-3755977927d7', // school building evening
    'photo-1544717305-2782549b5136', // building at dusk
    'photo-1497633762265-9d179a990aa6', // school evening
  ],
  external: [
    'photo-1456513080510-7bf3a84b82f8', // studying at desk
    'photo-1434030216411-0b793f4b4173', // student reading
    'photo-1501504905252-473c47e087f8', // home study
    'photo-1488190211105-8b0e65b80b4e', // books studying
    'photo-1606761568499-6d2451b23c66', // diploma studying
    'photo-1503676260728-1c00da094a0b', // book education
  ],
}

function slugHash(s) {
  let h = 5381
  for (let i = 0; i < s.length; i++) h = (h * 33) ^ s.charCodeAt(i)
  return Math.abs(h)
}

function getFallbackUrl(slug, type) {
  const photos = FALLBACK_PHOTOS[type] || FALLBACK_PHOTOS.gov
  const idx = slugHash(slug) % photos.length
  return `https://images.unsplash.com/${photos[idx]}?w=800&h=450&fit=crop&auto=format`
}

async function fetchOgImage(website) {
  if (!website) return null
  try {
    const controller = new AbortController()
    const timer = setTimeout(() => controller.abort(), 8000)
    const res = await fetch(website, {
      signal: controller.signal,
      headers: { 'User-Agent': 'Mozilla/5.0 (compatible; SchoolPortalBot/1.0)' },
    })
    clearTimeout(timer)
    if (!res.ok) return null
    const html = await res.text()
    // Extract og:image
    const match = html.match(/<meta[^>]+(?:property="og:image"|name="og:image")[^>]+content="([^"]+)"/i)
      || html.match(/<meta[^>]+content="([^"]+)"[^>]+(?:property="og:image"|name="og:image")/i)
    if (!match) return null
    const url = match[1]
    // Make absolute URL if needed
    if (url.startsWith('http')) return url
    if (url.startsWith('//')) return 'https:' + url
    const base = new URL(website)
    return base.origin + (url.startsWith('/') ? url : '/' + url)
  } catch {
    return null
  }
}

async function downloadImage(url, destPath) {
  if (existsSync(destPath)) return true
  try {
    const controller = new AbortController()
    const timer = setTimeout(() => controller.abort(), 15000)
    const res = await fetch(url, {
      signal: controller.signal,
      headers: { 'User-Agent': 'Mozilla/5.0 (compatible; SchoolPortalBot/1.0)' },
    })
    clearTimeout(timer)
    if (!res.ok || !res.body) return false
    const contentType = res.headers.get('content-type') || ''
    if (!contentType.startsWith('image/')) return false
    await pipeline(res.body, createWriteStream(destPath))
    return true
  } catch {
    return false
  }
}

async function processSchool(school) {
  const destPath = path.join(OUT_DIR, `${school.slug}.jpg`)
  if (existsSync(destPath)) {
    process.stdout.write(`  SKIP  ${school.slug}\n`)
    return { slug: school.slug, path: `/schools/${school.slug}.jpg`, source: 'cached' }
  }

  // Try og:image from website
  if (school.website) {
    const ogUrl = await fetchOgImage(school.website)
    if (ogUrl) {
      const ok = await downloadImage(ogUrl, destPath)
      if (ok) {
        process.stdout.write(`  OG    ${school.slug} ← ${ogUrl.substring(0, 60)}\n`)
        return { slug: school.slug, path: `/schools/${school.slug}.jpg`, source: 'og' }
      }
    }
  }

  // Fallback: Unsplash stock photo
  const unsplashUrl = getFallbackUrl(school.slug, school.type)
  const ok = await downloadImage(unsplashUrl, destPath)
  if (ok) {
    process.stdout.write(`  STOCK ${school.slug} (${school.type})\n`)
    return { slug: school.slug, path: `/schools/${school.slug}.jpg`, source: 'stock' }
  }

  process.stdout.write(`  FAIL  ${school.slug}\n`)
  return { slug: school.slug, path: null, source: 'failed' }
}

// Process in batches of 5 to avoid overwhelming servers
async function processBatch(schools) {
  const results = []
  for (let i = 0; i < schools.length; i += 5) {
    const batch = schools.slice(i, i + 5)
    const batchResults = await Promise.all(batch.map(processSchool))
    results.push(...batchResults)
  }
  return results
}

console.log(`Processing ${SCHOOLS.length} schools...\n`)
const results = await processBatch(SCHOOLS)

const succeeded = results.filter(r => r.path)
const failed = results.filter(r => !r.path)
const bySource = results.reduce((acc, r) => {
  acc[r.source] = (acc[r.source] || 0) + 1
  return acc
}, {})

console.log(`\nDone! ${succeeded.length}/${SCHOOLS.length} images downloaded`)
console.log('By source:', bySource)
if (failed.length) {
  console.log('Failed:', failed.map(r => r.slug))
}

// Output mapping as JSON for reference
const mapping = Object.fromEntries(succeeded.map(r => [r.slug, r.path]))
console.log('\nImage mapping (add to schools.ts):')
console.log(JSON.stringify(mapping, null, 2))
