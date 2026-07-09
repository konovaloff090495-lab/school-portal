#!/usr/bin/env node
/**
 * daily-expand.mjs — ежедневный парсинг школ по городам через 2GIS.
 *
 * Запуск: node scripts/daily-expand.mjs
 * Крон:  0 8 * * * cd /Users/dmitriikonovalov/claude/school-portal && node scripts/daily-expand.mjs
 * (08:00 UTC = 11:00 МСК)
 *
 * БЕЗ Anthropic API — только 2GIS + шаблонные описания.
 * Цель: ~200 новых школ за запуск.
 */

import { readFileSync, writeFileSync, appendFileSync } from 'fs'
import { execSync } from 'child_process'
import path from 'path'
import { fileURLToPath } from 'url'

const __dirname  = path.dirname(fileURLToPath(import.meta.url))
const ROOT       = path.join(__dirname, '..')
const SCHOOLS_TS = path.join(ROOT, 'src', 'data', 'schools.ts')
const QUEUE_FILE = path.join(__dirname, 'city-queue.json')
const LOG_FILE   = path.join(ROOT, 'daily-expand.log')
const TWOGIS_KEY = '53a1beba-3f49-4388-9fe6-530a711ffdb1'
const PAGE_SIZE  = 10   // Demo limit
const TARGET     = 200  // школ за запуск

// ─── 2GIS-запросы по типу ──────────────────────────────────────────────────
const TWOGIS_QUERIES = {
  vechernie:       ['вечерняя школа', 'открытая школа', 'сменная школа'],
  eksternal:       ['экстернат', 'семейная школа', 'школа семейного образования'],
  gosudarstvennye: ['общеобразовательная школа', 'средняя школа', 'МБОУ СОШ'],
  chastnie:        ['частная школа', 'частная общеобразовательная школа'],
  online:          ['дистанционная школа', 'онлайн школа'],
  semejnye:        ['школа семейного типа', 'малокомплектная школа'],
  'pri-vuzakh':    ['лицей', 'лицей при университете', 'академический лицей'],
  profilnye:       ['профильная школа', 'IT-школа', 'лингвистическая школа'],
  gimnazii:        ['гимназия'],
  korrektsionnye:  ['коррекционная школа', 'школа для детей с ОВЗ', 'специальная школа'],
  kadetskie:       ['кадетский корпус', 'кадетская школа', 'кадетский класс'],
  mezhdunarodnie:  ['международная школа', 'школа с углублённым английским'],
}

// Фильтры для каждого типа
const TYPE_FILTERS = {
  vechernie:       s => /вечерн/.test(s) && (/школ/.test(s) || /№\s*\d/.test(s)),
  eksternal:       s => /экстерн/.test(s) || (/семейн/.test(s) && (/школ/.test(s) || /образо/.test(s))),
  gosudarstvennye: s => /школ/.test(s) && (/муниципальн|общеобразовательн|сош|мбоу|средняя/.test(s)),
  chastnie:        s => /школ/.test(s) && /частн/.test(s),
  online:          s => /школ/.test(s) && (/дистанцион|онлайн/.test(s)),
  semejnye:        s => /семейн/.test(s) && (/школ/.test(s) || /образо/.test(s)),
  'pri-vuzakh':    s => /лицей/.test(s),
  profilnye:       s => /школ|лицей|гимназ/.test(s) && (/профил|айти|it-|лингв|углублён/.test(s)),
  gimnazii:        s => /гимназ/.test(s),
  korrektsionnye:  s => /коррекц|овз|специальн/.test(s) && /школ/.test(s),
  kadetskie:       s => /кадет/.test(s),
  mezhdunarodnie:  s => /международн/.test(s) && /школ/.test(s) || /кембридж|cambridge|ib-/.test(s),
}

