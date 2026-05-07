import type { Metadata } from 'next'
import { schools } from '@/data/schools'
import CatalogClient from '@/app/shkoly/CatalogClient'
import SeoBlock from '@/components/SeoBlock'

const TITLE = 'Подготовка к ЕГЭ по русскому языку'
const DESC  = 'Школы и курсы подготовки к ЕГЭ по русскому языку — работа с текстом, сочинение, тесты. Очные и онлайн-форматы, подготовка к части 2, разбор критериев оценивания.'
const URL   = 'https://pro-schools.ru/shkoly/tipy/podgotovka-ege/russkij/'

export const metadata: Metadata = {
  title: `${TITLE} — школы и курсы | pro-schools.ru`,
  description: DESC,
  keywords: 'подготовка к ЕГЭ по русскому языку, школа ЕГЭ русский, онлайн школа ЕГЭ русский язык, курсы ЕГЭ русский язык',
  alternates: { canonical: URL },
  openGraph: { title: TITLE, description: DESC, url: URL },
}

export default function EgeRusskij() {
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
        { label: 'Русский язык' },
      ]}
      seoContent={
        <SeoBlock
          type="podgotovka-ege"
          count={count}
          customTitle="ЕГЭ по русскому: как набрать 90+ баллов"
          customText="Русский язык — обязательный ЕГЭ, который сдают все выпускники. Максимум — 100 баллов. Слабые места большинства учеников: сочинение-рассуждение (часть 2, до 24 первичных баллов), задания на орфографию и пунктуацию (часть 1). Хорошая школа подготовки учит разбирать критерии проверки сочинения, работать с позицией автора и формулировать свою аргументацию — именно это даёт 85–95 баллов при стабильной подготовке."
        />
      }
    />
  )
}
