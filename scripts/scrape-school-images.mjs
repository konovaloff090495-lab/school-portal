#!/usr/bin/env node
/**
 * Бот скачивания фото школ через Яндекс.Картинки
 *
 * Запуск:
 *   node scripts/scrape-school-images.mjs                     # все школы
 *   node scripts/scrape-school-images.mjs --only-missing       # только без фото
 *   node scripts/scrape-school-images.mjs --limit=20           # первые 20 школ
 *   node scripts/scrape-school-images.mjs --slug=some-slug     # одна школа
 *   node scripts/scrape-school-images.mjs --visible            # показать браузер
 */

import { chromium } from 'playwright'
import { existsSync, mkdirSync, readFileSync, writeFileSync, createWriteStream } from 'fs'
import { statSync, unlinkSync } from 'fs'
import { pipeline } from 'stream/promises'
import path from 'path'
import { fileURLToPath } from 'url'

const __dirname  = path.dirname(fileURLToPath(import.meta.url))
const ROOT       = path.join(__dirname, '..')
const PUBLIC_DIR = path.join(ROOT, 'public', 'schools')
const SCHOOLS_TS = path.join(ROOT, 'src', 'data', 'schools.ts')
const PROGRESS_F = path.join(ROOT, '.img-progress.json')

const PHOTOS_PER_SCHOOL     = 3
const DELAY_MIN             = 3000   // мин задержка между школами (мс)
const DELAY_MAX             = 5000   // макс задержка (случайная)
const PAUSE_EVERY           = 25     // каждые N школ — большая пауза
const PAUSE_DURATION        = 20000  // большая пауза (мс)
const BLOCK_PAUSE           = 45000  // пауза при обнаружении блокировки
const MIN_FILE_SIZE         = 3000   // байт
const HEADLESS = !process.argv.includes('--visible')

if (!existsSync(PUBLIC_DIR)) mkdirSync(PUBLIC_DIR, { recursive: true })

// ─── CLI ──────────────────────────────────────────────────────────────────────
const ONLY_MISSING = process.argv.includes('--only-missing')
const limitArg     = process.argv.find(a => a.startsWith('--limit='))
const LIMIT        = limitArg ? parseInt(limitArg.split('=')[1]) : Infinity
const slugArg      = process.argv.find(a => a.startsWith('--slug='))
const ONLY_SLUG    = slugArg ? slugArg.split('=')[1] : null

