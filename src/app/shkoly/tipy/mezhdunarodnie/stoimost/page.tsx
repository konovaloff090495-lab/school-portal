import type { Metadata } from 'next'
import { schools } from '@/data/schools'
import CatalogClient from '@/app/shkoly/CatalogClient'
import SeoBlock from '@/components/SeoBlock'

const TITLE = 'Стоимость обучения в международной школе'
const DESC  = 'Сколько стоит международная школа в России — цены, сравнение бюджетных и дорогих вариантов. Каталог с фильтром по стоимости: от бесплатных до премиум-программ.'
const URL   = 'https://pro-schools.ru/shkoly/tipy/mezhdunarodnie/stoimost/'

export const metadata: Metadata = {
  title: `${TITLE} — цены и варианты | pro-schools.ru`,
  description: DESC,
  keywords: 'международная школа стоимость, международная школа цена, сколько стоит международная школа, стоимость обучения в международной школе',
  alternates: { canonical: URL },
  openGraph: { title: TITLE, description: DESC, url: URL },
}

export default function MezhdunarodnieStoimost() {
  const count = schools.filter(s => s.type === 'mezhdunarodnie').length
  return (
    <CatalogClient
      initialTypes={['mezhdunarodnie']}
      lockType
      title={TITLE}
      subtitle={`${count} международных школ — сравните цены в каталоге`}
      breadcrumbs={[
        { label: 'Все школы',              href: '/shkoly/' },
        { label: 'Международные школы',    href: '/shkoly/tipy/mezhdunarodnie/' },
        { label: 'Стоимость обучения' },
      ]}
      seoContent={
        <SeoBlock
          type="mezhdunarodnie"
          count={count}
          customTitle="Сколько стоит международная школа: разбор по ценовым категориям"
          customText="Стоимость обучения в международных школах России варьируется в широком диапазоне. Государственные международные школы и классы с углублённым английским могут быть бесплатными. Частные школы с британскими или IB-программами стоят 100 000–400 000 рублей в год, а топовые иностранные школы в Москве — от 1 до 3 миллионов рублей. На цену влияют: аккредитация программы (Cambridge, IB или российская), наличие иностранных учителей-носителей языка, инфраструктура и формат обучения (очный, онлайн, смешанный)."
        />
      }
    />
  )
}
