#!/usr/bin/env node
/**
 * AI-обогащение школ: FAQ, programs, achievements, director, workHours
 *
 * Использование:
 *   node scripts/enrich-schools.mjs                    # enriches 20 schools per run
 *   node scripts/enrich-schools.mjs --count=50        # enriches 50
 *   node scripts/enrich-schools.mjs --id=school-179   # specific school by id
 *   node scripts/enrich-schools.mjs --region=moskva   # only one region
 *   node scripts/enrich-schools.mjs --dry-run          # shows what would be enriched
 */

import Anthropic from '@anthropic-ai/sdk'
import { readFileSync, writeFileSync, existsSync } from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const ROOT        = path.join(__dirname, '..')
const SCHOOLS_TS  = path.join(ROOT, 'src', 'data', 'schools.ts')
const PROGRESS_F  = path.join(__dirname, 'enrich-progress.json')

// ─── CLI args ────────────────────────────────────────────────────────────────
const args = Object.fromEntries(
  process.argv.slice(2)
    .filter(a => a.startsWith('--'))
    .map(a => {
      const [k, ...v] = a.slice(2).split('=')
      return [k, v.join('=') || true]
    })
)

const COUNT   = parseInt(args.count   ?? '20')
const REGION  = args.region  ?? null
const ID      = args.id      ?? null
const DRY_RUN = !!args['dry-run']

// ─── Anthropic client ────────────────────────────────────────────────────────
const ANTHROPIC_KEY = process.env.ANTHROPIC_API_KEY
if (!ANTHROPIC_KEY) {
  console.error('❌ Нужен ANTHROPIC_API_KEY в переменных окружения')
  process.exit(1)
}
const anthropic = new Anthropic({ apiKey: ANTHROPIC_KEY })

// ─── Token tracking ──────────────────────────────────────────────────────────
const tokenUsage = { input: 0, output: 0 }
const PRICE_INPUT  = 0.80   // haiku-4-5: $0.80/1M input
const PRICE_OUTPUT = 4.00   // haiku-4-5: $4.00/1M output

function addUsage(usage) {
  tokenUsage.input  += usage.input_tokens  ?? 0
  tokenUsage.output += usage.output_tokens ?? 0
}

function formatUsageReport() {
  const inputCost  = (tokenUsage.input  / 1_000_000) * PRICE_INPUT
  const outputCost = (tokenUsage.output / 1_000_000) * PRICE_OUTPUT
  const total      = inputCost + outputCost
  return [
    `\n💰 Расход токенов:`,
    `   📥 Input : ${tokenUsage.input.toLocaleString('ru-RU')} токенов  ($${inputCost.toFixed(4)})`,
    `   📤 Output: ${tokenUsage.output.toLocaleString('ru-RU')} токенов  ($${outputCost.toFixed(4)})`,
    `   💵 Итого : $${total.toFixed(4)} (~${(total * 90).toFixed(2)} ₽)`,
  ].join('\n')
}

// ─── TYPE labels ─────────────────────────────────────────────────────────────
const TYPE_LABELS = {
  gosudarstvennye: 'Государственная',   chastnie: 'Частная',
  online: 'Онлайн',                     vechernie: 'Вечерняя',
  eksternal: 'Экстернат',               semejnye: 'Семейная',
  domashnie: 'Домашняя',                'pri-vuzakh': 'При вузе',
  profilnye: 'Профильная',              gimnazii: 'Гимназия',
  korrektsionnye: 'Коррекционная',      kadetskie: 'Кадетская',
  mezhdunarodnie: 'Международная',      internaty: 'Интернат',
  yazykovye: 'Языковая',                sportivnye: 'Спортивная',
  montessori: 'Монтессори',             shahmatnye: 'Шахматная',
  programmirovanie: 'Программирование', 'podgotovka-ege': 'Подготовка к ЕГЭ',
  'podgotovka-oge': 'Подготовка к ОГЭ', valdorfskie: 'Вальдорфская',
  pravoslavnye: 'Православная',
}

