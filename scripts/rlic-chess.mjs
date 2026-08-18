#!/usr/bin/env node
/**
 * rlic-chess.mjs — шахматные школы из реестра лицензий Рособрнадзора
 * (islod.obrnadzor.gov.ru). Официальные открытые данные.
 *
 * Почему понадобилось: тип shahmatnye был в typeSlugs, но в базе не было НИ ОДНОЙ
 * школы этого типа — страницы под него генерировались заведомо пустыми. В OSM
 * шахматных школ почти нет (по всей стране 21 объект, из них с адресом 4), ключ
 * 2GIS в репозитории мёртв (403). Реестр даёт юрназвание, полный адрес, ИНН и
 * статус лицензии — проверяемые данные.
 *
 * Что отсеиваем: федерации шахмат и НКО (не образование), сёла Шахматово
 * (топоним), школы имени чемпионов по шахматам (обычные общеобразовательные).
 *
 * Важно: почти все такие организации — учреждения ДОПОЛНИТЕЛЬНОГО образования
 * (ДЮСШ/СШОР по шахматам), а не общеобразовательные. Поэтому тексты идут с
 * переопределением gradesText/moneyText — без ФГОС и «основных предметов».
 *
 * Запуск:
 *   node scripts/rlic-chess.mjs --dry
 *   node scripts/rlic-chess.mjs
 */
import { readFileSync, writeFileSync } from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'
import { createJiti } from '../node_modules/jiti/lib/jiti.mjs'
import { makeDescriptions, TYPE_META } from './lib/school-text.mjs'
import { cleanAddress, stripRegionAndCity, titleCase } from './lib/rlic-address.mjs'

const __dirname  = path.dirname(fileURLToPath(import.meta.url))
const SCHOOLS_TS = path.join(__dirname, '..', 'src', 'data', 'schools.ts')
const BASE = 'https://islod.obrnadzor.gov.ru'
const UA = 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 Chrome/120 Safari/537.36'
const DRY = process.argv.includes('--dry')
const sleep = ms => new Promise(r => setTimeout(r, ms))

async function search(page) {
  const body = new URLSearchParams({ eoName: 'шахмат', regNum: '', region: '', lo: '', status: '', expand: '', page: String(page), p: String(page) })
  const res = await fetch(`${BASE}/search`, {
    method: 'POST',
    headers: { 'User-Agent': UA, 'X-Requested-With': 'XMLHttpRequest', 'Referer': `${BASE}/rlic/`, 'Content-Type': 'application/x-www-form-urlencoded' },
    body, signal: AbortSignal.timeout(60000),
  })
  const html = await res.text()
  return [...html.matchAll(/<a href="\/view\/(\d+)"[^>]*>([^<]+)<\/a>/g)].map(m => ({ id: m[1], name: m[2].trim() }))
}

async function detail(id) {
  const res = await fetch(`${BASE}/view/${id}`, { headers: { 'User-Agent': UA }, signal: AbortSignal.timeout(40000) })
  const h = await res.text()
  const field = label => {
    const m = h.match(new RegExp(label + '<\\/label><div class="form-field[^"]*">([^<]+)<', 'i'))
    return m ? m[1].replace(/\s+/g, ' ').trim() : null
  }
  return {
    shortName: field('Сокращенное наименование организации'),
    fullName:  field('Полное наименование организации'),
    inn:       field('ИНН'),
    address:   field('Место нахождения организации'),
    status:    field('Текущий статус лицензии'),
  }
}

// Реестр ищет по подстроке названия, поэтому в выдачу попадает лишнее.
function isChessSchool(name) {
  const s = name.toLowerCase()
  if (!/шахмат/.test(s)) return false
  if (/шахматов|шахматск/.test(s)) return false                    // топоним «Шахматово»
  if (/имени чемпион|чемпионки мира|чемпиона мира/.test(s)) return false
  if (/федерац|обществен/.test(s)) return false                    // спортфедерации, не образование
  if (/детский сад|дошкольн/.test(s)) return false
  if (/по реализации|проект|социально значим/.test(s)) return false   // НКО, а не школа
  return /школ|центр|академ/.test(s)
}

