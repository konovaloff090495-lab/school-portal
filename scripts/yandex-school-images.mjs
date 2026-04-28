#!/usr/bin/env node
/**
 * Загрузка фото школ
 *
 * Стратегия (3 уровня):
 *   1. 2GIS Catalog API   — ищет реальное фото организации (нужен ключ)
 *   2. Яндекс Places API  — альтернатива 2GIS (нужен ключ «Поиск по организациям»)
 *   3. Loremflickr        — красивые тематические фото с Flickr, без ключа
 *
 * Запуск (ключ необязателен — без него используется loremflickr):
 *   node scripts/yandex-school-images.mjs --only-missing
 *   TWOGIS_API_KEY=ваш_ключ node scripts/yandex-school-images.mjs --only-missing
 */

import { existsSync, mkdirSync, readFileSync, writeFileSync, createWriteStream } from 'fs'
import { pipeline } from 'stream/promises'
import path from 'path'
import { fileURLToPath } from 'url'

const __dirname  = path.dirname(fileURLToPath(import.meta.url))
const ROOT       = path.join(__dirname, '..')
const PUBLIC_DIR = path.join(ROOT, 'public', 'schools')
const SCHOOLS_TS = path.join(ROOT, 'src', 'data', 'schools.ts')
const PROGRESS_F = path.join(ROOT, '.img-progress.json')

const TWOGIS_KEY   = process.env.TWOGIS_API_KEY
const YANDEX_KEY   = process.env.YANDEX_API_KEY
const ONLY_MISSING = process.argv.includes('--only-missing')
const DELAY_MS     = 400

if (!existsSync(PUBLIC_DIR)) mkdirSync(PUBLIC_DIR, { recursive: true })

// ─── Ключевые слова для loremflickr по типу школы ────────────────────────────
const typeKeywords = {
  gosudarstvennye: 'school,building,russia,education',
  chastnie:        'private,school,building,modern',
  online:          'education,technology,learning,digital',
  vechernie:       'school,evening,building,lights',
  eksternal:       'school,library,education,books',
  semejnye:        'school,family,classroom,children',
  domashnie:       'home,education,learning,cozy',
  'pri-vuzakh':    'university,campus,building,architecture',
  profilnye:       'school,science,laboratory,education',
  gimnazii:        'gymnasium,school,classical,building',
}

