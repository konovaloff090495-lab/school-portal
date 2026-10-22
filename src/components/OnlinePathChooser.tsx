import Link from 'next/link'

export default function OnlinePathChooser() {
  return <section data-growth-block="online-intent" className="rounded-2xl bg-[#f1f7f8] border border-[#c8dadf] p-5 sm:p-7 mb-7">
    <h2 className="text-xl sm:text-2xl font-bold mb-3">Что нужно от онлайн-школы?</h2>
    <p className="text-sm leading-6 mb-5">Сравните полный учебный год, отдельные уроки и путь к аттестату. Затем проверьте выбранный класс, оформление и полную стоимость.</p>
    <div className="grid md:grid-cols-3 gap-3">
      <Link data-growth-choice="full-school" href="/shkoly/tipy/online/#klassy" className="bg-white rounded-xl p-4 border border-slate-200"><strong className="block mb-2">Полная школа для ребёнка</strong><span className="text-sm leading-6">Выбрать класс, формат уроков и школьную аттестацию →</span></Link>
      <Link data-growth-choice="adult-attestat" href="/attestat-vzroslomu/" className="bg-white rounded-xl p-4 border border-slate-200"><strong className="block mb-2">Вернуться за аттестатом</strong><span className="text-sm leading-6">Маршруты за 9 и 11 класс, включая платную программу Синергии →</span></Link>
      <Link data-growth-choice="subject-courses" href="/kursy/shkolnaya-programma/" className="bg-white rounded-xl p-4 border border-slate-200"><strong className="block mb-2">Подтянуть отдельный предмет</strong><span className="text-sm leading-6">Курсы и подготовка к экзаменам; зачисление в школу проверяется отдельно →</span></Link>
    </div>
  </section>
}
