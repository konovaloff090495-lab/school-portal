#!/usr/bin/env node
/**
 * Генерирует превью-картинки для статей блога через OpenAI Images API
 *
 * Использование:
 *   node scripts/generate-blog-images.mjs              # все статьи без imageUrl
 *   node scripts/generate-blog-images.mjs --slug=xxx   # конкретная статья
 *   node scripts/generate-blog-images.mjs --limit=3    # не более N картинок
 *
 * Переменные окружения:
 *   OPENAI_API_KEY=sk-...  (обязательно)
 */

import { readFileSync, writeFileSync, mkdirSync, existsSync, createWriteStream } from 'fs'
import { createRequire } from 'module'
import https from 'https'
import http from 'http'
import path from 'path'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const ROOT      = path.join(__dirname, '..')
const BLOG_TS   = path.join(ROOT, 'src', 'data', 'blog.ts')
const IMG_DIR   = path.join(ROOT, 'public', 'blog', 'images')

// ─── CLI аргументы ──────────────────────────────────────────────────────────
const args = Object.fromEntries(
  process.argv.slice(2)
    .filter(a => a.startsWith('--'))
    .map(a => {
      const [k, ...v] = a.slice(2).split('=')
      return [k, v.join('=') || true]
    })
)
const TARGET_SLUG   = args.slug
const LIMIT         = parseInt(args.limit ?? '99')
const CUSTOM_PROMPT = args.prompt ?? null  // кастомный промпт для конкретной картинки

// ─── OpenAI ─────────────────────────────────────────────────────────────────
const OPENAI_KEY = process.env.OPENAI_API_KEY
if (!OPENAI_KEY) {
  console.error('❌ Нужен OPENAI_API_KEY в переменных окружения')
  process.exit(1)
}

