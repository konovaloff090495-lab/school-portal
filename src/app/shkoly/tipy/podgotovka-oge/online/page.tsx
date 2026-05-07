import type { Metadata } from 'next'
import { schools } from '@/data/schools'
import CatalogClient from '@/app/shkoly/CatalogClient'
import SeoBlock from '@/components/SeoBlock'

const TITLE = 'Онлайн-школы подготовки к ОГЭ'
const DESC  = 'Лучшие онлайн-школы для подготовки к ОГЭ — живые уроки с репетиторами, все предметы для 9 класса, гибкий график. Рейтинг с отзывами и ценами.'
const URL   = 'https://pro-schools.ru/shkoly/tipy/podgotovka-oge/online/'

export const metadata: Metadata = {
  title: `${TITLE} — рейтинг и отзывы | pro-schools.ru`,
  description: DESC,
  keywords: 'онлайн школа ОГЭ, онлайн школы для подготовки к ОГЭ, лучшие онлайн школы ОГЭ, онлайн репетитор ОГЭ',
  alternates: { canonical: URL },
  openGraph: { title: TITLE, description: DESC, url: URL },
}

export default function OgeOnline() {
  const count = schools.filter(s => s.type === 'podgotovka-oge' || s.type === 'online').length
  return (
    <CatalogClient
      initialTypes={['podgotovka-oge', 'online']}
      lockType
      title={TITLE}
      subtitle={`${count} онлайн-школ с подготовкой к ОГЭ`}
      breadcrumbs={[
        { label: 'Все школы',                  href: '/shkoly/' },
        { label: 'Центры подготовки к ОГЭ',   href: '/shkoly/tipy/podgotovka-oge/' },
        { label: 'Онлайн' },
      ]}
      seoContent={
        <SeoBlock
          type="podgotovka-oge"
          count={count}
          customTitle="Онлайн-подготовка к ОГЭ: плюсы и как выбрать курс"
          customText="Онлайн-школы для подготовки к ОГЭ предлагают занятия с живым преподавателем в формате видеоурока — с домашними заданиями, проверкой работ и разбором ошибок. Хорошая онлайн-школа включает пробные ОГЭ по актуальным КИМам и личного куратора. Это удобно для учеников 9 класса, у которых плотное расписание: можно заниматься вечером, не тратя время на дорогу, и выбирать лучших преподавателей вне зависимости от города."
        />
      }
    />
  )
}
