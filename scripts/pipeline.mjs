#!/usr/bin/env node
/**
 * Автопайплайн наполнения сайта
 *
 * Запуск:
 *   node scripts/pipeline.mjs                    # запустить очередь
 *   node scripts/pipeline.mjs --status           # показать статус очереди
 *   node scripts/pipeline.mjs --add-city "Казань" kazan  # добавить город в очередь
 *
 * Очередь городов хранится в scripts/city-queue.json
 */

import { readFileSync, writeFileSync, existsSync } from 'fs'
import { execSync, spawn } from 'child_process'
import path from 'path'
import { fileURLToPath } from 'url'

const __dirname  = path.dirname(fileURLToPath(import.meta.url))
const ROOT       = path.join(__dirname, '..')
const QUEUE_FILE = path.join(__dirname, 'city-queue.json')

// Vercel project (pro-schools.ru)
const VERCEL_ENV = {
  ...process.env,
  VERCEL_PROJECT_ID: process.env.VERCEL_PROJECT_ID || 'prj_VYu8oMFiOeRe6Pabqug4NJaekgpJ',
  VERCEL_ORG_ID:     process.env.VERCEL_ORG_ID     || 'team_nn4HHJh7sr6tITE0mA24TmBT',
}

// ─── Очередь городов по умолчанию ───────────────────────────────────────────
const DEFAULT_QUEUE = [
  // Уже добавлены:
  { city: 'Москва',              slug: 'moskva',              status: 'done', types: 'all' },
  { city: 'Московская область',  slug: 'moskovskaya-oblast',  status: 'done', types: 'all' },
  { city: 'Новосибирск',         slug: 'novosibirsk',         status: 'done', types: 'all' },
  { city: 'Екатеринбург',        slug: 'ekaterinburg',        status: 'done', types: 'all' },

  // Очередь:
  { city: 'Казань',              slug: 'kazan',               status: 'pending' },
  { city: 'Нижний Новгород',     slug: 'nizhniy-novgorod',    status: 'pending' },
  { city: 'Санкт-Петербург',     slug: 'sankt-peterburg',     status: 'pending' },
  { city: 'Челябинск',           slug: 'chelyabinsk',         status: 'pending' },
  { city: 'Самара',              slug: 'samara',              status: 'pending' },
  { city: 'Омск',                slug: 'omsk',                status: 'pending' },
  { city: 'Ростов-на-Дону',      slug: 'rostov-na-donu',      status: 'pending' },
  { city: 'Уфа',                 slug: 'ufa',                 status: 'pending' },
  { city: 'Красноярск',          slug: 'krasnoyarsk',         status: 'pending' },
  { city: 'Пермь',               slug: 'perm',                status: 'pending' },
  { city: 'Воронеж',             slug: 'voronezh',            status: 'pending' },
  { city: 'Волгоград',           slug: 'volgograd',           status: 'pending' },
  { city: 'Краснодар',           slug: 'krasnodar',           status: 'pending' },
  { city: 'Саратов',             slug: 'saratov',             status: 'pending' },
  { city: 'Тюмень',              slug: 'tyumen',              status: 'pending' },
  { city: 'Тольятти',            slug: 'tolyatti',            status: 'pending' },
  { city: 'Ижевск',              slug: 'izhevsk',             status: 'pending' },
  { city: 'Барнаул',             slug: 'barnaul',             status: 'pending' },
  { city: 'Ульяновск',           slug: 'ulyanovsk',           status: 'pending' },
  { city: 'Иркутск',             slug: 'irkutsk',             status: 'pending' },
  { city: 'Хабаровск',           slug: 'khabarovsk',          status: 'pending' },
  { city: 'Ярославль',           slug: 'yaroslavl',           status: 'pending' },
  { city: 'Владивосток',         slug: 'vladivostok',         status: 'pending' },
  { city: 'Махачкала',           slug: 'makhachkala',         status: 'pending' },
  { city: 'Томск',               slug: 'tomsk',               status: 'pending' },
  { city: 'Оренбург',            slug: 'orenburg',            status: 'pending' },
  { city: 'Кемерово',            slug: 'kemerovo',            status: 'pending' },
  { city: 'Новокузнецк',         slug: 'novokuznetsk',        status: 'pending' },
  { city: 'Рязань',              slug: 'ryazan',              status: 'pending' },
  { city: 'Астрахань',           slug: 'astrakhan',           status: 'pending' },
  { city: 'Набережные Челны',    slug: 'naberezhnye-chelny',  status: 'pending' },
  { city: 'Пенза',               slug: 'penza',               status: 'pending' },
  { city: 'Липецк',              slug: 'lipetsk',             status: 'pending' },
  { city: 'Тула',                slug: 'tula',                status: 'pending' },
  { city: 'Киров',               slug: 'kirov',               status: 'pending' },
  { city: 'Чебоксары',           slug: 'cheboksary',          status: 'pending' },
  { city: 'Калининград',         slug: 'kaliningrad',         status: 'pending' },
  { city: 'Брянск',              slug: 'bryansk',             status: 'pending' },
  { city: 'Курск',               slug: 'kursk',               status: 'pending' },
  { city: 'Иваново',             slug: 'ivanovo',             status: 'pending' },
  { city: 'Магнитогорск',        slug: 'magnitogorsk',        status: 'pending' },
  { city: 'Тверь',               slug: 'tver',                status: 'pending' },
  { city: 'Ставрополь',          slug: 'stavropol',           status: 'pending' },
  { city: 'Белгород',            slug: 'belgorod',            status: 'pending' },
  { city: 'Сочи',                slug: 'sochi',               status: 'pending' },
  { city: 'Нижний Тагил',        slug: 'nizhniy-tagil',       status: 'pending' },
]

