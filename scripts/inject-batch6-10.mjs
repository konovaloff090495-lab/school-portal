import { readFileSync, writeFileSync } from 'fs'
import { fileURLToPath } from 'url'
import { dirname, join } from 'path'
import { batch6 } from './batch6.mjs'
import { batch7 } from './batch7.mjs'
import { batch8 } from './batch8.mjs'
import { batch9 } from './batch9.mjs'
import { batch10 } from './batch10.mjs'

const __filename = fileURLToPath(import.meta.url)
const __dir = dirname(__filename)
const BLOG_TS = join(__dir, '../src/data/blog.ts')

function escapeContent(str) {
  return str
    .replace(/\\/g, '\\\\')
    .replace(/`/g, '\\`')
    .replace(/\$\{/g, '\\${')
}

function articleToTS(a) {
  const tagsStr = a.tags.map(t => JSON.stringify(t)).join(', ')
  return [
    '  {',
    `    slug: ${JSON.stringify(a.slug)},`,
    `    title: ${JSON.stringify(a.title)},`,
    `    excerpt: ${JSON.stringify(a.excerpt)},`,
    `    content: \`${escapeContent(a.content)}\`,`,
    `    category: ${JSON.stringify(a.category)},`,
    `    tags: [${tagsStr}],`,
    `    author: ${JSON.stringify(a.author)},`,
    `    authorRole: ${JSON.stringify(a.authorRole)},`,
    `    publishedAt: ${JSON.stringify(a.publishedAt)},`,
    `    readTime: ${a.readTime},`,
    `    imageAlt: ${JSON.stringify(a.imageAlt)},`,
    '  }',
  ].join('\n')
}

const allArticles = [...batch6, ...batch7, ...batch8, ...batch9, ...batch10]
console.log(`Articles to inject: ${allArticles.length}`)

const original = readFileSync(BLOG_TS, 'utf-8')

const MARKER = '\n]\nexport function'
const idx = original.indexOf(MARKER)
if (idx === -1) throw new Error('Marker not found in blog.ts')

const beforeMarker = original.slice(0, idx)
// Skip the leading \n from MARKER, keep "]\nexport function..."
const afterMarker = original.slice(idx + 1)

// Avoid double-comma: if existing content already ends with comma, don't add another
const separator = beforeMarker.trimEnd().endsWith(',') ? '\n' : ',\n'

const newChunk = allArticles.map(articleToTS).join(',\n')
const updated = beforeMarker + separator + newChunk + '\n' + afterMarker

writeFileSync(BLOG_TS, updated, 'utf-8')
console.log(`Done. New file size: ${(updated.length / 1024 / 1024).toFixed(2)} MB`)
