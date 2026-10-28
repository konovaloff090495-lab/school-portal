import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { moCitySlugs, moCityLabels, type MoCitySlug, typeSlugs, typeLabels, schools, SchoolType, getSchoolsByFeature, schoolMatchesType, schoolMatchesMoCity } from '@/data/schools'
import CatalogClient from '@/app/shkoly/CatalogClient'
import RelatedSchools from '@/components/RelatedSchools'
import { relatedForMoCityType, TYPE_TO_FEATURE, TYPE_FULL_NAME } from '@/lib/related-schools'
import familyGeography from '@/data/family-geography.json'
import OnlineBrandsTable from '@/components/OnlineBrandsTable'
import OnlineLeadCta from '@/components/OnlineLeadCta'
import { BreadcrumbJsonLd, SchoolListJsonLd } from '@/lib/schema'
import Link from 'next/link'

interface Props {
  params: Promise<{ city: string; type: string }>
}

// Правильные русские названия для заголовков
// Локальные формулировки имеют приоритет; для остальных типов —
// общий словарь TYPE_FULL_NAME (иначе в H1 попадает «Шахматные у метро X»).
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
}

// Предложный падеж (в каком городе?)
const cityLocative: Record<string, string> = {
  'Ларюшино': 'в Ларюшино',
  'Палицы': 'в Палицах',
  ...Object.fromEntries(Object.values(familyGeography.moCities).map(c => [c.label, c.locative])),
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
      // Склеено 301-редиректом (next.config.ts) — страницы не генерим
      if (type === 'online') continue
      if (!schools.some(s => schoolMatchesMoCity(s, moCityLabels[city as keyof typeof moCityLabels]) && schoolMatchesType(s, type))) continue
      params.push({ city, type })
    }
  }
  return params
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { city, type } = await params
  if (!moCitySlugs.includes(city as MoCitySlug)) return {}
  if (!typeSlugs.includes(type as SchoolType)) return {}

  const cityLabel = moCityLabels[city as keyof typeof moCityLabels]
  const t = type as SchoolType
  const typeName = typeNameMap[t] ?? TYPE_FULL_NAME[t] ?? typeLabels[t]

  const count = schools.filter(
    s => schoolMatchesMoCity(s, cityLabel) && schoolMatchesType(s, t)
  ).length

  const countStr = count > 0 ? ` — ${count} школ` : ''

  return {
    title: t === 'semejnye' ? `Семейные школы ${inCity(cityLabel)} — школы и классы, адреса, контакты` : `${typeName} ${cityLabel}${countStr} | pro-schools.ru`,
    description: t === 'semejnye' ? `Семейные школы и классы ${inCity(cityLabel)}: ${count} в каталоге. Адреса, телефоны и официальные сайты, особенности обучения и онлайн-варианты для аттестации.` : `${typeName} в городе ${cityLabel} (Московская область): адреса, телефоны, рейтинги. Выберите лучшую школу для вашего ребёнка.`,
    alternates: { canonical: `https://pro-schools.ru/shkoly/moskovskaya-oblast/gorod/${city}/${type}/` },
    ...(t === 'semejnye' && count === 0 ? { robots: { index: false, follow: true } } : {}),
  }
}

export default async function MoCityTypePage({ params }: Props) {
  const { city, type } = await params
  if (!moCitySlugs.includes(city as MoCitySlug)) notFound()
  if (!typeSlugs.includes(type as SchoolType)) notFound()

  const cityLabel = moCityLabels[city as keyof typeof moCityLabels]
  const t = type as SchoolType
  const typeName = typeNameMap[t] ?? TYPE_FULL_NAME[t] ?? typeLabels[t]
  const locative = inCity(cityLabel)

  // Типы без единой школы в базе фильтруем по одноимённой особенности — см. TYPE_TO_FEATURE.
  const feature = TYPE_TO_FEATURE[t]
  const count = (feature
    ? getSchoolsByFeature(feature, 'moskovskaya-oblast')
    : schools.filter(s => s.region === 'moskovskaya-oblast' && schoolMatchesType(s, t))
  ).filter(s => schoolMatchesMoCity(s, cityLabel)).length

  const related = count === 0
    ? relatedForMoCityType(city as keyof typeof moCityLabels, t, typeName, feature)
    : null

  return (
    <>
    {t === 'semejnye' && <>
      <BreadcrumbJsonLd items={[
        { name: 'Все школы', href: 'https://pro-schools.ru/shkoly/' },
        { name: 'Семейные школы', href: 'https://pro-schools.ru/shkoly/tipy/semejnye/' },
        { name: `Семейные школы ${locative}` },
      ]} />
      <SchoolListJsonLd schools={schools.filter(s => schoolMatchesMoCity(s, cityLabel) && schoolMatchesType(s, t))} url={`https://pro-schools.ru/shkoly/moskovskaya-oblast/gorod/${city}/${type}/`} name={`Семейные школы ${locative}`} />
    </>}
    <CatalogClient
      initialRegions={['moskovskaya-oblast']}
      initialCity={cityLabel}
      initialTypes={feature ? [] : [t]}
      featureFilter={feature}
      emptyFallback={related ? <RelatedSchools block={related} /> : undefined}
      lockRegion
      lockType={!feature}
      seoCity={cityLabel}
      title={`${typeName} ${locative}`}
      subtitle={`${count} школ в каталоге`}
      breadcrumbs={[
        { label: 'Все школы',          href: '/shkoly/' },
        { label: 'Московская область', href: '/shkoly/moskovskaya-oblast/' },
        { label: `Школы ${locative}`,  href: `/shkoly/moskovskaya-oblast/gorod/${city}/` },
        { label: typeName },
      ]}
      seoContent={t === 'semejnye' ? <>
        <p className="mb-5 text-sm"><Link className="text-sky-700 hover:underline" href="/shkoly/tipy/semejnye/">Семейные школы по городам России</Link> · <Link className="text-sky-700 hover:underline" href="/shkoly/moskovskaya-oblast/semejnye/">Все школы Московской области</Link></p>
        {city === 'dmitrov' && <section className="mb-6"><h2 className="text-xl font-bold mb-3">Рядом с Дмитровом</h2><p>Семейная школа <Link className="text-sky-700 hover:underline" href="/shkola/semejnaya-shkola-goodwin-rybnoe/">«ГУДВИН»</Link> находится в посёлке Рыбное, д. 37. Школа указывает примерно 20 минут пути от Дмитрова и предлагает трансфер.</p></section>}
        <OnlineLeadCta source={`Семейные школы: город МО ${cityLabel}`} city={cityLabel} heading={`Семейное обучение ${locative}: подберём школу для прикрепления`} text="Поможем выбрать онлайн-школу по классу и формату занятий, разобраться с прикреплением и аттестацией." />
        <OnlineBrandsTable title={`Онлайн-школы для семейного обучения ${locative}`} compact />
      </> : undefined}
    />
    </>
  )
}
