import type { Metadata } from 'next'
import Link from 'next/link'
import { egeSubjects } from '@/data/ege-oge'

export const metadata: Metadata = {
  title: 'Подготовка к ЕГЭ 2025 — все предметы, задания, разборы | pro-schools.ru',
  description: 'Бесплатная подготовка к ЕГЭ 2025: математика, русский язык, физика, химия, биология и другие предметы. Разборы заданий, теория, тренажёры по каждому типу задач.',
  keywords: 'подготовка к ЕГЭ, ЕГЭ 2025, задания ЕГЭ, разбор ЕГЭ, математика ЕГЭ, русский язык ЕГЭ',
  alternates: { canonical: 'https://pro-schools.ru/ege/' },
}

export default function EgePage() {
  const totalTasks = egeSubjects.reduce((s, sub) => s + sub.totalTasks, 0)

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-violet-50">
      {/* Hero */}
      <div className="bg-gradient-to-br from-[#1A0533] to-[#3B0764] text-white py-14 px-4">
        <div className="max-w-5xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 bg-white/10 rounded-full px-4 py-1.5 text-sm mb-6">
            <span>🏆</span>
            <span className="font-medium">Бесплатно · {egeSubjects.length} предметов · {totalTasks} заданий</span>
          </div>
          <h1 className="text-3xl md:text-5xl font-black mb-4 leading-tight">
            Подготовка к ЕГЭ 2025
          </h1>
          <p className="text-violet-200 text-lg max-w-2xl mx-auto mb-8">
            Разборы каждого задания: что проверяет, какие темы нужно знать, примеры с решением и тренажёры.
          </p>
          <div className="flex flex-wrap gap-2 justify-center">
            {['Математика', 'Русский язык', 'Физика', 'Химия', 'Биология'].map(label => (
              <span key={label} className="bg-white/10 hover:bg-white/20 transition-colors text-sm px-4 py-2 rounded-full cursor-default">
                {label}
              </span>
            ))}
          </div>
        </div>
      </div>

      {/* Предметы */}
      <div className="max-w-5xl mx-auto px-4 py-12">
        <h2 className="text-2xl font-black text-[#0F172A] mb-2">Выберите предмет</h2>
        <p className="text-gray-500 text-sm mb-8">{egeSubjects.length} предметов · {totalTasks} типов заданий</p>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {egeSubjects.map(subject => (
            <Link
              key={subject.slug}
              href={`/ege/${subject.slug}/`}
              className="group bg-white rounded-2xl border border-gray-100 hover:border-violet-200 hover:shadow-lg shadow-sm p-5 transition-all duration-200"
            >
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 rounded-xl bg-violet-50 flex items-center justify-center text-2xl flex-shrink-0">
                  {subject.icon}
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="font-bold text-[#0F172A] group-hover:text-violet-600 transition-colors mb-1">
                    {subject.name}
                  </h3>
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-xs text-gray-400">{subject.totalTasks} заданий</span>
                    <span className="text-xs text-gray-300">·</span>
                    <span className="text-xs text-gray-400">{subject.maxScore} баллов</span>
                    <span className="text-xs text-gray-300">·</span>
                    <span className="text-xs text-gray-400">{Math.floor(subject.duration / 60)} ч {subject.duration % 60} мин</span>
                  </div>
                  <p className="text-xs text-gray-500 leading-relaxed line-clamp-2">
                    {subject.description}
                  </p>
                </div>
              </div>
            </Link>
          ))}
        </div>

        {/* Как устроен раздел */}
        <div className="mt-14 bg-white rounded-2xl border border-gray-100 p-8">
          <h2 className="text-xl font-black text-[#0F172A] mb-6">Как устроена подготовка</h2>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
            {[
              { icon: '🎯', title: 'Каждое задание отдельно', desc: 'Разбираем каждый тип задания: что проверяет, что нужно знать, типичные ошибки.' },
              { icon: '📚', title: 'Теория и формулы', desc: 'Только нужный минимум теории — без воды. Формулы и правила, которые реально встречаются.' },
              { icon: '✏️', title: 'Тренажёр с ответами', desc: 'Практические задачи с ответами по каждому типу задания для самостоятельной проверки.' },
            ].map(item => (
              <div key={item.title} className="text-center">
                <div className="text-3xl mb-3">{item.icon}</div>
                <h3 className="font-bold text-[#0F172A] mb-2">{item.title}</h3>
                <p className="text-sm text-gray-500 leading-relaxed">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Ссылка на ОГЭ */}
        <div className="mt-8 bg-gradient-to-br from-blue-50 to-indigo-50 border border-blue-100 rounded-2xl p-6 flex items-center justify-between gap-4 flex-wrap">
          <div>
            <h3 className="font-black text-[#0F172A] text-lg mb-1">Готовитесь к ОГЭ?</h3>
            <p className="text-sm text-gray-600">Отдельный раздел с разборами всех заданий ОГЭ для 9 класса.</p>
          </div>
          <Link
            href="/oge/"
            className="bg-blue-600 hover:bg-blue-700 text-white font-bold px-5 py-2.5 rounded-xl transition-colors text-sm whitespace-nowrap"
          >
            Подготовка к ОГЭ →
          </Link>
        </div>
      </div>
    </div>
  )
}
