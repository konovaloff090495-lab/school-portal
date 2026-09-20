import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import {
  regionSlugs, regionLabels, regionLabelsOf, RegionSlug, SchoolType, typeSlugs, typeLabels,
  cityDistricts, getCityDistricts, getCityDistrict, getSchoolsByRegionDistrict, schoolMatchesType,
  MICRO_GEO_SKIP_TYPES,
} from '@/data/schools'
import CatalogClient from '../../../../CatalogClient'
import SeoBlock from '@/components/SeoBlock'
import DistrictLinks from '@/components/DistrictLinks'
import { BreadcrumbJsonLd, SchoolListJsonLd } from '@/lib/schema'
import { TYPE_FULL_NAME } from '@/lib/related-schools'

interface Props {
  params: Promise<{ region: string; district: string; type: string }>
}

// Район × тип — только там, где есть хотя бы 3 школы: тонкие страницы Яндекс выносит как
// малоценные, а спрос вида «частные школы приморского района» есть лишь у крупных пар.
const MIN = 3

function listFor(region: RegionSlug, label: string, type: SchoolType) {
  return getSchoolsByRegionDistrict(region, label).filter(s => schoolMatchesType(s, type))
}

export async function generateStaticParams() {
  const params: { region: string; district: string; type: string }[] = []
  for (const region of Object.keys(cityDistricts) as RegionSlug[]) {
    for (const d of getCityDistricts(region)) {
      for (const type of typeSlugs) {
        if (MICRO_GEO_SKIP_TYPES.includes(type)) continue
        if (listFor(region, d.label, type).length < MIN) continue
        params.push({ region, district: d.slug, type })
      }
    }
  }
  return params
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { region, district, type } = await params
  if (!regionSlugs.includes(region as RegionSlug) || !typeSlugs.includes(type as SchoolType)) return {}
  const r = region as RegionSlug; const t = type as SchoolType
  const d = getCityDistrict(r, district)
  if (!d) return {}
  const count = listFor(r, d.label, t).length
  const typeName = TYPE_FULL_NAME[t] ?? typeLabels[t]
  return {
    title: `${typeName} ${d.gen} ${regionLabelsOf[r]} — ${count} школ с рейтингом и адресами`,
    description: `${typeName} ${d.prep} ${regionLabelsOf[r]}: ${count} школ с адресами, телефонами, рейтингом и отзывами родителей. Выберите школу рядом с домом.`,
    alternates: { canonical: `https://pro-schools.ru/shkoly/${r}/rayon/${district}/${type}/` },
    ...(count < MIN ? { robots: { index: false, follow: true } } : {}),
  }
}

export default async function CityDistrictTypePage({ params }: Props) {
  const { region, district, type } = await params
  if (!regionSlugs.includes(region as RegionSlug) || !typeSlugs.includes(type as SchoolType)) notFound()
  const r = region as RegionSlug; const t = type as SchoolType
  const d = getCityDistrict(r, district)
  if (!d) notFound()
  const list = listFor(r, d.label, t)
  const count = list.length
  if (count === 0) notFound()
  const typeName = TYPE_FULL_NAME[t] ?? typeLabels[t]
  const regionName = regionLabels[r]

  return (
    <>
      <BreadcrumbJsonLd
        items={[
          { name: 'Все школы', href: 'https://pro-schools.ru/shkoly/' },
          { name: regionName, href: `https://pro-schools.ru/shkoly/${r}/` },
          { name: `${d.label} район`, href: `https://pro-schools.ru/shkoly/${r}/rayon/${district}/` },
          { name: typeName },
        ]}
      />
      <SchoolListJsonLd
        schools={list}
        url={`https://pro-schools.ru/shkoly/${r}/rayon/${district}/${type}/`}
        name={`${typeName} ${d.gen} ${regionLabelsOf[r]}`}
      />
      <CatalogClient
        initialRegions={[r]}
        initialTypes={[t]}
        initialDistrict={d.label}
        lockRegion
        lockType
        title={`${typeName} ${d.gen} ${regionLabelsOf[r]}`}
        subtitle={`${count} школ ${d.prep} — адреса, телефоны, рейтинг и отзывы`}
        breadcrumbs={[
          { label: 'Все школы', href: '/shkoly/' },
          { label: regionName, href: `/shkoly/${r}/` },
          { label: `${d.label} район`, href: `/shkoly/${r}/rayon/${district}/` },
          { label: typeName },
        ]}
        seoContent={
          <>
            <SeoBlock region={r} type={t} count={count} district={d.label} locationPrep={`${d.prep} ${regionLabelsOf[r]}`} />
            <DistrictLinks region={r} current={district} type={t} typeName={typeName} />
          </>
        }
      />
    </>
  )
}
