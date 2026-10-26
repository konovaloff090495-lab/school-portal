'use client'
import { trackGift } from '@/lib/catalog-gifts'
import { PDN_DEFAULT_SELECTED, MARKETING_DEFAULT_SELECTED } from '@/lib/lead-consent'
import { useEffect, useRef, useState } from 'react'
import { trackCatalogOffer, type CatalogOfferFormTracking } from '@/lib/catalog-offer-tracking'
import { usePathname, useRouter } from 'next/navigation'
import { selectedGrowthRoute } from '@/lib/growth-tracking'
import Link from 'next/link'
import { formatPhone, validatePhone } from '@/lib/phone'
import { submitLead } from '@/lib/submitLead'
import LeadGiftNotice from '@/components/LeadGiftNotice'

interface LeadFormProps {
  schoolName?: string
  schoolCity?: string
  compact?: boolean
  title?: string
  /** Подпись источника в Telegram/CRM; по умолчанию — «Карточка школы: …» */
  source?: string
  /** false — не передавать в CRM Синергии (B2B-формы вроде «Разместить школу») */
  crm?: boolean
  attestat?: boolean
  defaultGoal?: string
  submitLabel?: string
  showGiftNotice?: boolean
  giftOfferId?: string
  offerTracking?: CatalogOfferFormTracking
}

