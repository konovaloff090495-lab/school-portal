'use client'

/**
 * Витрина подарков после заявки (реестр — src/lib/offerwall.ts).
 *
 * Формат взят с промо-витрин (ris.promo и подобные): шапка-герой с одним понятным
 * действием «выберите подарок», под ней плотный список строк — слева брендовая плитка,
 * в центре оффер, справа кнопка. Такой список читается быстрее сетки плиток и держит
 * внимание на предложении, а не на оформлении.
 *
 * Клик по строке открывает шторку справа: подробности и форма, предзаполненная
 * контактами из предыдущей заявки (localStorage, src/lib/leadProfile.ts). Отправка —
 * только через submitLead() (Telegram + CRM Синергии), затем переход на посадочную
 * продукта с партнёрской меткой.
 */

import { useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import { formatPhone, validatePhone } from '@/lib/phone'
import { submitLead } from '@/lib/submitLead'
import { getLeadProfile } from '@/lib/leadProfile'
import OfferIcon from '@/components/offerwall/OfferIcon'
import { FALLBACK_STATS, type WallStats } from '@/lib/offerwallStats'
import {
  WALL_CATEGORIES,
  WALL_OFFERS,
  wallUrl,
  type WallCategory,
  type WallOffer,
} from '@/lib/offerwall'

const COUNTER = 108789843
const ACCENT = '#FF6B3D'

function goal(name: string, params?: Record<string, unknown>) {
  try {
    window.ym?.(COUNTER, 'reachGoal', name, params)
  } catch {}
}

/**
 * Подарок закрепляется за человеком на сутки с первого показа витрины — это наше
 * условие, а не срок действия чужого оффера. Дедлайн живёт в localStorage, поэтому
 * при возврате на страницу отсчёт продолжается, а не начинается заново.
 */
function useGiftDeadline(): string {
  const [left, setLeft] = useState(24 * 3600 * 1000)
  useEffect(() => {
    const KEY = 'ps_wall_deadline'
    let deadline = Date.now() + 24 * 3600 * 1000
    try {
      const saved = Number(localStorage.getItem(KEY))
      if (saved && saved > Date.now()) deadline = saved
      else localStorage.setItem(KEY, String(deadline))
    } catch {}
    const id = setInterval(() => setLeft(Math.max(0, deadline - Date.now())), 1000)
    return () => clearInterval(id)
  }, [])
  const total = Math.floor(left / 1000)
  const pad = (n: number) => String(n).padStart(2, '0')
  return `${pad(Math.floor(total / 3600))}:${pad(Math.floor((total % 3600) / 60))}:${pad(total % 60)}`
}

/** Настоящие цифры портала из Метрики; при недоступности API — последний замер. */
function useWallStats(): WallStats {
  const [stats, setStats] = useState<WallStats>(FALLBACK_STATS)
  useEffect(() => {
    let alive = true
    fetch('/api/offerwall/stats')
      .then(r => (r.ok ? r.json() : null))
      .then(d => { if (alive && d?.leads30) setStats(d as WallStats) })
      .catch(() => {})
    return () => { alive = false }
  }, [])
  return stats
}

function plural(n: number, one: string, few: string, many: string): string {
  const d10 = n % 10
  const d100 = n % 100
  if (d10 === 1 && d100 !== 11) return one
  if (d10 >= 2 && d10 <= 4 && (d100 < 12 || d100 > 14)) return few
  return many
}

const nf = new Intl.NumberFormat('ru-RU')

export default function OfferWall({
  place,
  title,
  subtitle,
  kicker,
}: {
  place: string
  title: string
  subtitle: string
  kicker: string
}) {
  const [tab, setTab] = useState<WallCategory | 'all'>('all')
  const [active, setActive] = useState<WallOffer | null>(null)
  const countdown = useGiftDeadline()
  const stats = useWallStats()

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
    <div className="bg-white">
      {/* Шапка: одно действие и объяснение, почему это быстро */}
      <header
        className="px-4 pt-10 pb-20 text-center text-white"
        style={{ background: `linear-gradient(140deg, ${ACCENT} 0%, #FF9356 100%)` }}
      >
        <span className="inline-flex items-center gap-2 bg-white/20 backdrop-blur px-3.5 py-1.5 rounded-full text-[13px] font-semibold mb-5">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M4.5 12.75l6 6 9-13.5" />
          </svg>
          {kicker}
        </span>
        <h1 className="text-[28px] sm:text-[40px] font-extrabold leading-tight max-w-3xl mx-auto">
          {title}
        </h1>
        <p className="text-white/90 text-[15px] sm:text-base mt-3 max-w-xl mx-auto leading-relaxed">
          {subtitle}
        </p>
        <p className="text-white/80 text-[13px] mt-4">
          За последний месяц портал выбрали {nf.format(stats.users30)}{' '}
          {plural(stats.users30, 'человек', 'человека', 'человек')}, заявку оставили{' '}
          <span className="font-semibold text-white">{nf.format(stats.leads30)}</span>
        </p>
      </header>

      {/* Список офферов */}
      <div className="max-w-4xl mx-auto px-3 sm:px-4 -mt-[26px] pb-16">
        <div className="flex justify-center mb-4">
          <span className="bg-white rounded-2xl px-4 py-2.5 shadow-[0_4px_18px_rgba(26,24,20,0.12)] flex items-center gap-2 text-[13px] sm:text-sm font-semibold text-[#1A1814]">
            <svg className="w-4 h-4 text-[#FF6B3D]" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
              <circle cx="12" cy="12" r="8.5" />
              <path strokeLinecap="round" d="M12 7.5V12l3 1.8" />
            </svg>
            Подарок закреплён за вами ещё
            <span className="tabular-nums text-[#FF6B3D]">{countdown}</span>
          </span>
        </div>
        <div className="bg-[#F4F5FA] rounded-[28px] shadow-[0_2px_18px_rgba(26,24,20,0.08)] p-3 sm:p-5">
          <div className="flex gap-2 overflow-x-auto pb-3 -mx-1 px-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
            <FilterPill active={tab === 'all'} onClick={() => setTab('all')}>
              Все подарки
            </FilterPill>
            {WALL_CATEGORIES.map(c => (
              <FilterPill key={c.key} active={tab === c.key} onClick={() => setTab(c.key)}>
                {c.label}
              </FilterPill>
            ))}
          </div>

          <div className="space-y-2.5">
            {visible.map(offer => (
              <OfferRow key={offer.id} offer={offer} onClick={() => open(offer)} />
            ))}
          </div>
        </div>

        <p className="text-center text-xs text-gray-400 mt-5 leading-relaxed">
          Подарки предоставляют онлайн-школа «Синергия» и партнёры портала.
          Заявка ни к чему не обязывает — менеджер расскажет условия и поможет активировать.
        </p>
      </div>

      {active && (
        <OfferDrawer key={active.id} offer={active} place={place} onClose={() => setActive(null)} />
      )}
    </div>
  )
}

