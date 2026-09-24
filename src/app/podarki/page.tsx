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
    <div className="bg-[#F8FAFC] min-h-screen">
      <div className="max-w-6xl mx-auto px-4 py-10 sm:py-14">
        <div className="text-center max-w-2xl mx-auto mb-10">
          <span className="inline-block bg-blue-50 text-[#0369A1] text-xs font-semibold px-3 py-1.5 rounded-full mb-4">
            Подарки читателям портала
          </span>
          <h1 className="text-2xl sm:text-3xl font-bold text-[#0F172A] mb-3">
            Витрина подарков и спецпредложений
          </h1>
          <p className="text-gray-500 leading-relaxed">
            Бесплатная неделя обучения, пробные дни на курсах ЕГЭ и ОГЭ, диагностика с
            репетитором, подбор колледжа и бонусы для поездок на каникулах. Выберите подарок —
            и мы поможем его активировать.
          </p>
        </div>

        <OfferWall place="podarki" />
      </div>
    </div>
  )
}
