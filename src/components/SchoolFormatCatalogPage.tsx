import CatalogClient from '@/app/shkoly/CatalogClient'
import { getSchoolsByType, type SchoolType } from '@/data/schools'
import { explicitSchoolGrades } from '@/lib/school-grades'
import { hasConfirmedFreePrice } from '@/lib/school-price'
import formatPages from '@/data/school-format-catalog-pages.json'
import Link from 'next/link'

export function getSchoolFormatPage(path: string) {
  return formatPages.find(p => p.path === path)
}

export default function SchoolFormatCatalogPage({ path }: { path: string }) {
  const page = getSchoolFormatPage(path)!
  const type = page.type as SchoolType
  const selected = getSchoolsByType(type).filter(s =>
    (!page.grades.length || page.grades.every(g => explicitSchoolGrades(s.grades).includes(g))) &&
    (!page.freeOnly || hasConfirmedFreePrice(s)) &&
    (!page.onlineOnly || s.remoteOnly || s.features.some(f => /онлайн|дистанцион/i.test(f)))
  )
  return <CatalogClient initialTypes={[type]} lockType allowedSchoolSlugs={selected.map(s => s.slug)}
    introContent={<p className="max-w-4xl mx-auto text-lg leading-8">{page.intro}</p>}
    title={page.h1} subtitle={`${selected.length} карточек по указанным в каталоге параметрам. Программу и текущий приём подтвердите у школы.`}
    breadcrumbs={[{ label: 'Все школы', href: '/shkoly/' }, { label: page.parentLabel, href: `/shkoly/tipy/${type}/` }, { label: page.shortLabel }]}
    seoContent={<div className="max-w-4xl mx-auto space-y-7 pb-8">
      {page.sections.map(s => <section key={s.h}><h2 className="text-2xl font-bold mb-3">{s.h}</h2>{s.p.map(p => <p className="leading-7 mb-3" key={p}>{p}</p>)}</section>)}
      <section><h2 className="text-2xl font-bold mb-3">Вопросы перед поступлением</h2><ul className="list-disc pl-6 space-y-2 leading-7"><li>Принимает ли школа сейчас учеников вашего класса и возраста?</li><li>Какая форма и программа будут указаны в документах; кто оформляет зачисление и аттестации?</li><li>Что проходит дистанционно, а где требуется присутствие? Как устроены консультации и пересдачи?</li><li>Какова полная стоимость: уроки, сопровождение, материалы, прикрепление? Отсутствие цены в карточке не означает бесплатный приём.</li></ul></section>
      <nav aria-label="Инструкции по выбранному формату" className="flex flex-wrap gap-4">{page.links.map(l => <Link key={l.url} className="text-blue-800 underline" href={l.url}>{l.label}</Link>)}</nav>
      <p className="text-sm text-slate-600">Карточки отобраны по указанным параметрам; сведения не заменяют подтверждение приёма на текущий учебный год. Условия проверяются в договоре и локальных актах организации. Государственные экзамены не являются домашними тестами платформы.</p>
    </div>} />
}
