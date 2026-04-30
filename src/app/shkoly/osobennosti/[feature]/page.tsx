import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { featureSlugs, featureMetas, getFeatureBySlug, getSchoolsByFeature, FeatureSlug } from '@/data/schools'
import CatalogClient from '../../CatalogClient'

interface Props {
  params: Promise<{ feature: string }>
}

export function generateStaticParams() {
  return featureSlugs.map(feature => ({ feature }))
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { feature } = await params
  const meta = getFeatureBySlug(feature)
  if (!meta) return {}
  const count = getSchoolsByFeature(meta.slug).length
  return {
    title: `${meta.title} — ${count} школ в каталоге | pro-schools.ru`,
    description: meta.description,
    alternates: { canonical: `https://pro-schools.ru/shkoly/osobennosti/${feature}/` },
  }
}

export default async function FeaturePage({ params }: Props) {
  const { feature } = await params
  const meta = getFeatureBySlug(feature)
  if (!meta) notFound()

  const count = getSchoolsByFeature(meta.slug).length

  return (
    <CatalogClient
      featureFilter={meta.slug}
      title={meta.title}
      subtitle={`${count} школ в каталоге`}
      breadcrumbs={[
        { label: 'Все школы', href: '/shkoly/' },
        { label: meta.label },
      ]}
    />
  )
}
