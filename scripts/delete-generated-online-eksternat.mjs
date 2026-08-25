#!/usr/bin/env node
/**
 * delete-generated-online-eksternat.mjs — удаляет из каталога карточки онлайн-школ
 * и экстернатов, сгенерированные Claude API (несуществующие организации).
 *
 * Как определили, что генерация: по истории git. Карточки, впервые появившиеся
 * в коммитах generate-city.mjs («Cities: add next city from queue», «Schools: add N
 * schools for X»), — сгенерированы; карточки из коммитов «add real schools from 2GIS»
 * и ручных правок — реальные и остаются. Список слагов приходит из --list=<json>.
 *
 * Каждому удалённому слагу пишем 301 на каталог его города и типа — в файл
 * scripts/removed-schools.json, который читает next.config.ts.
 *
 * Запуск: node scripts/delete-generated-online-eksternat.mjs --list=slugs.json [--dry]
 */

import { readFileSync, writeFileSync } from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'
import { createJiti } from '../node_modules/jiti/lib/jiti.mjs'

const __dirname  = path.dirname(fileURLToPath(import.meta.url))
const SCHOOLS_TS = path.join(__dirname, '..', 'src', 'data', 'schools.ts')
const REMOVED    = path.join(__dirname, 'removed-schools.json')
const args = Object.fromEntries(process.argv.slice(2).filter(a => a.startsWith('--')).map(a => { const [k, ...v] = a.slice(2).split('='); return [k, v.join('=') || true] }))
const DRY = Boolean(args.dry)
if (!args.list) { console.error('нужен --list=<json со списком слагов>'); process.exit(1) }

const kill = new Set(JSON.parse(readFileSync(String(args.list), 'utf8')))

const jiti = createJiti(import.meta.url, { interopDefault: true })
const { schools } = await jiti.import(SCHOOLS_TS)
const bySlug = new Map(schools.map(s => [s.slug, s]))

// куда вести 301: страница «город × тип», если она останется живой (≥3 школы
// после удаления), иначе — страница города
const survivors = schools.filter(s => !kill.has(s.slug))
const pairCount = {}
for (const s of survivors) pairCount[`${s.region}|${s.type}`] = (pairCount[`${s.region}|${s.type}`] || 0) + 1

const redirects = {}
for (const slug of kill) {
  const s = bySlug.get(slug)
  if (!s) { console.error(`  ! нет в каталоге: ${slug}`); continue }
  redirects[slug] = (pairCount[`${s.region}|${s.type}`] || 0) >= 3
    ? `/shkoly/${s.region}/${s.type}/`
    : `/shkoly/${s.region}/`
}

// ── вырезаем блоки из schools.ts ─────────────────────────────────────────────
// В файле две схемы отступа открывающей скобки, поэтому сплиттер именно такой
// (грабли зафиксированы ещё в delete-fabricated.mjs).
let src = readFileSync(SCHOOLS_TS, 'utf8')
const marker = 'export const schools = ([', endMarker = '] as any[] as School[])'
const head = src.slice(0, src.indexOf(marker) + marker.length)
const tail = src.slice(src.lastIndexOf(endMarker))
const body = src.slice(head.length, src.lastIndexOf(endMarker))

const blocks = body.split(/\n(?=\s*\{\n)/)
let removed = 0
const kept = blocks.filter(b => {
  const m = b.match(/slug:\s*'([^']+)'/)
  if (m && kill.has(m[1])) { removed++; return false }
  return true
})

console.error(`Карточек в файле: ${blocks.length}, удаляем: ${removed}, остаётся: ${blocks.length - removed}`)
const lost = [...kill].filter(s => !bySlug.has(s))
if (lost.length) console.error(`Не найдено в каталоге: ${lost.length}`)

if (DRY) { console.error('🔍 DRY — ничего не записано'); process.exit(0) }

writeFileSync(SCHOOLS_TS, head + kept.join('\n') + tail, 'utf8')
const prev = (() => { try { return JSON.parse(readFileSync(REMOVED, 'utf8')) } catch { return {} } })()
writeFileSync(REMOVED, JSON.stringify({ ...prev, ...redirects }, null, 1), 'utf8')
console.error(`💾 schools.ts обновлён, редиректов в removed-schools.json: ${Object.keys({ ...prev, ...redirects }).length}`)
