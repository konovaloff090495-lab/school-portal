import type { Metadata } from 'next'
import { schools } from '@/data/schools'
import CatalogClient from '@/app/shkoly/CatalogClient'
import SeoBlock from '@/components/SeoBlock'

const TITLE = 'Спортивные школы плавания'
const DESC  = 'Спортивные школы и секции плавания в России — обучение детей с нуля, СШОР по плаванию, синхронное плавание и водное поло. Каталог с адресами и условиями набора.'
const URL   = 'https://pro-schools.ru/shkoly/tipy/sportivnye/plavanie/'

export const metadata: Metadata = {
  title: `${TITLE} — СШОР и секции | pro-schools.ru`,
  description: DESC,
  keywords: 'школа плавания, спортивная школа по плаванию, СШОР плавание, детская школа плавания, секция плавания',
  alternates: { canonical: URL },
  openGraph: { title: TITLE, description: DESC, url: URL },
}

export default function SportivnyePlavanie() {
  const count = schools.filter(s => s.type === 'sportivnye').length
  return (
    <CatalogClient
      initialTypes={['sportivnye']}
      lockType
      title={TITLE}
      subtitle={`${count} спортивных школ — включая секции плавания`}
      breadcrumbs={[
        { label: 'Все школы',        href: '/shkoly/' },
        { label: 'Спортивные школы', href: '/shkoly/tipy/sportivnye/' },
        { label: 'Плавание' },
      ]}
      seoContent={
        <SeoBlock
          type="sportivnye"
          count={count}
          customTitle="Школы плавания: как выбрать секцию и когда начать"
          customText="Плавание — один из немногих видов спорта, где нет жёсткого верхнего возрастного порога: начать заниматься можно в 5–7 лет и всё равно добиться хороших результатов. СШОР по плаванию принимают детей с 6–8 лет, частные секции при бассейнах — с 3–4 лет. Государственные спортивные школы плавания бесплатны при наличии собственного бассейна; занятия 4–6 раз в неделю. Помимо спортивного плавания, в ряде школ есть секции синхронного плавания и водного поло."
        />
      }
    />
  )
}
