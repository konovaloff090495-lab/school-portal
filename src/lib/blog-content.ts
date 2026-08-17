import { cache } from 'react'
import { readFileSync, existsSync } from 'node:fs'
import { join } from 'node:path'

// Источник правды блога — файлы content/blog/, читаемые в рантайме через fs
// (как textbook-articles.ts / gdz.ts). Это отвязывает контент от бандла: новая
// статья публикуется без полного next build — см. content/blog + /api/revalidate.
// process.cwd() = корень проекта и при сборке, и при `next start` (PM2) на VPS.
// content/ доезжает на VPS через git pull (rsync возит только .next и public).

export interface BlogPost {
  slug: string
  title: string
  excerpt: string
  content: string // HTML
  category: string
  tags: string[]
  author: string
  authorRole: string
  publishedAt: string // ISO date
  readTime: number // minutes
  imageAlt: string
  imageUrl?: string // /blog/images/{slug}.jpg
}

// Метаданные без тяжёлого HTML — для индекса, sitemap, «Читайте также», сайдбара.
export type BlogPostMeta = Omit<BlogPost, 'content'>

const BLOG_DIR = join(process.cwd(), 'content/blog')

/**
 * Дата публикации, никогда не из будущего (og:published_time, datePublished,
 * видимая подпись). Часть статей датирована наперёд — обрезаем на выдаче.
 */
export function safePublishedAt(post: { publishedAt: string }): string {
  const today = new Date().toISOString().slice(0, 10)
  return post.publishedAt > today ? today : post.publishedAt
}

/**
 * Манифест всех статей в ПОРЯДКЕ файла (не пересортировывать — индекс блога
 * рендерит первый элемент как hero и режет слайсы по порядку). Читается внутри
 * функции (не в module-scope), обёрнут в React.cache для дедупликации в пределах
 * одного рендера; между рендерами ISR-кэш роутов сам решает, когда перечитать.
 *
 * Guard: пустой/отсутствующий манифест — это НЕ валидное состояние (скорее всего
 * сборка идёт из дерева без git pull content/). Кидаем ошибку, чтобы такой билд
 * упал, а не выкатил пустой блог поверх рабочего.
 */
export const getAllPostsMeta = cache((): BlogPostMeta[] => {
  const file = join(BLOG_DIR, 'index.json')
  if (!existsSync(file)) {
    throw new Error(`[blog-content] манифест не найден: ${file} — блог не собран из content/blog`)
  }
  const manifest = JSON.parse(readFileSync(file, 'utf8')) as BlogPostMeta[]
  if (!Array.isArray(manifest) || manifest.length === 0) {
    throw new Error('[blog-content] манифест content/blog/index.json пуст')
  }
  return manifest
})

export function getAllPostSlugs(): string[] {
  return getAllPostsMeta().map((p) => p.slug)
}

/** Полная статья с HTML — читает один файл content/blog/<slug>.json. O(1). */
export const getPostBySlug = cache((slug: string): BlogPost | undefined => {
  // Защита от path traversal: slug только из безопасных символов.
  if (!/^[a-z0-9-]+$/i.test(slug)) return undefined
  const file = join(BLOG_DIR, `${slug}.json`)
  if (!existsSync(file)) return undefined
  return JSON.parse(readFileSync(file, 'utf8')) as BlogPost
})
