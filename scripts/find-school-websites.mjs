#!/usr/bin/env node
/**
 * find-school-websites.mjs — ищет официальные сайты школ через Яндекс.
 * Адаптация iColleges/1b-find-websites.mjs для school-portal.
 * Пауза 3 сек между запросами.
 *
 * Запуск:
 *   node scripts/find-school-websites.mjs --limit=100
 *   node scripts/find-school-websites.mjs --region=yaroslavl
 */

import { readFileSync, writeFileSync } from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const __dirname  = path.dirname(fileURLToPath(import.meta.url))
const ROOT       = path.join(__dirname, '..')
const SCHOOLS_TS = path.join(ROOT, 'src', 'data', 'schools.ts')

const args = Object.fromEntries(
  process.argv.slice(2).filter(a => a.startsWith('--'))
    .map(a => { const [k, ...v] = a.slice(2).split('='); return [k, v.join('=') || true] })
)
const LIMIT       = parseInt(args.limit ?? '0')
const ONLY_REGION = args.region ?? null

const UA = 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.6 Safari/605.1.15'

function sleep(ms) { return new Promise(r => setTimeout(r, ms)) }

// ─── Домены-агрегаторы — не берём ────────────────────────────────────────────
const BLOCKED = new Set([
  'wikipedia.org', '2gis.ru', 'yandex.ru', 'maps.yandex.ru', 'google.com',
  'vk.com', 'ok.ru', 't.me', 'telegram.org', 'youtube.com', 'rutube.ru',
  'hh.ru', 'avito.ru', 'gosuslugi.ru', 'nalog.ru', 'bus.gov.ru',
  'pushkeen.ru', 'školy.ru', 'ucheba.ru', 'edu.ru', 'new.ucheba.ru',
  'školnye.ru', 'school.ru', 'prosveshenie.ru', 'pravoved.ru',
  'rosstat.gov.ru', 'egrul.nalog.ru', 'rusprofile.ru', 'list-org.com',
  'irk.ru', 'mos.ru', 'msk.ru', 'spb.ru', 'adm.spb.ru',
  'kommersant.ru', 'rg.ru', 'mk.ru', 'kp.ru', 'gazeta.ru',
])

function isBlocked(host) {
  if (!host) return true
  if (BLOCKED.has(host)) return true
  for (const b of BLOCKED) if (host.endsWith('.' + b)) return true
  // Блокируем gov.ru порталы (edu.mos.ru и т.д. — ОК, это сайты школ)
  // Но блокируем агрегаторы типа school-collect.edu.ru
  if (host.endsWith('.edu.ru') && !host.match(/^(school|sch|mou|mbou|maou)\d/)) {
    // пропускаем — могут быть легитимные сайты школ edu.ru
  }
  return false
}

// ─── Яндекс поиск ────────────────────────────────────────────────────────────
async function searchYandex(query) {
  const url = `https://yandex.ru/search/?text=${encodeURIComponent(query)}&lr=213`
  const res = await fetch(url, {
    headers: {
      'User-Agent': UA,
      'Accept': 'text/html,application/xhtml+xml,*/*;q=0.8',
      'Accept-Language': 'ru-RU,ru;q=0.9',
    },
    redirect: 'follow',
    signal: AbortSignal.timeout(15_000),
  })
  return res.text()
}

function extractFirstUrl(html, name, city) {
  if (/captcha|showcaptcha/i.test(html)) return { captcha: true, url: null }

  // Извлекаем URL из результатов поиска
  const urls = []
  for (const m of html.matchAll(/href="(https?:\/\/[^"]+)"/g)) {
    try {
      const u = new URL(m[1])
      const host = u.hostname.replace(/^www\./, '')
      if (isBlocked(host)) continue
      // Фильтр: URL должен быть коротким (главная страница, не глубокая ссылка)
      const depth = u.pathname.split('/').filter(Boolean).length
      if (depth > 2) continue
      // Убеждаемся что домен не содержит слова-агрегаторы
      if (/catalog|spravka|rating|otzyv|review|aggreg/i.test(host)) continue
      urls.push(u.origin)  // берём только домен без пути
    } catch {}
  }
  return { captcha: false, url: urls[0] ?? null }
}

// ─── Обновляем website в schools.ts ──────────────────────────────────────────
function updateWebsite(src, slug, website) {
  // Находим блок школы по slug и добавляем/заменяем website
  const slugPattern = new RegExp(`(slug: '${slug.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}',[^}]+?)(\n  \\},)`, 's')
  const websiteLine = `\n    website: '${website}',`

  return src.replace(slugPattern, (match, inner, closing) => {
    if (inner.includes('website:')) {
      // Заменяем существующий
      return inner.replace(/\n    website: '[^']*',/, websiteLine) + closing
    } else {
      // Добавляем перед первым полем после address/phone
      return inner + websiteLine + closing
    }
  })
}

// ─── Main ─────────────────────────────────────────────────────────────────────
let src = readFileSync(SCHOOLS_TS, 'utf8')

// Парсим школы
const schools = []
for (const block of src.split(/\n {2,4}\{/)) {
  const slug    = block.match(/\bslug:\s*'([^']+)'/)?.[1]
  const name    = block.match(/\bname:\s*'([^']+)'/)?.[1]
  const city    = block.match(/\bcity:\s*'([^']+)'/)?.[1]
  const region  = block.match(/\bregion:\s*'([^']+)'/)?.[1]
  const website = block.match(/\bwebsite:\s*'([^']+)'/)?.[1]
  if (slug && name && city && !website) schools.push({ slug, name, city, region })
}

let queue = schools
if (ONLY_REGION) queue = queue.filter(s => s.region === ONLY_REGION)
if (LIMIT > 0) queue = queue.slice(0, LIMIT)

console.log(`\n🔍 Поиск сайтов: ${queue.length} школ без website\n`)

let found = 0, notFound = 0, captchaHit = false

for (let i = 0; i < queue.length; i++) {
  if (captchaHit) { console.log('⛔ Капча — останавливаюсь'); break }

  const { slug, name, city } = queue[i]
  const n = `[${String(i + 1).padStart(String(queue.length).length)}/${queue.length}]`
  process.stdout.write(`${n} ${name.slice(0, 38).padEnd(40)} `)

  try {
    const query = `${name} ${city} официальный сайт школы`
    const html  = await searchYandex(query)
    const { captcha, url } = extractFirstUrl(html, name, city)

    if (captcha) { captchaHit = true; console.log('CAPTCHA'); break }
    if (!url) { console.log('✗ не найден'); notFound++; await sleep(3000); continue }

    src = updateWebsite(src, slug, url)
    writeFileSync(SCHOOLS_TS, src)
    console.log(`✅ ${url}`)
    found++
  } catch (e) {
    console.log(`✗ ${e.message?.slice(0, 50)}`)
    notFound++
  }

  await sleep(3000)
}

console.log(`\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`)
console.log(`✅ Найдено сайтов: ${found}`)
console.log(`✗  Не найдено:    ${notFound}`)