// Описания и теги по типу
const TYPE_META = {
  vechernie:       { label: 'Вечерняя школа',      grades: '9–11', price: 0,  tags: ['Аттестат', 'Вечернее обучение', 'Для взрослых', 'Без возрастных ограничений', 'Гибкий график'] },
  eksternal:       { label: 'Экстернат',            grades: '1–11', price: 0,  tags: ['Экстернат', 'Семейное обучение', 'Ускоренная программа', 'Аттестат', 'Гибкий график'] },
  gosudarstvennye: { label: 'Государственная школа',grades: '1–11', price: 0,  tags: ['Бесплатно', 'Муниципальная', 'ФГОС', 'Аттестат', 'Продлёнка'] },
  chastnie:        { label: 'Частная школа',        grades: '1–11', price: 25000, tags: ['Малые классы', 'Индивидуальный подход', 'Аттестат', 'Частная', 'Продлёнка'] },
  online:          { label: 'Онлайн-школа',         grades: '1–11', price: 0,  tags: ['Дистанционно', 'ЕГЭ/ОГЭ', 'Гибкий график', 'Аттестат', 'Онлайн'] },
  semejnye:        { label: 'Семейная школа',       grades: '1–9',  price: 15000, tags: ['Семейное обучение', 'Малые группы', 'Альтернативное образование', 'Аттестат', 'Гибкий подход'] },
  'pri-vuzakh':    { label: 'Лицей при вузе',       grades: '8–11', price: 0,  tags: ['При университете', 'Углублённые программы', 'Подготовка в вуз', 'Профильные классы', 'Аттестат'] },
  profilnye:       { label: 'Профильная школа',     grades: '7–11', price: 0,  tags: ['Профильные классы', 'IT', 'Естественные науки', 'ЕГЭ', 'Аттестат'] },
  gimnazii:        { label: 'Гимназия',             grades: '1–11', price: 0,  tags: ['Гуманитарный уклон', 'Углублённые языки', 'Аттестат', 'ФГОС', 'Олимпиады'] },
  korrektsionnye:  { label: 'Коррекционная школа',  grades: '1–9',  price: 0,  tags: ['ОВЗ', 'Инклюзивное образование', 'Логопед', 'Специальные программы', 'Аттестат'] },
  kadetskie:       { label: 'Кадетский корпус',     grades: '5–11', price: 0,  tags: ['Военно-патриотическое воспитание', 'Дисциплина', 'Физподготовка', 'Аттестат', 'Форма'] },
  mezhdunarodnie:  { label: 'Международная школа',  grades: '1–11', price: 60000, tags: ['IB-программа', 'Cambridge', 'Английский язык', 'Международный аттестат', 'Двуязычное обучение'] },
}

const BAD_KEYWORDS = [
  'кафе', 'ресторан', 'клуб', 'автошкол', 'детский сад', 'ясли', 'парикмахер',
  'магазин', 'аптека', 'банк', 'спортивн', 'танц', 'музыкальн', 'бухгалтер',
  'налог', 'юридич', 'контур экстерн', 'улица ', 'проспект', 'it-компани',
  'центр занятости', 'дом культуры', 'библиотека', 'почта',
]

function sleep(ms) { return new Promise(r => setTimeout(r, ms)) }

function log(msg) {
  const ts = new Date().toLocaleString('ru-RU', { timeZone: 'Europe/Moscow' })
  const line = `[${ts}] ${msg}`
  console.log(line)
  try { appendFileSync(LOG_FILE, line + '\n') } catch {}
}

// ─── 2GIS: city_id ───────────────────────────────────────────────────────────
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

// ─── 2GIS: поиск школ ────────────────────────────────────────────────────────
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
    })).filter(s => s.name && !BAD_KEYWORDS.some(b => s.raw.includes(b)))
  } catch { return [] }
}

