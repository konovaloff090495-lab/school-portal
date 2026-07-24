#!/usr/bin/env node
/**
 * dadata-enrich.mjs — обогащает частные школы из реестра координатами, директором
 * и годом основания через бесплатный DaData findById/suggest party.
 *
 * У этих карточек нет ИНН (реестр Рособрнадзора его в schools.ts не писал), поэтому
 * ищем организацию в DaData по названию+городу и ПОДТВЕРЖДАЕМ совпадение по улице.
 * Без совпадения улицы карточку не трогаем — чтобы не прицепить чужую организацию
 * (напр. школа «Виктория» ≠ первое попавшееся «ООО Виктория»).
 *
 * Берём: geo_lat/geo_lon (точность до дома, qc_geo 0–2), management.name (директор),
 * год из state.registration_date. Данные официальные (ЕГРЮЛ) — правило «только
 * проверяемое» соблюдено.
 *
 * Запуск: DADATA_KEY=... node scripts/dadata-enrich.mjs [--dry] [--limit=N]
 */

import { readFileSync, writeFileSync } from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'
import { createJiti } from '../node_modules/jiti/lib/jiti.mjs'

const __dirname  = path.dirname(fileURLToPath(import.meta.url))
const SCHOOLS_TS = path.join(__dirname, '..', 'src', 'data', 'schools.ts')
const API = process.env.DADATA_KEY
if (!API) { console.error('нет DADATA_KEY'); process.exit(1) }
const args = Object.fromEntries(process.argv.slice(2).filter(a => a.startsWith('--')).map(a => { const [k, ...v] = a.slice(2).split('='); return [k, v.join('=') || true] }))
const DRY = Boolean(args.dry)
const LIMIT = parseInt(args.limit ?? '0')
const sleep = ms => new Promise(r => setTimeout(r, ms))

async function suggest(query) {
  const res = await fetch('https://suggestions.dadata.ru/suggestions/api/4_1/rs/suggest/party', {
    method: 'POST', headers: { 'Content-Type': 'application/json', 'Authorization': 'Token ' + API },
    body: JSON.stringify({ query, count: 10, status: ['ACTIVE'] }), signal: AbortSignal.timeout(20000),
  })
  if (!res.ok) throw new Error('HTTP ' + res.status)
  return (await res.json()).suggestions || []
}

// нормализация улицы для сверки: «Ул. Остоженка, д. 42/2» ~ «ул Остоженка, д 42»
function streetKey(addr) {
  return (addr || '').toLowerCase()
    .replace(/ё/g, 'е')
    .replace(/\b(улица|ул|переулок|пер|проспект|просп|пр-кт|шоссе|ш|набережная|наб|бульвар|бул|б-р|тупик|туп|площадь|пл|проезд|аллея|линия|дом|д|корпус|корп|к|строение|стр|литера|литер)\b\.?/g, ' ')
    .replace(/[.,№]/g, ' ').replace(/\s+/g, ' ').trim()
}
// пересечение значимых токенов улицы (название + номер дома)
function streetMatch(cardAddr, ddAddr) {
  const a = new Set(streetKey(cardAddr).split(' ').filter(w => w.length > 1))
  const b = new Set(streetKey(ddAddr).split(' ').filter(w => w.length > 1))
  if (!a.size || !b.size) return false
  let hit = 0; for (const t of a) if (b.has(t)) hit++
  // и название улицы, и номер дома должны совпасть → высокая доля пересечения
  return hit / a.size >= 0.6
}

function titleName(s) {
  return (s || '').toLowerCase().split(/\s+/).map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ')
}

const jiti = createJiti(import.meta.url, { interopDefault: true })
const { schools } = await jiti.import(SCHOOLS_TS)
let targets = schools.filter(s => ['moskva', 'sankt-peterburg', 'sevastopol'].includes(s.region)
  && ['chastnie', 'gimnazii', 'mezhdunarodnie'].includes(s.type) && s.id === s.slug && s.lat == null
  && s.address && !/^г\. /.test(s.address))
if (LIMIT > 0) targets = targets.slice(0, LIMIT)
console.error(`Кандидатов: ${targets.length}${DRY ? ' (DRY)' : ''}`)

