'use client'
import { useId, useState } from 'react'
import { useRouter } from 'next/navigation'
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
}

export default function LeadForm({ schoolName, schoolCity, compact = false, title, source, crm = true, attestat = false, defaultGoal = '' }: LeadFormProps) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [submitError, setSubmitError] = useState<string | null>(null)
  const [form, setForm] = useState({ name: '', phone: '+7 (', email: '', question: '' })
  const [phoneError, setPhoneError] = useState<string | null>(null)
  const [pdAgreed, setPdAgreed] = useState(true)
  const [marketingAgreed, setMarketingAgreed] = useState(false)
  const fieldId = useId()
  const [qualification, setQualification] = useState({ goal: defaultGoal, audience: '', callback_time: '' })

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
        crm,
        ...(attestat ? { product: 'attestat-online', qualification } : {}),
      })
      if (!sent) {
        setSubmitError('Не удалось отправить заявку. Попробуйте ещё раз.')
        setLoading(false)
        return
      }
      window.ym?.(108789843, 'reachGoal', 'lead_submit')
      window.ym?.(108789843, 'reachGoal', 'card_lead', { form_id: source || 'school-card', flow: attestat ? 'attestat-v1' : 'existing', goal: qualification.goal })
    } catch {
      setSubmitError('Не удалось отправить заявку. Попробуйте ещё раз.')
      setLoading(false)
      return
    }

    setLoading(false)
    router.push('/spasibo/')
  }

  return (
    <div className={`bg-blue-50 border border-blue-200 rounded-xl ${compact ? 'p-4' : 'p-6'}`}>
      <h3 className={`font-semibold text-gray-900 mb-1 ${compact ? 'text-base' : 'text-lg'}`}>
        {title ?? (attestat ? 'Узнать условия платного онлайн-обучения' : schoolName ? `Консультация по обучению: «${schoolName}»` : 'Узнать подробнее о школе')}
      </h3>
      <p className="text-sm text-gray-600 mb-4">{crm ? attestat ? 'Заявку получит консультант Синергии по платному онлайн-обучению. Он уточнит ваш документ об образовании, стоимость и сроки. ОГЭ/ЕГЭ по этой программе проходят очно в Москве.' : 'Заявку получит консультант онлайн-школы Синергия. Для обращения непосредственно в выбранную школу используйте её официальный сайт или телефон.' : 'Свяжемся после обработки заявки.'}</p>
      <form onSubmit={handleSubmit} className="space-y-3">
        {attestat && <fieldset className="space-y-3 border-0 p-0 m-0">
          <legend className="text-sm font-medium mb-2">Чтобы предложить подходящую программу <span className="font-normal text-gray-500">(необязательно)</span></legend>
          <label htmlFor={`${fieldId}-goal`} className="block text-sm">Что хотите закончить?</label>
          <select id={`${fieldId}-goal`} value={qualification.goal} onChange={e => setQualification(q => ({ ...q, goal: e.target.value }))} className="w-full min-w-0 bg-white border border-gray-300 rounded-lg px-3 py-2 text-sm">
            <option value="">Нужна помощь с выбором</option><option value="Аттестат за 9 класс">9 класс — получить первый аттестат</option><option value="Аттестат за 11 класс">10–11 классы — после аттестата за 9 класс</option>
          </select>
          <label htmlFor={`${fieldId}-audience`} className="block text-sm">Для кого обучение?</label>
          <select id={`${fieldId}-audience`} value={qualification.audience} onChange={e => setQualification(q => ({ ...q, audience: e.target.value }))} className="w-full min-w-0 bg-white border border-gray-300 rounded-lg px-3 py-2 text-sm">
            <option value="">Уточню на консультации</option><option value="Для себя, 18 лет и старше">Для себя, мне 18 лет или больше</option><option value="Для ребёнка">Для ребёнка</option>
          </select>
        </fieldset>}
        <input
          type="text"
          placeholder="Ваше имя"
          required
          value={form.name}
          onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
        />
        <div>
          <input
            type="tel"
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
        {attestat && <><label htmlFor={`${fieldId}-callback`} className="block text-sm">Когда удобно позвонить? <span className="text-gray-500">(необязательно)</span></label><select id={`${fieldId}-callback`} value={qualification.callback_time} onChange={e => setQualification(q => ({ ...q, callback_time: e.target.value }))} className="w-full min-w-0 bg-white border border-gray-300 rounded-lg px-3 py-2 text-sm"><option value="">Согласуем время</option><option>09:00–12:00 МСК</option><option>12:00–16:00 МСК</option><option>16:00–20:00 МСК</option></select></>}
        <LeadGiftNotice />
        {submitError && <p role="alert" className="text-sm text-red-600">{submitError}</p>}
        <button
          type="submit"
          disabled={loading || !pdAgreed}
          className="w-full bg-[#0369A1] text-white py-2.5 rounded-lg text-sm font-semibold hover:bg-blue-500 transition-colors disabled:opacity-60 cursor-pointer"
        >
          {loading ? 'Отправляем...' : attestat ? 'Узнать условия онлайн-обучения' : 'Отправить заявку'}
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
          {crm && <label className="flex items-start gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={marketingAgreed}
              onChange={e => setMarketingAgreed(e.target.checked)}
              className="mt-0.5 shrink-0 accent-[#0369A1]"
            />
            <span className="text-xs text-gray-500 leading-relaxed">
              Хочу получать письма о программах «Синергии» —{' '}
              <Link href="/soglasie-marketing/" className="text-[#0369A1] hover:underline" target="_blank">
                условия рассылки
              </Link>
            </span>
          </label>}
        </div>
      </form>
    </div>
  )
}
