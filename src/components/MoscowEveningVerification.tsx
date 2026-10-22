import Link from 'next/link'

export default function MoscowEveningVerification() {
  return <section className="max-w-4xl mx-auto pb-8 space-y-5">
    <h2 className="text-2xl font-bold">Как проверить приём в вечернюю школу Москвы</h2>
    <p className="leading-7">В каталоге две записи. Они не означают два подтверждённых набора взрослых на текущий учебный год. Возраст, форму, длительность и стоимость программы необходимо подтвердить у принимающей организации.</p>
    <h3 className="text-xl font-bold">Открытая школа №88</h3>
    <p className="leading-7">Официальный сайт подтверждает организацию и адрес: Средняя Калитниковская улица, 9/11, строение 1. В обращении директора указана консультация по поступлению: <a className="text-blue-800 underline" href="tel:+74959125610">+7 (495) 912-56-10</a>, по будням с 08:00 до 17:00. Актуальность наличия мест и подходящей программы уточните при обращении.</p>
    <p><a className="text-blue-800 underline" href="https://sch88c.mskobr.ru/">Официальный сайт школы №88</a></p>
    <h3 className="text-xl font-bold">Запись о школе-экстернате №185</h3>
    <p className="leading-7">Опубликованный в карточке прежний сайт не позволил подтвердить текущие условия. Мы не представляем ускорение 10–11 за год, приём взрослых или бесплатность как проверенные факты. Перед обращением выясните действующее наименование организации и правила приёма.</p>
    <h3 className="text-xl font-bold">Подготовьте вопросы и документы</h3>
    <ul className="list-disc pl-6 space-y-2 leading-7"><li>Назовите возраст и точный документ: аттестат, свидетельство или справка о части обучения.</li><li>Попросите подтвердить приём на нужный уровень, имеющиеся места и сроки подачи.</li><li>Получите расписание обязательного присутствия, учебный план и порядок аттестации.</li><li>Уточните бюджетные места и платные услуги отдельно; отсутствие цены не означает бесплатный набор.</li></ul>
    <p className="text-sm text-slate-600">Проверка официальных страниц: 22.10.2026. Подтверждены контакты, а не текущие места и приём всех возрастов.</p>
    <nav className="flex flex-wrap gap-4"><Link className="text-blue-800 underline" href="/blog/vechernyaya-shkola-dlya-vzroslyh/">Маршрут взрослому</Link><Link className="text-blue-800 underline" href="/blog/vechernyaya-shkola-kak-postupit/">Документы и поступление</Link><Link className="text-blue-800 underline" href="/shkoly/tipy/zaochnye/">Заочные альтернативы</Link></nav>
  </section>
}
