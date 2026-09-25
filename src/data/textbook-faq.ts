import { readFileSync } from 'node:fs'
import { join } from 'node:path'

export interface TopicFaqItem { q: string; a: string }

// Как и статьи учебника, FAQ грузится в рантайме через fs, а не через import JSON:
// файл растёт до сотен килобайт и не должен попадать в бандл. Ключ — `subject/klass/slug`.
// Источник вопросов — реальные запросы из GSC (scripts/seo/build_faq.py), а не догадки.
let faq: Record<string, TopicFaqItem[]> = {}
try {
  faq = JSON.parse(
    readFileSync(join(process.cwd(), 'src/data/textbook-faq.json'), 'utf8'),
  ) as Record<string, TopicFaqItem[]>
} catch {
  faq = {}
}

export function getTopicFaq(subject: string, klass: number, topicSlug: string): TopicFaqItem[] {
  return faq[`${subject}/${klass}/${topicSlug}`] ?? []
}

export function faqCount(): number {
  return Object.keys(faq).length
}
