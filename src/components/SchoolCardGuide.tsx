import type { SchoolCardGuide as Guide } from '@/lib/school-card-guide'

/** Source-backed details stay server rendered; no extra step is added to the lead form. */
export default function SchoolCardGuide({ guide }: { guide: Guide }) {
  return <section id="usloviya-priema" data-school-card-guide className="scroll-mt-32 rounded-xl border border-gray-200 bg-white p-5 sm:p-6">
    <div className="flex flex-wrap items-center justify-between gap-2 mb-5">
      <h2 className="text-xl font-bold text-gray-900">Обучение и поступление</h2>
      <span className="text-xs text-gray-500">Проверка источников: {guide.checkedAt}</span>
    </div>
    <dl className="space-y-5">
      {guide.facts.map(fact => <div key={fact.title}>
        <dt className="text-base font-semibold text-gray-900 mb-1">{fact.title}</dt>
        <dd className="text-sm leading-6 text-gray-700">{fact.text}</dd>
      </div>)}
    </dl>
    <div className="mt-6 border-t border-gray-100 pt-5">
      <h3 className="font-semibold text-gray-900 mb-3">С чего начать</h3>
      <ol className="space-y-3">
        {guide.steps.map((step, index) => <li key={step} className="flex gap-3 text-sm leading-6 text-gray-700">
          <span aria-hidden="true" className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-sky-50 text-xs font-bold text-[#0369A1]">{index + 1}</span>
          <span>{step}</span>
        </li>)}
      </ol>
    </div>
    {guide.contact && <div className="mt-6 rounded-xl border border-sky-100 bg-sky-50 p-4">
      <h3 className="font-semibold text-gray-900">{guide.contact.title}</h3>
      <p className="mt-1 text-sm leading-6 text-gray-700">{guide.contact.text}</p>
      <a href={`tel:${guide.contact.phone}`} className="mt-3 inline-flex min-h-11 items-center font-semibold text-sm text-[#0369A1] underline underline-offset-4">{guide.contact.label}</a>
    </div>}
    <div className="mt-6 border-t border-gray-100 pt-4">
      <p className="text-xs font-semibold text-gray-500 mb-2">{guide.status === 'official' ? 'Официальные источники' : 'Источники и проверенный маршрут'}</p>
      <ul className="space-y-2">{guide.sources.map(source => <li key={source.url}>
        <a href={source.url} target="_blank" rel="noopener noreferrer" className="inline-block py-1 text-sm leading-6 text-[#0369A1] underline underline-offset-4 break-words">{source.label} ↗</a>
      </li>)}</ul>
    </div>
    <div className="mt-5 border-t border-gray-100 pt-4 flex flex-wrap gap-x-5 gap-y-2 text-sm">
      <a href="#school-card-form" className="inline-flex min-h-11 items-center font-semibold text-[#0369A1]">Консультация по онлайн-обучению →</a>
      <a href="#kontakty" className="inline-flex min-h-11 items-center text-gray-600 underline underline-offset-4">Все контакты</a>
    </div>
  </section>
}
