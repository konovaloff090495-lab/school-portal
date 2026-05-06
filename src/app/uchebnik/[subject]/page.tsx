import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import {
  textbookSubjects, getSubjectBySlug, getTopicsForSubjectAndClass,
  subjectSlugs, klassLabel,
} from '@/data/textbook'

interface Props { params: Promise<{ subject: string }> }

export function generateStaticParams() {
  return subjectSlugs.map(subject => ({ subject }))
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { subject: subjectSlug } = await params
  const subject = getSubjectBySlug(subjectSlug)
  if (!subject) return {}
  const classRange = `${Math.min(...subject.classes)}–${Math.max(...subject.classes)}`
  return {
    title: `${subject.title} ${classRange} класс — онлайн учебник | pro-schools.ru`,
    description: `${subject.description} Понятные объяснения, формулы, примеры с решением. Подготовка к ОГЭ и ЕГЭ.`,
    keywords: `${subject.title.toLowerCase()} ${classRange} класс, учебник ${subject.title.toLowerCase()}, ${subject.title.toLowerCase()} онлайн`,
    alternates: { canonical: `https://pro-schools.ru/uchebnik/${subjectSlug}/` },
  }
}

export default async function SubjectPage({ params }: Props) {
  const { subject: subjectSlug } = await params
  const subject = getSubjectBySlug(subjectSlug)
  if (!subject) notFound()

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-100">
        <div className="max-w-5xl mx-auto px-4 py-6">
          {/* Breadcrumb */}
          <nav className="flex items-center gap-2 text-sm text-gray-400 mb-4">
            <Link href="/" className="hover:text-gray-600">Главная</Link>
            <span>/</span>
            <Link href="/uchebnik/" className="hover:text-gray-600">Учебник</Link>
            <span>/</span>
            <span className="text-gray-700 font-medium">{subject.title}</span>
          </nav>

          <div className="flex items-center gap-4">
            <div className={`w-14 h-14 rounded-2xl ${subject.color} flex items-center justify-center text-3xl flex-shrink-0`}>
              {subject.icon}
            </div>
            <div>
              <h1 className="text-2xl md:text-3xl font-black text-[#0F172A]">{subject.title}</h1>
              <p className="text-gray-500 text-sm mt-1">{subject.description}</p>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-4 py-10">
        <h2 className="text-lg font-bold text-[#0F172A] mb-6">Выберите класс</h2>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {subject.classes.map(klass => {
            const topics = getTopicsForSubjectAndClass(subjectSlug, klass)
            const hasOge = topics.some(t => t.slug.includes('oge'))
            const hasEge = topics.some(t => t.slug.includes('ege'))
            return (
              <Link
                key={klass}
                href={`/uchebnik/${subjectSlug}/${klass}-klass/`}
                className="group bg-white rounded-2xl border border-gray-100 hover:border-blue-200 hover:shadow-lg shadow-sm p-5 transition-all"
              >
                <div className="flex items-center justify-between mb-3">
                  <span className="text-2xl font-black text-[#0F172A] group-hover:text-blue-600 transition-colors">
                    {klass} класс
                  </span>
                  <div className="flex gap-1">
                    {hasOge && <span className="text-xs bg-blue-100 text-blue-600 font-bold px-2 py-0.5 rounded-full">ОГЭ</span>}
                    {hasEge && <span className="text-xs bg-violet-100 text-violet-600 font-bold px-2 py-0.5 rounded-full">ЕГЭ</span>}
                  </div>
                </div>
                <p className="text-xs text-gray-400 mb-3">{topics.length} тем</p>
                <div className="space-y-1">
                  {topics.slice(0, 3).map(t => (
                    <p key={t.slug} className="text-xs text-gray-500 truncate">• {t.title}</p>
                  ))}
                  {topics.length > 3 && (
                    <p className="text-xs text-blue-400 font-medium">+ ещё {topics.length - 3} тем</p>
                  )}
                </div>
              </Link>
            )
          })}
        </div>

        {/* Все темы списком */}
        <div className="mt-12">
          <h2 className="text-lg font-bold text-[#0F172A] mb-6">Все темы по {subject.titleGen}</h2>
          {subject.classes.map(klass => {
            const topics = getTopicsForSubjectAndClass(subjectSlug, klass)
            if (!topics.length) return null
            return (
              <div key={klass} className="mb-8">
                <h3 className="text-sm font-bold text-gray-400 uppercase tracking-widest mb-3">
                  {klassLabel(klass)}
                </h3>
                <div className="bg-white rounded-xl border border-gray-100 divide-y divide-gray-50">
                  {topics.map((topic, idx) => (
                    <Link
                      key={topic.slug}
                      href={`/uchebnik/${subjectSlug}/${klass}-klass/${topic.slug}/`}
                      className="flex items-center gap-4 px-5 py-3 hover:bg-blue-50 transition-colors group"
                    >
                      <span className="text-xs text-gray-300 w-5 text-right flex-shrink-0">{idx + 1}</span>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-[#0F172A] group-hover:text-blue-600 transition-colors truncate">
                          {topic.title}
                        </p>
                        <p className="text-xs text-gray-400 truncate">{topic.excerpt}</p>
                      </div>
                      <span className="text-gray-300 group-hover:text-blue-400 transition-colors text-sm">→</span>
                    </Link>
                  ))}
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}
