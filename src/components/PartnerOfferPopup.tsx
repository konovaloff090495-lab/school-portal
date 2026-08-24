'use client'

import { useState, useEffect, useCallback } from 'react'

const YM_ID = 108789843
const STORAGE_KEY = 'ps_partner_offer_seen'
const COOLDOWN_MS = 12 * 60 * 60 * 1000
const PARTNER_URL = 'https://schooluniversity.ru/online-school?utm_source=gerasimov_lav&utm_medium=lkpartners'

function recentlySeen(): boolean {
  try { return Date.now() - Number(localStorage.getItem(STORAGE_KEY) || 0) < COOLDOWN_MS }
  catch { return false }
}
function markSeen() {
  try { localStorage.setItem(STORAGE_KEY, String(Date.now())) } catch {}
}

export default function PartnerOfferPopup() {
  const [open, setOpen] = useState(false)

  const show = useCallback(() => {
    if (recentlySeen()) return
    setOpen(true)
    markSeen()
    window.ym?.(YM_ID, 'reachGoal', 'partner_popup_shown')
  }, [])

  useEffect(() => {
    if (recentlySeen()) return
    const timer = setTimeout(show, 8000)
    const onScroll = () => {
      const scrolled = window.scrollY / (document.body.scrollHeight - window.innerHeight || 1)
      if (scrolled > 0.4) show()
    }
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => { clearTimeout(timer); window.removeEventListener('scroll', onScroll) }
  }, [show])

  if (!open) return null

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setOpen(false)} />

      <div className="relative w-full max-w-md bg-white rounded-2xl shadow-2xl overflow-hidden">
        <button
          onClick={() => setOpen(false)}
          aria-label="Закрыть"
          className="absolute top-3 right-3 text-white/90 hover:text-white cursor-pointer z-10"
        >
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>

        {/* Фото-шапка */}
        <div className="h-36 relative bg-blue-100">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/attestat-popup.jpg" alt="Выпускница с аттестатом" className="absolute inset-0 w-full h-full object-cover object-top" />
          <div className="absolute inset-0 bg-gradient-to-t from-[#0F3A5F]/80 to-transparent" />
        </div>

        <div className="p-5 sm:p-6">
          <h3 className="text-lg sm:text-xl font-bold text-[#0F172A] leading-snug mb-2">
            Поступите в школу, вуз и колледж на льготных условиях
          </h3>
          <p className="text-sm text-gray-600 mb-4">
            Бюджет, очная, заочная, семейная форма, онлайн-обучение — подберём подходящий формат под ваши цели.
          </p>
          <a
            href={PARTNER_URL}
            target="_blank"
            rel="noopener sponsored"
            onClick={() => window.ym?.(YM_ID, 'reachGoal', 'partner_popup_click')}
            className="block w-full text-center bg-[#0369A1] text-white py-3 rounded-lg text-sm font-semibold hover:bg-blue-500 transition-colors cursor-pointer"
          >
            Узнать детали
          </a>
        </div>
      </div>
    </div>
  )
}