// ─── Parse schools from TS source ────────────────────────────────────────────
function parseSchools(src) {
  // Find the array start: `export const schools: School[] = ([`
  const arrayStart = src.indexOf('export const schools')
  if (arrayStart === -1) throw new Error('Cannot find schools array in schools.ts')

  const bracketPos = src.indexOf('[', arrayStart)
  if (bracketPos === -1) throw new Error('Cannot find [ after schools declaration')

  // Find end of array
  const arrayEnd = src.indexOf('] as', bracketPos)
  if (arrayEnd === -1) throw new Error('Cannot find end of schools array (] as)')

  const schools = []

  // Collect all positions of school object starts — two formats exist:
  //   Format A: `\n  {` (2-space indent)
  //   Format B: `,\n    {` (4-space indent, used in later sections)
  // We find ALL `{` positions within the array and filter by those that start
  // a school record (immediately followed by whitespace then `id:`)
  const schoolStartRe = /\bid:\s*'[^']+'/g
  let m
  const idPositions = []
  while ((m = schoolStartRe.exec(src)) !== null) {
    if (m.index > bracketPos && m.index < arrayEnd) {
      idPositions.push(m.index)
    }
  }

  for (const idPos of idPositions) {
    // Walk backward from idPos to find the opening `{` of this school object
    // It should be the nearest `{` before idPos that is at depth 0 relative to bracketPos
    let bStart = idPos - 1
    while (bStart > bracketPos && src[bStart] !== '{') bStart--
    if (src[bStart] !== '{') continue

    // Now walk forward to find the balanced closing `}`
    let depth = 0
    let inStr = false
    let strChar = ''
    let j = bStart
    while (j < src.length) {
      const c = src[j]
      if (inStr) {
        if (c === '\\') { j += 2; continue }
        if (c === strChar) inStr = false
      } else {
        if (c === '"' || c === "'") { inStr = true; strChar = c }
        else if (c === '{') depth++
        else if (c === '}') {
          depth--
          if (depth === 0) { j++; break }
        }
      }
      j++
    }

    const block = src.slice(bStart, j)
    const school = extractSchoolMeta(block)
    if (school) schools.push({ ...school, _block: block, _start: bStart, _end: j })
  }

  return schools
}

// Extract key fields from a school block via regex
function extractSchoolMeta(block) {
  const get = (key) => {
    // Match: key: 'value' or key: "value"
    const m = block.match(new RegExp(`\\b${key}:\\s*['"]([^'"\\\\]*(?:\\\\.[^'"\\\\]*)*)['"]`))
    return m ? m[1].replace(/\\'/g, "'").replace(/\\\\/g, '\\') : null
  }
  const getNum = (key) => {
    const m = block.match(new RegExp(`\\b${key}:\\s*([0-9.]+)`))
    return m ? parseFloat(m[1]) : null
  }
  const getBool = (key) => {
    const m = block.match(new RegExp(`\\b${key}:\\s*(true|false)`))
    return m ? m[1] === 'true' : null
  }
  const getArr = (key) => {
    const m = block.match(new RegExp(`\\b${key}:\\s*\\[([^\\]]*?)\\]`, 's'))
    if (!m) return []
    return [...m[1].matchAll(/['"]([^'"\\]*(?:\\.[^'"\\]*)*)['"]/g)].map(x => x[1].replace(/\\'/g, "'"))
  }

  const id = get('id')
  if (!id) return null

  return {
    id,
    slug:          get('slug'),
    name:          get('name'),
    type:          get('type'),
    region:        get('region'),
    city:          get('city'),
    address:       get('address'),
    description:   get('description'),
    grades:        get('grades'),
    features:      getArr('features'),
    priceFrom:     getNum('priceFrom'),
    priceTo:       getNum('priceTo'),
    rating:        getNum('rating'),
    hasFaq:        block.includes('faq:'),
  }
}

