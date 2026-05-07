import type { Metadata } from 'next'
import { schools } from '@/data/schools'
import CatalogClient from '@/app/shkoly/CatalogClient'
import SeoBlock from '@/components/SeoBlock'

const TITLE = 'Международные летние школы'
const DESC  = 'Международные летние школы для детей и подростков — языковые лагеря, обучение за рубежом, летние программы по английскому, науке и лидерству на каникулах.'
const URL   = 'https://pro-schools.ru/shkoly/tipy/mezhdunarodnie/letnie/'

export const metadata: Metadata = {
  title: `${TITLE} — языковые и научные программы | pro-schools.ru`,
  description: DESC,
  keywords: 'международные летние школы, международная летняя школа для детей, летняя языковая школа, летняя международная программа',
  alternates: { canonical: URL },
  openGraph: { title: TITLE, description: DESC, url: URL },
}

export default function MezhdunarodnieLetnie() {
  const count = schools.filter(s => s.type === 'mezhdunarodnie').length
  return (
    <CatalogClient
      initialTypes={['mezhdunarodnie']}
      lockType
      title={TITLE}
      subtitle={`${count} международных школ с летними программами`}
      breadcrumbs={[
        { label: 'Все школы',              href: '/shkoly/' },
        { label: 'Международные школы',    href: '/shkoly/tipy/mezhdunarodnie/' },
        { label: 'Летние школы' },
      ]}
      seoContent={
        <SeoBlock
          type="mezhdunarodnie"
          count={count}
          customTitle="Международные летние школы: языки, наука и лидерство"
          customText="Международные летние школы — это 2–6 недель интенсивного обучения на каникулах: английский язык, математика, программирование, риторика, модель ООН. Часть программ проходит за рубежом, часть — в России в формате международного лагеря с иностранными преподавателями и смешанными группами из разных стран. Такой опыт развивает языковые навыки, уверенность и межкультурную коммуникацию — именно то, что ценят приёмные комиссии зарубежных вузов."
        />
      }
    />
  )
}
