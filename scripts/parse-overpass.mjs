#!/usr/bin/env node
/**
 * parse-overpass.mjs — парсинг школ из OpenStreetMap (Overpass API).
 * Бесплатно, без API-ключей. Fallback для когда 2GIS API недоступен.
 *
 * Запуск:
 *   node scripts/parse-overpass.mjs                    # все failed города
 *   node scripts/parse-overpass.mjs --city=Ульяновск   # один город
 *   node scripts/parse-overpass.mjs --limit=5          # первые 5 городов
 */

import { readFileSync, writeFileSync } from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const __dirname  = path.dirname(fileURLToPath(import.meta.url))
const ROOT       = path.join(__dirname, '..')
const SCHOOLS_TS = path.join(ROOT, 'src', 'data', 'schools.ts')
const QUEUE_FILE = path.join(__dirname, 'city-queue.json')

const args = Object.fromEntries(
  process.argv.slice(2).filter(a => a.startsWith('--'))
    .map(a => { const [k, ...v] = a.slice(2).split('='); return [k, v.join('=') || true] })
)

const ONLY_CITY  = args.city || null
const LIMIT      = parseInt(args.limit ?? '0')

// Overpass mirrors — пробуем по очереди
const OVERPASS_MIRRORS = [
  'https://maps.mail.ru/osm/tools/overpass/api/interpreter',
  'https://overpass.kumi.systems/api/interpreter',
  'https://overpass-api.de/api/interpreter',
]

function sleep(ms) { return new Promise(r => setTimeout(r, ms)) }

// ─── Overpass query ───────────────────────────────────────────────────────────
async function fetchSchools(cityName) {
  const query = `
[out:json][timeout:90];
area["name"="${cityName}"]["place"~"city|town|suburb"]->.a;
(
  nwr["amenity"="school"](area.a);
);
out tags center;
`.trim()

  for (const mirror of OVERPASS_MIRRORS) {
    try {
      console.log(`  → Overpass: ${mirror.replace('https://', '').split('/')[0]}`)
      const res = await fetch(mirror, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
          'Accept': 'application/json',
          'User-Agent': 'pro-schools.ru/1.0 (admin@pro-schools.ru)',
        },
        body: `data=${encodeURIComponent(query)}`,
        signal: AbortSignal.timeout(120_000),
      })
      if (!res.ok) throw new Error(`HTTP ${res.status}`)
      const data = await res.json()
      return data.elements ?? []
    } catch (e) {
      console.log(`  ✗ ${e.message.slice(0, 60)}`)
      await sleep(2000)
    }
  }
  throw new Error('Все Overpass-зеркала недоступны')
}

// ─── Type detection from name ─────────────────────────────────────────────────
function detectType(name, tags = {}) {
  const n = name.toLowerCase()
  const op = (tags['operator:type'] || '').toLowerCase()

  if (/вечерн|открытая шк|сменная шк/.test(n)) return 'vechernie'
  if (/экстерн|семейн.*(шк|образо)|шк.*семейн/.test(n)) return 'eksternal'
  if (/кадет/.test(n)) return 'kadetskie'
  if (/коррекц|овз/.test(n) && /шк/.test(n)) return 'korrektsionnye'
  if (/международн/.test(n) && /шк/.test(n)) return 'mezhdunarodnie'
  if (/гимназ/.test(n)) return 'gimnazii'
  if (/лицей/.test(n)) {
    if (/универс|вуз|инсти|академи/.test(n)) return 'pri-vuzakh'
    return 'profilnye'
  }
  if (op === 'private' || /частн/.test(n)) return 'chastnie'
  if (/дистанцион|онлайн/.test(n)) return 'online'
  return 'gosudarstvennye'
}

// ─── Transliterate ────────────────────────────────────────────────────────────
function transliterate(s) {
  return s.toLowerCase().replace(/[а-яё]/g, c => ({
    а:'a',б:'b',в:'v',г:'g',д:'d',е:'e',ё:'e',ж:'zh',з:'z',и:'i',й:'y',
    к:'k',л:'l',м:'m',н:'n',о:'o',п:'p',р:'r',с:'s',т:'t',у:'u',
    ф:'f',х:'kh',ц:'ts',ч:'ch',ш:'sh',щ:'sch',ъ:'',ы:'y',ь:'',
    э:'e',ю:'yu',я:'ya',
  }[c] ?? c))
}

