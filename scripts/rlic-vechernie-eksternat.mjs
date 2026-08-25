#!/usr/bin/env node
/**
 * rlic-vechernie-eksternat.mjs — вечерние (сменные) и открытые (сменные) школы
 * из реестра лицензий Рособрнадзора по всем нашим городам.
 *
 * Зачем: экстернат и вечернее обучение — это формы получения образования, а не
 * отдельный вид организации, поэтому ни OSM, ни «частные» запросы реестра их не
 * дают. Но по закону экстернов (самообразование + аттестация) принимают именно
 * открытые (сменные) школы и центры образования, а вечернюю форму — вечерние
 * (сменные). Их в реестре видно по названию.
 *
 * Тип карточки: «открытая (сменная)» → eksternal, «вечерняя (сменная)» → vechernie.
 *
 * ⚠️ В реестре очень много закрытых школ (вечерние массово ликвидировали).
 * Берём ТОЛЬКО статус «Действующая» — причём проверка строгая: /^Действ/,
 * потому что подстрока «действ» есть и в «Не действует».
 *
 * Названия почти всегда аббревиатуры («МБОУ «ВСОШ № 17»») — расшифровываем
 * в человекочитаемое «Вечерняя (сменная) школа № 17».
 *
 * Запуск: node scripts/rlic-vechernie-eksternat.mjs [--dry] [--only=34] [--pages=12]
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
const args = Object.fromEntries(process.argv.slice(2).filter(a => a.startsWith('--')).map(a => { const [k, ...v] = a.slice(2).split('='); return [k, v.join('=') || true] }))
const DRY = Boolean(args.dry)
const ONLY = args.only ? String(args.only) : null
const CODES = args.codes ? String(args.codes).split(',') : null
const MAX_PAGES = parseInt(args.pages ?? '12')

// карта «код субъекта → наши города» переиспользуется из rlic-all-cities
const { SUBJECTS } = await import('./lib/rf-subjects.mjs')

const QUERIES = ['открытая сменная общеобразовательн', 'вечерн общеобразовательн']
// имя должно указывать на вечернюю/открытую школу, иначе это просто СОШ
const RELEVANT = /вечерн|открыт|в\s*\(\s*с\s*\)\s*ош|всош|всш|о\s*\(\s*с\s*\)\s*ош|осош|осш|\bвш\b|\bв\(с\)ш\b/i
const NOT_SCHOOL = /ДОШКОЛЬН|ДЕТСК.{0,3}САД|ДОПОЛНИТЕЛЬН.{0,20}ПРОФЕССИ|ПРОФЕССИОНАЛЬН|\bДПО\b|ВЫСШЕГО ОБРАЗОВ|УНИВЕРСИТЕТ|ИНСТИТУТ|АКАДЕМИЯ|КОЛЛЕДЖ|ТЕХНИКУМ|УЧИЛИЩ|АВТОШКОЛ|СПОРТИВН/i
// открытая (сменная) школа принимает экстернов — это наш тип eksternal
const OPEN = /открыт|о\s*\(\s*с\s*\)\s*ош|осош|\bосш\b/i

async function search(region, eoName, page) {
  const body = new URLSearchParams({ eoName, regNum: '', region, lo: '', status: '', expand: '', page: String(page), p: String(page) })
  const res = await fetch(`${BASE}/search`, { method: 'POST', headers: { 'User-Agent': UA, 'X-Requested-With': 'XMLHttpRequest', 'Referer': `${BASE}/rlic/`, 'Content-Type': 'application/x-www-form-urlencoded' }, body, signal: AbortSignal.timeout(40000) })
  const html = await res.text()
  const rows = [...html.matchAll(/<a href="\/view\/(\d+)"[^>]*>([^<]+)<\/a>/g)].map(m => ({ id: m[1], name: m[2].trim() }))
  const lastPage = Math.max(1, ...[...html.matchAll(/pager__link[^>]*>(\d+)</g)].map(m => +m[1]))
  return { rows, lastPage }
}
async function detail(id) {
  const res = await fetch(`${BASE}/view/${id}`, { headers: { 'User-Agent': UA }, signal: AbortSignal.timeout(40000) })
  const h = await res.text()
  const f = label => { const m = h.match(new RegExp(label + '<\\/label><div class="form-field[^"]*">([^<]+)<', 'i')); return m ? m[1].replace(/\s+/g, ' ').trim() : null }
  return { shortName: f('Сокращенное наименование организации'), fullName: f('Полное наименование организации'), inn: f('ИНН'), address: f('Место нахождения организации'), status: f('Текущий статус лицензии') }
}

// ── адрес ────────────────────────────────────────────────────────────────────
function titleWord(w, i) { if (w.length <= 1) return w; const low = w.toLowerCase(); const SMALL = new Set(['на','в','во','по','и','с','к','о','от','до','для','при','из','за','над','под','у','им']); if (i > 0 && SMALL.has(low)) return low; if (w === w.toUpperCase() && /[А-ЯЁA-Z]/.test(w)) return w.charAt(0) + low.slice(1); return w }
function titleCase(s) { let i = 0; return s.split(/(\s+|-)/).map(t => /^[\s-]+$/.test(t) ? t : titleWord(t, i++)).join('') }
function cleanAddress(raw, cityName) {
  if (!raw || raw === '-') return `г. ${cityName}`
  const NB = '(?<![А-ЯЁа-яё])', NA = '(?![А-ЯЁа-яё])', C = '[А-ЯЁа-яё]'
  const w = body => new RegExp(NB + body + NA, 'ig')
  let a = ' ' + raw + ' '
  a = a.replace(/(^|,)\s*\d{5,6}\s*,?/g, ',').replace(/Росси(я|йская Федерация)\s*,?/ig, ' ')
    .replace(/(область|обл\.?|край)\s+[А-ЯЁа-яё-]+\s*,?/ig, ' ')
    .replace(/[А-ЯЁа-яё-]+\s+(область|обл\.|край)\s*,?/ig, ' ')
    .replace(/Республик[аи]\s+[А-ЯЁа-яё-]+\s*,?/ig, ' ')
    .replace(/[А-ЯЁа-яё-]+\s+автономн[а-яё]*\s+округ[а-яё]*\s*,?/ig, ' ')
    .replace(/[А-ЯЁа-яё-]+\s+район[а-яё]*\s*,?/ig, ' ')
    .replace(w('г(ород)?\\.?\\s*' + C + '[А-ЯЁа-яё-]*\\s*,?'), m => /обл|край|район/i.test(m) ? m : ' ')
    .replace(/ВН\.?\s*ТЕР\.?\s*Г\.?\s*/ig, ' ')
    .replace(w('(помещ' + C + '*|литер[аы]?|каб' + C + '*|комн' + C + '*)\\.?[^,]*'), ' ')
    .replace(/,?\s*оф(ис)?\.?\s*[^,]*/ig, ' ').replace(/,?\s*кв\.?\s*\d[^,]*/ig, ' ')
    .replace(/\s+/g, ' ').replace(/^[,\s]+|[,\s]+$/g, '')
  const R = [['УЛИЦА','ул.'],['УЛ','ул.'],['ПЕРЕУЛОК','пер.'],['ПЕР','пер.'],['ПРОСПЕКТ','просп.'],['ПР-?КТ','просп.'],['ШОССЕ','шоссе'],['НАБЕРЕЖНАЯ','наб.'],['НАБ','наб.'],['БУЛЬВАР','бул.'],['Б-?Р','бул.'],['ПЛОЩАДЬ','пл.'],['ПЛ','пл.'],['ДОМ','д.'],['Д','д.'],['СТРОЕНИЕ','стр.'],['СТР','стр.'],['КОРПУС','корп.'],['КОРП?','корп.']]
  for (const [from, to] of R) a = a.replace(w(from + '\\.?'), to)
  a = a.replace(/,\s*\.\s*/g, ', ').replace(/\s+\./g, ',').replace(/\s+/g, ' ').replace(/\s*,\s*/g, ', ').replace(/^[,\s]+|[,\s]+$/g, '')
  a = a.split(', ').map(p => /^(ул\.|пер\.|просп\.|шоссе|наб\.|бул\.|пл\.)/i.test(p) ? titleCase(p) : p).join(', ')
  a = a.replace(/^[.\s,]+/, '').replace(/\s{2,}/g, ' ').trim()
  // номер дома без «д.» в конце («ул. Ленина, 39») — приводим к нашему формату
  a = a.replace(/,\s*(\d+\s*[а-яё]?(\s*[/-]\s*\d+[а-яё]?)?)\s*$/i, (m, n) => `, д. ${n.replace(/\s+/g, '')}`)
  // у составных названий («г. Набережные Челны») зачистка съедает только первое
  // слово — убираем оставшийся хвост города из начала адреса
  const cityWords = cityName.toLowerCase().replace(/ё/g, 'е').split(/[\s-]+/)
  a = a.split(', ').filter((part, i) => !(i === 0 && cityWords.includes(part.toLowerCase().replace(/ё/g, 'е')))).join(', ')
  // выродившийся адрес вида «Ул. д.28» — улицы нет, лучше просто город
  if (/^(ул\.|пер\.|просп\.|наб\.|бул\.|пл\.)\s*,?\s*д\./i.test(a) || !/[А-ЯЁа-яё]{3,}/.test(a.replace(/^(ул\.|пер\.|просп\.|наб\.|бул\.|пл\.)/i, ''))) return `г. ${cityName}`
  return (a && a.length > 5) ? a.charAt(0).toUpperCase() + a.slice(1) : `г. ${cityName}`
}

