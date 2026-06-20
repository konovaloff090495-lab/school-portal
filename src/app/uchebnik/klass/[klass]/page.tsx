import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import {
  textbookSubjects, getTopicsForSubjectAndClass, klassLabel, klassLabelIn,
} from '@/data/textbook'

interface Props { params: Promise<{ klass: string }> }

function parseKlass(str: string): number | null {
  const m = str.match(/^(\d+)-klass$/)
  if (!m) return null
  const n = Number(m[1])
  return n >= 1 && n <= 11 ? n : null
}

export function generateStaticParams() {
  return Array.from({ length: 11 }, (_, i) => ({ klass: `${i + 1}-klass` }))
}

// Предметы, у которых есть темы в этом классе
function subjectsForClass(klass: number) {
  return textbookSubjects
    .filter(s => s.classes.includes(klass))
    .map(s => ({ subject: s, topics: getTopicsForSubjectAndClass(s.slug, klass) }))
    .filter(x => x.topics.length > 0)
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { klass: klassStr } = await params
  const klass = parseKlass(klassStr)
  if (!klass) return {}
  const subjects = subjectsForClass(klass)
  return {
    title: `Учебник ${klass} класс — все предметы онлайн | pro-schools.ru`,
    description: `Онлайн учебник за ${klass} класс: ${subjects.map(s => s.subject.title).join(', ')}. Понятные объяснения, примеры и задачи по всем предметам ${klassLabelIn(klass)}.`,
    keywords: `учебник ${klass} класс, ${klass} класс все предметы, программа ${klass} класса онлайн`,
    alternates: { canonical: `https://pro-schools.ru/uchebnik/klass/${klassStr}/` },
  }
}

export default async function ClassPage({ params }: Props) {
  const { klass: klassStr } = await params
  const klass = parseKlass(klassStr)
  if (!klass) notFound()

  const subjects = subjectsForClass(klass)
  if (!subjects.length) notFound()

  const totalTopics = subjects.reduce((a, s) => a + s.topics.length, 0)

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-white border-b border-gray-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <nav className="flex items-center gap-2 text-sm text-gray-400 mb-4">
            <Link href="/" className="hover:text-gray-600">Главная</Link>
            <span>/</span>
            <Link href="/uchebnik/" className="hover:text-gray-600">Учебник</Link>
            <span>/</span>
            <span className="text-gray-700 font-medium">{klassLabel(klass)}</span>
          </nav>
          <h1 className="text-xl md:text-2xl font-black text-[#0F172A]">
            Учебник · {klassLabel(klass)}
          </h1>
          <p className="text-gray-400 text-sm mt-1">{subjects.length} предметов · {totalTopics} тем</p>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Выбор другого класса */}
        <div className="flex flex-wrap gap-2 mb-8">
          {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11].map(k => (
            <Link
              key={k}
              href={`/uchebnik/klass/${k}-klass/`}
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

        {/* Предметы этого класса */}
        <h2 className="text-base font-bold text-gray-700 mb-4">Предметы {klassLabelIn(klass)}</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {subjects.map(({ subject, topics }) => (
            <Link
              key={subject.slug}
              href={`/uchebnik/${subject.slug}/${klass}-klass/`}
              className="group bg-white rounded-2xl border border-gray-100 hover:border-blue-200 hover:shadow-lg shadow-sm p-5 transition-all duration-200"
            >
              <div className="flex items-start gap-4">
                <div className={`w-12 h-12 rounded-xl ${subject.color} flex items-center justify-center text-2xl flex-shrink-0`}>
                  {subject.icon}
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="font-bold text-[#0F172A] group-hover:text-blue-600 transition-colors mb-1">
                    {subject.title}
                  </h3>
                  <p className="text-xs text-gray-400 mb-2">{topics.length} тем</p>
                  <p className="text-xs text-gray-500 leading-relaxed line-clamp-2">
                    {topics.slice(0, 3).map(t => t.title).join(', ')}
                    {topics.length > 3 ? ' и другие' : ''}
                  </p>
                </div>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </div>
  )
}
