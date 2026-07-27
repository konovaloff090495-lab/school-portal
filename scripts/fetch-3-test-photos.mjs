#!/usr/bin/env node
/**
 * Тестовая загрузка ПЕРВОГО релевантного фото для 3 школ через Яндекс.Картинки.
 * Запрос строится как «<Название> <город>, <адрес>» (подход 1: поиск + первая картинка).
 * Сохраняет только slug-1.jpg. Одноразовый тест перед масштабированием.
 *
 *   node scripts/fetch-3-test-photos.mjs
 */
import { chromium } from 'playwright'
import { existsSync, mkdirSync, createWriteStream, statSync, unlinkSync } from 'fs'
import { pipeline } from 'stream/promises'
import path from 'path'
import { fileURLToPath } from 'url'

const __dirname  = path.dirname(fileURLToPath(import.meta.url))
const ROOT       = path.join(__dirname, '..')
const PUBLIC_DIR = path.join(ROOT, 'public', 'schools')
const MIN_FILE_SIZE = 3000

// Тестовые школы: name/city/address взяты из src/data/schools.ts
const TARGETS = [
  { slug: 'shkola-9-volgograd', name: 'Школа №9', city: 'Волгоград', address: 'улица Арсеньева, 32' },
  { slug: 'litsey-21-ufa',      name: 'Лицей №21', city: 'Уфа',       address: 'г. Уфа' },
  { slug: 'shkola-23-orsk',     name: 'Школа №23', city: 'Орск',      address: 'г. Орск' },
]

if (!existsSync(PUBLIC_DIR)) mkdirSync(PUBLIC_DIR, { recursive: true })
const sleep = ms => new Promise(r => setTimeout(r, ms))

function buildQuery(s) {
  // «<Название> <город>, <адрес>» — но не дублируем город, если адрес это лишь «г. Город»
  const addr = s.address && !/^г\.\s*/i.test(s.address.trim()) ? `, ${s.address}` : ''
  return `${s.name} ${s.city}${addr}`
}

async function downloadUrl(url, destPath, referer) {
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
  return size
}

async function getImageUrls(page, query) {
  const searchUrl = `https://yandex.ru/images/search?text=${encodeURIComponent(query)}&itype=jpg`
  try { await page.goto(searchUrl, { waitUntil: 'networkidle', timeout: 25000 }) } catch { await sleep(2000) }

  const blocked = await page.evaluate(() => {
    const hasCaptcha = !!document.querySelector('.CheckboxCaptcha, .AdvancedCaptcha, #captcha')
    const imgCount   = document.querySelectorAll('img.ImagesContentImage-Image').length
    return { isBlocked: hasCaptcha || document.title.includes('captcha') || document.title.includes('Ошибка'), imgCount }
  })
  if (blocked.isBlocked || blocked.imgCount === 0) {
    process.stdout.write('⏸ блок, пауза 45с... ')
    await sleep(45000)
    try { await page.goto(searchUrl, { waitUntil: 'networkidle', timeout: 25000 }) } catch { await sleep(3000) }
  }

  await page.waitForFunction(
    () => document.querySelectorAll('img.ImagesContentImage-Image[src]').length >= 3,
    { timeout: 8000 }
  ).catch(() => {})
  await sleep(300)

  return page.evaluate(() => {
    const result = []; const seen = new Set()
    const imgEls = [
      ...document.querySelectorAll('.ImagesContentImage-Image'),
      ...document.querySelectorAll('img[class*="ImagesContent"]'),
      ...document.querySelectorAll('.serp-item img'),
    ]
    for (const img of imgEls) {
      let src = img.getAttribute('src') || img.getAttribute('data-src') || ''
      if (src.startsWith('//')) src = 'https:' + src
      if (src.startsWith('https') && !seen.has(src)) { seen.add(src); result.push({ url: src, type: 'thumb' }) }
      if (result.length >= 12) break
    }
    for (const s of [...document.querySelectorAll('script:not([src])')].map(s => s.textContent ?? '')) {
      if (!s.includes('"origUrl"')) continue
      for (const m of s.matchAll(/"origUrl"\s*:\s*"([^"\\]+(?:\\.[^"\\]*)*)"/g)) {
        const url = m[1].replace(/\\u002F/g, '/').replace(/\\\//g, '/').replace(/\\"/g, '"')
        if (url.startsWith('http') && !seen.has(url)) { seen.add(url); result.push({ url, type: 'orig' }) }
        if (result.length >= 20) break
      }
      if (result.length >= 20) break
    }
    return { result, searchUrl: location.href }
  }).then(r => ({ urls: r.result, searchUrl }))
}

const browser = await chromium.launch({ headless: true })
const ctx = await browser.newContext({
  userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/121.0.0.0 Safari/537.36',
  locale: 'ru-RU',
  viewport: { width: 1366, height: 900 },
})
const page = await ctx.newPage()

for (const s of TARGETS) {
  const query = buildQuery(s)
  console.log(`\n=== ${s.slug} ===\nЗапрос: "${query}"`)
  try {
    const { urls, searchUrl } = await getImageUrls(page, query)
    const origUrls  = urls.filter(u => u.type === 'orig').map(u => u.url)
    const thumbUrls = urls.filter(u => u.type === 'thumb').map(u => u.url)
    const queue = [...origUrls, ...thumbUrls]
    console.log(`Кандидатов: ${queue.length} (orig=${origUrls.length}, thumb=${thumbUrls.length})`)
    let done = false
    for (const url of queue) {
      const dest = path.join(PUBLIC_DIR, `${s.slug}-1.jpg`)
      try {
        const size = await downloadUrl(url, dest, searchUrl)
        console.log(`✅ СОХРАНЕНО ${s.slug}-1.jpg  ${size}b`)
        console.log(`   источник: ${url.slice(0, 120)}`)
        done = true; break
      } catch (e) { /* пробуем следующий */ }
    }
    if (!done) console.log(`❌ не удалось скачать ни одного кандидата`)
  } catch (e) {
    console.log(`❌ ошибка: ${e.message}`)
  }
  await sleep(3000 + Math.random() * 2000)
}

await browser.close()
