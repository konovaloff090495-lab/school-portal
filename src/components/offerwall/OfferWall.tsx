'use client'

/**
 * Витрина подарков после заявки (см. src/lib/offerwall.ts).
 * Карточка → выезжающая справа шторка с подробным описанием и формой.
 * Форма предзаполнена контактами из предыдущей заявки (localStorage, src/lib/leadProfile.ts),
 * отправка — только через submitLead() (Telegram + CRM Синергии), после успеха человек
 * уходит на посадочную продукта с партнёрской меткой gerasimov_lav.
 */

import { useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import { formatPhone, validatePhone } from '@/lib/phone'
import { submitLead } from '@/lib/submitLead'
import { getLeadProfile } from '@/lib/leadProfile'
import {
  WALL_CATEGORIES,
  WALL_OFFERS,
  FEATURED_OFFERS,
  wallUrl,
  type WallCategory,
  type WallOffer,
} from '@/lib/offerwall'

const COUNTER = 108789843

function goal(name: string, params?: Record<string, unknown>) {
  try {
    window.ym?.(COUNTER, 'reachGoal', name, params)
  } catch {}
}

export default function OfferWall({ place }: { place: string }) {
  const [tab, setTab] = useState<WallCategory | 'all'>('all')
  const [active, setActive] = useState<WallOffer | null>(null)

  useEffect(() => {
    goal('offerwall_view', { place })
  }, [place])

  const visible = useMemo(
    () => (tab === 'all' ? WALL_OFFERS : WALL_OFFERS.filter(o => o.category === tab)),
    [tab],
  )

  function open(offer: WallOffer) {
    setActive(offer)
    goal('offerwall_open', { offer: offer.id, place })
  }

  return (
    <div>
      {/* Первый ряд — самые ценные подарки */}
      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-10">
        {FEATURED_OFFERS.map(offer => (
          <button
            key={offer.id}
            onClick={() => open(offer)}
            className="text-left bg-white rounded-2xl border border-gray-200 hover:border-[#0369A1] hover:shadow-lg transition-all duration-200 overflow-hidden cursor-pointer group"
          >
            <div
              className="h-24 px-4 py-3 flex items-end"
              style={{ background: `linear-gradient(135deg, ${offer.accent[0]}, ${offer.accent[1]})` }}
            >
              <span className="inline-block bg-white/15 backdrop-blur text-white text-[11px] font-semibold px-2.5 py-1 rounded-full leading-tight">
                {offer.badge}
              </span>
            </div>
            <div className="p-4">
              <h3 className="font-semibold text-[#0F172A] text-sm leading-snug mb-2 line-clamp-3">
                {offer.title}
              </h3>
              <span className="text-[#0369A1] text-sm font-semibold group-hover:underline">
                {offer.cta} →
              </span>
            </div>
          </button>
        ))}
      </div>

      {/* Фильтр по разделам */}
      <div className="flex flex-wrap gap-2 mb-6">
        <FilterPill active={tab === 'all'} onClick={() => setTab('all')}>
          Все подарки
        </FilterPill>
        {WALL_CATEGORIES.map(c => (
          <FilterPill key={c.key} active={tab === c.key} onClick={() => setTab(c.key)}>
            {c.label}
          </FilterPill>
        ))}
      </div>

      {/* Витрина */}
      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {visible.map(offer => (
          <button
            key={offer.id}
            onClick={() => open(offer)}
            className="text-left bg-white rounded-2xl border border-gray-200 hover:border-[#0369A1] hover:shadow-md transition-all duration-200 p-5 cursor-pointer group flex flex-col"
          >
            <div className="flex items-start gap-3 mb-3">
              <span
                className="w-9 h-9 rounded-xl shrink-0"
                style={{ background: `linear-gradient(135deg, ${offer.accent[0]}, ${offer.accent[1]})` }}
              />
              <span className="text-[11px] font-semibold text-[#0369A1] bg-blue-50 px-2.5 py-1 rounded-full leading-tight">
                {offer.badge}
              </span>
            </div>
            <h3 className="font-semibold text-[#0F172A] text-[15px] leading-snug mb-2">{offer.title}</h3>
            <p className="text-sm text-gray-500 leading-relaxed mb-4 line-clamp-3">{offer.lead}</p>
            <span className="mt-auto text-[#0369A1] text-sm font-semibold group-hover:underline">
              {offer.cta} →
            </span>
          </button>
        ))}
      </div>

      {active && (
        <OfferDrawer key={active.id} offer={active} place={place} onClose={() => setActive(null)} />
      )}
    </div>
  )
}

function FilterPill({
  active,
  onClick,
  children,
}: {
  active: boolean
  onClick: () => void
  children: React.ReactNode
}) {
  return (
    <button
      onClick={onClick}
      className={`px-4 py-2 rounded-full text-sm font-semibold transition-colors cursor-pointer ${
        active
          ? 'bg-[#0369A1] text-white'
          : 'bg-white border border-gray-200 text-gray-600 hover:border-[#0369A1] hover:text-[#0369A1]'
      }`}
    >
      {children}
    </button>
  )
}

function OfferDrawer({
  offer,
  place,
  onClose,
}: {
  offer: WallOffer
  place: string
  onClose: () => void
}) {
  // Контакты из заявки, которую человек оставил минуту назад (localStorage).
  // Шторка монтируется только после клика, поэтому чтения на сервере не происходит.
  const [form, setForm] = useState(() => {
    const p = getLeadProfile()
    return p
      ? { name: p.name, phone: p.phone, email: p.email }
      : { name: '', phone: '+7 (', email: '' }
  })
  const [phoneError, setPhoneError] = useState<string | null>(null)
  const [pdAgreed, setPdAgreed] = useState(true)
  const [marketingAgreed, setMarketingAgreed] = useState(true)
  const [loading, setLoading] = useState(false)
  const [done, setDone] = useState(false)

  // Esc закрывает, фон не прокручивается
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose() }
    document.addEventListener('keydown', onKey)
    const prev = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      document.removeEventListener('keydown', onKey)
      document.body.style.overflow = prev
    }
  }, [onClose])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    const err = validatePhone(form.phone)
    if (err) { setPhoneError(err); return }
    setLoading(true)
    try {
      await submitLead({
        name: form.name,
        phone: form.phone,
        email: form.email,
        source: `Витрина подарков: ${offer.productName}`,
        question: `Оффер: ${offer.badge}`,
        pd_agreed: pdAgreed,
        marketing_agreed: marketingAgreed,
      })
      goal('offerwall_lead', { offer: offer.id, place })
      window.ym?.(COUNTER, 'reachGoal', 'lead_submit')
    } catch {}
    setLoading(false)
    setDone(true)
    // Дальше человек идёт на посадочную продукта с партнёрской меткой
    setTimeout(() => {
      if (offer.suProduct) window.location.href = wallUrl(offer.suProduct, place)
    }, 1200)
  }

  return (
    <>
      <div onClick={onClose} className="ps-overlay fixed inset-0 bg-black/40 z-40" aria-hidden />
      <aside
        className="ps-drawer fixed top-0 right-0 h-full w-full sm:max-w-md bg-white z-50 shadow-2xl flex flex-col"
        role="dialog"
        aria-modal="true"
      >
          <>
            <div
              className="px-6 pt-6 pb-8 text-white relative shrink-0"
              style={{ background: `linear-gradient(135deg, ${offer.accent[0]}, ${offer.accent[1]})` }}
            >
              <button
                onClick={onClose}
                aria-label="Закрыть"
                className="absolute top-4 right-4 w-9 h-9 rounded-full bg-white/15 hover:bg-white/25 flex items-center justify-center transition-colors cursor-pointer"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
              <span className="inline-block bg-white/15 backdrop-blur text-[11px] font-semibold px-2.5 py-1 rounded-full mb-3">
                {offer.badge}
              </span>
              <h2 className="text-xl font-bold leading-snug pr-8">{offer.title}</h2>
            </div>

            <div className="flex-1 overflow-y-auto px-6 py-5">
              <p className="text-sm text-gray-600 leading-relaxed mb-5">{offer.lead}</p>

              <ul className="space-y-2.5 mb-6">
                {offer.bullets.map(b => (
                  <li key={b} className="flex gap-2.5 text-sm text-gray-700 leading-relaxed">
                    <svg className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M4.5 12.75l6 6 9-13.5" />
                    </svg>
                    <span>{b}</span>
                  </li>
                ))}
              </ul>

              {offer.partner ? (
                <a
                  href={offer.partnerUrl}
                  target="_blank"
                  rel="nofollow sponsored noopener"
                  onClick={() => goal('offerwall_partner', { offer: offer.id, place })}
                  className="block w-full text-center bg-[#0369A1] text-white py-3 rounded-xl font-semibold text-sm hover:bg-blue-500 transition-colors"
                >
                  {offer.cta}
                </a>
              ) : done ? (
                <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-4 text-center">
                  <p className="text-emerald-800 font-semibold text-sm mb-1">Подарок закреплён за вами</p>
                  <p className="text-emerald-700 text-xs leading-relaxed">
                    Открываем страницу продукта. Менеджер перезвонит и расскажет, как активировать.
                  </p>
                </div>
              ) : (
                <form onSubmit={handleSubmit} className="space-y-3">
                  <p className="text-sm font-semibold text-[#0F172A]">Заберите подарок</p>
                  <input
                    type="text"
                    placeholder="Ваше имя"
                    required
                    value={form.name}
                    onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                    className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                  />
                  <div>
                    <input
                      type="tel"
                      placeholder="+7 (___) ___-__-__"
                      required
                      value={form.phone}
                      onChange={e => {
                        setForm(f => ({ ...f, phone: formatPhone(e.target.value) }))
                        if (phoneError) setPhoneError(null)
                      }}
                      onBlur={() => setPhoneError(validatePhone(form.phone))}
                      maxLength={18}
                      className={`w-full px-3 py-2.5 border rounded-lg text-sm focus:outline-none focus:ring-2 bg-white ${
                        phoneError ? 'border-red-400 focus:ring-red-300' : 'border-gray-300 focus:ring-blue-500'
                      }`}
                    />
                    {phoneError && <p className="text-xs text-red-500 mt-1 pl-1">{phoneError}</p>}
                  </div>
                  <input
                    type="email"
                    placeholder="Электронная почта"
                    required
                    value={form.email}
                    onChange={e => setForm(f => ({ ...f, email: e.target.value }))}
                    className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                  />
                  <button
                    type="submit"
                    disabled={loading || !pdAgreed}
                    className="w-full bg-[#0369A1] text-white py-3 rounded-xl font-semibold text-sm hover:bg-blue-500 transition-colors disabled:opacity-60 cursor-pointer"
                  >
                    {loading ? 'Отправляем…' : offer.cta}
                  </button>
                  <div className="space-y-2 pt-1">
                    <label className="flex items-start gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={pdAgreed}
                        onChange={e => setPdAgreed(e.target.checked)}
                        className="mt-0.5 shrink-0 accent-[#0369A1]"
                      />
                      <span className="text-xs text-gray-500 leading-relaxed">
                        Согласен(а) с{' '}
                        <Link href="/politika-konfidentsialnosti/" className="text-[#0369A1] hover:underline" target="_blank">
                          политикой обработки персональных данных
                        </Link>
                      </span>
                    </label>
                    <label className="flex items-start gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={marketingAgreed}
                        onChange={e => setMarketingAgreed(e.target.checked)}
                        className="mt-0.5 shrink-0 accent-[#0369A1]"
                      />
                      <span className="text-xs text-gray-500 leading-relaxed">
                        Согласен(а) на{' '}
                        <Link href="/soglasie-marketing/" className="text-[#0369A1] hover:underline" target="_blank">
                          получение маркетинговых материалов
                        </Link>
                      </span>
                    </label>
                  </div>
                </form>
              )}

              {offer.partner && (
                <p className="text-[11px] text-gray-400 mt-3 text-center">
                  Переход на {offer.partnerHost} — предложение партнёра
                </p>
              )}
            </div>
          </>
      </aside>
    </>
  )
}
