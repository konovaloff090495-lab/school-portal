import Link from 'next/link'
import admissions from '@/data/evening-admissions-verified.json'

export default function EveningVerifiedAdmissions({ region }: { region?: string }) {
  const rows = admissions.filter(r => !region || r.region === region)
  if (!rows.length) return null
  return <section id="proverennyj-priem" data-verified-admissions className="scroll-mt-40 rounded-2xl border border-slate-200 bg-white p-5 sm:p-7 mb-7">
    <h2 className="text-xl sm:text-2xl font-bold mb-3">Приём: что удалось проверить по официальным объявлениям</h2>
    <p className="text-sm leading-6 text-slate-600 mb-5">Это сведения из объявлений на 2026 год, а не подтверждение оставшихся мест или бесплатного приёма. Обращайтесь непосредственно в центр.</p>
    <div className="space-y-6">{rows.map(r => <article key={r.slug} className="border-t border-slate-200 pt-5">
      <h3 className="text-xl font-bold mb-2"><Link href={`/shkola/${r.slug}/`} className="text-blue-800 underline">{r.name}</Link></h3>
      <p className="text-sm text-slate-600 mb-4">{r.address} · классы {r.grades}</p>
      <dl className="grid sm:grid-cols-[9rem_1fr] gap-x-5 gap-y-3 text-sm leading-6">
        <dt className="font-semibold">Обучение</dt><dd>{r.format}</dd><dt className="font-semibold">Документы</dt><dd>{r.documents}</dd><dt className="font-semibold">Обращение</dt><dd><p>{r.contact}</p><a href={`tel:${r.phone}`} className="text-blue-800 underline">Позвонить в приёмную: {r.phone}</a><p>{r.hours}</p></dd><dt className="font-semibold">Что уточнить</dt><dd>{r.unknown}</dd>
      </dl>
      <p className="mt-4 text-xs leading-6 text-slate-600"><a className="text-blue-800 underline" href={r.source}>Официальное объявление от {r.sourceDate}</a>. Сверено {r.checkedAt}.</p>
    </article>)}</div>
  </section>
}
