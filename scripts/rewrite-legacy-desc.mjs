#!/usr/bin/env node
/**
 * rewrite-legacy-desc.mjs — переписывает описания школ, залитых старым парсером.
 *
 * Старый parse-overpass.mjs генерировал fullDescription по шаблону
 * «… — государственная школа в Нижний Тагил. Предоставляет качественное образование…
 *  Классы с 1–11 класс.» — с ошибкой падежа в названии города, кривой фразой про
 * классы и одинаковым текстом на 1690 карточках. Скрипт заменяет их на тексты
 * из общего генератора (scripts/lib/school-text.mjs) с правильным предложным
 * падежом и вариативностью.
 *
 * Запуск:
 *   node scripts/rewrite-legacy-desc.mjs --dry
 *   node scripts/rewrite-legacy-desc.mjs
 */

import { readFileSync, writeFileSync } from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'
import { createJiti } from '../node_modules/jiti/lib/jiti.mjs'
import { makeDescriptions, TYPE_META } from './lib/school-text.mjs'

const __dirname  = path.dirname(fileURLToPath(import.meta.url))
const SCHOOLS_TS = path.join(__dirname, '..', 'src', 'data', 'schools.ts')
const DRY = process.argv.includes('--dry')

const jiti = createJiti(import.meta.url, { interopDefault: true })
const { regionLabels, regionLabelsIn } = await jiti.import(SCHOOLS_TS)

const LEGACY = 'Предоставляет качественное образование в соответствии с государственным стандартом ФГОС'

let src = readFileSync(SCHOOLS_TS, 'utf8')

// Границы массива школ
const start = src.indexOf('export const schools = ([')
const end   = src.lastIndexOf('] as any[] as School[])')
if (start === -1 || end === -1) throw new Error('не найдены границы массива schools')

const head = src.slice(0, start)
const body = src.slice(start, end)
const tail = src.slice(end)

// Режем тело на блоки по «\n  {\n» — карточки лежат ровно на этом отступе
const blocks = body.split(/\n(?=  \{\n)/)
const field = (b, name) => {
  const m = b.match(new RegExp(`\\n    ${name}: '((?:[^'\\\\]|\\\\.)*)'`))
  return m ? m[1].replace(/\\'/g, "'").replace(/\\\\/g, '\\') : null
}
const esc = v => String(v ?? '').replace(/\\/g, '\\\\').replace(/'/g, "\\'")

let fixed = 0, skipped = 0
const samples = []

const out = blocks.map(b => {
  if (!b.includes(LEGACY)) return b

  const name   = field(b, 'name')
  const region = field(b, 'region')
  const city   = field(b, 'city')
  const type   = field(b, 'type')
  const address = field(b, 'address')
  if (!name || !region || !type || !TYPE_META[type]) { skipped++; return b }

  const cityName = city || regionLabels[region] || ''
  const cityIn   = regionLabelsIn[region] || `в ${cityName}`
  const meta     = TYPE_META[type]
  const { description, fullDescription } = makeDescriptions(name, type, cityName, cityIn, address, meta)

  let nb = b
    .replace(/\n    description: '(?:[^'\\]|\\.)*'/, `\n    description: '${esc(description)}'`)
    .replace(/\n    fullDescription: '(?:[^'\\]|\\.)*'/, `\n    fullDescription: '${esc(fullDescription)}'`)

  // imageAlt у старых записей тоже с ошибкой падежа
  if (/\n    imageAlt: '/.test(nb)) {
    nb = nb.replace(/\n    imageAlt: '(?:[^'\\]|\\.)*'/, `\n    imageAlt: '${esc(`${name} — ${meta.label} ${cityIn}`)}'`)
  }

  fixed++
  if (samples.length < 3) samples.push({ name, cityIn, fullDescription })
  return nb
})

console.log(`Переписано карточек: ${fixed}${skipped ? `, пропущено (неизвестный тип): ${skipped}` : ''}`)
samples.forEach(s => console.log(`\n· ${s.name} (${s.cityIn})\n  ${s.fullDescription.slice(0, 220)}…`))

if (!DRY) {
  writeFileSync(SCHOOLS_TS, head + out.join('\n') + tail, 'utf8')
  console.log('\n💾 schools.ts обновлён')
} else {
  console.log('\n🔍 DRY RUN — файл не менялся')
}
