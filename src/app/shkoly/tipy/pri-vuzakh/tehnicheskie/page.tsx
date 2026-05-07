import type { Metadata } from 'next'
import { schools } from '@/data/schools'
import CatalogClient from '@/app/shkoly/CatalogClient'
import SeoBlock from '@/components/SeoBlock'

const TITLE = 'Школы при технических вузах'
const DESC  = 'Школы и классы при технических университетах России — углублённая математика, физика, информатика. Подготовка к поступлению в технические вузы с ранней профориентацией.'
const URL   = 'https://pro-schools.ru/shkoly/tipy/pri-vuzakh/tehnicheskie/'

export const metadata: Metadata = {
  title: `${TITLE} — инженерная и IT-подготовка | pro-schools.ru`,
  description: DESC,
  keywords: 'школа при техническом вузе, школы при технических вузах, технический класс при вузе, школа при политехническом университете',
  alternates: { canonical: URL },
  openGraph: { title: TITLE, description: DESC, url: URL },
}

export default function PriVuzakhTehnicheskie() {
  const count = schools.filter(s => s.type === 'pri-vuzakh').length
  return (
    <CatalogClient
      initialTypes={['pri-vuzakh']}
      lockType
      title={TITLE}
      subtitle={`${count} школ при технических вузах`}
      breadcrumbs={[
        { label: 'Все школы',       href: '/shkoly/' },
        { label: 'Школы при вузах', href: '/shkoly/tipy/pri-vuzakh/' },
        { label: 'Технические' },
      ]}
      seoContent={
        <SeoBlock
          type="pri-vuzakh"
          count={count}
          customTitle="Школы при технических вузах: инженерный старт с 10 класса"
          customText="Школы при технических университетах — МГТУ им. Баумана, Московском физтехе, Политехе и других — готовят будущих инженеров, программистов и учёных с углублённым изучением математики, физики и информатики. Ученики занимаются в лабораториях вуза, участвуют в олимпиадах и научных проектах, получают наставничество от преподавателей кафедр. Выпускники таких классов успешно сдают ЕГЭ по математике профиль и физике, имеют реальное преимущество при поступлении на инженерные и IT-специальности."
        />
      }
    />
  )
}
