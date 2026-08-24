'use client'

import { useState, useEffect } from 'react'
import Countdown from '@/components/Countdown'

const YM_ID = 108789843
const STORAGE_KEY = 'ps_partner_banner_closed'
const COOLDOWN_MS = 24 * 60 * 60 * 1000
const PARTNER_URL = 'https://schooluniversity.ru/online-school?utm_source=gerasimov_lav&utm_medium=lkpartners#telegrampopup'

function recentlyClosed(): boolean {
  try { return Date.now() - Number(localStorage.getItem(STORAGE_KEY) || 0) < COOLDOWN_MS }
  catch { return false }
}

export default function PartnerStickyBanner() {
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    if (recentlyClosed()) return
    const onScroll = () => { if (window.scrollY > 250) setVisible(true) }
    onScroll()
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  function close(e: React.MouseEvent) {
    e.preventDefault(); e.stopPropagation()
    setVisible(false)
    try { localStorage.setItem(STORAGE_KEY, String(Date.now())) } catch {}
  }

  if (!visible) return null

  return (
    <div className="fixed bottom-0 left-0 right-0 z-40 bg-gradient-to-r from-[#0F3A5F] to-[#0369A1] text-white shadow-[0_-4px_20px_rgba(0,0,0,0.25)]">
      <div className="max-w-6xl mx-auto px-4 py-2 flex items-center gap-3 sm:gap-4">
        <span className="hidden sm:inline text-2xl shrink-0">🎓</span>
        <p className="flex-1 min-w-0 text-sm sm:text-base font-medium leading-tight">
          Поступите в онлайн-школу на льготных условиях
        </p>
        <div className="hidden md:flex items-center gap-2 shrink-0">
          <span className="text-[11px] text-white/70 whitespace-nowrap">до 31 августа</span>
          <Countdown variant="dark" compact />
        </div>
        <a
          href={PARTNER_URL}
          target="_blank"
          rel="noopener sponsored"
          onClick={() => window.ym?.(YM_ID, 'reachGoal', 'partner_banner_click')}
          className="shrink-0 bg-white text-[#0369A1] text-sm font-semibold px-4 py-2 rounded-lg hover:bg-blue-50 transition-colors cursor-pointer whitespace-nowrap"
        >
          Узнать детали
        </a>
        <button
          onClick={close}
          aria-label="Закрыть"
          className="shrink-0 text-white/70 hover:text-white cursor-pointer p-1"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>
    </div>
  )
}
