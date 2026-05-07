import type { Metadata } from 'next'
import { schools } from '@/data/schools'
import CatalogClient from '@/app/shkoly/CatalogClient'
import SeoBlock from '@/components/SeoBlock'

const TITLE = 'Профильные классы 10–11 класс'
const DESC  = 'Профильные классы в 10 и 11 классе — углублённое изучение профильных предметов в старшей школе. Физ-мат, IT, медицина, экономика, гуманитарный профиль. Подготовка к ЕГЭ.'
const URL   = 'https://pro-schools.ru/shkoly/tipy/profilnye/10-11-klass/'

export const metadata: Metadata = {
  title: `${TITLE} — старшая профильная школа | pro-schools.ru`,
  description: DESC,
  keywords: 'профильные классы 10 11 класс, профильное обучение в старшей школе, старшая профильная школа, профильные предметы 10 класс',
  alternates: { canonical: URL },
  openGraph: { title: TITLE, description: DESC, url: URL },
}

export default function Profilnye1011Klass() {
  const count = schools.filter(s => s.type === 'profilnye').length
  return (
    <CatalogClient
      initialTypes={['profilnye']}
      initialLevels={['high']}
      lockType
      lockLevels
      title={TITLE}
      subtitle={`${count} школ с профильными классами для 10–11 класса`}
      breadcrumbs={[
        { label: 'Все школы',        href: '/shkoly/' },
        { label: 'Профильные школы', href: '/shkoly/tipy/profilnye/' },
        { label: '10–11 класс' },
      ]}
      seoContent={
        <SeoBlock
          type="profilnye"
          count={count}
          customTitle="Профильные классы в 10–11 классе: как выбрать направление"
          customText="Профильные классы в 10 и 11 классе — это углублённое изучение 2–3 предметов будущей специальности. Физ-мат, IT, медицина, экономика, юридический, гуманитарный — направление определяет набор профильных и базовых предметов. В профильном классе дополнительные часы идут на ЕГЭ-предметы: ученик физ-мата глубже изучает математику и физику, будущий медик — биологию и химию. При выборе класса важно ориентироваться на специальность вуза, куда планируется поступление."
        />
      }
    />
  )
}
