import type { Metadata } from 'next'
import { schools } from '@/data/schools'
import CatalogClient from '../../CatalogClient'
import SeoBlock from '@/components/SeoBlock'

function getElementaryCount() {
  return schools.filter(s => {
    const m = s.grades.replace('–', '-').match(/(\d+)[–\-](\d+)/)
    if (!m) return true
    return parseInt(m[1]) <= 4
  }).length
}

export const metadata: Metadata = {
  title: 'Начальные школы России — 1–4 класс, каталог',
  description: 'Каталог начальных школ России: государственные, частные, вальдорфские, монтессори. Все школы с программой 1–4 класса с адресами, рейтингами и отзывами.',
  keywords: 'начальная школа, школа для первоклассников, первый класс, начальные классы, запись в первый класс',
  alternates: { canonical: 'https://pro-schools.ru/shkoly/tipy/nachalnaya-shkola/' },
}

export default function NachalnayaShkolaPage() {
  const count = getElementaryCount()
  return (
    <CatalogClient
      title="Начальные школы России (1–4 класс)"
      subtitle={`${count} школ с начальными классами — выберите город в фильтре`}
      breadcrumbs={[
        { label: 'Все школы', href: '/shkoly/' },
        { label: 'Начальная школа' },
      ]}
      seoContent={
        <SeoBlock
          customTitle="Начальные школы России"
          customText="Начальная школа — это фундамент всего образования ребёнка. 1–4 классы формируют навыки чтения, письма, счёта и мышления. В каталоге представлены государственные, частные, вальдорфские, монтессори и другие школы с начальными классами по всей России. Используйте фильтр по городу и типу школы, чтобы найти подходящий вариант."
          count={count}
        />
      }
    />
  )
}
