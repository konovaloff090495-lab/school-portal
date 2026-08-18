#!/usr/bin/env node
/**
 * build-metro-geo.mjs — координаты станций метро/МЦД и городов Подмосковья из OSM.
 *
 * Зачем: страницы /shkoly/moskva/metro/[station]/[type]/ часто пусты — школ нужного
 * типа у конкретной станции нет. Чтобы показать «школы этого типа у соседних станций»,
 * нужно знать, какие станции рядом. Координаты берём из OSM (бесплатно, без ключей)
 * и фиксируем в src/data/metro-geo.ts, чтобы билд не ходил в сеть.
 *
 * Запуск: node scripts/build-metro-geo.mjs [--dry]
 */
import { readFileSync, writeFileSync } from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const ROOT = path.join(__dirname, '..')
const OUT  = path.join(ROOT, 'src', 'data', 'geo-points.ts')
const DRY  = process.argv.includes('--dry')

const MIRRORS = [
  'https://maps.mail.ru/osm/tools/overpass/api/interpreter',
  'https://overpass.kumi.systems/api/interpreter',
  'https://overpass-api.de/api/interpreter',
]

// станции, по которым построены страницы сайта
const src = readFileSync(path.join(ROOT, 'src', 'data', 'schools.ts'), 'utf8')
const block = src.match(/export const metroSlugToName: Record<string, string> = \{([\s\S]*?)\n\}/)
if (!block) { console.error('не нашёл metroSlugToName в schools.ts'); process.exit(1) }
const stations = {}
for (const m of block[1].matchAll(/["']([^"']+)["']:\s*["']([^"']+)["']/g)) stations[m[1]] = m[2]
console.log(`станций на сайте: ${Object.keys(stations).length}`)

const norm = s => s.trim().toLowerCase().replace(/ё/g, 'е')

const sleep = ms => new Promise(r => setTimeout(r, ms))

// Overpass ждёт форму data=<query>; голый body часть зеркал отдаёт 406.
async function overpass(query) {
  for (let attempt = 1; attempt <= 3; attempt++) {
    for (const url of MIRRORS) {
      try {
        const res = await fetch(url, {
          method: 'POST',
          headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
          body: 'data=' + encodeURIComponent(query),
          signal: AbortSignal.timeout(180000),
        })
        if (!res.ok) throw new Error('HTTP ' + res.status)
        const json = await res.json()
        if (!json.elements) throw new Error('нет elements')
        return json
      } catch (e) { console.log(`  ${url} — ${e.message}`) }
    }
    if (attempt < 3) { console.log(`  зеркала заняты, пауза ${attempt * 20}с`); await sleep(attempt * 20000) }
  }
  throw new Error('все зеркала Overpass недоступны')
}

// 1. метро внутри Москвы
const subway = await overpass(`
[out:json][timeout:120];
area["name"="Москва"]["admin_level"="4"]->.a;
(node["station"="subway"](area.a); node["railway"="station"]["subway"="yes"](area.a););
out body;`)
console.log(`OSM: станций метро ${subway.elements.length}`)

const geo = {}
for (const e of subway.elements) {
  if (!e.tags?.name) continue
  const k = norm(e.tags.name)
  if (!geo[k]) geo[k] = { lat: e.lat, lon: e.lon }
}

// 2. добор станций, которых нет среди subway (МЦД/МЦК-платформы)
const missing = Object.entries(stations).filter(([, name]) => !geo[norm(name)])
if (missing.length) {
  console.log(`добираю МЦД/МЦК: ${missing.map(([, n]) => n).join(', ')}`)
  const names = missing.map(([, n]) => n).join('|')
  const extra = await overpass(`
[out:json][timeout:120];
(node["railway"~"station|halt"]["name"~"^(${names})$"](55.3,36.9,56.1,38.3););
out body;`)
  for (const e of extra.elements) {
    if (!e.tags?.name) continue
    const k = norm(e.tags.name)
    if (!geo[k]) geo[k] = { lat: e.lat, lon: e.lon }
  }
}

