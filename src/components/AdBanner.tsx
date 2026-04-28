'use client'
import { useState } from 'react'
import LeadForm from './LeadForm'

interface AdBannerProps {
  variant?: 'leaderboard' | 'mobile'
  className?: string
}

function BannerModal({ onClose }: { onClose: () => void }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-white rounded-2xl w-full max-w-md shadow-2xl">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 transition-colors cursor-pointer z-10"
          aria-label="Закрыть"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
        <div className="p-6">
          <LeadForm title="Разместить школу в каталоге" />
        </div>
      </div>
    </div>
  )
}

export default function AdBanner({ variant = 'leaderboard', className = '' }: AdBannerProps) {
  const [modalOpen, setModalOpen] = useState(false)

  if (variant === 'mobile') {
    return (
      <>
        <div
          className={`block md:hidden w-full ${className} cursor-pointer`}
          onClick={() => setModalOpen(true)}
        >
          <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-100 rounded-xl p-3 flex items-center gap-3 hover:border-blue-300 transition-colors">
            <div className="w-10 h-10 bg-[#0369A1] rounded-lg flex items-center justify-center shrink-0">
              <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 18.75a6 6 0 006-6v-1.5m-6 7.5a6 6 0 01-6-6v-1.5m6 7.5v3.75m-3.75 0h7.5M12 15.75a3 3 0 01-3-3V4.5a3 3 0 116 0v8.25a3 3 0 01-3 3z" />
              </svg>
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-semibold text-[#0F172A]">Реклама</p>
              <p className="text-xs text-gray-500 truncate">Разместите вашу школу в каталоге — от 990 ₽/мес</p>
            </div>
            <span className="text-xs text-[#0369A1] font-semibold whitespace-nowrap">
              Подробнее
            </span>
          </div>
        </div>
        {modalOpen && <BannerModal onClose={() => setModalOpen(false)} />}
      </>
    )
  }

  return (
    <>
      <div
        className={`hidden md:block w-full ${className} cursor-pointer`}
        onClick={() => setModalOpen(true)}
      >
        <div className="bg-gradient-to-r from-slate-800 to-[#0F172A] rounded-2xl p-5 flex items-center gap-6 border border-white/5 hover:border-white/20 transition-colors">
          <div className="w-14 h-14 bg-[#0369A1] rounded-xl flex items-center justify-center shrink-0">
            <svg className="w-7 h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M10.34 15.84c-.688-.06-1.386-.09-2.09-.09H7.5a4.5 4.5 0 110-9h.75c.704 0 1.402-.03 2.09-.09m0 9.18c.253.962.584 1.892.985 2.783.247.55.06 1.21-.463 1.511l-.657.38c-.551.318-1.26.117-1.527-.461a20.845 20.845 0 01-1.44-4.282m3.102.069a18.03 18.03 0 01-.59-4.59c0-1.586.205-3.124.59-4.59m0 9.18a23.848 23.848 0 018.835 2.535M10.34 6.66a23.847 23.847 0 008.835-2.535m0 0A23.74 23.74 0 0018.795 3m.38 1.125a23.91 23.91 0 011.014 5.395m-1.014 8.855c-.118.38-.245.754-.38 1.125m.38-1.125a23.91 23.91 0 001.014-5.395m0-3.46c.495.413.811 1.035.811 1.73 0 .695-.316 1.317-.811 1.73m0-3.46a24.347 24.347 0 010 3.46" />
            </svg>
          </div>
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-1">
              <span className="text-xs text-gray-400 bg-white/10 px-2 py-0.5 rounded-full">Реклама</span>
            </div>
            <p className="text-white font-semibold text-base">Разместите вашу школу в каталоге ШколыРоссии.рф</p>
            <p className="text-gray-400 text-sm mt-0.5">Более 10 000 родителей ежемесячно ищут школы. Тарифы от 990 ₽/мес</p>
          </div>
          <button
            onClick={e => { e.stopPropagation(); setModalOpen(true) }}
            className="shrink-0 bg-[#0369A1] hover:bg-blue-500 text-white px-5 py-2.5 rounded-xl font-semibold text-sm transition-colors duration-200 cursor-pointer"
          >
            Оставить заявку
          </button>
        </div>
      </div>
      {modalOpen && <BannerModal onClose={() => setModalOpen(false)} />}
    </>
  )
}
