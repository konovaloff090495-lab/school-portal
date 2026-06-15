import type { TextbookArticle } from './textbook'
import { readFileSync } from 'node:fs'
import { join } from 'node:path'

// Данные статей вынесены в textbook-articles.json и грузятся в рантайме через fs,
// чтобы webpack/Turbopack не парсил ~1.4 МБ в бандл (резко ускоряет next build).
// process.cwd() = корень проекта и при сборке, и при `next start` (PM2) на сервере.
const articles: TextbookArticle[] = JSON.parse(
  readFileSync(join(process.cwd(), 'src/data/textbook-articles.json'), 'utf8'),
) as TextbookArticle[]

export default articles

export function getArticle(
  subject: string,
  klass: number,
  topicSlug: string,
): TextbookArticle | undefined {
  return articles.find(
    a => a.subject === subject && a.klass === klass && a.topicSlug === topicSlug,
  )
}
