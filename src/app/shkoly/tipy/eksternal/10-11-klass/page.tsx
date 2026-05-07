import type { Metadata } from 'next'
import { schools } from '@/data/schools'
import CatalogClient from '@/app/shkoly/CatalogClient'
import SeoBlock from '@/components/SeoBlock'

const TITLE = 'Школы-экстернаты 10–11 класс'
const DESC  = 'Экстернат для 10 и 11 класса — ускоренное прохождение программы, гибкий график, государственный аттестат. Сдача ЕГЭ на общих основаниях.'
const URL   = 'https://pro-schools.ru/shkoly/tipy/eksternal/10-11-klass/'

export const metadata: Metadata = {
  title: `${TITLE} — каталог | pro-schools.ru`,
  description: DESC,
  keywords: 'школа экстернат 10 11 класс, экстернат 10 класс, экстернат 11 класс, школа экстернат 10 11, экстернат старшие классы',
  alternates: { canonical: URL },
  openGraph: { title: TITLE, description: DESC, url: URL },
}

export default function Eksternal1011Page() {
  const count = schools.filter(s => s.type === 'eksternal').length
  return (
    <CatalogClient
      initialTypes={['eksternal']}
      initialLevels={['high']}
      lockType
      lockLevels
      title={TITLE}
      subtitle={`${count} школ-экстернатов с 10–11 классом`}
      breadcrumbs={[
        { label: 'Все школы',        href: '/shkoly/' },
        { label: 'Школы-экстернаты', href: '/shkoly/tipy/eksternal/' },
        { label: '10–11 класс' },
      ]}
      seoContent={
        <SeoBlock
          type="eksternal"
          count={count}
          customTitle="Экстернат 10–11 класс: как пройти программу быстрее"
          customText="В форме экстерната 10 и 11 класс можно пройти за 1 год вместо 2 лет. Ученик самостоятельно изучает материал и является в школу только на промежуточные и итоговые аттестации. По окончании 11 класса сдаётся ЕГЭ на общих основаниях и выдаётся государственный аттестат о среднем общем образовании. Экстернат подходит тем, кто уже работает, занимается профессиональным спортом, живёт за рубежом или хочет освободить время для подготовки к олимпиадам и вступительным экзаменам."
        />
      }
    />
  )
}
