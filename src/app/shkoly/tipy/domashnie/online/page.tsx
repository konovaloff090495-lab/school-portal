import type { Metadata } from 'next'
import { schools } from '@/data/schools'
import CatalogClient from '@/app/shkoly/CatalogClient'
import SeoBlock from '@/components/SeoBlock'

const TITLE = 'Домашняя онлайн-школа'
const DESC  = 'Домашнее обучение онлайн — дистанционные школы с поддержкой педагогов, гибким расписанием и государственным аттестатом. Учитесь дома из любого города.'
const URL   = 'https://pro-schools.ru/shkoly/tipy/domashnie/online/'

export const metadata: Metadata = {
  title: `${TITLE} — дистанционное обучение дома | pro-schools.ru`,
  description: DESC,
  keywords: 'домашняя школа онлайн, домашняя школа онлайн обучение, домашнее обучение онлайн, дистанционная домашняя школа, домашняя школа интернет',
  alternates: { canonical: URL },
  openGraph: { title: TITLE, description: DESC, url: URL },
}

export default function DomashnieonlinePage() {
  const count = schools.filter(s => s.type === 'domashnie' || s.type === 'online').length
  return (
    <CatalogClient
      initialTypes={['domashnie', 'online']}
      lockType
      title={TITLE}
      subtitle={`${count} школ — домашнее обучение онлайн`}
      breadcrumbs={[
        { label: 'Все школы',           href: '/shkoly/' },
        { label: 'Школы надомного обучения', href: '/shkoly/tipy/domashnie/' },
        { label: 'Онлайн' },
      ]}
      seoContent={
        <SeoBlock
          type="domashnie"
          count={count}
          customTitle="Домашняя школа онлайн: как учиться дома с учителями"
          customText="Онлайн домашняя школа — это полноценное образование без выхода из дома. Ребёнок занимается с педагогами через видеосвязь, получает задания в личном кабинете и проходит аттестации дистанционно. Такой формат подходит детям с особенностями здоровья, тем, кто занимается спортом или творчеством профессионально, а также семьям, которые живут в других странах или часто переезжают. По итогам обучения выдаётся государственный аттестат — такой же, как в обычной школе."
        />
      }
    />
  )
}
