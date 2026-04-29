import { notFound } from 'next/navigation'
import type { Metadata } from 'next'
import { moCitySlugs, moCityLabels, getSchoolsByMoCity } from '@/data/schools'
import CatalogClient from '@/app/shkoly/CatalogClient'

type Props = { params: Promise<{ city: string }> }

// Предложный падеж (в каком городе?)
const cityLocative: Record<string, string> = {
  'Балашиха':         'в Балашихе',
  'Дмитров':          'в Дмитрове',
  'Долгопрудный':     'в Долгопрудном',
  'Домодедово':       'в Домодедово',
  'Железнодорожный':  'в Железнодорожном',
  'Клин':             'в Клину',
  'Коломна':          'в Коломне',
  'Королёв':          'в Королёве',
  'Красногорск':      'в Красногорске',
  'Люберцы':          'в Люберцах',
  'Мытищи':           'в Мытищах',
  'Ногинск':          'в Ногинске',
  'Одинцово':         'в Одинцове',
  'Подольск':         'в Подольске',
  'Раменское':        'в Раменском',
  'Реутов':           'в Реутове',
  'Руза':             'в Рузе',
  'Серпухов':         'в Серпухове',
  'Химки':            'в Химках',
  'Щёлково':          'в Щёлкове',
}

function inCity(label: string) {
  return cityLocative[label] ?? `в ${label}`
}

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

  const locative = inCity(label)

  return (
    <CatalogClient
      initialRegions={['moskovskaya-oblast']}
      initialCity={label}
      lockRegion
      title={`Школы ${locative}`}
      subtitle={`${count} школ${count === 1 ? 'а' : count >= 2 && count <= 4 ? 'ы' : ''} в каталоге`}
      seoCity={label}
      breadcrumbs={[
        { label: 'Все школы', href: '/shkoly/' },
        { label: 'Московская область', href: '/shkoly/moskovskaya-oblast/' },
        { label: `Школы ${locative}` },
      ]}
    />
  )
}
