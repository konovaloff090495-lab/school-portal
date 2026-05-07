import type { Metadata } from 'next'
import { schools } from '@/data/schools'
import CatalogClient from '@/app/shkoly/CatalogClient'
import SeoBlock from '@/components/SeoBlock'

const TITLE = 'Школы при медицинских вузах'
const DESC  = 'Школы и классы при медицинских университетах России — углублённая биология, химия, анатомия. Подготовка к поступлению в мед вузы с ранней профориентацией.'
const URL   = 'https://pro-schools.ru/shkoly/tipy/pri-vuzakh/medicinskie/'

export const metadata: Metadata = {
  title: `${TITLE} — профильная подготовка в медицину | pro-schools.ru`,
  description: DESC,
  keywords: 'школа при медицинском вузе, школы при медицинских вузах, школы при мед вузах, медицинский класс при вузе',
  alternates: { canonical: URL },
  openGraph: { title: TITLE, description: DESC, url: URL },
}

export default function PriVuzakhMedicinskie() {
  const count = schools.filter(s => s.type === 'pri-vuzakh').length
  return (
    <CatalogClient
      initialTypes={['pri-vuzakh']}
      lockType
      title={TITLE}
      subtitle={`${count} школ при вузах с медицинским профилем`}
      breadcrumbs={[
        { label: 'Все школы',       href: '/shkoly/' },
        { label: 'Школы при вузах', href: '/shkoly/tipy/pri-vuzakh/' },
        { label: 'Медицинские' },
      ]}
      seoContent={
        <SeoBlock
          type="pri-vuzakh"
          count={count}
          customTitle="Школы при медицинских вузах: путь в медицину с 10 класса"
          customText="Медицинские классы и школы при университетах — Первом меде, Сеченовском, РНИМУ имени Пирогова и других — дают углублённую подготовку по биологии, химии и профильным дисциплинам. Ученики посещают лекции, практические занятия на базе вуза и знакомятся с медицинскими специальностями ещё до поступления. Выпускники таких классов сдают ЕГЭ по химии и биологии значительно лучше и имеют преимущество при поступлении на целевые места."
        />
      }
    />
  )
}
