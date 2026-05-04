import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import {
  regionSlugs, regionLabels, regionLabelsIn,
  featureSlugs, featureMetas, getFeatureBySlug, getSchoolsByFeature,
  RegionSlug, FeatureSlug,
} from '@/data/schools'
import CatalogClient from '../../../CatalogClient'

interface Props {
  params: Promise<{ region: string; feature: string }>
}

// Skip features that already have dedicated regional routes
const SKIP_FEATURES: FeatureSlug[] = ['podgotovka-k-ege', 'podgotovka-k-oge', 'it-klass']

export function generateStaticParams() {
  const params: { region: string; feature: string }[] = []
  for (const region of regionSlugs) {
    for (const feature of featureSlugs) {
      if (SKIP_FEATURES.includes(feature)) continue
      params.push({ region, feature })
    }
  }
  return params
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { region, feature } = await params
  if (!regionSlugs.includes(region as RegionSlug)) return {}
  if (!featureSlugs.includes(feature as FeatureSlug)) return {}
  if (SKIP_FEATURES.includes(feature as FeatureSlug)) return {}

  const r = region as RegionSlug
  const f = feature as FeatureSlug
  const meta = getFeatureBySlug(f)!
  const regionIn = regionLabelsIn[r]
  const count = getSchoolsByFeature(f, r).length
  const title = `${meta.title} ${regionIn} — ${count} школ | pro-schools.ru`
  const description = `${meta.description.replace(/\.$/, '')} ${regionIn}. Адреса, телефоны, отзывы.`

  return {
    title,
    description,
    alternates: { canonical: `https://pro-schools.ru/shkoly/${r}/osobennosti/${f}/` },
    openGraph: { title, description, url: `https://pro-schools.ru/shkoly/${r}/osobennosti/${f}/` },
  }
}

export default async function RegionFeaturePage({ params }: Props) {
  const { region, feature } = await params
  if (!regionSlugs.includes(region as RegionSlug)) notFound()
  if (!featureSlugs.includes(feature as FeatureSlug)) notFound()
  if (SKIP_FEATURES.includes(feature as FeatureSlug)) notFound()

  const r = region as RegionSlug
  const f = feature as FeatureSlug
  const meta = getFeatureBySlug(f)!
  const regionName = regionLabels[r]
  const regionIn = regionLabelsIn[r]
  const count = getSchoolsByFeature(f, r).length

  return (
    <CatalogClient
      initialRegions={[r]}
      lockRegion
      featureFilter={f}
      title={`${meta.title} ${regionIn}`}
      subtitle={
        count > 0
          ? `${count} ${count === 1 ? 'школа' : count < 5 ? 'школы' : 'школ'} в ${regionName}`
          : 'Школ пока нет — скоро добавим'
      }
      breadcrumbs={[
        { label: 'Все школы', href: '/shkoly/' },
        { label: regionName, href: `/shkoly/${r}/` },
        { label: meta.label },
      ]}
    />
  )
}
