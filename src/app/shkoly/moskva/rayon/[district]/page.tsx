import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import {
  moscowDistrictSlugs, moscowDistrictLabels, moscowDistrictFullNames,
  MoscowDistrictSlug, getSchoolsByDistrict,
} from '@/data/schools'
import CatalogClient from '../../../CatalogClient'

interface Props {
  params: Promise<{ district: string }>
}

export async function generateStaticParams() {
  return moscowDistrictSlugs.map(district => ({ district }))
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { district } = await params
  if (!moscowDistrictSlugs.includes(district as MoscowDistrictSlug)) return {}
  const d = district as MoscowDistrictSlug
  const label = moscowDistrictLabels[d]
  const full = moscowDistrictFullNames[d]
  const count = getSchoolsByDistrict(label).length
  return {
    // Title под запрос «школы ЦАО / школы ЦАО Москвы» (Вебмастер: 484 показа,
    // 0 кликов на позиции 8): ключ впереди, число школ и «рейтинг» — в хвосте.
    title: `Школы ${label} Москвы — список ${count} школ с рейтингом и адресами`,
    description: `Все школы ${label} Москвы (${full} административный округ) в одном списке: ${count} государственных, частных и онлайн-школ — рейтинг, адреса, телефоны, профили обучения и отзывы родителей.`,
    alternates: { canonical: `https://pro-schools.ru/shkoly/moskva/rayon/${district}/` },
  }
}

export default async function DistrictPage({ params }: Props) {
  const { district } = await params
  if (!moscowDistrictSlugs.includes(district as MoscowDistrictSlug)) notFound()

  const d = district as MoscowDistrictSlug
  const label = moscowDistrictLabels[d]
  const full = moscowDistrictFullNames[d]
  const count = getSchoolsByDistrict(label).length

  return (
    <CatalogClient
      initialRegions={['moskva']}
      initialDistrict={label}
      lockRegion
      title={`Школы ${label} — ${full} округ`}
      subtitle={`${count} школ в ${full} административном округе Москвы`}
      breadcrumbs={[
        { label: 'Все школы', href: '/shkoly/' },
        { label: 'Москва', href: '/shkoly/moskva/' },
        { label: `Округ ${label}` },
      ]}
    />
  )
}
