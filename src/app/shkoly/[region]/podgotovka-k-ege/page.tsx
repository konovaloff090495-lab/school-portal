import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import {
  regionSlugs, regionLabels, regionLabelsIn,
  getSchoolsByFeature, RegionSlug,
} from '@/data/schools'
import CatalogClient from '../../CatalogClient'
import SeoBlock from '@/components/SeoBlock'

interface Props {
  params: Promise<{ region: string }>
}

export function generateStaticParams() {
  return regionSlugs.map(region => ({ region }))
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { region } = await params
  if (!regionSlugs.includes(region as RegionSlug)) return {}
  const r = region as RegionSlug
  const regionIn = regionLabelsIn[r]
  const count = getSchoolsByFeature('podgotovka-k-ege', r).length
  const title = `Подготовка к ЕГЭ ${regionIn} — ${count} школ | pro-schools.ru`
  const description = `Школы с подготовкой к ЕГЭ ${regionIn}: профильные классы, интенсивы, авторские программы. Адреса, телефоны, отзывы родителей.`
  return {
    title,
    description,
    alternates: { canonical: `https://pro-schools.ru/shkoly/${r}/podgotovka-k-ege/` },
    openGraph: { title, description, url: `https://pro-schools.ru/shkoly/${r}/podgotovka-k-ege/` },
  }
}

export default async function EgePage({ params }: Props) {
  const { region } = await params
  if (!regionSlugs.includes(region as RegionSlug)) notFound()
  const r = region as RegionSlug
  const regionName = regionLabels[r]
  const regionIn = regionLabelsIn[r]
  const count = getSchoolsByFeature('podgotovka-k-ege', r).length

  return (
    <CatalogClient
      initialRegions={[r]}
      lockRegion
      featureFilter="podgotovka-k-ege"
      title={`Подготовка к ЕГЭ ${regionIn}`}
      subtitle={
        count > 0
          ? `${count} ${count === 1 ? 'школа' : count < 5 ? 'школы' : 'школ'} с программами ЕГЭ`
          : 'Школ в базе пока нет — скоро добавим'
      }
      breadcrumbs={[
        { label: 'Все школы', href: '/shkoly/' },
        { label: regionName, href: `/shkoly/${r}/` },
        { label: 'Подготовка к ЕГЭ' },
      ]}
      seoContent={<SeoBlock region={r} feature="podgotovka-k-ege" count={count} />}
    />
  )
}