// ─── Загрузить/создать очередь ───────────────────────────────────────────────
function loadQueue() {
  if (existsSync(QUEUE_FILE)) {
    return JSON.parse(readFileSync(QUEUE_FILE, 'utf-8'))
  }
  writeFileSync(QUEUE_FILE, JSON.stringify(DEFAULT_QUEUE, null, 2))
  return DEFAULT_QUEUE
}

function saveQueue(queue) {
  writeFileSync(QUEUE_FILE, JSON.stringify(queue, null, 2))
}

// ─── Статус очереди ──────────────────────────────────────────────────────────
function showStatus() {
  const queue = loadQueue()
  const done    = queue.filter(c => c.status === 'done')
  const pending = queue.filter(c => c.status === 'pending')
  const failed  = queue.filter(c => c.status === 'failed')

  console.log(`\n📊 Статус пайплайна:`)
  console.log(`   ✅ Готово   : ${done.length} городов`)
  console.log(`   ⏳ В очереди: ${pending.length} городов`)
  console.log(`   ❌ Ошибки   : ${failed.length} городов`)

  if (pending.length > 0) {
    console.log(`\n⏳ Следующие в очереди:`)
    pending.slice(0, 10).forEach((c, i) => console.log(`   ${i+1}. ${c.city} (${c.slug})`))
    if (pending.length > 10) console.log(`   ... и ещё ${pending.length - 10}`)
  }

  if (failed.length > 0) {
    console.log(`\n❌ С ошибками:`)
    failed.forEach(c => console.log(`   - ${c.city}: ${c.error ?? 'неизвестно'}`))
  }

  console.log(`\n💡 Для запуска: node scripts/pipeline.mjs`)
  console.log(`   Один город: node scripts/pipeline.mjs --city-only=kazan`)
}

// ─── Добавить город в очередь ────────────────────────────────────────────────
function addCity(name, slug) {
  const queue = loadQueue()
  if (queue.find(c => c.slug === slug)) {
    console.log(`⚠️  Город ${name} (${slug}) уже есть в очереди`)
    return
  }
  queue.push({ city: name, slug, status: 'pending' })
  saveQueue(queue)
  console.log(`✅ Добавлен: ${name} (${slug})`)
}

