import type { Metadata } from 'next'
import Link from 'next/link'
import { textbookSubjects, textbookTopics } from '@/data/textbook'

export const metadata: Metadata = {
  title: 'Онлайн учебник для школьников 1–11 класс — все предметы | pro-schools.ru',
  description: 'Бесплатный онлайн учебник по всем школьным предметам: математика, русский язык, физика, химия, биология, история. Объяснения, примеры, задачи для 1–11 класса.',
  keywords: 'онлайн учебник, учебник для школьников, математика онлайн, русский язык учебник, подготовка к ОГЭ ЕГЭ',
  alternates: { canonical: 'https://pro-schools.ru/uchebnik/' },
}

export default function TextbookPage() {
  const totalTopics = textbookTopics.length

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-blue-50">
      {/* Hero */}
      <div className="bg-gradient-to-br from-[#0F172A] to-[#1E3A5F] text-white py-14 px-4">
        <div className="max-w-5xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 bg-white/10 rounded-full px-4 py-1.5 text-sm mb-6">
            <span>📖</span>
            <span className="font-medium">Бесплатно · Все классы · Все предметы</span>
          </div>
          <h1 className="text-3xl md:text-5xl font-black mb-4 leading-tight">
            Онлайн учебник<br />для школьников
          </h1>
          <p className="text-blue-200 text-lg max-w-2xl mx-auto mb-8">
            {totalTopics}+ тем по всем предметам. Понятные объяснения, примеры с решением,
            подготовка к ОГЭ и ЕГЭ — всё в одном месте.
          </p>
          {/* Быстрый переход по классам */}
          <div className="flex flex-wrap gap-2 justify-center">
            {[{ k: 1, label: '1 класс' }, { k: 5, label: '5 класс' }, { k: 9, label: '9 класс (ОГЭ)' }, { k: 11, label: '11 класс (ЕГЭ)' }].map(({ k, label }) => (
              <Link key={k} href={`/uchebnik/klass/${k}-klass/`} className="bg-white/10 hover:bg-white/20 transition-colors text-sm px-4 py-2 rounded-full">
                {label}
              </Link>
            ))}
          </div>
        </div>
      </div>

      {/* Выбор класса */}
      <div className="max-w-5xl mx-auto px-4 pt-12">
        <h2 className="text-2xl font-black text-[#0F172A] mb-2">Выберите класс</h2>
        <p className="text-gray-500 text-sm mb-8">Все предметы вашего класса на одной странице</p>
        <div className="grid grid-cols-3 sm:grid-cols-4 lg:grid-cols-6 gap-3">
          {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11].map(k => (
            <Link
              key={k}
              href={`/uchebnik/klass/${k}-klass/`}
              className="group bg-white rounded-2xl border border-gray-100 hover:border-blue-300 hover:shadow-lg shadow-sm p-4 flex flex-col items-center justify-center transition-all duration-200"
            >
              <span className="text-2xl md:text-3xl font-black text-[#0F172A] group-hover:text-blue-600 transition-colors leading-none">
                {k}
              </span>
              <span className="text-xs text-gray-400 mt-1">класс</span>
            </Link>
          ))}
        </div>
      </div>

      {/* Предметы */}
      <div className="max-w-5xl mx-auto px-4 py-12">
        <h2 className="text-2xl font-black text-[#0F172A] mb-2">Или выберите предмет</h2>
        <p className="text-gray-500 text-sm mb-8">13 предметов · {totalTopics} тем</p>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {textbookSubjects.map(subject => {
            const topicCount = textbookTopics.filter(t => t.subject === subject.slug).length
            const classRange = `${Math.min(...subject.classes)}–${Math.max(...subject.classes)} класс`
            return (
              <Link
                key={subject.slug}
                href={`/uchebnik/${subject.slug}/`}
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
                    <p className="text-xs text-gray-400 mb-2">{classRange} · {topicCount} тем</p>
                    <p className="text-xs text-gray-500 leading-relaxed line-clamp-2">
                      {subject.description}
                    </p>
                  </div>
                </div>
              </Link>
            )
          })}
        </div>

        {/* Популярные темы */}
        <div className="mt-14">
          <h2 className="text-xl font-black text-[#0F172A] mb-6">🔥 Популярные темы</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {[
              { subject: 'algebra', klass: 8, slug: 'kvadratnoe-uravnenie', title: 'Квадратное уравнение', icon: '📐' },
              { subject: 'russkiy-yazyk', klass: 9, slug: 'spp', title: 'Сложноподчинённое предложение', icon: '📝' },
              { subject: 'fizika', klass: 9, slug: 'postoyanny-tok', title: 'Закон Ома для участка цепи', icon: '⚡' },
              { subject: 'khimiya', klass: 8, slug: 'tablitsa-mendeleeva', title: 'Таблица Менделеева', icon: '🧪' },
              { subject: 'matematika', klass: 5, slug: 'protsenty', title: 'Проценты', icon: '🔢' },
              { subject: 'biologiya', klass: 9, slug: 'genetika', title: 'Законы Менделя', icon: '🌿' },
            ].map(item => (
              <Link
                key={`${item.subject}-${item.slug}`}
                href={`/uchebnik/${item.subject}/${item.klass}-klass/${item.slug}/`}
                className="flex items-center gap-3 bg-white rounded-xl border border-gray-100 hover:border-blue-200 hover:shadow-md p-4 transition-all group"
              >
                <span className="text-xl">{item.icon}</span>
                <div>
                  <p className="text-sm font-semibold text-[#0F172A] group-hover:text-blue-600 transition-colors">
                    {item.title}
                  </p>
                  <p className="text-xs text-gray-400">{item.klass} класс</p>
                </div>
              </Link>
            ))}
          </div>
        </div>

        {/* Блок для ОГЭ/ЕГЭ */}
        <div className="mt-14 grid grid-cols-1 sm:grid-cols-2 gap-5">
          <div className="bg-gradient-to-br from-blue-50 to-indigo-50 border border-blue-100 rounded-2xl p-6">
            <p className="text-2xl mb-3">🎯</p>
            <h3 className="font-black text-[#0F172A] text-lg mb-2">Подготовка к ОГЭ</h3>
            <p className="text-sm text-gray-600 mb-4">Все темы кодификатора ОГЭ по математике, русскому, физике, химии, биологии и истории.</p>
            <div className="flex flex-wrap gap-2">
              {[
                { s: 'matematika', k: 9, label: 'Математика' },
                { s: 'russkiy-yazyk', k: 9, label: 'Русский' },
                { s: 'fizika', k: 9, label: 'Физика' },
                { s: 'khimiya', k: 9, label: 'Химия' },
              ].map(item => (
                <Link key={item.s} href={`/uchebnik/${item.s}/${item.k}-klass/`} className="text-xs bg-blue-100 hover:bg-blue-200 text-blue-700 font-semibold px-3 py-1.5 rounded-full transition-colors">
                  {item.label} 9 кл.
                </Link>
              ))}
            </div>
          </div>
          <div className="bg-gradient-to-br from-violet-50 to-purple-50 border border-violet-100 rounded-2xl p-6">
            <p className="text-2xl mb-3">🏆</p>
            <h3 className="font-black text-[#0F172A] text-lg mb-2">Подготовка к ЕГЭ</h3>
            <p className="text-sm text-gray-600 mb-4">Все темы ЕГЭ с объяснениями, разбором заданий и практическими примерами.</p>
            <div className="flex flex-wrap gap-2">
              {[
                { s: 'algebra', k: 11, label: 'Математика' },
                { s: 'russkiy-yazyk', k: 11, label: 'Русский' },
                { s: 'fizika', k: 11, label: 'Физика' },
                { s: 'khimiya', k: 11, label: 'Химия' },
              ].map(item => (
                <Link key={item.s} href={`/uchebnik/${item.s}/${item.k}-klass/`} className="text-xs bg-violet-100 hover:bg-violet-200 text-violet-700 font-semibold px-3 py-1.5 rounded-full transition-colors">
                  {item.label} 11 кл.
                </Link>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
