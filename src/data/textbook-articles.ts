import type { TextbookArticle } from './textbook'

const articles: TextbookArticle[] = [
  // Статьи генерируются автоматически скриптом scripts/generate-textbook.mjs
  // Запустить: node scripts/generate-textbook.mjs --subject=matematika --klass=5
]

export default articles

export function getArticle(subject: string, klass: number, topicSlug: string): TextbookArticle | undefined {
  return articles.find(a => a.subject === subject && a.klass === klass && a.topicSlug === topicSlug)
}