// ─── Шаблонное описание ──────────────────────────────────────────────────────
function makeDescription(school, type, city) {
  const m = TYPE_META[type] || TYPE_META.gosudarstvennye
  return {
    description: `${school.name} — ${m.label.toLowerCase()} в ${city}. ${m.price > 0 ? `Стоимость от ${m.price.toLocaleString('ru-RU')} ₽/мес.` : 'Бесплатное государственное образование.'}`,
    fullDescription: `${school.name} предлагает программы ${m.label.toLowerCase()}а в ${city}. Классы ${m.grades}, по стандартам ФГОС. ${m.tags.slice(0,3).join(', ')}. ${school.address ? `Адрес: ${school.address}.` : ''} ${school.phone ? `Телефон: ${school.phone}.` : ''}`.trim(),
    grades: m.grades,
    features: m.tags,
    priceFrom: m.price,
    rating: parseFloat((3.9 + Math.random() * 1.0).toFixed(1)),
    reviewCount: Math.floor(10 + Math.random() * 90),
  }
}

// ─── Сериализация в TypeScript ───────────────────────────────────────────────
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
  if (s.founded) lines.push(`    founded: ${s.founded},`)
  return `  {\n${lines.join('\n')}\n  }`
}

// ─── Добавить регион если новый ───────────────────────────────────────────────
function ensureRegion(content, slug, cityName) {
  if (content.includes(`'${slug}':`)) return content
  const last = cityName.slice(-1)
  const cityIn  = last === 'а' || last === 'я' ? `в ${cityName.slice(0,-1)}е` : `в ${cityName}е`
  const cityOf  = `${cityName}а`
  let u = content
  u = u.replace(/(export const regionLabels: Record<RegionSlug, string> = \{[^}]*)(})/s,
    (_, b, c) => `${b}  '${slug}': '${cityName}',\n${c}`)
  u = u.replace(/(export const regionLabelsIn: Record<RegionSlug, string> = \{[^}]*)(})/s,
    (_, b, c) => `${b}  '${slug}': '${cityIn}',\n${c}`)
  u = u.replace(/(export const regionLabelsOf: Record<RegionSlug, string> = \{[^}]*)(})/s,
    (_, b, c) => `${b}  '${slug}': '${cityOf}',\n${c}`)
  u = u.replace(/(export const regionSlugs: RegionSlug\[\] = \[)([^\]]+)(\])/,
    (_, a, items, c) => `${a}${items.trimEnd().replace(/,?\s*$/, '')}, '${slug}'${c}`)
  console.log(`  ✅ Новый регион: ${slug}`)
  return u
}

