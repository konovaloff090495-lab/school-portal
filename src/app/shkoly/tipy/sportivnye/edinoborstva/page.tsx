import type { Metadata } from 'next'
import { schools } from '@/data/schools'
import CatalogClient from '@/app/shkoly/CatalogClient'
import SeoBlock from '@/components/SeoBlock'

const TITLE = 'Спортивные школы единоборств'
const DESC  = 'Спортивные школы борьбы, дзюдо, самбо и других единоборств в России — секции для детей и подростков, государственные СШОР, профессиональная подготовка бойцов.'
const URL   = 'https://pro-schools.ru/shkoly/tipy/sportivnye/edinoborstva/'

export const metadata: Metadata = {
  title: `${TITLE} — борьба, дзюдо, самбо | pro-schools.ru`,
  description: DESC,
  keywords: 'школа единоборств, спортивная школа борьбы, спортивная школа дзюдо, спортивная школа самбо, секция единоборств',
  alternates: { canonical: URL },
  openGraph: { title: TITLE, description: DESC, url: URL },
}

export default function SportivnyeEdinoborstva() {
  const count = schools.filter(s => s.type === 'sportivnye').length
  return (
    <CatalogClient
      initialTypes={['sportivnye']}
      lockType
      title={TITLE}
      subtitle={`${count} спортивных школ — включая секции единоборств`}
      breadcrumbs={[
        { label: 'Все школы',        href: '/shkoly/' },
        { label: 'Спортивные школы', href: '/shkoly/tipy/sportivnye/' },
        { label: 'Единоборства' },
      ]}
      seoContent={
        <SeoBlock
          type="sportivnye"
          count={count}
          customTitle="Школы единоборств: борьба, дзюдо, самбо — как выбрать"
          customText="Единоборства — один из самых распространённых видов спорта в российских СШОР и ДЮСШ. Дзюдо и самбо включены в программу государственных спортивных школ почти во всех регионах, борьба (вольная и греко-римская) — традиционно сильна на Кавказе и в Сибири. Набор в секции единоборств — с 6–8 лет. Государственные спортивные школы по единоборствам бесплатны, занятия проходят 3–5 раз в неделю. При серьёзных результатах ребёнок попадает в состав сборной региона."
        />
      }
    />
  )
}
