import type { Metadata } from 'next'
import { schools } from '@/data/schools'
import CatalogClient from '@/app/shkoly/CatalogClient'
import SeoBlock from '@/components/SeoBlock'

const TITLE = 'Кадетская школа для девочек'
const DESC  = 'Кадетские школы и классы для девочек в России — военно-патриотическое воспитание, строевая подготовка, форма. Список с адресами, отзывами и условиями поступления.'
const URL   = 'https://pro-schools.ru/shkoly/tipy/kadetskie/dlya-devochek/'

export const metadata: Metadata = {
  title: `${TITLE} — список с адресами и отзывами | pro-schools.ru`,
  description: DESC,
  keywords: 'кадетская школа для девочек, кадетская школа для девочек с проживанием, кадетские школы для девочек в России, берут ли девочек в кадетскую школу',
  alternates: { canonical: URL },
  openGraph: { title: TITLE, description: DESC, url: URL },
}

export default function KadetkieDlyaDevochek() {
  const count = schools.filter(s => s.type === 'kadetskie').length
  return (
    <CatalogClient
      initialTypes={['kadetskie']}
      lockType
      title={TITLE}
      subtitle={`${count} кадетских школ — есть варианты для девочек`}
      breadcrumbs={[
        { label: 'Все школы',          href: '/shkoly/' },
        { label: 'Кадетские школы',    href: '/shkoly/tipy/kadetskie/' },
        { label: 'Для девочек' },
      ]}
      seoContent={
        <SeoBlock
          type="kadetskie"
          count={count}
          customTitle="Кадетская школа для девочек: что нужно знать"
          customText="Девочек принимают во многие кадетские школы России — как в отдельные женские кадетские корпуса, так и в смешанные учреждения. Обучение включает строевую и физическую подготовку, военно-патриотическое воспитание, углублённые общеобразовательные предметы. Нередко для девочек доступны направления «МЧС», «Дипломатическое», «Медицинское». Форма установленного образца носится постоянно. Принимают, как правило, с 5–7 класса по результатам конкурсного отбора: физические нормативы, оценки и собеседование."
        />
      }
    />
  )
}
