#!/usr/bin/env node
/**
 * Берёт следующий pending город из city-queue.json и запускает generate-city.mjs
 */
import { readFileSync, writeFileSync } from 'fs'
import { execSync } from 'child_process'
import path from 'path'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const QUEUE = path.join(__dirname, 'city-queue.json')

const queue = JSON.parse(readFileSync(QUEUE, 'utf8'))
const next = queue.find(c => c.status === 'pending')

if (!next) {
  console.log('✅ Все города в очереди обработаны!')
  process.exit(0)
}

console.log(`🏙️  Генерирую школы: ${next.city} (${next.slug})`)

try {
  execSync(
    `node ${path.join(__dirname, 'generate-city.mjs')} --city="${next.city}" --slug="${next.slug}"`,
    { stdio: 'inherit', env: process.env }
  )
  next.status = 'done'
  next.doneAt = new Date().toISOString()
  console.log(`✅ Готово: ${next.city}`)
} catch (e) {
  next.status = 'error'
  next.error = String(e.message)
  console.error(`❌ Ошибка: ${next.city}`, e.message)
}

writeFileSync(QUEUE, JSON.stringify(queue, null, 2))