// ─── Build prompt ────────────────────────────────────────────────────────────
function buildEnrichPrompt(school) {
  const typeLabel = TYPE_LABELS[school.type] ?? school.type
  const priceStr  = (school.priceFrom === 0 || school.priceFrom == null)
    ? 'бесплатная'
    : `${school.priceFrom ?? 0}–${school.priceTo ?? school.priceFrom ?? 0} ₽/мес`

  return `Ты эксперт образовательного рынка России. Для конкретной школы сгенерируй данные.

ШКОЛА: ${school.name}
ТИП: ${typeLabel}
ГОРОД: ${school.city}
АДРЕС: ${school.address}
ОПИСАНИЕ: ${school.description}
ХАРАКТЕРИСТИКИ: ${(school.features ?? []).join(', ')}
КЛАССЫ: ${school.grades}
СТОИМОСТЬ: ${priceStr}
РЕЙТИНГ: ${school.rating}/5

Сгенерируй реалистичные данные для этой конкретной школы:

ВЕРНУТЬ СТРОГО JSON (только JSON, никакого markdown, никаких пояснений):
{
  "director": "ФИО директора (реалистичное русское имя, соответствующее типу школы)",
  "workHours": "Пн-Пт: X:00-Y:00, Сб: X:00-Y:00 (для кадетских и интернатов укажи другой режим)",
  "egeAvgScore": число_от_45_до_85 или null (null для начальных школ и типов без ЕГЭ),
  "egeYear": 2024,
  "programs": [
    {
      "grades": "1-4",
      "level": "Начальная школа",
      "subjects": ["предмет1", "предмет2", "предмет3"],
      "description": "1-2 предложения об особенностях программы"
    }
  ],
  "achievements": [
    "Достижение 1 за 2023-2024 учебный год",
    "Достижение 2",
    "Достижение 3"
  ],
  "faq": [
    {
      "question": "Конкретный вопрос про эту школу",
      "answer": "Развёрнутый ответ 2-4 предложения"
    },
    {
      "question": "Вопрос 2",
      "answer": "Ответ 2"
    },
    {
      "question": "Вопрос 3",
      "answer": "Ответ 3"
    },
    {
      "question": "Вопрос 4",
      "answer": "Ответ 4"
    }
  ]
}

Требования:
- programs: по одному объекту на каждую ступень которая есть у школы (смотри КЛАССЫ)
- 1-4 → Начальная школа; 5-9 → Основная; 10-11 → Старшая
- egeAvgScore: null для корректционных, шахматных, начальных школ и онлайн-детсадов
- achievements: 3 конкретных достижения, правдоподобных для этой школы
- faq: ровно 4 вопроса, специфичных для данной школы
- Все строки на русском языке`
}

// ─── Call Claude API ─────────────────────────────────────────────────────────
async function enrichViaAI(school) {
  const prompt = buildEnrichPrompt(school)

  for (let attempt = 1; attempt <= 3; attempt++) {
    const message = await anthropic.messages.create({
      model: 'claude-haiku-4-5',
      max_tokens: 2000,
      messages: [{ role: 'user', content: prompt }],
    })

    addUsage(message.usage)
    const raw = message.content[0].text.trim()

    // Extract JSON even if Claude wrapped in markdown
    const jsonMatch = raw.match(/\{[\s\S]*\}/)
    if (!jsonMatch) {
      if (attempt < 3) { await sleep(1000); continue }
      throw new Error('Ответ не содержит JSON объект')
    }

    let jsonStr = jsonMatch[0]
    // Clean common JSON issues
    jsonStr = jsonStr
      .replace(/,\s*\}/g, '}')
      .replace(/,\s*\]/g, ']')

    try {
      const data = JSON.parse(jsonStr)
      // Basic validation
      if (!data.faq || !Array.isArray(data.faq) || data.faq.length === 0) {
        throw new Error('faq отсутствует или пуст')
      }
      return data
    } catch (parseErr) {
      if (attempt < 3) {
        process.stdout.write(` (retry ${attempt}/3)`)
        await sleep(1000)
        continue
      }
      throw new Error(`JSON parse error: ${parseErr.message}`)
    }
  }
}

