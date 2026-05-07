import type { Metadata } from 'next'
import { schools } from '@/data/schools'
import CatalogClient from '@/app/shkoly/CatalogClient'
import SeoBlock from '@/components/SeoBlock'

const TITLE = 'Британские и кембриджские международные школы'
const DESC  = 'Британские и кембриджские школы в России — программы Cambridge Assessment, IGCSE, A-Level. Обучение по британским стандартам, диплом для поступления в вузы Великобритании.'
const URL   = 'https://pro-schools.ru/shkoly/tipy/mezhdunarodnie/britanskie/'

export const metadata: Metadata = {
  title: `${TITLE} — Cambridge, IGCSE, A-Level | pro-schools.ru`,
  description: DESC,
  keywords: 'британская международная школа, кембриджская международная школа, кембриджская школа в России, британская школа в Москве',
  alternates: { canonical: URL },
  openGraph: { title: TITLE, description: DESC, url: URL },
}

export default function MezhdunarodnieBritanskie() {
  const count = schools.filter(s => s.type === 'mezhdunarodnie').length
  return (
    <CatalogClient
      initialTypes={['mezhdunarodnie']}
      lockType
      title={TITLE}
      subtitle={`${count} международных школ с британскими программами`}
      breadcrumbs={[
        { label: 'Все школы',              href: '/shkoly/' },
        { label: 'Международные школы',    href: '/shkoly/tipy/mezhdunarodnie/' },
        { label: 'Британские и кембриджские' },
      ]}
      seoContent={
        <SeoBlock
          type="mezhdunarodnie"
          count={count}
          customTitle="Британские школы в России: Cambridge, IGCSE и A-Level"
          customText="Британские и кембриджские школы в России работают по программам Cambridge Assessment Education: начальная ступень Cambridge Primary, средняя IGCSE (аналог ОГЭ) и старшая A-Level (аналог ЕГЭ для британских вузов). Выпускник получает международно признанный диплом, с которым можно поступать в университеты Великобритании, Европы и США напрямую. Преподавание ряда предметов ведётся на английском, а учителя нередко являются носителями языка или прошли подготовку в Великобритании."
        />
      }
    />
  )
}
