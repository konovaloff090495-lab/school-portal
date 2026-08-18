import { notFound } from 'next/navigation'
import type { Metadata } from 'next'
import { metroSlugToName, metroSlugs, typeSlugs, typeLabels, schools, SchoolType, getSchoolsByFeature } from '@/data/schools'
import CatalogClient from '@/app/shkoly/CatalogClient'
import RelatedSchools from '@/components/RelatedSchools'
import { relatedForMetroType, TYPE_TO_FEATURE } from '@/lib/related-schools'

interface Props {
  params: Promise<{ station: string; type: string }>
}

const typeNameMap: Partial<Record<SchoolType, string>> = {
  gosudarstvennye: 'Государственные школы',
  chastnie:        'Частные школы',
  online:          'Онлайн-школы',
  vechernie:       'Вечерние школы',
  eksternal:       'Школы-экстернаты',
  semejnye:        'Семейные школы',
  domashnie:       'Школы домашнего обучения',
  'pri-vuzakh':    'Школы при вузах',
  profilnye:       'Профильные школы',
  gimnazii:        'Гимназии',
  korrektsionnye:  'Коррекционные школы',
  kadetskie:       'Кадетские школы',
  mezhdunarodnie:  'Международные школы',
  sportivnye:      'Спортивные школы',
  yazykovye:       'Языковые школы',
}

export async function generateStaticParams() {
  const params: { station: string; type: string }[] = []
  for (const station of metroSlugs) {
    for (const type of typeSlugs) {
      params.push({ station, type })
    }
  }
  return params
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { station, type } = await params
  const metroName = metroSlugToName[station]
  if (!metroName) return {}
  if (!typeSlugs.includes(type as SchoolType)) return {}

  const t = type as SchoolType
  const typeName = typeNameMap[t] ?? typeLabels[t]
  const title = `${typeName} у метро ${metroName} в Москве`
  const description = `${typeName} рядом со станцией метро «${metroName}» в Москве. Адреса, телефоны, рейтинги родителей.`

  return {
    title,
    description,
    alternates: { canonical: `https://pro-schools.ru/shkoly/moskva/metro/${station}/${type}/` },
  }
}

export default async function MetroTypePage({ params }: Props) {
  const { station, type } = await params
  const metroName = metroSlugToName[station]
  if (!metroName) notFound()
  if (!typeSlugs.includes(type as SchoolType)) notFound()

  const t = type as SchoolType
  const typeName = typeNameMap[t] ?? typeLabels[t]

  // Для типов, которых в базе нет ни одной школы (programmirovanie, podgotovka-ege,
  // podgotovka-oge), фильтруем не по типу, а по одноимённой особенности — там данные есть.
  const feature = TYPE_TO_FEATURE[t]
  const nearHere = (list: typeof schools) =>
    list.filter(s => s.metro && s.metro.toLowerCase().includes(metroName.toLowerCase()))
  const count = feature
    ? nearHere(getSchoolsByFeature(feature, 'moskva')).length
    : nearHere(schools.filter(s => s.region === 'moskva' && s.type === t)).length

  const related = count === 0 ? relatedForMetroType(station, t, typeName, feature) : null

  return (
    <CatalogClient
      initialRegions={['moskva']}
      initialTypes={feature ? [] : [t]}
      featureFilter={feature}
      initialMetro={metroName}
      emptyFallback={related ? <RelatedSchools block={related} /> : undefined}
      lockRegion
      lockType={!feature}
      lockMetro
      title={`${typeName} у метро ${metroName}`}
      subtitle={`${count} школ в каталоге`}
      breadcrumbs={[
        { label: 'Все школы',   href: '/shkoly/' },
        { label: 'Москва',      href: '/shkoly/moskva/' },
        { label: `Метро ${metroName}`, href: `/shkoly/moskva/metro/${station}/` },
        { label: typeName },
      ]}
    />
  )
}
