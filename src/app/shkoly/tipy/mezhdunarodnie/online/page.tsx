import type { Metadata } from 'next'
import { schools } from '@/data/schools'
import CatalogClient from '@/app/shkoly/CatalogClient'
import SeoBlock from '@/components/SeoBlock'

const TITLE = 'Международные онлайн-школы'
const DESC  = 'Международные онлайн-школы для детей — дистанционное обучение по международным программам из любой страны. Английский язык, IB, Cambridge, двойной аттестат.'
const URL   = 'https://pro-schools.ru/shkoly/tipy/mezhdunarodnie/online/'

export const metadata: Metadata = {
  title: `${TITLE} — дистанционные программы | pro-schools.ru`,
  description: DESC,
  keywords: 'международная онлайн школа, международная школа онлайн, дистанционная международная школа, бесплатные международные онлайн школы',
  alternates: { canonical: URL },
  openGraph: { title: TITLE, description: DESC, url: URL },
}

export default function MezhdunarodnieOnline() {
  const count = schools.filter(s => s.type === 'mezhdunarodnie' || s.type === 'online').length
  return (
    <CatalogClient
      initialTypes={['mezhdunarodnie', 'online']}
      lockType
      title={TITLE}
      subtitle={`${count} онлайн-школ с международными программами`}
      breadcrumbs={[
        { label: 'Все школы',              href: '/shkoly/' },
        { label: 'Международные школы',    href: '/shkoly/tipy/mezhdunarodnie/' },
        { label: 'Онлайн' },
      ]}
      seoContent={
        <SeoBlock
          type="mezhdunarodnie"
          count={count}
          customTitle="Международные онлайн-школы: учёба по мировым стандартам из дома"
          customText="Международные онлайн-школы ведут обучение по программам Cambridge, IB или двойному аттестату (российский + международный) в дистанционном формате. Ученик занимается в живых видеоурока с учителями, сдаёт международные экзамены и получает признанный диплом. Такой формат особенно востребован у семей, живущих за рубежом, часто переезжающих или стремящихся совместить российский аттестат с международным образованием."
        />
      }
    />
  )
}