const cityNeedle = { moskva: 'москв', 'sankt-peterburg': 'петербург', sevastopol: 'севастопол' }
const updates = {}   // slug -> {lat, lon, director, founded}
let matched = 0, skipped = 0, noResult = 0
const skips = []

for (const s of targets) {
  const bare = s.name.replace(/[«»"]/g, '').trim()
  let sug
  try { sug = await suggest(bare + ' ' + s.city) } catch { await sleep(600); continue }
  await sleep(120)
  if (!sug.length) { try { sug = await suggest(bare) } catch {} ; await sleep(120) }
  if (!sug.length) { noResult++; skips.push(`нет в DaData: ${s.name}`); continue }

  const needle = cityNeedle[s.region]
  const cand = sug.find(x => {
    const a = x.data?.address?.data || {}
    const cityStr = (a.region_with_type + ' ' + (a.city_with_type || '') + ' ' + (a.settlement_with_type || '')).toLowerCase().replace(/ё/g, 'е')
    if (!cityStr.includes(needle)) return false
    return streetMatch(s.address, x.data?.address?.value)
  })
  if (!cand) { skipped++; skips.push(`улица не сошлась: ${s.name} (${s.address})`); continue }

  const a = cand.data.address?.data || {}
  const u = {}
  if (a.geo_lat && a.geo_lon && (a.qc_geo === '0' || a.qc_geo === '1' || a.qc_geo === '2' || a.qc_geo === 0 || a.qc_geo === 1 || a.qc_geo === 2)) {
    u.lat = parseFloat(Number(a.geo_lat).toFixed(6)); u.lon = parseFloat(Number(a.geo_lon).toFixed(6))
  }
  if (cand.data.management?.name) u.director = titleName(cand.data.management.name)
  const rd = cand.data.state?.registration_date
  if (rd) { const y = new Date(rd).getUTCFullYear(); if (y >= 1900 && y <= 2026) u.founded = y }
  if (Object.keys(u).length) { updates[s.slug] = u; matched++ }
  else { skipped++; skips.push(`нет полезных полей: ${s.name}`) }

  if (matched <= 12) console.error(`  ✓ ${s.name.slice(0, 34)} → ИНН ${cand.data.inn} | гео:${u.lat ? 'да' : '—'} дир:${u.director ? 'да' : '—'} год:${u.founded || '—'}`)
}

console.error(`\nСовпало: ${matched} | улица/поля не сошлись: ${skipped} | нет в DaData: ${noResult}`)
const geoN = Object.values(updates).filter(u => u.lat).length
const dirN = Object.values(updates).filter(u => u.director).length
const fndN = Object.values(updates).filter(u => u.founded).length
console.error(`Прибавят: координаты +${geoN}, директор +${dirN}, год +${fndN}`)
if (skips.length) console.error('\nпропуски (первые 15):\n  ' + skips.slice(0, 15).join('\n  '))

if (!DRY && matched) {
  let src = readFileSync(SCHOOLS_TS, 'utf8')
  const start = src.indexOf('export const schools = (['), end = src.lastIndexOf('] as any[] as School[])')
  const head = src.slice(0, start), body = src.slice(start, end), tail = src.slice(end)
  const blocks = body.split(/\n(?=\s*\{\n)/)
  const out = blocks.map(b => {
    const mm = b.match(/\n    slug: '([^']+)'/); if (!mm) return b
    const u = updates[mm[1]]; if (!u) return b
    let nb = b.replace(/\n    imageAlt:/, m => {
      const lines = []
      if (u.director) lines.push(`\n    director: '${u.director.replace(/'/g, "\\'")}',`)
      if (u.founded)  lines.push(`\n    founded: ${u.founded},`)
      return lines.join('') + m
    })
    if (u.lat) nb = nb.replace(/\n  \},\s*$/, `\n    lat: ${u.lat},\n    lon: ${u.lon},\n  },`)
    return nb
  })
  writeFileSync(SCHOOLS_TS, head + out.join('\n') + tail, 'utf8')
  console.error('\n💾 schools.ts обновлён')
} else {
  console.error('\n🔍 DRY — файл не менялся')
}
