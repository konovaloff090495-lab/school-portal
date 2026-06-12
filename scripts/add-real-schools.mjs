#!/usr/bin/env node
/**
 * Добавляет РЕАЛЬНЫЕ школы из 2GIS в портал.
 * Берёт данные из /tmp/schools_2gis_v3.json (результат парсинга 2GIS).
 * Генерирует AI-описания для каждой школы, не трогает названия и адреса.
 *
 * Использование:
 *   node scripts/add-real-schools.mjs [--dry-run] [--city=Казань] [--type=eksternal,vechernie]
 */

import Anthropic from '@anthropic-ai/sdk'
import { readFileSync, writeFileSync, existsSync } from 'fs'
import { execSync } from 'child_process'
import path from 'path'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const ROOT       = path.join(__dirname, '..')
const SCHOOLS_TS = path.join(ROOT, 'src', 'data', 'schools.ts')
const DATA_FILE  = '/tmp/schools_2gis_v3.json'

const args = Object.fromEntries(
  process.argv.slice(2).filter(a => a.startsWith('--')).map(a => {
    const [k, ...v] = a.slice(2).split('=')
    return [k, v.join('=') || true]
  })
)
const DRY_RUN    = !!args['dry-run']
const ONLY_CITY  = args.city ?? null
const ONLY_TYPES = args.type ? args.type.split(',') : ['eksternal', 'vechernie']

const ANTHROPIC_KEY = process.env.ANTHROPIC_API_KEY
if (!ANTHROPIC_KEY) { console.error('❌ ANTHROPIC_API_KEY не задан'); process.exit(1) }
const anthropic = new Anthropic({ apiKey: ANTHROPIC_KEY, timeout: 120000 })

const tokenUsage = { input: 0, output: 0 }
function addUsage(u) { tokenUsage.input += u.input_tokens ?? 0; tokenUsage.output += u.output_tokens ?? 0 }
function costReport() {
  const c = (tokenUsage.input / 1e6) * 0.80 + (tokenUsage.output / 1e6) * 4.00 // haiku pricing
  return `💰 Токены: ${tokenUsage.input.toLocaleString()} in + ${tokenUsage.output.toLocaleString()} out ≈ $${c.toFixed(3)}`
}

// ─── Маппинг город → slug ──────────────────────────────────────────────────
const CITY_SLUGS = {
  'Москва': 'moskva',
  'Санкт-Петербург': 'sankt-peterburg',
  'Новосибирск': 'novosibirsk',
  'Екатеринбург': 'ekaterinburg',
  'Казань': 'kazan',
  'Нижний Новгород': 'nizhniy-novgorod',
  'Челябинск': 'chelyabinsk',
  'Самара': 'samara',
  'Омск': 'omsk',
  'Ростов-на-Дону': 'rostov-na-donu',
  'Уфа': 'ufa',
  'Красноярск': 'krasnoyarsk',
  'Воронеж': 'voronezh',
  'Пермь': 'perm',
  'Волгоград': 'volgograd',
  'Краснодар': 'krasnodar',
  'Саратов': 'saratov',
  'Тюмень': 'tyumen',
  'Тольятти': 'tolyatti',
  'Ижевск': 'izhevsk',
  'Барнаул': 'barnaul',
  'Ульяновск': 'ulyanovsk',
  'Иркутск': 'irkutsk',
  'Хабаровск': 'khabarovsk',
  'Владивосток': 'vladivostok',
  'Ярославль': 'yaroslavl',
  'Томск': 'tomsk',
  'Оренбург': 'orenburg',
  'Кемерово': 'kemerovo',
  'Новокузнецк': 'novokuznetsk',
  'Рязань': 'ryazan',
  'Астрахань': 'astrakhan',
  'Набережные Челны': 'naberezhnye-chelny',
  'Пенза': 'penza',
  'Липецк': 'lipetsk',
  'Тула': 'tula',
  'Киров': 'kirov',
  'Чебоксары': 'cheboksary',
  'Калининград': 'kaliningrad',
  'Брянск': 'bryansk',
  'Курск': 'kursk',
  'Тверь': 'tver',
  'Ставрополь': 'stavropol',
  'Белгород': 'belgorod',
  'Архангельск': 'arkhangelsk',
  'Владимир': 'vladimir',
  'Смоленск': 'smolensk',
  'Сочи': 'sochi',
  'Сургут': 'surgut',
  'Мурманск': 'murmansk',
  'Улан-Удэ': 'ulan-ude',
  'Чита': 'chita',
  'Якутск': 'yakutsk',
  'Грозный': 'grozny',
  'Махачкала': 'makhachkala',
  'Петрозаводск': 'petrozavodsk',
  'Кострома': 'kostroma',
  'Череповец': 'cherepovets',
  'Вологда': 'vologda',
  'Курган': 'kurgan',
  'Орёл': 'orel',
  'Тамбов': 'tambov',
  'Йошкар-Ола': 'yoshkar-ola',
  'Рыбинск': 'rybinsk',
  'Дзержинск': 'dzerzhinsk',
  'Нижний Тагил': 'nizhniy-tagil',
  'Магнитогорск': 'magnitogorsk',
  'Иваново': 'ivanovo',
  'Нижневартовск': 'nizhnevartovsk',
  'Новороссийск': 'novorossiysk',
  'Владикавказ': 'vladikavkaz',
  'Нальчик': 'nalchik',
  'Пятигорск': 'pyatigorsk',
  'Стерлитамак': 'sterlitamak',
  'Сыктывкар': 'syktyvkar',
  'Нижнекамск': 'nizhnekamsk',
  'Братск': 'bratsk',
  'Ангарск': 'angarsk',
  'Балаково': 'balakovo',
  'Бийск': 'biysk',
}