// ─── Запустить generate-city для одного города ───────────────────────────────
function runGenerate(city, slug) {
  return new Promise((resolve, reject) => {
    const args = [
      'scripts/generate-city.mjs',
      `--city=${city}`,
      `--slug=${slug}`,
      '--no-deploy',   // деплой делаем один раз в конце пачки
    ]
    console.log(`\n${'─'.repeat(60)}`)
    console.log(`🏙  Обрабатываем: ${city} (${slug})`)
    console.log(`${'─'.repeat(60)}`)

    const proc = spawn('node', args, { stdio: 'inherit', cwd: ROOT })
    proc.on('close', code => {
      if (code === 0) resolve()
      else if (code === 2) reject(Object.assign(new Error('API credit balance exhausted'), { fatalCode: 2 }))
      else reject(new Error(`Процесс завершился с кодом ${code}`))
    })
  })
}

// ─── Деплой ──────────────────────────────────────────────────────────────────
function deploy() {
  return new Promise((resolve, reject) => {
    console.log('\n🚀 Деплой на Vercel...')
    const proc = spawn('npx', ['vercel', '--prod', '--yes'], { stdio: 'inherit', cwd: ROOT, env: VERCEL_ENV })
    proc.on('close', code => code === 0 ? resolve() : reject(new Error('Deploy failed')))
  })
}

// ─── Главный цикл ────────────────────────────────────────────────────────────
async function runPipeline(options = {}) {
  const queue = loadQueue()
  const onlySlug = options.cityOnly

  const toProcess = onlySlug
    ? queue.filter(c => c.slug === onlySlug)
    : queue.filter(c => c.status === 'pending')

  if (toProcess.length === 0) {
    console.log('✅ Все города уже обработаны!')
    showStatus()
    return
  }

  console.log(`\n🚀 Пайплайн запущен`)
  console.log(`   Городов в очереди: ${toProcess.length}`)
  console.log(`   ANTHROPIC_API_KEY: ${process.env.ANTHROPIC_API_KEY ? '✅ найден' : '❌ не задан'}`)

  if (!process.env.ANTHROPIC_API_KEY) {
    console.error('\n❌ Задайте переменную: export ANTHROPIC_API_KEY=sk-ant-...')
    process.exit(1)
  }

  let processedCount = 0

  for (const entry of toProcess) {
    // Помечаем как "в обработке"
    const idx = queue.findIndex(c => c.slug === entry.slug)
    queue[idx].status = 'in-progress'
    saveQueue(queue)

    try {
      await runGenerate(entry.city, entry.slug)

      queue[idx].status = 'done'
      queue[idx].doneAt = new Date().toISOString()
      saveQueue(queue)
      processedCount++

      // Деплоим после каждого города (чтобы сайт обновлялся постепенно)
      if (!options.noDeploy) {
        await deploy()
        console.log(`✅ ${entry.city} задеплоен`)
      }

    } catch (e) {
      console.error(`\n❌ Ошибка для ${entry.city}:`, e.message)
      queue[idx].status = 'failed'
      queue[idx].error = e.message
      saveQueue(queue)
      // Если закончился баланс — останавливаем весь пайплайн
      if (e.fatalCode === 2) {
        console.error('\n💳 Пайплайн остановлен: недостаточно средств на API.')
        console.error('   Пополните баланс и запустите снова: node scripts/pipeline.mjs')
        break
      }
      // Иначе продолжаем со следующим городом
    }

    // Пауза между городами (чтобы не перегружать API)
    if (processedCount < toProcess.length) {
      console.log('\n⏸  Пауза 5 сек...')
      await new Promise(r => setTimeout(r, 5000))
    }
  }

  console.log(`\n${'═'.repeat(60)}`)
  console.log(`🎉 Пайплайн завершён!`)
  console.log(`   Обработано городов: ${processedCount}`)
  showStatus()
}

// ─── CLI ─────────────────────────────────────────────────────────────────────
const cliArgs = process.argv.slice(2)

if (cliArgs.includes('--status')) {
  showStatus()
} else if (cliArgs.includes('--add-city')) {
  const nameIdx = cliArgs.indexOf('--add-city') + 1
  const slugIdx = nameIdx + 1
  addCity(cliArgs[nameIdx], cliArgs[slugIdx])
} else {
  const cityOnly = cliArgs.find(a => a.startsWith('--city-only='))?.split('=')[1]
  const noDeploy = cliArgs.includes('--no-deploy')
  runPipeline({ cityOnly, noDeploy }).catch(e => {
    console.error('Fatal:', e.message)
    process.exit(1)
  })
}
