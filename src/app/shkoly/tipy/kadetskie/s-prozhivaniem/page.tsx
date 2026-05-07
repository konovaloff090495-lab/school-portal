import type { Metadata } from 'next'
import { schools } from '@/data/schools'
import CatalogClient from '@/app/shkoly/CatalogClient'
import SeoBlock from '@/components/SeoBlock'

const TITLE = 'Кадетская школа-интернат с проживанием'
const DESC  = 'Кадетские школы-интернаты с проживанием в России — полный пансион, питание, форма, военно-патриотическое воспитание. Бесплатные и платные варианты, условия поступления.'
const URL   = 'https://pro-schools.ru/shkoly/tipy/kadetskie/s-prozhivaniem/'

export const metadata: Metadata = {
  title: `${TITLE} — бесплатные и платные | pro-schools.ru`,
  description: DESC,
  keywords: 'кадетская школа с проживанием, кадетская школа интернат, кадетские школы России с проживанием, бесплатные кадетские школы с проживанием',
  alternates: { canonical: URL },
  openGraph: { title: TITLE, description: DESC, url: URL },
}

export default function KadetkieSProzhivaniem() {
  const count = schools.filter(s => s.type === 'kadetskie').length
  return (
    <CatalogClient
      initialTypes={['kadetskie']}
      lockType
      title={TITLE}
      subtitle={`${count} кадетских школ — включая интернаты с проживанием`}
      breadcrumbs={[
        { label: 'Все школы',       href: '/shkoly/' },
        { label: 'Кадетские школы', href: '/shkoly/tipy/kadetskie/' },
        { label: 'С проживанием' },
      ]}
      seoContent={
        <SeoBlock
          type="kadetskie"
          count={count}
          customTitle="Кадетская школа-интернат: жизнь и учёба на территории"
          customText="Большинство государственных кадетских школ в России работают в формате интерната — ребята живут на территории учреждения в течение учебной недели или всего учебного года. Полный пансион включает питание, обмундирование и медицинское сопровождение. Многие кадетские интернаты финансируются региональным бюджетом и бесплатны для воспитанников. Поступление — по конкурсу: физические нормативы, оценки, медкомиссия. Домой отпускают, как правило, по выходным и на каникулы."
        />
      }
    />
  )
}
