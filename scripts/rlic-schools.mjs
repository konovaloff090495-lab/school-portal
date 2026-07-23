#!/usr/bin/env node
/**
 * rlic-schools.mjs — добор частных общеобразовательных школ из реестра лицензий
 * Рособрнадзора (islod.obrnadzor.gov.ru). Официальные открытые данные.
 *
 * Почему этот источник: после чистки выдуманных карточек тип «частные» и близкие
 * к нему стали тонкими, а в OSM частных школ почти нет. Реестр даёт юридическое
 * название, полный адрес, ИНН и статус лицензии — проверяемые данные, ровно то,
 * чего требует правило «ничего не генерировать».
 *
 * Ограничение источника: поиск идёт по юрназванию. «Частные общеобразовательные»
 * отделяются чисто (ЧОУ/ОАНО/АНО СОШ + «общеобразовательн»), а вот «экстернат» и
 * «семейное» в реестре не выделены — это форматы, а не категория лицензии.
 * Поэтому скрипт наполняет тип chastnie (плюс gimnazii/mezhdunarodnie, если это
 * прямо в названии).
 *
 * Запуск:
 *   node scripts/rlic-schools.mjs --dry
 *   node scripts/rlic-schools.mjs                 # федеральные города
 *   node scripts/rlic-schools.mjs --pages=30      # глубже пагинация
 */

import { readFileSync, writeFileSync } from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'
import { createJiti } from '../node_modules/jiti/lib/jiti.mjs'
import { makeDescriptions, TYPE_META } from './lib/school-text.mjs'

const __dirname  = path.dirname(fileURLToPath(import.meta.url))
const SCHOOLS_TS = path.join(__dirname, '..', 'src', 'data', 'schools.ts')
const BASE = 'https://islod.obrnadzor.gov.ru'
const UA = 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 Chrome/120 Safari/537.36'
const sleep = ms => new Promise(r => setTimeout(r, ms))

const args = Object.fromEntries(process.argv.slice(2).filter(a => a.startsWith('--'))
  .map(a => { const [k, ...v] = a.slice(2).split('='); return [k, v.join('=') || true] }))
const DRY = Boolean(args.dry)
const MAX_PAGES = parseInt(args.pages ?? '25')

// Субъекты, где субъект = город (адрес не нужно доуточнять по городу).
// region — код субъекта в реестре; slug/name — как в нашем schools.ts.
const TARGETS = [
  { region: '77', slug: 'moskva',        name: 'Москва',          nameIn: 'в Москве' },
  { region: '78', slug: 'sankt-peterburg', name: 'Санкт-Петербург', nameIn: 'в Санкт-Петербурге' },
  { region: '92', slug: 'sevastopol',    name: 'Севастополь',     nameIn: 'в Севастополе' },
]

const STATE = /ГБОУ|ГАОУ|МБОУ|МАОУ|МКОУ|\bМОУ\b|ГБПОУ|ГОСУДАРСТВЕНН|МУНИЦИПАЛЬН|БЮДЖЕТН|КАЗ[ЕЁ]НН/i
const PRIVATE = /ЧАСТН|НЕГОСУДАРСТВЕНН|АВТОНОМН.{0,20}НЕКОММЕРЧ|\bАНО\b|\bОАНО\b|\bОЧУ\b|\bЧОУ\b|\bНОУ\b|\bНОЧУ\b|\bЧУ\b|\bЧУОО\b/i
const NOT_SCHOOL = /ДОШКОЛЬН|ДЕТСК.{0,3}САД|ДОПОЛНИТЕЛЬН.{0,20}ПРОФЕССИ|ПРОФЕССИОНАЛЬН|\bДПО\b|ВЫСШЕГО ОБРАЗОВ|УНИВЕРСИТЕТ|ИНСТИТУТ|АКАДЕМИЯ|КОЛЛЕДЖ|ТЕХНИКУМ|ПАРИКМАХЕР|НОГТЕВ|МАССАЖ|ИНВЕСТОР|ЯЗЫКОВ.{0,10}ЦЕНТР|АВТОШКОЛ|УЧЕБНЫЙ ЦЕНТР/i

