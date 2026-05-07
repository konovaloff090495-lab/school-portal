import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { regionSlugs, regionLabels, regionLabelsIn, RegionSlug } from '@/data/schools'
import CatalogClient from '../../../CatalogClient'
import SeoBlock from '@/components/SeoBlock'

interface Props {
  params: Promise<{ region: string; profile: string }>
}

// Профили совпадают с SCHOOL_PROFILES в CatalogClient
const PROFILES = [
  { id: 'math',        label: 'Физ-мат',               title: 'Физ-мат школы' },
  { id: 'it',          label: 'IT / Программирование',  title: 'IT-школы и школы программирования' },
  { id: 'medical',     label: 'Медицинский профиль',    title: 'Медицинские профильные школы' },
  { id: 'sport',       label: 'Спортивный профиль',     title: 'Спортивные профильные школы' },
  { id: 'art',         label: 'Художественный профиль', title: 'Школы искусств' },
  { id: 'humanities',  label: 'Гуманитарный профиль',   title: 'Гуманитарные школы' },
  { id: 'economics',   label: 'Экономический профиль',  title: 'Экономические профильные школы' },
  { id: 'engineering', label: 'Инженерный профиль',     title: 'Инженерные школы' },
  { id: 'languages',   label: 'Языковой профиль',       title: 'Языковые профильные школы' },
  { id: 'music',       label: 'Музыкальный профиль',    title: 'Музыкальные школы' },
  { id: 'ecology',     label: 'Естественнонаучный',     title: 'Естественнонаучные школы' },
] as const

type ProfileId = typeof PROFILES[number]['id']
const profileIds = PROFILES.map(p => p.id)

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

  return (
    <CatalogClient
      initialRegions={[r]}
      initialTypes={['profilnye']}
      initialProfile={profile}
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
