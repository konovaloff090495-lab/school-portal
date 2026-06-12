#!/usr/bin/env node
/**
 * Генератор школ для нового города через Claude API
 *
 * Использование:
 *   node scripts/generate-city.mjs --city="Казань" --slug="kazan"
 *   node scripts/generate-city.mjs --city="Санкт-Петербург" --slug="sankt-peterburg"
 *   node scripts/generate-city.mjs --city="Москва" --slug="moskva" --types="gosudarstvennye,chastnie" --count=20
 *
 * Опции:
 *   --city=       Название города (обязательно)
 *   --slug=       Slug региона (обязательно)
 *   --types=      Типы через запятую (по умолчанию — все 12)
 *   --count=N     Школ на тип (по умолчанию 10)
 *   --no-photos   Пропустить скачку фото
 *   --no-deploy   Пропустить деплой
 *   --dry-run     Только показать что сгенерирует, не писать в файл
 */

import Anthropic from '@anthropic-ai/sdk'
import { readFileSync, writeFileSync, existsSync } from 'fs'
import { execSync, spawn } from 'child_process'
import path from 'path'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const ROOT       = path.join(__dirname, '..')
const SCHOOLS_TS = path.join(ROOT, 'src', 'data', 'schools.ts')

// Vercel project (pro-schools.ru) — передаём явно, чтобы не попасть в другой проект
const VERCEL_ENV = {
  ...process.env,
  VERCEL_PROJECT_ID: process.env.VERCEL_PROJECT_ID || 'prj_VYu8oMFiOeRe6Pabqug4NJaekgpJ',
  VERCEL_ORG_ID:     process.env.VERCEL_ORG_ID     || 'team_nn4HHJh7sr6tITE0mA24TmBT',
}

// ─── CLI аргументы ─────────────────────────────────────────────────────────
const args = Object.fromEntries(
  process.argv.slice(2)
    .filter(a => a.startsWith('--'))
    .map(a => {
      const [k, ...v] = a.slice(2).split('=')
      return [k, v.join('=') || true]
    })
)

const CITY      = args.city
const SLUG      = args.slug
const COUNT     = parseInt(args.count ?? '10')
const DRY_RUN   = !!args['dry-run']
const NO_PHOTOS = !!args['no-photos']
const NO_DEPLOY = !!args['no-deploy']

const ALL_TYPES = [
  'gosudarstvennye', 'chastnie', 'online', 'vechernie', 'eksternal',
  'semejnye', 'domashnie', 'pri-vuzakh', 'profilnye', 'gimnazii',
  'korrektsionnye', 'kadetskie', 'mezhdunarodnie',
]
const TYPES = args.types ? args.types.split(',').map(t => t.trim()) : ALL_TYPES

if (!CITY || !SLUG) {
  console.error('❌ Обязательные параметры: --city="Название" --slug="slug-goroda"')
  console.error('   Пример: node scripts/generate-city.mjs --city="Казань" --slug="kazan"')
  process.exit(1)
}

const TYPE_LABELS = {
  gosudarstvennye: 'Государственные',  chastnie: 'Частные',
  online: 'Онлайн',                    vechernie: 'Вечерние',
  eksternal: 'Экстернат',              semejnye: 'Семейные',
  domashnie: 'Домашние',               'pri-vuzakh': 'При вузах',
  profilnye: 'Профильные',             gimnazii: 'Гимназии',
  korrektsionnye: 'Коррекционные',     kadetskie: 'Кадетские',
  mezhdunarodnie: 'Международные',     internaty: 'Интернаты',
  yazykovye: 'Языковые',               sportivnye: 'Спортивные',
  montessori: 'Монтессори',            shahmatnye: 'Шахматные',
  programmirovanie: 'Программирование', 'podgotovka-ege': 'Подготовка к ЕГЭ',
}

// ─── Anthropic клиент ───────────────────────────────────────────────────────
const ANTHROPIC_KEY = process.env.ANTHROPIC_API_KEY
if (!ANTHROPIC_KEY) {
  console.error('❌ Нужен ANTHROPIC_API_KEY в переменных окружения')
  console.error('   export ANTHROPIC_API_KEY=sk-ant-...')
  process.exit(1)
}
const anthropic = new Anthropic({ apiKey: ANTHROPIC_KEY, timeout: 120000 })

// ─── Трекинг токенов ─────────────────────────────────────────────────────────
const tokenUsage = { input: 0, output: 0 }

// claude-opus-4-5 pricing ($/1M tokens)
const PRICE_INPUT  = 15.00
const PRICE_OUTPUT = 75.00

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

