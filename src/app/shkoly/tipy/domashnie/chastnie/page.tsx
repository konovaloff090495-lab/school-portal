import type { Metadata } from 'next'
import { schools } from '@/data/schools'
import CatalogClient from '@/app/shkoly/CatalogClient'
import SeoBlock from '@/components/SeoBlock'

const TITLE = 'Частные школы домашнего обучения'
const DESC  = 'Частные домашние школы России — индивидуальная программа, малые группы, персональный куратор. Стоимость и отзывы.'
const URL   = 'https://pro-schools.ru/shkoly/tipy/domashnie/chastnie/'

export const metadata: Metadata = {
  title: `${TITLE} — стоимость и отзывы | pro-schools.ru`,
  description: DESC,
  keywords: 'частные домашние школы, частная домашняя школа, платная домашняя школа, стоимость домашней школы, частное домашнее обучение',
  alternates: { canonical: URL },
  openGraph: { title: TITLE, description: DESC, url: URL },
}

export default function DomashnieChastniyePage() {
  const count = schools.filter(s => (s.type === 'domashnie' || s.type === 'chastnie') && s.priceFrom && s.priceFrom > 0).length
  return (
    <CatalogClient
      initialTypes={['domashnie', 'chastnie']}
      initialPriceMode="paid"
      lockType
      lockPriceMode
      title={TITLE}
      subtitle={`${count} частных школ с надомным обучением`}
      breadcrumbs={[
        { label: 'Все школы',                href: '/shkoly/' },
        { label: 'Школы надомного обучения', href: '/shkoly/tipy/domashnie/' },
        { label: 'Частные' },
      ]}
      seoContent={
        <SeoBlock
          type="domashnie"
          count={count}
          customTitle="Частная домашняя школа: что входит в стоимость"
          customText="Частные домашние школы предлагают больше, чем просто прикрепление к школе: личный куратор, расписание уроков с педагогами, учебные платформы, помощь в подготовке к аттестациям. Стоимость варьируется от 3 000 до 30 000 ₽ в месяц в зависимости от набора услуг. В отличие от бесплатного прикрепления к государственной школе, частная домашняя школа берёт на себя всю организацию учебного процесса и освобождает родителей от самостоятельного составления программы."
        />
      }
    />
  )
}