// ─── Escape string for TypeScript single-quoted string ───────────────────────
function esc(str) {
  return String(str)
    .replace(/\\/g, '\\\\')
    .replace(/'/g, "\\'")
}

// ─── Convert enrichment data to TypeScript field lines ───────────────────────
function enrichmentToTs(data, indent = '    ') {
  const lines = []

  if (data.director) {
    lines.push(`${indent}director: '${esc(data.director)}',`)
  }
  if (data.workHours) {
    lines.push(`${indent}workHours: '${esc(data.workHours)}',`)
  }
  if (data.egeAvgScore != null) {
    lines.push(`${indent}egeAvgScore: ${data.egeAvgScore},`)
  }
  if (data.egeYear != null && data.egeAvgScore != null) {
    lines.push(`${indent}egeYear: ${data.egeYear},`)
  }

  if (data.programs && data.programs.length > 0) {
    lines.push(`${indent}programs: [`)
    for (const p of data.programs) {
      lines.push(`${indent}  {`)
      lines.push(`${indent}    grades: '${esc(p.grades)}',`)
      lines.push(`${indent}    level: '${esc(p.level)}',`)
      const subjList = (p.subjects ?? []).map(s => `'${esc(s)}'`).join(', ')
      lines.push(`${indent}    subjects: [${subjList}],`)
      lines.push(`${indent}    description: '${esc(p.description)}',`)
      lines.push(`${indent}  },`)
    }
    lines.push(`${indent}],`)
  }

  if (data.achievements && data.achievements.length > 0) {
    const achList = data.achievements.map(a => `'${esc(a)}'`).join(`, `)
    lines.push(`${indent}achievements: [${achList}],`)
  }

  if (data.faq && data.faq.length > 0) {
    lines.push(`${indent}faq: [`)
    for (const item of data.faq) {
      lines.push(`${indent}  {`)
      lines.push(`${indent}    question: '${esc(item.question)}',`)
      lines.push(`${indent}    answer: '${esc(item.answer)}',`)
      lines.push(`${indent}  },`)
    }
    lines.push(`${indent}],`)
  }

  return lines.join('\n')
}

// ─── Write enrichment back to schools.ts ─────────────────────────────────────
function writeEnrichment(src, schoolId, data) {
  // Find the id field position
  const idStr = `id: '${schoolId}',`
  const idPos = src.indexOf(idStr)
  if (idPos === -1) {
    throw new Error(`Cannot find school id: ${schoolId} in schools.ts`)
  }

  // Walk back to find the opening `{` of this school object
  let blockStart = idPos - 1
  while (blockStart > 0 && src[blockStart] !== '{') blockStart--
  if (src[blockStart] !== '{') {
    throw new Error(`Cannot find opening brace for ${schoolId}`)
  }

  // Detect the indent of fields inside the block (look at the id field line)
  // e.g. if id is at "    id:" → indent is 4 spaces
  let lineStart = idPos - 1
  while (lineStart > 0 && src[lineStart] !== '\n') lineStart--
  const fieldIndent = src.slice(lineStart + 1, idPos).replace(/\S.*/, '')  // everything before 'id'

  // Walk forward to find the matching closing `}` (depth-aware)
  let depth = 0
  let blockEnd = blockStart
  let inStr = false
  let strChar = ''
  while (blockEnd < src.length) {
    const c = src[blockEnd]
    if (inStr) {
      if (c === '\\') { blockEnd += 2; continue }
      if (c === strChar) inStr = false
    } else {
      if (c === '"' || c === "'") { inStr = true; strChar = c }
      else if (c === '{') depth++
      else if (c === '}') {
        depth--
        if (depth === 0) break
      }
    }
    blockEnd++
  }

  const blockContent = src.slice(blockStart, blockEnd + 1)

  // Check which enrichment fields already exist in this block
  const fieldsToAdd = ['director', 'workHours', 'egeAvgScore', 'egeYear', 'programs', 'achievements', 'faq']
  const existingFields = fieldsToAdd.filter(f => {
    const re = new RegExp(`\\b${f}:\\s`)
    return re.test(blockContent)
  })

  // Filter data to only include fields not already present
  const filteredData = { ...data }
  for (const f of existingFields) {
    delete filteredData[f]
  }

  // If nothing to add, skip
  const newTs = enrichmentToTs(filteredData, fieldIndent)
  if (!newTs.trim()) return src  // nothing new to add

  // Determine the closing prefix to restore (e.g. `\n  ` or `\n`)
  // Find what comes right before the `}` at blockEnd
  let prefixStart = blockEnd - 1
  while (prefixStart > blockStart && src[prefixStart] !== '\n') prefixStart--
  const closingPrefix = src.slice(prefixStart, blockEnd)  // e.g. '\n  ' or '\n    '

  // Insert new fields before the closing `}`
  const newSrc = src.slice(0, blockEnd) + newTs + '\n' + closingPrefix.slice(1) + src.slice(blockEnd)
  return newSrc
}

function escapeRegex(str) {
  return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
}

// ─── Progress tracker ─────────────────────────────────────────────────────────
function loadProgress() {
  if (existsSync(PROGRESS_F)) {
    try { return JSON.parse(readFileSync(PROGRESS_F, 'utf8')) } catch { }
  }
  return { done: [], failed: [] }
}

function saveProgress(progress) {
  writeFileSync(PROGRESS_F, JSON.stringify(progress, null, 2))
}

// ─── Sleep helper ─────────────────────────────────────────────────────────────
function sleep(ms) {
  return new Promise(r => setTimeout(r, ms))
}

// ─── MAIN ─────────────────────────────────────────────────────────────────────
async function main() {
  console.log('📖 Читаем schools.ts...')
  const src      = readFileSync(SCHOOLS_TS, 'utf8')
  const progress = loadProgress()

  console.log('🔍 Парсим школы...')
  const allSchools = parseSchools(src)
  console.log(`   Найдено школ: ${allSchools.length}`)

  // Filter unenriched (no faq field)
  let candidates = allSchools.filter(s => !s.hasFaq && !progress.done.includes(s.id))

  // Apply filters
  if (ID) {
    candidates = candidates.filter(s => s.id === ID)
    if (candidates.length === 0) {
      // Maybe already has faq — force it
      const found = allSchools.find(s => s.id === ID)
      if (found) candidates = [found]
    }
  } else if (REGION) {
    candidates = candidates.filter(s => s.region === REGION)
  }

  // Limit
  const toProcess = candidates.slice(0, COUNT)

  console.log(`\n📊 К обогащению: ${toProcess.length} школ (из ${candidates.length} кандидатов)`)
  if (REGION) console.log(`   Регион: ${REGION}`)
  if (ID)     console.log(`   ID: ${ID}`)

  if (DRY_RUN) {
    console.log('\n🔬 DRY-RUN — что было бы обогащено:')
    toProcess.forEach((s, i) => {
      console.log(`  ${i + 1}. [${s.id}] ${s.name} (${s.city}, ${s.type})`)
    })
    console.log('\n✅ Dry-run завершён, файлы не изменены.')
    return
  }

  if (toProcess.length === 0) {
    console.log('✅ Нет школ для обогащения — все уже обогащены!')
    return
  }

  let currentSrc = src
  let enrichedCount = 0
  let failedCount = 0

  for (let i = 0; i < toProcess.length; i++) {
    const school = toProcess[i]
    process.stdout.write(`[${i + 1}/${toProcess.length}] ${school.name} (${school.city})... `)

    try {
      const data = await enrichViaAI(school)
      currentSrc = writeEnrichment(currentSrc, school.id, data)

      // Save to disk after each school (in case of interruption)
      writeFileSync(SCHOOLS_TS, currentSrc, 'utf8')

      progress.done.push(school.id)
      saveProgress(progress)

      console.log(`✅ Готово`)
      enrichedCount++
    } catch (err) {
      console.log(`❌ Ошибка: ${err.message}`)
      progress.failed.push({ id: school.id, error: err.message, ts: new Date().toISOString() })
      saveProgress(progress)
      failedCount++
    }

    // Rate limiting: 200ms between calls
    if (i < toProcess.length - 1) await sleep(200)
  }

  console.log(`\n📈 Итог: обогащено ${enrichedCount}, ошибок ${failedCount}`)
  console.log(`   Всего в базе обогащено: ${progress.done.length} школ`)
  console.log(formatUsageReport())
}

main().catch(err => {
  console.error('❌ Fatal error:', err)
  process.exit(1)
})
