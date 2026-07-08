#!/usr/bin/env node
/**
 * daily-expand.mjs — ежедневный парсинг школ по городам.
 *
 * Запуск вручную: node scripts/daily-expand.mjs
 * Крон: 0 8 * * * (08:00 UTC = 11:00 МСК)
 *
 * Логика:
 *  1. Берёт следующий "failed" город из city-queue.json
 *  2. Для vechernie/eksternat: парсит 2GIS (реальные данные)
 *  3. Для всех остальных типов: генерирует через Claude Haiku
 *  4. Цель — ~200 новых школ за запуск
 *  5. Деплоит на VPS через deploy.sh
 */

import Anthropic from '@anthropic-ai/sdk'
import { readFileSync, writeFileSync, existsSync } from 'fs'
import { execSync } from 'child_process'
import path from 'path'
import { fileURLToPath } from 'url'

const __dirname  = path.dirname(fileURLToPath(import.meta.url))
const ROOT       = path.join(__dirname, '..')
const SCHOOLS_TS = path.join(ROOT, 'src', 'data', 'schools.ts')
const QUEUE_FILE = path.join(__dirname, 'city-queue.json')
const LOG_FILE   = path.join(ROOT, 'daily-expand.log')
const TWOGIS_KEY = '53a1beba-3f49-4388-9fe6-530a711ffdb1'

// ─── Конфиг ────────────────────────────────────────────────────────────────
const TARGET_SCHOOLS_PER_RUN = 200
const SCHOOLS_PER_TYPE       = 15   // AI-генерация
const TWOGIS_PAGE_SIZE       = 10   // Demo limit

const ALL_TYPES = [
  'gosudarstvennye', 'chastnie', 'online', 'vechernie', 'eksternal',
  'semejnye', 'domashnie', 'pri-vuzakh', 'profilnye', 'gimnazii',
  'korrektsionnye', 'kadetskie', 'mezhdunarodnie',
]

// Типы для 2GIS-парсинга (реальные данные)
const TWOGIS_QUERIES = {
  vechernie: ['вечерняя школа', 'открытая школа', 'сменная школа'],
  eksternal: ['школа экстернат', 'семейная школа', 'экстернат'],
}

// Типы для AI-генерации (остальные)
const AI_TYPES = ALL_TYPES.filter(t => !Object.keys(TWOGIS_QUERIES).includes(t))

const TYPE_LABELS = {
  gosudarstvennye: 'Государственные',  chastnie: 'Частные',
  online: 'Онлайн',                    vechernie: 'Вечерние',
  eksternal: 'Экстернат',              semejnye: 'Семейные',
  domashnie: 'Домашние',               'pri-vuzakh': 'При вузах',
  profilnye: 'Профильные',             gimnazii: 'Гимназии',
  korrektsionnye: 'Коррекционные',     kadetskie: 'Кадетские',
  mezhdunarodnie: 'Международные',
}

const TYPE_HINTS = {
  gosudarstvennye: 'обычные муниципальные школы, МБОУ СОШ, бесплатные, priceFrom: 0',
  chastnie: 'частные платные школы, малые классы, высокие цены (30000-100000 ₽/мес)',
  online: 'дистанционные школы, онлайн-платформы, ЕГЭ/ОГЭ, гибкий график',
  vechernie: 'вечерние и сменные школы для взрослых, номерные (Школа №X), бесплатные',
  eksternal: 'экстернат, семейное обучение, ускоренное прохождение программы',
  semejnye: 'семейные частные школы, малые классы, альтернативное образование',
  domashnie: 'домашнее обучение, репетиторские центры, индивидуальный план',
  'pri-vuzakh': 'лицеи и школы при университетах, углублённая подготовка в вуз',
  profilnye: 'профильные классы: IT, медицина, право, педагогика',
  gimnazii: 'гимназии с углублённым гуманитарным или языковым уклоном',
  korrektsionnye: 'коррекционные школы для детей с ОВЗ, инклюзивное образование',
  kadetskie: 'кадетские корпуса, военно-патриотическое воспитание',
  mezhdunarodnie: 'школы с IB-программой, Cambridge, двуязычное обучение',
}

function sleep(ms) { return new Promise(r => setTimeout(r, ms)) }

