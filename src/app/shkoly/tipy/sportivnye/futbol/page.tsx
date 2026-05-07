import type { Metadata } from 'next'
import { schools } from '@/data/schools'
import CatalogClient from '@/app/shkoly/CatalogClient'
import SeoBlock from '@/components/SeoBlock'

const TITLE = 'Футбольные спортивные школы'
const DESC  = 'Футбольные школы и академии России — детские секции при профессиональных клубах, СШОР по футболу, академии РПЛ-клубов. Список с адресами, возрастом набора и отзывами.'
const URL   = 'https://pro-schools.ru/shkoly/tipy/sportivnye/futbol/'

export const metadata: Metadata = {
  title: `${TITLE} — академии и СШОР | pro-schools.ru`,
  description: DESC,
  keywords: 'футбольная школа, спортивная школа по футболу, футбольная академия, СШОР футбол, детская футбольная секция',
  alternates: { canonical: URL },
  openGraph: { title: TITLE, description: DESC, url: URL },
}

export default function SportivnyeFutbol() {
  const count = schools.filter(s => s.type === 'sportivnye').length
  return (
    <CatalogClient
      initialTypes={['sportivnye']}
      lockType
      title={TITLE}
      subtitle={`${count} спортивных школ — включая футбольные`}
      breadcrumbs={[
        { label: 'Все школы',        href: '/shkoly/' },
        { label: 'Спортивные школы', href: '/shkoly/tipy/sportivnye/' },
        { label: 'Футбол' },
      ]}
      seoContent={
        <SeoBlock
          type="sportivnye"
          count={count}
          customTitle="Футбольные школы России: от секции до академии РПЛ"
          customText="Путь в профессиональный футбол в России начинается с СШОР или академий клубов РПЛ — Спартака, ЦСКА, Зенита, Локомотива, Краснодара. Набор в детские футбольные секции — с 5–7 лет. Отбор в академии топ-клубов — с 8–10 лет по итогам просмотра. Государственные СШОР по футболу бесплатные, академии профессиональных клубов платные (от 5 000 до 30 000 рублей в месяц). Тренировки 3–5 раз в неделю, летом — сборы и межрегиональные турниры."
        />
      }
    />
  )
}
