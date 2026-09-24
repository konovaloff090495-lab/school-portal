import type { Metadata } from 'next'
import Link from 'next/link'
import OfferWall from '@/components/offerwall/OfferWall'

export const metadata: Metadata = {
  title: 'Заявка принята — ШколыРоссии.рф',
  robots: { index: false, follow: false },
}

export default function SpasiboPage() {
  return (
    <div className="bg-[#F8FAFC] min-h-screen">
      <div className="max-w-6xl mx-auto px-4 py-10 sm:py-14">
        <div className="text-center max-w-2xl mx-auto mb-10">
          <div className="w-16 h-16 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-5">
            <svg className="w-8 h-8 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M4.5 12.75l6 6 9-13.5" />
            </svg>
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold text-[#0F172A] mb-3">
            Заявка принята — перезвоним в течение 30 минут
          </h1>
          <p className="text-gray-500 leading-relaxed">
            А пока выберите подарок: бесплатная неделя обучения, пробный день на курсах,
            диагностика с репетитором и другие предложения наших партнёров. Контакты уже
            заполнены — забрать можно в два клика.
          </p>
        </div>

        <OfferWall place="spasibo" />

        <div className="mt-12 text-center">
          <p className="text-sm text-gray-400 mb-4">
            Если вопрос срочный — напишите:{' '}
            <a href="mailto:info@pro-schools.ru" className="text-[#0369A1] hover:underline">
              info@pro-schools.ru
            </a>
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Link
              href="/shkoly/"
              className="bg-white border-2 border-gray-200 hover:border-[#0369A1] text-[#0F172A] px-6 py-3 rounded-xl font-semibold text-sm transition-colors"
            >
              Смотреть другие школы
            </Link>
            <Link
              href="/"
              className="bg-white border-2 border-gray-200 hover:border-[#0369A1] text-[#0F172A] px-6 py-3 rounded-xl font-semibold text-sm transition-colors"
            >
              На главную
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}
