import type { Metadata } from 'next'
import Link from 'next/link'
import LeadForm from '@/components/LeadForm'
import { BreadcrumbJsonLd, FaqJsonLd } from '@/lib/schema'

const path = '/attestat-vzroslomu/'
export const metadata: Metadata = {
  title: 'Получить аттестат взрослому: онлайн-программы 9 и 11 класса, условия',
  description: 'Не закончили школу? Выберите маршрут к аттестату за 9 или 11 класс: документы, платное онлайн-обучение Синергии, сроки и очные экзамены в Москве. Консультация по вашей ситуации.',
  alternates: { canonical: `https://pro-schools.ru${path}` },
}
const faq = [
  { q: 'Можно ли закончить школу после 18 лет?', a: 'Синергия указывает приём взрослых на программы 9, 10 и 11 класса. Маршрут зависит от подтверждённого образования: для 10–11 классов нужен аттестат за 9 класс. Документы, наличие мест и условия подтверждает принимающая школа.' },
  { q: 'Это бесплатная вечерняя школа?', a: 'Нет. Здесь можно получить консультацию по платному онлайн-обучению Синергии. Если нужна местная государственная школа, используйте каталог и её официальные контакты. Наличие бесплатных мест уточняйте непосредственно у школы.' },
  { q: 'Можно ли получить аттестат полностью из дома?', a: 'Уроки и промежуточные аттестации могут проходить онлайн. ОГЭ и ЕГЭ по указанной программе Синергии проходят очно в Москве. Если поездка не подходит, до оплаты обсудите с принимающей школой другой маршрут и место экзаменов.' },
  { q: 'Сколько стоит программа и сколько времени учиться?', a: 'Итоговая цена и темп зависят от класса, документов и договора. Экстернат предлагает ускоренный темп, но срок не гарантируется всем одинаково. До оплаты запросите полный расчёт, учебный план и график аттестаций.' },
  { q: 'Кто получит мою заявку?', a: 'Заявку получит консультант онлайн-школы Синергия. Это не обращение в выбранную местную вечернюю школу и не обещание поступления. Консультант уточнит цель, документы и подходящую программу.' },
]
export default function AdultAttestatPage() {
  return <div className="max-w-6xl mx-auto px-4 sm:px-6 py-8 sm:py-12">
    <BreadcrumbJsonLd items={[{ name: 'Главная', href: 'https://pro-schools.ru/' }, { name: 'Аттестат взрослому' }]} />
    <FaqJsonLd faqs={faq.map(f => ({ question: f.q, answer: f.a }))} />
    <div className="rounded-3xl bg-[#123d4b] text-white p-6 sm:p-12 mb-9">
      <p className="text-xs font-bold tracking-widest text-[#b8d9de] mb-5">ВЕРНУТЬСЯ К ОБРАЗОВАНИЮ</p>
      <h1 className="text-3xl sm:text-5xl font-bold leading-tight max-w-3xl">Аттестат взрослому: 9 или 11 класс</h1>
      <p className="mt-5 max-w-2xl text-lg leading-8 text-[#dfedf0]">Платное онлайн-обучение Синергии. Подберём программу по вашим документам. Занятия — в записи, ОГЭ/ЕГЭ — очно в Москве.</p>
      <div className="mt-7 flex flex-wrap gap-3"><a href="#programma-9" className="rounded-xl bg-white text-[#123d4b] px-5 py-3 font-bold">Нужен аттестат за 9 класс</a><a href="#programma-11" className="rounded-xl border border-white/50 px-5 py-3 font-bold">У меня уже есть 9 классов</a></div>
    </div>
    <div className="grid md:grid-cols-2 gap-6 mb-9">
      <section id="programma-9" className="scroll-mt-28 rounded-2xl bg-white border border-slate-200 p-6 sm:p-8">
        <p className="text-sm font-bold text-[#0369A1] mb-2">МАРШРУТ 01</p><h2 className="text-2xl font-bold mb-4">Аттестат за 9 класс</h2>
        <p className="leading-7 mb-4">Если девятый класс не окончен, сначала нужно подтвердить уже освоенную программу. Покажите школе справку, личное дело или другой имеющийся документ. Не покупайте подготовку к ОГЭ, пока не согласован допуск и весь путь к аттестату.</p>
        <ol className="list-decimal pl-5 space-y-3 leading-7"><li>Согласовать стартовый класс и документы.</li><li>Выбрать подготовку и пройти промежуточные аттестации.</li><li>Оформить допуск, регистрацию и очную ГИА.</li><li>После успешного завершения получить аттестат.</li></ol>
        <p className="mt-4 text-sm leading-6 text-slate-600">У Синергии — ОГЭ очно в Москве. Даты и организацию поездки уточните до заключения договора.</p><a className="inline-block mt-5 font-bold text-[#0369A1] underline" href="#konsultaciya">Уточнить маршрут за 9 класс →</a>
      </section>
      <section id="programma-11" className="scroll-mt-28 rounded-2xl bg-white border border-slate-200 p-6 sm:p-8">
        <p className="text-sm font-bold text-[#0369A1] mb-2">МАРШРУТ 02</p><h2 className="text-2xl font-bold mb-4">10–11 классы после девятого</h2>
        <p className="leading-7 mb-4">Если аттестат за 9 класс уже есть, сравните обычный учебный темп и экстернат. Работу можно совмещать с занятиями по записям. Ускоренный маршрут нужно согласовать по документам и текущему уровню, а не только по желаемой дате выпуска.</p>
        <ol className="list-decimal pl-5 space-y-3 leading-7"><li>Передать аттестат за 9 класс и сведения о дальнейшем обучении.</li><li>Согласовать темп, программу и график аттестаций.</li><li>Подготовиться к допуску и государственной аттестации.</li><li>Уточнить место экзаменов и выдачи документа.</li></ol>
        <p className="mt-4 text-sm leading-6 text-slate-600">По программе Синергии ЕГЭ проходит очно в Москве. Условия ускорения и итоговая стоимость определяются до оплаты.</p><a className="inline-block mt-5 font-bold text-[#0369A1] underline" href="#konsultaciya">Сравнить обычный темп и экстернат →</a>
      </section>
    </div>
    <section className="rounded-2xl border border-slate-200 bg-white p-6 sm:p-8 mb-9">
      <h2 className="text-2xl font-bold mb-5">Что сравнить до выбора школы</h2>
      <div className="overflow-x-auto"><table className="w-full text-sm text-left"><thead><tr className="border-b"><th className="p-3">Вопрос</th><th className="p-3">Местная вечерняя школа</th><th className="p-3">Онлайн-программа Синергии</th></tr></thead><tbody>
        <tr className="border-b"><th className="p-3">Посещение</th><td className="p-3">Расписание и очные дни уточняет школа</td><td className="p-3">Материалы в записи и промежуточные аттестации онлайн</td></tr>
        <tr className="border-b"><th className="p-3">Стоимость</th><td className="p-3">Наличие бюджетных мест и платных услуг — у школы</td><td className="p-3">Платный договор, полный расчёт по вашей программе</td></tr>
        <tr className="border-b"><th className="p-3">ОГЭ / ЕГЭ</th><td className="p-3">Принимающая школа подтверждает регистрацию и место</td><td className="p-3">Очно в Москве по указанной программе</td></tr>
        <tr><th className="p-3">Куда обратиться</th><td className="p-3"><Link href="/shkoly/tipy/vechernie/" className="text-blue-800 underline">Каталог и официальные контакты</Link></td><td className="p-3"><a href="#konsultaciya" className="text-blue-800 underline">Консультация по онлайн-программе</a></td></tr>
      </tbody></table></div>
    </section>
    <section id="konsultaciya" className="scroll-mt-28 grid lg:grid-cols-2 gap-7 rounded-3xl bg-[#edf4f5] p-5 sm:p-9 mb-9">
      <div><h2 className="text-2xl sm:text-3xl font-bold mb-5">Какой маршрут подходит вашим документам?</h2><p className="leading-8 mb-5">Оставьте контакты для консультации Синергии по платному онлайн-обучению. Уточните класс и удобное время — это поможет начать разговор с вашей ситуации.</p><ul className="list-disc pl-5 space-y-3 leading-7"><li>Кто принимает на аттестации и выдаёт аттестат.</li><li>Что входит в стоимость, а что оплачивается отдельно.</li><li>Какие документы нужны и когда подавать заявления.</li><li>Подходит ли вам очная поездка на экзамены в Москву.</li></ul><p className="text-sm text-slate-600 leading-6 mt-5">Если аттестат уже получали, но потеряли, сначала уточните выдачу дубликата — повторное обучение может не требоваться.</p></div>
      <LeadForm attestat source="Аттестат взрослому: консультация онлайн /attestat-vzroslomu/" title="Узнать условия для моей ситуации" />
    </section>
    <section className="max-w-4xl mx-auto mb-8"><h2 className="text-2xl font-bold mb-5">Частые вопросы</h2>{faq.map(f => <details key={f.q} className="py-4 border-b border-slate-200"><summary className="cursor-pointer font-semibold">{f.q}</summary><p className="mt-3 leading-7">{f.a}</p></details>)}</section>
    <nav aria-label="Полезные инструкции" className="flex flex-wrap gap-5 text-sm font-semibold text-blue-800 underline"><Link href="/blog/attestat-vzroslomu-9-klass/">Подробно о 9 классе</Link><Link href="/blog/attestat-vzroslomu-11-klass/">Подробно о 10–11 классах</Link><Link href="/blog/eksternat-ili-vechernyaya-shkola/">Экстернат или вечерняя школа</Link><Link href="/blog/vzroslym/">Все инструкции взрослым</Link></nav>
    <p className="mt-7 text-xs leading-6 text-slate-500">Программа и место экзаменов сверены 22.10.2026: <a className="underline" href="https://school-university.com/vechernyaya-shkola/" rel="nofollow">описание вечерней онлайн-программы</a>, <a className="underline" href="https://school-university.com/externat/" rel="nofollow">экстернат</a>. Наличие мест, цены, даты и индивидуальные условия подтверждаются школой перед заключением договора.</p>
  </div>
}
