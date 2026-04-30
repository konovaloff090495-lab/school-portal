import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import {
  moscowDistrictSlugs, moscowDistrictLabels, moscowDistrictFullNames,
  typeSlugs, typeLabels,
  MoscowDistrictSlug, SchoolType,
  schools,
} from '@/data/schools'
import CatalogClient from '../../../../CatalogClient'

interface Props {
  params: Promise<{ district: string; type: string }>
}

export async function generateStaticParams() {
  const params: { district: string; type: string }[] = []
  for (const district of moscowDistrictSlugs) {
    for (const type of typeSlugs) {
      params.push({ district, type })
    }
  }
  return params
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

// Форма «в [округе]» для предложного падежа
const districtPrepMap: Record<MoscowDistrictSlug, string> = {
  cao:   'в ЦАО',
  sao:   'в САО',
  svao:  'в СВАО',
  vao:   'в ВАО',
  yuvao: 'в ЮВАО',
  yuao:  'в ЮАО',
  yuzao: 'в ЮЗАО',
  zao:   'в ЗАО',
  szao:  'в СЗАО',
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { district, type } = await params
  if (!moscowDistrictSlugs.includes(district as MoscowDistrictSlug)) return {}
  if (!typeSlugs.includes(type as SchoolType)) return {}

  const d = district as MoscowDistrictSlug
  const t = type as SchoolType
  const districtLabel = moscowDistrictLabels[d]
  const districtFull  = moscowDistrictFullNames[d]
  const typeName      = typeNameMap[t] ?? typeLabels[t]
  const prep          = districtPrepMap[d]

  const count = schools.filter(
    s => s.region === 'moskva' && s.type === t && s.district === districtLabel
  ).length

  const countStr = count > 0 ? ` — ${count} школ` : ''

  return {
    title: `${typeName} ${prep} Москвы${countStr} | pro-schools.ru`,
    description: `${typeName} ${prep} (${districtFull} административный округ Москвы): адреса, телефоны, рейтинги. Выберите лучшую школу для вашего ребёнка.`,
    alternates: { canonical: `https://pro-schools.ru/shkoly/moskva/rayon/${district}/${type}/` },
  }
}

export default async function DistrictTypePage({ params }: Props) {
  const { district, type } = await params
  if (!moscowDistrictSlugs.includes(district as MoscowDistrictSlug)) notFound()
  if (!typeSlugs.includes(type as SchoolType)) notFound()

  const d = district as MoscowDistrictSlug
  const t = type as SchoolType
  const districtLabel = moscowDistrictLabels[d]
  const districtFull  = moscowDistrictFullNames[d]
  const typeName      = typeNameMap[t] ?? typeLabels[t]
  const prep          = districtPrepMap[d]

  const count = schools.filter(
    s => s.region === 'moskva' && s.type === t && s.district === districtLabel
  ).length

  return (
    <CatalogClient
      initialRegions={['moskva']}
      initialTypes={[t]}
      initialDistrict={districtLabel}
      lockRegion
      lockType
      title={`${typeName} ${prep}`}
      subtitle={`${districtFull} административный округ Москвы · ${count} школ в каталоге`}
      breadcrumbs={[
        { label: 'Все школы',  href: '/shkoly/' },
        { label: 'Москва',     href: '/shkoly/moskva/' },
        { label: `Округ ${districtLabel}`, href: `/shkoly/moskva/rayon/${district}/` },
        { label: typeName },
      ]}
    />
  )
}
