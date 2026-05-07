import type { Metadata } from 'next'
import { schools } from '@/data/schools'
import CatalogClient from '@/app/shkoly/CatalogClient'
import SeoBlock from '@/components/SeoBlock'

const TITLE = 'Спортивная школа после 9 класса'
const DESC  = 'Спортивные школы и колледжи для поступления после 9 класса — обучение по программе 10–11 класса с усиленной спортивной подготовкой, профессиональная карьера в спорте.'
const URL   = 'https://pro-schools.ru/shkoly/tipy/sportivnye/posle-9-klassa/'

export const metadata: Metadata = {
  title: `${TITLE} — 10–11 класс и карьера | pro-schools.ru`,
  description: DESC,
  keywords: 'спортивная школа после 9 класса, спортивная школа 10 класс, спортивная школа 10 11 класс, поступление в спортивную школу',
  alternates: { canonical: URL },
  openGraph: { title: TITLE, description: DESC, url: URL },
}

export default function SportivnyePosle9Klassa() {
  const count = schools.filter(s => s.type === 'sportivnye').length
  return (
    <CatalogClient
      initialTypes={['sportivnye']}
      initialLevels={['high']}
      lockType
      lockLevels
      title={TITLE}
      subtitle={`${count} спортивных школ для 10–11 класса`}
      breadcrumbs={[
        { label: 'Все школы',        href: '/shkoly/' },
        { label: 'Спортивные школы', href: '/shkoly/tipy/sportivnye/' },
        { label: 'После 9 класса' },
      ]}
      seoContent={
        <SeoBlock
          type="sportivnye"
          count={count}
          customTitle="Спортивные школы после 9 класса: учёба и профессиональный спорт"
          customText="После 9 класса можно поступить в спортивную школу-интернат или колледж физической культуры, где обучение совмещается с усиленными тренировками. Это путь для тех, кто хочет совмещать получение аттестата с профессиональной спортивной карьерой. В 10–11 классе учебная нагрузка адаптируется под соревновательный календарь: выезды, сборы и соревнования не мешают получить аттестат. Многие спортивные школы-интернаты финансируются из регионального бюджета и не требуют платы за обучение."
        />
      }
    />
  )
}
