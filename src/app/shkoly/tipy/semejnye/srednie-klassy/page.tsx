import type { Metadata } from 'next'
import { schools } from '@/data/schools'
import CatalogClient from '@/app/shkoly/CatalogClient'
import SeoBlock from '@/components/SeoBlock'

const TITLE = 'Семейные школы 5–9 класс'
const DESC  = 'Семейные школы для средних классов — домашнее обучение в 5, 6, 7, 8, 9 классе с подготовкой к ОГЭ и профориентацией.'
const URL   = 'https://pro-schools.ru/shkoly/tipy/semejnye/srednie-klassy/'

export const metadata: Metadata = {
  title: `${TITLE} — средняя школа дома | pro-schools.ru`,
  description: DESC,
  keywords: 'семейная школа 5 класс, семейная школа 9 класс, семейные школы 5-9 класс, семейное обучение средняя школа, семейная школа 7 класс',
  alternates: { canonical: URL },
  openGraph: { title: TITLE, description: DESC, url: URL },
}

export default function SemejnyeSredniePage() {
  const count = schools.filter(s => s.type === 'semejnye').length
  return (
    <CatalogClient
      initialTypes={['semejnye']}
      initialLevels={['middle']}
      lockType
      lockLevels
      title={TITLE}
      subtitle={`${count} семейных школ для 5–9 классов`}
      breadcrumbs={[
        { label: 'Все школы',      href: '/shkoly/' },
        { label: 'Семейные школы', href: '/shkoly/tipy/semejnye/' },
        { label: '5–9 класс' },
      ]}
      seoContent={
        <SeoBlock
          type="semejnye"
          count={count}
          customTitle="Семейная школа для средних классов: 5–9 класс"
          customText="В средней школе семейное обучение позволяет выстроить индивидуальный учебный план: углубиться в любимые предметы, не тратить время на ненужные, совмещать учёбу со спортом или творчеством. Семейные школы для 5–9 классов предлагают предметных педагогов, помощь в подготовке к ОГЭ и профориентацию. По итогам 9 класса ученик сдаёт ОГЭ в государственной школе и получает аттестат об основном общем образовании. После этого можно продолжить обучение в 10–11 классе или поступить в колледж."
        />
      }
    />
  )
}
