#!/usr/bin/env node
/**
 * fetch-school-photos.mjs — реальные фото школ с Яндекс Картинок.
 * Задержка 3.5 сек между запросами, иначе капча.
 *
 * Запуск:
 *   node scripts/fetch-school-photos.mjs --limit=50          # 50 школ
 *   node scripts/fetch-school-photos.mjs --region=yaroslavl  # один регион
 *   node scripts/fetch-school-photos.mjs --only-missing      # только без фото
 */

import { readFileSync, existsSync, mkdirSync, statSync, createWriteStream, unlinkSync, copyFileSync } from 'fs'
import { Readable } from 'stream'
import { pipeline } from 'stream/promises'
import path from 'path'
import { fileURLToPath } from 'url'

const __dirname  = path.dirname(fileURLToPath(import.meta.url))
const ROOT       = path.join(__dirname, '..')
const PUBLIC_DIR = path.join(ROOT, 'public', 'schools')
const SCHOOLS_TS = path.join(ROOT, 'src', 'data', 'schools.ts')

if (!existsSync(PUBLIC_DIR)) mkdirSync(PUBLIC_DIR, { recursive: true })

const UA = 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.6 Safari/605.1.15'

const args = Object.fromEntries(
  process.argv.slice(2).filter(a => a.startsWith('--'))
    .map(a => { const [k, ...v] = a.slice(2).split('='); return [k, v.join('=') || true] })
)
const LIMIT        = parseInt(args.limit ?? '0')
const ONLY_REGION  = args.region ?? null
const ONLY_MISSING = !!args['only-missing'] || true  // по умолчанию только без фото

function sleep(ms) { return new Promise(r => setTimeout(r, ms)) }

// ─── Parse schools.ts ────────────────────────────────────────────────────────
function parseSchools() {
  const src = readFileSync(SCHOOLS_TS, 'utf8')
  const schools = []
  const blocks  = src.split(/\n {2,4}\{/)
  for (const block of blocks) {
    const slug   = block.match(/\bslug:\s*'([^']+)'/)?.[1]
    const name   = block.match(/\bname:\s*'([^']+)'/)?.[1]
    const city   = block.match(/\bcity:\s*'([^']+)'/)?.[1]
    const region = block.match(/\bregion:\s*'([^']+)'/)?.[1]
    if (slug && name && city) schools.push({ slug, name, city, region })
  }
  return schools
}

// ─── Yandex Images ───────────────────────────────────────────────────────────
async function searchYandex(query) {
  const url = `https://yandex.ru/images/search?text=${encodeURIComponent(query)}&isize=medium`
  const res = await fetch(url, {
    headers: {
      'User-Agent': UA,
      'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
      'Accept-Language': 'ru-RU,ru;q=0.9,en-US;q=0.5,en;q=0.4',
      'Sec-Fetch-Dest': 'document', 'Sec-Fetch-Mode': 'navigate',
      'Sec-Fetch-Site': 'none', 'Sec-Fetch-User': '?1',
      'Upgrade-Insecure-Requests': '1',
    },
    redirect: 'follow',
    signal: AbortSignal.timeout(20_000),
  })
  return res.text()
}

function parseImageUrls(html) {
  if (/captcha|smartcaptcha|showcaptcha/i.test(html)) return { captcha: true, urls: [] }
  const decoded = html.replace(/&quot;/g, '"').replace(/&amp;/g, '&')
  const urls = []
  const seen = new Set()
  function push(u) {
    if (!u) return
    let v = u.replace(/\\\//g, '/')
    if (v.startsWith('//')) v = 'https:' + v
    if (!/^https?:/.test(v)) return
    if (seen.has(v)) return
    seen.add(v); urls.push(v)
  }
  for (const m of decoded.matchAll(/"origin"\s*:\s*\{[^}]*?"url"\s*:\s*"([^"]+)"/g)) {
    push(m[1]); if (urls.length >= 5) break
  }
  if (urls.length < 3) {
    for (const m of decoded.matchAll(/"preview"\s*:\s*\[\s*\{[^}]*?"url"\s*:\s*"([^"]+)"/g)) {
      push(m[1]); if (urls.length >= 5) break
    }
  }
  return { captcha: false, urls }
}

