import type { Metadata } from 'next'
import Link from 'next/link'
import { getSchoolsByType } from '@/data/schools'
import CatalogClient from '@/app/shkoly/CatalogClient'
import { BreadcrumbJsonLd, SchoolListJsonLd } from '@/lib/schema'
import OnlineBrandsTable from '@/components/OnlineBrandsTable'

const url = 'https://pro-schools.ru/shkoly/moskva/gorod/zelenograd/semejnye/'

export const metadata: Metadata = {
  title: 'Семейные школы в Зеленограде — семейные классы, адреса, контакты',
  description: 'Семейные школы и классы в Зеленограде: официальные сайты, адреса занятий, контакты и особенности программ. Онлайн-школы для семейного обучения и аттестации.',
  alternates: { canonical: url },
}

export default function ZelenogradFamilySchoolsPage() {
  const schools = getSchoolsByType('semejnye').filter(s => s.region === 'moskva' && s.city === 'Зеленоград')
  return <>
    <BreadcrumbJsonLd items={[
      { name: 'Семейные школы', href: 'https://pro-schools.ru/shkoly/tipy/semejnye/' },
      { name: 'Москва', href: 'https://pro-schools.ru/shkoly/moskva/semejnye/' },
      { name: 'Зеленоград' },
    ]} />
    <SchoolListJsonLd schools={schools} url={url} name="Семейные школы в Зеленограде" />
    <CatalogClient initialRegions={['moskva']} initialCity="Зеленоград" initialTypes={['semejnye']} lockRegion lockType seoCity="Зеленоград" title="Семейные школы в Зеленограде" subtitle={`${schools.length} школ и классов в каталоге`} breadcrumbs={[
      { label: 'Все школы', href: '/shkoly/' },
      { label: 'Семейные школы Москвы', href: '/shkoly/moskva/semejnye/' },
      { label: 'Зеленоград' },
    ]} seoContent={<>
      <p className="mb-6">Здесь собраны семейные классы на территории Зеленограда. <Link className="text-sky-700 hover:underline" href="/shkoly/moskovskaya-oblast/gorod/andreevka/semejnye/">Школы в соседней Андреевке</Link> представлены отдельно.</p>
      <OnlineBrandsTable title="Онлайн-школы для семейного обучения в Зеленограде" compact />
    </>} />
  </>
}
