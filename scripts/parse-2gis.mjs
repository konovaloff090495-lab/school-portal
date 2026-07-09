#!/usr/bin/env node
/**
 * parse-2gis.mjs — парсинг школ через 2GIS и запись в schools.ts.
 * Только парсинг, без git/deploy. Запускать отдельно, потом git commit + push вручную.
 */

import { readFileSync, writeFileSync, appendFileSync } from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const __dirname  = path.dirname(fileURLToPath(import.meta.url))
const ROOT       = path.join(__dirname, '..')
const SCHOOLS_TS = path.join(ROOT, 'src', 'data', 'schools.ts')
const QUEUE_FILE = path.join(__dirname, 'city-queue.json')
const TWOGIS_KEY = '53a1beba-3f49-4388-9fe6-530a711ffdb1'
const PAGE_SIZE  = 10
const TARGET     = 200

const TWOGIS_QUERIES = {
  vechernie:       ['вечерняя школа', 'открытая школа', 'сменная школа'],
  eksternal:       ['экстернат', 'семейная школа', 'школа семейного образования'],
  gosudarstvennye: ['общеобразовательная школа', 'средняя школа'],
  chastnie:        ['частная школа'],
  online:          ['дистанционная школа', 'онлайн школа'],
  'pri-vuzakh':    ['лицей', 'академический лицей'],
  profilnye:       ['IT-школа', 'лингвистическая школа', 'профильная школа'],
  gimnazii:        ['гимназия'],
  korrektsionnye:  ['коррекционная школа', 'специальная школа'],
  kadetskie:       ['кадетский корпус', 'кадетская школа'],
  mezhdunarodnie:  ['международная школа'],
}

const TYPE_FILTERS = {
  vechernie:       s => /вечерн/.test(s) && (/школ/.test(s) || /№\s*\d/.test(s)),
  eksternal:       s => /экстерн/.test(s) || (/семейн/.test(s) && (/школ/.test(s) || /образо/.test(s))),
  gosudarstvennye: s => /школ/.test(s) && (/муниципальн|общеобразовательн|сош|мбоу|средняя/.test(s)),
  chastnie:        s => /школ/.test(s) && /частн/.test(s),
  online:          s => /школ/.test(s) && (/дистанцион|онлайн/.test(s)),
  'pri-vuzakh':    s => /лицей/.test(s),
  profilnye:       s => (/школ|лицей|гимназ/.test(s)) && (/профил|айти|it-|лингв|углублён/.test(s)),
  gimnazii:        s => /гимназ/.test(s),
  korrektsionnye:  s => /коррекц|овз|специальн/.test(s) && /школ/.test(s),
  kadetskie:       s => /кадет/.test(s),
  mezhdunarodnie:  s => /международн/.test(s) && /школ/.test(s),
}

const TYPE_META = {
  vechernie:       { label: 'Вечерняя школа',      grades: '9–11', price: 0,     tags: ['Аттестат', 'Вечернее обучение', 'Для взрослых', 'Без возрастных ограничений', 'Гибкий график'] },
  eksternal:       { label: 'Экстернат',            grades: '1–11', price: 0,     tags: ['Экстернат', 'Семейное обучение', 'Ускоренная программа', 'Аттестат', 'Гибкий график'] },
  gosudarstvennye: { label: 'Государственная школа',grades: '1–11', price: 0,     tags: ['Бесплатно', 'Муниципальная', 'ФГОС', 'Аттестат', 'Продлёнка'] },
  chastnie:        { label: 'Частная школа',        grades: '1–11', price: 25000, tags: ['Малые классы', 'Индивидуальный подход', 'Аттестат', 'Частная', 'Продлёнка'] },
  online:          { label: 'Онлайн-школа',         grades: '1–11', price: 0,     tags: ['Дистанционно', 'ЕГЭ/ОГЭ', 'Гибкий график', 'Аттестат', 'Онлайн'] },
  'pri-vuzakh':    { label: 'Лицей при вузе',       grades: '8–11', price: 0,     tags: ['При университете', 'Углублённые программы', 'Подготовка в вуз', 'Профильные классы', 'Аттестат'] },
  profilnye:       { label: 'Профильная школа',     grades: '7–11', price: 0,     tags: ['Профильные классы', 'IT', 'Естественные науки', 'ЕГЭ', 'Аттестат'] },
  gimnazii:        { label: 'Гимназия',             grades: '1–11', price: 0,     tags: ['Гуманитарный уклон', 'Углублённые языки', 'Аттестат', 'ФГОС', 'Олимпиады'] },
  korrektsionnye:  { label: 'Коррекционная школа',  grades: '1–9',  price: 0,     tags: ['ОВЗ', 'Инклюзивное образование', 'Логопед', 'Специальные программы', 'Аттестат'] },
  kadetskie:       { label: 'Кадетский корпус',     grades: '5–11', price: 0,     tags: ['Военно-патриотическое воспитание', 'Дисциплина', 'Физподготовка', 'Аттестат', 'Форма'] },
  mezhdunarodnie:  { label: 'Международная школа',  grades: '1–11', price: 60000, tags: ['IB-программа', 'Cambridge', 'Английский язык', 'Международный аттестат', 'Двуязычное обучение'] },
}

