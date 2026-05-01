import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import {
  regionSlugs, regionLabels, regionLabelsIn,
  getSchoolsByFeature, RegionSlug,
} from '@/data/schools'
import CatalogClient from '../../../CatalogClient'
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
  const count = getSchoolsByFeature('podgotovka-k-oge', r).filter(s => s.type === 'online').length
  const title = `Онлайн-подготовка к ОГЭ ${regionIn} — ${count} школ | pro-schools.ru`
  const description = `Онлайн-школы с подготовкой к ОГЭ ${regionIn}: гибкий график, тренировочные варианты, подписка на отдельный предмет. Официальные аттестаты.`
  return {
    title,
    description,
    alternates: { canonical: `https://pro-schools.ru/shkoly/${r}/podgotovka-k-oge/online/` },
    openGraph: { title, description, url: `https://pro-schools.ru/shkoly/${r}/podgotovka-k-oge/online/` },
  }
}

export default async function OgeOnlinePage({ params }: Props) {
  const { region } = await params
  if (!regionSlugs.includes(region as RegionSlug)) notFound()
  const r = region as RegionSlug
  const regionName = regionLabels[r]
  const regionIn = regionLabelsIn[r]
  const count = getSchoolsByFeature('podgotovka-k-oge', r).filter(s => s.type === 'online').length

  return (
    <CatalogClient
      initialRegions={[r]}
      initialTypes={['online']}
      lockRegion
      lockType
      featureFilter="podgotovka-k-oge"
      title={`Онлайн-подготовка к ОГЭ ${regionIn}`}
      subtitle={
        count > 0
          ? `${count} ${count === 1 ? 'онлайн-школа' : count < 5 ? 'онлайн-школы' : 'онлайн-школ'} с программами ОГЭ`
          : 'Онлайн-школ в базе пока нет — скоро добавим'
      }
      breadcrumbs={[
        { label: 'Все школы', href: '/shkoly/' },
        { label: regionName, href: `/shkoly/${r}/` },
        { label: 'Подготовка к ОГЭ', href: `/shkoly/${r}/podgotovka-k-oge/` },
        { label: 'Онлайн' },
      ]}
      seoContent={<SeoBlock region={r} type="online" feature="podgotovka-k-oge" count={count} />}
    />
  )
}
