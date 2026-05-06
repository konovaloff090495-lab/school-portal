#!/usr/bin/env node
// Удаляет дублирующиеся записи школ из schools.ts (по полю slug)
// Работает с многострочными объектами

import { readFileSync, writeFileSync } from 'fs'
import { resolve, dirname } from 'path'
import { fileURLToPath } from 'url'

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const SCHOOLS_TS = resolve(ROOT, 'src/data/schools.ts')

const content = readFileSync(SCHOOLS_TS, 'utf-8')

const OPEN = 'export const schools: School[] = (['
const CLOSE = '] as any[] as School[])'

const openIdx = content.indexOf(OPEN)
const closeIdx = content.lastIndexOf(CLOSE)

if (openIdx === -1 || closeIdx === -1) {
  console.error('❌ Не найдены маркеры массива schools')
  process.exit(1)
}

const before = content.slice(0, openIdx + OPEN.length)
const schoolsBlock = content.slice(openIdx + OPEN.length, closeIdx)
const after = content.slice(closeIdx)

// Разбиваем на отдельные записи: каждая запись — строка вида
// "  { id: '...', slug: '...', ..., lat: ..., lon: ... },"
// Ищем записи: с { по }, (включая запятую на конце)
// Используем разбивку по строкам: ищем строки { id: ... (начало записи)

const lines = schoolsBlock.split('\n')
const entries = []   // массив { lines: string[], slug: string }
let current = null

for (const line of lines) {
  if (line.match(/^\s*\{$/) || line.match(/^\s*\/\/ =====/)) {
    // Начало новой записи или секция-комментарий
    if (current && current.lines.length > 0) {
      entries.push(current)
    }
    if (line.match(/^\s*\/\/ =====/)) {
      // Комментарий секции — сохраняем как "пустую" запись без slug
      entries.push({ lines: [line], slug: null, isComment: true })
      current = null
    } else {
      current = { lines: [line], slug: null, isComment: false }
    }
  } else if (current && !current.isComment) {
    current.lines.push(line)
    const slugMatch = line.match(/slug:\s*'([^']+)'/)
    if (slugMatch) current.slug = slugMatch[1]
    // Конец записи
    if (line.match(/\},?\s*$/)) {
      entries.push(current)
      current = null
    }
  } else if (line.trim() === '' || line.trim() === ',') {
    entries.push({ lines: [line], slug: null, isComment: true })
  }
}
if (current) entries.push(current)

// Дедупликация
const seenSlugs = new Set()
const kept = []
const removed = []

for (const entry of entries) {
  if (!entry.slug || entry.isComment) {
    kept.push(entry)
    continue
  }
  if (seenSlugs.has(entry.slug)) {
    removed.push(entry.slug)
  } else {
    seenSlugs.add(entry.slug)
    kept.push(entry)
  }
}

const newBlock = kept.flatMap(e => e.lines).join('\n')
const newContent = before + newBlock + after

writeFileSync(SCHOOLS_TS, newContent)

console.log(`✅ Удалено дублей: ${removed.length}`)
removed.forEach(s => console.log(`  - ${s}`))
console.log(`📊 Уникальных школ: ${seenSlugs.size}`)
