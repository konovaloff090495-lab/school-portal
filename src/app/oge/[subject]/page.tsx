import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { ogeSubjects, getOgeSubject } from '@/data/ege-oge'

interface Props { params: Promise<{ subject: string }> }

export function generateStaticParams() {
  return ogeSubjects.map(s => ({ subject: s.slug }))
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { subject: subjectSlug } = await params
  const subject = getOgeSubject(subjectSlug)
  if (!subject) return {}
  return {
    title: `ОГЭ по ${subject.name} 2025 — все задания с разбором | pro-schools.ru`,
    description: `Подготовка к ОГЭ по ${subject.name}: разбор всех ${subject.totalTasks} заданий, теория, формулы, примеры и тренажёры. ${subject.description}`,
    keywords: `ОГЭ ${subject.nameShort.toLowerCase()}, задания ОГЭ ${subject.nameShort.toLowerCase()}, подготовка к ОГЭ ${subject.nameShort.toLowerCase()}`,
    alternates: { canonical: `https://pro-schools.ru/oge/${subjectSlug}/` },
  }
}

export default async function OgeSubjectPage({ params }: Props) {
  const { subject: subjectSlug } = await params
  const subject = getOgeSubject(subjectSlug)
  if (!subject) notFound()

  const part1 = subject.tasks.filter(t => t.maxScore === 1)
  const part2 = subject.tasks.filter(t => t.maxScore > 1)

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-100">
        <div className="max-w-5xl mx-auto px-4 py-6">
          {/* Breadcrumb */}
          <nav className="flex items-center gap-2 text-sm text-gray-400 mb-4">
            <Link href="/" className="hover:text-gray-600">Главная</Link>
            <span>/</span>
            <Link href="/oge/" className="hover:text-gray-600">ОГЭ</Link>
            <span>/</span>
            <span className="text-gray-700 font-medium">{subject.name}</span>
          </nav>

          <div className="flex items-start gap-4">
            <div className="w-14 h-14 rounded-2xl bg-blue-50 flex items-center justify-center text-3xl flex-shrink-0">
              {subject.icon}
            </div>
            <div>
              <div className="flex items-center gap-2 mb-1">
                <span className="text-xs bg-blue-100 text-blue-700 font-bold px-2 py-0.5 rounded-full">ОГЭ</span>
                <span className="text-xs text-gray-400">9 класс</span>
              </div>
              <h1 className="text-2xl md:text-3xl font-black text-[#0F172A]">ОГЭ по {subject.name}</h1>
              <p className="text-gray-500 text-sm mt-1">{subject.description}</p>
            </div>
          </div>

          {/* Мета-инфо */}
          <div className="flex flex-wrap gap-4 mt-5">
            {[
              { label: 'Заданий', value: subject.totalTasks },
              { label: 'Макс. баллов', value: subject.maxScore },
              { label: 'Время', value: `${Math.floor(subject.duration / 60)} ч ${subject.duration % 60} мин` },
            ].map(item => (
              <div key={item.label} className="bg-gray-50 rounded-xl px-4 py-2 text-center">
                <div className="text-lg font-black text-blue-600">{item.value}</div>
                <div className="text-xs text-gray-400">{item.label}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-4 py-10">
        {/* Часть 1 */}
        {part1.length > 0 && (
          <div className="mb-10">
            <div className="flex items-center gap-3 mb-4">
              <h2 className="text-lg font-bold text-[#0F172A]">Часть 1 — краткий ответ</h2>
              <span className="text-xs bg-gray-100 text-gray-500 px-2 py-0.5 rounded-full">{part1.length} заданий</span>
            </div>
            <div className="bg-white rounded-2xl border border-gray-100 divide-y divide-gray-50 overflow-hidden">
              {part1.map(task => (
                <Link
                  key={task.slug}
                  href={`/oge/${subjectSlug}/${task.slug}/`}
                  className="flex items-center gap-4 px-5 py-4 hover:bg-blue-50 transition-colors group"
                >
                  <div className="w-9 h-9 rounded-lg bg-blue-50 group-hover:bg-blue-100 flex items-center justify-center text-sm font-black text-blue-600 flex-shrink-0 transition-colors">
                    {task.number}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-[#0F172A] group-hover:text-blue-600 transition-colors">
                      {task.title}
                    </p>
                    <p className="text-xs text-gray-400 truncate">{task.shortDesc}</p>
                  </div>
                  <div className="flex items-center gap-3 flex-shrink-0">
                    <span className="text-xs text-gray-300">{task.maxScore} балл</span>
                    <span className="text-gray-300 group-hover:text-blue-400 transition-colors">→</span>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        )}

        {/* Часть 2 */}
        {part2.length > 0 && (
          <div className="mb-10">
            <div className="flex items-center gap-3 mb-4">
              <h2 className="text-lg font-bold text-[#0F172A]">Часть 2 — развёрнутый ответ</h2>
              <span className="text-xs bg-gray-100 text-gray-500 px-2 py-0.5 rounded-full">{part2.length} заданий</span>
            </div>
            <div className="bg-white rounded-2xl border border-gray-100 divide-y divide-gray-50 overflow-hidden">
              {part2.map(task => (
                <Link
                  key={task.slug}
                  href={`/oge/${subjectSlug}/${task.slug}/`}
                  className="flex items-center gap-4 px-5 py-4 hover:bg-blue-50 transition-colors group"
                >
                  <div className="w-9 h-9 rounded-lg bg-amber-50 group-hover:bg-amber-100 flex items-center justify-center text-sm font-black text-amber-600 flex-shrink-0 transition-colors">
                    {task.number}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-[#0F172A] group-hover:text-blue-600 transition-colors">
                      {task.title}
                    </p>
                    <p className="text-xs text-gray-400 truncate">{task.shortDesc}</p>
                  </div>
                  <div className="flex items-center gap-3 flex-shrink-0">
                    <span className="text-xs bg-amber-50 text-amber-600 font-bold px-2 py-0.5 rounded-full">
                      до {task.maxScore} баллов
                    </span>
                    <span className="text-gray-300 group-hover:text-blue-400 transition-colors">→</span>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        )}

        {subject.tasks.length === 0 && (
          <div className="bg-white rounded-2xl border border-gray-100 p-10 text-center">
            <p className="text-4xl mb-4">🚧</p>
            <h3 className="font-bold text-[#0F172A] mb-2">Разборы скоро появятся</h3>
            <p className="text-sm text-gray-500">Готовим подробный разбор каждого задания ОГЭ по {subject.name}.</p>
          </div>
        )}

        {/* Навигация к школам */}
        <div className="mt-8 bg-gradient-to-br from-blue-50 to-indigo-50 border border-blue-100 rounded-2xl p-6 flex items-center justify-between gap-4 flex-wrap">
          <div>
            <h3 className="font-black text-[#0F172A] text-base mb-1">Нужна школа с подготовкой к ОГЭ?</h3>
            <p className="text-sm text-gray-600">Найдите школы с профильными классами и опытными преподавателями.</p>
          </div>
          <Link
            href="/shkoly/osobennosti/podgotovka-k-oge/"
            className="bg-blue-600 hover:bg-blue-700 text-white font-bold px-5 py-2.5 rounded-xl transition-colors text-sm whitespace-nowrap"
          >
            Найти школу →
          </Link>
        </div>
      </div>
    </div>
  )
}
