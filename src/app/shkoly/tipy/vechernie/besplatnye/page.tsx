import type { Metadata } from 'next'
import { schools } from '@/data/schools'
import CatalogClient from '@/app/shkoly/CatalogClient'
import SeoBlock from '@/components/SeoBlock'

const TITLE = 'Бесплатные вечерние школы'
const DESC  = 'Бесплатные вечерние школы России — государственные учреждения с бесплатным обучением по вечерам. Официальный аттестат об окончании 9–11 класса.'
const URL   = 'https://pro-schools.ru/shkoly/tipy/vechernie/besplatnye/'

export const metadata: Metadata = {
  title: `${TITLE} России — каталог | pro-schools.ru`,
  description: DESC,
  keywords: 'бесплатная вечерняя школа, бесплатные вечерние школы, бесплатная вечерняя школа онлайн, государственная вечерняя школа',
  alternates: { canonical: URL },
  openGraph: { title: TITLE, description: DESC, url: URL },
}

export default function VecherniyeBesplatnyePage() {
  const count = schools.filter(s => s.type === 'vechernie' && (s.priceFrom === 0 || s.priceFrom === undefined)).length
  return (
    <CatalogClient
      initialTypes={['vechernie']}
      initialPriceMode="free"
      lockType
      lockPriceMode
      title={TITLE}
      subtitle={`${count} школ — бесплатное вечернее обучение`}
      breadcrumbs={[
        { label: 'Все школы',      href: '/shkoly/' },
        { label: 'Вечерние школы', href: '/shkoly/tipy/vechernie/' },
        { label: 'Бесплатные' },
      ]}
      seoContent={
        <SeoBlock
          type="vechernie"
          count={count}
          customTitle="Бесплатные вечерние школы: государственное образование по вечерам"
          customText="Государственные вечерние школы в России полностью бесплатны — обучение финансируется из регионального бюджета. Принимаются граждане старше 15 лет без вступительных испытаний. Занятия проходят в вечернее время — как правило, с 17:00 до 21:30. По окончании выдаётся аттестат государственного образца, признаваемый всеми работодателями и вузами России. Чтобы поступить, достаточно паспорта и справки о последнем классе обучения — никаких платных услуг и скрытых сборов."
        />
      }
    />
  )
}
