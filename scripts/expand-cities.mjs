#!/usr/bin/env node
/**
 * Ежедневное расширение карточек школ по городам.
 * Каждый день: следующий город в ротации → следующий тип → +15 школ.
 *
 * Запуск: node scripts/expand-cities.mjs
 */

import { readFileSync, writeFileSync, existsSync } from 'fs'
import { execSync } from 'child_process'
import path from 'path'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const STATE_FILE = path.join(__dirname, 'expand-state.json')
const ROOT = path.join(__dirname, '..')

// Города в ротации с русскими именами
const CITIES = [
  { slug: 'moskva',            name: 'Москва' },
  { slug: 'sankt-peterburg',   name: 'Санкт-Петербург' },
  { slug: 'ekaterinburg',      name: 'Екатеринбург' },
  { slug: 'novosibirsk',       name: 'Новосибирск' },
  { slug: 'kazan',             name: 'Казань' },
  { slug: 'nizhniy-novgorod',  name: 'Нижний Новгород' },
  { slug: 'moskovskaya-oblast',name: 'Московская область' },
  { slug: 'chelyabinsk',       name: 'Челябинск' },
  { slug: 'samara',            name: 'Самара' },
  { slug: 'ufa',               name: 'Уфа' },
  { slug: 'krasnodar',         name: 'Краснодар' },
  { slug: 'perm',              name: 'Пермь' },
  { slug: 'voronezh',          name: 'Воронеж' },
  { slug: 'volgograd',         name: 'Волгоград' },
  { slug: 'rostov-na-donu',    name: 'Ростов-на-Дону' },
  { slug: 'omsk',              name: 'Омск' },
]

const TYPES = [
  'gosudarstvennye', 'chastnie', 'gimnazii', 'profilnye',
  'pri-vuzakh', 'semejnye', 'online', 'kadetskie',
  'korrektsionnye', 'domashnie', 'vechernie', 'eksternal',
  'mezhdunarodnie',
]

// Читаем состояние ротации
let state = { cityIndex: 0, typeIndex: 0, totalAdded: 0 }
if (existsSync(STATE_FILE)) {
  try { state = JSON.parse(readFileSync(STATE_FILE, 'utf8')) } catch {}
}

const city = CITIES[state.cityIndex % CITIES.length]
const type = TYPES[state.typeIndex % TYPES.length]

console.log(`📅 ${new Date().toLocaleDateString('ru-RU')} — ежедневное расширение каталога`)
console.log(`🏙️  Город: ${city.name} (${city.slug})`)
console.log(`📚 Тип:   ${type}`)
console.log(`➕ Добавляем: 15 школ\n`)

if (!process.env.ANTHROPIC_API_KEY) {
  console.error('❌ Нет ANTHROPIC_API_KEY')
  process.exit(1)
}

try {
  execSync(
    `node ${path.join(__dirname, 'generate-city.mjs')} --city="${city.name}" --slug="${city.slug}" --types="${type}" --count=15`,
    { stdio: 'inherit', env: process.env, cwd: ROOT }
  )

  // Обновляем состояние — на следующий день следующий тип, после всех типов — след. город
  state.typeIndex = (state.typeIndex + 1) % TYPES.length
  if (state.typeIndex === 0) {
    state.cityIndex = (state.cityIndex + 1) % CITIES.length
  }
  state.totalAdded = (state.totalAdded || 0) + 15
  state.lastRun = new Date().toISOString()

  writeFileSync(STATE_FILE, JSON.stringify(state, null, 2))
  console.log(`\n✅ Готово! Всего добавлено через скрипт: ${state.totalAdded} школ`)
  console.log(`   Следующий запуск: ${CITIES[state.cityIndex % CITIES.length].name} — ${TYPES[state.typeIndex % TYPES.length]}`)
} catch (e) {
  console.error('❌ Ошибка:', e.message)
  process.exit(1)
}
