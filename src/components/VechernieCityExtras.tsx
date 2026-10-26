import Link from 'next/link'
import type { ReactNode } from 'react'
import OnlineLeadCta from '@/components/OnlineLeadCta'
import { regionLabels, regionLabelsIn, type RegionSlug } from '@/data/schools'

export default function VechernieCityExtras({ region, count, variant = 'vechernie', afterLead }: { region: RegionSlug; count: number; variant?: 'vechernie' | 'eksternal'; afterLead?: ReactNode }) {
  const ekst = variant === 'eksternal'
  const regionIn = regionLabelsIn[region]
  const regionName = regionLabels[region]
  return <div className="max-w-4xl mx-auto space-y-8 pb-8">
    <OnlineLeadCta attestat
      source={ekst ? `Экстернат: город ${regionName}` : `Вечерние школы: город ${regionName}`}
      heading="Аттестат за 9 или 11 класс: узнайте условия онлайн-обучения"
      text={`Консультация Синергии для жителей ${regionName}: какие документы нужны, какой темп подходит и сколько стоит программа. Занятия в записи и промежуточные аттестации онлайн; ОГЭ/ЕГЭ по программе — очно в Москве. Эта заявка не отправляется в местные школы ${regionIn}.`}
      bullets={['маршрут к аттестату за 9 или 11 класс — по вашим документам', 'полная стоимость, сроки и содержание договора до оплаты', 'место экзаменов и необходимость поездки обсуждаются заранее']}
      city={regionName}
    />
    {afterLead}
    <section className="space-y-4">
      <h2 className="text-2xl font-bold">{ekst ? `Как выбрать экстернат ${regionIn}` : `Поступление в вечернюю школу ${regionIn}: что уточнить`}</h2>
      {count === 0 && <p className="leading-7">В каталоге пока нет отдельной местной карточки по этому формату. Это не означает, что таких программ в городе нет: очно-заочные отделения могут работать внутри обычных школ.</p>}
      <p className="leading-7">Начните с вашего документа об образовании и нужного результата. Если нет аттестата за 9 класс, не выбирайте программу 10–11 классов только из-за обещания быстрого выпуска. Если аттестат потерян, сначала уточните получение дубликата.</p>
      <ol className="list-decimal pl-5 space-y-3 leading-7">
        <li><strong>Местная школа.</strong> По официальным контактам подтвердите действующее название, приём вашего возраста и класса. Если контакты не подтверждаются, запросите актуальную информацию в управлении образования города.</li>
        <li><strong>Расписание и оплата.</strong> Уточните обязательные дни посещения, форму и срок программы. Наличие бюджетных мест и платные дополнительные услуги проверяйте отдельно.</li>
        <li><strong>Аттестации.</strong> До записи согласуйте зачёт предыдущих результатов, допуск к ГИА, регистрацию и место очных экзаменов. Учебный курс не заменяет школьное оформление.</li>
        <li><strong>Онлайн-альтернатива.</strong> Если готовы к платной программе, сравните обычный темп и экстернат. У Синергии уроки и промежуточные аттестации онлайн, а ОГЭ/ЕГЭ по программе проходят очно в Москве.</li>
      </ol>
      <nav aria-label={`Маршруты к аттестату: ${regionName}`} className="flex flex-wrap gap-4 text-sm font-semibold text-blue-800 underline">
        <Link href="/shkoly/tipy/vechernie/9-klass/">Окончить 9 класс</Link><Link href="/shkoly/tipy/vechernie/posle-9-klassa/">Поступить после 9 класса</Link><Link href="/shkoly/tipy/vechernie/starshie-klassy/">Программы 10–11 классов</Link><Link href="/blog/vechernyaya-shkola-kak-postupit/">Документы для поступления</Link>
      </nav>
    </section>

    <p className="text-sm leading-6 text-slate-600">Сравните <Link href="/attestat-vzroslomu/" className="text-blue-800 underline">маршруты к аттестату взрослому</Link>, <Link href="/blog/eksternat-ili-vechernyaya-shkola/" className="text-blue-800 underline">экстернат и вечернюю школу</Link>, <Link href="/shkoly/tipy/online/" className="text-blue-800 underline">онлайн-школы</Link>. Условия Синергии сверены 22.10.2026 по <a href="https://school-university.com/vechernyaya-shkola/" rel="nofollow" className="text-blue-800 underline">описанию программы</a>; наличие мест и условия конкретного договора уточняются в школе.</p>
  </div>
}