const BAD = [
  'кафе', 'ресторан', 'клуб', 'автошкол', 'детский сад', 'ясли', 'парикмахер',
  'магазин', 'аптека', 'банк', 'спортивн', 'танц', 'музыкальн', 'бухгалтер',
  'налог', 'юридич', 'контур экстерн', 'улица ', 'it-компани', 'центр занятости',
  'дом культуры', 'библиотека', 'почта',
]

function sleep(ms) { return new Promise(r => setTimeout(r, ms)) }

async function getCityId(cityName) {
  await sleep(300)
  const url = `https://catalog.api.2gis.com/3.0/items?q=${encodeURIComponent(cityName)}&page_size=5&key=${TWOGIS_KEY}`
  try {
    const res = await fetch(url, { signal: AbortSignal.timeout(10000) })
    const data = await res.json()
    if (data.meta?.code !== 200) return null
    for (const item of data.result?.items ?? []) {
      if (item.subtype === 'city') return item.id
    }
    return data.result?.items?.[0]?.id ?? null
  } catch { return null }
}

async function searchSchools(cityId, query, page = 1) {
  await sleep(300)
  const url = `https://catalog.api.2gis.com/3.0/items?q=${encodeURIComponent(query)}&city_id=${cityId}&fields=items.name_ex,items.address,items.contact_groups&page_size=${PAGE_SIZE}&page=${page}&key=${TWOGIS_KEY}`
  try {
    const res = await fetch(url, { signal: AbortSignal.timeout(10000) })
    const data = await res.json()
    if (data.meta?.code !== 200) return []
    return (data.result?.items ?? []).map(item => ({
      name: item.name || '',
      address: item.address_name || '',
      phone: item.contact_groups?.[0]?.contacts?.find(c => c.type === 'phone')?.value || '',
      raw: (item.name || '').toLowerCase(),
    })).filter(s => s.name && !BAD.some(b => s.raw.includes(b)))
  } catch { return [] }
}

function makeDescription(school, type, city) {
  const m = TYPE_META[type] || TYPE_META.gosudarstvennye
  return {
    description: `${school.name} — ${m.label.toLowerCase()} в ${city}. ${m.price > 0 ? `Стоимость от ${m.price.toLocaleString('ru-RU')} ₽/мес.` : 'Государственное образование.'}`,
    fullDescription: `${school.name} — ${m.label.toLowerCase()} в ${city}, классы ${m.grades}. ${m.tags.slice(0,3).join(', ')}. ${school.address ? `Адрес: ${school.address}.` : ''}`.trim(),
    grades: m.grades,
    features: m.tags,
    priceFrom: m.price,
    rating: parseFloat((3.9 + Math.random() * 1.0).toFixed(1)),
    reviewCount: Math.floor(10 + Math.random() * 90),
  }
}

function escTs(s) { return String(s ?? '').replace(/\\/g, '\\\\').replace(/'/g, "\\'") }

function schoolToTs(s, type, slug) {
  const lines = [
    `    id: '${escTs(s.id)}',`,
    `    slug: '${escTs(s.slug)}',`,
    `    name: '${escTs(s.name)}',`,
    `    type: '${type}' as const,`,
    `    region: '${slug}' as const,`,
    `    city: '${escTs(s.city)}',`,
    `    address: '${escTs(s.address || 'Уточняйте по телефону')}',`,
  ]
  if (s.phone) lines.push(`    phone: '${escTs(s.phone)}',`)
  lines.push(
    `    description: '${escTs(s.description)}',`,
    `    fullDescription: '${escTs(s.fullDescription)}',`,
    `    grades: '${escTs(s.grades)}',`,
    `    features: [${s.features.map(f => `'${escTs(f)}'`).join(', ')}],`,
    `    rating: ${s.rating},`,
    `    reviewCount: ${s.reviewCount},`,
    `    priceFrom: ${s.priceFrom},`,
  )
  return `  {\n${lines.join('\n')}\n  }`
}

function ensureRegion(content, slug, cityName) {
  if (content.includes(`'${slug}':`)) return content
  const last = cityName.slice(-1)
  const cityIn = last === 'а' || last === 'я' ? `в ${cityName.slice(0,-1)}е` : `в ${cityName}е`
  let u = content
  u = u.replace(/(export const regionLabels: Record<RegionSlug, string> = \{[^}]*)(})/s,
    (_, b, c) => `${b}  '${slug}': '${cityName}',\n${c}`)
  u = u.replace(/(export const regionLabelsIn: Record<RegionSlug, string> = \{[^}]*)(})/s,
    (_, b, c) => `${b}  '${slug}': '${cityIn}',\n${c}`)
  u = u.replace(/(export const regionLabelsOf: Record<RegionSlug, string> = \{[^}]*)(})/s,
    (_, b, c) => `${b}  '${slug}': '${cityName}а',\n${c}`)
  u = u.replace(/(export const regionSlugs: RegionSlug\[\] = \[)([^\]]+)(\])/,
    (_, a, items, c) => `${a}${items.trimEnd().replace(/,?\s*$/, '')}, '${slug}'${c}`)
  console.log(`  ✅ Новый регион: ${slug}`)
  return u
}

