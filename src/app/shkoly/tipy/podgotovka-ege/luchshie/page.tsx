import type { Metadata } from 'next'
import { schools } from '@/data/schools'
import CatalogClient from '@/app/shkoly/CatalogClient'
import SeoBlock from '@/components/SeoBlock'

const TITLE = 'Лучшие школы подготовки к ЕГЭ'
const DESC  = 'Рейтинг лучших школ и курсов подготовки к ЕГЭ в России — очные и онлайн, по отзывам учеников и результатам. Топ центров по математике, русскому, биологии и другим предметам.'
const URL   = 'https://pro-schools.ru/shkoly/tipy/podgotovka-ege/luchshie/'

export const metadata: Metadata = {
  title: `${TITLE} — рейтинг 2025 | pro-schools.ru`,
  description: DESC,
  keywords: 'лучшие школы для подготовки к ЕГЭ, лучшие онлайн школы ЕГЭ, рейтинг школ ЕГЭ, топ школ подготовки к ЕГЭ',
  alternates: { canonical: URL },
  openGraph: { title: TITLE, description: DESC, url: URL },
}

export default function EgeLuchshie() {
  const count = schools.filter(s => s.type === 'podgotovka-ege').length
  return (
    <CatalogClient
      initialTypes={['podgotovka-ege']}
      lockType
      title={TITLE}
      subtitle={`${count} центров подготовки — отсортируйте по рейтингу`}
      breadcrumbs={[
        { label: 'Все школы',                 href: '/shkoly/' },
        { label: 'Центры подготовки к ЕГЭ',  href: '/shkoly/tipy/podgotovka-ege/' },
        { label: 'Лучшие' },
      ]}
      seoContent={
        <SeoBlock
          type="podgotovka-ege"
          count={count}
          customTitle="Как выбрать лучшую школу подготовки к ЕГЭ"
          customText="При выборе школы для подготовки к ЕГЭ важны четыре критерия: квалификация преподавателей (желательно — опытные педагоги с проверенными результатами учеников), актуальность материалов (работа по демоверсиям ФИПИ текущего года), формат контроля (пробные ЕГЭ, разбор ошибок, куратор) и отзывы реальных учеников. Использование фильтра по рейтингу в каталоге поможет быстро найти высоко оценённые центры в вашем городе или онлайн."
        />
      }
    />
  )
}
