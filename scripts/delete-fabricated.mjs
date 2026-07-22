#!/usr/bin/env node
/**
 * delete-fabricated.mjs — удаляет карточки выдуманных школ.
 *
 * Удаляются две группы:
 *  1) не школы вообще — детские сады, школы искусств, музыкальные и художественные
 *     школы, попавшие в каталог по слову «школа» в названии;
 *  2) сгенерированные организации: «брендовое» название в кавычках, повторяющееся
 *     в 3+ городах, без координат и без сайта. Проверка выборки через поиск
 *     подтвердила, что таких организаций не существует (напр. вальдорфская школа
 *     «Берёзка» в Воронеже — реальная вальдорфская школа города называется «Радуга»).
 *
 * Реальные школы с типовыми названиями (МАОУ «Вечерняя (сменная) школа № 1»,
 * СДЮСШОР «Олимп») остаются: у них есть координаты или сайт.
 *
 * Запуск: node scripts/delete-fabricated.mjs [--dry]
 */

import { readFileSync, writeFileSync } from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'
import { createJiti } from '../node_modules/jiti/lib/jiti.mjs'

const __dirname  = path.dirname(fileURLToPath(import.meta.url))
const SCHOOLS_TS = path.join(__dirname, '..', 'src', 'data', 'schools.ts')
const DRY = process.argv.includes('--dry')

const jiti = createJiti(import.meta.url, { interopDefault: true })
const { schools } = await jiti.import(SCHOOLS_TS)

// ── 1. Не школы ───────────────────────────────────────────────────────────────
const NOT_A_SCHOOL = /детский сад|школа искусств|музыкальная школа|художественная школа|хореографическ|автошкол|балетн|цирков/i

// ── 2. Брендовые названия, размноженные по городам ────────────────────────────
const brandCount = {}
for (const s of schools) {
  if (!/[«"]/.test(s.name)) continue
  const base = s.name.replace(new RegExp(s.city, 'gi'), '').replace(/\s+/g, ' ').trim().toLowerCase()
  ;(brandCount[base] ||= new Set()).add(s.region)
}
const brandKey = s => s.name.replace(new RegExp(s.city, 'gi'), '').replace(/\s+/g, ' ').trim().toLowerCase()

const toDelete = new Set()
const reasons = { notSchool: 0, brand: 0 }

for (const s of schools) {
  if (NOT_A_SCHOOL.test(s.name)) { toDelete.add(s.slug); reasons.notSchool++; continue }
  const hasProof = s.lat != null || Boolean(s.website)
  if (hasProof) continue
  const cities = brandCount[brandKey(s)]
  if (cities && cities.size >= 3) { toDelete.add(s.slug); reasons.brand++ }
}

console.log(`К удалению: ${toDelete.size} карточек (не школы: ${reasons.notSchool}, размноженные бренды: ${reasons.brand})`)

// Что закроется: пары «город × тип», которые упадут ниже 3 школ
const counts = {}
for (const s of schools) counts[s.region + '|' + s.type] = (counts[s.region + '|' + s.type] || 0) + 1
const after = { ...counts }
for (const s of schools) if (toDelete.has(s.slug)) after[s.region + '|' + s.type]--
const lost = Object.keys(counts).filter(k => counts[k] >= 3 && after[k] < 3)
console.log(`Страниц каталога станет noindex: ${lost.length}`)
if (lost.length) console.log('  ' + lost.slice(0, 15).join(', ') + (lost.length > 15 ? ' …' : ''))

// ── Удаление из файла ─────────────────────────────────────────────────────────
let src = readFileSync(SCHOOLS_TS, 'utf8')
const start = src.indexOf('export const schools = ([')
const end   = src.lastIndexOf('] as any[] as School[])')
const head = src.slice(0, start), body = src.slice(start, end), tail = src.slice(end)
const blocks = body.split(/\n(?=\s*\{\n)/)

let removed = 0
const kept = blocks.filter(b => {
  const m = b.match(/\n    slug: '([^']+)'/)
  if (!m || !toDelete.has(m[1])) return true
  removed++
  return false
})

console.log(`Вырезано блоков: ${removed}`)
if (!DRY) {
  writeFileSync(SCHOOLS_TS, head + kept.join('\n') + tail, 'utf8')
  console.log('💾 schools.ts обновлён')
} else {
  console.log('🔍 DRY RUN — файл не менялся')
}
