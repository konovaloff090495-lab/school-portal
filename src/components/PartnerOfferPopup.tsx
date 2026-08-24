'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { usePathname } from 'next/navigation'

const YM_ID = 108789843
// Агрессивный режим (как оффер-поп-ап card-open.ru): показ на КАЖДОЙ статье,
// единственный гейт — клик по CTA в этой сессии. Закрытие крестиком не подавляет.
const DONE_KEY = 'ps_partner_popup_done'
const DELAY_MS = 6000
const PARTNER_URL = 'https://schooluniversity.ru/online-school?utm_source=gerasimov_lav&utm_medium=lkpartners'

const FORMATS = ['Бюджет', 'Очная', 'Заочная', 'Семейная форма', 'Онлайн-обучение']

function clickedThisSession(): boolean {
  try { return !!sessionStorage.getItem(DONE_KEY) } catch { return false }
}

export default function PartnerOfferPopup() {
  const pathname = usePathname()
  const [open, setOpen] = useState(false)
  const openedRef = useRef(false)

  const show = useCallback(() => {
    if (openedRef.current || clickedThisSession()) return
    openedRef.current = true
    setOpen(true)
    window.ym?.(YM_ID, 'reachGoal', 'partner_popup_shown')
  }, [])

  // Перезапуск на каждый переход по статьям (layout в SPA не перемонтируется).
  useEffect(() => {
    if (clickedThisSession()) return
    openedRef.current = false
    const timer = setTimeout(show, DELAY_MS)
    const onScroll = () => {
      const scrolled = window.scrollY / (document.body.scrollHeight - window.innerHeight || 1)
      if (scrolled > 0.3) show()
    }
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => { clearTimeout(timer); window.removeEventListener('scroll', onScroll) }
  }, [pathname, show])

  function handleCta() {
    window.ym?.(YM_ID, 'reachGoal', 'partner_popup_click')
    try { sessionStorage.setItem(DONE_KEY, '1') } catch {}
    setOpen(false)
  }

  if (!open) return null

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setOpen(false)} />

      <div className="relative w-full max-w-2xl bg-white rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[94vh]">
        <button
          onClick={() => setOpen(false)}
          aria-label="Закрыть"
          className="absolute top-3 right-3 text-white bg-black/30 hover:bg-black/50 rounded-full p-1 cursor-pointer z-10"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>

        {/* Фото-шапка */}
        <div className="h-52 sm:h-64 shrink-0 relative bg-blue-100">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/diplom-popup.jpg" alt="Вручение дипломов государственного образца" className="absolute inset-0 w-full h-full object-cover object-top" />
          <div className="absolute inset-0 bg-gradient-to-t from-[#0F3A5F]/70 to-transparent" />
        </div>

        <div className="p-6 sm:p-8 overflow-y-auto">
          <h3 className="text-xl sm:text-2xl font-bold text-[#0F172A] leading-snug mb-3">
            Поступите в школу, вуз и колледж на льготных условиях
          </h3>
          <p className="text-sm sm:text-base text-gray-600 mb-4">
            Подберём подходящий формат обучения под ваши цели — от бюджетных мест до онлайн-обучения.
          </p>

          <div className="flex flex-wrap gap-2 mb-6">
            {FORMATS.map(f => (
              <span key={f} className="bg-blue-50 text-[#0369A1] text-xs sm:text-sm font-medium px-3 py-1.5 rounded-full border border-blue-100">
                {f}
              </span>
            ))}
          </div>

          <a
            href={PARTNER_URL}
            target="_blank"
            rel="noopener sponsored"
            onClick={handleCta}
            className="block w-full text-center bg-[#0369A1] text-white py-3.5 rounded-xl text-base font-semibold hover:bg-blue-500 transition-colors cursor-pointer"
          >
            Узнать детали
          </a>
        </div>
      </div>
    </div>
  )
}
