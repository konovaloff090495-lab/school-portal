import type { Metadata } from 'next'
import { schools } from '@/data/schools'
import CatalogClient from '@/app/shkoly/CatalogClient'
import SeoBlock from '@/components/SeoBlock'

const TITLE = 'Военные кадетские школы'
const DESC  = 'Военные кадетские школы и корпуса МЧС, МВД, ФСБ в России — профессиональная военная подготовка, строевая, огневая и физическая подготовка, патриотическое воспитание.'
const URL   = 'https://pro-schools.ru/shkoly/tipy/kadetskie/voennaya/'

export const metadata: Metadata = {
  title: `${TITLE} — МЧС, МВД, армия | pro-schools.ru`,
  description: DESC,
  keywords: 'военная кадетская школа, кадетская школа МЧС, кадетская школа МВД, кадетская школа ФСБ, военные кадетские корпуса',
  alternates: { canonical: URL },
  openGraph: { title: TITLE, description: DESC, url: URL },
}

export default function KadetkieVoennaya() {
  const count = schools.filter(s => s.type === 'kadetskie').length
  return (
    <CatalogClient
      initialTypes={['kadetskie']}
      lockType
      title={TITLE}
      subtitle={`${count} кадетских школ с военным профилем`}
      breadcrumbs={[
        { label: 'Все школы',       href: '/shkoly/' },
        { label: 'Кадетские школы', href: '/shkoly/tipy/kadetskie/' },
        { label: 'Военные' },
      ]}
      seoContent={
        <SeoBlock
          type="kadetskie"
          count={count}
          customTitle="Военные кадетские школы: МЧС, МВД, армия"
          customText="Военные кадетские корпуса и школы при силовых структурах — Министерстве обороны, МЧС, МВД, ФСБ, Следственном комитете — готовят к поступлению в профильные вузы. Обучение идёт по стандартной общеобразовательной программе плюс военная, физическая и специальная подготовка: строевая, огневая, тактическая. Форменная одежда носится ежедневно. Многие такие школы финансируются ведомствами и бесплатны для воспитанников. Выпускники имеют весомое преимущество при поступлении в профильные высшие учебные заведения."
        />
      }
    />
  )
}
