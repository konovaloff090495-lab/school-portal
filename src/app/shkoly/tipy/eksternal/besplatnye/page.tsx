import type { Metadata } from 'next'
import { schools } from '@/data/schools'
import CatalogClient from '@/app/shkoly/CatalogClient'
import SeoBlock from '@/components/SeoBlock'

const TITLE = 'Бесплатный экстернат'
const DESC  = 'Бесплатные государственные школы с формой экстерната — прикрепление к государственной школе для сдачи аттестаций без посещения уроков.'
const URL   = 'https://pro-schools.ru/shkoly/tipy/eksternal/besplatnye/'

export const metadata: Metadata = {
  title: `${TITLE} — государственные школы | pro-schools.ru`,
  description: DESC,
  keywords: 'бесплатный экстернат, школа экстернат бесплатная, государственные школы экстернаты, экстернат бесплатно, бесплатный экстернат 10 11',
  alternates: { canonical: URL },
  openGraph: { title: TITLE, description: DESC, url: URL },
}

export default function EksternalBesplatnyePage() {
  const count = schools.filter(s => s.type === 'eksternal' && (s.priceFrom === 0 || s.priceFrom === undefined)).length
  return (
    <CatalogClient
      initialTypes={['eksternal']}
      initialPriceMode="free"
      lockType
      lockPriceMode
      title={TITLE}
      subtitle={`${count} бесплатных школ-экстернатов`}
      breadcrumbs={[
        { label: 'Все школы',        href: '/shkoly/' },
        { label: 'Школы-экстернаты', href: '/shkoly/tipy/eksternal/' },
        { label: 'Бесплатные' },
      ]}
      seoContent={
        <SeoBlock
          type="eksternal"
          count={count}
          customTitle="Бесплатный экстернат: как прикрепиться к государственной школе"
          customText="По российскому законодательству любой гражданин имеет право прикрепиться к государственной школе в форме экстерната — бесплатно. Для этого нужно подать заявление в выбранную школу с лицензией и аккредитацией. После прикрепления вы самостоятельно осваиваете программу и являетесь только на аттестации. Никаких обязательных платных услуг нет. Платные экстернаты — это частные школы, предоставляющие учебные материалы, кураторов и онлайн-уроки за дополнительную плату."
        />
      }
    />
  )
}
