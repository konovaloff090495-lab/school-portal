#!/usr/bin/env node
// Разовая миграция: 542 статьи из src/data/blog.ts (TS-массив в бандле) в
// content/blog/<slug>.json + content/blog/index.json (лёгкий манифест).
//
// blog.ts не имеет импортов (чистые данные), поэтому транспилируем его через
// установленный typescript и импортируем как ESM-модуль. Порядок статей в
// манифесте сохраняется 1:1 с массивом (индекс блога рендерит первый элемент
// как hero и режет слайсы по порядку — пересортировка сломала бы вёрстку/SEO).
import ts from 'typescript'
import { readFileSync, writeFileSync, mkdirSync, rmSync, existsSync } from 'node:fs'
import { join, dirname } from 'node:path'
import { fileURLToPath, pathToFileURL } from 'node:url'

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..')
const SRC = join(ROOT, 'src/data/blog.ts')
const OUT_DIR = join(ROOT, 'content/blog')
const TMP = join(ROOT, '.blog-migrate.tmp.mjs')

// Поля манифеста — всё кроме тяжёлого HTML `content`.
const META_FIELDS = ['slug', 'title', 'excerpt', 'category', 'tags', 'author',
  'authorRole', 'publishedAt', 'readTime', 'imageAlt', 'imageUrl']

async function main() {
  const tsSource = readFileSync(SRC, 'utf8')
  const js = ts.transpileModule(tsSource, {
    compilerOptions: { module: ts.ModuleKind.ESNext, target: ts.ScriptTarget.ES2022 },
  }).outputText
  writeFileSync(TMP, js)
  let blogPosts
  try {
    ;({ blogPosts } = await import(pathToFileURL(TMP).href))
  } finally {
    rmSync(TMP, { force: true })
  }

  if (!Array.isArray(blogPosts) || blogPosts.length === 0) {
    throw new Error('blogPosts пустой или не массив — миграция прервана')
  }

  mkdirSync(OUT_DIR, { recursive: true })

  const slugs = new Set()
  const manifest = []
  for (const post of blogPosts) {
    if (!post.slug) throw new Error('статья без slug: ' + JSON.stringify(post).slice(0, 120))
    if (slugs.has(post.slug)) throw new Error('дубликат slug: ' + post.slug)
    slugs.add(post.slug)
    writeFileSync(join(OUT_DIR, `${post.slug}.json`), JSON.stringify(post, null, 2) + '\n')
    const meta = {}
    for (const f of META_FIELDS) if (post[f] !== undefined) meta[f] = post[f]
    manifest.push(meta)
  }
  writeFileSync(join(OUT_DIR, 'index.json'), JSON.stringify(manifest, null, 2) + '\n')

  // Верификация: количество файлов и побайтовая сверка content на выборке.
  let checked = 0
  for (const post of blogPosts) {
    const round = JSON.parse(readFileSync(join(OUT_DIR, `${post.slug}.json`), 'utf8'))
    if (round.content !== post.content || round.title !== post.title) {
      throw new Error('content/title не совпал после round-trip: ' + post.slug)
    }
    if (++checked >= 20) break
  }

  console.log(`OK: статей=${blogPosts.length}, файлов записано=${slugs.size}, манифест=${manifest.length}, сверено content=${checked}`)
  if (!existsSync(join(OUT_DIR, 'index.json'))) throw new Error('index.json не создан')
}

main().catch((e) => { console.error('MIGRATION FAILED:', e); process.exit(1) })
