import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { egeSubjects, getEgeSubject, getEgeTask } from '@/data/ege-oge'

interface Props { params: Promise<{ subject: string; task: string }> }

export function generateStaticParams() {
  const result: { subject: string; task: string }[] = []
  for (const subject of egeSubjects) {
    for (const task of subject.tasks) {
      result.push({ subject: subject.slug, task: task.slug })
    }
  }
  return result
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { subject: subjectSlug, task: taskSlug } = await params
  const subject = getEgeSubject(subjectSlug)
  const task = getEgeTask(subjectSlug, taskSlug)
  if (!subject || !task) return {}
  return {
    title: `ЕГЭ ${subject.nameShort} — ${task.title}: ${task.shortDesc} | pro-schools.ru`,
    description: `Разбор ${task.title} ЕГЭ по ${subject.name}: что проверяет, какие темы нужно знать, примеры с решением и тренажёр. Максимальный балл — ${task.maxScore}.`,
    keywords: `${task.title} ЕГЭ ${subject.nameShort.toLowerCase()}, ${task.shortDesc.toLowerCase()} ЕГЭ`,
    alternates: { canonical: `https://pro-schools.ru/ege/${subjectSlug}/${taskSlug}/` },
  }
}

export default async function EgeTaskPage({ params }: Props) {
  const { subject: subjectSlug, task: taskSlug } = await params
  const subject = getEgeSubject(subjectSlug)
  const task = getEgeTask(subjectSlug, taskSlug)
  if (!subject || !task) notFound()

  const taskIndex = subject.tasks.findIndex(t => t.slug === taskSlug)
  const prevTask = taskIndex > 0 ? subject.tasks[taskIndex - 1] : null
  const nextTask = taskIndex < subject.tasks.length - 1 ? subject.tasks[taskIndex + 1] : null

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-100">
        <div className="max-w-4xl mx-auto px-4 py-6">
          {/* Breadcrumb */}
          <nav className="flex items-center gap-2 text-sm text-gray-400 mb-4 flex-wrap">
            <Link href="/" className="hover:text-gray-600">Главная</Link>
            <span>/</span>
            <Link href="/ege/" className="hover:text-gray-600">ЕГЭ</Link>
            <span>/</span>
            <Link href={`/ege/${subjectSlug}/`} className="hover:text-gray-600">{subject.name}</Link>
            <span>/</span>
            <span className="text-gray-700 font-medium">{task.title}</span>
          </nav>

          <div className="flex items-start gap-4">
            <div className="w-14 h-14 rounded-2xl bg-violet-100 flex items-center justify-center text-2xl font-black text-violet-600 flex-shrink-0">
              {task.number}
            </div>
            <div>
              <div className="flex items-center gap-2 mb-1">
                <span className="text-xs bg-violet-100 text-violet-700 font-bold px-2 py-0.5 rounded-full">ЕГЭ</span>
                <span className="text-xs text-gray-400">{subject.name}</span>
                <span className="text-xs text-gray-300">·</span>
                <span className="text-xs text-gray-400">до {task.maxScore} {task.maxScore === 1 ? 'балла' : 'баллов'}</span>
              </div>
              <h1 className="text-2xl md:text-3xl font-black text-[#0F172A]">{task.title}</h1>
              <p className="text-gray-500 text-sm mt-1">{task.shortDesc}</p>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 py-10">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Основной контент */}
          <div className="lg:col-span-2">
            <div
              className="bg-white rounded-2xl border border-gray-100 p-6 md:p-8 prose prose-sm max-w-none
                prose-headings:font-black prose-headings:text-[#0F172A]
                prose-h2:text-xl prose-h2:mt-6 prose-h2:mb-3
                prose-p:text-gray-600 prose-p:leading-relaxed
                prose-ul:text-gray-600 prose-li:my-0.5
                prose-table:text-sm prose-th:bg-gray-50 prose-th:font-bold prose-th:p-2 prose-td:p-2 prose-table:border prose-td:border prose-th:border
                prose-strong:text-[#0F172A]"
              dangerouslySetInnerHTML={{ __html: task.content }}
            />

            {/* Навигация по заданиям */}
            <div className="flex items-center justify-between mt-6 gap-4">
              {prevTask ? (
                <Link
                  href={`/ege/${subjectSlug}/${prevTask.slug}/`}
                  className="flex items-center gap-2 bg-white border border-gray-100 hover:border-violet-200 rounded-xl px-4 py-3 transition-colors group flex-1 min-w-0"
                >
                  <span className="text-gray-400 group-hover:text-violet-500 transition-colors">←</span>
                  <div className="min-w-0">
                    <p className="text-xs text-gray-400">Предыдущее</p>
                    <p className="text-sm font-semibold text-[#0F172A] group-hover:text-violet-600 truncate">{prevTask.title}</p>
                  </div>
                </Link>
              ) : <div className="flex-1" />}

              {nextTask ? (
                <Link
                  href={`/ege/${subjectSlug}/${nextTask.slug}/`}
                  className="flex items-center gap-2 bg-white border border-gray-100 hover:border-violet-200 rounded-xl px-4 py-3 transition-colors group flex-1 min-w-0 text-right"
                >
                  <div className="min-w-0 flex-1">
                    <p className="text-xs text-gray-400">Следующее</p>
                    <p className="text-sm font-semibold text-[#0F172A] group-hover:text-violet-600 truncate">{nextTask.title}</p>
                  </div>
                  <span className="text-gray-400 group-hover:text-violet-500 transition-colors">→</span>
                </Link>
              ) : <div className="flex-1" />}
            </div>
          </div>

          {/* Сайдбар */}
          <div className="lg:col-span-1 space-y-4">
            {/* Список всех заданий */}
            <div className="bg-white rounded-2xl border border-gray-100 p-4">
              <h3 className="text-sm font-bold text-[#0F172A] mb-3">
                Все задания ЕГЭ по {subject.nameShort}
              </h3>
              <div className="space-y-1">
                {subject.tasks.map(t => (
                  <Link
                    key={t.slug}
                    href={`/ege/${subjectSlug}/${t.slug}/`}
                    className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm transition-colors ${
                      t.slug === taskSlug
                        ? 'bg-violet-50 text-violet-700 font-semibold'
                        : 'text-gray-600 hover:bg-gray-50 hover:text-gray-800'
                    }`}
                  >
                    <span className="w-6 h-6 rounded-md bg-gray-100 flex items-center justify-center text-xs font-bold flex-shrink-0">
                      {t.number}
                    </span>
                    <span className="truncate">{t.shortDesc}</span>
                  </Link>
                ))}
              </div>
              <Link
                href={`/ege/${subjectSlug}/`}
                className="block text-center text-xs text-violet-600 hover:text-violet-700 font-semibold mt-3 pt-3 border-t border-gray-50"
              >
                ← К списку заданий
              </Link>
            </div>

            {/* Блок школ */}
            <div className="bg-gradient-to-br from-violet-50 to-purple-50 border border-violet-100 rounded-2xl p-4">
              <p className="text-2xl mb-2">🏫</p>
              <h3 className="font-bold text-[#0F172A] text-sm mb-1">Нужен репетитор или школа?</h3>
              <p className="text-xs text-gray-500 mb-3">Найдите школу с углублённой подготовкой к ЕГЭ.</p>
              <Link
                href="/shkoly/osobennosti/podgotovka-k-ege/"
                className="block text-center bg-violet-600 hover:bg-violet-700 text-white text-xs font-bold px-4 py-2 rounded-lg transition-colors"
              >
                Найти школу →
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
