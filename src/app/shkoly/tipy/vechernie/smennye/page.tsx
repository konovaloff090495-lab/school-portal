import type { Metadata } from 'next'
import { schools } from '@/data/schools'
import CatalogClient from '@/app/shkoly/CatalogClient'
import SeoBlock from '@/components/SeoBlock'

const TITLE = 'Сменные школы'
const DESC  = 'Вечерние (сменные) школы России — вечерняя сменная общеобразовательная школа для работающих граждан. Государственный аттестат, гибкое расписание.'
const URL   = 'https://pro-schools.ru/shkoly/tipy/vechernie/smennye/'

export const metadata: Metadata = {
  title: `${TITLE} России — вечерняя сменная школа | pro-schools.ru`,
  description: DESC,
  keywords: 'сменная школа, вечерняя сменная школа, вечерняя сменная общеобразовательная школа, сменная общеобразовательная школа',
  alternates: { canonical: URL },
  openGraph: { title: TITLE, description: DESC, url: URL },
}

export default function SmennayaShkolaPage() {
  const count = schools.filter(s => s.type === 'vechernie').length
  return (
    <CatalogClient
      initialTypes={['vechernie']}
      lockType
      title={TITLE}
      subtitle={`${count} вечерних (сменных) школ в каталоге`}
      breadcrumbs={[
        { label: 'Все школы',      href: '/shkoly/' },
        { label: 'Вечерние школы', href: '/shkoly/tipy/vechernie/' },
        { label: 'Сменные школы' },
      ]}
      seoContent={
        <SeoBlock
          type="vechernie"
          count={count}
          customTitle="Сменная школа: что это и как поступить"
          customText="Вечерняя сменная школа (ВСШ) — официальное название вечерней общеобразовательной школы в России. Юридически это то же самое учреждение, которое сегодня чаще называют вечерней или открытой школой. Обучение проходит посменно: обычно вечерняя смена начинается в 17:00–18:00. Принимаются учащиеся с 15 лет, окончившие 8–9 классов дневной школы. Обучение бесплатное, государственный аттестат выдаётся после сдачи ОГЭ (9 кл.) или ЕГЭ (11 кл.). Сменная форма обучения подходит для работающей молодёжи, людей с особыми жизненными обстоятельствами и тех, кто хочет совместить учёбу с другой деятельностью."
        />
      }
    />
  )
}