async function search(region, page) {
  const body = new URLSearchParams({ eoName: 'общеобразовательн', regNum: '', region, lo: '', status: '', expand: '', page: String(page), p: String(page) })
  const res = await fetch(`${BASE}/search`, {
    method: 'POST',
    headers: { 'User-Agent': UA, 'X-Requested-With': 'XMLHttpRequest', 'Referer': `${BASE}/rlic/`, 'Content-Type': 'application/x-www-form-urlencoded' },
    body, signal: AbortSignal.timeout(40000),
  })
  const html = await res.text()
  const rows = [...html.matchAll(/<a href="\/view\/(\d+)"[^>]*>([^<]+)<\/a>/g)].map(m => ({ id: m[1], name: m[2].trim() }))
  const lastPage = Math.max(1, ...[...html.matchAll(/pager__link[^>]*>(\d+)</g)].map(m => +m[1]))
  return { rows, lastPage }
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

// Регистр слова: КАПС → Титул, иначе оставляем (чтобы не ломать «МБОУ», «им.»)
const SMALL = new Set(['на','в','во','по','и','с','к','о','от','до','для','при','из','за','над','под','у'])
function titleWord(w, i) {
  if (w.length <= 1) return w
  const low = w.toLowerCase()
  if (i > 0 && SMALL.has(low)) return low
  if (w === w.toUpperCase() && /[А-ЯЁA-Z]/.test(w)) return w.charAt(0) + low.slice(1)
  return w
}
function titleCase(s) {
  let idx=0; return s.split(/(\s+|-)/).map(t=>/^[\s-]+$/.test(t)?t:titleWord(t,idx++)).join('')
}

// Юр-адрес → человекочитаемый: «119034, Г.Москва, ВН.ТЕР.Г. ... УЛ ОСТОЖЕНКА, Д. 42, ПОМЕЩ. 2П»
//   → «ул. Остоженка, д. 42»
function cleanAddress(raw, cityName) {
  if (!raw) return `г. ${cityName}`
  // \b в JS не работает с кириллицей (граница слова — только ASCII), поэтому
  // используем lookaround по кириллице. NB — «не буква кириллицы» слева/справа.
  const NB = '(?<![А-ЯЁа-яё])', NA = '(?![А-ЯЁа-яё])'
  const w = (body, flags='ig') => new RegExp(NB + body + NA, flags)
  const C = '[А-ЯЁа-яё]'
  let a = ' ' + raw + ' '
  a = a.replace(/(^|,)\s*\d{5,6}\s*,?/g, ',')                        // индекс в любом месте
    .replace(/Российская Федерация\s*,?/ig, ' ')
    .replace(w('г(ород)?\\.?\\s*(москв'+C+'*|санкт-?петербург'+C+'*|севастопол'+C+'*)\\s*,?'), ' ')
    .replace(/ВН\.?\s*ТЕР\.?\s*Г\.?\s*/ig, ' ')
    .replace(/муниципальн[а-яё]*\s+округ[а-яё]*\s*(№\s*\d+|[А-ЯЁа-яё-]+)?\s*,?/ig, ' ')
    .replace(w('поселени'+C+'*\\s+'+C+'[А-ЯЁа-яё-]*\\s*,?'), ' ')
    .replace(w('(населенный пункт\\s+)?(деревня|пос[её]лок|село|рабочий пос[её]лок)\\s+'+C+'[А-ЯЁа-яё-]*\\s*,?'), ' ')
    .replace(/\bж\/?к\s+[А-ЯЁа-яё-]+\s*,?/ig, ' ')
    .replace(w('(помещ'+C+'*|литер[аы]?|каб'+C+'*|комн'+C+'*)\\.?[^,]*'), ' ')      // офисный хвост
    .replace(/,?\s*оф(ис)?\.?\s*[^,]*/ig, ' ').replace(/,?\s*эт(аж)?\.?\s*\d[^,]*/ig, ' ').replace(/,?\s*кв\.?\s*\d[^,]*/ig, ' ')
    .replace(/\s+/g, ' ').replace(/^[,\s]+|[,\s]+$/g, '')
  // сокращения к единому виду (тоже через lookaround)
  const R = [['УЛ','ул.'],['ПЕР','пер.'],['ПРОСПЕКТ','просп.'],['ПР-?КТ','просп.'],['ШОССЕ','шоссе'],
    ['НАБ','наб.'],['БУЛЬВАР','бул.'],['Б-?Р','бул.'],['ТУП','тупик'],['ПЛ','пл.'],
    ['ДОМ','д.'],['Д','д.'],['СТРОЕНИЕ','стр.'],['СТР','стр.'],['КОРПУС','корп.'],['КОРП?','корп.']]
  for (const [from,to] of R) a = a.replace(w(from+'\\.?'), to)
  a = a.replace(/\s+/g,' ').replace(/\s*,\s*/g,', ').replace(/^[,\s]+|[,\s]+$/g,'')
  // капсовые названия улиц → Титул
  a = a.split(', ').map(part => /^(ул\.|пер\.|просп\.|шоссе|наб\.|бул\.|пл\.|тупик)/i.test(part) ? titleCase(part) : part).join(', ')
  a = a.charAt(0).toUpperCase() + a.slice(1)
  return a && a.length > 3 ? a : `г. ${cityName}`
}

// Имя школы. Берём содержимое кавычек; если это аббревиатура (согласные капсом,
// «ПЦО», «Мшдк»), пробуем осмысленную часть полного названия. Аббревиатуру-имя
// возвращаем как null — такую карточку лучше не заводить, чем с бессмысленным H1.
function isAcronym(n) {
  const w = n.replace(/[«»"]/g, '').trim()
  if (w.length <= 5 && !/\s/.test(w) && !/[аеёиоуыэюя]/i.test(w)) return true  // без гласных
  if (/^[А-ЯЁ]{2,6}$/.test(w)) return true                                     // сплошной капс без пробелов
  return false
}
function quoted(str) {
  // последняя пара кавычек (устойчиво к вложенным: «ОЦ «Перспектива»»)
  const all = [...str.matchAll(/[«"]([^«»"]{2,80})[»"]/g)].map(m => m[1].trim())
  return all.length ? all[all.length - 1] : null
}
function normName(n) {
  n = n.trim()
  if (n === n.toUpperCase()) n = titleCase(n)
  return n
}
function displayName(short, full) {
  const s2 = (short || '').replace(/\s+/g, ' ').trim()
  const f2 = (full  || '').replace(/\s+/g, ' ').trim()
  // 1) кавычки короткого имени
  let q = quoted(s2)
  if (q && !isAcronym(q)) return `«${normName(q)}»`
  // 2) кавычки полного имени
  let qf = quoted(f2)
  if (qf && !isAcronym(qf)) return `«${normName(qf)}»`
  // 3) полное имя без формы-префикса и «общеобразовательное учреждение» и т.п.
  let n = f2
    .replace(/^(частное|негосударственное|автономная|общеобразовательн\w*)\s+/i, '')
    .replace(/(частное|общеобразовательн\w*|учреждение|организация|некоммерческ\w*|автономн\w*|средн\w*|основн\w*|начальн\w*|школа|образовательн\w*)\s+/gi, '')
    .replace(/^[«"]|[»"]$/g, '').replace(/\s+/g, ' ').trim()
  if (n && n.length >= 5 && !isAcronym(n)) return normName(n)
  // 4) не удалось получить осмысленное имя
  return null
}


function detectType(name) {
  const n = name.toLowerCase()
  if (/гимназ/.test(n)) return 'gimnazii'
  if (/международн|british|international/.test(n)) return 'mezhdunarodnie'
  return 'chastnie'
}

const transliterate = s => s.toLowerCase().replace(/[а-яё]/g, c => ({
  а:'a',б:'b',в:'v',г:'g',д:'d',е:'e',ё:'e',ж:'zh',з:'z',и:'i',й:'y',к:'k',л:'l',м:'m',н:'n',о:'o',п:'p',р:'r',с:'s',т:'t',у:'u',ф:'f',х:'kh',ц:'ts',ч:'ch',ш:'sh',щ:'sch',ъ:'',ы:'y',ь:'',э:'e',ю:'yu',я:'ya',
}[c] ?? c))
const makeSlug = (name, citySlug) => (transliterate(name) + '-' + citySlug).replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 80)

// ── текущая база ──────────────────────────────────────────────────────────────
const jiti = createJiti(import.meta.url, { interopDefault: true })
const { schools } = await jiti.import(SCHOOLS_TS)
const existingSlugs = new Set(schools.map(s => s.slug))
const existingKeys  = new Set(schools.map(s => (s.name + '|' + s.region).toLowerCase().replace(/[«»"]/g, '').replace(/\s+/g, ' ').trim()))
const key = (name, region) => (name + '|' + region).toLowerCase().replace(/[«»"]/g, '').replace(/\s+/g, ' ').trim()

const esc = v => String(v ?? '').replace(/\\/g, '\\\\').replace(/'/g, "\\'")
function formatSchool(s) {
  const L = [
    `  {`, `    id: '${s.slug}',`, `    slug: '${s.slug}',`, `    name: '${esc(s.name)}',`,
    `    type: '${s.type}',`, `    region: '${s.region}',`, `    city: '${esc(s.city)}',`,
    `    address: '${esc(s.address)}',`, `    phone: '',`,
    `    description: '${esc(s.description)}',`, `    fullDescription: '${esc(s.fullDescription)}',`,
    `    grades: '${s.grades}',`, `    features: ${JSON.stringify(s.features)},`,
    `    rating: null,`, `    reviewCount: 0,`, `    priceFrom: ${s.priceFrom},`,
    `    imageAlt: '${esc(s.imageAlt)}',`, `  },`,
  ]
  return L.join('\n')
}

// ── сбор ──────────────────────────────────────────────────────────────────────
const picked = []
for (const t of TARGETS) {
  let lastPage = MAX_PAGES
  let added = 0
  for (let p = 1; p <= Math.min(MAX_PAGES, lastPage); p++) {
    let res
    try { res = await search(t.region, p) } catch (e) { process.stderr.write(`  ${t.name} стр${p}: ${e.message}\n`); await sleep(3000); continue }
    if (p === 1) lastPage = res.lastPage
    for (const r of res.rows) {
      if (STATE.test(r.name) || !PRIVATE.test(r.name) || NOT_SCHOOL.test(r.name)) continue
      let d
      try { d = await detail(r.id) } catch { await sleep(1500); continue }
      await sleep(450)
      if (!d.address || (d.status && !/действ/i.test(d.status))) continue
      if (NOT_SCHOOL.test(d.shortName || d.fullName || r.name)) continue

      const name = displayName(d.shortName, d.fullName || r.name)
      if (!name || name.replace(/[«»]/g,'').length < 5) continue
      const k = key(name, t.slug)
      if (existingKeys.has(k)) continue
      const slug = makeSlug(name, t.slug)
      if (existingSlugs.has(slug)) continue

      const type = detectType(name)
      const meta = TYPE_META[type]
      const address = cleanAddress(d.address, t.name)
      const { description, fullDescription } = makeDescriptions(name, type, t.name, t.nameIn, address, meta)
      picked.push({
        slug, name, type, region: t.slug, city: t.name, address,
        description, fullDescription, grades: meta.grades, features: meta.features,
        priceFrom: meta.priceFrom, imageAlt: `${name} — ${meta.label} ${t.nameIn}`,
      })
      existingKeys.add(k); existingSlugs.add(slug); added++
    }
    await sleep(650)
  }
  process.stderr.write(`${t.name}: +${added} частных школ (страниц в реестре: ${lastPage})\n`)
}

process.stderr.write(`\nВсего отобрано: ${picked.length}\n`)
picked.slice(0, 12).forEach(s => process.stderr.write(`  · [${s.type}] ${s.name} — ${s.address}\n`))

if (!DRY && picked.length) {
  let src = readFileSync(SCHOOLS_TS, 'utf8')
  const marker = '] as any[] as School[])'
  const idx = src.lastIndexOf(marker)
  const blocks = picked.map(formatSchool).join('\n')
  src = src.slice(0, idx) + blocks + '\n' + src.slice(idx)
  writeFileSync(SCHOOLS_TS, src, 'utf8')
  process.stderr.write('\n💾 schools.ts обновлён\n')
} else {
  process.stderr.write('\n🔍 DRY RUN — файл не менялся\n')
}
