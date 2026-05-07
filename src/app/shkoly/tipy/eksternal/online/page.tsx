import type { Metadata } from 'next'
import { schools } from '@/data/schools'
import CatalogClient from '@/app/shkoly/CatalogClient'
import SeoBlock from '@/components/SeoBlock'

const TITLE = 'Онлайн школа-экстернат'
const DESC  = 'Онлайн-экстернат — дистанционное обучение в форме экстерната с выдачей государственного аттестата. Учитесь из любого города России или из-за рубежа.'
const URL   = 'https://pro-schools.ru/shkoly/tipy/eksternal/online/'

export const metadata: Metadata = {
  title: `${TITLE} — каталог | pro-schools.ru`,
  description: DESC,
  keywords: 'онлайн школа экстернат, онлайн экстернат, частная онлайн школа экстернат, дистанционный экстернат, школа экстернат онлайн 10 11',
  alternates: { canonical: URL },
  openGraph: { title: TITLE, description: DESC, url: URL },
}

export default function EksternalOnlinePage() {
  const count = schools.filter(s => s.type === 'eksternal' || s.type === 'online').length
  return (
    <CatalogClient
      initialTypes={['eksternal', 'online']}
      lockType
      title={TITLE}
      subtitle={`${count} школ — экстернат и онлайн-обучение`}
      breadcrumbs={[
        { label: 'Все школы',        href: '/shkoly/' },
        { label: 'Школы-экстернаты', href: '/shkoly/tipy/eksternal/' },
        { label: 'Онлайн' },
      ]}
      seoContent={
        <SeoBlock
          type="eksternal"
          count={count}
          customTitle="Онлайн-экстернат: как получить аттестат дистанционно"
          customText="Онлайн-экстернат сочетает два формата: самостоятельное освоение программы и дистанционную аттестацию. Ученик прикрепляется к аккредитованной школе, проходит промежуточные и итоговые аттестации онлайн или очно, и по итогу получает государственный аттестат. Это удобно для тех, кто живёт в другом городе или стране, путешествует, работает или хочет учиться в индивидуальном темпе. Стоимость — от 3 000 ₽/мес в частных онлайн-школах, государственное прикрепление бесплатно."
        />
      }
    />
  )
}
