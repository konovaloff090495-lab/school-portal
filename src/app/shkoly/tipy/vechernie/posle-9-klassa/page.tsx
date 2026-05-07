import type { Metadata } from 'next'
import { schools } from '@/data/schools'
import CatalogClient from '@/app/shkoly/CatalogClient'
import SeoBlock from '@/components/SeoBlock'

const TITLE = 'Вечерние школы после 9 класса'
const DESC  = 'Вечерние школы для поступления после 9 класса — 10 и 11 классы с вечерним обучением. Получите аттестат о полном среднем образовании, совмещая учёбу с работой.'
const URL   = 'https://pro-schools.ru/shkoly/tipy/vechernie/posle-9-klassa/'

export const metadata: Metadata = {
  title: `${TITLE} — каталог | pro-schools.ru`,
  description: DESC,
  keywords: 'вечерняя школа после 9 класса, вечерние школы после 9, поступить в вечернюю школу после 9, вечерняя школа 10 класс, вечерняя школа 10 11 класс',
  alternates: { canonical: URL },
  openGraph: { title: TITLE, description: DESC, url: URL },
}

export default function VechernieePosle9Page() {
  const count = schools.filter(s => s.type === 'vechernie').length
  return (
    <CatalogClient
      initialTypes={['vechernie']}
      initialLevels={['high']}
      lockType
      lockLevels
      title={TITLE}
      subtitle={`${count} школ с вечерними 10–11 классами`}
      breadcrumbs={[
        { label: 'Все школы',      href: '/shkoly/' },
        { label: 'Вечерние школы', href: '/shkoly/tipy/vechernie/' },
        { label: 'После 9 класса' },
      ]}
      seoContent={
        <SeoBlock
          type="vechernie"
          count={count}
          customTitle="Вечерняя школа после 9 класса: как поступить в 10 класс"
          customText="После окончания 9 класса и получения аттестата ОГЭ можно поступить в вечернюю школу на 10 класс — без конкурса и вступительных экзаменов. Это удобно, если вы хотите совмещать учёбу с работой или уже работаете. Вечерняя школа принимает с 15 лет: нужны паспорт, аттестат об основном общем образовании (9 классов) и заявление. Обучение длится 2 года (10 и 11 класс), по окончании сдаётся ЕГЭ и выдаётся аттестат о среднем общем образовании. С этим аттестатом можно поступить в любой российский вуз или колледж."
        />
      }
    />
  )
}