// ─── Парсинг schools.ts ───────────────────────────────────────────────────────
function parseSchools(filePath) {
  const content = readFileSync(filePath, 'utf-8')
  const schools = []
  // Split on any { that starts a school object (1-6 spaces indent)
  for (const block of content.split(/\n {1,6}\{/)) {
    const slug = block.match(/\bslug:\s*['"]([^'"]+)['"]/)?.[1]
    const name = block.match(/\bname:\s*['"]([^'"]+)['"]/)?.[1]
    const city = block.match(/\bcity:\s*['"]([^'"]+)['"]/)?.[1]
    const type = block.match(/\btype:\s*['"]([^'"]+)['"]/)?.[1]
    if (slug && name && city) schools.push({ slug, name, city, type: type ?? 'gosudarstvennye' })
  }
  return schools
}

// ─── Прогресс ─────────────────────────────────────────────────────────────────
let progress = {}
if (existsSync(PROGRESS_F)) { try { progress = JSON.parse(readFileSync(PROGRESS_F, 'utf-8')) } catch {} }
function saveProgress() { writeFileSync(PROGRESS_F, JSON.stringify(progress, null, 2)) }
function sleep(ms) { return new Promise(r => setTimeout(r, ms)) }
function randomDelay() { return sleep(DELAY_MIN + Math.random() * (DELAY_MAX - DELAY_MIN)) }

function photoPath(slug, n) { return path.join(PUBLIC_DIR, `${slug}-${n}.jpg`) }
function photoExists(slug, n) { return existsSync(photoPath(slug, n)) }
function anyPhotoExists(slug) {
  for (let i = 1; i <= PHOTOS_PER_SCHOOL; i++) if (photoExists(slug, i)) return true
  return false
}
function nextMissingSlot(slug) {
  for (let i = 1; i <= PHOTOS_PER_SCHOOL; i++) if (!photoExists(slug, i)) return i
  return null
}

// ─── Скачать URL → файл ───────────────────────────────────────────────────────
async function downloadUrl(url, destPath, referer = 'https://yandex.ru/') {
  const res = await fetch(url, {
    headers: {
      'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/121.0.0.0 Safari/537.36',
      'Accept': 'image/avif,image/webp,image/apng,image/*,*/*;q=0.8',
      'Accept-Language': 'ru-RU,ru;q=0.9',
      'Referer': referer,
    },
    signal: AbortSignal.timeout(25000),
    redirect: 'follow',
  })
  if (!res.ok) throw new Error(`HTTP ${res.status}`)
  const ct = res.headers.get('content-type') ?? ''
  if (ct.includes('text/html') || ct.includes('application/json')) throw new Error(`Not image: ${ct}`)
  await pipeline(res.body, createWriteStream(destPath))
  const size = statSync(destPath).size
  if (size < MIN_FILE_SIZE) { unlinkSync(destPath); throw new Error(`Too small: ${size}b`) }
}

// Яндекс thumbnail URLs: https://avatars.mds.yandex.net/i?id=...&n=13
// n=13 уже даёт ~33KB — самый большой вариант, оставляем как есть
function upgradeYandexThumb(url) { return url }

// ─── Основная функция: получить URL фото для школы ───────────────────────────
async function getImageUrls(page, school) {
  const query = `${school.name} ${school.city}`
  const searchUrl = `https://yandex.ru/images/search?text=${encodeURIComponent(query)}&itype=jpg`

  // Загружаем страницу — пробуем networkidle, fallback на domcontentloaded
  try {
    await page.goto(searchUrl, { waitUntil: 'networkidle', timeout: 25000 })
  } catch {
    await sleep(2000)
  }

  // Проверяем капчу / блокировку
  const blocked = await page.evaluate(() => {
    const hasCaptcha = !!document.querySelector('.CheckboxCaptcha, .AdvancedCaptcha, #captcha')
    const imgCount   = document.querySelectorAll('img.ImagesContentImage-Image').length
    const isBlocked  = hasCaptcha || (document.title.includes('captcha') || document.title.includes('Ошибка'))
    return { hasCaptcha, imgCount, isBlocked }
  })

  if (blocked.isBlocked || blocked.imgCount === 0) {
    // Яндекс заблокировал — долгая пауза, потом retry
    process.stdout.write(`⏸ блок, пауза ${BLOCK_PAUSE/1000}с... `)
    await sleep(BLOCK_PAUSE)
    try {
      await page.goto(searchUrl, { waitUntil: 'networkidle', timeout: 25000 })
    } catch {
      await sleep(3000)
    }
  }

  // Ждём появления картинок с src
  await page.waitForFunction(
    () => document.querySelectorAll('img.ImagesContentImage-Image[src]').length >= 3,
    { timeout: 8000 }
  ).catch(() => {})

  await sleep(300)

  // Извлекаем src из img-элементов и origUrl из JSON
  const urls = await page.evaluate(() => {
    const result = []
    const seen = new Set()

    // ── 1. img элементы в сетке результатов ──
    const imgEls = [
      ...document.querySelectorAll('.ImagesContentImage-Image'),
      ...document.querySelectorAll('img[class*="ImagesContent"]'),
      ...document.querySelectorAll('.serp-item img'),
      ...document.querySelectorAll('[class*="serp-item"] img'),
    ]
    for (const img of imgEls) {
      let src = img.getAttribute('src') || img.getAttribute('data-src') || ''
      // протокол-относительные URL → https
      if (src.startsWith('//')) src = 'https:' + src
      if (src && src.startsWith('https') && !seen.has(src)) {
        seen.add(src)
        result.push({ url: src, type: 'thumb' })
      }
      if (result.length >= 12) break
    }

    // ── 2. origUrl из embedded JSON ──
    const scriptTexts = [...document.querySelectorAll('script:not([src])')].map(s => s.textContent ?? '')
    for (const text of scriptTexts) {
      if (!text.includes('"origUrl"')) continue
      const matches = [...text.matchAll(/"origUrl"\s*:\s*"([^"\\]+(?:\\.[^"\\]*)*)"/g)]
      for (const m of matches) {
        const url = m[1].replace(/\\u002F/g, '/').replace(/\\\//g, '/').replace(/\\"/g, '"')
        if (url.startsWith('http') && !seen.has(url)) {
          seen.add(url)
          result.push({ url, type: 'orig' })
        }
        if (result.length >= 20) break
      }
      if (result.length >= 20) break
    }

    return result
  })

  return { urls, searchUrl }
}

// ─── Скачать фото школы ───────────────────────────────────────────────────────
async function processSchool(page, school) {
  let lastError = ''

  try {
    const { urls, searchUrl } = await getImageUrls(page, school)

    if (urls.length === 0) return { saved: 0, note: 'no_urls' }

    // Разделяем orig и thumb, orig пробуем первыми
    const origUrls  = urls.filter(u => u.type === 'orig').map(u => u.url)
    const thumbUrls = urls.filter(u => u.type === 'thumb').map(u => upgradeYandexThumb(u.url))

    // Очередь: сначала orig, потом upgraded thumb
    const queue = [...origUrls, ...thumbUrls]

    let saved = 0

    for (const url of queue) {
      if (saved >= PHOTOS_PER_SCHOOL) break
      const slot = nextMissingSlot(school.slug)
      if (!slot) break

      const dest = photoPath(school.slug, slot)
      try {
        await downloadUrl(url, dest, searchUrl)
        saved++
        await sleep(300)
      } catch (e) {
        lastError = e.message
        if (existsSync(dest)) unlinkSync(dest)
      }
    }

    return { saved, note: saved === 0 ? `dl_fail:${lastError}` : 'ok' }

  } catch (e) {
    return { saved: 0, note: `error:${e.message}` }
  }
}

// ─── Main ─────────────────────────────────────────────────────────────────────
async function main() {
  const allSchools = parseSchools(SCHOOLS_TS)

  let schools = allSchools
  if (ONLY_SLUG) {
    schools = allSchools.filter(s => s.slug === ONLY_SLUG)
    if (!schools.length) { console.error(`❌ slug не найден: ${ONLY_SLUG}`); process.exit(1) }
  } else if (ONLY_MISSING) {
    schools = allSchools.filter(s => !anyPhotoExists(s.slug))
  }
  if (LIMIT < Infinity) schools = schools.slice(0, LIMIT)

  const total = schools.length
  console.log(`\n📚 Всего школ в базе: ${allSchools.length}`)
  console.log(`▶  К обработке: ${total} школ × ${PHOTOS_PER_SCHOOL} фото`)
  console.log(`🌐 Браузер: ${HEADLESS ? 'headless' : 'visible (--visible)'}`)
  console.log(`⏱  ~${Math.ceil(total * 6 / 60)} мин\n`)

  const browser = await chromium.launch({
    headless: HEADLESS,
    args: ['--no-sandbox', '--disable-blink-features=AutomationControlled'],
  })
  const context = await browser.newContext({
    userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/121.0.0.0 Safari/537.36',
    viewport: { width: 1440, height: 900 },
    locale: 'ru-RU',
    timezoneId: 'Europe/Moscow',
  })
  const page = await context.newPage()
  // Блокируем шрифты/видео для скорости (скрипты нужны для JSON)
  await page.route('**/*.{woff,woff2,ttf,mp4,webm,gif}', r => r.abort())

  const stats = { full: 0, partial: 0, skip: 0, fail: 0 }
  const pad = String(total).length

  for (let i = 0; i < schools.length; i++) {
    const school = schools[i]
    const n = `[${String(i + 1).padStart(pad)}/${total}]`

    if (ONLY_MISSING && anyPhotoExists(school.slug)) {
      console.log(`${n} ✅ уже есть  ${school.slug}`)
      stats.skip++
      continue
    }

    process.stdout.write(`${n} 🔍 ${school.name.slice(0, 44).padEnd(44)} `)

    const { saved, note } = await processSchool(page, school)

    if (saved >= PHOTOS_PER_SCHOOL) {
      process.stdout.write(`✅ ${saved} фото\n`)
      stats.full++
    } else if (saved > 0) {
      process.stdout.write(`⚠️  ${saved}/${PHOTOS_PER_SCHOOL} (${note})\n`)
      stats.partial++
    } else {
      process.stdout.write(`❌ 0 фото (${note})\n`)
      stats.fail++
    }

    progress[school.slug] = saved
    saveProgress()

    // Большая пауза каждые PAUSE_EVERY школ (кроме последней)
    const processed = i + 1 - stats.skip
    if (processed % PAUSE_EVERY === 0 && i < schools.length - 1) {
      process.stdout.write(`\n⏸  Пауза ${PAUSE_DURATION/1000}с после ${processed} школ...\n\n`)
      await sleep(PAUSE_DURATION)
    } else {
      await randomDelay()
    }
  }

  await browser.close()

  const total_saved = stats.full * PHOTOS_PER_SCHOOL + stats.partial
  console.log(`
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
📊 Итог:
   ✅  Полностью (3/3)    : ${stats.full}
   ⚠️   Частично          : ${stats.partial}
   ✅  Пропущено          : ${stats.skip}
   ❌  Не получилось      : ${stats.fail}
   📁  Файлов в /public   : ~${total_saved}
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  `)
}

main().catch(e => { console.error('\n💥 Fatal:', e); process.exit(1) })
