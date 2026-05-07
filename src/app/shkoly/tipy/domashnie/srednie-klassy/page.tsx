import type { Metadata } from 'next'
import { schools } from '@/data/schools'
import CatalogClient from '@/app/shkoly/CatalogClient'
import SeoBlock from '@/components/SeoBlock'

const TITLE = 'Домашняя школа 5–9 класс'
const DESC  = 'Домашнее обучение в 5, 6, 7, 8, 9 классе — индивидуальная программа, подготовка к ОГЭ, официальный аттестат об основном общем образовании.'
const URL   = 'https://pro-schools.ru/shkoly/tipy/domashnie/srednie-klassy/'

export const metadata: Metadata = {
  title: `${TITLE} — средняя школа дома | pro-schools.ru`,
  description: DESC,
  keywords: 'домашняя школа 5 класс, домашняя школа 7 класс, домашняя школа 9 класс, домашнее обучение средняя школа, домашняя школа 5-9 класс',
  alternates: { canonical: URL },
  openGraph: { title: TITLE, description: DESC, url: URL },
}

export default function DomashnieSredniePage() {
  const count = schools.filter(s => s.type === 'domashnie').length
  return (
    <CatalogClient
      initialTypes={['domashnie']}
      initialLevels={['middle']}
      lockType
      lockLevels
      title={TITLE}
      subtitle={`${count} школ надомного обучения для 5–9 классов`}
      breadcrumbs={[
        { label: 'Все школы',                href: '/shkoly/' },
        { label: 'Школы надомного обучения', href: '/shkoly/tipy/domashnie/' },
        { label: '5–9 класс' },
      ]}
      seoContent={
        <SeoBlock
          type="domashnie"
          count={count}
          customTitle="Домашняя школа в средних классах: 5–9 класс"
          customText="В средних классах домашнее обучение даёт ребёнку возможность учиться в своём темпе, углубиться в интересные предметы и не тратить время на то, что уже хорошо знакомо. Педагоги работают по индивидуальному плану, помогают разобрать сложные темы и готовят к ОГЭ в 9 классе. После сдачи ОГЭ ученик получает официальный аттестат об основном общем образовании и может поступить в колледж или продолжить обучение в 10–11 классе."
        />
      }
    />
  )
}
