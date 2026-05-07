import type { Metadata } from 'next'
import { schools } from '@/data/schools'
import CatalogClient from '@/app/shkoly/CatalogClient'
import SeoBlock from '@/components/SeoBlock'

const TITLE = 'Семейная школа с аттестацией'
const DESC  = 'Семейные школы с прохождением аттестации — как сдать промежуточные и итоговые аттестации при семейном обучении. Официальная справка и аттестат.'
const URL   = 'https://pro-schools.ru/shkoly/tipy/semejnye/attestatsiya/'

export const metadata: Metadata = {
  title: `${TITLE} — как сдать аттестацию | pro-schools.ru`,
  description: DESC,
  keywords: 'семейная школа аттестация, семейная школа сдать аттестацию, аттестация при семейном обучении, семейное обучение справка, семейная школа аттестат',
  alternates: { canonical: URL },
  openGraph: { title: TITLE, description: DESC, url: URL },
}

export default function SemejnyeAttestatsiyaPage() {
  const count = schools.filter(s => s.type === 'semejnye').length
  return (
    <CatalogClient
      initialTypes={['semejnye']}
      lockType
      title={TITLE}
      subtitle={`${count} семейных школ с возможностью аттестации`}
      breadcrumbs={[
        { label: 'Все школы',      href: '/shkoly/' },
        { label: 'Семейные школы', href: '/shkoly/tipy/semejnye/' },
        { label: 'Аттестация' },
      ]}
      seoContent={
        <SeoBlock
          type="semejnye"
          count={count}
          customTitle="Аттестация при семейном обучении: как это работает"
          customText="При семейном обучении ребёнок обязан проходить промежуточную аттестацию — как правило, 1–2 раза в год. Для этого семья прикрепляется к аккредитованной школе, которая проводит аттестацию и выдаёт официальную справку об успеваемости. Итоговую аттестацию (ОГЭ в 9 классе, ЕГЭ в 11 классе) ученики-семейники сдают на общих основаниях и получают государственный аттестат. Многие семейные школы в каталоге предлагают помощь в подготовке к аттестациям: пробные тесты, разборы заданий, консультации педагогов."
        />
      }
    />
  )
}
