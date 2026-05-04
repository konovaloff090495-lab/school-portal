#!/usr/bin/env node
/**
 * Трекер расходов на Claude API
 * Каждый запуск скриптов записывает стоимость сюда
 *
 * Использование:
 *   node scripts/cost-tracker.mjs log --type=blog --tokens-in=1000 --tokens-out=5000 --usd=0.40
 *   node scripts/cost-tracker.mjs report          # отчёт за неделю
 *   node scripts/cost-tracker.mjs report --days=30 # за месяц
 */

import { readFileSync, writeFileSync, existsSync } from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const LOG_FILE = path.join(__dirname, 'cost-log.json')

const args = process.argv.slice(2)
const command = args[0]
const params = Object.fromEntries(
  args.slice(1).filter(a => a.startsWith('--')).map(a => {
    const [k, ...v] = a.slice(2).split('=')
    return [k, v.join('=') || true]
  })
)

function loadLog() {
  if (!existsSync(LOG_FILE)) return { entries: [] }
  try { return JSON.parse(readFileSync(LOG_FILE, 'utf-8')) } catch { return { entries: [] } }
}

function saveLog(data) {
  writeFileSync(LOG_FILE, JSON.stringify(data, null, 2))
}

if (command === 'log') {
  const log = loadLog()
  log.entries.push({
    date: new Date().toISOString(),
    type: params.type || 'unknown',
    tokensIn: parseInt(params['tokens-in'] || '0'),
    tokensOut: parseInt(params['tokens-out'] || '0'),
    usd: parseFloat(params.usd || '0'),
  })
  saveLog(log)
  console.log(`Записано: ${params.type} $${parseFloat(params.usd || '0').toFixed(4)}`)
}

if (command === 'report') {
  const log = loadLog()
  const days = parseInt(params.days || '7')
  const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000)

  const recent = log.entries.filter(e => new Date(e.date) >= since)
  const totalUsd = recent.reduce((s, e) => s + (e.usd || 0), 0)
  const totalRub = totalUsd * 90

  const byType = {}
  recent.forEach(e => {
    byType[e.type] = byType[e.type] || { count: 0, usd: 0 }
    byType[e.type].count++
    byType[e.type].usd += e.usd || 0
  })

  const lines = [
    `📊 Расходы Claude API за ${days} дней:`,
    '',
  ]

  const typeLabels = { blog: '📝 Статьи', city: '🏙 Города', expand: '🏫 Карточки', topics: '💡 Темы' }
  Object.entries(byType).forEach(([type, data]) => {
    lines.push(`${typeLabels[type] || type}: ${data.count} запусков — $${data.usd.toFixed(2)}`)
  })

  lines.push('')
  lines.push(`💵 Итого: $${totalUsd.toFixed(2)} (~${Math.round(totalRub)} ₽)`)

  // Оцениваем остаток (если знаем начальный баланс)
  const allTime = log.entries.reduce((s, e) => s + (e.usd || 0), 0)
  lines.push(`📈 Всего потрачено: $${allTime.toFixed(2)}`)
  lines.push('')
  lines.push(`🔗 Проверить баланс: https://console.anthropic.com/settings/billing`)

  console.log(lines.join('\n'))

  // JSON для workflow
  if (params.json) {
    console.log('\nJSON:' + JSON.stringify({
      days,
      totalUsd: totalUsd.toFixed(2),
      totalRub: Math.round(totalRub),
      allTimeUsd: allTime.toFixed(2),
      byType,
      report: lines.join('\n'),
    }))
  }
}