// 2b. города Подмосковья, по которым построены страницы /shkoly/moskovskaya-oblast/gorod/[city]/
const cityBlock = src.match(/export const moCityLabels: Record<MoCitySlug, string> = \{([\s\S]*?)\n\}/)
const moCities = {}
if (cityBlock) for (const m of cityBlock[1].matchAll(/["']?([a-z-]+)["']?:\s*["']([^"']+)["']/g)) moCities[m[1]] = m[2]
console.log(`городов МО на сайте: ${Object.keys(moCities).length}`)

const cityNames = Object.values(moCities).join('|')
const places = await overpass(`
[out:json][timeout:120];
area["name"="Московская область"]["admin_level"="4"]->.mo;
(node["place"~"city|town|suburb"]["name"~"^(${cityNames})$"](area.mo););
out body;`)
const cityGeo = {}
for (const e of places.elements) {
  if (!e.tags?.name) continue
  const k = norm(e.tags.name)
  if (!cityGeo[k]) cityGeo[k] = { lat: e.lat, lon: e.lon }
}
const outCities = {}
const cityMiss = []
for (const [slug, name] of Object.entries(moCities)) {
  const g = cityGeo[norm(name)]
  if (g) outCities[slug] = { lat: +g.lat.toFixed(5), lon: +g.lon.toFixed(5) }
  else cityMiss.push(`${slug} (${name})`)
}
console.log(`города МО сопоставлены ${Object.keys(outCities).length}/${Object.keys(moCities).length}`)
if (cityMiss.length) console.log(`НЕ найдены города: ${cityMiss.join(', ')}`)

// 3. сводим к слагам сайта
const out = {}
const notFound = []
for (const [slug, name] of Object.entries(stations)) {
  const g = geo[norm(name)]
  if (g) out[slug] = { lat: +g.lat.toFixed(5), lon: +g.lon.toFixed(5) }
  else notFound.push(`${slug} (${name})`)
}
console.log(`сопоставлено ${Object.keys(out).length}/${Object.keys(stations).length}`)
if (notFound.length) console.log(`НЕ найдены: ${notFound.join(', ')}`)

const body = `// СГЕНЕРИРОВАНО scripts/build-metro-geo.mjs — не править руками.
// Источник: OpenStreetMap (Overpass API), лицензия ODbL.
// Координаты станций метро/МЦД и городов Подмосковья, по которым построены
// страницы /shkoly/moskva/metro/[station]/ и /shkoly/moskovskaya-oblast/gorod/[city]/.
// Нужны, чтобы подобрать школы у соседних станций и в соседних городах, когда
// в самой выборке школ нужного типа нет (см. src/lib/related-schools.ts).

export const metroGeo: Record<string, { lat: number; lon: number }> = {
${Object.entries(out).map(([s, g]) => `  '${s}': { lat: ${g.lat}, lon: ${g.lon} },`).join('\n')}
}

const R = 6371000
const rad = (d: number) => (d * Math.PI) / 180

/** Расстояние между двумя станциями в метрах. */
export function stationDistance(a: string, b: string): number | null {
  const p = metroGeo[a], q = metroGeo[b]
  if (!p || !q) return null
  const dLat = rad(q.lat - p.lat), dLon = rad(q.lon - p.lon)
  const h = Math.sin(dLat / 2) ** 2 + Math.cos(rad(p.lat)) * Math.cos(rad(q.lat)) * Math.sin(dLon / 2) ** 2
  return 2 * R * Math.asin(Math.sqrt(h))
}

/** Слаги станций в радиусе radiusM от station, отсортированы по возрастанию расстояния. */
export function nearbyStations(station: string, radiusM = 3000): string[] {
  if (!metroGeo[station]) return []
  return Object.keys(metroGeo)
    .filter(s => s !== station)
    .map(s => ({ s, d: stationDistance(station, s)! }))
    .filter(x => x.d <= radiusM)
    .sort((a, b) => a.d - b.d)
    .map(x => x.s)
}

export const moCityGeo: Record<string, { lat: number; lon: number }> = {
${Object.entries(outCities).map(([s, g]) => `  '${s}': { lat: ${g.lat}, lon: ${g.lon} },`).join('\n')}
}

/** Слаги городов Подмосковья, ближайшие к city — отсортированы по расстоянию. */
export function nearbyMoCities(city: string, limit = 6): string[] {
  const p = moCityGeo[city]
  if (!p) return []
  return Object.keys(moCityGeo)
    .filter(c => c !== city)
    .map(c => {
      const q = moCityGeo[c]
      const dLat = rad(q.lat - p.lat), dLon = rad(q.lon - p.lon)
      const h = Math.sin(dLat / 2) ** 2 + Math.cos(rad(p.lat)) * Math.cos(rad(q.lat)) * Math.sin(dLon / 2) ** 2
      return { c, d: 2 * R * Math.asin(Math.sqrt(h)) }
    })
    .sort((a, b) => a.d - b.d)
    .slice(0, limit)
    .map(x => x.c)
}
`
if (DRY) { console.log(body.slice(0, 400) + '…'); process.exit(0) }
writeFileSync(OUT, body)
console.log(`записан ${path.relative(ROOT, OUT)}`)