function makeSlug(name, citySlug) {
  return (transliterate(name) + '-' + citySlug)
    .replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 80)
}

// ─── TYPE_META ────────────────────────────────────────────────────────────────
const TYPE_META = {
  vechernie:       { label: 'Вечерняя школа',       grades: '9–11', price: 0,     features: ['Аттестат', 'Вечернее обучение', 'Для взрослых', 'Без возрастных ограничений', 'Гибкий график'] },
  eksternal:       { label: 'Экстернат',             grades: '1–11', price: 0,     features: ['Экстернат', 'Семейное обучение', 'Ускоренная программа', 'Аттестат', 'Гибкий график'] },
  gosudarstvennye: { label: 'Государственная школа', grades: '1–11', price: 0,     features: ['Бесплатно', 'Муниципальная', 'ФГОС', 'Аттестат', 'Продлёнка'] },
  chastnie:        { label: 'Частная школа',         grades: '1–11', price: 25000, features: ['Малые классы', 'Индивидуальный подход', 'Аттестат', 'Частная', 'Продлёнка'] },
  online:          { label: 'Онлайн-школа',          grades: '1–11', price: 0,     features: ['Дистанционно', 'ЕГЭ/ОГЭ', 'Гибкий график', 'Аттестат', 'Онлайн'] },
  'pri-vuzakh':    { label: 'Лицей при вузе',        grades: '8–11', price: 0,     features: ['При университете', 'Углублённые программы', 'Подготовка в вуз', 'Профильные классы', 'Аттестат'] },
  profilnye:       { label: 'Профильная школа',      grades: '7–11', price: 0,     features: ['Профильные классы', 'IT', 'Естественные науки', 'ЕГЭ', 'Аттестат'] },
  gimnazii:        { label: 'Гимназия',              grades: '1–11', price: 0,     features: ['Гуманитарный уклон', 'Углублённые языки', 'Аттестат', 'ФГОС', 'Олимпиады'] },
  korrektsionnye:  { label: 'Коррекционная школа',   grades: '1–9',  price: 0,     features: ['ОВЗ', 'Инклюзивное образование', 'Логопед', 'Специальные программы', 'Аттестат'] },
  kadetskie:       { label: 'Кадетский корпус',      grades: '5–11', price: 0,     features: ['Военно-патриотическое воспитание', 'Дисциплина', 'Физподготовка', 'Аттестат', 'Форма'] },
  mezhdunarodnie:  { label: 'Международная школа',   grades: '1–11', price: 60000, features: ['IB-программа', 'Cambridge', 'Английский язык', 'Международный аттестат', 'Двуязычное обучение'] },
  semejnye:        { label: 'Семейная школа',        grades: '1–11', price: 0,     features: ['Семейное образование', 'Малые классы', 'Индивидуальный подход', 'Аттестат', 'Гибкий график'] },
  domashnie:       { label: 'Домашнее обучение',     grades: '1–11', price: 0,     features: ['Домашнее обучение', 'Гибкий график', 'Аттестат', 'Индивидуальный подход', 'Онлайн'] },
}

// ─── BAD words — исключаем нерелевантные ─────────────────────────────────────
const BAD = [
  'автошкол', 'детский сад', 'ясли', 'детский центр',
  'музыкальн', 'танц', 'спортивн', 'художествен',
  'кафе', 'ресторан', 'клуб', 'магазин', 'аптека', 'банк',
  'парикмахер', 'бухгалтер', 'налог', 'юридич',
  'дом культуры', 'библиотека', 'почта', 'it-компани',
  'центр занятости', 'улица ',
]

function isBad(name) {
  const n = name.toLowerCase()
  return BAD.some(b => n.includes(b))
}

function isSchool(name) {
  const n = name.toLowerCase()
  return /школ|гимназ|лицей|кадет|экстерн/.test(n)
}

