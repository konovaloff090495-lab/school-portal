#!/usr/bin/env node
/**
 * fix-school-types.mjs — переопределяет типы школ по названию.
 * Исправляет школы у которых тип стоит по умолчанию (gosudarstvennye),
 * но по названию видно что это вальдорфская, монтессори, православная и т.д.
 *
 * Запуск: node scripts/fix-school-types.mjs
 */

import { readFileSync, writeFileSync } from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const __dirname  = path.dirname(fileURLToPath(import.meta.url))
const SCHOOLS_TS = path.join(__dirname, '..', 'src', 'data', 'schools.ts')

function detectType(name) {
  const n = name.toLowerCase()
  if (/вечерн|открытая шк|сменная шк/.test(n)) return 'vechernie'
  if (/экстерн/.test(n)) return 'eksternal'
  if (/семейн.*(шк|образо|центр)|шк.*семейн/.test(n)) return 'semejnye'
  if (/домашн.*(шк|образо)/.test(n)) return 'domashnie'
  if (/кадет/.test(n)) return 'kadetskie'
  if (/коррекц|овз/.test(n) && /шк/.test(n)) return 'korrektsionnye'
  if (/интернат/.test(n) && /шк/.test(n)) return 'internaty'
  if (/вальдорф/.test(n)) return 'valdorfskie'
  if (/монтессори/.test(n)) return 'montessori'
  if (/православ|церковн|христиан/.test(n) && /шк|гимназ/.test(n)) return 'pravoslavnye'
  if (/международн/.test(n) && /шк/.test(n)) return 'mezhdunarodnie'
  if (/спортивн/.test(n) && /шк/.test(n)) return 'sportivnye'
  if (/шахмат/.test(n) && /шк/.test(n)) return 'shahmatnye'
  if (/языков|лингвист/.test(n) && /шк|гимназ|лицей/.test(n)) return 'yazykovye'
  if (/it-|айти|программир/.test(n) && /шк|лицей/.test(n)) return 'programmirovanie'
  if (/дистанцион|онлайн/.test(n)) return 'online'
  if (/частн/.test(n)) return 'chastnie'
  if (/гимназ/.test(n)) return 'gimnazii'
  if (/лицей/.test(n)) return 'profilnye'
  return null  // null = не меняем
}

// Типы которые можно переопределить по названию (были назначены "по умолчанию")
const OVERRIDABLE = new Set(['gosudarstvennye', 'chastnie', 'profilnye'])

let src = readFileSync(SCHOOLS_TS, 'utf8')
const stats = {}
let changed = 0

// Находим все блоки школ и обновляем типы
src = src.replace(
  /(\bslug: '([^']+)'[\s\S]*?\bname: '([^']+)'[\s\S]*?)\btype: '([^']+)'/g,
  (match, pre, slug, name, oldType) => {
    if (!OVERRIDABLE.has(oldType)) return match
    const newType = detectType(name)
    if (!newType || newType === oldType) return match
    stats[`${oldType}→${newType}`] = (stats[`${oldType}→${newType}`] ?? 0) + 1
    changed++
    return `${pre}type: '${newType}'`
  }
)

if (changed > 0) {
  writeFileSync(SCHOOLS_TS, src)
  console.log(`\n✅ Исправлено типов: ${changed}`)
  for (const [k, v] of Object.entries(stats).sort((a,b) => b[1]-a[1])) {
    console.log(`   ${k}: ${v}`)
  }
} else {
  console.log('✅ Все типы уже корректны')
}
