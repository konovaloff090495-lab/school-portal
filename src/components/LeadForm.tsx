'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { formatPhone, validatePhone } from '@/lib/phone'

interface LeadFormProps {
  schoolName?: string
  compact?: boolean
  title?: string
}

export default function LeadForm({ schoolName, compact = false, title }: LeadFormProps) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [form, setForm] = useState({ name: '', phone: '+7 (', email: '', question: '' })
  const [phoneError, setPhoneError] = useState<string | null>(null)
  const [pdAgreed, setPdAgreed] = useState(true)
  const [marketingAgreed, setMarketingAgreed] = useState(true)

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

    try {
      await fetch('/api/leads/submit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: form.name,
          phone: form.phone,
          email: form.email,
          question: form.question,
          school: schoolName ?? 'Не указана',
          pd_agreed: pdAgreed,
          marketing_agreed: marketingAgreed,
        }),
      })
      window.ym?.(108789843, 'reachGoal', 'lead_submit')
    } catch {}

    setLoading(false)
    router.push('/spasibo/')
  }

  return (
    <div className={`bg-blue-50 border border-blue-200 rounded-xl ${compact ? 'p-4' : 'p-6'}`}>
      <h3 className={`font-semibold text-gray-900 mb-1 ${compact ? 'text-base' : 'text-lg'}`}>
        {title ?? (schoolName ? `Оставить заявку в «${schoolName}»` : 'Узнать подробнее о школе')}
      </h3>
      <p className="text-sm text-gray-600 mb-4">Перезвоним в течение 30 минут</p>
      <form onSubmit={handleSubmit} className="space-y-3">
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
        <button
          type="submit"
          disabled={loading || !pdAgreed}
          className="w-full bg-[#0369A1] text-white py-2.5 rounded-lg text-sm font-semibold hover:bg-blue-500 transition-colors disabled:opacity-60 cursor-pointer"
        >
          {loading ? 'Отправляем...' : 'Отправить заявку'}
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
    </div>
  )
}
