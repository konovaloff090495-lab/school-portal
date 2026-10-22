import Link from 'next/link'

/** Separate the local-school task from a paid online consultation before the list. */
export default function EveningPathChooser({ city, localHref = '#spisok-shkol' }: { city?: string; localHref?: string }) {
  return <section data-evening-route className="rounded-2xl border border-slate-200 bg-white p-5 sm:p-7 mb-7">
    <p className="text-xs font-bold tracking-widest text-[#0369A1] mb-2">ВЫБЕРИТЕ СВОЮ ЗАДАЧУ</p>
    <h2 className="text-xl sm:text-2xl font-bold text-slate-900 mb-3">Найти вечернюю школу{city ? `: ${city}` : ''} или учиться онлайн?</h2>
    <p className="text-sm leading-6 text-slate-600 mb-5">Местные школы и платное онлайн-обучение — разные варианты. Сначала выберите формат, затем уточните приём и условия для вашего документа.</p>
    <div className="grid gap-3 md:grid-cols-3">
      <a href={localHref} className="rounded-xl border border-slate-200 p-4 hover:border-[#0369A1] focus-visible:outline-2 focus-visible:outline-offset-2">
        <strong className="block text-base mb-2">Нужна школа в городе</strong><span className="block text-sm leading-6 text-slate-600">Ниже — сведения каталога. Адрес, контакты и наличие мест сверьте с официальным сайтом школы.</span><span className="block mt-3 text-sm font-bold text-[#0369A1]">{localHref === '#spisok-shkol' ? 'Перейти к списку →' : 'Контакты этой школы →'}</span>
      </a>
      <Link href="/attestat-vzroslomu/#programma-9" className="rounded-xl border border-slate-200 bg-slate-50 p-4 hover:border-[#0369A1] focus-visible:outline-2 focus-visible:outline-offset-2">
        <strong className="block text-base mb-2">Нужен аттестат за 9 класс</strong><span className="block text-sm leading-6 text-slate-600">Рассмотреть платную программу Синергии: подготовка онлайн, ОГЭ очно в Москве.</span><span className="block mt-3 text-sm font-bold text-[#0369A1]">Посмотреть маршрут →</span>
      </Link>
      <Link href="/attestat-vzroslomu/#programma-11" className="rounded-xl border border-[#c8dadf] bg-[#f1f7f8] p-4 hover:border-[#0369A1] focus-visible:outline-2 focus-visible:outline-offset-2">
        <strong className="block text-base mb-2">Продолжить после 9 класса</strong><span className="block text-sm leading-6 text-slate-600">Сравнить обычный темп и экстернат 10–11 классов. Стоимость и сроки — по вашей программе.</span><span className="block mt-3 text-sm font-bold text-[#0369A1]">Сравнить варианты →</span>
      </Link>
    </div>
    <nav aria-label="Вечерние школы по классам" className="mt-5 flex flex-wrap gap-x-5 gap-y-3 text-sm font-semibold text-[#0369A1]">
      <Link href="/shkoly/tipy/vechernie/9-klass/">Каталог: 9 класс</Link><Link href="/shkoly/tipy/vechernie/posle-9-klassa/">Поступление после 9 класса</Link><Link href="/shkoly/tipy/vechernie/starshie-klassy/">Каталог: 10–11 классы</Link><Link href="/blog/eksternat-ili-vechernyaya-shkola/">Сравнение форматов</Link>
    </nav>
  </section>
}
