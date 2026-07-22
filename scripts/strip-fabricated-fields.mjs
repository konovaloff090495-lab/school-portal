#!/usr/bin/env node
/**
 * strip-fabricated-fields.mjs — вычищает выдуманные атрибуты школ.
 *
 * Когорта, залитая генератором: rating есть, координат нет, сайта нет.
 * У неё выдуманы рейтинг, число отзывов и телефон (характерные «+7 (8452) 90-12-34»).
 * Рейтинг при этом уходит в Schema.org как aggregateRating — это прямое нарушение
 * правил Google и Яндекса о структурированных данных.
 *
 * Скрипт НЕ удаляет карточки — только обнуляет недостоверные поля:
 *   rating -> null, reviewCount -> 0, phone -> убирается
 * Страницы и трафик остаются, FAQ автоматически переключается на форму заявки
 * (см. generateFaq в src/app/shkola/[slug]/page.tsx).
 *
 * Запуск: node scripts/strip-fabricated-fields.mjs [--dry]
 */

import { readFileSync, writeFileSync } from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const __dirname  = path.dirname(fileURLToPath(import.meta.url))
const SCHOOLS_TS = path.join(__dirname, '..', 'src', 'data', 'schools.ts')
const DRY = process.argv.includes('--dry')

let src = readFileSync(SCHOOLS_TS, 'utf8')
const start = src.indexOf('export const schools = ([')
const end   = src.lastIndexOf('] as any[] as School[])')
if (start === -1 || end === -1) throw new Error('не найдены границы массива schools')

const head = src.slice(0, start)
const body = src.slice(start, end)
const tail = src.slice(end)

const blocks = body.split(/\n(?=\s*\{\n)/)

let stripped = 0, keptRating = 0
const out = blocks.map(b => {
  if (!/^\s*\{/.test(b)) return b

  const hasRating = /\n    rating: [\d.]+/.test(b)
  const hasGeo    = /\n    (lat|lon):/.test(b)
  const hasSite   = /\n    website:/.test(b)

  if (!hasRating) return b
  if (hasGeo || hasSite) { keptRating++; return b }   // есть подтверждение из внешнего источника

  stripped++
  return b
    .replace(/\n    rating: [\d.]+,/, '\n    rating: null,')
    .replace(/\n    reviewCount: \d+,/, '\n    reviewCount: 0,')
    .replace(/\n    phone: '(?:[^'\\]|\\.)*',/, "\n    phone: '',")
})

console.log(`Обнулено недостоверных рейтингов/телефонов: ${stripped}`)
console.log(`Оставлено рейтингов с внешним подтверждением (гео или сайт): ${keptRating}`)

if (!DRY) {
  writeFileSync(SCHOOLS_TS, head + out.join('\n') + tail, 'utf8')
  console.log('💾 schools.ts обновлён')
} else {
  console.log('🔍 DRY RUN — файл не менялся')
}