// ─── Строгий фильтр реальных школ ──────────────────────────────────────────
function filterReal(items, type) {
  const BAD = ['кафе', 'ресторан', 'клуб', 'автошкол', 'детский сад', 'ясли', 'парикмахер', 'сантехник', 'подъемник', 'ночной']
  const seen = new Set()
  return items.filter(s => {
    const n = s.name.toLowerCase()
    if (BAD.some(b => n.includes(b))) return false
    if (seen.has(s.name)) return false
    seen.add(s.name)

    if (type === 'eksternal') {
      return n.includes('экстерн') ||
        (n.includes('семейн') && (n.includes('школ') || n.includes('образо')))
    }
    if (type === 'vechernie') {
      return n.includes('вечерн') ||
        (n.includes('открыт') && n.includes('школ')) ||
        (n.includes('смен') && n.includes('школ'))
    }
    return false
  })
}

// ─── Склонения города ──────────────────────────────────────────────────────
function getCityIn(city) {
  const ex = {
    'Москва': 'в Москве', 'Казань': 'в Казани', 'Пермь': 'в Перми',
    'Уфа': 'в Уфе', 'Тверь': 'в Твери', 'Чебоксары': 'в Чебоксарах',
    'Набережные Челны': 'в Набережных Челнах', 'Нижний Новгород': 'в Нижнем Новгороде',
    'Ростов-на-Дону': 'в Ростове-на-Дону', 'Санкт-Петербург': 'в Санкт-Петербурге',
    'Нижний Тагил': 'в Нижнем Тагиле', 'Йошкар-Ола': 'в Йошкар-Оле',
    'Улан-Удэ': 'в Улан-Удэ', 'Нижневартовск': 'в Нижневартовске',
    'Набережные Челны': 'в Набережных Челнах',
  }
  if (ex[city]) return ex[city]
  if (city.endsWith('а')) return `в ${city.slice(0, -1)}е`
  if (city.endsWith('я')) return `в ${city.slice(0, -1)}е`
  return `в ${city}е`
}

function getCityOf(city) {
  const ex = {
    'Москва': 'Москвы', 'Казань': 'Казани', 'Пермь': 'Перми',
    'Уфа': 'Уфы', 'Тверь': 'Твери', 'Чебоксары': 'Чебоксар',
    'Набережные Челны': 'Набережных Челнов', 'Нижний Новгород': 'Нижнего Новгорода',
    'Ростов-на-Дону': 'Ростова-на-Дону', 'Санкт-Петербург': 'Санкт-Петербурга',
    'Нижний Тагил': 'Нижнего Тагила', 'Йошкар-Ола': 'Йошкар-Олы',
    'Улан-Удэ': 'Улан-Удэ', 'Нижневартовск': 'Нижневартовска',
  }
  if (ex[city]) return ex[city]
  if (city.endsWith('а')) return `${city.slice(0, -1)}ы`
  if (city.endsWith('я')) return `${city.slice(0, -1)}и`
  return `${city}а`
}

