import type { Metadata } from 'next'
import { schools } from '@/data/schools'
import CatalogClient from '@/app/shkoly/CatalogClient'
import SeoBlock from '@/components/SeoBlock'

const TITLE = 'Онлайн-школы подготовки к ЕГЭ'
const DESC  = 'Лучшие онлайн-школы для подготовки к ЕГЭ — живые уроки с репетиторами, все предметы, гибкий график. Рейтинг онлайн-школ с отзывами и ценами.'
const URL   = 'https://pro-schools.ru/shkoly/tipy/podgotovka-ege/online/'

export const metadata: Metadata = {
  title: `${TITLE} — рейтинг и отзывы | pro-schools.ru`,
  description: DESC,
  keywords: 'онлайн школа ЕГЭ, онлайн школы для подготовки к ЕГЭ, лучшие онлайн школы ЕГЭ, онлайн школа подготовка к ЕГЭ репетитор',
  alternates: { canonical: URL },
  openGraph: { title: TITLE, description: DESC, url: URL },
}

export default function EgeOnline() {
  const count = schools.filter(s => s.type === 'podgotovka-ege' || s.type === 'online').length
  return (
    <CatalogClient
      initialTypes={['podgotovka-ege', 'online']}
      lockType
      title={TITLE}
      subtitle={`${count} онлайн-школ с подготовкой к ЕГЭ`}
      breadcrumbs={[
        { label: 'Все школы',                  href: '/shkoly/' },
        { label: 'Центры подготовки к ЕГЭ',   href: '/shkoly/tipy/podgotovka-ege/' },
        { label: 'Онлайн' },
      ]}
      seoContent={
        <SeoBlock
          type="podgotovka-ege"
          count={count}
          customTitle="Онлайн-школы для подготовки к ЕГЭ: как выбрать"
          customText="Онлайн-школы подготовки к ЕГЭ работают в формате живых видеоуроков с преподавателем — не записей, а полноценных занятий с обратной связью, проверкой домашних заданий и разбором ошибок. Хорошая онлайн-школа предлагает пробные ЕГЭ по актуальным КИМам, личного куратора и гарантию результата. Формат удобен: не нужно ехать на другой конец города, можно заниматься из любого региона с лучшими преподавателями страны."
        />
      }
    />
  )
}