// ─── Description generator ────────────────────────────────────────────────────
function makeDescription(name, type, cityName) {
  const meta = TYPE_META[type] ?? TYPE_META.gosudarstvennye
  const shortDescs = {
    vechernie:       `Вечерняя школа для получения аттестата без отрыва от работы в ${cityName}.`,
    eksternal:       `Экстернат в ${cityName} — ускоренное обучение и семейное образование с аттестатом.`,
    gosudarstvennye: `Муниципальная общеобразовательная школа в ${cityName} — бесплатное образование по ФГОС.`,
    chastnie:        `Частная школа в ${cityName} — малые классы и индивидуальный подход к каждому ученику.`,
    online:          `Дистанционная школа в ${cityName} — обучение онлайн с официальным аттестатом.`,
    'pri-vuzakh':    `Лицей при вузе в ${cityName} — углублённые программы и подготовка к поступлению.`,
    profilnye:       `Профильная школа в ${cityName} — специализированные классы для подготовки к ЕГЭ.`,
    gimnazii:        `Гимназия в ${cityName} — углублённое гуманитарное образование и олимпиадные программы.`,
    korrektsionnye:  `Коррекционная школа в ${cityName} — специализированное образование для детей с ОВЗ.`,
    kadetskie:       `Кадетский корпус в ${cityName} — военно-патриотическое воспитание и дисциплина.`,
    mezhdunarodnie:  `Международная школа в ${cityName} — IB-программа и обучение на английском языке.`,
    semejnye:        `Семейная школа в ${cityName} — альтернативное образование с малыми группами.`,
    domashnie:       `Домашнее обучение в ${cityName} — гибкий формат с официальным аттестатом.`,
  }
  const fullDesc = `${name} — ${meta.label.toLowerCase()} в ${cityName}. Предоставляет качественное образование в соответствии с государственным стандартом ФГОС. Классы с ${meta.grades} класс. ${meta.price > 0 ? `Стоимость обучения от ${meta.price.toLocaleString('ru-RU')} ₽/мес.` : 'Образование предоставляется бесплатно.'} Подготовка к ОГЭ и ЕГЭ, аттестат государственного образца.`

  return {
    description:     shortDescs[type] ?? shortDescs.gosudarstvennye,
    fullDescription: fullDesc,
  }
}

// ─── Extract schools from Overpass elements ───────────────────────────────────
function extractSchools(elements, citySlug, cityName, existingSlugs) {
  const results = []
  const seenNames = new Set()

  for (const el of elements) {
    const tags = el.tags ?? {}
    const name = tags.name || tags['name:ru'] || ''
    if (!name || name.length < 3) continue
    if (isBad(name)) continue
    if (!isSchool(name)) continue

    const nameLower = name.toLowerCase().trim()
    if (seenNames.has(nameLower)) continue
    seenNames.add(nameLower)

    const type = detectType(name, tags)
    const slug = makeSlug(name, citySlug)
    if (existingSlugs.has(slug)) continue

    // Coordinates
    const lat = el.center?.lat ?? el.lat ?? null
    const lon = el.center?.lon ?? el.lon ?? null

    // Address
    const street = tags['addr:street'] || ''
    const house  = tags['addr:housenumber'] || ''
    const address = [street, house].filter(Boolean).join(', ')

    // Contact
    const phone   = tags.phone || tags['contact:phone'] || tags['phone:ru'] || ''
    const website = tags.website || tags['contact:website'] || tags['url'] || ''
    const email   = tags.email || tags['contact:email'] || ''

    const { description, fullDescription } = makeDescription(name, type, cityName)
    const meta = TYPE_META[type] ?? TYPE_META.gosudarstvennye

    const school = {
      slug,
      name,
      city: cityName,
      region: citySlug,
      type,
      address: address || `г. ${cityName}`,
      phone: phone || '',
      email: email || '',
      website: website || '',
      lat: lat ? parseFloat(lat.toFixed(6)) : null,
      lon: lon ? parseFloat(lon.toFixed(6)) : null,
      description,
      fullDescription,
      grades: meta.grades,
      price: meta.price || null,
      features: meta.features,
      rating: null,
      reviewCount: 0,
      _source: 'overpass',
    }

    results.push(school)
  }

  return results
}

