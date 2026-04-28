import { notFound } from 'next/navigation'
import type { Metadata } from 'next'
import { moCitySlugs, moCityLabels, getSchoolsByMoCity } from '@/data/schools'
import CatalogClient from '@/app/shkoly/CatalogClient'

type Props = { params: Promise<{ city: string }> }

export function generateStaticParams() {
  return moCitySlugs.map(city => ({ city }))
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { city } = await params
  if (!moCitySlugs.includes(city as any)) return {}
  const label = moCityLabels[city as keyof typeof moCityLabels]
  return {
    title: `Школы ${label} — каталог школ города ${label}`,
    description: `Государственные, частные и онлайн-школы города ${label} (Московская область). Адреса, телефоны, рейтинги.`,
    alternates: { canonical: `https://pro-schools.ru/shkoly/moskovskaya-oblast/gorod/${city}/` },
  }
}

export default async function MoCityPage({ params }: Props) {
  const { city } = await params
  if (!moCitySlugs.includes(city as any)) notFound()
  const label = moCityLabels[city as keyof typeof moCityLabels]
  const count = getSchoolsByMoCity(label).length

  return (
    <CatalogClient
      initialRegions={['moskovskaya-oblast']}
      initialCity={label}
      lockRegion
      title={`Школы ${label}`}
      subtitle={`${count} школ${count === 1 ? 'а' : count >= 2 && count <= 4 ? 'ы' : ''} в каталоге`}
      breadcrumbs={[
        { label: 'Все школы', href: '/shkoly/' },
        { label: 'Московская область', href: '/shkoly/moskovskaya-oblast/' },
        { label: `Школы ${label}` },
      ]}
    />
  )
}
