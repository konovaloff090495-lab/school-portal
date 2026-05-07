import type { Metadata } from 'next'
import { schools } from '@/data/schools'
import CatalogClient from '@/app/shkoly/CatalogClient'
import SeoBlock from '@/components/SeoBlock'

const TITLE = 'Семейная школа онлайн'
const DESC  = 'Онлайн семейные школы России — дистанционное семейное обучение с поддержкой педагогов. Аттестация, гибкий график, обучение из любого города.'
const URL   = 'https://pro-schools.ru/shkoly/tipy/semejnye/online/'

export const metadata: Metadata = {
  title: `${TITLE} — дистанционное обучение | pro-schools.ru`,
  description: DESC,
  keywords: 'семейная школа онлайн, семейная школа онлайн обучение, дистанционная семейная школа, онлайн семейное обучение',
  alternates: { canonical: URL },
  openGraph: { title: TITLE, description: DESC, url: URL },
}

export default function SemejnyeOnlinePage() {
  const count = schools.filter(s => s.type === 'semejnye' || s.type === 'online').length
  return (
    <CatalogClient
      initialTypes={['semejnye', 'online']}
      lockType
      title={TITLE}
      subtitle={`${count} школ — семейное обучение онлайн`}
      breadcrumbs={[
        { label: 'Все школы',       href: '/shkoly/' },
        { label: 'Семейные школы',  href: '/shkoly/tipy/semejnye/' },
        { label: 'Онлайн' },
      ]}
      seoContent={
        <SeoBlock
          type="semejnye"
          count={count}
          customTitle="Онлайн семейная школа: как учиться дома с поддержкой педагогов"
          customText="Онлайн семейная школа сочетает свободу домашнего образования с профессиональным сопровождением учителей. Ребёнок учится дистанционно в удобном темпе: видеоуроки, индивидуальные занятия, чаты с педагогами. Аттестации проходят онлайн или очно в прикреплённой школе. Такой формат особенно подходит семьям, которые путешествуют, живут в других странах или хотят выстроить собственный образовательный маршрут. Для зачисления достаточно подать заявление и перейти на семейное обучение через Госуслуги."
        />
      }
    />
  )
}