// ─── Генерация школ через Claude (JSON → TS) ─────────────────────────────────
async function generateSchools(city, slug, type, count) {
  const typeLabel = TYPE_LABELS[type]
  const idPrefix  = type.replace(/-/g, '').slice(0, 5)

  const prompt = `Ты генератор данных для образовательного портала России.

Сгенерируй ${count} реалистичных записей о ${typeLabel.toLowerCase()} школах города ${city}.
Данные должны быть правдоподобными для России, специфичными для ${city}.

Верни ТОЛЬКО валидный JSON массив (без markdown, без пояснений, только JSON):

[
  {
    "id": "${idPrefix}-${slug}-1",
    "slug": "licey-informatiki-${slug}",
    "name": "Официальное название школы",
    "city": "${city}",
    "address": "ул. Реальная, д. 1",
    "metro": "Станция метро",
    "phone": "+7 (XXX) XXX-XX-XX",
    "description": "Краткое описание 15-20 слов.",
    "fullDescription": "Подробное описание 60-100 слов с реальными деталями о школе, её особенностях, достижениях.",
    "grades": "1–11",
    "founded": 1990,
    "studentsCount": 500,
    "features": ["Особенность1", "Особенность2", "Особенность3", "Особенность4", "Особенность5"],
    "rating": 4.7,
    "reviewCount": 120,
    "priceFrom": 0,
    "imageAlt": "Описание для alt тега фото"
  }
]

Правила:
- slug уникальный, только строчные латинские буквы и дефисы, включает город, например: "licey-informatiki-${slug}"
- id уникальный, например: "${idPrefix}-${slug}-1", "${idPrefix}-${slug}-2" и т.д.
- address: реальные названия улиц ${city}
- metro: поле только если в ${city} есть метро И школа рядом со станцией, иначе НЕ ВКЛЮЧАЙ поле metro вообще
- phone: российский формат с кодом города ${city}
- founded: реалистичный год основания
- priceFrom: 0 для государственных, реалистичная сумма в рублях для частных
- features: 5 коротких тегов-характеристик (макс 2-3 слова каждый); включай теги типа "Подготовка к ЕГЭ" или "Подготовка к ОГЭ" где уместно
- rating: от 4.0 до 4.9
- для типа "${type}" — учитывай специфику: ${getTypeHint(type)}
- в description и fullDescription естественно упоминай "ЕГЭ" и/или "ОГЭ" где это соответствует типу школы

Верни ровно ${count} объектов в JSON массиве. Только JSON, ничего больше.`

  // Парсим JSON с retry — Claude иногда возвращает невалидный JSON
  for (let attempt = 1; attempt <= 3; attempt++) {
    const message = await anthropic.messages.create({
      model: 'claude-opus-4-5',
      max_tokens: 8192,
      messages: [{ role: 'user', content: prompt }],
    })

    addUsage(message.usage)
    const raw = message.content[0].text.trim()

    // Извлекаем JSON даже если Claude добавил markdown-обёртку
    const jsonMatch = raw.match(/\[[\s\S]*\]/)
    if (!jsonMatch) {
      if (attempt < 3) { await new Promise(r => setTimeout(r, 1000)); continue }
      throw new Error('Claude не вернул JSON массив')
    }

    let jsonStr = jsonMatch[0]

    // Чистим частые JSON-ошибки: trailing comma перед ] или }
    jsonStr = jsonStr
      .replace(/,\s*\]/g, ']')
      .replace(/,\s*\}/g, '}')

    try {
      const schools = JSON.parse(jsonStr)
      if (!Array.isArray(schools) || schools.length === 0) throw new Error('Пустой массив')

      // Конвертируем JSON → TypeScript строки с правильным escaping
      const tsObjects = schools.map(s => jsonSchoolToTs(s, type, slug))
      return tsObjects.join(',\n  ')
    } catch (parseErr) {
      if (attempt < 3) {
        process.stdout.write(` (retry ${attempt}/3)`)
        await new Promise(r => setTimeout(r, 1000))
        continue
      }
      throw new Error(`JSON parse error: ${parseErr.message}`)
    }
  }
}