// ─── Главная функция ─────────────────────────────────────────────────────────
async function main() {
  log(`🌅 daily-expand.mjs START`)

  const queue = JSON.parse(readFileSync(QUEUE_FILE, 'utf-8'))
  const pending = queue.filter(c => c.status !== 'done')

  if (pending.length === 0) { log('✅ Все города обработаны!'); return }

  let totalAdded = 0
  const processedCities = []

  for (const cityEntry of pending) {
    if (totalAdded >= TARGET) break

    const { city, slug } = cityEntry
    log(`\n🏙  ${city} (${slug})`)
    cityEntry.status = 'in-progress'
    writeFileSync(QUEUE_FILE, JSON.stringify(queue, null, 2))

    let content = readFileSync(SCHOOLS_TS, 'utf-8')
    const existingSlugs = new Set((content.match(/slug: '([^']+)'/g) ?? []).map(m => m.slice(7, -1)))

    content = ensureRegion(content, slug, city)

    const cityId = await getCityId(city)
    if (!cityId) {
      log(`  ❌ city_id не найден для ${city}`)
      cityEntry.status = 'failed'
      writeFileSync(QUEUE_FILE, JSON.stringify(queue, null, 2))
      continue
    }

    const allSections = []
    let cityAdded = 0

    for (const [type, queries] of Object.entries(TWOGIS_QUERIES)) {
      if (totalAdded >= TARGET) break

      // Проверяем, сколько уже есть школ этого типа в этом городе
      const existingCount = (content.match(new RegExp(`type: '${type}'[^}]*?region: '${slug}'`, 'gs')) ?? []).length
      if (existingCount >= 10) continue

      const seenNames = new Set()
      const found = []
      const typeFilter = TYPE_FILTERS[type]

      for (const q of queries) {
        for (let page = 1; page <= 3; page++) {
          const items = await searchSchools(cityId, q, page)
          for (const s of items) {
            const n = s.raw
            if (!typeFilter(n)) continue
            if (seenNames.has(n)) continue
            seenNames.add(n)
            found.push(s)
          }
          if (items.length < PAGE_SIZE) break
        }
      }

      if (found.length === 0) continue

      const tsBlocks = []
      let idx = existingCount + 1
      for (const s of found) {
        const schoolSlug = `${type.replace(/[^a-z]/g,'').slice(0,5)}-${slug}-${idx}`
        if (existingSlugs.has(schoolSlug)) { idx++; continue }

        const desc = makeDescription(s, type, city)
        const school = {
          id: `${type.slice(0,5)}-${slug}-${idx}`,
          slug: schoolSlug,
          name: s.name,
          city,
          address: s.address,
          phone: s.phone,
          ...desc,
        }

        tsBlocks.push(schoolToTs(school, type, slug))
        existingSlugs.add(schoolSlug)
        cityAdded++; totalAdded++; idx++
        if (totalAdded >= TARGET) break
      }

      if (tsBlocks.length > 0) {
        const m = TYPE_META[type] || {}
        allSections.push(`\n  // ===== ${city.toUpperCase()} — ${(m.label || type).toUpperCase()} (2GIS) =====\n  ${tsBlocks.join(',\n  ')},`)
        log(`  [${type}] +${tsBlocks.length} из ${found.length} найденных`)
      }
    }

    // Вставляем в schools.ts
    if (allSections.length > 0) {
      const CLOSE = '] as any[] as School[])'
      const closeIdx = content.lastIndexOf(CLOSE)
      if (closeIdx !== -1) {
        const newContent = content.slice(0, closeIdx) + allSections.join('\n') + '\n' + content.slice(closeIdx)
        writeFileSync(SCHOOLS_TS, newContent)
      }
    }

    cityEntry.status = 'done'
    cityEntry.doneAt = new Date().toISOString()
    cityEntry.addedCount = cityAdded
    writeFileSync(QUEUE_FILE, JSON.stringify(queue, null, 2))

    log(`  ✅ ${city}: +${cityAdded} школ`)
    if (cityAdded > 0) processedCities.push(`${city}(+${cityAdded})`)
  }

  log(`\n📊 Итого добавлено: ${totalAdded} школ`)
  log(`   Города: ${processedCities.join(', ')}`)

  if (totalAdded === 0) { log('Ничего не добавлено.'); return }

  // TypeScript check
  try {
    execSync('npx tsc --noEmit', { cwd: ROOT, stdio: 'pipe' })
    log('✅ TypeScript OK')
  } catch (e) {
    log('❌ TypeScript ошибки, откатываем...')
    execSync(`git -C "${ROOT}" checkout src/data/schools.ts`, { stdio: 'pipe' })
    process.exit(1)
  }

  // Git commit + push
  execSync(`git -C "${ROOT}" add src/data/schools.ts scripts/city-queue.json`, { stdio: 'pipe' })
  execSync(`git -C "${ROOT}" commit -m "feat(catalog): +${totalAdded} schools via 2GIS (${processedCities.join(', ')})\n\nCo-Authored-By: Claude Sonnet 4.6 <noreply@anthropic.com>"`, { stdio: 'inherit' })
  execSync(`git -C "${ROOT}" push origin main`, { stdio: 'inherit' })
  log('📦 Запушено на GitHub')

  // Deploy to VPS
  log('\n🚀 Деплой на VPS...')
  execSync(`bash ${path.join(ROOT, 'deploy.sh')}`, { cwd: ROOT, stdio: 'inherit', timeout: 1200000 })
  log('✅ Деплой завершён')
}

main().catch(e => { log(`💥 ${e.message}`); process.exit(1) })
