import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import {
  languageSlugs, languageMetas, getLanguageBySlug, getSchoolsByLanguage,
  regionSlugs, regionLabels, regionLabelsIn, regionLabelsOf,
  type LanguageSlug, type RegionSlug,
} from '@/data/schools'
import CatalogClient from '../../../../CatalogClient'
import SeoBlock from '@/components/SeoBlock'

interface Props {
  params: Promise<{ lang: string; region: string }>
}

// Предлог + прилагательное для языка в именительном падеже единственного числа
const langAdj: Record<string, string> = {
  angliyskiy:  'английским',
  nemeckiy:    'немецким',
  francuzskiy: 'французским',
  kitayskiy:   'китайским',
  ispanskiy:   'испанским',
}

export function generateStaticParams() {
  const params: { lang: string; region: string }[] = []
  for (const lang of languageSlugs) {
    for (const region of regionSlugs) {
      const count = getSchoolsByLanguage(lang as LanguageSlug, region as RegionSlug).length
      if (count > 0) {
        params.push({ lang, region })
      }
    }
  }
  return params
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { lang, region } = await params
  const meta = getLanguageBySlug(lang)
  if (!meta || !regionLabels[region as RegionSlug]) return {}

  const count  = getSchoolsByLanguage(lang as LanguageSlug, region as RegionSlug).length
  const adj    = langAdj[lang] ?? meta.label.toLowerCase()
  const inCity = regionLabelsIn[region as RegionSlug]
  const ofCity = regionLabelsOf[region as RegionSlug]

  return {
    title: `Школы с углублённым ${adj} языком ${inCity} — ${count} школ`,
    description: `Каталог школ с углублённым ${adj} языком ${inCity}: ${count} учебных заведений с адресами, телефонами и описаниями. Государственные и частные школы ${ofCity}.`,
    keywords: `школы ${adj} язык ${inCity}, ${meta.label.toLowerCase()} язык ${inCity}, лингвистические школы ${ofCity}`,
    alternates: { canonical: `https://pro-schools.ru/shkoly/tipy/yazykovye/${lang}/${region}/` },
  }
}

export default async function LanguageRegionPage({ params }: Props) {
  const { lang, region } = await params

  if (!languageSlugs.includes(lang as LanguageSlug)) notFound()
  if (!regionLabels[region as RegionSlug]) notFound()

  const meta   = getLanguageBySlug(lang)!
  const count  = getSchoolsByLanguage(lang as LanguageSlug, region as RegionSlug).length
  const adj    = langAdj[lang] ?? meta.label.toLowerCase()
  const inCity = regionLabelsIn[region as RegionSlug]
  const ofCity = regionLabelsOf[region as RegionSlug]
  const city   = regionLabels[region as RegionSlug]

  if (count === 0) notFound()

  const h1   = `Школы с углублённым ${adj} языком ${inCity}`
  const desc = `${count} школ${count === 1 ? 'а' : ''} ${ofCity} — выберите подходящую`

  return (
    <CatalogClient
      languageFilter={meta.slug as LanguageSlug}
      initialRegions={[region as RegionSlug]}
      lockRegion
      title={h1}
      subtitle={desc}
      breadcrumbs={[
        { label: 'Все школы',          href: '/shkoly/' },
        { label: 'Языковые школы',      href: '/shkoly/tipy/yazykovye/' },
        { label: meta.label,            href: `/shkoly/tipy/yazykovye/${lang}/` },
        { label: city },
      ]}
      seoContent={
        <SeoBlock
          customTitle={h1}
          customText={`Здесь собраны школы ${ofCity} с углублённым изучением ${adj} языка. ${meta.description}`}
          count={count}
        />
      }
    />
  )
}
