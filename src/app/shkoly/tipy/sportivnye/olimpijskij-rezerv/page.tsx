import type { Metadata } from 'next'
import { schools } from '@/data/schools'
import CatalogClient from '@/app/shkoly/CatalogClient'
import SeoBlock from '@/components/SeoBlock'

const TITLE = 'Школы олимпийского резерва (СШОР)'
const DESC  = 'Школы олимпийского резерва (СШОР) и ДЮСШ в России — профессиональная подготовка спортсменов, отбор в сборные, тренировки на уровне мастера спорта. Каталог с адресами.'
const URL   = 'https://pro-schools.ru/shkoly/tipy/sportivnye/olimpijskij-rezerv/'

export const metadata: Metadata = {
  title: `${TITLE} — ДЮСШ и спортивный резерв | pro-schools.ru`,
  description: DESC,
  keywords: 'школа олимпийского резерва, СШОР, детско-юношеская спортивная школа олимпийского резерва, школа спортивного резерва, ДЮСШ',
  alternates: { canonical: URL },
  openGraph: { title: TITLE, description: DESC, url: URL },
}

export default function SportivnyeOlimpijskijRezерv() {
  const count = schools.filter(s => s.type === 'sportivnye').length
  return (
    <CatalogClient
      initialTypes={['sportivnye']}
      lockType
      title={TITLE}
      subtitle={`${count} спортивных школ — включая СШОР и ДЮСШ`}
      breadcrumbs={[
        { label: 'Все школы',         href: '/shkoly/' },
        { label: 'Спортивные школы',  href: '/shkoly/tipy/sportivnye/' },
        { label: 'Олимпийский резерв' },
      ]}
      seoContent={
        <SeoBlock
          type="sportivnye"
          count={count}
          customTitle="СШОР и ДЮСШ: как попасть в школу олимпийского резерва"
          customText="Школы олимпийского резерва (СШОР) — государственные спортивные учреждения, которые готовят спортсменов для включения в составы сборных регионов и страны. Зачисление — по конкурсу после просмотра или сдачи нормативов. Обучение бесплатное: государство обеспечивает инвентарь, форму, соревновательный календарь и выезды. Возраст набора зависит от вида спорта — в гимнастику берут с 4–5 лет, в единоборства с 7–8, в командные игры с 6–7. ДЮСШ (детско-юношеские спортивные школы) — более массовый формат с широким набором и меньшим отбором."
        />
      }
    />
  )
}