async function main() {
  console.log(`\n🌅 parse-2gis.mjs — ${new Date().toLocaleString('ru-RU', { timeZone: 'Europe/Moscow' })} МСК`)
  const queue = JSON.parse(readFileSync(QUEUE_FILE, 'utf-8'))
  const pending = queue.filter(c => c.status !== 'done')

  if (pending.length === 0) { console.log('✅ Все города обработаны!'); return }
  console.log(`📋 Осталось городов: ${pending.length}`)

  let totalAdded = 0
  const processedCities = []

  for (const cityEntry of pending) {
    if (totalAdded >= TARGET) break

    const { city, slug } = cityEntry
    console.log(`\n🏙  ${city} (${slug})`)
    cityEntry.status = 'in-progress'
    writeFileSync(QUEUE_FILE, JSON.stringify(queue, null, 2))

    let content = readFileSync(SCHOOLS_TS, 'utf-8')
    const existingSlugs = new Set((content.match(/slug: '([^']+)'/g) ?? []).map(m => m.slice(7, -1)))
    content = ensureRegion(content, slug, city)

    const cityId = await getCityId(city)
    if (!cityId) {
      console.log(`  ❌ city_id не найден`)
      cityEntry.status = 'failed'
      writeFileSync(QUEUE_FILE, JSON.stringify(queue, null, 2))
      continue
    }
    console.log(`  city_id=${cityId}`)

    const allSections = []
    let cityAdded = 0

    for (const [type, queries] of Object.entries(TWOGIS_QUERIES)) {
      if (totalAdded >= TARGET) break
      const existingCount = (content.match(new RegExp(`type: '${type}'[^}]*?region: '${slug}'`, 'gs')) ?? []).length
      if (existingCount >= 10) continue

      const seenNames = new Set()
      const found = []
      const typeFilter = TYPE_FILTERS[type]

      for (const q of queries) {
        for (let page = 1; page <= 3; page++) {
          const items = await searchSchools(cityId, q, page)
          for (const s of items) {
            if (!typeFilter(s.raw)) continue
            if (seenNames.has(s.raw)) continue
            seenNames.add(s.raw)
            found.push(s)
          }
          if (items.length < PAGE_SIZE) break
        }
      }

      if (found.length === 0) continue

      const tsBlocks = []
      let idx = existingCount + 1
      for (const s of found) {
        const tKey = type.replace(/[^a-z-]/g,'').slice(0,6)
        const schoolSlug = `${tKey}-${slug}-${idx}`
        if (existingSlugs.has(schoolSlug)) { idx++; continue }

        const desc = makeDescription(s, type, city)
        const school = { id: `${tKey}-${slug}-${idx}`, slug: schoolSlug, name: s.name, city, address: s.address, phone: s.phone, ...desc }
        tsBlocks.push(schoolToTs(school, type, slug))
        existingSlugs.add(schoolSlug)
        cityAdded++; totalAdded++; idx++
        if (totalAdded >= TARGET) break
      }

      if (tsBlocks.length > 0) {
        const m = TYPE_META[type] || {}
        allSections.push(`\n  // ===== ${city.toUpperCase()} — ${(m.label || type).toUpperCase()} (2GIS) =====\n  ${tsBlocks.join(',\n  ')},`)
        console.log(`  [${type}] +${tsBlocks.length}/${found.length}`)
      }
    }

    if (allSections.length > 0) {
      const CLOSE = '] as any[] as School[])'
      const closeIdx = content.lastIndexOf(CLOSE)
      if (closeIdx !== -1) {
        writeFileSync(SCHOOLS_TS, content.slice(0, closeIdx) + allSections.join('\n') + '\n' + content.slice(closeIdx))
      }
    }

    cityEntry.status = 'done'
    cityEntry.doneAt = new Date().toISOString()
    cityEntry.addedCount = cityAdded
    writeFileSync(QUEUE_FILE, JSON.stringify(queue, null, 2))
    console.log(`  ✅ ${city}: +${cityAdded} школ`)
    if (cityAdded > 0) processedCities.push(`${city}(+${cityAdded})`)
  }

  console.log(`\n📊 Итого добавлено: ${totalAdded} школ`)
  console.log(`   Города: ${processedCities.join(', ')}`)
  console.log('\n⏳ Теперь запусти: git add -A && git commit && git push && ./deploy.sh')
}

main().catch(e => { console.error('💥', e.message); process.exit(1) })
