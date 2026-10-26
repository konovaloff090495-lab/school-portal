'use client'

import { suUrl } from '@/lib/su-products'

import { useState, useEffect } from 'react'
import { usePathname } from 'next/navigation'
import Countdown, { DEADLINE_LABEL, isDeadlinePassed } from '@/components/Countdown'

const YM_ID = 108789843
const STORAGE_KEY = 'ps_partner_banner_closed'
const COOLDOWN_MS = 24 * 60 * 60 * 1000
// 24.09.2026: растяжка каталога переведена на school-university.com, метка прежняя.
const PARTNER_URL = suUrl('online-school', 'catalog-sticky')

function recentlyClosed(): boolean {
  try { return Date.now() - Number(localStorage.getItem(STORAGE_KEY) || 0) < COOLDOWN_MS }
  catch { return false }
}

export default function PartnerStickyBanner() {
  const pathname = usePathname()
  const adult = /vechern|eksternal|attestat-vzroslomu/.test(pathname)
  const [visible, setVisible] = useState(false)
  const [formVisible, setFormVisible] = useState(false)

  useEffect(() => {
    if (recentlyClosed()) return
    const onScroll = () => { if (window.scrollY > 250) setVisible(true) }
    onScroll()
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  useEffect(() => {
    const forms = new Set<Element>()
    const observer = new IntersectionObserver(entries => {
      for (const entry of entries) {
        if (entry.isIntersecting) forms.add(entry.target)
        else forms.delete(entry.target)
      }
      setFormVisible(forms.size > 0)
    }, { threshold: 0, rootMargin: '0px 0px 120px 0px' })
    document.querySelectorAll('form[data-growth-form]').forEach(form => observer.observe(form))
    return () => observer.disconnect()
  }, [pathname])

  function close(e: React.MouseEvent) {
    e.preventDefault(); e.stopPropagation()
    setVisible(false)
    try { localStorage.setItem(STORAGE_KEY, String(Date.now())) } catch {}
  }

  if (!visible || formVisible) return null

  return (
    <div data-partner-sticky-banner className="fixed bottom-0 left-0 right-0 z-40 bg-gradient-to-r from-[#0F3A5F] to-[#0369A1] text-white shadow-[0_-4px_20px_rgba(0,0,0,0.25)]">
      <div className="max-w-6xl mx-auto px-4 py-2 flex items-center gap-3 sm:gap-4">
        <span className="hidden sm:inline text-2xl shrink-0">🎓</span>
        <p className="flex-1 min-w-0 text-sm sm:text-base font-medium leading-tight">
          {adult ? 'Аттестат взрослому: платные онлайн-программы 9 и 11 класса' : 'Платное онлайн-обучение Синергии: сравните условия'}
        </p>
        <div className="hidden md:flex items-center gap-2 shrink-0">
          {!isDeadlinePassed() && <span className="text-[11px] text-white/70 whitespace-nowrap">{DEADLINE_LABEL}</span>}
          <Countdown variant="dark" compact />
        </div>
        <a
          href={adult ? '/attestat-vzroslomu/' : PARTNER_URL}
          target={adult ? undefined : '_blank'}
          rel={adult ? undefined : 'noopener sponsored'}
          onClick={() => window.ym?.(YM_ID, 'reachGoal', 'partner_banner_click', { page_path: pathname, offer: adult ? 'adult-route-v1' : 'online-school' })}
          className="shrink-0 bg-white text-[#0369A1] text-sm font-semibold px-4 py-2 rounded-lg hover:bg-blue-50 transition-colors cursor-pointer whitespace-nowrap"
        >
          {adult ? 'Выбрать маршрут' : 'Узнать детали'}
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
