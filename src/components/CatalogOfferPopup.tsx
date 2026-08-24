'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import Link from 'next/link'
import { formatPhone, validatePhone } from '@/lib/phone'
import Countdown from '@/components/Countdown'

const YM_ID = 108789843
// Единственный жёсткий гейт — заявка оставлена в этой сессии (как «клик по CTA» на card-open.ru).
// Пока заявки нет — поп-ап показывается на КАЖДОЙ странице каталога. Закрытие крестиком не подавляет.
const DONE_KEY = 'ps_catalog_popup_done'
const DELAY_MS = 6000
const SOURCE = 'Поп-ап «последняя волна» (каталог школ)'

function convertedThisSession(): boolean {
  try { return !!sessionStorage.getItem(DONE_KEY) } catch { return false }
}

export default function CatalogOfferPopup() {
  const router = useRouter()
  const pathname = usePathname()
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [form, setForm] = useState({ name: '', phone: '+7 (', email: '' })
  const [phoneError, setPhoneError] = useState<string | null>(null)
  const [pdAgreed, setPdAgreed] = useState(true)
  const [marketingAgreed, setMarketingAgreed] = useState(true)
  const openedRef = useRef(false)

  const show = useCallback(() => {
    if (openedRef.current || convertedThisSession()) return
    openedRef.current = true
    setOpen(true)
    window.ym?.(YM_ID, 'reachGoal', 'popup_shown')
  }, [])

  // Перезапуск на каждый переход по страницам каталога (layout в SPA не перемонтируется).
  useEffect(() => {
    if (convertedThisSession()) return
    openedRef.current = false
    const timer = setTimeout(show, DELAY_MS)
    const onScroll = () => {
      const scrolled = window.scrollY / (document.body.scrollHeight - window.innerHeight || 1)
      if (scrolled > 0.3) show()
    }
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => { clearTimeout(timer); window.removeEventListener('scroll', onScroll) }
  }, [pathname, show])

  function close() { setOpen(false) }

  function handlePhone(e: React.ChangeEvent<HTMLInputElement>) {
    setForm(f => ({ ...f, phone: formatPhone(e.target.value) }))
    if (phoneError) setPhoneError(null)
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    const err = validatePhone(form.phone)
    if (err) { setPhoneError(err); return }
    setLoading(true)
    try {
      await fetch('/api/leads/submit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: form.name,
          phone: form.phone,
          email: form.email,
          school: 'Не указана',
          source: SOURCE,
          pd_agreed: pdAgreed,
          marketing_agreed: marketingAgreed,
        }),
      })
      window.ym?.(YM_ID, 'reachGoal', 'popup_lead')
    } catch {}
    try { sessionStorage.setItem(DONE_KEY, '1') } catch {}
    setLoading(false)
    router.push('/spasibo/')
  }

  if (!open) return null

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={close} />

      <div className="relative w-full max-w-lg bg-white rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[94vh]">
        <button
          onClick={close}
          aria-label="Закрыть"
          className="absolute top-3 right-3 text-white bg-black/30 hover:bg-black/50 rounded-full p-1 cursor-pointer z-10"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>

        {/* Фото-шапка */}
        <div className="h-44 sm:h-52 shrink-0 relative bg-blue-100">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/diplom-popup.jpg"
            alt="Вручение дипломов государственного образца"
            className="absolute inset-0 w-full h-full object-cover object-top"
          />
        </div>

        {/* Контент */}
        <div className="p-5 sm:p-6 overflow-y-auto">
          <div className="inline-block bg-red-50 text-red-600 text-xs font-semibold px-2.5 py-1 rounded-full mb-2">
            Последняя волна зачисления
          </div>
          <h3 className="text-lg sm:text-xl font-bold text-[#0F172A] leading-snug mb-3">
            Успейте подать документы и попасть в последнюю волну зачисления
          </h3>

          <div className="bg-blue-50 border border-blue-100 rounded-xl px-3 py-2.5 mb-3">
            <p className="text-xs text-gray-500 mb-1.5">До конца приёма документов:</p>
            <Countdown variant="light" />
          </div>

          <p className="text-sm text-gray-600 mb-4">
            Принимаем документы <b>взрослых и детей с 1 по 11 класс</b>. Перезвоним в течение 30 минут и поможем с выбором школы.
          </p>

          <form onSubmit={handleSubmit} className="space-y-3">
            <input
              type="text" placeholder="Ваше имя" required
              value={form.name}
              onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
              className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
            />
            <div>
              <input
                type="tel" placeholder="+7 (___) ___-__-__" required
                value={form.phone}
                onChange={handlePhone}
                onBlur={() => setPhoneError(validatePhone(form.phone))}
                maxLength={18}
                className={`w-full px-3 py-2.5 border rounded-lg text-sm focus:outline-none focus:ring-2 bg-white ${
                  phoneError ? 'border-red-400 focus:ring-red-300' : 'border-gray-300 focus:ring-blue-500'
                }`}
              />
              {phoneError && <p className="text-xs text-red-500 mt-1 pl-1">{phoneError}</p>}
            </div>
            <input
              type="email" placeholder="Электронная почта" required
              value={form.email}
              onChange={e => setForm(f => ({ ...f, email: e.target.value }))}
              className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
            />
            <button
              type="submit"
              disabled={loading || !pdAgreed}
              className="w-full bg-[#0369A1] text-white py-3 rounded-lg text-sm font-semibold hover:bg-blue-500 transition-colors disabled:opacity-60 cursor-pointer"
            >
              {loading ? 'Отправляем...' : 'Оставить заявку'}
            </button>

            <div className="space-y-1.5 pt-1">
              <label className="flex items-start gap-2 cursor-pointer">
                <input type="checkbox" checked={pdAgreed} onChange={e => setPdAgreed(e.target.checked)} className="mt-0.5 shrink-0 accent-[#0369A1]" />
                <span className="text-[11px] text-gray-500 leading-relaxed">
                  Согласен(а) с{' '}
                  <Link href="/politika-konfidentsialnosti/" className="text-[#0369A1] hover:underline" target="_blank">политикой обработки персональных данных</Link>
                </span>
              </label>
              <label className="flex items-start gap-2 cursor-pointer">
                <input type="checkbox" checked={marketingAgreed} onChange={e => setMarketingAgreed(e.target.checked)} className="mt-0.5 shrink-0 accent-[#0369A1]" />
                <span className="text-[11px] text-gray-500 leading-relaxed">
                  Согласен(а) на{' '}
                  <Link href="/soglasie-marketing/" className="text-[#0369A1] hover:underline" target="_blank">получение маркетинговых материалов</Link>
                </span>
              </label>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}
