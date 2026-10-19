import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { getSchoolsByType } from '@/data/schools'
import familyGeography from '@/data/family-geography.json'
import CatalogClient from '@/app/shkoly/CatalogClient'
import { BreadcrumbJsonLd, SchoolListJsonLd } from '@/lib/schema'
import OnlineBrandsTable from '@/components/OnlineBrandsTable'

type Props = { params: Promise<{ city: string }> }
const cities: Record<string, { label: string; locative: string }> = familyGeography.moscowCities
const listFor = (label: string) => getSchoolsByType('semejnye').filter(s => s.region === 'moskva' && s.city === label)
export function generateStaticParams() {
  return Object.entries(cities).filter(([slug, city]) => slug !== 'zelenograd' && listFor(city.label).length).map(([city]) => ({ city }))
}
export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { city: slug } = await params
  const city = cities[slug]
  if (!city || !listFor(city.label).length) return {}
  return {
    title: `Семейные школы ${city.locative} (Москва) — классы, адреса, контакты`,
    description: `Семейные школы и классы ${city.locative}, Москва: адреса занятий, официальные сайты, контакты и программы.`,
    alternates: { canonical: `https://pro-schools.ru/shkoly/moskva/gorod/${slug}/semejnye/` },
  }
}
export default async function MoscowCityFamilyPage({ params }: Props) {
  const { city: slug } = await params
  const city = cities[slug]
  if (!city) notFound()
  const schools = listFor(city.label)
  if (!schools.length) notFound()
  const title = `Семейные школы ${city.locative}`
  const url = `https://pro-schools.ru/shkoly/moskva/gorod/${slug}/semejnye/`
  return <>
    <BreadcrumbJsonLd items={[
      { name: 'Семейные школы', href: 'https://pro-schools.ru/shkoly/tipy/semejnye/' },
      { name: 'Москва', href: 'https://pro-schools.ru/shkoly/moskva/semejnye/' },
      { name: city.label },
    ]} />
    <SchoolListJsonLd schools={schools} url={url} name={title} />
    <CatalogClient initialRegions={['moskva']} initialCity={city.label} initialTypes={['semejnye']} lockRegion lockType seoCity={city.label} title={title} subtitle={`${schools.length} школ и классов в каталоге`} breadcrumbs={[
      { label: 'Все школы', href: '/shkoly/' },
      { label: 'Семейные школы Москвы', href: '/shkoly/moskva/semejnye/' },
      { label: city.label },
    ]} seoContent={<>
      <p className="mb-6">Семейные классы {city.locative} на территории Москвы. Адреса и программы указаны по страницам самих проектов; наличие мест и условия прикрепления уточняйте у организаторов.</p>
      <OnlineBrandsTable title={`Онлайн-школы для семейного обучения ${city.locative}`} compact />
    </>} />
  </>
}
