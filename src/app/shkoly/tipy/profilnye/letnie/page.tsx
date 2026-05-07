import type { Metadata } from 'next'
import { schools } from '@/data/schools'
import CatalogClient from '@/app/shkoly/CatalogClient'
import SeoBlock from '@/components/SeoBlock'

const TITLE = 'Летние профильные школы'
const DESC  = 'Летние профильные школы и интенсивы для школьников — углублённые программы по математике, физике, IT, биологии, химии на каникулах. Подготовка к ЕГЭ и олимпиадам.'
const URL   = 'https://pro-schools.ru/shkoly/tipy/profilnye/letnie/'

export const metadata: Metadata = {
  title: `${TITLE} — интенсивы и смены | pro-schools.ru`,
  description: DESC,
  keywords: 'летняя профильная школа, летние профильные школы, профильная смена школа, летний интенсив по математике',
  alternates: { canonical: URL },
  openGraph: { title: TITLE, description: DESC, url: URL },
}

export default function ProfilnyeLetnie() {
  const count = schools.filter(s => s.type === 'profilnye').length
  return (
    <CatalogClient
      initialTypes={['profilnye']}
      lockType
      title={TITLE}
      subtitle={`${count} профильных школ с летними программами`}
      breadcrumbs={[
        { label: 'Все школы',        href: '/shkoly/' },
        { label: 'Профильные школы', href: '/shkoly/tipy/profilnye/' },
        { label: 'Летние' },
      ]}
      seoContent={
        <SeoBlock
          type="profilnye"
          count={count}
          customTitle="Летние профильные школы: интенсивная подготовка на каникулах"
          customText="Летние профильные школы — это 1–4 недели интенсивного обучения во время летних каникул. Ученики 7–11 классов занимаются по профильным предметам: математика, физика, информатика, биология, химия, история. Многие программы совмещают учёбу с отдыхом в лагерном формате. Летняя профильная школа помогает подтянуть слабые места перед учебным годом, подготовиться к олимпиадам или просто ускориться в любимом предмете."
        />
      }
    />
  )
}
