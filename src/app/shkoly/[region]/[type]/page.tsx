import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import {
  regionSlugs, regionLabels, regionLabelsIn, typeSlugs, typeLabels,
  getSchoolsByRegionAndType, RegionSlug, SchoolType,
} from '@/data/schools'
import { buildTitle, buildDescription, buildKeywords } from '@/lib/utils'
import CatalogClient from '../../CatalogClient'
import SeoBlock from '@/components/SeoBlock'
import { BreadcrumbJsonLd, SchoolListJsonLd } from '@/lib/schema'

interface Props {
  params: Promise<{ region: string; type: string }>
}

export async function generateStaticParams() {
  const params: { region: string; type: string }[] = []
  for (const region of regionSlugs) {
    for (const type of typeSlugs) {
      params.push({ region, type })
    }
  }
  return params
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { region, type } = await params
  if (!regionSlugs.includes(region as RegionSlug)) return {}
  if (!typeSlugs.includes(type as SchoolType)) return {}
  const r = region as RegionSlug
  const t = type as SchoolType
  const list = getSchoolsByRegionAndType(r, t)
  const tooFew = list.length < 3
  return {
    title: buildTitle(r, t, undefined, list.length),
    description: buildDescription(r, t, undefined, list.length),
    keywords: buildKeywords(r, t),
    alternates: { canonical: `https://pro-schools.ru/shkoly/${r}/${t}/` },
    ...(tooFew ? { robots: { index: false, follow: true } } : {}),
  }
}

export default async function TypePage({ params }: Props) {
  const { region, type } = await params
  if (!regionSlugs.includes(region as RegionSlug)) notFound()
  if (!typeSlugs.includes(type as SchoolType)) notFound()

  const r = region as RegionSlug
  const t = type as SchoolType
  const regionName = regionLabels[r]
  const regionIn = regionLabelsIn[r]
  const typeName = typeLabels[t]
  const list = getSchoolsByRegionAndType(r, t)

  // Правильные русские названия для H1
  const pageTitleMap: Partial<Record<SchoolType, string>> = {
    gimnazii:     'Гимназии',
    eksternal:    'Школы-экстернаты',
    'pri-vuzakh': 'Школы при вузах',
  }
  const pageTitle = pageTitleMap[t]
    ? `${pageTitleMap[t]} ${regionIn}`
    : `${typeName} школы ${regionIn}`

  return (
    <>
      <BreadcrumbJsonLd
        items={[
          { name: 'Все школы', href: 'https://pro-schools.ru/shkoly/' },
          { name: regionName, href: `https://pro-schools.ru/shkoly/${r}/` },
          { name: typeName },
        ]}
      />
      <SchoolListJsonLd
        schools={list}
        url={`https://pro-schools.ru/shkoly/${r}/${t}/`}
        name={pageTitle}
      />
      <CatalogClient
        initialRegions={[r]}
        initialTypes={[t]}
        lockRegion
        lockType
        title={pageTitle}
        subtitle={`${list.length} школ в каталоге`}
        breadcrumbs={[
          { label: 'Все школы', href: '/shkoly/' },
          { label: regionName, href: `/shkoly/${r}/` },
          { label: typeName },
        ]}
        seoContent={<SeoBlock region={r} type={t} count={list.length} />}
      />
    </>
  )
}
