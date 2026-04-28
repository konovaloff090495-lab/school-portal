import type { Metadata } from 'next'
import Link from 'next/link'

export const metadata: Metadata = {
  title: 'Заявка принята — ШколыРоссии.рф',
  robots: { index: false, follow: false },
}

export default function SpasiboPAge() {
  return (
    <div className="min-h-[60vh] flex items-center justify-center px-4">
      <div className="text-center max-w-md">
        <div className="w-20 h-20 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-6">
          <svg className="w-10 h-10 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M4.5 12.75l6 6 9-13.5" />
          </svg>
        </div>
        <h1 className="text-2xl font-bold text-[#0F172A] mb-3">Заявка принята!</h1>
        <p className="text-gray-500 mb-2 leading-relaxed">
          Спасибо! Мы получили вашу заявку и перезвоним в течение 30 минут.
        </p>
        <p className="text-sm text-gray-400 mb-8">
          Если вопрос срочный — напишите нам напрямую:{' '}
          <a href="mailto:info@pro-schools.ru" className="text-[#0369A1] hover:underline">
            info@pro-schools.ru
          </a>
        </p>
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Link
            href="/shkoly/"
            className="bg-[#0369A1] hover:bg-blue-500 text-white px-6 py-3 rounded-xl font-semibold text-sm transition-colors duration-200 cursor-pointer"
          >
            Смотреть другие школы
          </Link>
          <Link
            href="/"
            className="bg-white border-2 border-gray-200 hover:border-[#0369A1] text-[#0F172A] px-6 py-3 rounded-xl font-semibold text-sm transition-colors duration-200 cursor-pointer"
          >
            На главную
          </Link>
        </div>
      </div>
    </div>
  )
}
