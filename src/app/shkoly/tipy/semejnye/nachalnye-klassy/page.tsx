import type { Metadata } from 'next'
import { schools } from '@/data/schools'
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
  const count = schools.filter(s => s.type === 'semejnye').length
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
          customText="Начальная школа в семейном формате — один из самых популярных вариантов домашнего обучения. В 1–4 классе ребёнок учится читать, писать и считать в комфортной обстановке без стресса и давления. Семейные школы для начальных классов предлагают малые группы (4–8 детей), игровые методики, развитие через творчество и проекты. Аттестацию за каждый класс ученик сдаёт в прикреплённой государственной школе. Перейти на семейное обучение можно в любой момент — даже с 1 класса."
        />
      }
    />
  )
}