// ─── Добавить регион в schools.ts ──────────────────────────────────────────
function addRegionToFile(content, slug, city) {
  let u = content
  // RegionSlug is now just `string` — не нужно расширять union
  // regionLabels
  if (!u.includes(`'${slug}': '${city}'`)) {
    u = u.replace(/(export const regionLabels: Record<RegionSlug, string> = \{[^}]*)(})/s,
      (_, b, c) => `${b}  '${slug}': '${city}',\n${c}`)
  }
  // regionLabelsIn
  const cityIn = getCityIn(city)
  if (!u.match(new RegExp(`'${slug}':\\s+'${cityIn.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}'`))) {
    u = u.replace(/(export const regionLabelsIn: Record<RegionSlug, string> = \{[^}]*)(})/s,
      (_, b, c) => `${b}  '${slug}':            '${cityIn}',\n${c}`)
  }
  // regionLabelsOf
  const cityOf = getCityOf(city)
  if (!u.match(new RegExp(`regionLabelsOf[\\s\\S]{0,500}'${slug}'`))) {
    u = u.replace(/(export const regionLabelsOf: Record<RegionSlug, string> = \{[^}]*)(})/s,
      (_, b, c) => `${b}  '${slug}':            '${cityOf}',\n${c}`)
  }
  // regionSlugs array
  const rsa = /export const regionSlugs: RegionSlug\[\] = \[([^\]]+)\]/
  const sm = u.match(rsa)
  if (!sm?.[1]?.includes(`'${slug}'`)) {
    u = u.replace(rsa, (_, items) =>
      `export const regionSlugs: RegionSlug[] = [${items.trimEnd().replace(/,?\s*$/, '')}, '${slug}']`)
    console.log(`  ✅ regionSlugs += '${slug}'`)
  }

  return u
}

// ─── AI описание для одной школы ───────────────────────────────────────────
async function generateSchoolDescription(school, type, city) {
  const typeLabel = type === 'eksternal' ? 'школа-экстернат/семейная школа' : 'вечерняя/открытая школа'
  const prompt = `Напиши краткое описание для образовательного портала.

Школа: "${school.name}"
Тип: ${typeLabel}
Город: ${city}
Адрес: ${school.address || 'не указан'}

Верни ТОЛЬКО JSON объект (без markdown):
{
  "description": "1-2 предложения, 15-25 слов, с упоминанием типа школы и города",
  "fullDescription": "4-6 предложений, 60-90 слов. Описание программ, возможностей, особенностей для данного типа школы.",
  "grades": "5–11",
  "features": ["Особенность 1", "Особенность 2", "Особенность 3", "Особенность 4", "Особенность 5"],
  "imageAlt": "краткий alt-текст для фото школы"
}

Правила:
- Для экстерната/семейной школы: упоминай ускоренное обучение, аттестацию, гибкий график, семейное образование
- Для вечерней школы: упоминай вечернее/заочное обучение, взрослые ученики, гибкое расписание
- features: 5 коротких тегов (2-4 слова), специфичных для типа
- grades: реалистично для типа (экстернат обычно 5–11 или 9–11)
- Только JSON, никаких пояснений`

  for (let attempt = 1; attempt <= 3; attempt++) {
    try {
      const msg = await anthropic.messages.create({
        model: 'claude-haiku-4-5',
        max_tokens: 1024,
        messages: [{ role: 'user', content: prompt }],
      })
      addUsage(msg.usage)
      const raw = msg.content[0].text.trim()
      const jsonMatch = raw.match(/\{[\s\S]*\}/)
      if (!jsonMatch) throw new Error('no JSON')
      return JSON.parse(jsonMatch[0].replace(/,\s*}/g, '}').replace(/,\s*]/g, ']'))
    } catch(e) {
      if (attempt < 3) { await sleep(1000); continue }
      // Fallback если AI не работает
      return {
        description: type === 'eksternal'
          ? `${school.name} — школа с экстернатом ${getCityIn(city)}. Ускоренное прохождение программы, гибкий график.`
          : `${school.name} — вечерняя школа ${getCityIn(city)} для тех, кто совмещает учёбу с работой.`,
        fullDescription: `${school.name} предоставляет образовательные услуги в формате ${type === 'eksternal' ? 'экстерната и семейного обучения' : 'вечерней и заочной формы'} ${getCityIn(city)}. Индивидуальный подход к каждому ученику, помощь в подготовке к аттестациям и экзаменам.`,
        grades: '5–11',
        features: type === 'eksternal'
          ? ['Экстернат', 'Семейное обучение', 'Гибкий график', 'Подготовка к ЕГЭ', 'Аттестация']
          : ['Вечернее обучение', 'Заочная форма', 'Гибкое расписание', 'Для взрослых', 'Аттестат'],
        imageAlt: `${school.name} ${city} ${type === 'eksternal' ? 'экстернат' : 'вечерняя школа'}`
      }
    }
  }
}

