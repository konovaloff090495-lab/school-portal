import fs from 'fs'
import { articles1to10 } from './new-articles-batch1.mjs'
import { articles11to20 } from './new-articles-batch2.mjs'
import { articles21to30 } from './new-articles-batch3.mjs'
import { articles31to40 } from './new-articles-batch4.mjs'
import { articles41to50 } from './new-articles-batch5.mjs'

const allNew = [
  ...articles1to10,
  ...articles11to20,
  ...articles21to30,
  ...articles31to40,
  ...articles41to50,
]

console.log(`Total new articles: ${allNew.length}`)

function escapeForTemplate(str) {
  return str
    .replace(/\\/g, '\\\\')
    .replace(/`/g, '\\`')
    .replace(/\$\{/g, '\\${')
}

function articleToTS(a) {
  const lines = []
  lines.push('  {')
  lines.push(`    slug: ${JSON.stringify(a.slug)},`)
  lines.push(`    title: ${JSON.stringify(a.title)},`)
  lines.push(`    excerpt: ${JSON.stringify(a.excerpt)},`)
  lines.push(`    content: \`${escapeForTemplate(a.content)}\`,`)
  lines.push(`    category: ${JSON.stringify(a.category)},`)
  lines.push(`    tags: ${JSON.stringify(a.tags)},`)
  lines.push(`    author: ${JSON.stringify(a.author)},`)
  lines.push(`    authorRole: ${JSON.stringify(a.authorRole)},`)
  lines.push(`    publishedAt: ${JSON.stringify(a.publishedAt)},`)
  lines.push(`    readTime: ${JSON.stringify(a.readTime)},`)
  lines.push(`    imageAlt: ${JSON.stringify(a.imageAlt)},`)
  if (a.imageUrl !== undefined) {
    lines.push(`    imageUrl: ${JSON.stringify(a.imageUrl)},`)
  }
  lines.push('  }')
  return lines.join('\n')
}

const blogPath = '/Users/dmitriikonovalov/claude/school-portal/src/data/blog.ts'
const original = fs.readFileSync(blogPath, 'utf8')

// Find the closing bracket before the export functions
const marker = '\n]\nexport function'
const idx = original.indexOf(marker)
if (idx === -1) {
  console.error('Could not find closing bracket marker in blog.ts')
  process.exit(1)
}

const newChunk = allNew.map(articleToTS).join(',\n') + ','
const updated = original.slice(0, idx) + ',\n' + newChunk + '\n' + original.slice(idx + 1)

fs.writeFileSync(blogPath, updated, 'utf8')
console.log('Done! blog.ts updated successfully.')
console.log(`File size: ${(fs.statSync(blogPath).size / 1024 / 1024).toFixed(2)} MB`)
