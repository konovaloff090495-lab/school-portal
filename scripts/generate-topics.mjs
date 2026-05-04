#!/usr/bin/env node
/**
 * Авто-генератор новых тем для блога через Claude API
 * Запускается автоматически когда в очереди меньше THRESHOLD тем
 *
 * Использование:
 *   node scripts/generate-topics.mjs           # генерирует если < 20 тем осталось
 *   node scripts/generate-topics.mjs --force   # генерирует всегда
 *   node scripts/generate-topics.mjs --count=50 # сколько тем добавить
 */

import Anthropic from '@anthropic-ai/sdk'
import { readFileSync, writeFileSync } from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const QUEUE = path.join(__dirname, 'blog-topics.json')
const THRESHOLD = parseInt(process.env.TOPICS_THRESHOLD ?? '20')
const COUNT = parseInt(process.argv.find(a => a.startsWith('--count='))?.split('=')[1] ?? '60')
const FORCE = process.argv.includes('--force')

const ANTHROPIC_KEY = process.env.ANTHROPIC_API_KEY
if (!ANTHROPIC_KEY) { console.error('❌ Нужен ANTHROPIC_API_KEY'); process.exit(1) }
const anthropic = new Anthropic({ apiKey: ANTHROPIC_KEY })

function loadQueue() { return JSON.parse(readFileSync(QUEUE, 'utf-8')) }
function saveQueue(q) { writeFileSync(QUEUE, JSON.stringify(q, null, 2)) }

async function main() {
  const q = loadQueue()
  const pending = q.topics.filter(t => t.status === 'pending').length
  const existingSlugs = new Set(q.topics.map(t => t.slug))
  const existingTitles = q.topics.map(t => t.title).filter(Boolean).join('\n')

  console.log(`📊 Тем в очереди: ${pending}`)

  if (!FORCE && pending >= THRESHOLD) {
    console.log(`✅ Тем достаточно (${pending} >= ${THRESHOLD}), генерация не нужна`)
    return
  }

  console.log(`⚡ Генерируем ${COUNT} новых тем...`)

  const prompt = `Ты SEO-специалист образовательного портала pro-schools.ru — каталог школ России.

Сгенерируй ${COUNT} НОВЫХ уникальных тем для SEO-статей блога.

УЖЕ ЕСТЬ ТАКИЕ ТЕМЫ (не повторяй):
${existingTitles}

Требования:
- Каждая тема = реальный поисковый запрос родителей/учеников в России
- Высокая частотность: выбор школы, подготовка к ЕГЭ/ОГЭ, типы школ, конкретные города
- Категории: "Советы родителям", "Типы школ", "Рейтинги"
- Slug: строчные латинские буквы и дефисы, уникальный
- Частота (freq): примерная месячная частотность в Яндексе

Верни ТОЛЬКО валидный JSON массив, без markdown:

[
  {
    "title": "Как выбрать школу для ребёнка с СДВГ",
    "slug": "kak-vybrat-shkolu-sdvg",
    "category": "Советы родителям",
    "keywords": "школа ребёнок СДВГ",
    "freq": 2400
  }
]`

  const message = await anthropic.messages.create({
    model: 'claude-opus-4-5',
    max_tokens: 8192,
    messages: [{ role: 'user', content: prompt }],
  })

  const raw = message.content[0].text.trim()
  const jsonMatch = raw.match(/\[[\s\S]*\]/)
  if (!jsonMatch) { console.error('❌ Не получили JSON'); process.exit(1) }

  let topics
  try {
    topics = JSON.parse(jsonMatch[0].replace(/,\s*\]/g, ']').replace(/,\s*\}/g, '}'))
  } catch (e) {
    console.error('❌ JSON parse error:', e.message); process.exit(1)
  }

  const maxId = Math.max(...q.topics.map(t => parseInt(t.id.replace('t', '')) || 0))
  let added = 0

  topics.forEach((t, i) => {
    if (existingSlugs.has(t.slug)) return
    q.topics.push({
      id: 't' + String(maxId + added + 1).padStart(3, '0'),
      status: 'pending',
      title: t.title,
      slug: t.slug,
      category: t.category || 'Советы родителям',
      keywords: t.keywords || '',
      freq: t.freq || 1000,
      ...(t.city ? { city: t.city } : {}),
    })
    existingSlugs.add(t.slug)
    added++
  })

  saveQueue(q)
  const newPending = q.topics.filter(t => t.status === 'pending').length
  console.log(`✅ Добавлено тем: ${added} | Итого в очереди: ${newPending} | Дней при 5/день: ${Math.floor(newPending / 5)}`)
}

main().catch(e => { console.error('💥', e.message); process.exit(1) })
