import type { Metadata } from 'next'
import { schools } from '@/data/schools'
import CatalogClient from '@/app/shkoly/CatalogClient'
import SeoBlock from '@/components/SeoBlock'

const TITLE = 'Домашняя школа с английским языком'
const DESC  = 'Домашние школы с углублённым английским языком — обучение на русском и английском, подготовка к международным экзаменам, билингвальные программы.'
const URL   = 'https://pro-schools.ru/shkoly/tipy/domashnie/anglijskij/'

export const metadata: Metadata = {
  title: `${TITLE} — билингвальное обучение дома | pro-schools.ru`,
  description: DESC,
  keywords: 'домашняя школа английского языка, домашняя школа на английском, домашнее обучение английский, билингвальная домашняя школа',
  alternates: { canonical: URL },
  openGraph: { title: TITLE, description: DESC, url: URL },
}

export default function DomashnijeAnglijskijPage() {
  const count = schools.filter(s => s.type === 'domashnie' || s.type === 'yazykovye').length
  return (
    <CatalogClient
      initialTypes={['domashnie', 'yazykovye']}
      lockType
      title={TITLE}
      subtitle={`${count} школ с углублённым английским`}
      breadcrumbs={[
        { label: 'Все школы',                href: '/shkoly/' },
        { label: 'Школы надомного обучения', href: '/shkoly/tipy/domashnie/' },
        { label: 'С английским языком' },
      ]}
      seoContent={
        <SeoBlock
          type="domashnie"
          count={count}
          customTitle="Домашняя школа с английским: обучение на двух языках"
          customText="Домашние и языковые школы с углублённым английским языком дают ребёнку возможность с ранних лет свободно говорить, читать и писать по-английски. Часть предметов ведётся на английском языке, используются зарубежные учебные программы. Такой подход готовит к сдаче международных экзаменов: IELTS, Cambridge, TOEFL. Онлайн-формат позволяет заниматься с носителями языка из любой точки мира."
        />
      }
    />
  )
}
