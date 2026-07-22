#!/usr/bin/env node
/**
 * fix-fake-phones-and-types.mjs — добивает два дефекта, оставшихся после первой чистки.
 *
 * 1. Телефоны-лесенки («+7 (812) 345-67-89», «+7 (499) 977-65-43»). Пережили
 *    первую чистку, потому что тот фильтр щадил карточки с координатами.
 *    Среди них есть реальные школы (ГБОУ Гимназия № 1588, МАОУ «Лицей № 40»)
 *    с приделанным выдуманным номером, поэтому карточки НЕ удаляем — только
 *    стираем телефон. Пустой телефон карточка переживает: FAQ и блок контактов
 *    переключаются на форму заявки.
 *
 * 2. Спортивные школы, лежащие в типе «государственные» или «интернаты»: «Школа
 *    бокса», «Детско-юношеская школа единоборств», училища олимпийского резерва.
 *    Ничего не удаляем — среди них есть реальные учебные заведения с общим
 *    образованием (московское «Самбо-70»). Просто переносим в тип «спортивные»,
 *    где им и место: в «государственных» они путают родителей, которые ищут
 *    обычную школу.
 *
 * Запуск: node scripts/fix-fake-phones-and-types.mjs [--dry]
 */

import { readFileSync, writeFileSync } from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const __dirname  = path.dirname(fileURLToPath(import.meta.url))
const SCHOOLS_TS = path.join(__dirname, '..', 'src', 'data', 'schools.ts')
const DRY = process.argv.includes('--dry')

// Реальный номер почти никогда не идёт цифровой лесенкой.
function isSequential(phone) {
  const d = (phone || '').replace(/\D/g, '')
  if (d.length < 10) return false
  const local = d.slice(-7)
  let up = 1, down = 1, maxUp = 1, maxDown = 1
  for (let i = 1; i < local.length; i++) {
    const prev = +local[i - 1], cur = +local[i]
    up   = (cur === (prev + 1) % 10) ? up + 1 : 1
    down = (prev === (cur + 1) % 10) ? down + 1 : 1
    maxUp = Math.max(maxUp, up); maxDown = Math.max(maxDown, down)
  }
  return maxUp >= 5 || maxDown >= 5
}

// Всё спортивное — переносим в тип sportivnye, не удаляем
const SPORT_SCHOOL = /олимпийского резерва|сдюсшор|сшор\b|дюсш\b|школа бокса|школа единоборств|школа боевых иску|школа боевых исску|школа плавания|школа каратэ|школа дзюдо|школа фигурного катания|школа художественной гимнастики/i

let src = readFileSync(SCHOOLS_TS, 'utf8')
const start = src.indexOf('export const schools = ([')
const end   = src.lastIndexOf('] as any[] as School[])')
const head = src.slice(0, start), body = src.slice(start, end), tail = src.slice(end)
const blocks = body.split(/\n(?=\s*\{\n)/)

const field = (b, name) => {
  const m = b.match(new RegExp(`\\n    ${name}: '((?:[^'\\\\]|\\\\.)*)'`))
  return m ? m[1] : null
}

let phonesCleared = 0, retyped = 0
const samples = { phones: [], retyped: [] }

const kept = []
for (let b of blocks) {
  const name = field(b, 'name')
  const type = field(b, 'type')

  if (name && type && type !== 'sportivnye' && SPORT_SCHOOL.test(name)) {
    b = b.replace(/\n    type: '[^']*',/, `\n    type: 'sportivnye',`)
    retyped++
    if (samples.retyped.length < 5) samples.retyped.push(`${name} (${field(b, 'city')}): ${type} -> sportivnye`)
  }

  const phone = field(b, 'phone')
  if (isSequential(phone)) {
    b = b.replace(/\n    phone: '(?:[^'\\]|\\.)*',/, "\n    phone: '',")
    phonesCleared++
    if (samples.phones.length < 5) samples.phones.push(`${phone} — ${name}`)
  }

  kept.push(b)
}

console.log(`Стёрто выдуманных телефонов: ${phonesCleared}`)
samples.phones.forEach(s => console.log('  ·', s))
console.log(`Переведено в тип «спортивные»: ${retyped}`)
samples.retyped.forEach(s => console.log('  ·', s))

if (!DRY) {
  writeFileSync(SCHOOLS_TS, head + kept.join('\n') + tail, 'utf8')
  console.log('💾 schools.ts обновлён')
} else {
  console.log('🔍 DRY RUN — файл не менялся')
}
