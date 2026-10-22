import Link from 'next/link'

export default function AdultAttestatLinks() {
  return <aside data-growth-block="adult-links" aria-label="Выбрать маршрут к аттестату" className="my-7 rounded-2xl border border-[#c8dadf] bg-[#f1f7f8] p-5 sm:p-6">
    <h2 className="text-xl font-bold mb-3">Какой аттестат вам нужен?</h2>
    <p className="text-sm leading-6 mb-4">Если готовы рассмотреть платное онлайн-обучение Синергии, начните с документов и условий программы. ОГЭ/ЕГЭ по ней проходят очно в Москве.</p>
    <div className="flex flex-wrap gap-x-5 gap-y-3 text-sm font-bold text-[#0369A1]"><Link data-growth-choice="attestat-9" href="/attestat-vzroslomu/#programma-9">Закончить 9 класс →</Link><Link data-growth-choice="attestat-11" href="/attestat-vzroslomu/#programma-11">Продолжить после 9 класса →</Link><Link data-growth-choice="local-school" href="/shkoly/tipy/vechernie/">Нужна местная вечерняя школа →</Link></div>
    <p className="text-sm leading-6 mt-4">Вечерние школы по городам: <Link className="underline" href="/shkoly/moskva/vechernie/">Москва</Link>, <Link className="underline" href="/shkoly/ekaterinburg/vechernie/">Екатеринбург</Link>, <Link className="underline" href="/shkoly/tyumen/vechernie/">Тюмень</Link>, <Link className="underline" href="/shkoly/omsk/vechernie/">Омск</Link>.</p>
  </aside>
}
