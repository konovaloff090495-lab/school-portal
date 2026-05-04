import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import {
  languageSlugs, languageMetas, getLanguageBySlug, getSchoolsByLanguage, LanguageSlug,
} from '@/data/schools'
import CatalogClient from '../../../CatalogClient'
import SeoBlock from '@/components/SeoBlock'

interface Props { params: Promise<{ lang: string }> }

export function generateStaticParams() {
  return languageSlugs.map(lang => ({ lang }))
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { lang } = await params
  const meta = getLanguageBySlug(lang)
  if (!meta) return {}
  const count = getSchoolsByLanguage(meta.slug as LanguageSlug).length
  return {
    title: `${meta.title} — ${count} школ в каталоге`,
    description: meta.description,
    keywords: `школы ${meta.label.toLowerCase()} язык, ${meta.label.toLowerCase()} гимназия, углублённый ${meta.label.toLowerCase()}, ${meta.keywords.slice(0, 3).join(', ')}`,
    alternates: { canonical: `https://pro-schools.ru/shkoly/tipy/yazykovye/${lang}/` },
  }
}

export default async function LanguageSchoolPage({ params }: Props) {
  const { lang } = await params
  if (!languageSlugs.includes(lang as LanguageSlug)) notFound()
  const meta = getLanguageBySlug(lang)!
  const count = getSchoolsByLanguage(meta.slug as LanguageSlug).length

  return (
    <CatalogClient
      languageFilter={meta.slug as LanguageSlug}
      title={`${meta.title}`}
      subtitle={`${count} школ — выберите город в фильтре`}
      breadcrumbs={[
        { label: 'Все школы', href: '/shkoly/' },
        { label: 'Языковые школы', href: '/shkoly/tipy/yazykovye/' },
        { label: meta.label },
      ]}
      seoContent={
        <SeoBlock
          customTitle={meta.title}
          customText={meta.description}
          count={count}
        />
      }
    />
  )
}
