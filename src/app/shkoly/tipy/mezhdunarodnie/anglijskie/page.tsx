import type { Metadata } from 'next'
import { schools } from '@/data/schools'
import CatalogClient from '@/app/shkoly/CatalogClient'
import SeoBlock from '@/components/SeoBlock'

const TITLE = 'Международные школы с английским языком'
const DESC  = 'Международные школы с обучением на английском языке в России — языковые программы, углублённый английский, подготовка к IELTS и Cambridge. Список с адресами и отзывами.'
const URL   = 'https://pro-schools.ru/shkoly/tipy/mezhdunarodnie/anglijskie/'

export const metadata: Metadata = {
  title: `${TITLE} — языковые программы | pro-schools.ru`,
  description: DESC,
  keywords: 'международная школа с английским языком, международная английская школа, международная школа иностранных языков, международная лингвистическая школа',
  alternates: { canonical: URL },
  openGraph: { title: TITLE, description: DESC, url: URL },
}

export default function MezhdunarodnieAnglijskie() {
  const count = schools.filter(s => s.type === 'mezhdunarodnie' || s.type === 'yazykovye').length
  return (
    <CatalogClient
      initialTypes={['mezhdunarodnie', 'yazykovye']}
      lockType
      title={TITLE}
      subtitle={`${count} школ с международными языковыми программами`}
      breadcrumbs={[
        { label: 'Все школы',               href: '/shkoly/' },
        { label: 'Международные школы',     href: '/shkoly/tipy/mezhdunarodnie/' },
        { label: 'С английским языком' },
      ]}
      seoContent={
        <SeoBlock
          type="mezhdunarodnie"
          count={count}
          customTitle="Международные школы с английским языком: от языкового класса до билингвального обучения"
          customText="Международные языковые школы предлагают разный уровень погружения в английский: от углублённого изучения как иностранного до полностью билингвальных программ, где половина предметов преподаётся на английском. Лучшие школы готовят к кембриджским экзаменам (KET, PET, FCE, CAE) и международным языковым сертификатам IELTS и TOEFL. Выпускники таких школ легко поступают в зарубежные университеты и имеют преимущество на российском рынке труда."
        />
      }
    />
  )
}
