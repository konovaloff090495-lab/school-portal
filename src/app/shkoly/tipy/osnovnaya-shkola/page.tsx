import type { Metadata } from 'next'
import { schools } from '@/data/schools'
import CatalogClient from '../../CatalogClient'
import SeoBlock from '@/components/SeoBlock'

function getMiddleCount() {
  return schools.filter(s => {
    const m = s.grades.replace('–', '-').match(/(\d+)[–\-](\d+)/)
    if (!m) return true
    const from = parseInt(m[1]), to = parseInt(m[2])
    return to >= 5 && from <= 9
  }).length
}

export const metadata: Metadata = {
  title: 'Основная школа России — 5–9 класс, каталог',
  description: 'Каталог школ России с программой 5–9 класса. Государственные, частные, профильные, гимназии. Адреса, рейтинги, отзывы родителей.',
  keywords: 'основная школа, 5 класс, 6 класс, 7 класс, 8 класс, 9 класс, перевод в другую школу, ОГЭ подготовка',
  alternates: { canonical: 'https://pro-schools.ru/shkoly/tipy/osnovnaya-shkola/' },
}

export default function OsnovnayaShkolaPage() {
  const count = getMiddleCount()
  return (
    <CatalogClient
      title="Основная школа России (5–9 класс)"
      subtitle={`${count} школ с основной ступенью — выберите город в фильтре`}
      breadcrumbs={[
        { label: 'Все школы', href: '/shkoly/' },
        { label: 'Основная школа' },
      ]}
      seoContent={
        <SeoBlock
          customTitle="Основная школа (5–9 класс)"
          customText="Основная школа охватывает 5–9 классы — важнейший период формирования личности и первичной профориентации. В этот период многие семьи задумываются о смене школы: переходе в гимназию, профильный класс или частную школу. В каталоге собраны все школы России с программой основной ступени — государственные, частные, гимназии, лицеи, профильные и специализированные."
          count={count}
        />
      }
    />
  )
}