// ─── Logging ──────────────────────────────────────────────────────────────
function log(msg) {
  const ts = new Date().toLocaleString('ru-RU', { timeZone: 'Europe/Moscow' })
  const line = `[${ts}] ${msg}`
  console.log(line)
  try { require('fs').appendFileSync(LOG_FILE, line + '\n') } catch {}
}

// ─── Получаем city_id из 2GIS ─────────────────────────────────────────────
async function getCityId(cityName) {
  await sleep(300)
  const url = `https://catalog.api.2gis.com/3.0/items?q=${encodeURIComponent(cityName)}&page_size=5&key=${TWOGIS_KEY}`
  const res = await fetch(url, { signal: AbortSignal.timeout(10000) })
  const data = await res.json()
  if (data.meta?.code !== 200) return null
  for (const item of data.result?.items ?? []) {
    if (item.subtype === 'city') return item.id
  }
  return data.result?.items?.[0]?.id ?? null
}

// ─── Парсим школы из 2GIS ────────────────────────────────────────────────
async function parse2GIS(cityId, query, page = 1) {
  await sleep(300)
  const url = `https://catalog.api.2gis.com/3.0/items?q=${encodeURIComponent(query)}&city_id=${cityId}&fields=items.name_ex,items.address,items.contact_groups&page_size=${TWOGIS_PAGE_SIZE}&page=${page}&key=${TWOGIS_KEY}`
  const res = await fetch(url, { signal: AbortSignal.timeout(10000) })
  const data = await res.json()
  if (data.meta?.code !== 200) return []
  return (data.result?.items ?? []).map(item => ({
    name: item.name || '',
    address: item.address_name || '',
    phone: item.contact_groups?.[0]?.contacts?.find(c => c.type === 'phone')?.value || '',
  })).filter(s => s.name)
}

// ─── Фильтруем реальные школы ──────────────────────────────────────────
function filterReal(items, type) {
  const BAD = ['компани', 'бухгалтер', 'налог', 'сервис', 'it-компани', 'программирован',
               'отчетност', 'бизнес', 'юридич', 'улица', 'контур экстерн']
  const seen = new Set()
  return items.filter(s => {
    const n = s.name.toLowerCase()
    if (BAD.some(b => n.includes(b))) return false
    if (seen.has(n)) return false
    seen.add(n)
    if (type === 'eksternal') {
      return n.includes('экстерн') || (n.includes('семейн') && (n.includes('школ') || n.includes('образо')))
    }
    if (type === 'vechernie') {
      return n.includes('вечерн') && (n.includes('школ') || n.match(/№\s*\d/))
    }
    return true
  })
}

// ─── AI-генерация школ (Claude Haiku) ────────────────────────────────────
const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY, timeout: 120000 })
const tokenUsage = { input: 0, output: 0 }

function addUsage(u) { tokenUsage.input += u.input_tokens ?? 0; tokenUsage.output += u.output_tokens ?? 0 }

async function generateAISchools(city, slug, type, count) {
  const label = TYPE_LABELS[type] || type
  const hint  = TYPE_HINTS[type] || ''
  const idPfx = type.replace(/[^a-z]/g, '').slice(0, 5)

  // Получаем текущие slugи чтобы не дублировать
  const content = readFileSync(SCHOOLS_TS, 'utf-8')
  const existingSlugs = new Set((content.match(/slug: '([^']+)'/g) ?? []).map(m => m.slice(7, -1)))

  const prompt = `Генерируй ${count} ${label.toLowerCase()} школ города ${city} для образовательного портала.
Верни ТОЛЬКО JSON массив без markdown:

[{
  "id": "${idPfx}-${slug}-N",
  "slug": "уникальный-slug-${slug}",
  "name": "Название школы",
  "city": "${city}",
  "address": "ул. Реальная, д. N",
  "phone": "+7 (XXX) XXX-XX-XX",
  "description": "15-20 слов об этой школе.",
  "fullDescription": "60-90 слов с деталями, программами, особенностями.",
  "grades": "1–11",
  "founded": 1990,
  "studentsCount": 500,
  "features": ["Тег1", "Тег2", "Тег3", "Тег4", "Тег5"],
  "rating": 4.5,
  "reviewCount": 80,
  "priceFrom": 0
}]

Специфика типа "${type}": ${hint}
Slug: уникальные, латиница+дефисы, включают тип и город. Ровно ${count} объектов. Только JSON.`

  for (let attempt = 1; attempt <= 3; attempt++) {
    try {
      const msg = await anthropic.messages.create({
        model: 'claude-haiku-4-5',
        max_tokens: 4096,
        messages: [{ role: 'user', content: prompt }],
      })
      addUsage(msg.usage)
      const raw = msg.content[0].text.trim()
      const match = raw.match(/\[[\s\S]*\]/)
      if (!match) throw new Error('no JSON array')
      const schools = JSON.parse(match[0].replace(/,\s*\]/g, ']').replace(/,\s*\}/g, '}'))
      // Фильтруем дубли
      return schools.filter(s => s.slug && !existingSlugs.has(s.slug))
    } catch (e) {
      if (attempt < 3) { await sleep(1000); continue }
      console.error(`    ❌ AI ошибка: ${e.message}`)
      return []
    }
  }
  return []
}

