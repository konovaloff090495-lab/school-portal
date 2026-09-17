import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import {
  regionSlugs, regionLabels, regionLabelsIn, typeSlugs, typeLabels,
  getSchoolsByRegionAndType, RegionSlug, SchoolType,
} from '@/data/schools'
import { buildTitle, buildDescription, buildKeywords } from '@/lib/utils'
import CatalogClient from '../../CatalogClient'
import SeoBlock from '@/components/SeoBlock'
import { BreadcrumbJsonLd, SchoolListJsonLd } from '@/lib/schema'
import CityOnlinePage, { ONLINE_INDEX_REGIONS, onlineSchoolsForCity, schoolsWord } from './CityOnlinePage'
import VechernieCityExtras from '@/components/VechernieCityExtras'
import EgeCityExtras from '@/components/EgeCityExtras'
import OnlineLeadCta from '@/components/OnlineLeadCta'
import OnlineBrandsTable from '@/components/OnlineBrandsTable'

import { isCityTypeIndexable } from '@/lib/index-rules'

interface Props {
  params: Promise<{ region: string; type: string }>
}

// Пререндерим только комбинации, где есть хотя бы одна школа. Пустые пары
// (их было большинство) остаются доступными по требованию через dynamicParams
// и кэшируются после первого захода — поведение для пользователя и робота то же,
// а из сборки уходит ~5 300 страниц из 10 860.
export async function generateStaticParams() {
  const params: { region: string; type: string }[] = []
  for (const region of regionSlugs) {
    for (const type of typeSlugs) {
      if (type === 'online') {
        // онлайн-школы федеральные — пререндерим индексируемые города, остальные on-demand
        if (ONLINE_INDEX_REGIONS.has(region)) params.push({ region, type })
        continue
      }
      if (getSchoolsByRegionAndType(region, type as SchoolType).length === 0 && !isCityTypeIndexable(region, type as SchoolType)) continue
      params.push({ region, type })
    }
  }
  return params
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { region, type } = await params
  if (!regionSlugs.includes(region as RegionSlug)) return {}
  if (!typeSlugs.includes(type as SchoolType)) return {}
  const r = region as RegionSlug
  const t = type as SchoolType
  if (t === 'online') {
    const cityIn = regionLabelsIn[r]
    const list = onlineSchoolsForCity(r)
    const url = `https://pro-schools.ru/shkoly/${r}/online/`
    const title = `Онлайн-школы ${cityIn} 2026: ${list.length} ${schoolsWord(list.length)} с аттестатом, цены, отзывы`
    const description =
      `Онлайн-школы для жителей ${regionLabels[r]}: Фоксфорд, ИнтернетУрок, Синергия, Онлайн Гимназия №1, Skysmart и другие — ` +
      `цены 2026/27 от 6 530 ₽/мес, у кого своя аккредитация, где бесплатный пробный период. Как перевести ребёнка ${cityIn} на дистанционное обучение.`
    return {
      title, description,
      keywords: buildKeywords(r, t),
      alternates: { canonical: url },
      openGraph: { title, description, url },
      // Индексируем только крупные города: у остальных запросов «онлайн школа <город>» нет,
      // а сотня почти одинаковых страниц — это риск LOW_QUALITY у Яндекса.
      ...(ONLINE_INDEX_REGIONS.has(r) ? {} : { robots: { index: false, follow: true } }),
    }
  }
  const list = getSchoolsByRegionAndType(r, t)
  const tooFew = !isCityTypeIndexable(r, t)
  if (t === 'podgotovka-ege' || t === 'podgotovka-oge') {
    const exam = t === 'podgotovka-ege' ? 'ЕГЭ' : 'ОГЭ'
    const n = list.length
    const cw = n % 10 === 1 && n % 100 !== 11 ? 'центр' : n % 10 >= 2 && n % 10 <= 4 && (n % 100 < 10 || n % 100 >= 20) ? 'центра' : 'центров'
    const title = `Курсы ${exam} ${regionLabelsIn[r]} 2026: ${n} ${cw} подготовки — адреса, телефоны, отзывы`
    const description = `Центры подготовки к ${exam} ${regionLabelsIn[r]}: ${n} очных ${cw} с адресами, телефонами и оценками на Яндекс Картах (09.2026) + онлайн-курс с пробным днём от 4 132 ₽/мес в рассрочку. Как выбрать курсы и не переплатить.`
    return {
      title, description,
      keywords: buildKeywords(r, t),
      alternates: { canonical: `https://pro-schools.ru/shkoly/${r}/${t}/` },
      openGraph: { title, description, url: `https://pro-schools.ru/shkoly/${r}/${t}/` },
      ...(tooFew ? { robots: { index: false, follow: true } } : {}),
    }
  }
  return {
    title: buildTitle(r, t, undefined, list.length),
    description: buildDescription(r, t, undefined, list.length),
    keywords: buildKeywords(r, t),
    alternates: { canonical: `https://pro-schools.ru/shkoly/${r}/${t}/` },
    ...(tooFew ? { robots: { index: false, follow: true } } : {}),
  }
}

