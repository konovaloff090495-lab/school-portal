import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import {
  getSubjectBySlug, getTopicsForSubjectAndClass,
  textbookSubjects, klassLabel, klassLabelIn,
} from '@/data/textbook'
import YandexRTBBanner from '@/components/YandexRTBBanner'

interface Props { params: Promise<{ subject: string; klass: string }> }

export function generateStaticParams() {
  return textbookSubjects.flatMap(s =>
    s.classes.map(klass => ({ subject: s.slug, klass: `${klass}-klass` }))
  )
}

function parseKlass(str: string): number | null {
  const m = str.match(/^(\d+)-klass$/)
  return m ? Number(m[1]) : null
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { subject: subjectSlug, klass: klassStr } = await params
  const klass = parseKlass(klassStr)
  const subject = getSubjectBySlug(subjectSlug)
  if (!subject || !klass) return {}
  const topics = getTopicsForSubjectAndClass(subjectSlug, klass)
  return {
    title: `${subject.title} ${klass} класс — учебник онлайн | pro-schools.ru`,
    description: `${subject.title} в ${klassLabelIn(klass)}: ${topics.length} тем с объяснениями и примерами. ${topics.slice(0, 3).map(t => t.title).join(', ')} и другие.`,
    keywords: `${subject.title.toLowerCase()} ${klass} класс, учебник ${klass} класс, ${subject.title.toLowerCase()} ${klass} класс онлайн`,
    alternates: { canonical: `https://pro-schools.ru/uchebnik/${subjectSlug}/${klassStr}/` },
  }
}

export default async function KlassPage({ params }: Props) {
  const { subject: subjectSlug, klass: klassStr } = await params
  const klass = parseKlass(klassStr)
  const subject = getSubjectBySlug(subjectSlug)
  if (!subject || !klass || !subject.classes.includes(klass)) notFound()

  const topics = getTopicsForSubjectAndClass(subjectSlug, klass)
  if (!topics.length) notFound()

  // Определяем ОГЭ/ЕГЭ темы
  const examTopics = topics.filter(t => t.slug.includes('oge') || t.slug.includes('ege'))
  const mainTopics = topics.filter(t => !t.slug.includes('oge') && !t.slug.includes('ege'))

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-white border-b border-gray-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <nav className="flex items-center gap-2 text-sm text-gray-400 mb-4">
            <Link href="/" className="hover:text-gray-600">Главная</Link>
            <span>/</span>
            <Link href="/uchebnik/" className="hover:text-gray-600">Учебник</Link>
            <span>/</span>
            <Link href={`/uchebnik/${subjectSlug}/`} className="hover:text-gray-600">{subject.title}</Link>
            <span>/</span>
            <span className="text-gray-700 font-medium">{klassLabel(klass)}</span>
          </nav>

          <div className="flex items-center gap-3">
            <div className={`w-10 h-10 rounded-xl ${subject.color} flex items-center justify-center text-xl flex-shrink-0`}>
              {subject.icon}
            </div>
            <div>
              <h1 className="text-xl md:text-2xl font-black text-[#0F172A]">
                {subject.title} · {klassLabel(klass)}
              </h1>
              <p className="text-gray-400 text-sm">{topics.length} тем</p>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 flex gap-8">
        <div className="flex-1 min-w-0">

        {/* Основные темы */}
        <h2 className="text-base font-bold text-gray-700 mb-4">Темы программы</h2>
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm mb-8 overflow-hidden">
          {mainTopics.map((topic, idx) => (
            <Link
              key={topic.slug}
              href={`/uchebnik/${subjectSlug}/${klassStr}/${topic.slug}/`}
              className="flex items-start gap-4 px-5 py-4 hover:bg-blue-50 transition-colors group border-b border-gray-50 last:border-0"
            >
              <span className="text-sm font-bold text-gray-300 w-6 text-right flex-shrink-0 mt-0.5">{idx + 1}</span>
              <div className="flex-1">
                <p className="text-sm font-semibold text-[#0F172A] group-hover:text-blue-600 transition-colors mb-0.5">
                  {topic.title}
                </p>
                <p className="text-xs text-gray-400 leading-relaxed">{topic.excerpt}</p>
              </div>
              <span className="text-gray-300 group-hover:text-blue-400 flex-shrink-0 self-center">→</span>
            </Link>
          ))}
        </div>

        {/* Экзаменационные темы */}
        {examTopics.length > 0 && (
          <>
            <h2 className="text-base font-bold text-gray-700 mb-4">🎯 Подготовка к экзаменам</h2>
            <div className="bg-gradient-to-br from-violet-50 to-blue-50 rounded-xl border border-violet-100 overflow-hidden mb-8">
              {examTopics.map(topic => (
                <Link
                  key={topic.slug}
                  href={`/uchebnik/${subjectSlug}/${klassStr}/${topic.slug}/`}
                  className="flex items-start gap-4 px-5 py-4 hover:bg-white/50 transition-colors group border-b border-white/50 last:border-0"
                >
                  <div className="flex-1">
                    <p className="text-sm font-semibold text-[#0F172A] group-hover:text-blue-600 transition-colors mb-0.5">
                      {topic.title}
                    </p>
                    <p className="text-xs text-gray-500 leading-relaxed">{topic.excerpt}</p>
                  </div>
                  <span className="text-violet-400 group-hover:text-blue-500 flex-shrink-0 self-center">→</span>
                </Link>
              ))}
            </div>
          </>
        )}

        {/* Навигация по классам */}
        <h2 className="text-base font-bold text-gray-700 mb-4">Другие классы</h2>
        <div className="flex flex-wrap gap-2">
          {subject.classes.map(k => (
            <Link
              key={k}
              href={`/uchebnik/${subjectSlug}/${k}-klass/`}
              className={`px-4 py-2 rounded-xl text-sm font-semibold transition-all ${
                k === klass
                  ? 'bg-blue-600 text-white'
                  : 'bg-white border border-gray-200 text-gray-600 hover:border-blue-300 hover:text-blue-600'
              }`}
            >
              {k} класс
            </Link>
          ))}
        </div>
        </div>

        {/* Рекламный сайдбар */}
        <aside className="w-72 flex-shrink-0 hidden lg:block">
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-3 sticky top-4">
            <div className="flex items-center justify-between mb-2 px-1">
              <span className="text-[10px] font-bold text-gray-300 uppercase tracking-widest">Реклама</span>
              <span className="text-[10px] text-gray-300">16+</span>
            </div>
            <YandexRTBBanner blockId="R-A-19425636-1" suffix="uchebnik-klass" />
          </div>
        </aside>
      </div>
    </div>
  )
}
