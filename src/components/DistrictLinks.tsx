import Link from 'next/link'
import { RegionSlug, regionLabels, regionLabelsOf, getCityDistricts, getSchoolsByRegionDistrict, schoolMatchesType, SchoolType } from '@/data/schools'

interface Props {
  region: RegionSlug
  current?: string   // slug текущего района — его не линкуем
  type?: SchoolType  // на странице «район × тип» ведём на соседние районы того же типа
  typeName?: string
}

/**
 * Серверный блок «Школы {города} по районам»: ссылки на /shkoly/{region}/rayon/{district}/
 * с числом школ. Ставится на городской странице и на страницах районов — так поисковик
 * видит все районы обычными ссылками, а не только через клиентский фильтр.
 */
export default function DistrictLinks({ region, current, type, typeName }: Props) {
  const districts = getCityDistricts(region)
  if (!districts.length) return null
  const rows = districts
    .map(d => {
      const list = getSchoolsByRegionDistrict(region, d.label)
      const n = type ? list.filter(s => schoolMatchesType(s, type)).length : list.length
      return { ...d, n }
    })
    .filter(d => d.n > 0 && d.slug !== current)
  if (!rows.length) return null
  const title = type
    ? `${typeName ?? 'Школы'} ${regionLabelsOf[region]} по районам`
    : `Школы ${regionLabelsOf[region]} по районам`
  return (
    <section className="mt-8 rounded-2xl border border-gray-200 bg-white p-5 md:p-6">
      <h2 className="text-lg font-bold text-[#0F172A] mb-3">{title}</h2>
      <p className="text-sm text-gray-600 mb-4">
        В каталоге {rows.reduce((a, d) => a + d.n, 0)} школ {regionLabels[region] === 'Санкт-Петербург' ? 'Петербурга' : regionLabelsOf[region]} с указанием района — выберите свой,
        чтобы увидеть школы рядом с домом.
      </p>
      <ul className="grid grid-cols-2 sm:grid-cols-3 gap-x-4 gap-y-2 text-sm">
        {rows.map(d => (
          <li key={d.slug}>
            <Link
              href={type ? `/shkoly/${region}/rayon/${d.slug}/${type}/` : `/shkoly/${region}/rayon/${d.slug}/`}
              className="text-blue-700 hover:underline"
            >
              {d.label} район
            </Link>
            <span className="text-gray-400"> · {d.n}</span>
          </li>
        ))}
      </ul>
    </section>
  )
}
