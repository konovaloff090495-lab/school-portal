#!/usr/bin/env node
/**
 * Геокодирование школ через Nominatim (OpenStreetMap)
 * Добавляет lat/lon к каждой школе в schools.ts
 *
 * Запуск:
 *   node scripts/geocode-schools.mjs                  # все без координат
 *   node scripts/geocode-schools.mjs --limit=50        # первые 50
 *   node scripts/geocode-schools.mjs --region=kazan    # только регион
 */

import { readFileSync, writeFileSync } from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const ROOT      = path.join(__dirname, '..')
const SCHOOLS_F = path.join(ROOT, 'src', 'data', 'schools.ts')

const DELAY     = 1100   // Nominatim: max 1 req/sec
const USER_AGENT = 'pro-schools.ru geocoder/1.0 (info@pro-schools.ru)'

// ── CLI ──────────────────────────────────────────────────────────────────────
const limitArg  = process.argv.find(a => a.startsWith('--limit='))
const LIMIT     = limitArg ? parseInt(limitArg.split('=')[1]) : Infinity
const regionArg = process.argv.find(a => a.startsWith('--region='))
const REGION    = regionArg ? regionArg.split('=')[1] : null

function sleep(ms) { return new Promise(r => setTimeout(r, ms)) }

// ── Nominatim geocode ─────────────────────────────────────────────────────────
async function geocode(address, city, country = 'Russia') {
  const q = `${address}, ${city}, ${country}`
  const url = `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(q)}&format=json&limit=1&addressdetails=0`
  try {
    const res = await fetch(url, {
      headers: { 'User-Agent': USER_AGENT, 'Accept-Language': 'ru' },
      signal: AbortSignal.timeout(10000),
    })
    if (!res.ok) throw new Error(`HTTP ${res.status}`)
    const data = await res.json()
    if (data.length > 0) return { lat: parseFloat(data[0].lat), lon: parseFloat(data[0].lon) }
    // Fallback: try with city only
    const url2 = `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(`${city}, ${country}`)}&format=json&limit=1`
    const res2 = await fetch(url2, { headers: { 'User-Agent': USER_AGENT }, signal: AbortSignal.timeout(10000) })
    const data2 = await res2.json()
    if (data2.length > 0) return { lat: parseFloat(data2[0].lat), lon: parseFloat(data2[0].lon) }
    return null
  } catch (e) {
    console.warn(`  ⚠ geocode error: ${e.message}`)
    return null
  }
}

// ── Parse slugs+addresses from schools.ts ────────────────────────────────────
function parseSchoolBlocks(content) {
  const schools = []
  // Match each object block
  const blockRe = /\{[\s\S]*?(?=\n {2}\{|\n\])/g
  for (const block of content.split(/\n {1,6}\{/)) {
    const id      = block.match(/\bid:\s*['"]([^'"]+)['"]/)?.[1]
    const slug    = block.match(/\bslug:\s*['"]([^'"]+)['"]/)?.[1]
    const address = block.match(/\baddress:\s*['"]([^'"]+)['"]/)?.[1]
    const city    = block.match(/\bcity:\s*['"]([^'"]+)['"]/)?.[1]
    const region  = block.match(/\bregion:\s*['"]([^'"]+)['"]/)?.[1]
    const hasLat  = /\blat:\s*[-\d.]+/.test(block)
    if (id && slug && address && city) {
      schools.push({ id, slug, address, city, region: region ?? '', hasLat })
    }
  }
  return schools
}

// ── Write lat/lon into schools.ts after imageAlt ──────────────────────────────
function injectCoords(content, slug, lat, lon) {
  // Find the school block by slug and add lat/lon after imageAlt line
  // Use a regex that finds the slug then looks for imageAlt in the same block
  const slugPattern = new RegExp(
    `(slug:\\s*['"]${slug.replace(/[-]/g, '\\-')}['"][\\s\\S]*?imageAlt:\\s*'[^']*',?)`,
    'g'
  )
  let found = false
  const updated = content.replace(slugPattern, (match) => {
    found = true
    // Already has lat/lon?
    if (/\blat:\s*[-\d.]/.test(match)) return match
    return match + `\n    lat: ${lat.toFixed(6)},\n    lon: ${lon.toFixed(6)},`
  })
  return { content: updated, found }
}

// ── Main ─────────────────────────────────────────────────────────────────────
async function main() {
  let content = readFileSync(SCHOOLS_F, 'utf-8')
  const all   = parseSchoolBlocks(content)

  let targets = all.filter(s => !s.hasLat)
  if (REGION) targets = targets.filter(s => s.region === REGION)
  if (LIMIT < Infinity) targets = targets.slice(0, LIMIT)

  console.log(`\n🌍 Геокодирование школ`)
  console.log(`   Всего в базе: ${all.length}`)
  console.log(`   Уже с координатами: ${all.filter(s => s.hasLat).length}`)
  console.log(`   К обработке: ${targets.length}`)
  console.log(`   Оценка времени: ~${Math.ceil(targets.length * DELAY / 60000)} мин\n`)

  const stats = { ok: 0, fallback: 0, fail: 0 }
  const pad   = String(targets.length).length

  for (let i = 0; i < targets.length; i++) {
    const s = targets[i]
    process.stdout.write(`[${String(i + 1).padStart(pad)}/${targets.length}] ${s.city}: ${s.address.slice(0, 50).padEnd(50)} `)

    const coords = await geocode(s.address, s.city)
    if (coords) {
      const result = injectCoords(content, s.slug, coords.lat, coords.lon)
      if (result.found) {
        content = result.content
        writeFileSync(SCHOOLS_F, content)
        process.stdout.write(`✅ ${coords.lat.toFixed(4)}, ${coords.lon.toFixed(4)}\n`)
        stats.ok++
      } else {
        process.stdout.write(`⚠ slug not matched\n`)
        stats.fail++
      }
    } else {
      process.stdout.write(`❌ не найдено\n`)
      stats.fail++
    }

    if (i < targets.length - 1) await sleep(DELAY)
  }

  console.log(`
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
📊 Итог:
   ✅ Геокодировано: ${stats.ok}
   ❌ Не найдено:    ${stats.fail}
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`)
}

main().catch(e => { console.error('\n💥 Fatal:', e); process.exit(1) })
