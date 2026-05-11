import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { sanitizeHtml } from '@/lib/sanitize'
import {
  getSubjectBySlug, getTopicBySlug, getTopicsForSubjectAndClass,
  textbookSubjects, klassLabel, klassLabelIn,
} from '@/data/textbook'
import { getArticle } from '@/data/textbook-articles'

interface Props { params: Promise<{ subject: string; klass: string; topic: string }> }

import { textbookTopics } from '@/data/textbook'

export function generateStaticParams() {
  return textbookTopics.map(t => ({
    subject: t.subject,
    klass: `${t.klass}-klass`,
    topic: t.slug,
  }))
}

function parseKlass(str: string): number | null {
  const m = str.match(/^(\d+)-klass$/)
  return m ? Number(m[1]) : null
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { subject: subjectSlug, klass: klassStr, topic: topicSlug } = await params
  const klass = parseKlass(klassStr)
  const subject = getSubjectBySlug(subjectSlug)
  const topic = klass ? getTopicBySlug(subjectSlug, klass, topicSlug) : undefined
  if (!subject || !topic || !klass) return {}
  return {
    title: `${topic.title} — ${subject.title} ${klass} класс | pro-schools.ru`,
    description: `${topic.excerpt} Понятное объяснение с примерами для ${klassLabelIn(klass)}.`,
    keywords: `${topic.title.toLowerCase()}, ${subject.title.toLowerCase()} ${klass} класс, ${topic.title.toLowerCase()} объяснение`,
    alternates: { canonical: `https://pro-schools.ru/uchebnik/${subjectSlug}/${klassStr}/${topicSlug}/` },
  }
}

// Плейсхолдер-контент для тем без статьи
function PlaceholderContent({ title, excerpt, subject, klass }: { title: string; excerpt: string; subject: string; klass: number }) {
  return (
    <div className="textbook-content">
      <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 mb-6 not-prose">
        <p className="text-sm text-amber-700 font-medium">✏️ Статья готовится</p>
        <p className="text-xs text-amber-600 mt-1">Полное объяснение этой темы скоро появится. Пока доступно краткое описание.</p>
      </div>
      <h2>О чём эта тема</h2>
      <p>{excerpt}</p>
      <h2>Что нужно знать</h2>
      <p>Тема <strong>{title}</strong> изучается в {klassLabelIn(klass)} в курсе {subject}.</p>
      <p>Для полного понимания темы рекомендуем:</p>
      <ul>
        <li>Внимательно читать объяснение учителя на уроке</li>
        <li>Решать задачи из учебника</li>
        <li>Смотреть видеоуроки по теме</li>
      </ul>
    </div>
  )
}

export default async function TopicPage({ params }: Props) {
  const { subject: subjectSlug, klass: klassStr, topic: topicSlug } = await params
  const klass = parseKlass(klassStr)
  const subject = getSubjectBySlug(subjectSlug)
  const topic = klass ? getTopicBySlug(subjectSlug, klass, topicSlug) : undefined

  if (!subject || !topic || !klass) notFound()

  const article = getArticle(subjectSlug, klass, topicSlug)
  const allTopics = getTopicsForSubjectAndClass(subjectSlug, klass)
  const currentIdx = allTopics.findIndex(t => t.slug === topicSlug)
  const prevTopic = currentIdx > 0 ? allTopics[currentIdx - 1] : null
  const nextTopic = currentIdx < allTopics.length - 1 ? allTopics[currentIdx + 1] : null

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-100">
        <div className="max-w-4xl mx-auto px-4 py-5">
          <nav className="flex items-center gap-2 text-xs text-gray-400 flex-wrap mb-3">
            <Link href="/" className="hover:text-gray-600">Главная</Link>
            <span>/</span>
            <Link href="/uchebnik/" className="hover:text-gray-600">Учебник</Link>
            <span>/</span>
            <Link href={`/uchebnik/${subjectSlug}/`} className="hover:text-gray-600">{subject.title}</Link>
            <span>/</span>
            <Link href={`/uchebnik/${subjectSlug}/${klassStr}/`} className="hover:text-gray-600">{klassLabel(klass)}</Link>
            <span>/</span>
            <span className="text-gray-700">{topic.title}</span>
          </nav>
          <h1 className="text-xl md:text-2xl font-black text-[#0F172A]">{topic.title}</h1>
          <p className="text-gray-500 text-sm mt-1">
            {subject.icon} {subject.title} · {klassLabel(klass)}
          </p>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 py-8 flex gap-8">
        {/* Основной контент */}
        <div className="flex-1 min-w-0">
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 md:p-8 mb-6">
            {article?.content ? (
              <div
                className="textbook-content"
                dangerouslySetInnerHTML={{ __html: sanitizeHtml(article.content) }}
              />
            ) : (
              <PlaceholderContent
                title={topic.title}
                excerpt={topic.excerpt}
                subject={subject.title}
                klass={klass}
              />
            )}
          </div>

          {/* Навигация prev/next */}
          <div className="flex gap-3">
            {prevTopic && (
              <Link
                href={`/uchebnik/${subjectSlug}/${klassStr}/${prevTopic.slug}/`}
                className="flex-1 bg-white border border-gray-200 hover:border-blue-300 rounded-xl p-4 group transition-all"
              >
                <p className="text-xs text-gray-400 mb-1">← Предыдущая тема</p>
                <p className="text-sm font-semibold text-gray-700 group-hover:text-blue-600 transition-colors line-clamp-1">
                  {prevTopic.title}
                </p>
              </Link>
            )}
            {nextTopic && (
              <Link
                href={`/uchebnik/${subjectSlug}/${klassStr}/${nextTopic.slug}/`}
                className="flex-1 bg-white border border-gray-200 hover:border-blue-300 rounded-xl p-4 group transition-all text-right"
              >
                <p className="text-xs text-gray-400 mb-1">Следующая тема →</p>
                <p className="text-sm font-semibold text-gray-700 group-hover:text-blue-600 transition-colors line-clamp-1">
                  {nextTopic.title}
                </p>
              </Link>
            )}
          </div>
        </div>

        {/* Сайдбар — список тем */}
        <aside className="w-64 flex-shrink-0 hidden lg:block">
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 sticky top-4">
            <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-3">
              {subject.title} · {klassLabel(klass)}
            </p>
            <div className="space-y-0.5 max-h-[70vh] overflow-y-auto">
              {allTopics.map((t, idx) => (
                <Link
                  key={t.slug}
                  href={`/uchebnik/${subjectSlug}/${klassStr}/${t.slug}/`}
                  className={`flex items-center gap-2 px-2 py-1.5 rounded-lg text-xs transition-colors ${
                    t.slug === topicSlug
                      ? 'bg-blue-600 text-white font-semibold'
                      : 'text-gray-600 hover:bg-gray-100'
                  }`}
                >
                  <span className="opacity-50 w-4 text-right flex-shrink-0">{idx + 1}</span>
                  <span className="truncate">{t.title}</span>
                </Link>
              ))}
            </div>
          </div>
        </aside>
      </div>
    </div>
  )
}
