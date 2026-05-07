import type { Metadata } from 'next'
import { schools } from '@/data/schools'
import CatalogClient from '@/app/shkoly/CatalogClient'
import SeoBlock from '@/components/SeoBlock'

const TITLE = 'Школы спортивной и художественной гимнастики'
const DESC  = 'Спортивные школы гимнастики в России — спортивная и художественная гимнастика, акробатика. Секции с ранней записью, профессиональная подготовка, СШОР по гимнастике.'
const URL   = 'https://pro-schools.ru/shkoly/tipy/sportivnye/gimnastika/'

export const metadata: Metadata = {
  title: `${TITLE} — секции и СШОР | pro-schools.ru`,
  description: DESC,
  keywords: 'школа спортивной гимнастики, спортивная школа гимнастики, школа художественной гимнастики, СШОР гимнастика',
  alternates: { canonical: URL },
  openGraph: { title: TITLE, description: DESC, url: URL },
}

export default function SportivnyeGimnastika() {
  const count = schools.filter(s => s.type === 'sportivnye').length
  return (
    <CatalogClient
      initialTypes={['sportivnye']}
      lockType
      title={TITLE}
      subtitle={`${count} спортивных школ — включая секции гимнастики`}
      breadcrumbs={[
        { label: 'Все школы',        href: '/shkoly/' },
        { label: 'Спортивные школы', href: '/shkoly/tipy/sportivnye/' },
        { label: 'Гимнастика' },
      ]}
      seoContent={
        <SeoBlock
          type="sportivnye"
          count={count}
          customTitle="Школы гимнастики: спортивная vs художественная — в чём разница"
          customText="Спортивная гимнастика развивает силу, прыжковую технику и работу на снарядах (брусья, бревно, конь), художественная — пластику, хореографию и работу с предметами (обруч, мяч, лента). В обоих видах набор начинается с 4–5 лет: чем раньше, тем лучше для развития гибкости и координации. Государственные СШОР по гимнастике — бесплатные, частные гимнастические клубы берут от 3 000 до 15 000 рублей в месяц. При серьёзной подготовке занятия проходят 4–6 раз в неделю."
        />
      }
    />
  )
}
