import type { Metadata } from 'next'
import { schools } from '@/data/schools'
import CatalogClient from '@/app/shkoly/CatalogClient'
import SeoBlock from '@/components/SeoBlock'

const TITLE = 'Казачьи кадетские школы'
const DESC  = 'Казачьи кадетские школы и корпуса России — воспитание на традициях казачества, верховая езда, военно-патриотическая подготовка, полное среднее образование.'
const URL   = 'https://pro-schools.ru/shkoly/tipy/kadetskie/kazachya/'

export const metadata: Metadata = {
  title: `${TITLE} — казачье воспитание и образование | pro-schools.ru`,
  description: DESC,
  keywords: 'казачья кадетская школа, казачий кадетский корпус, казачья кадетская школа интернат, казачьи кадетские классы',
  alternates: { canonical: URL },
  openGraph: { title: TITLE, description: DESC, url: URL },
}

export default function KadetkieKazachya() {
  const count = schools.filter(s => s.type === 'kadetskie').length
  return (
    <CatalogClient
      initialTypes={['kadetskie']}
      lockType
      title={TITLE}
      subtitle={`${count} кадетских школ — включая казачьи корпуса`}
      breadcrumbs={[
        { label: 'Все школы',       href: '/shkoly/' },
        { label: 'Кадетские школы', href: '/shkoly/tipy/kadetskie/' },
        { label: 'Казачьи' },
      ]}
      seoContent={
        <SeoBlock
          type="kadetskie"
          count={count}
          customTitle="Казачьи кадетские школы: традиции и воинское воспитание"
          customText="Казачьи кадетские корпуса и школы сочетают полноценное среднее образование с воспитанием в традициях российского казачества. В программе — история казачества, верховая езда, казачьи строевые традиции, рукопашный бой и стрелковая подготовка. Многие казачьи корпуса работают при поддержке реестровых казачьих войск и епархий РПЦ. Распространены в Краснодарском крае, Ростовской области, Ставрополье, Поволжье и Сибири. Принимают мальчиков с 5–7 класса."
        />
      }
    />
  )
}
