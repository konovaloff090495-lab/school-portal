#!/usr/bin/env node
// Пересобирает манифест content/blog/index.json из файлов content/blog/<slug>.json.
// Само-синхронизация: запусти после того как добавил/изменил/удалил файлы статей —
// не нужно руками править манифест (это footgun).
//
// ПОРЯДОК сохраняется: существующие статьи остаются в прежнем порядке (индекс
// блога рендерит первый элемент как hero и режет слайсы по порядку — пересортировка
// сломала бы вёрстку/SEO). Новые файлы (которых ещё нет в манифесте) дописываются
// В КОНЕЦ, отсортированные по дате (как раньше делал автопилот — append). Файлы,
// которых больше нет на диске, выпадают из манифеста.
import { readFileSync, writeFileSync, readdirSync, existsSync } from 'node:fs'
import { join, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..')
const DIR = join(ROOT, 'content/blog')
const INDEX = join(DIR, 'index.json')

const META_FIELDS = ['slug', 'title', 'excerpt', 'category', 'tags', 'author',
  'authorRole', 'publishedAt', 'readTime', 'imageAlt', 'imageUrl']
const REQUIRED = ['slug', 'title', 'excerpt', 'content', 'category', 'author', 'publishedAt']

const files = readdirSync(DIR).filter((f) => f.endsWith('.json') && f !== 'index.json')
const bySlug = new Map()
for (const f of files) {
  const post = JSON.parse(readFileSync(join(DIR, f), 'utf8'))
  for (const r of REQUIRED) {
    if (post[r] === undefined || post[r] === '') throw new Error(`${f}: пустое обязательное поле "${r}"`)
  }
  if (`${post.slug}.json` !== f) throw new Error(`${f}: slug "${post.slug}" не совпадает с именем файла`)
  const meta = {}
  for (const k of META_FIELDS) if (post[k] !== undefined) meta[k] = post[k]
  bySlug.set(post.slug, meta)
}

// 1) существующий порядок (только для slug'ов, у которых ещё есть файл)
const prevOrder = existsSync(INDEX)
  ? JSON.parse(readFileSync(INDEX, 'utf8')).map((m) => m.slug).filter((s) => bySlug.has(s))
  : []
const seen = new Set(prevOrder)
// 2) новые slug'и — в конец, по дате (затем по slug для детерминизма)
const fresh = [...bySlug.keys()].filter((s) => !seen.has(s))
  .sort((a, b) => {
    const da = bySlug.get(a).publishedAt, db = bySlug.get(b).publishedAt
    return da < db ? -1 : da > db ? 1 : (a < b ? -1 : 1)
  })

const manifest = [...prevOrder, ...fresh].map((s) => bySlug.get(s))
writeFileSync(INDEX, JSON.stringify(manifest, null, 2) + '\n')
console.log(`манифест: всего=${manifest.length}, сохранён порядок=${prevOrder.length}, новых=${fresh.length}`)
