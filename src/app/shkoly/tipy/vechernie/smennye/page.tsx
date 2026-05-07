import type { Metadata } from 'next'
import { schools } from '@/data/schools'
import CatalogClient from '@/app/shkoly/CatalogClient'

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
    />
  )
}
