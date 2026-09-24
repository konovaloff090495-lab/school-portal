import type { Metadata } from 'next'
import Link from 'next/link'
import OfferWall from '@/components/offerwall/OfferWall'

export const metadata: Metadata = {
  title: 'Заявка принята — ШколыРоссии.рф',
  robots: { index: false, follow: false },
}

export default function SpasiboPage() {
  return (
    <div className="bg-white">
      <OfferWall
        place="spasibo"
        kicker="Заявка принята"
        title="Выберите подарок"
        subtitle="Перезвоним в течение 30 минут. А пока заберите один из подарков — ваши контакты уже заполнены, это два клика."
      />

      <div className="max-w-4xl mx-auto px-4 pb-16 text-center">
        <p className="text-sm text-gray-400 mb-4">
          Если вопрос срочный — напишите:{' '}
          <a href="mailto:info@pro-schools.ru" className="text-[#C2410C] hover:underline">
            info@pro-schools.ru
          </a>
        </p>
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Link
            href="/shkoly/"
            className="bg-white border-2 border-gray-200 hover:border-[#FF6B3D] text-[#1A1814] px-6 py-3 rounded-xl font-semibold text-sm transition-colors"
          >
            Смотреть другие школы
          </Link>
          <Link
            href="/"
            className="bg-white border-2 border-gray-200 hover:border-[#FF6B3D] text-[#1A1814] px-6 py-3 rounded-xl font-semibold text-sm transition-colors"
          >
            На главную
          </Link>
        </div>
      </div>
    </div>
  )
}
