#!/usr/bin/env node
/**
 * delete-generated-types.mjs — удаляет четыре целиком сгенерированных типа.
 *
 * programmirovanie, shahmatnye, podgotovka-ege, podgotovka-oge — категории,
 * которых нет в OpenStreetMap, поэтому наполнялись они только генератором.
 * Признаки: телефоны-лесенками («+7 (812) 345-67-89»), домены под каждый город
 * (grossmeister-school.ru, kapablanka-academy.ru, «IT-школа Волга», «IT-школа
 * Кубань», «Шахматная школа Сталинград»).
 *
 * Поимённая проверка показала, что реальные записи внутри этих типов — это либо
 * дубли уже имеющихся карточек (Лицей № 77 в Челябинске лежал в каталоге 4 раза,
 * IT-лицей КФУ — дважды, Лицей информационных технологий в Новосибирске есть
 * из OSM), либо федеральные онлайн-компании (Вебиум, MAXIMUM, Lancman, ЕШКО),
 * выданные за локальные школы с выдуманным городским адресом. Ни одну реальную
 * организацию с достоверными данными удаление не теряет.
 *
 * Запуск: node scripts/delete-generated-types.mjs [--dry]
 */

import { readFileSync, writeFileSync } from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'
import { createJiti } from '../node_modules/jiti/lib/jiti.mjs'

const __dirname  = path.dirname(fileURLToPath(import.meta.url))
const SCHOOLS_TS = path.join(__dirname, '..', 'src', 'data', 'schools.ts')
const DRY = process.argv.includes('--dry')

const GENERATED_TYPES = new Set(['programmirovanie', 'shahmatnye', 'podgotovka-ege', 'podgotovka-oge'])

const jiti = createJiti(import.meta.url, { interopDefault: true })
const { schools, regionSlugs, typeSlugs } = await jiti.import(SCHOOLS_TS)

const doomed = schools.filter(s => GENERATED_TYPES.has(s.type))
console.log(`К удалению: ${doomed.length} карточек`)
for (const t of GENERATED_TYPES) {
  console.log(`  ${t}: ${doomed.filter(s => s.type === t).length}`)
}

// Какие страницы каталога закроются
const counts = {}
for (const s of schools) counts[s.region + '|' + s.type] = (counts[s.region + '|' + s.type] || 0) + 1
const lostPages = []
for (const r of regionSlugs) for (const t of typeSlugs) {
  if (!GENERATED_TYPES.has(t)) continue
  if ((counts[r + '|' + t] || 0) >= 3) lostPages.push(`${r}/${t}`)
}
console.log(`Страниц каталога уйдёт из индексируемых: ${lostPages.length}`)
if (lostPages.length) console.log('  ' + lostPages.join(', '))

let src = readFileSync(SCHOOLS_TS, 'utf8')
const start = src.indexOf('export const schools = ([')
const end   = src.lastIndexOf('] as any[] as School[])')
const head = src.slice(0, start), body = src.slice(start, end), tail = src.slice(end)
const blocks = body.split(/\n(?=\s*\{\n)/)

let removed = 0
const kept = blocks.filter(b => {
  const m = b.match(/\n    type: '([^']+)'/)
  if (!m || !GENERATED_TYPES.has(m[1])) return true
  removed++
  return false
})

console.log(`Вырезано блоков: ${removed}`)
if (!DRY) {
  writeFileSync(SCHOOLS_TS, head + kept.join('\n') + tail, 'utf8')
  console.log('💾 schools.ts обновлён')
  console.log('\n⚠️  Типы остаются в typeSlugs — страницы будут пустые и noindex.')
  console.log('   Наполнять их только из проверяемого источника (реестр Рособрнадзора / 2GIS).')
} else {
  console.log('🔍 DRY RUN — файл не менялся')
}
