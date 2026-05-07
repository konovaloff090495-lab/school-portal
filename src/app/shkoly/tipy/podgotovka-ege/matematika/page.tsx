import type { Metadata } from 'next'
import { schools } from '@/data/schools'
import CatalogClient from '@/app/shkoly/CatalogClient'
import SeoBlock from '@/components/SeoBlock'

const TITLE = 'Подготовка к ЕГЭ по математике'
const DESC  = 'Школы и курсы подготовки к ЕГЭ по математике — профиль и база. Очные центры и онлайн-школы, пробные варианты, разбор заданий. Рейтинг с отзывами.'
const URL   = 'https://pro-schools.ru/shkoly/tipy/podgotovka-ege/matematika/'

export const metadata: Metadata = {
  title: `${TITLE} — профиль и база | pro-schools.ru`,
  description: DESC,
  keywords: 'подготовка к ЕГЭ по математике, школа ЕГЭ математика профиль, лучшие школы по профильной математике, онлайн школа ЕГЭ математика',
  alternates: { canonical: URL },
  openGraph: { title: TITLE, description: DESC, url: URL },
}

export default function EgeMatematika() {
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
        { label: 'Математика' },
      ]}
      seoContent={
        <SeoBlock
          type="podgotovka-ege"
          count={count}
          customTitle="ЕГЭ по математике: профиль vs база — что выбрать и где готовиться"
          customText="ЕГЭ по математике существует в двух форматах: профильный (нужен для поступления на технические, экономические и естественно-научные специальности) и базовый (засчитывается как аттестация, не даёт баллов для поступления в вуз). Хорошая школа подготовки разберёт каждое задание — от стандартных задач части 1 до сложных уравнений и геометрии в части 2. Важно выбирать курсы, где преподаватели работают по актуальным демоверсиям ФИПИ."
        />
      }
    />
  )
}
