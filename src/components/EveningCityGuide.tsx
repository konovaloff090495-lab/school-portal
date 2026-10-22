import Link from 'next/link'
import EveningVerifiedAdmissions from '@/components/EveningVerifiedAdmissions'
import { regionLabels, type RegionSlug } from '@/data/schools'

const guides: Partial<Record<RegionSlug, { title: string; text: string; checks: string[] }>> = {
  ekaterinburg: {
    title: 'Вечерняя школа в Екатеринбурге: сначала проверьте организацию',
    text: 'Похожие названия вечерних школ не означают одинаковый приём. Среди организаций встречаются школы со специальными условиями и ограничениями контингента. До поездки подтвердите официальное название, адрес учебной площадки и возможность поступления именно в вашей ситуации.',
    checks: ['Назовите возраст, последний оконченный класс и документ, который можете предоставить.', 'Спросите, ведётся ли открытый приём граждан и где проходит обучение; не ориентируйтесь только на адрес в каталоге.', 'Получите точное расписание посещений, форму и срок программы; отдельно уточните бюджетные места.'],
  },
  tyumen: {
    title: 'Как искать вечерние классы в Тюмени',
    text: 'Ищите не только отдельную вечернюю школу, но и очно-заочные отделения при обычных школах. Если подходящего варианта в списке нет, запросите в городском управлении образования сведения о действующих программах и порядке обращения.',
    checks: ['Уточните, есть ли набор в нужный класс сейчас, а не только общее описание прошлых лет.', 'Попросите назвать дни обязательного посещения и правила обучения после перерыва.', 'Для онлайн-варианта заранее оцените место государственных экзаменов и организацию поездки.'],
  },
  omsk: {
    title: 'Вечерняя школа в Омске: документы важнее названия',
    text: 'После перерыва в учёбе точкой старта становится не возраст, а подтверждённое образование. Покажите принимающей школе имеющуюся справку или аттестат и уточните, на какую программу можно поступить. Если аттестат уже выдавался, рассмотрите получение дубликата.',
    checks: ['Без аттестата за 9 класс сначала согласуйте маршрут основного общего образования.', 'С аттестатом за 9 класс сравните обычный темп старших классов и ускоренный маршрут, если он доступен по документам.', 'До оплаты подготовки узнайте, кто оформляет зачисление, допуск к ГИА и выдачу аттестата.'],
  },
}
export default function EveningCityGuide({ region }: { region: RegionSlug }) {
  if (['ekaterinburg', 'sankt-peterburg'].includes(region)) return <EveningVerifiedAdmissions region={region} />
  const guide = guides[region]
  if (!guide) return null
  return <section className="rounded-2xl bg-white border border-slate-200 p-5 sm:p-7 mb-7">
    <h2 className="text-xl sm:text-2xl font-bold mb-4">{guide.title}</h2><p className="leading-7 mb-4">{guide.text}</p>
    <ul className="list-disc pl-5 space-y-2 leading-7">{guide.checks.map(c => <li key={c}>{c}</li>)}</ul>
    <nav aria-label={`Следующий шаг: ${regionLabels[region]}`} className="mt-5 flex flex-wrap gap-4 text-sm font-semibold text-blue-800 underline"><Link href="/blog/vechernyaya-shkola-kak-postupit/">Порядок поступления</Link><Link href="/blog/vechernyaya-shkola-dlya-vzroslyh/">Документы взрослому</Link><Link href="/attestat-vzroslomu/">Сравнить с платным онлайн</Link></nav>
  </section>
}