// ─── JSON объект → TypeScript строка ─────────────────────────────────────────
function jsonSchoolToTs(s, type, slug) {
  const esc = (str) => String(str).replace(/\\/g, '\\\\').replace(/'/g, "\\'")

  const lines = [
    `    id: '${esc(s.id)}',`,
    `    slug: '${esc(s.slug)}',`,
    `    name: '${esc(s.name)}',`,
    `    type: '${type}' as const,`,
    `    region: '${slug}' as const,`,
    `    city: '${esc(s.city)}',`,
    `    address: '${esc(s.address)}',`,
  ]

  if (s.metro) lines.push(`    metro: '${esc(s.metro)}',`)

  lines.push(
    `    phone: '${esc(s.phone)}',`,
    `    description: '${esc(s.description)}',`,
    `    fullDescription: '${esc(s.fullDescription)}',`,
    `    grades: '${esc(s.grades)}',`,
    `    founded: ${Number(s.founded)},`,
    `    studentsCount: ${Number(s.studentsCount)},`,
    `    features: [${(s.features ?? []).map(f => `'${esc(f)}'`).join(', ')}],`,
    `    rating: ${Number(s.rating)},`,
    `    reviewCount: ${Number(s.reviewCount)},`,
    `    priceFrom: ${Number(s.priceFrom)},`,
    `    imageAlt: '${esc(s.imageAlt)}',`,
  )

  return `  {\n${lines.join('\n')}\n  }`
}

function getTypeHint(type) {
  const hints = {
    gosudarstvennye: 'ГБОУ/МАОУ/МОУ, бесплатные, разные профили (математический, языковой, естественнонаучный); упоминай подготовку к ЕГЭ/ОГЭ в description для большинства школ',
    chastnie: 'частные школы, платные, малые классы, инновационные методики; упоминай подготовку к ЕГЭ в description',
    online: 'дистанционные, онлайн-платформы, гибкий график, аттестация; ОБЯЗАТЕЛЬНО упоминай ЕГЭ или ОГЭ в description и fullDescription',
    vechernie: 'вечерние/сменные, для работающих, взрослые, гибкий график',
    eksternal: 'экстернат, ускоренное обучение, спортсмены, семейное образование; упоминай ЕГЭ в description',
    semejnye: 'семейные школы, малые группы, альтернативная педагогика',
    domashnie: 'надомное обучение, дети с ОВЗ, болеющие, спортсмены',
    'pri-vuzakh': 'лицеи и классы при университетах города, целевой набор в вуз; упоминай ЕГЭ и профильные классы в description',
    profilnye: 'профильные классы — IT, медицина, спорт, гуманитарный, экономика; ОБЯЗАТЕЛЬНО упоминай ЕГЭ/профильное обучение в description',
    gimnazii: 'гимназии с углублёнными программами, несколько иностранных языков; упоминай ЕГЭ в description',
    korrektsionnye: 'коррекционные школы для детей с ОВЗ разных нозологий',
    kadetskie: 'кадетские корпуса, военно-патриотические классы, шефство силовых структур',
    mezhdunarodnie: 'международные школы по программам IB (International Baccalaureate), Cambridge (IGCSE/A-Level), двуязычные школы с обучением на английском/другом иностранном языке; упоминай международный диплом и поступление в зарубежные вузы',
  }
  return hints[type] ?? 'специфика типа школы'
}

// ─── Склонение города: предложный падеж «в ...» ────────────────────────────
function getCityIn(city) {
  // Известные исключения
  const exceptions = {
    'Москва': 'в Москве', 'Казань': 'в Казани', 'Пермь': 'в Перми',
    'Уфа': 'в Уфе', 'Тверь': 'в Твери', 'Чебоксары': 'в Чебоксарах',
    'Набережные Челны': 'в Набережных Челнах', 'Нижний Новгород': 'в Нижнем Новгороде',
    'Ростов-на-Дону': 'в Ростове-на-Дону', 'Санкт-Петербург': 'в Санкт-Петербурге',
    'Московская область': 'в Московской области',
  }
  if (exceptions[city]) return exceptions[city]
  // Правило: -ов/-ев/-ск/-бург → +е; -а/-я → -е; остальное → +е
  if (/[ов|ев|ск|бург]$/i.test(city)) return `в ${city}е`
  if (city.endsWith('а')) return `в ${city.slice(0, -1)}е`
  if (city.endsWith('я')) return `в ${city.slice(0, -1)}е`
  return `в ${city}е`
}

// ─── Склонение города: родительный падеж ───────────────────────────────────
function getCityOf(city) {
  const exceptions = {
    'Москва': 'Москвы', 'Казань': 'Казани', 'Пермь': 'Перми',
    'Уфа': 'Уфы', 'Тверь': 'Твери', 'Чебоксары': 'Чебоксар',
    'Набережные Челны': 'Набережных Челнов', 'Нижний Новгород': 'Нижнего Новгорода',
    'Ростов-на-Дону': 'Ростова-на-Дону', 'Санкт-Петербург': 'Санкт-Петербурга',
    'Московская область': 'Московской области',
  }
  if (exceptions[city]) return exceptions[city]
  if (city.endsWith('а')) return `${city.slice(0, -1)}ы`
  if (city.endsWith('я')) return `${city.slice(0, -1)}и`
  // -ск/-бург/-ов/-ев → +а
  return `${city}а`
}

// ─── Добавить регион в schools.ts ───────────────────────────────────────────
function addRegionToFile(content, slug, city) {
  let updated = content

  // RegionSlug is now just `string` — не расширяем union type во избежание TS2590

  // regionLabels
  if (!updated.includes(`'${slug}': '${city}'`)) {
    updated = updated.replace(
      /(export const regionLabels: Record<RegionSlug, string> = \{[^}]*)(})/s,
      (_, body, close) => `${body}  '${slug}': '${city}',\n${close}`
    )
    console.log(`  ✅ regionLabels['${slug}'] = '${city}'`)
  }

  // regionLabelsIn (предложный падеж — «в Саратове»)
  const cityIn = getCityIn(city)
  if (!updated.includes(`'${slug}':`) || !updated.match(new RegExp(`regionLabelsIn[\\s\\S]*?'${slug}'`))) {
    updated = updated.replace(
      /(export const regionLabelsIn: Record<RegionSlug, string> = \{[^}]*)(})/s,
      (_, body, close) => `${body}  '${slug}':            '${cityIn}',\n${close}`
    )
    console.log(`  ✅ regionLabelsIn['${slug}'] = '${cityIn}'`)
  }

  // regionLabelsOf (родительный падеж — «Саратова»)
  const cityOf = getCityOf(city)
  if (!updated.match(new RegExp(`regionLabelsOf[\\s\\S]*?'${slug}'`))) {
    updated = updated.replace(
      /(export const regionLabelsOf: Record<RegionSlug, string> = \{[^}]*)(})/s,
      (_, body, close) => `${body}  '${slug}':            '${cityOf}',\n${close}`
    )
    console.log(`  ✅ regionLabelsOf['${slug}'] = '${cityOf}'`)
  }

  // regionSlugs — проверяем именно в строке regionSlugs, а не по всему файлу
  const regionSlugsLine = /export const regionSlugs: RegionSlug\[\] = \[([^\]]+)\]/
  const slugsMatch = updated.match(regionSlugsLine)
  if (!slugsMatch || !slugsMatch[1].includes(`'${slug}'`)) {
    updated = updated.replace(
      regionSlugsLine,
      (_, items) => `export const regionSlugs: RegionSlug[] = [${items.trimEnd().replace(/,?\s*$/, '')}, '${slug}']`
    )
    console.log(`  ✅ regionSlugs += '${slug}'`)
  }

  return updated
}