// ─── Добавляем школу в schools.ts ────────────────────────────────────────
function escTs(s) { return String(s ?? '').replace(/\\/g, '\\\\').replace(/'/g, "\\'") }

function schoolToTs(s, type, slug) {
  const lines = [
    `    id: '${escTs(s.id || `${type.slice(0,5)}-${slug}-${Date.now()}`)}',`,
    `    slug: '${escTs(s.slug || `${type}-${slug}-${Math.random().toString(36).slice(2)}`)}',`,
    `    name: '${escTs(s.name)}',`,
    `    type: '${type}' as const,`,
    `    region: '${slug}' as const,`,
    `    city: '${escTs(s.city || '')}',`,
    `    address: '${escTs(s.address || 'Уточняйте по телефону')}',`,
  ]
  if (s.phone) lines.push(`    phone: '${escTs(s.phone)}',`)
  if (s.metro) lines.push(`    metro: '${escTs(s.metro)}',`)
  lines.push(
    `    description: '${escTs(s.description || '')}',`,
    `    fullDescription: '${escTs(s.fullDescription || s.description || '')}',`,
    `    grades: '${escTs(s.grades || '5–11')}',`,
    `    features: [${(s.features ?? []).map(f => `'${escTs(f)}'`).join(', ')}],`,
    `    rating: ${parseFloat(s.rating ?? 4.3).toFixed(1)},`,
    `    reviewCount: ${parseInt(s.reviewCount ?? 40)},`,
  )
  if (s.priceFrom !== undefined) lines.push(`    priceFrom: ${parseInt(s.priceFrom)},`)
  if (s.founded)       lines.push(`    founded: ${parseInt(s.founded)},`)
  if (s.studentsCount) lines.push(`    studentsCount: ${parseInt(s.studentsCount)},`)
  if (s.imageAlt)      lines.push(`    imageAlt: '${escTs(s.imageAlt)}',`)
  return `  {\n${lines.join('\n')}\n  }`
}

// ─── Добавить регион если новый ───────────────────────────────────────────
function ensureRegion(content, slug, cityName) {
  let u = content
  if (!u.includes(`'${slug}':`)) {
    u = u.replace(/(export const regionLabels: Record<RegionSlug, string> = \{[^}]*)(})/s,
      (_, b, c) => `${b}  '${slug}': '${cityName}',\n${c}`)
    const prepositions = { 'а': `в ${cityName.slice(0,-1)}е`, 'я': `в ${cityName.slice(0,-1)}е` }
    const cityIn = prepositions[cityName.slice(-1)] || `в ${cityName}е`
    u = u.replace(/(export const regionLabelsIn: Record<RegionSlug, string> = \{[^}]*)(})/s,
      (_, b, c) => `${b}  '${slug}': '${cityIn}',\n${c}`)
    u = u.replace(/(export const regionLabelsOf: Record<RegionSlug, string> = \{[^}]*)(})/s,
      (_, b, c) => `${b}  '${slug}': '${cityName}а',\n${c}`)
    u = u.replace(/(export const regionSlugs: RegionSlug\[\] = \[)([^\]]+)(\])/,
      (_, a, items, c) => `${a}${items.trimEnd().replace(/,?\s*$/, '')}, '${slug}'${c}`)
    console.log(`  ✅ Новый регион: ${slug}`)
  }
  return u
}

