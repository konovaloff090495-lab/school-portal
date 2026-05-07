import type { Metadata } from 'next'
import { schools } from '@/data/schools'
import CatalogClient from '@/app/shkoly/CatalogClient'
import SeoBlock from '@/components/SeoBlock'

const TITLE = 'Морские и лётные кадетские школы'
const DESC  = 'Морские кадетские школы и лётные кадетские корпуса России — военно-морская и авиационная подготовка, навигация, история флота. Список с адресами и условиями приёма.'
const URL   = 'https://pro-schools.ru/shkoly/tipy/kadetskie/morskaya/'

export const metadata: Metadata = {
  title: `${TITLE} — флот и авиация | pro-schools.ru`,
  description: DESC,
  keywords: 'морская кадетская школа, кадетская лётная школа, кадетские авиационные школы, военно-морская кадетская школа',
  alternates: { canonical: URL },
  openGraph: { title: TITLE, description: DESC, url: URL },
}

export default function KadetkieMorskaya() {
  const count = schools.filter(s => s.type === 'kadetskie').length
  return (
    <CatalogClient
      initialTypes={['kadetskie']}
      lockType
      title={TITLE}
      subtitle={`${count} кадетских школ — включая морские и лётные`}
      breadcrumbs={[
        { label: 'Все школы',       href: '/shkoly/' },
        { label: 'Кадетские школы', href: '/shkoly/tipy/kadetskie/' },
        { label: 'Морские и лётные' },
      ]}
      seoContent={
        <SeoBlock
          type="kadetskie"
          count={count}
          customTitle="Морские и лётные кадетские школы: флот и авиация"
          customText="Морские кадетские корпуса и нахимовские школы готовят будущих офицеров флота: история ВМФ, морская практика, навигация, физическая подготовка. Лётные и авиационные кадетские корпуса знакомят с авиацией: теория полётов, история авиации, прыжки с парашютом. Такие школы есть в Севастополе, Северодвинске, Каспийске, Новороссийске, Хабаровске. Выпускники целенаправленно поступают в профильные военные вузы — ВУНЦ ВМФ, ВУНЦ ВВС, Нахимовское и другие."
        />
      }
    />
  )
}