// ── название: аббревиатуры реестра → человекочитаемое ────────────────────────
function displayName(short, full) {
  const src = [short, full].filter(Boolean).map(x => x.replace(/\s+/g, ' ').trim())
  if (!src.length) return null
  // приоритет — тому варианту, где есть «вечерн/открыт» словами
  const spelled = src.find(x => /вечерн|открыт/i.test(x))
  const num = (src.join(' ').match(/№\s*(\d+[А-Яа-яA-Za-z]?)/) || [])[1]
    || (src.join(' ').match(/\bШКОЛА\s+(\d{1,3})\b/i) || [])[1] || null
  const joined = src.join(' ')
  const isOpen = OPEN.test(joined)
  const kind = isOpen ? 'Открытая (сменная) школа' : 'Вечерняя (сменная) школа'

  // если есть «фирменное» название в кавычках и это не аббревиатура — берём его
  const quoted = [...joined.matchAll(/[«"]([^«»"]{4,60})[»"]/g)].map(m => m[1].trim())
    .filter(q => /[аеёиоуыэюя]/i.test(q) && !/^[А-ЯЁ()\s№\d-]+$/.test(q))
    // «В(с)ОШ № 5», «ВСОШ ЗМР» — это те же аббревиатуры, только в кавычках
    .filter(q => !/^[А-ЯЁ]\(?[а-яё]?\)?[А-ЯЁ]{2,}/.test(q.replace(/\s+/g, ' ')))
    .filter(q => q.split(/\s+/).every(w => !/^[А-ЯЁ]{3,}$/.test(w)) || /[а-яё]{4,}/.test(q))
  if (quoted.length) {
    const q = quoted[quoted.length - 1]
    return /школ|гимназ|лице|центр|образован/i.test(q) ? titleCase(q) : `${kind} «${titleCase(q)}»`
  }
  // «Центр образования» — самостоятельный вид, не переименовываем в школу
  if (/центр образован/i.test(joined) || /\bЦО\b/.test(joined)) {
    return num ? `Центр образования № ${num}` : 'Центр образования'
  }
  if (spelled && !num) {
    // разворачиваем полное название, срезая организационно-правовую шелуху
    const n = spelled
      .replace(/^(муниципальное|государственное|казенное|казённое|бюджетное|автономное|общеобразовательное|образовательное|учреждение|организация|среднее|средняя|основное|основная)\s+/gi, '')
      .replace(/\s{2,}/g, ' ').trim()
    if (n.length >= 8) return titleCase(n)
  }
  return num ? `${kind} № ${num}` : kind
}

const translit = s => s.toLowerCase().replace(/[а-яё]/g, c => ({а:'a',б:'b',в:'v',г:'g',д:'d',е:'e',ё:'e',ж:'zh',з:'z',и:'i',й:'y',к:'k',л:'l',м:'m',н:'n',о:'o',п:'p',р:'r',с:'s',т:'t',у:'u',ф:'f',х:'kh',ц:'ts',ч:'ch',ш:'sh',щ:'sch',ъ:'',ы:'y',ь:'',э:'e',ю:'yu',я:'ya'}[c] ?? c))
const makeSlug = (name, citySlug) => (translit(name) + '-' + citySlug).replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 80)

// адрес указывает на сельский населённый пункт того же субъекта — это не наш город
const RURAL = /(рабочий\s+пос[её]лок|\bпос[её]лок\b|\bпгт\b|\bс\.\s|\bсело\b|\bдеревня\b|\bд\.\s*[А-ЯЁ][а-яё]+\s*,|\bстаница\b|\bхутор\b|\bаул\b)/i

function assignCity(subj, addr) {
  if (subj.whole) return { slug: subj.whole, name: subj.name }
  // «Новосибирская область» содержит подстроку «новосибирск» — без этой зачистки
  // сельские школы всего субъекта прилипали к областному центру
  const low = (addr || '').toLowerCase().replace(/ё/g, 'е')
    .replace(/[а-я-]+(ская|ский|ской|цкая|цкий)\s+(область|обл\.?|край|республика|автономн[а-я]*\s+округ)/g, ' ')
    .replace(/республик[аи]\s+[а-я-]+/g, ' ')
    .replace(/[а-я-]+\s+район[а-я]*/g, ' ')
  if (RURAL.test(low)) return null
  const sorted = [...subj.cities].sort((a, b) => b[1].length - a[1].length)
  for (const [slug, name] of sorted) {
    const n = name.toLowerCase().replace(/ё/g, 'е')
    // имя города не должно быть началом прилагательного («Курск» ≠ «Курская»)
    const re = new RegExp(n.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') + '(?![а-я])', 'i')
    if (re.test(low)) return { slug, name }
  }
  return null
}

// ── база ─────────────────────────────────────────────────────────────────────
const jiti = createJiti(import.meta.url, { interopDefault: true })
const { schools, regionLabelsIn } = await jiti.import(SCHOOLS_TS)
const existingSlugs = new Set(schools.map(s => s.slug))
const key = (name, region) => (name + '|' + region).toLowerCase().replace(/[«»"]/g, '').replace(/\s+/g, ' ').trim()
const existingKeys = new Set(schools.map(s => key(s.name, s.region)))
// адресный дедуп — одна и та же школа могла попасть под разными названиями
const addrKey = (a, r) => (a || '').toLowerCase().replace(/ё/g, 'е').replace(/[^а-я0-9]/g, '') + '|' + r
const existingAddrs = new Set(schools.filter(s => s.address).map(s => addrKey(s.address, s.region)))

const esc = v => String(v ?? '').replace(/\\/g, '\\\\').replace(/'/g, "\\'")
function fmt(s) {
  return [`  {`, `    id: '${s.slug}',`, `    slug: '${s.slug}',`, `    name: '${esc(s.name)}',`, `    type: '${s.type}',`, `    region: '${s.region}',`, `    city: '${esc(s.city)}',`, `    address: '${esc(s.address)}',`, `    phone: '',`, `    description: '${esc(s.description)}',`, `    fullDescription: '${esc(s.fullDescription)}',`, `    grades: '${s.grades}',`, `    features: ${JSON.stringify(s.features)},`, `    rating: null,`, `    reviewCount: 0,`, `    priceFrom: ${s.priceFrom},`, `    imageAlt: '${esc(s.imageAlt)}',`, `  },`].join('\n')
}

let subs = SUBJECTS
if (ONLY) subs = subs.filter(s => s.code === ONLY)
if (CODES) subs = subs.filter(s => CODES.includes(s.code))

const picked = []
const perCity = {}
// --from=<json> — записать в каталог готовую выгрузку, обход реестра не нужен
if (args.from) subs = []
for (const [i, subj] of subs.entries()) {
  const label = subj.whole || subj.cities.map(c => c[1]).join('/')
  const ids = new Map()
  for (const q of QUERIES) {
    let last = MAX_PAGES
    for (let p = 1; p <= Math.min(MAX_PAGES, last); p++) {
      let r; try { r = await search(subj.code, q, p) } catch { await sleep(2500); continue }
      if (p === 1) last = r.lastPage
      for (const row of r.rows) {
        if (NOT_SCHOOL.test(row.name)) continue
        if (!RELEVANT.test(row.name)) continue
        ids.set(row.id, row.name)
      }
      await sleep(400)
    }
  }
  // карточки тянем пулом по 6 — последовательно один субъект занимал ~2,5 мин,
  // на 77 субъектах это часы. Реестр такую нагрузку держит спокойно.
  const idList = [...ids.keys()]
  const details = new Array(idList.length)
  let cursor = 0
  await Promise.all(Array.from({ length: 6 }, async () => {
    while (cursor < idList.length) {
      const my = cursor++
      try { details[my] = await detail(idList[my]) } catch { details[my] = null }
    }
  }))

  let added = 0, dead = 0
  for (const d of details) {
    if (!d) continue
    // ВАЖНО: «Не действует» тоже содержит «действ» — проверяем начало строки
    if (!d.status || !/^Действ/i.test(d.status.trim())) { dead++; continue }
    if (!d.address || d.address === '-') continue
    const joined = [d.shortName, d.fullName].filter(Boolean).join(' ')
    if (NOT_SCHOOL.test(joined) || !RELEVANT.test(joined)) continue
    const city = assignCity(subj, d.address); if (!city) continue
    const name = displayName(d.shortName, d.fullName); if (!name) continue
    const k = key(name, city.slug); if (existingKeys.has(k)) continue
    const address = cleanAddress(d.address, city.name)
    const ak = addrKey(address, city.slug); if (existingAddrs.has(ak)) continue
    const slug = makeSlug(name, city.slug); if (existingSlugs.has(slug)) continue
    const type = OPEN.test(joined) ? 'eksternal' : 'vechernie'
    const meta = TYPE_META[type]
    const nameIn = regionLabelsIn[city.slug] || `в ${city.name}`
    const { description, fullDescription } = makeDescriptions(name, type, city.name, nameIn, address, meta)
    picked.push({ slug, name, type, region: city.slug, city: city.name, address, description, fullDescription, grades: meta.grades, features: meta.features, priceFrom: meta.priceFrom, imageAlt: `${name} — ${meta.label} ${nameIn}` })
    existingKeys.add(k); existingSlugs.add(slug); existingAddrs.add(ak)
    perCity[city.slug] = (perCity[city.slug] || 0) + 1; added++
  }
  process.stderr.write(`[${i + 1}/${subs.length}] субъект ${subj.code} (${label}): +${added} (закрытых пропущено ${dead})\n`)
}

process.stderr.write(`\nВсего отобрано: ${picked.length}\n`)
process.stderr.write('по городам: ' + Object.entries(perCity).sort((a, b) => b[1] - a[1]).map(([c, n]) => `${c}:${n}`).join(', ') + '\n')
picked.slice(0, 15).forEach(s => process.stderr.write(`  · [${s.type}] ${s.name} — ${s.city} — ${s.address}\n`))

// --json=path — выгрузить отобранное на ревью до записи в каталог
if (args.json) { writeFileSync(String(args.json), JSON.stringify(picked, null, 1), 'utf8'); process.stderr.write(`\n📄 выгружено в ${args.json}\n`) }
// --from=path — записать в каталог ранее отревьюенную выгрузку
if (args.from) { picked.length = 0; picked.push(...JSON.parse(readFileSync(String(args.from), 'utf8'))) }

if (!DRY && picked.length) {
  let src = readFileSync(SCHOOLS_TS, 'utf8')
  const marker = '] as any[] as School[])', idx = src.lastIndexOf(marker)
  src = src.slice(0, idx) + picked.map(fmt).join('\n') + '\n' + src.slice(idx)
  writeFileSync(SCHOOLS_TS, src, 'utf8')
  process.stderr.write('\n💾 schools.ts обновлён\n')
} else process.stderr.write('\n🔍 DRY — файл не менялся\n')