// ─── Вставить сгенерированные школы в массив schools ────────────────────────
function insertSchools(content, schoolsTs) {
  // Вставляем перед закрывающей ] массива schools
  return content.replace(
    /(\s*\/\/ ===== [^\n]+КАДЕТСКИЕ[^\n]*\n(?:[\s\S]*?}[,\s]*\n)*\s*\]\s*\n)/,
    (match) => match.replace(/(\s*\]\s*\n)$/, `\n${schoolsTs}\n]\n`)
  )
}

// ─── Запустить процесс и стримить вывод ─────────────────────────────────────
function runCommand(cmd, args = [], options = {}) {
  return new Promise((resolve, reject) => {
    const proc = spawn(cmd, args, { stdio: 'inherit', cwd: ROOT, ...options })
    proc.on('close', code => code === 0 ? resolve() : reject(new Error(`Exit ${code}`)))
  })
}

// ─── Главная функция ─────────────────────────────────────────────────────────
async function main() {
  console.log(`\n🏙  Генерация школ: ${CITY} (${SLUG})`)
  console.log(`📚 Типов: ${TYPES.length}, по ${COUNT} школ = ${TYPES.length * COUNT} школ\n`)

  // Проверяем/создаём регион в файле
  let content = readFileSync(SCHOOLS_TS, 'utf-8')
  const isNewRegion = !content.includes(`'${SLUG}'`)

  if (isNewRegion) {
    console.log(`🆕 Добавляем новый регион '${SLUG}' в schools.ts...`)
    content = addRegionToFile(content, SLUG, CITY)
  }

  // Генерируем школы по типам
  const allGeneratedTs = []

  for (const type of TYPES) {
    process.stdout.write(`  🤖 ${TYPE_LABELS[type].padEnd(18)} `)

    try {
      const raw = await generateSchools(CITY, SLUG, type, COUNT)

      // Оборачиваем в заголовок секции
      const section = `\n  // ===== ${CITY.toUpperCase()} — ${TYPE_LABELS[type].toUpperCase()} =====\n  ${raw.trim()},`
      allGeneratedTs.push(section)
      process.stdout.write(`✅ ${COUNT} школ\n`)
    } catch (e) {
      process.stdout.write(`❌ ${e.message}\n`)
      // Если закончился баланс — прерываем весь процесс, не пишем частичные данные
      if (e.message.includes('credit balance is too low') || e.message.includes('insufficient_quota')) {
        console.error('\n💳 Недостаточно средств на API. Пополните баланс: https://console.anthropic.com/settings/billing')
        process.exit(2)
      }
    }

    // Небольшая пауза между запросами к API
    await new Promise(r => setTimeout(r, 500))
  }

  if (allGeneratedTs.length === 0) {
    console.error('\n❌ Ничего не сгенерировано')
    process.exit(1)
  }

  const schoolsBlock = allGeneratedTs.join('\n')

  if (DRY_RUN) {
    console.log('\n📋 DRY RUN — preview:')
    console.log(schoolsBlock.slice(0, 2000) + '...')
    return
  }

  // Проверяем дубли по slug перед вставкой
  const existingSlugs = new Set((content.match(/slug: '([^']+)'/g) ?? []).map(m => m.slice(7, -1)))
  const filteredBlock = schoolsBlock.split('\n').filter(line => {
    const slugMatch = line.match(/slug: '([^']+)'/)
    if (slugMatch && existingSlugs.has(slugMatch[1])) {
      console.warn(`⚠️  Пропускаем дубль: ${slugMatch[1]}`)
      return false
    }
    return true
  }).join('\n')

  // Вставляем в конец массива schools (перед "] as any[] as School[])")
  const SCHOOLS_CLOSE = '] as any[] as School[])'
  const closeIdx = content.lastIndexOf(SCHOOLS_CLOSE)
  if (closeIdx === -1) {
    console.error('❌ Не найден маркер конца массива schools: "' + SCHOOLS_CLOSE + '"')
    process.exit(1)
  }
  const newContent = content.slice(0, closeIdx) + filteredBlock + '\n' + content.slice(closeIdx)
  writeFileSync(SCHOOLS_TS, newContent)

  console.log(`\n✅ Записано ${allGeneratedTs.length * COUNT} школ в schools.ts`)

  // TypeScript проверка
  console.log('\n🔍 Проверка TypeScript...')
  try {
    execSync('npx tsc --noEmit', { cwd: ROOT, stdio: 'pipe' })
    console.log('   ✅ OK')
  } catch (e) {
    console.error('   ❌ TypeScript ошибки:')
    console.error(e.stdout?.toString() ?? e.message)
    console.log('\n⚠️  Откатываем изменения в schools.ts...')
    writeFileSync(SCHOOLS_TS, content)
    process.exit(1)
  }

  // Скачиваем фото
  if (!NO_PHOTOS) {
    console.log('\n📸 Скачиваем фото для новых школ...')
    await runCommand('node', ['scripts/scrape-school-images.mjs', '--only-missing'])
  }

  // Git commit
  try {
    execSync(`git -C "${ROOT}" add src/data/schools.ts`, { stdio: 'inherit' })
    execSync(`git -C "${ROOT}" commit -m "Schools: add ${TYPES.length * COUNT} schools for ${CITY} (${SLUG})\n\nCo-Authored-By: Claude Opus 4 <noreply@anthropic.com>"`, { stdio: 'inherit' })
    console.log('\n📦 Git commit сделан')
  } catch (e) {
    console.warn('⚠️  Git commit не удался:', e.message)
  }

  // Билд
  console.log('\n🔨 Сборка...')
  await runCommand('npm', ['run', 'build'])

  // Деплой
  if (!NO_DEPLOY) {
    console.log('\n🚀 Деплой...')
    await runCommand('npx', ['vercel', '--prod', '--yes'], { env: VERCEL_ENV })
  }

  console.log(`\n🎉 Готово! Добавлено ${allGeneratedTs.length * COUNT} школ для ${CITY}`)
  console.log(formatUsageReport())
}

main().catch(e => { console.error('\n💥', e.message); process.exit(1) })
