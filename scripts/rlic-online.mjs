#!/usr/bin/env node
/**
 * rlic-online.mjs — онлайн-школы и центры дистанционного образования из реестра
 * лицензий Рособрнадзора.
 *
 * Онлайн-школа не привязана к городу, поэтому реестр обходим не по субъектам,
 * а поиском по названию по всей стране: «дистанционн общеобразовательн»,
 * «онлайн школа», «цифровая школа». Регион карточки определяем по юрадресу —
 * если город не наш, карточку пропускаем.
 *
 * Берём только статус «Действующая» (строго /^Действ/ — «Не действует» тоже
 * содержит «действ») и только общеобразовательные организации: автошколы,
 * школы программирования и языковые центры отсекаем.
 *
 * Запуск: node scripts/rlic-online.mjs [--dry] [--pages=6] [--json=out.json]
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
const MAX_PAGES = parseInt(args.pages ?? '6')

const QUERIES = ['дистанционн общеобразовательн', 'онлайн школа', 'онлайн-школа', 'цифровая школа', 'дистанционн образован школа']
const RELEVANT = /дистанцион|онлайн|цифров/i
const SCHOOLISH = /общеобразовательн|\bшкол|гимназ|лице[йя]|центр образован/i
// ⚠️ «ТАНЦ» без уточнения ловил «дисТАНЦионного» — отсекало ровно то, что ищем
const NOT_SCHOOL = /АВТОШКОЛ|ПРОГРАММИРОВАН|ЯЗЫКОВ|МУЗЫКАЛЬН|ХУДОЖЕСТВЕНН|ТАНЦЕВАЛЬН|ВОЖДЕНИ|ПАРИКМАХЕР|МАССАЖ|КУЛИНАР|ПРОФЕССИОНАЛЬН|\bДПО\b|ТЕХНИКУМ|КОЛЛЕДЖ|УНИВЕРСИТЕТ|ИНСТИТУТ|ДОШКОЛЬН|ДЕТСК.{0,3}САД|НЕФОРМАЛЬН/i

async function search(eoName, page) {
  const body = new URLSearchParams({ eoName, regNum: '', region: '', lo: '', status: '', expand: '', page: String(page), p: String(page) })
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
  return { shortName: f('Сокращенное наименование организации'), fullName: f('Полное наименование организации'), address: f('Место нахождения организации'), status: f('Текущий статус лицензии') }
}

function titleWord(w, i) { if (w.length <= 1) return w; const low = w.toLowerCase(); const SMALL = new Set(['на','в','во','по','и','с','к','о','от','до','для','при','из','за','над','под','у','им']); if (i > 0 && SMALL.has(low)) return low; if (w === w.toUpperCase() && /[А-ЯЁA-Z]/.test(w)) return w.charAt(0) + low.slice(1); return w }
function titleCase(s) { let i = 0; return s.split(/(\s+|-)/).map(t => /^[\s-]+$/.test(t) ? t : titleWord(t, i++)).join('') }

// имя: «ООО ОНЛАЙН-ШКОЛА "ТОЧКА ЗНАНИЙ"» → «Онлайн-школа «Точка знаний»»
function displayName(short, full) {
  const src = [full, short].filter(Boolean).map(x => x.replace(/\s+/g, ' ').trim())
  if (!src.length) return null
  const joined = src.join(' ')
  // аббревиатура — короткое слово без пробелов («КОШДО»), а не любое слово
  // капслоком: в реестре капслоком набрано и «МОСКОВСКАЯ ОНЛАЙН-ШКОЛА»
  const quoted = [...joined.matchAll(/[«"]([^«»"]{3,70})[»"]/g)].map(m => m[1].trim())
    .filter(q => /[аеёиоуыэюя]/i.test(q) && !(q.replace(/\s/g, '').length <= 8 && !/\s/.test(q) && q === q.toUpperCase()))
  const kind = /дистанцион/i.test(joined) && /центр/i.test(joined) ? 'Центр дистанционного образования'
    : /гимназ/i.test(joined) ? 'Онлайн-гимназия'
    : /лице[йя]/i.test(joined) ? 'Онлайн-лицей'
    : 'Онлайн-школа'
  if (quoted.length) {
    const q = quoted[quoted.length - 1]
    return /школ|гимназ|лице|центр|образован/i.test(q) ? titleCase(q) : `${kind} «${titleCase(q)}»`
  }
  // организационно-правовая шелуха идёт цепочкой («государственное бюджетное
  // общеобразовательное учреждение …») — снимаем по слову, пока снимается
  let n = src[0]
  const OPF = /^(государственн\w*|муниципальн\w*|краев\w*|областн\w*|частн\w*|автономн\w*|общеобразовательн\w*|образовательн\w*|бюджетн\w*|казенн\w*|казённ\w*|некоммерческ\w*|организация|учреждение|среднего|основного|общего|образования|среднее|региональн\w*)\s+/i
  while (OPF.test(n)) n = n.replace(OPF, '')
  n = n.replace(/\s{2,}/g, ' ').replace(/^[«"]|[»"]$/g, '').trim()
  return n.length >= 8 ? titleCase(n) : kind
}

function cleanAddress(raw, cityName) {
  if (!raw || raw === '-') return `г. ${cityName}`
  let a = ' ' + raw + ' '
  a = a.replace(/(^|,)\s*\d{5,6}\s*,?/g, ',').replace(/Росси(я|йская Федерация)\s*,?/ig, ' ')
    .replace(/[А-ЯЁа-яё-]+\s+(область|обл\.?|край)\s*,?/ig, ' ')
    .replace(/(область|обл\.?|край)\s+[А-ЯЁа-яё-]+\s*,?/ig, ' ')
    .replace(/Республик[аи]\s+[А-ЯЁа-яё-]+\s*,?/ig, ' ')
    .replace(/[А-ЯЁа-яё-]+\s+район[а-яё]*\s*,?/ig, ' ')
    .replace(/г(ород)?\.?\s*[А-ЯЁ][А-ЯЁа-яё-]*\s*,?/g, ' ')
    .replace(/,?\s*(помещ|литер|каб|комн|ком|оф(ис)?|эт(аж)?|кв)\.?[^,]*/ig, ' ')
    .replace(/г\.?\s*о\.?\s+[А-ЯЁа-яё-]+\s*,?/ig, ' ')
    .replace(/вн\.?\s*(тер\.?\s*г\.?|р-н)[^,]*,?/ig, ' ')
    .replace(/муниципальн\w*\s+округ\w*[^,]*,?/ig, ' ')
    .replace(/\s+/g, ' ').replace(/^[,\s]+|[,\s]+$/g, '')
  const R = [['УЛИЦА','ул.'],['УЛ','ул.'],['ПЕРЕУЛОК','пер.'],['ПЕР','пер.'],['ПРОСПЕКТ','просп.'],['ПР-?КТ','просп.'],['ШОССЕ','шоссе'],['НАБЕРЕЖНАЯ','наб.'],['НАБ','наб.'],['БУЛЬВАР','бул.'],['ПЛОЩАДЬ','пл.'],['ДОМ','д.'],['Д','д.'],['СТРОЕНИЕ','стр.'],['СТР','стр.'],['КОРПУС','корп.']]
  for (const [from, to] of R) a = a.replace(new RegExp('(?<![А-ЯЁа-яё])' + from + '\\.?(?![А-ЯЁа-яё])', 'ig'), to)
  a = a.replace(/\s*,\s*/g, ', ').replace(/\s+/g, ' ').replace(/^[,\s.]+|[,\s]+$/g, '')
  a = a.split(', ').map(p => /^(ул\.|пер\.|просп\.|шоссе|наб\.|бул\.|пл\.)/i.test(p) ? titleCase(p) : p).join(', ')
  a = a.replace(/,\s*(\d+\s*[а-яё]?(\s*[/-]\s*\d+[а-яё]?)?)\s*$/i, (m, n) => `, д. ${n.replace(/\s+/g, '')}`)
  if (!/[А-ЯЁа-яё]{3,}/.test(a.replace(/^(ул\.|пер\.|просп\.|наб\.|бул\.|пл\.)/i, ''))) return `г. ${cityName}`
  return a.length > 5 ? a.charAt(0).toUpperCase() + a.slice(1) : `г. ${cityName}`
}

