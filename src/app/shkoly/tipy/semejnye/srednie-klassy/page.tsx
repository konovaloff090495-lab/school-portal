import type { Metadata } from 'next'
import { getSchoolsByType } from '@/data/schools'
import { getSchoolLevels } from '@/lib/school-levels'
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
  const count = getSchoolsByType('semejnye').filter(s => getSchoolLevels(s.grades).includes('middle')).length
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
          customText="В подборке — семейные школы и классы с указанной программой хотя бы одного из 5–9 классов. Для подростка полезно заранее обсудить предметных педагогов, объём самостоятельной работы, подготовку к ОГЭ и порядок аттестаций. Текущий набор в конкретный класс и условия поступления уточняйте непосредственно у школы."
        />
      }
    />
  )
}
