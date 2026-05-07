import type { Metadata } from 'next'
import { schools } from '@/data/schools'
import CatalogClient from '@/app/shkoly/CatalogClient'
import SeoBlock from '@/components/SeoBlock'

const TITLE = 'Летние школы при вузах'
const DESC  = 'Летние образовательные школы и интенсивы при ведущих университетах России — профильная подготовка, олимпиадные курсы и погружение в университетскую среду на каникулах.'
const URL   = 'https://pro-schools.ru/shkoly/tipy/pri-vuzakh/letnie/'

export const metadata: Metadata = {
  title: `${TITLE} — интенсивы и профильные смены | pro-schools.ru`,
  description: DESC,
  keywords: 'летняя школа при вузе, летние школы при университетах, летние интенсивы при вузах, летняя профильная школа',
  alternates: { canonical: URL },
  openGraph: { title: TITLE, description: DESC, url: URL },
}

export default function PriVuzakhLetnie() {
  const count = schools.filter(s => s.type === 'pri-vuzakh').length
  return (
    <CatalogClient
      initialTypes={['pri-vuzakh']}
      lockType
      title={TITLE}
      subtitle={`${count} летних школ при вузах`}
      breadcrumbs={[
        { label: 'Все школы',       href: '/shkoly/' },
        { label: 'Школы при вузах', href: '/shkoly/tipy/pri-vuzakh/' },
        { label: 'Летние' },
      ]}
      seoContent={
        <SeoBlock
          type="pri-vuzakh"
          count={count}
          customTitle="Летние школы при вузах: профильное погружение на каникулах"
          customText="Летние школы при университетах — это интенсивный формат обучения во время каникул: 1–3 недели занятий по профильным предметам, олимпиадная математика, физика, программирование или медицина прямо на кампусе вуза. Школьники занимаются с преподавателями университета, живут в студенческих общежитиях и знакомятся с будущей профессией изнутри. Такие программы особенно полезны в 8–11 классе для определения с выбором специальности и прокачки знаний перед ЕГЭ."
        />
      }
    />
  )
}
