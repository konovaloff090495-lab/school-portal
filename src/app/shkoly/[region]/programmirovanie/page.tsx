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
  const count = getSchoolsByFeature('it-klass', r).length
  const title = `Школы программирования ${regionIn} — ${count} школ | pro-schools.ru`
  const description = `Школы с IT-классами и углублённым программированием ${regionIn}: робототехника, веб-разработка, искусственный интеллект. Адреса, телефоны, отзывы.`
  return {
    title,
    description,
    alternates: { canonical: `https://pro-schools.ru/shkoly/${r}/programmirovanie/` },
    openGraph: { title, description, url: `https://pro-schools.ru/shkoly/${r}/programmirovanie/` },
  }
}

export default async function ProgrammirovaniePage({ params }: Props) {
  const { region } = await params
  if (!regionSlugs.includes(region as RegionSlug)) notFound()
  const r = region as RegionSlug
  const regionName = regionLabels[r]
  const regionIn = regionLabelsIn[r]
  const count = getSchoolsByFeature('it-klass', r).length

  return (
    <CatalogClient
      initialRegions={[r]}
      lockRegion
      featureFilter="it-klass"
      title={`Школы программирования ${regionIn}`}
      subtitle={
        count > 0
          ? `${count} ${count === 1 ? 'школа' : count < 5 ? 'школы' : 'школ'} с IT-классами`
          : 'Школ в базе пока нет — скоро добавим'
      }
      breadcrumbs={[
        { label: 'Все школы', href: '/shkoly/' },
        { label: regionName, href: `/shkoly/${r}/` },
        { label: 'Программирование' },
      ]}
      seoContent={<SeoBlock region={r} type="profilnye" count={count} />}
    />
  )
}
