import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import {
  regionSlugs, regionLabels, regionLabelsOf, RegionSlug,
  cityDistricts, getCityDistricts, getCityDistrict, getSchoolsByRegionDistrict,
} from '@/data/schools'
import CatalogClient from '../../../CatalogClient'
import SeoBlock from '@/components/SeoBlock'
import DistrictLinks from '@/components/DistrictLinks'
import { BreadcrumbJsonLd, SchoolListJsonLd } from '@/lib/schema'

interface Props {
  params: Promise<{ region: string; district: string }>
}

// Районы городов (кроме Москвы — у неё свой роут /shkoly/moskva/rayon/). Страница
// генерится только для районов, где есть хотя бы одна школа с заполненным district.
export async function generateStaticParams() {
  const params: { region: string; district: string }[] = []
  for (const region of Object.keys(cityDistricts) as RegionSlug[]) {
    for (const d of getCityDistricts(region)) {
      if (getSchoolsByRegionDistrict(region, d.label).length === 0) continue
      params.push({ region, district: d.slug })
    }
  }
  return params
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { region, district } = await params
  if (!regionSlugs.includes(region as RegionSlug)) return {}
  const r = region as RegionSlug
  const d = getCityDistrict(r, district)
  if (!d) return {}
  const count = getSchoolsByRegionDistrict(r, d.label).length
  return {
    // Под запрос «школы приморского района санкт петербурга» (Вордстат: 11,8 тыс./мес):
    // ключ впереди, число школ и «рейтинг, адреса» — в хвосте.
    title: `Школы ${d.gen} ${regionLabelsOf[r]} — список ${count} школ с рейтингом и адресами`,
    description: `Все школы ${d.prep} ${regionLabelsOf[r]} в одном списке: ${count} государственных, частных, гимназий и лицеев — рейтинг, адреса, телефоны, профили обучения и отзывы родителей.`,
    alternates: { canonical: `https://pro-schools.ru/shkoly/${r}/rayon/${district}/` },
    ...(count < 3 ? { robots: { index: false, follow: true } } : {}),
  }
}

export default async function CityDistrictPage({ params }: Props) {
  const { region, district } = await params
  if (!regionSlugs.includes(region as RegionSlug)) notFound()
  const r = region as RegionSlug
  const d = getCityDistrict(r, district)
  if (!d) notFound()
  const list = getSchoolsByRegionDistrict(r, d.label)
  const count = list.length
  const regionName = regionLabels[r]

  return (
    <>
      <BreadcrumbJsonLd
        items={[
          { name: 'Все школы', href: 'https://pro-schools.ru/shkoly/' },
          { name: regionName, href: `https://pro-schools.ru/shkoly/${r}/` },
          { name: `${d.label} ${d.kind ?? 'район'}` },
        ]}
      />
      <SchoolListJsonLd
        schools={list}
        url={`https://pro-schools.ru/shkoly/${r}/rayon/${district}/`}
        name={`Школы ${d.gen} ${regionLabelsOf[r]}`}
      />
      <CatalogClient
        initialRegions={[r]}
        initialDistrict={d.label}
        lockRegion
        title={`Школы ${d.gen} ${regionLabelsOf[r]}`}
        subtitle={`${count} школ ${d.prep}: государственные, частные, гимназии и лицеи — с адресами и рейтингом`}
        breadcrumbs={[
          { label: 'Все школы', href: '/shkoly/' },
          { label: regionName, href: `/shkoly/${r}/` },
          { label: `${d.label} ${d.kind ?? 'район'}` },
        ]}
        seoContent={
          <>
            <SeoBlock region={r} count={count} district={d.label} locationPrep={`${d.prep} ${regionLabelsOf[r]}`} />
            <DistrictLinks region={r} current={district} />
          </>
        }
      />
    </>
  )
}
