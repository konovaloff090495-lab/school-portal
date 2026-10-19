import type { Metadata } from 'next'
import { getSchoolsByType } from '@/data/schools'
import { getSchoolLevels } from '@/lib/school-levels'
import CatalogClient from '@/app/shkoly/CatalogClient'
import SeoBlock from '@/components/SeoBlock'

const TITLE = 'Семейные школы для начальных классов'
const DESC  = 'Семейные школы для 1–4 класса — домашнее обучение для младших школьников с педагогической поддержкой. Игровой подход, малые группы, индивидуальный темп.'
const URL   = 'https://pro-schools.ru/shkoly/tipy/semejnye/nachalnye-klassy/'

export const metadata: Metadata = {
  title: `${TITLE} — 1–4 класс | pro-schools.ru`,
  description: DESC,
  keywords: 'семейная школа начальные классы, семейная школа 1 класс, семейная школа 2 класс, семейная школа 3 класс, семейное обучение начальная школа',
  alternates: { canonical: URL },
  openGraph: { title: TITLE, description: DESC, url: URL },
}

export default function SemejnyeNachalnyePage() {
  const count = getSchoolsByType('semejnye').filter(s => getSchoolLevels(s.grades).includes('elementary')).length
  return (
    <CatalogClient
      initialTypes={['semejnye']}
      initialLevels={['elementary']}
      lockType
      lockLevels
      title={TITLE}
      subtitle={`${count} семейных школ для начальных классов`}
      breadcrumbs={[
        { label: 'Все школы',      href: '/shkoly/' },
        { label: 'Семейные школы', href: '/shkoly/tipy/semejnye/' },
        { label: '1–4 класс' },
      ]}
      seoContent={
        <SeoBlock
          type="semejnye"
          count={count}
          customTitle="Семейная школа для начальных классов: 1–4 класс дома"
          customText="В подборке — семейные школы и классы, у которых указан набор хотя бы в один из 1–4 классов. При выборе обсудите с педагогом программу чтения, письма и математики, наполняемость группы, расписание, питание и организацию аттестаций. Список классов не означает наличие свободных мест — текущий набор уточняйте у школы."
        />
      }
    />
  )
}
