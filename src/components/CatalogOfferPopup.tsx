'use client'

import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { formatPhone, validatePhone } from '@/lib/phone'

const YM_ID = 108789843
const STORAGE_KEY = 'ps_catalog_offer_seen'
const COOLDOWN_MS = 12 * 60 * 60 * 1000 // не показывать чаще раза в 12 часов
const SOURCE = 'Поп-ап: последняя волна (каталог школ)'

function recentlySeen(): boolean {
  try {
    const ts = Number(localStorage.getItem(STORAGE_KEY) || 0)
    return Date.now() - ts < COOLDOWN_MS
  } catch { return false }
}
function markSeen() {
  try { localStorage.setItem(STORAGE_KEY, String(Date.now())) } catch {}
}

export default function CatalogOfferPopup() {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [form, setForm] = useState({ name: '', phone: '+7 (', email: '' })
  const [phoneError, setPhoneError] = useState<string | null>(null)
  const [pdAgreed, setPdAgreed] = useState(true)
  const [marketingAgreed, setMarketingAgreed] = useState(true)

  const show = useCallback(() => {
    if (recentlySeen()) return
    setOpen(true)
    markSeen()
    window.ym?.(YM_ID, 'reachGoal', 'popup_shown')
  }, [])

  useEffect(() => {
    if (recentlySeen()) return
    const timer = setTimeout(show, 7000)
    const onScroll = () => {
      const scrolled = window.scrollY / (document.body.scrollHeight - window.innerHeight || 1)
      if (scrolled > 0.35) show()
    }
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => { clearTimeout(timer); window.removeEventListener('scroll', onScroll) }
  }, [show])

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
          school: SOURCE,
          pd_agreed: pdAgreed,
          marketing_agreed: marketingAgreed,
        }),
      })
      window.ym?.(YM_ID, 'reachGoal', 'popup_lead')
    } catch {}
    setLoading(false)
    router.push('/spasibo/')
  }

  if (!open) return null

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={close} />

      <div className="relative w-full max-w-lg bg-white rounded-2xl shadow-2xl overflow-hidden flex flex-col sm:flex-row max-h-[92vh]">
        {/* Фото */}
        <div className="hidden sm:block sm:w-2/5 shrink-0 relative bg-blue-100">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/attestat-popup.jpg"
            alt="Ученица с аттестатом"
            className="absolute inset-0 w-full h-full object-cover object-top"
          />
        </div>

        {/* Контент */}
        <div className="flex-1 p-5 sm:p-6 overflow-y-auto">
          <button
            onClick={close}
            aria-label="Закрыть"
            className="absolute top-3 right-3 text-gray-400 hover:text-gray-600 cursor-pointer z-10"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>

          <div className="inline-block bg-red-50 text-red-600 text-xs font-semibold px-2.5 py-1 rounded-full mb-2">
            Последняя волна зачисления
          </div>
          <h3 className="text-lg sm:text-xl font-bold text-[#0F172A] leading-snug mb-2">
            Успейте подать документы и попасть в последнюю волну зачисления
          </h3>
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