// ─── Главная функция ──────────────────────────────────────────────────────
async function main() {
  const startTs = new Date().toISOString()
  console.log(`\n🌅 daily-expand.mjs — ${new Date().toLocaleString('ru-RU', { timeZone: 'Europe/Moscow' })} МСК`)

  if (!process.env.ANTHROPIC_API_KEY) {
    console.error('❌ Нет ANTHROPIC_API_KEY'); process.exit(1)
  }

  // Загружаем очередь городов
  const queue = JSON.parse(readFileSync(QUEUE_FILE, 'utf-8'))

  // Находим города для обработки (failed или in-progress)
  const pending = queue.filter(c => c.status !== 'done')
  if (pending.length === 0) {
    console.log('✅ Все города обработаны!'); return
  }

  let totalAdded = 0
  const processedCities = []

  for (const cityEntry of pending) {
    if (totalAdded >= TARGET_SCHOOLS_PER_RUN) break

    const { city, slug } = cityEntry
    console.log(`\n🏙  ${city} (${slug})`)
    cityEntry.status = 'in-progress'
    writeFileSync(QUEUE_FILE, JSON.stringify(queue, null, 2))

    let content = readFileSync(SCHOOLS_TS, 'utf-8')
    const existingSlugs = new Set((content.match(/slug: '([^']+)'/g) ?? []).map(m => m.slice(7, -1)))
    const existingIds   = new Set((content.match(/id: '([^']+)'/g) ?? []).map(m => m.slice(5, -1)))

    content = ensureRegion(content, slug, city)

    const allSections = []
    let cityAdded = 0

    // ── 1. Парсинг 2GIS для vechernie + eksternat ──
    const cityId = await getCityId(city)
    if (cityId) {
      for (const [type, queries] of Object.entries(TWOGIS_QUERIES)) {
        const seenNames = new Set()
        const realSchools = []

        for (const q of queries) {
          for (let page = 1; page <= 3; page++) {
            const items = await parse2GIS(cityId, q, page)
            const filtered = filterReal(items, type)
            for (const s of filtered) {
              const key = s.name.toLowerCase()
              if (!seenNames.has(key)) {
                seenNames.add(key)
                realSchools.push(s)
              }
            }
            if (items.length < TWOGIS_PAGE_SIZE) break
          }
        }

        if (realSchools.length === 0) continue
        const tsBlocks = []
        let idx = 1
        for (const s of realSchools) {
          const schoolSlug = `${type.slice(0,4)}-${slug}-${idx}`
          if (existingSlugs.has(schoolSlug)) { idx++; continue }

          // Генерируем описание через Haiku
          process.stdout.write(`  [2GIS/${type}] ${s.name.slice(0,35)}... `)
          const aiRes = await generateAISchools(city, slug, type, 1)
          const desc = aiRes[0] || {
            description: `${s.name} — ${TYPE_LABELS[type]?.toLowerCase() || type} в ${city}.`,
            fullDescription: `${s.name} предоставляет образование в формате ${TYPE_LABELS[type]?.toLowerCase() || type} в ${city}. Индивидуальный подход, подготовка к ЕГЭ и ОГЭ.`,
            grades: '5–11', features: ['Аттестат', 'Гибкий график', 'Подготовка к ЕГЭ', 'Опытные педагоги', 'Малые классы'],
          }

          const school = {
            id: `${type.slice(0,5)}-${slug}-${idx}`,
            slug: schoolSlug,
            name: s.name, city,
            address: s.address, phone: s.phone,
            description: desc.description || '',
            fullDescription: desc.fullDescription || desc.description || '',
            grades: '5–11',
            features: desc.features || [],
            rating: (4.0 + Math.random() * 0.9).toFixed(1),
            reviewCount: Math.floor(15 + Math.random() * 70),
          }
          tsBlocks.push(schoolToTs(school, type, slug))
          existingSlugs.add(schoolSlug)
          cityAdded++; totalAdded++; idx++
          console.log('✅')
          if (totalAdded >= TARGET_SCHOOLS_PER_RUN) break
        }
        if (tsBlocks.length > 0) {
          allSections.push(`\n  // ===== ${city.toUpperCase()} — ${TYPE_LABELS[type]?.toUpperCase() || type.toUpperCase()} (реальные данные 2GIS) =====\n  ${tsBlocks.join(',\n  ')},`)
        }
      }
    }

    // ── 2. AI-генерация остальных типов ──
    for (const type of AI_TYPES) {
      if (totalAdded >= TARGET_SCHOOLS_PER_RUN) break

      // Проверяем сколько уже есть для этого города+типа
      const existing = (content.match(new RegExp(`type: '${type}'[^}]*?region: '${slug}'`, 'gs')) ?? []).length
      if (existing >= 8) continue  // уже достаточно

      process.stdout.write(`  [AI/${type}] `)
      const schools = await generateAISchools(city, slug, type, SCHOOLS_PER_TYPE)
      if (schools.length === 0) { console.log('(0)'); continue }

      const tsBlocks = schools
        .filter(s => !existingSlugs.has(s.slug))
        .map(s => {
          existingSlugs.add(s.slug)
          return schoolToTs({ ...s, city }, type, slug)
        })

      if (tsBlocks.length > 0) {
        allSections.push(`\n  // ===== ${city.toUpperCase()} — ${TYPE_LABELS[type]?.toUpperCase() || type.toUpperCase()} =====\n  ${tsBlocks.join(',\n  ')},`)
        cityAdded += tsBlocks.length; totalAdded += tsBlocks.length
        console.log(`+${tsBlocks.length}`)
      } else {
        console.log('(дубли)')
      }
    }

    // Вставляем в schools.ts
    if (allSections.length > 0) {
      const CLOSE = '] as any[] as School[])'
      const closeIdx = content.lastIndexOf(CLOSE)
      if (closeIdx !== -1) {
        const newContent = content.slice(0, closeIdx) + allSections.join('\n') + '\n' + content.slice(closeIdx)
        writeFileSync(SCHOOLS_TS, newContent)
        console.log(`  ✅ ${city}: +${cityAdded} школ`)
      }
    }

    cityEntry.status = 'done'
    cityEntry.doneAt = new Date().toISOString()
    cityEntry.addedCount = cityAdded
    writeFileSync(QUEUE_FILE, JSON.stringify(queue, null, 2))
    processedCities.push(`${city} (+${cityAdded})`)
  }

  console.log(`\n📊 Итого добавлено: ${totalAdded} школ`)
  console.log(`   Города: ${processedCities.join(', ')}`)
  const cost = (tokenUsage.input / 1e6 * 0.08) + (tokenUsage.output / 1e6 * 1.25)
  console.log(`   💰 API: ${tokenUsage.input}in + ${tokenUsage.output}out ≈ $${cost.toFixed(3)}`)

  if (totalAdded === 0) { console.log('Ничего не добавлено.'); return }

  // TypeScript check
  try {
    execSync('npx tsc --noEmit', { cwd: ROOT, stdio: 'pipe' })
    console.log('✅ TypeScript OK')
  } catch (e) {
    console.error('❌ TypeScript ошибки, откатываем...')
    execSync(`git -C "${ROOT}" checkout src/data/schools.ts`, { stdio: 'pipe' })
    process.exit(1)
  }

  // Git commit + push
  execSync(`git -C "${ROOT}" add src/data/schools.ts scripts/city-queue.json`, { stdio: 'pipe' })
  execSync(`git -C "${ROOT}" commit -m "feat(catalog): +${totalAdded} schools via daily-expand (${processedCities.join(', ')})\n\nCo-Authored-By: Claude Haiku 4.5 <noreply@anthropic.com>"`, { stdio: 'inherit' })
  execSync(`git -C "${ROOT}" push origin main`, { stdio: 'inherit' })
  console.log('📦 Запушено на GitHub')

  // Deploy to VPS
  console.log('\n🚀 Деплой на VPS...')
  execSync(`bash ${path.join(ROOT, 'deploy.sh')}`, { cwd: ROOT, stdio: 'inherit' })
  console.log('✅ Деплой завершён')
}

main().catch(e => { console.error('\n💥', e.message, e.stack?.split('\n')[1]); process.exit(1) })
