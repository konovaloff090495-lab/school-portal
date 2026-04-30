import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { moCitySlugs, moCityLabels, typeSlugs, typeLabels, schools, SchoolType } from '@/data/schools'
import CatalogClient from '@/app/shkoly/CatalogClient'

interface Props {
  params: Promise<{ city: string; type: string }>
}

// Правильные русские названия для заголовков
const typeNameMap: Partial<Record<SchoolType, string>> = {
  gosudarstvennye: 'Государственные школы',
  chastnie:        'Частные школы',
  online:          'Онлайн-школы',
  vechernie:       'Вечерние школы',
  eksternal:       'Школы-экстернаты',
  semejnye:        'Школы семейного образования',
  domashnie:       'Школы домашнего обучения',
  'pri-vuzakh':    'Школы при вузах',
  profilnye:       'Профильные школы',
  gimnazii:        'Гимназии',
  korrektsionnye:  'Коррекционные школы',
  kadetskie:       'Кадетские школы',
}

// Предложный падеж (в каком городе?)
const cityLocative: Record<string, string> = {
  'Балашиха':        'в Балашихе',
  'Дмитров':         'в Дмитрове',
  'Долгопрудный':    'в Долгопрудном',
  'Домодедово':      'в Домодедово',
  'Железнодорожный': 'в Железнодорожном',
  'Клин':            'в Клину',
  'Коломна':         'в Коломне',
  'Королёв':         'в Королёве',
  'Красногорск':     'в Красногорске',
  'Люберцы':         'в Люберцах',
  'Мытищи':          'в Мытищах',
  'Ногинск':         'в Ногинске',
  'Одинцово':        'в Одинцове',
  'Подольск':        'в Подольске',
  'Раменское':       'в Раменском',
  'Реутов':          'в Реутове',
  'Руза':            'в Рузе',
  'Серпухов':        'в Серпухове',
  'Химки':           'в Химках',
  'Щёлково':         'в Щёлкове',
}

function inCity(label: string) {
  return cityLocative[label] ?? `в ${label}`
}

export function generateStaticParams() {
  const params: { city: string; type: string }[] = []
  for (const city of moCitySlugs) {
    for (const type of typeSlugs) {
      params.push({ city, type })
    }
  }
  return params
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { city, type } = await params
  if (!moCitySlugs.includes(city as any)) return {}
  if (!typeSlugs.includes(type as SchoolType)) return {}

  const cityLabel = moCityLabels[city as keyof typeof moCityLabels]
  const t = type as SchoolType
  const typeName = typeNameMap[t] ?? typeLabels[t]

  const count = schools.filter(
    s => s.region === 'moskovskaya-oblast' && s.city === cityLabel && s.type === t
  ).length

  const countStr = count > 0 ? ` — ${count} школ` : ''

  return {
    title: `${typeName} ${cityLabel}${countStr} | pro-schools.ru`,
    description: `${typeName} в городе ${cityLabel} (Московская область): адреса, телефоны, рейтинги. Выберите лучшую школу для вашего ребёнка.`,
    alternates: { canonical: `https://pro-schools.ru/shkoly/moskovskaya-oblast/gorod/${city}/${type}/` },
  }
}

export default async function MoCityTypePage({ params }: Props) {
  const { city, type } = await params
  if (!moCitySlugs.includes(city as any)) notFound()
  if (!typeSlugs.includes(type as SchoolType)) notFound()

  const cityLabel = moCityLabels[city as keyof typeof moCityLabels]
  const t = type as SchoolType
  const typeName = typeNameMap[t] ?? typeLabels[t]
  const locative = inCity(cityLabel)

  const count = schools.filter(
    s => s.region === 'moskovskaya-oblast' && s.city === cityLabel && s.type === t
  ).length

  return (
    <CatalogClient
      initialRegions={['moskovskaya-oblast']}
      initialCity={cityLabel}
      initialTypes={[t]}
      lockRegion
      lockType
      seoCity={cityLabel}
      title={`${typeName} ${locative}`}
      subtitle={`${count} школ в каталоге`}
      breadcrumbs={[
        { label: 'Все школы',          href: '/shkoly/' },
        { label: 'Московская область', href: '/shkoly/moskovskaya-oblast/' },
        { label: `Школы ${locative}`,  href: `/shkoly/moskovskaya-oblast/gorod/${city}/` },
        { label: typeName },
      ]}
    />
  )
}
