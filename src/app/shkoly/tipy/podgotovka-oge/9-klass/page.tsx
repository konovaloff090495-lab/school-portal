import type { Metadata } from 'next'
import { schools } from '@/data/schools'
import CatalogClient from '@/app/shkoly/CatalogClient'
import SeoBlock from '@/components/SeoBlock'

const TITLE = 'Подготовка к ОГЭ в 9 классе'
const DESC  = 'Центры подготовки к ОГЭ для учеников 9 класса — все обязательные и выборные предметы, пробные экзамены, очно и онлайн. Как выбрать курс и с чего начать.'
const URL   = 'https://pro-schools.ru/shkoly/tipy/podgotovka-oge/9-klass/'

export const metadata: Metadata = {
  title: `${TITLE} — все предметы | pro-schools.ru`,
  description: DESC,
  keywords: 'подготовка к ОГЭ 9 класс, ОГЭ 9 класс школа, школа для подготовки к ОГЭ 9 класс, курсы ОГЭ 9 класс',
  alternates: { canonical: URL },
  openGraph: { title: TITLE, description: DESC, url: URL },
}

export default function Oge9Klass() {
  const count = schools.filter(s => s.type === 'podgotovka-oge').length
  return (
    <CatalogClient
      initialTypes={['podgotovka-oge']}
      initialLevels={['middle']}
      lockType
      lockLevels
      title={TITLE}
      subtitle={`${count} центров подготовки к ОГЭ для 9 класса`}
      breadcrumbs={[
        { label: 'Все школы',                 href: '/shkoly/' },
        { label: 'Центры подготовки к ОГЭ',  href: '/shkoly/tipy/podgotovka-oge/' },
        { label: '9 класс' },
      ]}
      seoContent={
        <SeoBlock
          type="podgotovka-oge"
          count={count}
          customTitle="ОГЭ в 9 классе: когда начать готовиться и что нужно знать"
          customText="ОГЭ сдают все ученики 9 класса: два обязательных экзамена (математика и русский язык) плюс два предмета на выбор. Выборные предметы выбирают заранее — обычно исходя из профиля 10–11 класса или специальности в колледже. Начинать подготовку лучше в начале 9 класса или даже летом после 8-го: это даёт время разобраться с пробелами и потренироваться на пробных вариантах. Центры подготовки к ОГЭ предлагают курсы как по одному предмету, так и комплексные пакеты на все экзамены."
        />
      }
    />
  )
}
