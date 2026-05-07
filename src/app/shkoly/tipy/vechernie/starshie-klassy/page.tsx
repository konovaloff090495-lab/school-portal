import type { Metadata } from 'next'
import { schools } from '@/data/schools'
import CatalogClient from '@/app/shkoly/CatalogClient'

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
    />
  )
}