// ─── Format school as TS block ────────────────────────────────────────────────
function formatSchool(s) {
  const esc = v => v ? v.replace(/'/g, "\\'") : ''
  const lines = [
    `  {`,
    `    slug: '${s.slug}',`,
    `    name: '${esc(s.name)}',`,
    `    city: '${esc(s.city)}',`,
    `    region: '${s.region}',`,
    `    type: '${s.type}',`,
    `    address: '${esc(s.address)}',`,
  ]
  if (s.phone)   lines.push(`    phone: '${esc(s.phone)}',`)
  if (s.email)   lines.push(`    email: '${esc(s.email)}',`)
  if (s.website) lines.push(`    website: '${esc(s.website)}',`)
  if (s.lat)     lines.push(`    lat: ${s.lat},`)
  if (s.lon)     lines.push(`    lon: ${s.lon},`)
  lines.push(
    `    description: '${esc(s.description)}',`,
    `    fullDescription: '${esc(s.fullDescription)}',`,
    `    grades: '${s.grades}',`,
  )
  if (s.price)   lines.push(`    price: ${s.price},`)
  lines.push(
    `    features: ${JSON.stringify(s.features)},`,
    `    rating: ${s.rating ?? 'null'},`,
    `    reviewCount: ${s.reviewCount ?? 0},`,
    `  },`,
  )
  return lines.join('\n')
}

// ─── Append to schools.ts ─────────────────────────────────────────────────────
const MARKER = '] as any[] as School[])'

function appendSchools(newSchools) {
  const src = readFileSync(SCHOOLS_TS, 'utf8')
  const markerIdx = src.lastIndexOf(MARKER)
  if (markerIdx === -1) throw new Error('Marker not found in schools.ts')

  const insertAt = markerIdx  // replace ']' with schools + ']'
  const blocks = newSchools.map(formatSchool).join('\n')
  const newSrc = src.slice(0, insertAt) + blocks + '\n' + src.slice(insertAt)
  writeFileSync(SCHOOLS_TS, newSrc, 'utf8')
}

// ─── Get existing slugs ───────────────────────────────────────────────────────
function getExistingSlugs() {
  const src = readFileSync(SCHOOLS_TS, 'utf8')
  const slugs = new Set()
  for (const m of src.matchAll(/slug:\s*'([^']+)'/g)) {
    slugs.add(m[1])
  }
  return slugs
}

// ─── Main ─────────────────────────────────────────────────────────────────────
async function main() {
  const queue = JSON.parse(readFileSync(QUEUE_FILE, 'utf8'))

  let targets = queue.filter(c => c.status === 'failed' || c.status === 'failed-overpass')
  if (ONLY_CITY) targets = targets.filter(c => c.city === ONLY_CITY || c.slug === ONLY_CITY)
  if (LIMIT > 0) targets = targets.slice(0, LIMIT)

  if (targets.length === 0) {
    console.log('✅ Нет failed городов для парсинга')
    return
  }

  console.log(`\n🌍 Overpass парсинг: ${targets.length} городов\n`)

  const existingSlugs = getExistingSlugs()
  console.log(`📚 Уже в базе: ${existingSlugs.size} школ\n`)

  let totalAdded = 0

  for (const entry of targets) {
    console.log(`\n[${targets.indexOf(entry) + 1}/${targets.length}] ${entry.city}`)

    try {
      const elements = await fetchSchools(entry.city)
      console.log(`  📦 Overpass вернул ${elements.length} элементов`)

      const schools = extractSchools(elements, entry.slug, entry.city, existingSlugs)
      console.log(`  🏫 Найдено школ: ${schools.length}`)

      if (schools.length > 0) {
        appendSchools(schools)
        for (const s of schools) existingSlugs.add(s.slug)
        totalAdded += schools.length
        console.log(`  ✅ Добавлено: ${schools.length}`)
      } else {
        console.log(`  ⚠️  Нет новых школ (все уже есть или город пуст в OSM)`)
      }

      // Update queue
      const idx = queue.findIndex(c => c.slug === entry.slug)
      queue[idx] = { ...entry, status: 'done', addedCount: schools.length, doneAt: new Date().toISOString(), _source: 'overpass' }
      writeFileSync(QUEUE_FILE, JSON.stringify(queue, null, 2))

    } catch (e) {
      console.log(`  ❌ ${e.message}`)
      const idx = queue.findIndex(c => c.slug === entry.slug)
      queue[idx] = { ...entry, status: 'failed-overpass', error: e.message.slice(0, 100) }
      writeFileSync(QUEUE_FILE, JSON.stringify(queue, null, 2))
    }

    await sleep(3000)  // уважаем Overpass
  }

  console.log(`\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`)
  console.log(`✅ Готово! Добавлено школ: ${totalAdded}`)
  console.log(`💾 Обновлён: src/data/schools.ts`)
  console.log(`\nДальше: git commit -am "add schools via overpass" && ./deploy.sh`)
}

main().catch(e => { console.error('❌', e); process.exit(1) })
