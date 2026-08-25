#!/usr/bin/env node
/**
 * rlic-all-cities.mjs — частные/гимназии/международные школы из реестра Рособрнадзора
 * по ВСЕМ нашим городам (кроме 3 федеральных — они добраны rlic-schools.mjs).
 *
 * Реестр ищет по всем словам названия сразу, поэтому «частное общеобразовательное»
 * сужает выдачу субъекта с сотен страниц до 2–3 (только частные). На субъект гоняем
 * три запроса (частное / автономная / негосударственное + «общеобразовательн»),
 * дедуп по id карточки. Дальше карточка /view/{id}: юрназвание, адрес, ИНН, статус.
 *
 * Один субъект РФ = несколько наших городов (напр. Свердловская обл → Екатеринбург,
 * Нижний Тагил, Первоуральск, Каменск-Уральский). Каждую школу привязываем к городу
 * по адресу; если это не наш город — пропускаем.
 *
 * Запуск: node scripts/rlic-all-cities.mjs [--dry] [--only=66] [--pages=20]
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
const CODES = args.codes ? String(args.codes).split(',') : null   // --codes=27,56,...
const MAX_PAGES = parseInt(args.pages ?? '20')

const { SUBJECTS } = await import('./lib/rf-subjects.mjs')

const QUERIES = ['частное общеобразовательн', 'автономная общеобразовательн', 'негосударственн общеобразовательн']
const STATE = /ГБОУ|ГАОУ|МБОУ|МАОУ|МКОУ|\bМОУ\b|ГБПОУ|ГОСУДАРСТВЕНН|МУНИЦИПАЛЬН|БЮДЖЕТН|КАЗ[ЕЁ]НН/i
const PRIVATE = /ЧАСТН|НЕГОСУДАРСТВЕНН|АВТОНОМН.{0,20}НЕКОММЕРЧ|\bАНО\b|\bОАНО\b|\bОЧУ\b|\bЧОУ\b|\bНОУ\b|\bНОЧУ\b|\bЧУ\b|\bЧУОО\b/i
const NOT_SCHOOL = /ДОШКОЛЬН|ДЕТСК.{0,3}САД|ДОПОЛНИТЕЛЬН.{0,20}ПРОФЕССИ|ПРОФЕССИОНАЛЬН|\bДПО\b|ВЫСШЕГО ОБРАЗОВ|УНИВЕРСИТЕТ|ИНСТИТУТ|АКАДЕМИЯ|КОЛЛЕДЖ|ТЕХНИКУМ|ПАРИКМАХЕР|НОГТЕВ|МАССАЖ|ИНВЕСТОР|АВТОШКОЛ|УЧЕБНЫЙ ЦЕНТР/i

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

// ── нормализация (проверенная в rlic-schools) ────────────────────────────────
function titleWord(w, i) { if (w.length <= 1) return w; const low = w.toLowerCase(); const SMALL = new Set(['на','в','во','по','и','с','к','о','от','до','для','при','из','за','над','под','у']); if (i > 0 && SMALL.has(low)) return low; if (w === w.toUpperCase() && /[А-ЯЁA-Z]/.test(w)) return w.charAt(0) + low.slice(1); return w }
function titleCase(s) { let i = 0; return s.split(/(\s+|-)/).map(t => /^[\s-]+$/.test(t) ? t : titleWord(t, i++)).join('') }
function cleanAddress(raw, cityName) {
  if (!raw) return `г. ${cityName}`
  const NB = '(?<![А-ЯЁа-яё])', NA = '(?![А-ЯЁа-яё])', C = '[А-ЯЁа-яё]'
  const w = body => new RegExp(NB + body + NA, 'ig')
  let a = ' ' + raw + ' '
  a = a.replace(/(^|,)\s*\d{5,6}\s*,?/g, ',').replace(/Российская Федерация\s*,?/ig, ' ')
    .replace(/[А-ЯЁа-яё-]+\s+(область|край)\s*,?/ig, ' ')
    .replace(/Республик[аи]\s+[А-ЯЁа-яё-]+\s*,?/ig, ' ')
    .replace(/[А-ЯЁа-яё-]+\s+автономн[а-яё]*\s+округ[а-яё]*\s*,?/ig, ' ')
    .replace(w('г(ород)?\\.?\\s*' + C + '[А-ЯЁа-яё-]*\\s*,?'), m => /обл|край|район/i.test(m) ? m : ' ')
    .replace(/ВН\.?\s*ТЕР\.?\s*Г\.?\s*/ig, ' ')
    .replace(/муниципальн[а-яё]*\s+округ[а-яё]*\s*(№\s*\d+|[А-ЯЁа-яё-]+)?\s*,?/ig, ' ')
    .replace(w('поселени' + C + '*\\s+' + C + '[А-ЯЁа-яё-]*\\s*,?'), ' ')
    .replace(w('(населенный пункт\\s+)?(деревня|пос[её]лок|село|рабочий пос[её]лок)\\s+' + C + '[А-ЯЁа-яё-]*\\s*,?'), ' ')
    .replace(/\bж\/?к\s+[А-ЯЁа-яё-]+\s*,?/ig, ' ')
    .replace(w('(помещ' + C + '*|литер[аы]?|каб' + C + '*|комн' + C + '*)\\.?[^,]*'), ' ')
    .replace(/,?\s*оф(ис)?\.?\s*[^,]*/ig, ' ').replace(/,?\s*эт(аж)?\.?\s*\d[^,]*/ig, ' ').replace(/,?\s*кв\.?\s*\d[^,]*/ig, ' ')
    .replace(/\s+/g, ' ').replace(/^[,\s]+|[,\s]+$/g, '')
  const R = [['УЛ','ул.'],['ПЕР','пер.'],['ПРОСПЕКТ','просп.'],['ПР-?КТ','просп.'],['ШОССЕ','шоссе'],['НАБ','наб.'],['БУЛЬВАР','бул.'],['Б-?Р','бул.'],['ТУП','тупик'],['ПЛ','пл.'],['ДОМ','д.'],['Д','д.'],['СТРОЕНИЕ','стр.'],['СТР','стр.'],['КОРПУС','корп.'],['КОРП?','корп.']]
  for (const [from, to] of R) a = a.replace(w(from + '\\.?'), to)
  a = a.replace(/\bдвлд\.?|\bвлд\.?|\bд\/вл\.?/gi, 'д.').replace(/,\s*\.\s*/g, ', ').replace(/\s+\./g, ',')
  a = a.replace(/\s+/g, ' ').replace(/\s*,\s*/g, ', ').replace(/^[,\s]+|[,\s]+$/g, '')
  a = a.split(', ').map(p => /^(ул\.|пер\.|просп\.|шоссе|наб\.|бул\.|пл\.|тупик)/i.test(p) ? titleCase(p) : p).join(', ')
  a = a.replace(/^[.\s,]+/, '').replace(/\s{2,}/g, ' ').trim()
  return (a && a.length > 3) ? a.charAt(0).toUpperCase() + a.slice(1) : `г. ${cityName}`
}
function isAcronym(n) { const w = n.replace(/[«»"]/g, '').trim(); if (w.length <= 5 && !/\s/.test(w) && !/[аеёиоуыэюя]/i.test(w)) return true; if (/^[А-ЯЁ]{2,6}$/.test(w)) return true; return false }
function quoted(str) { const all = [...str.matchAll(/[«"]([^«»"]{2,80})[»"]/g)].map(m => m[1].trim()); return all.length ? all[all.length - 1] : null }
function normName(n) { n = n.trim(); if (n === n.toUpperCase()) n = titleCase(n); return n }
function displayName(short, full) {
  const s2 = (short || '').replace(/\s+/g, ' ').trim(), f2 = (full || '').replace(/\s+/g, ' ').trim()
  let q = quoted(s2); if (q && !isAcronym(q)) return `«${normName(q)}»`
  let qf = quoted(f2); if (qf && !isAcronym(qf)) return `«${normName(qf)}»`
  let n = f2.replace(/^(частное|негосударственное|автономная|общеобразовательн\w*)\s+/i, '').replace(/(частное|общеобразовательн\w*|учреждение|организация|некоммерческ\w*|автономн\w*|средн\w*|основн\w*|начальн\w*|школа|образовательн\w*)\s+/gi, '').replace(/^[«"]|[»"]$/g, '').replace(/\s+/g, ' ').trim()
  if (n && n.length >= 5 && !isAcronym(n)) return normName(n)
  return null
}
function detectType(name) { const n = name.toLowerCase(); if (/гимназ/.test(n)) return 'gimnazii'; if (/международн|british|international/.test(n)) return 'mezhdunarodnie'; return 'chastnie' }
const translit = s => s.toLowerCase().replace(/[а-яё]/g, c => ({а:'a',б:'b',в:'v',г:'g',д:'d',е:'e',ё:'e',ж:'zh',з:'z',и:'i',й:'y',к:'k',л:'l',м:'m',н:'n',о:'o',п:'p',р:'r',с:'s',т:'t',у:'u',ф:'f',х:'kh',ц:'ts',ч:'ch',ш:'sh',щ:'sch',ъ:'',ы:'y',ь:'',э:'e',ю:'yu',я:'ya'}[c] ?? c))
const makeSlug = (name, citySlug) => (translit(name) + '-' + citySlug).replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 80)

// какой из наших городов субъекта соответствует адресу
function assignCity(subj, addr) {
  if (subj.whole) return { slug: subj.whole, name: subj.name }
  const low = (addr || '').toLowerCase().replace(/ё/g, 'е')
  // сначала более длинные названия (Нижний Тагил раньше, чтобы не поймать общий кусок)
  const sorted = [...subj.cities].sort((a, b) => b[1].length - a[1].length)
  for (const [slug, name] of sorted) if (low.includes(name.toLowerCase().replace(/ё/g, 'е'))) return { slug, name }
  return null
}

// ── база ─────────────────────────────────────────────────────────────────────
const jiti = createJiti(import.meta.url, { interopDefault: true })
const { schools, regionLabelsIn } = await jiti.import(SCHOOLS_TS)
const existingSlugs = new Set(schools.map(s => s.slug))
const key = (name, region) => (name + '|' + region).toLowerCase().replace(/[«»"]/g, '').replace(/\s+/g, ' ').trim()
const existingKeys = new Set(schools.map(s => key(s.name, s.region)))

const esc = v => String(v ?? '').replace(/\\/g, '\\\\').replace(/'/g, "\\'")
function fmt(s) {
  const L = [`  {`, `    id: '${s.slug}',`, `    slug: '${s.slug}',`, `    name: '${esc(s.name)}',`, `    type: '${s.type}',`, `    region: '${s.region}',`, `    city: '${esc(s.city)}',`, `    address: '${esc(s.address)}',`, `    phone: '',`, `    description: '${esc(s.description)}',`, `    fullDescription: '${esc(s.fullDescription)}',`, `    grades: '${s.grades}',`, `    features: ${JSON.stringify(s.features)},`, `    rating: null,`, `    reviewCount: 0,`, `    priceFrom: ${s.priceFrom},`, `    imageAlt: '${esc(s.imageAlt)}',`, `  },`]
  return L.join('\n')
}

let subs = SUBJECTS
if (ONLY) subs = subs.filter(s => s.code === ONLY)
if (CODES) subs = subs.filter(s => CODES.includes(s.code))
const picked = []
const perCity = {}
for (const [i, subj] of subs.entries()) {
  const label = subj.whole || subj.cities.map(c => c[1]).join('/')
  const ids = new Set()
  for (const q of QUERIES) {
    let last = MAX_PAGES
    for (let p = 1; p <= Math.min(MAX_PAGES, last); p++) {
      let r; try { r = await search(subj.code, q, p) } catch { await sleep(2500); continue }
      if (p === 1) last = r.lastPage
      for (const row of r.rows) { if (!STATE.test(row.name) && PRIVATE.test(row.name) && !NOT_SCHOOL.test(row.name)) ids.add(row.id) }
      await sleep(500)
    }
  }
  let added = 0
  for (const id of ids) {
    let d; try { d = await detail(id) } catch { await sleep(1500); continue }
    await sleep(400)
    if (!d.address || (d.status && !/действ/i.test(d.status))) continue
    if (NOT_SCHOOL.test(d.shortName || d.fullName || '')) continue
    const city = assignCity(subj, d.address); if (!city) continue
    const name = displayName(d.shortName, d.fullName); if (!name || name.replace(/[«»]/g, '').length < 5) continue
    const k = key(name, city.slug); if (existingKeys.has(k)) continue
    const slug = makeSlug(name, city.slug); if (existingSlugs.has(slug)) continue
    const type = detectType(name), meta = TYPE_META[type]
    const nameIn = regionLabelsIn[city.slug] || `в ${city.name}`
    const address = cleanAddress(d.address, city.name)
    const { description, fullDescription } = makeDescriptions(name, type, city.name, nameIn, address, meta)
    picked.push({ slug, name, type, region: city.slug, city: city.name, address, description, fullDescription, grades: meta.grades, features: meta.features, priceFrom: meta.priceFrom, imageAlt: `${name} — ${meta.label} ${nameIn}` })
    existingKeys.add(k); existingSlugs.add(slug); perCity[city.slug] = (perCity[city.slug] || 0) + 1; added++
  }
  process.stderr.write(`[${i + 1}/${subs.length}] субъект ${subj.code} (${label}): +${added}\n`)
}

process.stderr.write(`\nВсего отобрано: ${picked.length}\n`)
process.stderr.write('по городам: ' + Object.entries(perCity).sort((a, b) => b[1] - a[1]).slice(0, 20).map(([c, n]) => `${c}:${n}`).join(', ') + '\n')
picked.slice(0, 10).forEach(s => process.stderr.write(`  · [${s.type}] ${s.name} — ${s.city} — ${s.address}\n`))

if (!DRY && picked.length) {
  let src = readFileSync(SCHOOLS_TS, 'utf8')
  const marker = '] as any[] as School[])', idx = src.lastIndexOf(marker)
  src = src.slice(0, idx) + picked.map(fmt).join('\n') + '\n' + src.slice(idx)
  writeFileSync(SCHOOLS_TS, src, 'utf8')
  process.stderr.write('\n💾 schools.ts обновлён\n')
} else process.stderr.write('\n🔍 DRY — файл не менялся\n')
