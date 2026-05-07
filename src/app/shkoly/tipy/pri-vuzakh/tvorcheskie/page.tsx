import type { Metadata } from 'next'
import { schools } from '@/data/schools'
import CatalogClient from '@/app/shkoly/CatalogClient'
import SeoBlock from '@/components/SeoBlock'

const TITLE = 'Школы при творческих вузах'
const DESC  = 'Школы при музыкальных, художественных и театральных вузах России — профессиональная подготовка с ранних лет, связь с ведущими творческими университетами.'
const URL   = 'https://pro-schools.ru/shkoly/tipy/pri-vuzakh/tvorcheskie/'

export const metadata: Metadata = {
  title: `${TITLE} — музыкальные, художественные, театральные | pro-schools.ru`,
  description: DESC,
  keywords: 'школы при музыкальных вузах, школы при художественных вузах, школа при театральном вузе, творческие школы при вузах',
  alternates: { canonical: URL },
  openGraph: { title: TITLE, description: DESC, url: URL },
}

export default function PriVuzakhTvorcheskie() {
  const count = schools.filter(s => s.type === 'pri-vuzakh').length
  return (
    <CatalogClient
      initialTypes={['pri-vuzakh']}
      lockType
      title={TITLE}
      subtitle={`${count} школ при творческих вузах`}
      breadcrumbs={[
        { label: 'Все школы',        href: '/shkoly/' },
        { label: 'Школы при вузах',  href: '/shkoly/tipy/pri-vuzakh/' },
        { label: 'Творческие' },
      ]}
      seoContent={
        <SeoBlock
          type="pri-vuzakh"
          count={count}
          customTitle="Школы при музыкальных и художественных вузах"
          customText="Школы при творческих вузах — музыкальных консерваториях, художественных академиях и театральных институтах — дают ребёнку возможность с ранних лет погрузиться в профессиональную среду. Здесь преподают действующие педагоги вузов, используется профессиональная материальная база, а лучшие выпускники продолжают обучение в тех же университетах. Такие школы подходят детям с выраженными творческими способностями и чёткой профессиональной ориентацией."
        />
      }
    />
  )
}
