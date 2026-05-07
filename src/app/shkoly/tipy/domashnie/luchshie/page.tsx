import type { Metadata } from 'next'
import { schools } from '@/data/schools'
import CatalogClient from '@/app/shkoly/CatalogClient'
import SeoBlock from '@/components/SeoBlock'

const TITLE = 'Лучшие школы домашнего обучения'
const DESC  = 'Лучшие домашние школы России — рейтинг по отзывам родителей. Как выбрать домашнюю школу: на что обратить внимание, сравнение программ и цен.'
const URL   = 'https://pro-schools.ru/shkoly/tipy/domashnie/luchshie/'

export const metadata: Metadata = {
  title: `${TITLE} — рейтинг по отзывам | pro-schools.ru`,
  description: DESC,
  keywords: 'лучшие домашние школы, какую домашнюю школу выбрать, домашние школы отзывы, лучшая домашняя школа, рейтинг домашних школ',
  alternates: { canonical: URL },
  openGraph: { title: TITLE, description: DESC, url: URL },
}

export default function DomashnieLuchshiePage() {
  const count = schools.filter(s => s.type === 'domashnie').length
  return (
    <CatalogClient
      initialTypes={['domashnie']}
      lockType
      title={TITLE}
      subtitle={`${count} школ — сортировка по рейтингу`}
      breadcrumbs={[
        { label: 'Все школы',                href: '/shkoly/' },
        { label: 'Школы надомного обучения', href: '/shkoly/tipy/domashnie/' },
        { label: 'Лучшие' },
      ]}
      seoContent={
        <SeoBlock
          type="domashnie"
          count={count}
          customTitle="Как выбрать лучшую домашнюю школу: советы и критерии"
          customText="При выборе домашней школы обратите внимание на: наличие государственной лицензии и аккредитации, способ прохождения аттестаций, квалификацию педагогов, формат занятий (онлайн/очно/смешанный), наличие куратора и поддержки для родителей. Изучите отзывы реальных семей — они помогут понять, как школа работает на практике. В каталоге выше школы отсортированы по рейтингу на основе отзывов родителей."
        />
      }
    />
  )
}