// Простой fetch-обёртка для OpenAI API (без SDK чтобы не добавлять зависимость)
async function openaiGenerateImage(prompt) {
  const body = JSON.stringify({
    model: 'dall-e-3',
    prompt,
    n: 1,
    size: '1792x1024',
    quality: 'standard',
    response_format: 'url',
  })

  return new Promise((resolve, reject) => {
    const req = https.request({
      hostname: 'api.openai.com',
      path: '/v1/images/generations',
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${OPENAI_KEY}`,
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(body),
      },
    }, (res) => {
      let data = ''
      res.on('data', chunk => data += chunk)
      res.on('end', () => {
        try {
          const json = JSON.parse(data)
          if (json.error) return reject(new Error(json.error.message))
          resolve(json.data[0].url)
        } catch (e) {
          reject(e)
        }
      })
    })
    req.on('error', reject)
    req.write(body)
    req.end()
  })
}

// ─── Скачать картинку по URL ─────────────────────────────────────────────────
function downloadImage(url, destPath) {
  return new Promise((resolve, reject) => {
    const proto = url.startsWith('https') ? https : http
    proto.get(url, (res) => {
      if (res.statusCode === 301 || res.statusCode === 302) {
        return downloadImage(res.headers.location, destPath).then(resolve).catch(reject)
      }
      if (res.statusCode !== 200) {
        return reject(new Error(`HTTP ${res.statusCode} при скачивании картинки`))
      }
      const file = createWriteStream(destPath)
      res.pipe(file)
      file.on('finish', () => file.close(resolve))
      file.on('error', reject)
    }).on('error', reject)
  })
}

// ─── Прочитать статьи из blog.ts ────────────────────────────────────────────
function getBlogPosts() {
  const content = readFileSync(BLOG_TS, 'utf-8')
  const posts = []
  // Парсим slug, title, excerpt, imageUrl из каждой записи
  const slugs    = [...content.matchAll(/slug:\s*'([^']+)'/g)].map(m => m[1])
  const titles   = [...content.matchAll(/title:\s*'([^']+)'/g)].map(m => m[1])
  const excerpts = [...content.matchAll(/excerpt:\s*'([^']+)'/g)].map(m => m[1])
  const imageUrls = [...content.matchAll(/imageUrl:\s*'([^']+)'/g)].map(m => m[1])

  // Сопоставляем — imageUrl может отсутствовать
  for (let i = 0; i < slugs.length; i++) {
    // Проверяем есть ли imageUrl именно у этого slug (ищем в блоке записи)
    const slugIdx = content.indexOf(`slug: '${slugs[i]}'`)
    // Следующий slug идёт после этого
    const nextSlugMatch = content.indexOf(`slug: '`, slugIdx + 1)
    const block = nextSlugMatch === -1
      ? content.slice(slugIdx)
      : content.slice(slugIdx, nextSlugMatch)

    const hasImage = /imageUrl:\s*'[^']+'/.test(block)

    posts.push({
      slug: slugs[i],
      title: titles[i] ?? '',
      excerpt: excerpts[i] ?? '',
      hasImage,
    })
  }
  return posts
}

// ─── Вставить imageUrl в blog.ts ────────────────────────────────────────────
function insertImageUrl(slug, imageUrl) {
  let content = readFileSync(BLOG_TS, 'utf-8')

  // Если уже есть — заменяем
  if (content.includes(`slug: '${slug}'`)) {
    // Найдём блок этой записи и либо обновим imageUrl либо вставим после imageAlt
    const slugIdx = content.indexOf(`slug: '${slug}'`)
    const nextSlugMatch = content.indexOf(`slug: '`, slugIdx + 1)
    const blockEnd = nextSlugMatch === -1 ? content.length : nextSlugMatch

    let block = content.slice(slugIdx, blockEnd)

    if (/imageUrl:\s*'[^']+'/.test(block)) {
      // Обновляем существующий
      block = block.replace(/imageUrl:\s*'[^']+'/, `imageUrl: '${imageUrl}'`)
    } else {
      // Вставляем после imageAlt
      block = block.replace(
        /(imageAlt:\s*'[^']+',)/,
        `$1\n    imageUrl: '${imageUrl}',`
      )
    }

    content = content.slice(0, slugIdx) + block + content.slice(blockEnd)
    writeFileSync(BLOG_TS, content)
  }
}

// ─── Построить промпт для DALL-E ─────────────────────────────────────────────
function buildPrompt(title, excerpt) {
  // Убираем SEO-шум, оставляем суть
  const cleanTitle = title.replace(/\|.*$/, '').replace(/pro-schools\.ru/gi, '').trim()
  const cleanExcerpt = excerpt.slice(0, 200)

  return `Create a professional, warm editorial illustration for a Russian educational blog article.

Article title: "${cleanTitle}"
Article summary: "${cleanExcerpt}"

Style requirements:
- Bright, optimistic, editorial illustration style
- Warm color palette (oranges, yellows, soft blues, warm whites)
- Focus on children, students, school environment, learning, education
- NO text, NO letters, NO words in the image
- Clean, modern, suitable for a school discovery portal
- Horizontal composition (16:9)
- High quality, photorealistic or flat illustration style

The image should evoke the feeling of a good school environment, caring parents, happy students, or the specific topic of the article.`
}

// ─── Главная логика ──────────────────────────────────────────────────────────
async function main() {
  mkdirSync(IMG_DIR, { recursive: true })

  const posts = getBlogPosts()

  let targets
  if (TARGET_SLUG) {
    targets = posts.filter(p => p.slug === TARGET_SLUG)
    if (!targets.length) {
      console.error(`❌ Статья с slug '${TARGET_SLUG}' не найдена`)
      process.exit(1)
    }
  } else {
    targets = posts.filter(p => !p.hasImage).slice(0, LIMIT)
  }

  if (!targets.length) {
    console.log('✅ Все статьи уже имеют картинки')
    return
  }

  console.log(`\n🖼  Генерация ${targets.length} картинок для блога\n`)

  let generated = 0
  let errors = 0

  for (const post of targets) {
    const imgPath = path.join(IMG_DIR, `${post.slug}.jpg`)
    const imgUrl  = `/blog/images/${post.slug}.jpg`

    // Если файл уже есть и нет кастомного промпта — только обновляем blog.ts
    if (existsSync(imgPath) && !CUSTOM_PROMPT) {
      insertImageUrl(post.slug, imgUrl)
      console.log(`  ⚡ ${post.slug} — файл уже есть, обновили blog.ts`)
      generated++
      continue
    }

    const label = post.title.slice(0, 50).padEnd(50)
    process.stdout.write(`  🎨 ${label} `)

    try {
      const prompt = CUSTOM_PROMPT ?? buildPrompt(post.title, post.excerpt)
      const openaiUrl = await openaiGenerateImage(prompt)
      await downloadImage(openaiUrl, imgPath)
      insertImageUrl(post.slug, imgUrl)
      console.log(`✅`)
      generated++
    } catch (err) {
      console.log(`❌ ${err.message}`)
      errors++
    }

    // Пауза между запросами чтобы не словить rate limit
    if (targets.indexOf(post) < targets.length - 1) {
      await new Promise(r => setTimeout(r, 1500))
    }
  }

  console.log(`\n✅ Сгенерировано: ${generated} | Ошибок: ${errors}\n`)
}

main().catch(err => {
  console.error('❌ Критическая ошибка:', err.message)
  process.exit(1)
})
