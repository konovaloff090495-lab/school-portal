import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { regionSlugs, regionLabels, regionLabelsIn, RegionSlug, schools } from '@/data/schools'
import CatalogClient from '../../../CatalogClient'
import SeoBlock from '@/components/SeoBlock'
import RelatedSchools from '@/components/RelatedSchools'
import { relatedForRegionProfile } from '@/lib/related-schools'
import { detectProfile } from '@/lib/school-profiles'

interface Props {
  params: Promise<{ region: string; profile: string }>
}

// Профили — единый источник в src/data/region-profiles.ts (используется и в sitemap.ts)
import { REGION_PROFILES as PROFILES, regionProfileIds as profileIds, type RegionProfileId as ProfileId } from '@/data/region-profiles'

export async function generateStaticParams() {
  const params: { region: string; profile: string }[] = []
  for (const region of regionSlugs) {
    for (const profile of profileIds) {
      params.push({ region, profile })
    }
  }
  return params
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { region, profile } = await params
  if (!regionSlugs.includes(region as RegionSlug)) return {}
  if (!profileIds.includes(profile as ProfileId)) return {}

  const r = region as RegionSlug
  const p = PROFILES.find(x => x.id === profile)!
  const regionName = regionLabels[r]
  const regionIn = regionLabelsIn[r]

  return {
    title: `${p.title} ${regionIn} — каталог | pro-schools.ru`,
    description: `${p.title} ${regionIn}: адреса, телефоны, рейтинги. Найдите лучшую профильную школу для вашего ребёнка в ${regionName}.`,
    alternates: { canonical: `https://pro-schools.ru/shkoly/${r}/profilnye/${profile}/` },
  }
}

export default async function RegionProfilePage({ params }: Props) {
  const { region, profile } = await params
  if (!regionSlugs.includes(region as RegionSlug)) notFound()
  if (!profileIds.includes(profile as ProfileId)) notFound()

  const r = region as RegionSlug
  const p = PROFILES.find(x => x.id === profile)!
  const regionName = regionLabels[r]
  const regionIn = regionLabelsIn[r]

  const count = schools.filter(
    s => s.region === r && s.type === 'profilnye' && detectProfile(s) === profile,
  ).length
  const related = count === 0 ? relatedForRegionProfile(r, profile, p.label) : null

  return (
    <CatalogClient
      initialRegions={[r]}
      initialTypes={['profilnye']}
      initialProfile={profile}
      emptyFallback={related ? <RelatedSchools block={related} /> : undefined}
      lockRegion
      lockType
      lockProfile
      title={`${p.title} ${regionIn}`}
      subtitle={`Профильные школы — ${p.label}`}
      breadcrumbs={[
        { label: 'Все школы',        href: '/shkoly/' },
        { label: regionName,         href: `/shkoly/${r}/` },
        { label: 'Профильные школы', href: `/shkoly/${r}/profilnye/` },
        { label: p.label },
      ]}
      seoContent={<SeoBlock region={r} type="profilnye" count={0} />}
    />
  )
}