export default async function TypePage({ params }: Props) {
  const { region, type } = await params
  if (!regionSlugs.includes(region as RegionSlug)) notFound()
  if (!typeSlugs.includes(type as SchoolType)) notFound()

  const r = region as RegionSlug
  const t = type as SchoolType
  const regionName = regionLabels[r]
  const regionIn = regionLabelsIn[r]
  const typeName = typeLabels[t]
  // Онлайн-школы федеральные: страница города показывает все онлайн-школы
  // (местные — первыми), а не пустой листинг по региону.
  if (t === 'online') return <CityOnlinePage region={r} />
  const list = getSchoolsByRegionAndType(r, t)

  // Правильные русские названия для H1
  const pageTitleMap: Partial<Record<SchoolType, string>> = {
    gimnazii:     'Гимназии',
    litsei:       'Лицеи',
    eksternal:    'Школы-экстернаты',
    'pri-vuzakh': 'Школы при вузах',
    'podgotovka-ege': 'Курсы подготовки к ЕГЭ',
    'podgotovka-oge': 'Курсы подготовки к ОГЭ',
  }
  const pageTitle = pageTitleMap[t]
    ? `${pageTitleMap[t]} ${regionIn}`
    : `${typeName} школы ${regionIn}`

  // Название национального хаба (без региона) для контекстной ссылки-расшивки каннибализации:
  // городская страница ведёт head-term сигнал вверх на /shkoly/tipy/{type}/.
  const hubLabel = pageTitleMap[t] ?? `${typeName} школы`

  return (
    <>
      <BreadcrumbJsonLd
        items={[
          { name: 'Все школы', href: 'https://pro-schools.ru/shkoly/' },
          { name: regionName, href: `https://pro-schools.ru/shkoly/${r}/` },
          { name: typeName },
        ]}
      />
      <SchoolListJsonLd
        schools={list}
        url={`https://pro-schools.ru/shkoly/${r}/${t}/`}
        name={pageTitle}
      />
      <CatalogClient
        initialRegions={[r]}
        initialTypes={[t]}
        lockRegion
        lockType
        title={pageTitle}
        subtitle={list.length === 0 && t === 'vechernie' ? 'Отдельной вечерней школы в каталоге нет — ниже, как получить аттестат в городе' : (t === 'podgotovka-ege' || t === 'podgotovka-oge') ? `${list.length} ${list.length % 10 === 1 && list.length % 100 !== 11 ? 'центр' : list.length % 10 >= 2 && list.length % 10 <= 4 && (list.length % 100 < 10 || list.length % 100 >= 20) ? 'центра' : 'центров'} подготовки по данным Яндекс Карт, 09.2026` : `${list.length} ${schoolsWord(list.length)} в каталоге`}
        breadcrumbs={[
          { label: 'Все школы', href: '/shkoly/' },
          { label: regionName, href: `/shkoly/${r}/` },
          { label: typeName },
        ]}
        seoContent={
          t === 'vechernie' || t === 'eksternal'
            ? <><VechernieCityExtras region={r} count={list.length} variant={t} /><SeoBlock region={r} type={t} count={list.length} hubHref={`/shkoly/tipy/${t}/`} hubLabel={hubLabel} /></>
            : t === 'podgotovka-ege' || t === 'podgotovka-oge'
            ? <><EgeCityExtras region={r} variant={t === 'podgotovka-ege' ? 'ege' : 'oge'} count={list.length} /><SeoBlock region={r} type={t} count={list.length} hubHref={`/shkoly/tipy/${t}/`} hubLabel={hubLabel} /></>
            : t === 'semejnye'
            ? <>
                <OnlineLeadCta
                  source={`Семейные школы: город ${regionName}`}
                  heading={`Семейное обучение ${regionIn}: подберём школу для прикрепления`}
                  text={`Скажите класс и цель перехода — за 30 минут перезвоним, объясним, как оформить семейную форму ${regionIn} (уведомление, прикрепление, аттестации) и какая онлайн-школа возьмёт на себя уроки и аттестацию, чтобы не искать школу самим.`}
                  bullets={['уведомление в управление образования и документы', 'прикрепление к аккредитованной школе — бесплатно или онлайн', 'аттестации дистанционно, ОГЭ/ЕГЭ — в вашем городе']}
                  city={regionName}
                />
                <OnlineBrandsTable
                  title={`Онлайн-школы для семейного обучения ${regionIn}`}
                  intro="Все семь школ зачисляют на семейную или заочную форму из любого города и проводят аттестации дистанционно; у Синергии, Онлайн Гимназии №1 и БИТ — собственная аккредитация."
                  compact
                />
                <SeoBlock region={r} type={t} count={list.length} hubHref={`/shkoly/tipy/${t}/`} hubLabel={hubLabel} />
              </>
            : <SeoBlock region={r} type={t} count={list.length} hubHref={`/shkoly/tipy/${t}/`} hubLabel={hubLabel} />
        }
      />
    </>
  )
}