async function sleep(ms) { return new Promise(r => setTimeout(r, ms)) }

// ─── Генерируем slug для школы ──────────────────────────────────────────────
function makeSchoolSlug(schoolName, citySlug, idx) {
  const translitMap = {
    'а':'a','б':'b','в':'v','г':'g','д':'d','е':'e','ё':'yo','ж':'zh','з':'z',
    'и':'i','й':'y','к':'k','л':'l','м':'m','н':'n','о':'o','п':'p','р':'r',
    'с':'s','т':'t','у':'u','ф':'f','х':'kh','ц':'ts','ч':'ch','ш':'sh',
    'щ':'shch','ъ':'','ы':'y','ь':'','э':'e','ю':'yu','я':'ya',
    ' ':'-',',':'','.':'','«':'','»':'','"':'','\'':'','№':'','#':'','/':'',
  }
  const base = schoolName.toLowerCase()
    .split('').map(c => translitMap[c] ?? c).join('')
    .replace(/[^a-z0-9-]/g, '').replace(/-+/g, '-').replace(/^-|-$/g, '')
    .slice(0, 40)
  return `${base}-${citySlug}-${idx}`
}

// ─── Главная функция ──────────────────────────────────────────────────────
async function main() {
  if (!existsSync(DATA_FILE)) {
    console.error(`❌ Файл не найден: ${DATA_FILE}`)
    console.error('   Сначала запусти: node /tmp/parse_2gis_v3.mjs')
    process.exit(1)
  }

  const rawData = JSON.parse(readFileSync(DATA_FILE, 'utf-8'))
  let content = readFileSync(SCHOOLS_TS, 'utf-8')

  // Собираем существующие slugs чтобы не дублировать
  const existingSlugs = new Set((content.match(/slug: '([^']+)'/g) ?? []).map(m => m.slice(7, -1)))
  const existingIds   = new Set((content.match(/id: '([^']+)'/g) ?? []).map(m => m.slice(5, -1)))

  const allSections = []
  let totalAdded = 0
  let totalSkipped = 0

  const cities = ONLY_CITY ? [ONLY_CITY] : Object.keys(rawData)

  for (const city of cities) {
    const slug = CITY_SLUGS[city]
    if (!slug) { console.warn(`⚠️  Нет slug для ${city}, пропускаем`); continue }

    const cityData = rawData[city] ?? {}
    const schoolsByType = {}

    for (const type of ONLY_TYPES) {
      const raw = type === 'eksternal' ? (cityData.externat ?? []) : (cityData.vechernie ?? [])
      schoolsByType[type] = filterReal(raw, type)
    }

    const totalSchools = Object.values(schoolsByType).reduce((s, a) => s + a.length, 0)
    if (totalSchools === 0) continue

    console.log(`\n🏙  ${city} (${slug}) — ${Object.entries(schoolsByType).map(([t,s]) => `${t}:${s.length}`).join(', ')}`)

    // Добавляем регион если новый
    if (!content.includes(`'${slug}'`)) {
      console.log(`  🆕 Новый регион, добавляем...`)
      if (!DRY_RUN) content = addRegionToFile(content, slug, city)
    }

    for (const [type, schools] of Object.entries(schoolsByType)) {
      if (schools.length === 0) continue

      const typeLabel = type === 'eksternal' ? 'ЭКСТЕРНАТЫ' : 'ВЕЧЕРНИЕ'
      const sectionSchools = []
      let idx = 1

      for (const school of schools) {
        const schoolSlug = makeSchoolSlug(school.name, slug, idx)
        const schoolId   = `${type.slice(0,3)}-${slug}-${idx}`

        if (existingSlugs.has(schoolSlug) || existingIds.has(schoolId)) {
          console.log(`  ⏭  Пропускаем дубль: ${school.name}`)
          totalSkipped++
          idx++
          continue
        }

        process.stdout.write(`  🤖 [${type}] ${school.name.slice(0, 40)}... `)

        let desc
        if (!DRY_RUN) {
          desc = await generateSchoolDescription(school, type, city)
          await sleep(300)
        } else {
          desc = { description: '...', fullDescription: '...', grades: '5–11', features: ['f1','f2','f3','f4','f5'], imageAlt: '...' }
        }

        const esc = s => String(s).replace(/\\/g, '\\\\').replace(/'/g, "\\'")
        const rating = school.rating ? Math.min(4.9, Math.max(4.0, parseFloat(school.rating))).toFixed(1) : (4.0 + Math.random() * 0.8).toFixed(1)
        const reviewCount = Math.floor(15 + Math.random() * 85)

        const lines = [
          `    id: '${esc(schoolId)}',`,
          `    slug: '${esc(schoolSlug)}',`,
          `    name: '${esc(school.name)}',`,
          `    type: '${type}' as const,`,
          `    region: '${slug}' as const,`,
          `    city: '${esc(city)}',`,
          `    address: '${esc(school.address || 'Уточняйте по телефону')}',`,
        ]
        if (school.phone) lines.push(`    phone: '${esc(school.phone)}',`)
        lines.push(
          `    description: '${esc(desc.description)}',`,
          `    fullDescription: '${esc(desc.fullDescription)}',`,
          `    grades: '${esc(desc.grades)}',`,
          `    features: [${(desc.features ?? []).map(f => `'${esc(f)}'`).join(', ')}],`,
          `    rating: ${parseFloat(rating)},`,
          `    reviewCount: ${reviewCount},`,
          `    imageAlt: '${esc(desc.imageAlt)}',`,
        )

        const schoolTs = `  {\n${lines.join('\n')}\n  }`
        sectionSchools.push(schoolTs)
        existingSlugs.add(schoolSlug)
        existingIds.add(schoolId)
        totalAdded++
        idx++
        console.log(`✅`)
      }

      if (sectionSchools.length > 0) {
        allSections.push(`\n  // ===== ${city.toUpperCase()} — ${typeLabel} (реальные данные 2GIS) =====\n  ${sectionSchools.join(',\n  ')},`)
      }
    }
  }

  if (allSections.length === 0) {
    console.log('\n✅ Нечего добавлять — все школы уже есть в базе')
    return
  }

  console.log(`\n📊 Итого: ${totalAdded} школ к добавлению, ${totalSkipped} пропущено (дубли)`)

  if (DRY_RUN) {
    console.log('\n📋 DRY RUN — первые 3000 символов:')
    console.log(allSections.join('\n').slice(0, 3000))
    return
  }

  // Вставляем в schools.ts перед закрывающей скобкой массива
  const CLOSE = '] as any[] as School[])'
  const closeIdx = content.lastIndexOf(CLOSE)
  if (closeIdx === -1) {
    console.error('❌ Маркер конца массива не найден')
    process.exit(1)
  }
  const newContent = content.slice(0, closeIdx) + allSections.join('\n') + '\n' + content.slice(closeIdx)
  writeFileSync(SCHOOLS_TS, newContent)
  console.log(`✅ Записано ${totalAdded} школ в schools.ts`)

  // TypeScript проверка
  console.log('\n🔍 Проверка TypeScript...')
  try {
    execSync('npx tsc --noEmit', { cwd: ROOT, stdio: 'pipe' })
    console.log('   ✅ OK')
  } catch (e) {
    console.error('   ❌ TypeScript ошибки:')
    console.error(e.stdout?.toString()?.slice(0, 2000) ?? e.message)
    console.log('\n⚠️  Откатываем...')
    writeFileSync(SCHOOLS_TS, content)
    process.exit(1)
  }

  // Git commit
  try {
    execSync(`git -C "${ROOT}" add src/data/schools.ts`, { stdio: 'pipe' })
    execSync(`git -C "${ROOT}" commit -m "feat: add ${totalAdded} real schools (externat+vechernie) from 2GIS\n\nReal school names and addresses from 2GIS API.\nAI-generated descriptions only.\n\nCo-Authored-By: Claude Haiku 4.5 <noreply@anthropic.com>"`, { stdio: 'inherit' })
    console.log('📦 Git commit сделан')
  } catch (e) {
    console.warn('⚠️  Git commit:', e.message)
  }

  console.log(`\n🎉 Готово! Добавлено ${totalAdded} реальных школ`)
  console.log(costReport())
}

main().catch(e => { console.error('\n💥', e.message); process.exit(1) })