async function downloadImage(url, destPath) {
  const res = await fetch(url, {
    headers: { 'User-Agent': UA, 'Accept': 'image/*', 'Referer': 'https://yandex.ru/' },
    redirect: 'follow',
    signal: AbortSignal.timeout(30_000),
  })
  if (!res.ok) throw new Error(`HTTP ${res.status}`)
  const ct = (res.headers.get('content-type') || '').split(';')[0]
  if (!ct.startsWith('image/')) throw new Error(`not image: ${ct}`)
  await pipeline(Readable.fromWeb(res.body), createWriteStream(destPath))
  const size = statSync(destPath).size
  if (size < 8_000) { unlinkSync(destPath); throw new Error(`too small: ${size}B`) }
  return size
}

// ─── Main ─────────────────────────────────────────────────────────────────────
const allSchools = parseSchools()
console.log(`\n📚 Всего школ в базе: ${allSchools.length}`)

let queue = allSchools
if (ONLY_REGION) queue = queue.filter(s => s.region === ONLY_REGION)
if (ONLY_MISSING) queue = queue.filter(s => !existsSync(path.join(PUBLIC_DIR, `${s.slug}-1.jpg`)))
if (LIMIT > 0) queue = queue.slice(0, LIMIT)

console.log(`🖼  К обработке: ${queue.length} школ${ONLY_REGION ? ` (регион: ${ONLY_REGION})` : ''}${LIMIT ? ` (limit=${LIMIT})` : ''}`)
console.log(`⏱  ~${Math.ceil(queue.length * 3.5 / 60)} мин при задержке 3.5с\n`)

let ok = 0, fail = 0, captchaHit = false
const stats = { ok: 0, fail: 0 }

for (let i = 0; i < queue.length; i++) {
  if (captchaHit) { console.log('⛔ Капча — останавливаюсь'); break }

  const { slug, name, city } = queue[i]
  const n = `[${String(i + 1).padStart(String(queue.length).length)}/${queue.length}]`
  process.stdout.write(`${n} ${name.slice(0, 40).padEnd(42)} `)

  try {
    const query = `${name} ${city} здание фото`
    const html  = await searchYandex(query)
    const { captcha, urls } = parseImageUrls(html)
    if (captcha) { captchaHit = true; console.log('CAPTCHA'); stats.fail++; break }
    if (urls.length === 0) throw new Error('нет фото')

    // Скачиваем до 3 фото
    let downloaded = 0
    for (let j = 0; j < Math.min(3, urls.length); j++) {
      const dest = path.join(PUBLIC_DIR, `${slug}-${j + 1}.jpg`)
      try {
        await downloadImage(urls[j], dest)
        downloaded++
      } catch (e) {
        // если 2-е или 3-е фото не скачалось — не страшно
        if (j === 0) throw e
      }
    }

    // OG-копия = первое фото
    const dest1 = path.join(PUBLIC_DIR, `${slug}-1.jpg`)
    const destOg = path.join(PUBLIC_DIR, `${slug}.jpg`)
    if (existsSync(dest1)) copyFileSync(dest1, destOg)

    console.log(`✅ ${downloaded} фото`)
    stats.ok++
  } catch (e) {
    console.log(`✗ ${e.message?.slice(0, 60)}`)
    stats.fail++
  }

  await sleep(3500)
}

console.log(`\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`)
console.log(`✅ Скачано: ${stats.ok} школ`)
console.log(`❌ Ошибки:  ${stats.fail}`)
console.log(`\nДальше: ./deploy.sh  (нужна пересборка, чтобы фото появились в Next.js)`)