// ─── Парсинг schools.ts ──────────────────────────────────────────────────────
function parseSchools(filePath) {
  const content = readFileSync(filePath, 'utf-8')
  const schools = []
  const blocks  = content.split(/\n  \{/)

  for (const block of blocks) {
    const slug    = block.match(/\bslug:\s*['"]([^'"]+)['"]/)?.[1]
    const name    = block.match(/\bname:\s*['"]([^'"]+)['"]/)?.[1]
    const city    = block.match(/\bcity:\s*['"]([^'"]+)['"]/)?.[1]
    const type    = block.match(/\btype:\s*['"]([^'"]+)['"]/)?.[1]
    const address = block.match(/\baddress:\s*['"]([^'"]+)['"]/)?.[1]
    if (slug && name && city) {
      schools.push({ slug, name, city, type: type ?? 'gosudarstvennye', address: address ?? '' })
    }
  }
  return schools
}

// ─── Прогресс ────────────────────────────────────────────────────────────────
let progress = {}
if (existsSync(PROGRESS_F)) {
  try { progress = JSON.parse(readFileSync(PROGRESS_F, 'utf-8')) } catch {}
}
function saveProgress() {
  writeFileSync(PROGRESS_F, JSON.stringify(progress, null, 2))
}
function sleep(ms) { return new Promise(r => setTimeout(r, ms)) }

// ─── 2GIS Search API ─────────────────────────────────────────────────────────
async function search2GIS(name, city) {
  const params = new URLSearchParams({
    q:      `${name} ${city}`,
    type:   'branch',
    fields: 'items.photos,items.name_ex,items.address',
    page_size: '3',
    key:    TWOGIS_KEY,
  })

  const res = await fetch(`https://catalog.api.2gis.com/3.0/items?${params}`, {
    headers: { 'User-Agent': 'SchoolPortalBot/1.0' },
    signal:  AbortSignal.timeout(10000),
  })

  if (res.status === 403 || res.status === 401) throw new Error('INVALID_KEY_2GIS')
  if (res.status === 429) throw new Error('RATE_LIMIT')
  if (!res.ok) throw new Error(`HTTP_${res.status}`)

  const data = await res.json()

  for (const item of data.result?.items ?? []) {
    const photos = item.photos?.items
    if (Array.isArray(photos) && photos.length > 0) {
      const photo = photos[0]
      return photo.url ?? photo.preview_url ?? null
    }
  }
  return null
}

// ─── Яндекс Places API ───────────────────────────────────────────────────────
async function searchYandex(name, city) {
  const params = new URLSearchParams({
    text:    `${name} ${city}`,
    lang:    'ru_RU',
    type:    'biz',
    results: '3',
    apikey:  YANDEX_KEY,
  })

  const res = await fetch(`https://search-maps.yandex.ru/v1/?${params}`, {
    headers: { 'User-Agent': 'SchoolPortalBot/1.0' },
    signal:  AbortSignal.timeout(10000),
  })

  if (res.status === 403) throw new Error('INVALID_KEY_YANDEX')
  if (res.status === 429) throw new Error('RATE_LIMIT')
  if (!res.ok) throw new Error(`HTTP_${res.status}`)

  const data = await res.json()

  for (const feature of data.features ?? []) {
    const photos = feature.properties?.CompanyMetaData?.Photos
    if (Array.isArray(photos) && photos.length > 0) {
      const p = photos[0]
      return p.urlTemplate?.replace('%size%', 'XXL') ?? p.url ?? null
    }
  }
  return null
}

// ─── Loremflickr (без ключа) ──────────────────────────────────────────────────
// Каждый запрос с уникальным lock= возвращает стабильно одно и то же фото,
// но разные lock дают разные фото — идеально для пула уникальных изображений.
let flickrCounter = Date.now()
function getLoremflickrUrl(type) {
  const keywords = typeKeywords[type] ?? 'school,building,education'
  const lock = (flickrCounter++) % 100000   // уникальный номер → уникальное фото
  return `https://loremflickr.com/800/450/${keywords}?lock=${lock}`
}

// ─── Скачивание ───────────────────────────────────────────────────────────────
async function downloadImage(url, destPath) {
  const res = await fetch(url, {
    headers: { 'User-Agent': 'SchoolPortalBot/1.0' },
    signal:  AbortSignal.timeout(20000),
    redirect: 'follow',
  })
  if (!res.ok) throw new Error(`Download HTTP ${res.status}`)

  const ct = res.headers.get('content-type') ?? ''
  if (!ct.startsWith('image/')) throw new Error(`Not image: ${ct}`)

  await pipeline(res.body, createWriteStream(destPath))
}

// ─── Основной цикл ───────────────────────────────────────────────────────────
const allSchools = parseSchools(SCHOOLS_TS)
const toProcess  = ONLY_MISSING
  ? allSchools.filter(s => !existsSync(path.join(PUBLIC_DIR, `${s.slug}.jpg`)))
  : allSchools

const mode =
  TWOGIS_KEY  ? '2GIS → loremflickr fallback' :
  YANDEX_KEY  ? 'Яндекс → loremflickr fallback' :
                'loremflickr (Flickr, без ключа)'

const stats = { found: 0, flickr: 0, skipped: 0, error: 0 }

console.log(`
📸 Загрузка фото школ
   Режим             : ${mode}
   Всего школ в базе : ${allSchools.length}
   К обработке       : ${toProcess.length}${ONLY_MISSING ? ' (только отсутствующие)' : ''}
   Задержка          : ${DELAY_MS}ms
   Примерное время   : ~${Math.ceil(toProcess.length * DELAY_MS / 60000)} мин
`)

for (let i = 0; i < toProcess.length; i++) {
  const { slug, name, city, type } = toProcess[i]
  const destPath = path.join(PUBLIC_DIR, `${slug}.jpg`)
  const n        = `[${String(i + 1).padStart(String(toProcess.length).length)}/${toProcess.length}]`

  if (existsSync(destPath)) {
    console.log(`${n} ✅ уже есть  ${slug}`)
    stats.skipped++
    continue
  }

  process.stdout.write(`${n} 🔍 ${name.slice(0, 38).padEnd(38)} `)

  try {
    let photoUrl  = null
    let source    = ''

    // 1. Пробуем 2GIS / Яндекс (если есть ключ)
    if (TWOGIS_KEY) {
      photoUrl = await search2GIS(name, city)
      if (photoUrl) source = '2GIS'
    } else if (YANDEX_KEY) {
      photoUrl = await searchYandex(name, city)
      if (photoUrl) source = 'Яндекс'
    }

    // 2. Fallback: loremflickr
    if (!photoUrl) {
      photoUrl = getLoremflickrUrl(type)
      source   = 'flickr'
    }

    await downloadImage(photoUrl, destPath)

    if (source === 'flickr') {
      console.log('🌄 flickr')
      stats.flickr++
    } else {
      console.log(`✅ ${source}`)
      stats.found++
    }
    progress[slug] = 'done'
    saveProgress()

  } catch (err) {
    if (err.message === 'INVALID_KEY_2GIS') {
      console.error('\n\n❌  Неверный 2GIS ключ. Проверьте TWOGIS_API_KEY.\n')
      process.exit(1)
    }
    if (err.message === 'INVALID_KEY_YANDEX') {
      console.error('\n\n❌  Неверный Яндекс ключ.\n')
      process.exit(1)
    }
    if (err.message === 'RATE_LIMIT') {
      console.log('\n⏳ Лимит, пауза 60 сек...')
      await sleep(60000)
      i--
      continue
    }
    console.log(`❌ ${err.message}`)
    stats.error++

    // При ошибке скачивания flickr — попробуем другой lock
    if (err.message.startsWith('Download') || err.message.startsWith('Not image')) {
      flickrCounter += 1000  // смещаем пул
    }
  }

  await sleep(DELAY_MS)
}

console.log(`
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
📊 Итог:
   ✅  Скачано (реальные) : ${stats.found}
   🌄  Скачано (flickr)   : ${stats.flickr}
   ✅  Уже было           : ${stats.skipped}
   ❌  Ошибки             : ${stats.error}
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
`)
