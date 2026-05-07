import type { Metadata } from 'next'
import { schools } from '@/data/schools'
import CatalogClient from '@/app/shkoly/CatalogClient'
import SeoBlock from '@/components/SeoBlock'

const TITLE = 'Подготовка к ЕГЭ по биологии'
const DESC  = 'Школы и курсы подготовки к ЕГЭ по биологии — анатомия, генетика, ботаника, экология. Очные и онлайн-форматы, пробные варианты, разбор заданий для поступления в медицинские вузы.'
const URL   = 'https://pro-schools.ru/shkoly/tipy/podgotovka-ege/biologiya/'

export const metadata: Metadata = {
  title: `${TITLE} — медицина и биофак | pro-schools.ru`,
  description: DESC,
  keywords: 'подготовка к ЕГЭ по биологии, школа ЕГЭ биология, онлайн школа биология ЕГЭ, курсы ЕГЭ биология',
  alternates: { canonical: URL },
  openGraph: { title: TITLE, description: DESC, url: URL },
}

export default function EgeBiologiya() {
  const count = schools.filter(s => s.type === 'podgotovka-ege').length
  return (
    <CatalogClient
      initialTypes={['podgotovka-ege']}
      lockType
      title={TITLE}
      subtitle={`${count} центров подготовки к ЕГЭ`}
      breadcrumbs={[
        { label: 'Все школы',                 href: '/shkoly/' },
        { label: 'Центры подготовки к ЕГЭ',  href: '/shkoly/tipy/podgotovka-ege/' },
        { label: 'Биология' },
      ]}
      seoContent={
        <SeoBlock
          type="podgotovka-ege"
          count={count}
          customTitle="ЕГЭ по биологии: как готовиться к поступлению в медицинский"
          customText="Биология — один из самых объёмных ЕГЭ: 58 вопросов по 7 разделам (клетка, организм, экосистемы, генетика, эволюция, анатомия человека). Нужен для поступления в медицинские вузы, ветеринарные академии и на биологические факультеты. Максимальный первичный балл — 59 (100 в переводе). Хорошие курсы по биологии строятся блоками по каждому разделу с обязательными практическими задачами на генетику и экологию — именно они разделяют высокие и средние баллы."
        />
      }
    />
  )
}
