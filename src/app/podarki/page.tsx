import type { Metadata } from 'next'
import OfferWall from '@/components/offerwall/OfferWall'

// Та же витрина подарков, но как самостоятельная страница: на неё можно вести людей
// из писем, SMS и с других наших сайтов, а не только после заявки. Не индексируется.
export const metadata: Metadata = {
  title: 'Подарки и спецпредложения — ШколыРоссии.рф',
  robots: { index: false, follow: false },
}

export default function PodarkiPage() {
  return (
    <OfferWall
      place="podarki"
      kicker="Подарки читателям портала"
      title="Выберите подарок"
      subtitle="Бесплатная неделя обучения, пробные дни на курсах ЕГЭ и ОГЭ, диагностика с репетитором, подбор колледжа и бонусы на каникулы."
    />
  )
}
