import type { Metadata } from 'next'
import { schools } from '@/data/schools'
import CatalogClient from '@/app/shkoly/CatalogClient'
import SeoBlock from '@/components/SeoBlock'

const TITLE = 'Поступление в кадетскую школу'
const DESC  = 'Как поступить в кадетскую школу: возраст приёма, документы, нормативы, конкурс. Кадетские школы России со свободными местами на 2025–2026 учебный год.'
const URL   = 'https://pro-schools.ru/shkoly/tipy/kadetskie/postuplenie/'

export const metadata: Metadata = {
  title: `${TITLE} — возраст, документы, нормативы | pro-schools.ru`,
  description: DESC,
  keywords: 'поступление в кадетскую школу, со скольки лет кадетская школа, документы для поступления в кадетскую школу, как поступить в кадетскую школу',
  alternates: { canonical: URL },
  openGraph: { title: TITLE, description: DESC, url: URL },
}

export default function KadetkiePostuplenie() {
  const count = schools.filter(s => s.type === 'kadetskie').length
  return (
    <CatalogClient
      initialTypes={['kadetskie']}
      lockType
      title={TITLE}
      subtitle={`${count} кадетских школ — найдите подходящую и узнайте условия`}
      breadcrumbs={[
        { label: 'Все школы',       href: '/shkoly/' },
        { label: 'Кадетские школы', href: '/shkoly/tipy/kadetskie/' },
        { label: 'Поступление' },
      ]}
      seoContent={
        <SeoBlock
          type="kadetskie"
          count={count}
          customTitle="Как поступить в кадетскую школу: пошаговый разбор"
          customText="В большинство кадетских школ принимают с 5 класса (10–11 лет), реже — с 1 или 7 класса. Для поступления нужны: заявление родителей, свидетельство о рождении или паспорт, медицинская справка формы 086/у, табель оценок и характеристика из предыдущей школы. Конкурс включает проверку физической подготовки (бег, подтягивания, отжимания) и собеседование. После окончания кадетской школы выпускник получает аттестат государственного образца, а при желании — поступает в военные вузы, вузы МЧС, МВД или в гражданские учреждения на общих основаниях."
        />
      }
    />
  )
}
