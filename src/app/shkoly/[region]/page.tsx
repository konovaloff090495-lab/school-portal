import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { regionSlugs, regionLabels, regionLabelsIn, getSchoolsByRegion, RegionSlug } from '@/data/schools'
import { buildTitle, buildDescription } from '@/lib/utils'
import CatalogClient from '../CatalogClient'

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
    alternates: { canonical: `https://pro-schools.ru/shkoly/${r}/` },
  }
}

export default async function RegionPage({ params }: Props) {
  const { region } = await params
  if (!regionSlugs.includes(region as RegionSlug)) notFound()
  const r = region as RegionSlug
  const regionName = regionLabels[r]
  const regionIn = regionLabelsIn[r]
  const count = getSchoolsByRegion(r).length

  return (
    <CatalogClient
      initialRegions={[r]}
      lockRegion
      title={`Школы ${regionIn}`}
      subtitle={`${count} школ — государственные, частные, онлайн, вечерние, экстернат`}
      breadcrumbs={[
        { label: 'Все школы', href: '/shkoly/' },
        { label: regionName },
      ]}
    />
  )
}
