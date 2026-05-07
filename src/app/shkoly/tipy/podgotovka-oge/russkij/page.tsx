import type { Metadata } from 'next'
import { schools } from '@/data/schools'
import CatalogClient from '@/app/shkoly/CatalogClient'
import SeoBlock from '@/components/SeoBlock'

const TITLE = 'Подготовка к ОГЭ по русскому языку'
const DESC  = 'Школы и курсы подготовки к ОГЭ по русскому языку — изложение, сочинение-рассуждение, тестовая часть. Очные и онлайн-форматы для учеников 9 класса.'
const URL   = 'https://pro-schools.ru/shkoly/tipy/podgotovka-oge/russkij/'

export const metadata: Metadata = {
  title: `${TITLE} — изложение и сочинение | pro-schools.ru`,
  description: DESC,
  keywords: 'подготовка к ОГЭ по русскому языку, школа ОГЭ русский, ОГЭ русский язык 9 класс курсы, онлайн ОГЭ русский язык',
  alternates: { canonical: URL },
  openGraph: { title: TITLE, description: DESC, url: URL },
}

export default function OgeRusskij() {
  const count = schools.filter(s => s.type === 'podgotovka-oge').length
  return (
    <CatalogClient
      initialTypes={['podgotovka-oge']}
      lockType
      title={TITLE}
      subtitle={`${count} центров подготовки к ОГЭ`}
      breadcrumbs={[
        { label: 'Все школы',                 href: '/shkoly/' },
        { label: 'Центры подготовки к ОГЭ',  href: '/shkoly/tipy/podgotovka-oge/' },
        { label: 'Русский язык' },
      ]}
      seoContent={
        <SeoBlock
          type="podgotovka-oge"
          count={count}
          customTitle="ОГЭ по русскому языку: изложение, сочинение, тест"
          customText="ОГЭ по русскому языку состоит из трёх частей: сжатое изложение (аудирование), тестовые задания (правописание, синтаксис, лексика) и сочинение-рассуждение на одну из трёх тем. Самая частая проблема — изложение: нужно услышать текст дважды, выделить главные мысли и пересказать кратко, сохранив структуру. Хороший курс по русскому для ОГЭ тренирует все три части по актуальным демоверсиям ФИПИ и учит соблюдать объём и критерии."
        />
      }
    />
  )
}
