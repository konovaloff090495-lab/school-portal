import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import {
  regionSlugs, regionLabels, regionLabelsOf, regionLabelsIn, RegionSlug, School,
  getSchoolsByRegion, getCityDistricts, typeLabels,
} from '@/data/schools'
import { BreadcrumbJsonLd, SchoolListJsonLd } from '@/lib/schema'

interface Props {
  params: Promise<{ region: string }>
}

// Страница под интент «адреса школ {город}» / «список школ {город}» — 145 тыс. + 16 тыс.
// показов/мес по 40 городам (Вордстат, 20.09.2026). Городская страница каталога отдаёт
// серверу только первую порцию карточек; здесь — полный список всех школ города одной
// таблицей: название, адрес, телефон, тип, район (где есть).
export const revalidate = 86400

export async function generateStaticParams() {
  return regionSlugs.map(region => ({ region }))
}

// «Школа № 5» раньше «Школа № 12»: сортируем по числу в названии, затем по алфавиту.
function numKey(name: string): [number, string] {
  const m = name.match(/№\s*(\d+)/) ?? name.match(/\b(\d{1,4})\b/)
  return [m ? parseInt(m[1], 10) : 1e9, name.toLowerCase()]
}
function sortSchools(list: School[]): School[] {
  return [...list].sort((a, b) => {
    const [na, sa] = numKey(a.name); const [nb, sb] = numKey(b.name)
    return na - nb || sa.localeCompare(sb, 'ru')
  })
}
function hasStreet(s: School): boolean {
  return /\d/.test(s.address) && !/^г\.\s/.test(s.address.trim())
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { region } = await params
  if (!regionSlugs.includes(region as RegionSlug)) return {}
  const r = region as RegionSlug
  const list = getSchoolsByRegion(r)
  const count = list.length
  const withPhone = list.filter(s => s.phone).length
  return {
    title: `Адреса школ ${regionLabelsOf[r]} — список всех ${count} школ с телефонами`,
    description: `Полный список школ ${regionLabelsOf[r]}: ${count} школ с адресами${withPhone ? `, ${withPhone} — с телефонами` : ''}, типом и районом. Государственные, частные, гимназии, лицеи, вечерние и коррекционные — в одной таблице.`,
    alternates: { canonical: `https://pro-schools.ru/shkoly/${r}/adresa/` },
    ...(count < 3 ? { robots: { index: false, follow: true } } : {}),
  }
}

export default async function AddressesPage({ params }: Props) {
  const { region } = await params
  if (!regionSlugs.includes(region as RegionSlug)) notFound()
  const r = region as RegionSlug
  const regionName = regionLabels[r]
  const all = getSchoolsByRegion(r)
  const count = all.length
  const districts = getCityDistricts(r)
  const hasDistricts = districts.length > 0 && all.some(s => s.district)
  const withStreet = all.filter(hasStreet).length
  const withPhone = all.filter(s => s.phone).length

  // Группировка: по районам (если заполнены), иначе один общий список
  const groups: { title: string; href?: string; items: School[] }[] = []
  if (hasDistricts) {
    for (const d of districts) {
      const items = sortSchools(all.filter(s => s.district === d.label))
      if (items.length) groups.push({ title: `${d.label} район`, href: `/shkoly/${r}/rayon/${d.slug}/`, items })
    }
    const rest = sortSchools(all.filter(s => !s.district || !districts.some(d => d.label === s.district)))
    if (rest.length) groups.push({ title: 'Район не указан', items: rest })
  } else {
    groups.push({ title: `Все школы ${regionLabelsOf[r]}`, items: sortSchools(all) })
  }

  return (
    <div className="max-w-6xl mx-auto px-4 py-6">
      <BreadcrumbJsonLd
        items={[
          { name: 'Все школы', href: 'https://pro-schools.ru/shkoly/' },
          { name: regionName, href: `https://pro-schools.ru/shkoly/${r}/` },
          { name: 'Адреса школ' },
        ]}
      />
      <SchoolListJsonLd schools={all} url={`https://pro-schools.ru/shkoly/${r}/adresa/`} name={`Адреса школ ${regionLabelsOf[r]}`} />

      <nav className="text-sm text-gray-500 mb-3">
        <Link href="/shkoly/" className="hover:underline">Все школы</Link> / <Link href={`/shkoly/${r}/`} className="hover:underline">{regionName}</Link> / <span className="text-gray-700">Адреса школ</span>
      </nav>
      <h1 className="text-3xl font-bold text-[#0F172A] mb-2">Адреса школ {regionLabelsOf[r]}</h1>
      <p className="text-gray-700 mb-4">
        В {regionLabelsIn[r]} в каталоге <strong>{count} школ</strong>{withStreet < count ? `, у ${withStreet} указан точный адрес` : ''}{withPhone ? `, у ${withPhone} — телефон` : ''}.
        {hasDistricts ? ' Список сгруппирован по районам; ' : ' '}
        нажмите на название, чтобы открыть карточку школы с описанием, отзывами и формой записи.
        Подобрать школу по типу, стоимости и рейтингу — в <Link href={`/shkoly/${r}/`} className="text-blue-700 hover:underline">каталоге школ {regionLabelsOf[r]}</Link>.
      </p>

      {hasDistricts && (
        <p className="text-sm text-gray-600 mb-6">
          Районы: {groups.filter(g => g.href).map((g, i) => (
            <span key={g.title}>{i > 0 && ' · '}<a href={`#${g.href!.split('/').filter(Boolean).pop()}`} className="text-blue-700 hover:underline">{g.title}</a> ({g.items.length})</span>
          ))}
        </p>
      )}

      {groups.map(g => (
        <section key={g.title} id={g.href ? g.href.split('/').filter(Boolean).pop() : undefined} className="mb-8">
          <h2 className="text-xl font-bold text-[#0F172A] mb-3">
            {g.href ? <Link href={g.href} className="hover:underline">{g.title}</Link> : g.title}
            <span className="text-gray-400 font-normal text-base"> · {g.items.length}</span>
          </h2>
          <div className="overflow-x-auto rounded-xl border border-gray-200">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 text-left text-gray-600">
                <tr>
                  <th className="px-3 py-2 font-semibold">Школа</th>
                  <th className="px-3 py-2 font-semibold">Адрес</th>
                  <th className="px-3 py-2 font-semibold">Телефон</th>
                  <th className="px-3 py-2 font-semibold">Тип</th>
                </tr>
              </thead>
              <tbody>
                {g.items.map(s => (
                  <tr key={s.id} className="border-t border-gray-100 align-top">
                    <td className="px-3 py-2"><Link href={`/shkola/${s.slug}/`} className="text-blue-700 hover:underline">{s.name}</Link></td>
                    <td className="px-3 py-2 text-gray-700">{hasStreet(s) ? s.address : '—'}{s.metro ? <span className="text-gray-400"> · м. {s.metro}</span> : null}</td>
                    <td className="px-3 py-2 text-gray-700 whitespace-nowrap">{s.phone || '—'}</td>
                    <td className="px-3 py-2 text-gray-500"><Link href={`/shkoly/${r}/${s.type}/`} className="hover:underline">{typeLabels[s.type]}</Link></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      ))}
    </div>
  )
}
