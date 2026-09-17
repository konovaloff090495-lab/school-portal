import { gdzBooks, loadGdzBook, hasGdzSolution, gdzNumToSlug, type GdzBookMeta } from '@/data/gdz'

// Sitemap номеров ГДЗ: книги нарезаются на чанки по ≤ CHUNK_MAX решённых
// номеров (лимит одного sitemap — 50 000 URL). Нарезка детерминирована
// порядком index.json, поэтому /sitemap-gdz/{n} стабилен между запросами.
const BASE_URL = 'https://pro-schools.ru'
const CHUNK_MAX = 40000
const D_GDZ = '2026-09-17'

export function gdzSitemapChunks(): GdzBookMeta[][] {
  const chunks: GdzBookMeta[][] = []
  let cur: GdzBookMeta[] = []
  let size = 0
  for (const b of gdzBooks) {
    if (b.solvedCount === 0) continue
    if (size + b.solvedCount > CHUNK_MAX && cur.length) {
      chunks.push(cur); cur = []; size = 0
    }
    cur.push(b); size += b.solvedCount
  }
  if (cur.length) chunks.push(cur)
  return chunks
}

function esc(s: string) {
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
}

export function gdzSitemapIndexXml(): string {
  const n = gdzSitemapChunks().length
  const items = Array.from({ length: n }, (_, i) =>
    `<sitemap><loc>${BASE_URL}/sitemap-gdz/${i + 1}/</loc><lastmod>${D_GDZ}</lastmod></sitemap>`).join('')
  return `<?xml version="1.0" encoding="UTF-8"?><sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">${items}</sitemapindex>`
}

export function gdzSitemapChunkXml(n: number): string | null {
  const chunks = gdzSitemapChunks()
  const chunk = chunks[n - 1]
  if (!chunk) return null
  const urls: string[] = []
  for (const meta of chunk) {
    const book = loadGdzBook(meta)
    const base = `${BASE_URL}/gdz/${meta.klass}-klass/${meta.subjectSlug}/${meta.slug}`
    for (const ch of book.chapters) {
      for (const p of ch.problems) {
        if (!hasGdzSolution(p)) continue
        const slug = gdzNumToSlug(p.number)
        // eslint-disable-next-line no-control-regex
        if (/[^\x20-\x7E]/.test(slug)) continue
        urls.push(`<url><loc>${esc(`${base}/nomer-${slug}/`)}</loc><lastmod>${D_GDZ}</lastmod><changefreq>monthly</changefreq><priority>0.7</priority></url>`)
      }
    }
  }
  return `<?xml version="1.0" encoding="UTF-8"?><urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">${urls.join('')}</urlset>`
}
