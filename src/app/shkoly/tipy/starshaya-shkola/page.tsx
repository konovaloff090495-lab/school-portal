import type { Metadata } from 'next'
import { schools } from '@/data/schools'
import CatalogClient from '../../CatalogClient'
import SeoBlock from '@/components/SeoBlock'

function getHighCount() {
  return schools.filter(s => {
    const m = s.grades.replace('–', '-').match(/(\d+)[–\-](\d+)/)
    if (!m) return true
    return parseInt(m[2]) >= 10
  }).length
}

export const metadata: Metadata = {
  title: 'Старшая школа России — 10–11 класс, каталог',
  description: 'Каталог школ России с программой 10–11 класса. Поступление в 10 класс, профильные классы, подготовка к ЕГЭ. Адреса, рейтинги, отзывы.',
  keywords: 'старшая школа, 10 класс, 11 класс, поступление в 10 класс, профильный класс, подготовка к ЕГЭ',
  alternates: { canonical: 'https://pro-schools.ru/shkoly/tipy/starshaya-shkola/' },
}

export default function StarshayaShkolaPage() {
  const count = getHighCount()
  return (
    <CatalogClient
      title="Старшая школа России (10–11 класс)"
      subtitle={`${count} школ со старшей ступенью — выберите город в фильтре`}
      breadcrumbs={[
        { label: 'Все школы', href: '/shkoly/' },
        { label: 'Старшая школа' },
      ]}
      seoContent={
        <SeoBlock
          customTitle="Старшая школа (10–11 класс)"
          customText="Выбор школы для 10–11 класса — ключевое решение, влияющее на поступление в вуз. В старшей школе важны профильные классы, качество подготовки к ЕГЭ и средний балл выпускников. В каталоге собраны школы со старшей ступенью: от государственных со специализированными профилями до частных с интенсивной подготовкой к ЕГЭ и международными программами."
          count={count}
        />
      }
    />
  )
}
