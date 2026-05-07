import type { Metadata } from 'next'
import { schools } from '@/data/schools'
import CatalogClient from '@/app/shkoly/CatalogClient'
import SeoBlock from '@/components/SeoBlock'

const TITLE = 'Вечерние онлайн-школы'
const DESC  = 'Вечерние и онлайн-школы России — обучение по вечерам дистанционно. Гос. аттестат, гибкий график, подходит работающим взрослым.'
const URL   = 'https://pro-schools.ru/shkoly/tipy/vechernie/online/'

export const metadata: Metadata = {
  title: `${TITLE} России — каталог | pro-schools.ru`,
  description: DESC,
  keywords: 'вечерняя школа онлайн, вечерняя онлайн школа бесплатно, вечерняя школа дистанционно, дистанционная вечерняя школа',
  alternates: { canonical: URL },
  openGraph: { title: TITLE, description: DESC, url: URL },
}

export default function VechernieOnlinePage() {
  const count = schools.filter(s => s.type === 'vechernie' || s.type === 'online').length
  return (
    <CatalogClient
      initialTypes={['vechernie', 'online']}
      lockType
      title={TITLE}
      subtitle={`${count} школ — вечернее обучение в онлайн-формате`}
      breadcrumbs={[
        { label: 'Все школы',      href: '/shkoly/' },
        { label: 'Вечерние школы', href: '/shkoly/tipy/vechernie/' },
        { label: 'Онлайн' },
      ]}
      seoContent={
        <SeoBlock
          type="vechernie"
          count={count}
          customTitle="Вечерние онлайн-школы: обучение по вечерам из дома"
          customText="Вечерняя онлайн-школа — это полноценное среднее образование в дистанционном формате. Уроки проходят по вечерам в формате видеоконференций, что позволяет совмещать учёбу с работой или другими делами. После окончания выдаётся государственный аттестат. В каталоге представлены как государственные вечерние школы с дистанционной составляющей, так и лицензированные частные онлайн-школы, работающие в вечернее время. Для поступления не нужны вступительные экзамены — достаточно паспорта и документа о предыдущем образовании."
        />
      }
    />
  )
}