export default function LeadForm({ schoolName, schoolCity, compact = false, title, source, crm = true, attestat = false, defaultGoal = '', submitLabel = 'Отправить заявку', showGiftNotice = true, offerTracking, giftOfferId }: LeadFormProps) {
  const router = useRouter()
  const pathname = usePathname()
  const [loading, setLoading] = useState(false)
  const [submitError, setSubmitError] = useState<string | null>(null)
  const [form, setForm] = useState({ name: '', phone: '+7 (', email: '', question: '' })
  const [phoneError, setPhoneError] = useState<string | null>(null)
  const [pdAgreed, setPdAgreed] = useState(PDN_DEFAULT_SELECTED)
  const [marketingAgreed, setMarketingAgreed] = useState(crm && MARKETING_DEFAULT_SELECTED)
  const [qualification, setQualification] = useState({ goal: defaultGoal, audience: '', callback_time: '' })
  const formContainer = useRef<HTMLDivElement>(null)
  const offerStarted = useRef(false)
  const giftStarted = useRef(false)
  const offerKind = offerTracking?.kind
  const offerPlacement = offerTracking?.placement

  useEffect(() => {
    if (!giftOfferId || !formContainer.current || typeof IntersectionObserver === 'undefined') return
    const observer = new IntersectionObserver(entries => {
      if (!entries.some(entry => entry.isIntersecting && entry.intersectionRatio >= 0.25)) return
      trackGift('form_view', giftOfferId); observer.disconnect()
    }, { threshold: 0.25 })
    observer.observe(formContainer.current)
    return () => observer.disconnect()
  }, [giftOfferId])

  useEffect(() => {
    if (!offerKind || !offerPlacement || !formContainer.current || typeof IntersectionObserver === 'undefined') return
    const observer = new IntersectionObserver(entries => {
      if (!entries.some(entry => entry.isIntersecting && entry.intersectionRatio >= 0.25)) return
      trackCatalogOffer(offerKind, 'form_view', offerPlacement)
      observer.disconnect()
    }, { threshold: 0.25 })
    observer.observe(formContainer.current)
    return () => observer.disconnect()
  }, [offerKind, offerPlacement])

  useEffect(() => {
    if (!attestat) return
    const selectRoute = () => {
      const hashRoute = window.location.hash === '#programma-9' ? 'attestat-9' : window.location.hash === '#programma-11' ? 'attestat-11' : undefined
      const selected = hashRoute || selectedGrowthRoute()
      const goal = selected === 'attestat-9' ? 'Аттестат за 9 класс' : selected === 'attestat-11' ? 'Аттестат за 11 класс' : ''
      if (goal) setQualification(q => ({ ...q, goal: hashRoute ? goal : q.goal || goal }))
    }
    selectRoute(); window.addEventListener('hashchange', selectRoute)
    return () => window.removeEventListener('hashchange', selectRoute)
  }, [attestat, pathname])

  function handlePhone(e: React.ChangeEvent<HTMLInputElement>) {
    const masked = formatPhone(e.target.value)
    setForm(f => ({ ...f, phone: masked }))
    if (phoneError) setPhoneError(null)
  }

  function handlePhoneBlur() {
    const err = validatePhone(form.phone)
    setPhoneError(err)
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    const err = validatePhone(form.phone)
    if (err) { setPhoneError(err); return }
    if (giftOfferId) trackGift('form_submit', giftOfferId)
    setLoading(true)
    setSubmitError(null)

    try {
      const sent = await submitLead({
        name: form.name,
        phone: form.phone,
        email: form.email,
        question: form.question,
        school: schoolName,
        city: schoolCity,
        source: source ?? (schoolName ? `Карточка школы: ${schoolName}` : 'Карточка школы'),
        pd_agreed: pdAgreed,
        marketing_agreed: marketingAgreed,
        marketing_default_selected: crm && MARKETING_DEFAULT_SELECTED,
        crm,
        ...(crm ? { qualification } : {}),
        ...(attestat ? { product: 'attestat-online' } : {}),
        ...(giftOfferId ? { product: giftOfferId } : {}),
      })
      if (!sent) {
        if (giftOfferId) trackGift('lead_error', giftOfferId)
        setSubmitError('Не удалось отправить заявку. Попробуйте ещё раз.')
        setLoading(false)
        return
      }
      if (giftOfferId) trackGift('lead_success', giftOfferId)
      if (offerTracking) trackCatalogOffer(offerTracking.kind, 'lead_success', offerTracking.placement)
      try {
        window.ym?.(108789843, 'reachGoal', 'lead_submit')
        window.ym?.(108789843, 'reachGoal', 'card_lead', { form_id: source || 'school-card', flow: attestat ? 'attestat-v1' : 'existing', goal: qualification.goal })
      } catch { /* A submitted lead must not fail because analytics is unavailable. */ }
    } catch {
      if (giftOfferId) trackGift('lead_error', giftOfferId)
      setSubmitError('Не удалось отправить заявку. Попробуйте ещё раз.')
      setLoading(false)
      return
    }

    setLoading(false)
    router.push('/spasibo/')
  }

  return (
    <div ref={formContainer} className={`bg-blue-50 border border-blue-200 rounded-xl ${compact ? 'p-4' : 'p-6'}`}>
      <h3 className={`font-semibold text-gray-900 mb-1 ${compact ? 'text-base' : 'text-lg'}`}>
        {title ?? (attestat ? 'Узнать условия платного онлайн-обучения' : schoolName ? `Консультация по обучению: «${schoolName}»` : 'Узнать подробнее о школе')}
      </h3>
      {(attestat || !crm) && <p className="text-sm text-gray-600 mb-4">{attestat ? 'Консультант Синергии уточнит программу, стоимость и документы. Обучение платное; ОГЭ/ЕГЭ — очно в Москве.' : 'Свяжемся после обработки заявки.'}</p>}
      <form data-growth-form={crm ? source || 'school-card' : undefined} data-offer-form={offerTracking?.placement} onSubmit={handleSubmit} onChangeCapture={event => {
        if (giftOfferId && !giftStarted.current && event.target instanceof HTMLInputElement && event.target.type !== 'checkbox') {
          giftStarted.current = true; trackGift('form_start', giftOfferId)
        }
        if (!offerTracking || offerStarted.current || !(event.target instanceof HTMLInputElement) || event.target.type === 'checkbox') return
        offerStarted.current = true
        trackCatalogOffer(offerTracking.kind, 'form_start', offerTracking.placement)
      }} className="space-y-3">
        <input
          type="text"
          autoComplete="name"
          placeholder="Ваше имя"
          required
          value={form.name}
          onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
        />
        <div>
          <input
            type="tel"
            autoComplete="tel"
            placeholder="+7 (___) ___-__-__"
            required
            value={form.phone}
            onChange={handlePhone}
            onBlur={handlePhoneBlur}
            maxLength={18}
            className={`w-full px-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 bg-white ${
              phoneError
                ? 'border-red-400 focus:ring-red-300'
                : 'border-gray-300 focus:ring-blue-500'
            }`}
          />
          {phoneError && (
            <p className="text-xs text-red-500 mt-1 pl-1">{phoneError}</p>
          )}
        </div>
        <input
          type="email"
          autoComplete="email"
          placeholder="Электронная почта"
          required
          value={form.email}
          onChange={e => setForm(f => ({ ...f, email: e.target.value }))}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
        />
        {!compact && (
          <textarea
            placeholder="Вопрос или комментарий (необязательно)"
            value={form.question}
            onChange={e => setForm(f => ({ ...f, question: e.target.value }))}
            rows={2}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white resize-none"
          />
        )}

        {submitError && <p role="alert" className="text-sm text-red-600">{submitError}</p>}
        <div className="space-y-2 pt-1">
          <label className="flex items-start gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={pdAgreed}
              onChange={e => setPdAgreed(e.target.checked)}
              className="mt-0.5 shrink-0 accent-[#0369A1]"
            />
            <span className="text-xs text-gray-500 leading-relaxed">
              Даю согласие на{' '}
              <Link href="/soglasie-na-obrabotku-personalnyh-dannyh/" className="text-[#0369A1] hover:underline" target="_blank">
                обработку персональных данных
              </Link>
            </span>
          </label>
          {crm && <label className="flex items-start gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={marketingAgreed}
              onChange={e => setMarketingAgreed(e.target.checked)}
              className="mt-0.5 shrink-0 accent-[#0369A1]"
            />
            <span className="text-xs text-gray-500 leading-relaxed">
              Согласен получать уведомления —{' '}
              <Link href="/soglasie-marketing/" className="text-[#0369A1] hover:underline" target="_blank">
                условия рассылки
              </Link>
            </span>
          </label>}
        </div>
        {!pdAgreed && <p className="text-xs text-gray-600">Для отправки заявки выберите согласие на обработку данных.</p>}
        <button
          type="submit"
          onClick={() => { if (offerTracking) trackCatalogOffer(offerTracking.kind, 'cta_click', offerTracking.placement) }}
          disabled={loading || !pdAgreed}
          className="w-full bg-[#0369A1] text-white py-2.5 rounded-lg text-sm font-semibold hover:bg-blue-500 transition-colors disabled:opacity-60 cursor-pointer"
        >
          {loading ? 'Отправляем...' : submitLabel}
        </button>
      </form>
      {showGiftNotice && <div className="mt-3"><LeadGiftNotice /></div>}
    </div>
  )
}
