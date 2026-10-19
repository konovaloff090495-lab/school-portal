import type { Metadata } from 'next'
import { getSchoolsByType } from '@/data/schools'
import OnlineBrandsTable from '@/components/OnlineBrandsTable'
import CatalogClient from '@/app/shkoly/CatalogClient'
import SeoBlock from '@/components/SeoBlock'

const TITLE = 'Семейные школы и аттестация'
const DESC  = 'Семейные школы и классы по городам, онлайн-программы с прикреплением и аттестацией. Какие вопросы задать школе о сроках, формате, документах и стоимости.'
const URL   = 'https://pro-schools.ru/shkoly/tipy/semejnye/attestatsiya/'

export const metadata: Metadata = {
  title: `${TITLE} — как сдать аттестацию | pro-schools.ru`,
  description: DESC,
  keywords: 'семейная школа аттестация, семейная школа сдать аттестацию, аттестация при семейном обучении, семейное обучение справка, семейная школа аттестат',
  alternates: { canonical: URL },
  openGraph: { title: TITLE, description: DESC, url: URL },
}

export default function SemejnyeAttestatsiyaPage() {
  const count = getSchoolsByType('semejnye').length
  return (
    <CatalogClient
      initialTypes={['semejnye']}
      lockType
      title={TITLE}
      subtitle={`${count} семейных школ и классов — условия аттестации уточняйте у школы`}
      breadcrumbs={[
        { label: 'Все школы',      href: '/shkoly/' },
        { label: 'Семейные школы', href: '/shkoly/tipy/semejnye/' },
        { label: 'Аттестация' },
      ]}
      seoContent={<>
        <OnlineBrandsTable title="Онлайн-школы: форматы с прикреплением и аттестацией" compact />
        <SeoBlock
          type="semejnye"
          count={count}
          customTitle="Аттестация при семейном обучении: как это работает"
          customText="До записи в семейный класс отдельно обсудите, кто ведёт занятия, какая школа организует аттестации, какие документы нужны и что входит в оплату. Попросите назвать сроки, формат и стоимость каждой процедуры. В общем каталоге ниже собраны семейные школы и классы; условия аттестаций проверяйте по выбранной программе."
        />
      </>}
    />
  )
}