/**
 * Читаемое имя карточки. Сокращённое название в реестре — обычно аббревиатура
 * («БУ ДО ОО «ШШСШ»»), она не годится в H1. Берём то, что в кавычках полного
 * названия («Шахматно-шашечная спортивная школа»), иначе — полное название без
 * организационно-правового хвоста.
 */
function pickName(shortName, fullName, fallback) {
  const quoted = [...(fullName || '').matchAll(/[«"]([^«»"]{5,})[»"]/g)].map(m => m[1].trim())
  const best = quoted.sort((a, b) => b.length - a.length)[0]
  if (best && /[аеёиоуыэюя]/i.test(best)) return best
  const stripped = (fullName || '')
    .replace(/^(муниципальное|государственное|бюджетное|автономное|казённое|казенное|частное|некоммерческое|местное)\s+/ig, '')
    .replace(/^(бюджетное|автономное|казённое|казенное|общеобразовательное|образовательное)\s+/ig, '')
    .replace(/^учреждение\s+(дополнительного\s+образования)?\s*/ig, '')
    .trim()
  if (stripped.length >= 8 && /[аеёиоуыэюя]/i.test(stripped)) return stripped
  return shortName || fallback
}

// Бюджетные учреждения учат бесплатно; про АНО/ЧОУ утверждать этого нельзя.
const isPublic = name => /^(МБУ|МБОУ|МАУ|МАОУ|МКУ|МОУ|ГБУ|ГБОУ|ГАУ|ГКУ|БУ|МБУДО|НРМБУ)\b/i.test(name.trim())
  || /муниципальн|государственн|бюджетн/i.test(name)


const transliterate = s => s.toLowerCase().replace(/[а-яё]/g, c => ({
  а:'a',б:'b',в:'v',г:'g',д:'d',е:'e',ё:'e',ж:'zh',з:'z',и:'i',й:'y',к:'k',л:'l',м:'m',н:'n',о:'o',п:'p',р:'r',с:'s',т:'t',у:'u',ф:'f',х:'kh',ц:'ts',ч:'ch',ш:'sh',щ:'sch',ъ:'',ы:'y',ь:'',э:'e',ю:'yu',я:'ya',
}[c] ?? c))
const makeSlug = (name, citySlug) => (transliterate(name) + '-' + citySlug).replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 80)

// ── текущая база ──────────────────────────────────────────────────────────────
const jiti = createJiti(import.meta.url, { interopDefault: true })
const { schools, regionSlugs, regionLabels, regionLabelsIn } = await jiti.import(SCHOOLS_TS)
const existingSlugs = new Set(schools.map(s => s.slug))
const key = (n, r) => (n + '|' + r).toLowerCase().replace(/[«»"]/g, '').replace(/\s+/g, ' ').trim()
const existingKeys = new Set(schools.map(s => key(s.name, s.region)))

const norm = s => s.toLowerCase().replace(/ё/g, 'е').replace(/[^a-zа-я0-9]+/g, ' ').trim()
// длинные названия первыми: «Нижний Новгород» должен сработать раньше «Новгорода»
const CITIES = regionSlugs.map(sl => ({ slug: sl, label: regionLabels[sl], n: norm(regionLabels[sl]) }))
  .sort((a, b) => b.n.length - a.n.length)
const matchCity = addr => {
  const a = ' ' + norm(addr) + ' '
  return CITIES.find(c => a.includes(' ' + c.n + ' ')) ?? null
}

const esc = v => String(v ?? '').replace(/\\/g, '\\\\').replace(/'/g, "\\'")
const formatSchool = s => [
  `  {`, `    id: '${s.slug}',`, `    slug: '${s.slug}',`, `    name: '${esc(s.name)}',`,
  `    type: 'shahmatnye',`, `    region: '${s.region}',`, `    city: '${esc(s.city)}',`,
  `    address: '${esc(s.address)}',`, `    phone: '',`,
  `    description: '${esc(s.description)}',`, `    fullDescription: '${esc(s.fullDescription)}',`,
  `    grades: '${s.grades}',`, `    features: ${JSON.stringify(s.features)},`,
  `    rating: null,`, `    reviewCount: 0,`, `    priceFrom: 0,`,
  `    imageAlt: '${esc(s.imageAlt)}',`, `  },`,
].join('\n')

// ── сбор ──────────────────────────────────────────────────────────────────────
const rows = []
for (let p = 1; p <= 20; p++) {
  await sleep(500)
  let r
  try { r = await search(p) } catch (e) { process.stderr.write(`стр${p}: ${e.message}\n`); continue }
  if (!r.length) break
  rows.push(...r)
}
const uniq = [...new Map(rows.map(r => [r.id, r])).values()]
const cand = uniq.filter(r => isChessSchool(r.name))
process.stderr.write(`реестр: ${uniq.length} организаций, похожи на шахматную школу: ${cand.length}\n`)

const picked = []
const skipped = { noAddr: 0, notActive: 0, noCity: 0, dup: 0, longName: 0 }
for (const c of cand) {
  await sleep(400)
  let d
  try { d = await detail(c.id) } catch { continue }
  if (!/действ/i.test(d.status || '')) { skipped.notActive++; continue }
  if (!d.address) { skipped.noAddr++; continue }
  const city = matchCity(d.address)
  if (!city) { skipped.noCity++; continue }

  // в карточке реестра «полное наименование» пустое — оно есть в строке поиска
  let name = pickName(d.shortName, c.name, c.name)
  if (name.length > 70) { skipped.longName = (skipped.longName ?? 0) + 1; continue }
  if (name === name.toUpperCase()) name = titleCase(name)
  name = name.replace(/\s+/g, ' ').replace(/;$/, '').trim()
  const k = key(name, city.slug)
  if (existingKeys.has(k)) { skipped.dup++; continue }
  // «Шахматная школа» в одном городе может быть не одна — слаг разводим номером
  let slug = makeSlug(name, city.slug)
  for (let i = 2; existingSlugs.has(slug); i++) slug = `${makeSlug(name, city.slug)}-${i}`

  const meta = {
    ...TYPE_META.shahmatnye,
    moneyText: isPublic(name) ? 'Занятия бесплатные — учреждение финансируется из бюджета.' : '',
  }
  const address = cleanAddress(stripRegionAndCity(d.address, city.label), city.label)
  const { description, fullDescription } = makeDescriptions(
    name, 'shahmatnye', city.label, regionLabelsIn[city.slug] ?? `в ${city.label}`, address, meta,
  )
  picked.push({
    slug, name, region: city.slug, city: city.label, address,
    description, fullDescription, grades: meta.grades, features: meta.features,
    imageAlt: `${name} — шахматная школа в городе ${city.label}`,
  })
  existingKeys.add(k); existingSlugs.add(slug)
}

process.stderr.write(`\nотобрано: ${picked.length}\n`)
process.stderr.write(`пропущено: без адреса ${skipped.noAddr}, лицензия не действует ${skipped.notActive}, город не на сайте ${skipped.noCity}, дубль ${skipped.dup}\n`)
const byCity = {}
for (const s of picked) byCity[s.city] = (byCity[s.city] || 0) + 1
process.stderr.write(`городов: ${Object.keys(byCity).length} — ${Object.entries(byCity).sort((a,b)=>b[1]-a[1]).map(([c,n])=>`${c} ${n}`).join(', ')}\n`)
picked.slice(0, 8).forEach(s => process.stderr.write(`  · ${s.name} — ${s.city}, ${s.address}\n`))

if (!DRY && picked.length) {
  let src = readFileSync(SCHOOLS_TS, 'utf8')
  const marker = '] as any[] as School[])'
  const idx = src.lastIndexOf(marker)
  src = src.slice(0, idx) + picked.map(formatSchool).join('\n') + '\n' + src.slice(idx)
  writeFileSync(SCHOOLS_TS, src, 'utf8')
  process.stderr.write('\n💾 schools.ts обновлён\n')
} else {
  process.stderr.write('\n🔍 DRY RUN — файл не менялся\n')
}
