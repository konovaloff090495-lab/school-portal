import type { Metadata } from 'next'
import { schools } from '@/data/schools'
import CatalogClient from '@/app/shkoly/CatalogClient'
import SeoBlock from '@/components/SeoBlock'

const TITLE = 'Школа-экстернат 9 класс'
const DESC  = 'Экстернат для сдачи ОГЭ и окончания 9 класса — получите аттестат об основном общем образовании в удобном темпе без ежедневного посещения школы.'
const URL   = 'https://pro-schools.ru/shkoly/tipy/eksternal/9-klass/'

export const metadata: Metadata = {
  title: `${TITLE} — сдать ОГЭ экстерном | pro-schools.ru`,
  description: DESC,
  keywords: 'школа экстернат 9 класс, экстернат 9 класс, сдать огэ экстерном, закончить 9 класс экстернатом, экстернат после 8 класса',
  alternates: { canonical: URL },
  openGraph: { title: TITLE, description: DESC, url: URL },
}

export default function Eksternal9KlassPage() {
  const count = schools.filter(s => s.type === 'eksternal').length
  return (
    <CatalogClient
      initialTypes={['eksternal']}
      initialLevels={['middle']}
      lockType
      lockLevels
      title={TITLE}
      subtitle={`${count} школ-экстернатов с 9 классом`}
      breadcrumbs={[
        { label: 'Все школы',        href: '/shkoly/' },
        { label: 'Школы-экстернаты', href: '/shkoly/tipy/eksternal/' },
        { label: '9 класс' },
      ]}
      seoContent={
        <SeoBlock
          type="eksternal"
          count={count}
          customTitle="Экстернат 9 класс: как сдать ОГЭ и получить аттестат"
          customText="Окончить 9 класс в форме экстерната — значит прикрепиться к школе, самостоятельно пройти программу и сдать ОГЭ. После успешной сдачи выдаётся аттестат об основном общем образовании, который даёт право поступить в колледж или продолжить обучение в 10–11 классе. Экстернат в 9 классе подходит тем, кто хочет ускоренно завершить обучение, перейти в другую школу или просто учиться в удобном ритме без ежедневного посещения уроков."
        />
      }
    />
  )
}