const translit = s => s.toLowerCase().replace(/[а-яё]/g, c => ({а:'a',б:'b',в:'v',г:'g',д:'d',е:'e',ё:'e',ж:'zh',з:'z',и:'i',й:'y',к:'k',л:'l',м:'m',н:'n',о:'o',п:'p',р:'r',с:'s',т:'t',у:'u',ф:'f',х:'kh',ц:'ts',ч:'ch',ш:'sh',щ:'sch',ъ:'',ы:'y',ь:'',э:'e',ю:'yu',я:'ya'}[c] ?? c))
const makeSlug = (name, citySlug) => (translit(name) + '-' + citySlug).replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 80)

const jiti = createJiti(import.meta.url, { interopDefault: true })
const { schools, regionSlugs, regionLabels, regionLabelsIn } = await jiti.import(SCHOOLS_TS)
const existingSlugs = new Set(schools.map(s => s.slug))
const key = (name, region) => (name + '|' + region).toLowerCase().replace(/[«»"]/g, '').replace(/\s+/g, ' ').trim()
const existingKeys = new Set(schools.map(s => key(s.name, s.region)))

// «город из адреса» → наш регион: города длиннее сначала, чтобы «Нижний Новгород»
// не схлопнулся в «Новгород»
const REGION_BY_CITY = regionSlugs
  .map(slug => [slug, regionLabels[slug]])
  .filter(([, label]) => label)
  .sort((a, b) => b[1].length - a[1].length)

function assignRegion(addr) {
  const low = (addr || '').toLowerCase().replace(/ё/g, 'е')
    .replace(/[а-я-]+(ская|ский|ской|цкая|цкий)\s+(область|обл\.?|край|республика)/g, ' ')
    .replace(/[а-я-]+\s+район[а-я]*/g, ' ')
  for (const [slug, label] of REGION_BY_CITY) {
    const n = label.toLowerCase().replace(/ё/g, 'е')
    if (new RegExp(n.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') + '(?![а-я])', 'i').test(low)) return { slug, name: label }
  }
  return null
}

const esc = v => String(v ?? '').replace(/\\/g, '\\\\').replace(/'/g, "\\'")
const fmt = s => [`  {`, `    id: '${s.slug}',`, `    slug: '${s.slug}',`, `    name: '${esc(s.name)}',`, `    type: '${s.type}',`, `    region: '${s.region}',`, `    city: '${esc(s.city)}',`, `    address: '${esc(s.address)}',`, `    phone: '',`, `    description: '${esc(s.description)}',`, `    fullDescription: '${esc(s.fullDescription)}',`, `    grades: '${s.grades}',`, `    features: ${JSON.stringify(s.features)},`, `    rating: null,`, `    reviewCount: 0,`, `    priceFrom: ${s.priceFrom},`, `    imageAlt: '${esc(s.imageAlt)}',`, `  },`].join('\n')

const picked = []
const ids = new Map()
for (const q of QUERIES) {
  let last = MAX_PAGES
  for (let p = 1; p <= Math.min(MAX_PAGES, last); p++) {
    let r; try { r = await search(q, p) } catch { await sleep(2500); continue }
    if (p === 1) last = r.lastPage
    for (const row of r.rows) {
      if (NOT_SCHOOL.test(row.name) || !RELEVANT.test(row.name) || !SCHOOLISH.test(row.name)) continue
      ids.set(row.id, row.name)
    }
    await sleep(400)
  }
  process.stderr.write(`запрос «${q}»: накоплено ${ids.size}\n`)
}

const idList = [...ids.keys()]
const rowNames = [...ids.values()]   // в карточке реестра fullName часто пуст
const details = new Array(idList.length)
let cursor = 0
await Promise.all(Array.from({ length: 6 }, async () => {
  while (cursor < idList.length) {
    const my = cursor++
    try { details[my] = await detail(idList[my]) } catch { details[my] = null }
  }
}))

let dead = 0, noCity = 0
for (const [i, d] of details.entries()) {
  if (!d) continue
  if (!d.status || !/^Действ/i.test(d.status.trim())) { dead++; continue }
  // в детальной карточке полное название часто пустое, а короткое — аббревиатура
  // («ГБОУ КОШДО»): берём название из строки поиска как основной источник
  const full = d.fullName || rowNames[i]
  const joined = [d.shortName, full].filter(Boolean).join(' ')
  if (NOT_SCHOOL.test(joined) || !RELEVANT.test(joined) || !SCHOOLISH.test(joined)) continue
  const reg = assignRegion(d.address); if (!reg) { noCity++; continue }
  const name = displayName(d.shortName, full); if (!name) continue
  const k = key(name, reg.slug); if (existingKeys.has(k)) continue
  const slug = makeSlug(name, reg.slug); if (existingSlugs.has(slug)) continue
  const meta = TYPE_META.online
  const address = cleanAddress(d.address, reg.name)
  const nameIn = regionLabelsIn[reg.slug] || `в ${reg.name}`
  const { description, fullDescription } = makeDescriptions(name, 'online', reg.name, nameIn, address, meta)
  picked.push({ slug, name, type: 'online', region: reg.slug, city: reg.name, address, description, fullDescription, grades: meta.grades, features: meta.features, priceFrom: meta.priceFrom, imageAlt: `${name} — онлайн-школа ${nameIn}` })
  existingKeys.add(k); existingSlugs.add(slug)
}

process.stderr.write(`\nОтобрано: ${picked.length} (закрытых ${dead}, город не наш ${noCity})\n`)
picked.forEach(s => process.stderr.write(`  · ${s.name} — ${s.city} — ${s.address}\n`))
if (args.json) writeFileSync(String(args.json), JSON.stringify(picked, null, 1), 'utf8')

if (!DRY && picked.length) {
  let src = readFileSync(SCHOOLS_TS, 'utf8')
  const marker = '] as any[] as School[])', idx = src.lastIndexOf(marker)
  writeFileSync(SCHOOLS_TS, src.slice(0, idx) + picked.map(fmt).join('\n') + '\n' + src.slice(idx), 'utf8')
  process.stderr.write('\n💾 schools.ts обновлён\n')
} else process.stderr.write('\n🔍 DRY — файл не менялся\n')
