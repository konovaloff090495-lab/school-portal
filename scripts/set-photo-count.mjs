#!/usr/bin/env node
/**
 * Проставляет в src/data/schools.ts поле photoCount (0..3) для каждой ШКОЛЫ —
 * фактическое число существующих файлов public/schools/{slug}-1|2|3.jpg.
 *
 * Только объекты School (у них есть поле city:). Объекты-метаданные
 * FeatureMeta/ProfileMeta/LanguageMeta тоже имеют slug, но НЕ являются школами —
 * их пропускаем, иначе tsc падает на неизвестном свойстве.
 *
 * Идемпотентно: сносит старые строки photoCount и вставляет свежие после slug.
 * Запуск (после загрузки/удаления фото):
 *   node scripts/set-photo-count.mjs
 */
import { existsSync, readFileSync, writeFileSync } from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const __dirname  = path.dirname(fileURLToPath(import.meta.url))
const ROOT       = path.join(__dirname, '..')
const PUBLIC_DIR = path.join(ROOT, 'public', 'schools')
const SCHOOLS_TS = path.join(ROOT, 'src', 'data', 'schools.ts')

const GALLERY = 3
let src = readFileSync(SCHOOLS_TS, 'utf-8')

// 1. Снести все ранее вставленные строки photoCount (indent 4), чтобы не плодить дубли.
src = src.replace(/^ {4}photoCount: \d+,\n/gm, '')

const lines = src.split('\n')
const out = []
const dist = { 0: 0, 1: 0, 2: 0, 3: 0 }
let schools = 0, skippedMeta = 0

const isSlug   = l => l.match(/^ {4}slug: '([^']+)',$/)
const isCity   = l => /^ {4}city: '/.test(l)
const isObjEnd = l => /^ {2}\},?$/.test(l)   // закрытие объекта School (indent 2)

for (let idx = 0; idx < lines.length; idx++) {
  const line = lines[idx]
  out.push(line)

  const m = isSlug(line)
  if (!m) continue

  // Определяем, School ли это: в пределах объекта встречается city:
  let isSchool = false
  for (let j = idx + 1; j < lines.length; j++) {
    if (isSlug(lines[j]) || isObjEnd(lines[j])) break
    if (isCity(lines[j])) { isSchool = true; break }
  }
  if (!isSchool) { skippedMeta++; continue }

  const slug = m[1]
  let n = 0
  for (let i = 1; i <= GALLERY; i++) {
    if (existsSync(path.join(PUBLIC_DIR, `${slug}-${i}.jpg`))) n++
  }
  dist[n]++
  schools++
  out.push(`    photoCount: ${n},`)
}

src = out.join('\n')

// Поле в интерфейсе School.
if (!/^ {2}photoCount: number$/m.test(src)) {
  src = src.replace(/^( {2}imageAlt: string)$/m, '$1\n  photoCount: number')
}

writeFileSync(SCHOOLS_TS, src)

console.log('Школ обработано:', schools)
console.log('Пропущено не-школ (meta):', skippedMeta)
console.log('Распределение photoCount:')
for (const k of [0, 1, 2, 3]) console.log(`  ${k} фото: ${dist[k]}`)
