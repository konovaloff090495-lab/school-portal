import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { regionSlugs, regionLabels, regionLabelsOf, regionLabelsIn, RegionSlug, typeLabels, getCityDistricts } from '@/data/schools'
import { getRaexForRegion, raexRegions, RAEX_YEAR, RAEX_LIST_TITLE, CityRaex } from '@/data/raex'
import { BreadcrumbJsonLd, SchoolListJsonLd } from '@/lib/schema'

interface Props { params: Promise<{ region: string }> }

// Под интент «рейтинг школ {город}» / «лучшие школы {город}» (Вордстат: 30 + 24 тыс./мес по 40
// городам; в Google мы на 9–11 с одной статьёй про Москву). Данные — только RAEX 2026 с указанием
// источника; своих оценок не выставляем (выдуманные рейтинги вычищали в июле 2026).
export const revalidate = 86400

export async function generateStaticParams() {
  return raexRegions(regionSlugs).map(region => ({ region }))
}

function uniqueCount(d: CityRaex): number {
  return new Set([...d.scale, ...d.compete].map(x => x.row.name)).size
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { region } = await params
  if (!regionSlugs.includes(region as RegionSlug)) return {}
  const r = region as RegionSlug
  const d = getRaexForRegion(r)
  if (!d) return {}
  const n = uniqueCount(d)
  return {
    title: `Рейтинг школ ${regionLabelsOf[r]} ${RAEX_YEAR} — ${n} лучших школ по данным RAEX`,
    description: `Лучшие школы ${regionLabelsOf[r]} по рейтингу RAEX ${RAEX_YEAR}: ${n} школ, чьи выпускники поступают в ведущие вузы России. Позиции в двух списках, адреса, районы и ссылки на карточки школ.`,
    alternates: { canonical: `https://pro-schools.ru/shkoly/${r}/reyting/` },
    ...(n < 5 ? { robots: { index: false, follow: true } } : {}),
  }
}

export default async function RatingPage({ params }: Props) {
  const { region } = await params
  if (!regionSlugs.includes(region as RegionSlug)) notFound()
  const r = region as RegionSlug
  const d = getRaexForRegion(r)
  if (!d) notFound()
  const regionName = regionLabels[r]
  const n = uniqueCount(d)
  const matched = [...d.scale, ...d.compete].map(x => x.school).filter((s): s is NonNullable<typeof s> => !!s)
  const uniqMatched = matched.filter((s, i) => matched.findIndex(t => t.id === s.id) === i)
  const districts = getCityDistricts(r)

  const Table = ({ items, title, source }: { items: CityRaex['scale']; title: string; source?: string }) => items.length ? (
    <section className="mb-8">
      <h2 className="text-xl font-bold text-[#0F172A] mb-1">{title}</h2>
      {source && <p className="text-xs text-gray-500 mb-3">Источник: <a href={source} rel="nofollow noopener" target="_blank" className="underline">RAEX, рейтинг {d.regionTitle}, {RAEX_YEAR}</a></p>}
      <div className="overflow-x-auto rounded-xl border border-gray-200">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 text-left text-gray-600"><tr>
            <th className="px-3 py-2 font-semibold w-12">Место</th><th className="px-3 py-2 font-semibold">Школа</th><th className="px-3 py-2 font-semibold">Адрес</th><th className="px-3 py-2 font-semibold">Тип</th>
          </tr></thead>
          <tbody>
            {items.map(({ row, school }) => (
              <tr key={row.list + row.rank} className="border-t border-gray-100 align-top">
                <td className="px-3 py-2 font-semibold text-[#0F172A]">{row.rank}</td>
                <td className="px-3 py-2">{school ? <Link href={`/shkola/${school.slug}/`} className="text-blue-700 hover:underline">{school.name}</Link> : row.name}</td>
                <td className="px-3 py-2 text-gray-700">{school && /\d/.test(school.address) ? school.address : '—'}{school?.district && districts.length ? <span className="text-gray-400"> · {school.district} {districts.find(x => x.label === school.district)?.kind ?? 'район'}</span> : null}</td>
                <td className="px-3 py-2 text-gray-500">{school ? <Link href={`/shkoly/${r}/${school.type}/`} className="hover:underline">{typeLabels[school.type]}</Link> : '—'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  ) : null

  return (
    <div className="max-w-6xl mx-auto px-4 py-6">
      <BreadcrumbJsonLd items={[
        { name: 'Все школы', href: 'https://pro-schools.ru/shkoly/' },
        { name: regionName, href: `https://pro-schools.ru/shkoly/${r}/` },
        { name: 'Рейтинг школ' },
      ]} />
      {uniqMatched.length > 0 && <SchoolListJsonLd schools={uniqMatched} url={`https://pro-schools.ru/shkoly/${r}/reyting/`} name={`Рейтинг школ ${regionLabelsOf[r]} ${RAEX_YEAR}`} />}
      <nav className="text-sm text-gray-500 mb-3">
        <Link href="/shkoly/" className="hover:underline">Все школы</Link> / <Link href={`/shkoly/${r}/`} className="hover:underline">{regionName}</Link> / <span className="text-gray-700">Рейтинг школ</span>
      </nav>
      <h1 className="text-3xl font-bold text-[#0F172A] mb-2">Рейтинг школ {regionLabelsOf[r]} {RAEX_YEAR}</h1>
      <p className="text-gray-700 mb-3">
        <strong>{n} школ {regionLabelsOf[r]}</strong> вошли в рейтинги RAEX {RAEX_YEAR} по {d.regionTitle}: это школы, чьи выпускники поступают в ведущие вузы страны.
        Рейтинг составляет агентство RAEX по данным приёмных кампаний вузов; мы приводим позиции без изменений и добавляем адрес, район и ссылку на карточку школы в каталоге.
      </p>
      <p className="text-sm text-gray-600 mb-6">
        Два списка отвечают на разные вопросы. <strong>«По числу выпускников»</strong> — сколько выпускников школы поступило в ведущие вузы (крупные школы здесь в плюсе).
        <strong> «Конкурентоспособность»</strong> — какая доля выпускников поступила (важнее для небольших сильных школ). Школа может стоять высоко в одном списке и отсутствовать в другом.
      </p>
      <Table items={d.scale} title={RAEX_LIST_TITLE.scale} source={d.sourceScale} />
      <Table items={d.compete} title={RAEX_LIST_TITLE.compete} source={d.sourceCompete} />
      <section className="mt-6 text-sm text-gray-700 space-y-2">
        <h2 className="text-lg font-bold text-[#0F172A]">Как пользоваться рейтингом</h2>
        <p>Позиция в рейтинге говорит о результатах выпускников, а не об условиях для конкретного ребёнка: в сильный лицей часто набирают по конкурсу с 5 или 7 класса, и не каждому подходит нагрузка. Проверьте на карточке школы профиль, ступени обучения, стоимость (для частных) и отзывы, а расположение — в разделе <Link href={`/shkoly/${r}/adresa/`} className="text-blue-700 hover:underline">адреса школ {regionLabelsOf[r]}</Link>.</p>
        <p>Все {regionLabelsIn[r]} школы с фильтрами по типу, району и рейтингу отзывов — в <Link href={`/shkoly/${r}/`} className="text-blue-700 hover:underline">каталоге школ {regionLabelsOf[r]}</Link>.</p>
      </section>
    </div>
  )
}
