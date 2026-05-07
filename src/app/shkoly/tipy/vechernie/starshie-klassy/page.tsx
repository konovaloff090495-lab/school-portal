import type { Metadata } from 'next'
import { schools } from '@/data/schools'
import CatalogClient from '@/app/shkoly/CatalogClient'
import SeoBlock from '@/components/SeoBlock'

const TITLE = 'Вечерние школы 10–11 класс'
const DESC  = 'Вечерние школы для 10 и 11 класса — получите аттестат о полном среднем образовании. Занятия по вечерам, гибкий график, подготовка к ЕГЭ.'
const URL   = 'https://pro-schools.ru/shkoly/tipy/vechernie/starshie-klassy/'

export const metadata: Metadata = {
  title: `${TITLE} — вечернее обучение | pro-schools.ru`,
  description: DESC,
  keywords: 'вечерняя школа 10 11 класс, вечерняя школа 10 класс, вечерняя школа 11 класс, вечерние школы старшие классы, вечерняя школа 10-11 класс',
  alternates: { canonical: URL },
  openGraph: { title: TITLE, description: DESC, url: URL },
}

export default function VechernieStarshieKlassyPage() {
  const count = schools.filter(s => s.type === 'vechernie').length
  return (
    <CatalogClient
      initialTypes={['vechernie']}
      initialLevels={['high']}
      lockType
      lockLevels
      title={TITLE}
      subtitle={`${count} вечерних школ с 10–11 классами`}
      breadcrumbs={[
        { label: 'Все школы',      href: '/shkoly/' },
        { label: 'Вечерние школы', href: '/shkoly/tipy/vechernie/' },
        { label: '10–11 класс' },
      ]}
      seoContent={
        <SeoBlock
          type="vechernie"
          count={count}
          customTitle="Вечерняя школа 10–11 класс: обучение в старших классах по вечерам"
          customText="Вечерние школы принимают учеников в 10 и 11 класс — как после дневной 9-летки, так и при переводе из другой школы. Занятия проходят вечером (обычно 3–4 раза в неделю), что позволяет днём работать или заниматься другими делами. Форма обучения — очно-заочная или заочная. По итогам 11 класса ученики сдают ЕГЭ на общих основаниях и получают аттестат государственного образца, дающий право на поступление в вуз. Средняя продолжительность обучения в старших классах вечерней школы — 2 года."
        />
      }
    />
  )
}
