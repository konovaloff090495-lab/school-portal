import type { Metadata } from 'next'
import { schools } from '@/data/schools'
import CatalogClient from '@/app/shkoly/CatalogClient'
import SeoBlock from '@/components/SeoBlock'

const TITLE = 'Подготовка к ОГЭ по математике'
const DESC  = 'Школы и курсы подготовки к ОГЭ по математике для 9 класса — разбор заданий, пробные варианты, работа с модулями «Алгебра» и «Геометрия». Очные и онлайн-форматы.'
const URL   = 'https://pro-schools.ru/shkoly/tipy/podgotovka-oge/matematika/'

export const metadata: Metadata = {
  title: `${TITLE} — 9 класс, курсы | pro-schools.ru`,
  description: DESC,
  keywords: 'подготовка к ОГЭ по математике, ОГЭ математика 9 класс школа, курсы ОГЭ математика, онлайн ОГЭ математика',
  alternates: { canonical: URL },
  openGraph: { title: TITLE, description: DESC, url: URL },
}

export default function OgeMatematika() {
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
        { label: 'Математика' },
      ]}
      seoContent={
        <SeoBlock
          type="podgotovka-oge"
          count={count}
          customTitle="ОГЭ по математике: как получить 4 и 5"
          customText="ОГЭ по математике — обязательный экзамен 9 класса из двух модулей: «Алгебра» (20 заданий) и «Геометрия» (8 заданий). Для получения «4» нужно набрать 18–21 балл, для «5» — 22 и выше из 32 возможных. Самые частые ошибки — задачи на геометрию, уравнения с дробями и задачи на проценты и вероятности. Хорошие курсы по математике для ОГЭ начинают с диагностики, закрывают пробелы по каждой теме и проводят пробные экзамены по формату ФИПИ."
        />
      }
    />
  )
}
