import Link from 'next/link'
import Breadcrumbs from '@/components/Breadcrumbs'
import { BreadcrumbJsonLd } from '@/lib/schema'
import OnlineBrandsTable from '@/components/OnlineBrandsTable'
import OnlineLeadCta from '@/components/OnlineLeadCta'
import gradePages from '@/data/online-grade-pages.json'

export function getOnlineGradePage(slug: string) {
  return gradePages.find(p => p.slug === slug)
}

export default function OnlineGradePage({ slug }: { slug: string }) {
  const page = getOnlineGradePage(slug)!
  const url = `https://pro-schools.ru/shkoly/tipy/online/${slug}/`
  return <main className="max-w-6xl mx-auto px-4 py-6 text-slate-800">
    <BreadcrumbJsonLd items={[{ name: 'Все школы', href: 'https://pro-schools.ru/shkoly/' }, { name: 'Онлайн-школы', href: 'https://pro-schools.ru/shkoly/tipy/online/' }, { name: page.h1, href: url }]} />
    <Breadcrumbs crumbs={[{ label: 'Все школы', href: '/shkoly/' }, { label: 'Онлайн-школы', href: '/shkoly/tipy/online/' }, { label: page.label }]} />
    <h1 className="text-3xl md:text-4xl font-extrabold mt-6 mb-4">{page.h1}</h1>
    <p className="text-lg leading-relaxed max-w-4xl mb-6">{page.intro}</p>
    <nav aria-label="Классы онлайн-школы" className="flex flex-wrap gap-2 mb-8">{gradePages.filter(p => p.slug !== slug).map(p => <Link className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-blue-800" key={p.slug} href={`/shkoly/tipy/online/${p.slug}/`}>{p.label}</Link>)}</nav>
    <OnlineBrandsTable grades={page.grades} title={`Сравнить программы: ${page.label.toLowerCase()}`} intro="Здесь сопоставляются школьные программы; отдельные занятия с репетитором и курсы подготовки к экзаменам не заменяют зачисление. Сначала проверьте нужный класс, затем формат уроков и школу, которая оформляет документы." />
    <div className="max-w-4xl mx-auto space-y-8 my-8">
      {page.sections.map(section => <section key={section.h}><h2 className="text-2xl font-bold mb-3">{section.h}</h2>{section.p.map(p => <p className="leading-7 mb-3" key={p}>{p}</p>)}</section>)}
      <section><h2 className="text-2xl font-bold mb-3">Что получить от школы до оплаты</h2><ol className="list-decimal pl-6 space-y-2 leading-7"><li>Договор с точным классом, сроком обучения и перечнем услуг. Название платформы может отличаться от юридического лица школы.</li><li>Подтверждение формы обучения и зачисления: приказ, договор на аттестацию либо понятное описание самостоятельного прикрепления.</li><li>Расписание в вашем часовом поясе, пример урока и домашней работы с обратной связью. Уточните, что происходит при пропуске.</li><li>План аттестаций: предметы, сроки, формат, пересдачи и документы о результатах.</li><li>Полную стоимость до конца учебного года: уроки, сопровождение, прикрепление и дополнительные занятия. Рассрочка не равна скидке.</li></ol></section>
      <section><h2 className="text-2xl font-bold mb-3">Как оформить переход</h2><p className="leading-7">Онлайн — технология занятий. При заочной или очно-заочной форме ученик зачислен в школу; при семейном образовании обучение организует семья, а для аттестации оформляется зачисление экстерном. Согласуйте новый маршрут и документы до отчисления из прежней школы.</p><div className="flex flex-wrap gap-4 mt-4"><Link className="text-blue-800 underline" href="/blog/semejnoe-obuchenie-kak-perejti/">Переход на семейное обучение</Link><Link className="text-blue-800 underline" href="/blog/prikreplenie-k-shkole-dlya-attestacii/">Прикрепление для аттестации</Link><Link className="text-blue-800 underline" href="/blog/besplatnaya-onlajn-shkola/">Что доступно бесплатно</Link></div></section>
    </div>
    <OnlineLeadCta source={`Онлайн-школы по классам: ${slug}`} heading={`Консультация по программе: ${page.label.toLowerCase()}`} text="Консультант онлайн-школы Синергия расскажет о своей программе, зачислении и условиях оплаты. Сравнить остальные школы можно по таблице и официальным сайтам в обзорах." bullets={['назовите класс и текущую форму обучения', 'уточните расписание и требования к аттестации', 'попросите полный расчёт учебного года']} />
  </main>
}
