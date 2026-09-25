import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { regionSlugs, regionLabels, regionLabelsIn, regionLabelsOf, getSchoolsByRegion, RegionSlug } from '@/data/schools'
import { buildTitle, buildDescription, buildKeywords } from '@/lib/utils'
import CatalogClient from '../CatalogClient'
import SeoBlock from '@/components/SeoBlock'
import DistrictLinks from '@/components/DistrictLinks'
import { raexRegions } from '@/data/raex'
import { BreadcrumbJsonLd, SchoolListJsonLd } from '@/lib/schema'

interface Props {
  params: Promise<{ region: string }>
}

export async function generateStaticParams() {
  return regionSlugs.map(region => ({ region }))
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { region } = await params
  if (!regionSlugs.includes(region as RegionSlug)) return {}
  const r = region as RegionSlug
  const count = getSchoolsByRegion(r).length
  return {
    title: buildTitle(r, undefined, undefined, count),
    description: buildDescription(r, undefined, undefined, count),
    keywords: buildKeywords(r),
    alternates: { canonical: `https://pro-schools.ru/shkoly/${r}/` },
    ...(count < 3 ? { robots: { index: false, follow: true } } : {}),
  }
}

export default async function RegionPage({ params }: Props) {
  const { region } = await params
  if (!regionSlugs.includes(region as RegionSlug)) notFound()
  const r = region as RegionSlug
  const regionName = regionLabels[r]
  const regionIn = regionLabelsIn[r]
  const list = getSchoolsByRegion(r)
  const count = list.length
  const hasRating = raexRegions([r]).length > 0

  return (
    <>
      <BreadcrumbJsonLd
        items={[
          { name: 'Все школы', href: 'https://pro-schools.ru/shkoly/' },
          { name: regionName },
        ]}
      />
      <SchoolListJsonLd
        schools={list}
        url={`https://pro-schools.ru/shkoly/${r}/`}
        name={`Школы ${regionIn}`}
      />
      <CatalogClient
        initialRegions={[r]}
        lockRegion
        title={`Школы ${regionIn}`}
        subtitle={`${count} школ — государственные, частные, онлайн, вечерние, экстернат`}
        breadcrumbs={[
          { label: 'Все школы', href: '/shkoly/' },
          { label: regionName },
        ]}
        seoContent={<>
          <SeoBlock region={r} count={count} />
          <DistrictLinks region={r} />
          <p className="mt-6 text-sm text-gray-700">
            Нужен полный список? <a href={`/shkoly/${r}/adresa/`} className="text-blue-700 hover:underline">Адреса и телефоны всех {count} школ {regionLabelsOf[r]}</a> одной таблицей.
            {hasRating && <> Лучшие по результатам выпускников — в <a href={`/shkoly/${r}/reyting/`} className="text-blue-700 hover:underline">рейтинге школ {regionLabelsOf[r]} по данным RAEX</a>.</>}
          </p>
        </>}
      />
    </>
  )
}