function OfferRow({ offer, onClick }: { offer: WallOffer; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className={`relative w-full bg-white rounded-2xl p-2.5 sm:p-3 flex items-center gap-3 sm:gap-4 text-left transition-shadow hover:shadow-[0_4px_16px_rgba(26,24,20,0.10)] cursor-pointer ${
        offer.featured ? 'ring-[1.5px] ring-emerald-400' : ''
      }`}
    >
      {offer.featured && (
        <span className="absolute -top-2 left-1/2 -translate-x-1/2 bg-emerald-500 text-white text-[10px] font-bold uppercase tracking-wide px-2.5 py-[3px] rounded-full">
          хит
        </span>
      )}

      {/* Брендовая плитка */}
      <span
        className="w-[96px] sm:w-[164px] h-[72px] sm:h-[84px] rounded-xl shrink-0 flex flex-col items-center justify-center gap-1.5 text-white"
        style={{ background: `linear-gradient(135deg, ${offer.tint[0]}, ${offer.tint[1]})` }}
      >
        <OfferIcon name={offer.icon} className="w-6 h-6 sm:w-7 sm:h-7" />
        <span className="text-[10px] sm:text-[13px] font-bold px-2 text-center leading-tight">
          {offer.tile}
        </span>
      </span>

      {/* Оффер */}
      <span className="flex-1 min-w-0">
        <span className="block text-[10px] sm:text-[11px] font-bold uppercase tracking-[0.08em] text-gray-400 mb-1">
          {offer.brand}
        </span>
        <span className="block font-semibold text-[#1A1814] text-[14px] sm:text-base leading-snug">
          {offer.title}
        </span>
        <span className="mt-1.5 inline-block text-[11px] sm:text-xs font-semibold text-[#C2410C] bg-[#FFF1E8] px-2.5 py-1 rounded-full leading-tight">
          {offer.badge}
        </span>
      </span>

      {/* Действие */}
      <span className="hidden sm:inline-flex shrink-0 bg-[#FF6B3D] text-white px-5 py-2.5 rounded-xl font-semibold text-sm">
        Забрать
      </span>
      <span className="sm:hidden shrink-0 w-9 h-9 rounded-full bg-[#FFF1E8] text-[#FF6B3D] flex items-center justify-center">
        <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" d="m9 5 7 7-7 7" />
        </svg>
      </span>
    </button>
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
      className={`shrink-0 px-4 py-2 rounded-full text-[13px] font-semibold transition-colors cursor-pointer ${
        active
          ? 'bg-[#1A1814] text-white'
          : 'bg-white text-gray-600 hover:text-[#1A1814]'
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
  const [submitError, setSubmitError] = useState<string | null>(null)

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
    setSubmitError(null)
    try {
      const sent = await submitLead({
        name: form.name,
        phone: form.phone,
        email: form.email,
        source: `Витрина подарков: ${offer.productName}`,
        question: `Оффер: ${offer.badge}`,
        pd_agreed: pdAgreed,
        marketing_agreed: marketingAgreed,
      })
      if (!sent) {
        setSubmitError('Не удалось отправить заявку. Попробуйте ещё раз.')
        setLoading(false)
        return
      }
      goal('offerwall_lead', { offer: offer.id, place })
      window.ym?.(COUNTER, 'reachGoal', 'lead_submit')
    } catch {
      setSubmitError('Не удалось отправить заявку. Попробуйте ещё раз.')
      setLoading(false)
      return
    }
    setLoading(false)
    setDone(true)
    // Дальше человек идёт на посадочную продукта с партнёрской меткой
    setTimeout(() => {
      if (offer.suProduct) window.location.href = wallUrl(offer.suProduct, place)
    }, 1200)
  }

  return (
    <>
      <div onClick={onClose} className="ps-overlay fixed inset-0 bg-[#1A1814]/50 z-40" aria-hidden />
      <aside
        className="ps-drawer fixed top-0 right-0 h-full w-full sm:max-w-md bg-white z-50 shadow-2xl flex flex-col"
        role="dialog"
        aria-modal="true"
      >
        <div
          className="px-6 pt-6 pb-7 text-white relative shrink-0"
          style={{ background: `linear-gradient(135deg, ${offer.tint[0]}, ${offer.tint[1]})` }}
        >
          <button
            onClick={onClose}
            aria-label="Закрыть"
            className="absolute top-4 right-4 w-9 h-9 rounded-full bg-white/20 hover:bg-white/30 flex items-center justify-center transition-colors cursor-pointer"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
          <div className="flex items-center gap-2.5 mb-4">
            <OfferIcon name={offer.icon} className="w-7 h-7" />
            <span className="text-[11px] font-bold uppercase tracking-[0.08em] opacity-90">{offer.brand}</span>
          </div>
          <h2 className="text-xl font-bold leading-snug pr-8 mb-3">{offer.title}</h2>
          <span className="inline-block bg-white/20 backdrop-blur text-[12px] font-semibold px-3 py-1.5 rounded-full">
            {offer.badge}
          </span>
        </div>

        <div className="flex-1 overflow-y-auto px-6 py-5">
          <p className="text-sm text-gray-600 leading-relaxed mb-5">{offer.lead}</p>

          <ul className="space-y-2.5 mb-6">
            {offer.bullets.map(b => (
              <li key={b} className="flex gap-2.5 text-sm text-gray-700 leading-relaxed">
                <svg className="w-4 h-4 text-[#FF6B3D] shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M4.5 12.75l6 6 9-13.5" />
                </svg>
                <span>{b}</span>
              </li>
            ))}
          </ul>

          {offer.partner ? (
            <>
              <a
                href={offer.partnerUrl}
                target="_blank"
                rel="nofollow sponsored noopener"
                onClick={() => goal('offerwall_partner', { offer: offer.id, place })}
                className="block w-full text-center bg-[#FF6B3D] text-white py-3.5 rounded-xl font-semibold text-sm hover:bg-[#F2582B] transition-colors"
              >
                {offer.cta}
              </a>
              <p className="text-[11px] text-gray-400 mt-3 text-center">
                Переход на {offer.partnerHost} — предложение партнёра
              </p>
            </>
          ) : done ? (
            <div className="bg-[#FFF1E8] border border-[#FFD3BC] rounded-xl p-4 text-center">
              <p className="text-[#C2410C] font-semibold text-sm mb-1">Подарок закреплён за вами</p>
              <p className="text-[#9A3412] text-xs leading-relaxed">
                Открываем страницу продукта. Менеджер перезвонит и расскажет, как активировать.
              </p>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-3">
              <p className="text-sm font-semibold text-[#1A1814]">Заберите подарок</p>
              <input
                type="text"
                placeholder="Ваше имя"
                required
                value={form.name}
                onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                className="w-full px-3.5 py-3 border border-gray-200 bg-[#F8F9FC] rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#FF6B3D]/40 focus:bg-white"
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
                  className={`w-full px-3.5 py-3 border rounded-xl text-sm focus:outline-none focus:ring-2 focus:bg-white ${
                    phoneError
                      ? 'border-red-400 focus:ring-red-300 bg-white'
                      : 'border-gray-200 bg-[#F8F9FC] focus:ring-[#FF6B3D]/40'
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
                className="w-full px-3.5 py-3 border border-gray-200 bg-[#F8F9FC] rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#FF6B3D]/40 focus:bg-white"
              />
              {submitError && <p role="alert" className="text-sm text-red-600">{submitError}</p>}
              <button
                type="submit"
                disabled={loading || !pdAgreed}
                className="w-full bg-[#FF6B3D] text-white py-3.5 rounded-xl font-semibold text-sm hover:bg-[#F2582B] transition-colors disabled:opacity-60 cursor-pointer"
              >
                {loading ? 'Отправляем…' : offer.cta}
              </button>
              <div className="space-y-2 pt-1">
                <label className="flex items-start gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={pdAgreed}
                    onChange={e => setPdAgreed(e.target.checked)}
                    className="mt-0.5 shrink-0 accent-[#FF6B3D]"
                  />
                  <span className="text-xs text-gray-500 leading-relaxed">
                    Согласен(а) с{' '}
                    <Link href="/politika-konfidentsialnosti/" className="text-[#C2410C] hover:underline" target="_blank">
                      политикой обработки персональных данных
                    </Link>
                  </span>
                </label>
                <label className="flex items-start gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={marketingAgreed}
                    onChange={e => setMarketingAgreed(e.target.checked)}
                    className="mt-0.5 shrink-0 accent-[#FF6B3D]"
                  />
                  <span className="text-xs text-gray-500 leading-relaxed">
                    Согласен(а) на{' '}
                    <Link href="/soglasie-marketing/" className="text-[#C2410C] hover:underline" target="_blank">
                      получение маркетинговых материалов
                    </Link>
                  </span>
                </label>
              </div>
            </form>
          )}
        </div>
      </aside>
    </>
  )
}
