'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

interface LeadFormProps {
  schoolName?: string
  compact?: boolean
  title?: string
}

// ── Phone mask ────────────────────────────────────────────────────────────────
function formatPhone(raw: string): string {
  // оставляем только цифры
  const digits = raw.replace(/\D/g, '')
  // убираем ведущую 7 или 8
  const local = digits.startsWith('7') || digits.startsWith('8')
    ? digits.slice(1)
    : digits
  if (local.length === 0) return '+7 ('
  if (local.length <= 3)  return `+7 (${local}`
  if (local.length <= 6)  return `+7 (${local.slice(0,3)}) ${local.slice(3)}`
  if (local.length <= 8)  return `+7 (${local.slice(0,3)}) ${local.slice(3,6)}-${local.slice(6)}`
  return `+7 (${local.slice(0,3)}) ${local.slice(3,6)}-${local.slice(6,8)}-${local.slice(8,10)}`
}

// ── Phone validation ──────────────────────────────────────────────────────────
function validatePhone(phone: string): string | null {
  const digits = phone.replace(/\D/g, '')
  if (digits.length < 11) return 'Введите полный номер телефона'

  const local = digits.startsWith('7') || digits.startsWith('8')
    ? digits.slice(1)
    : digits.slice(0, 10)

  // первая цифра оператора: только 3, 4, 8, 9
  if (!['3','4','8','9'].includes(local[0]))
    return 'Некорректный номер телефона'

  const area = local.slice(0, 3)
  const rest  = local.slice(3)

  // подозрительные коды: все одинаковые цифры, 123, 000 и т.п.
  const badAreas = ['000','111','222','333','444','555','666','777','888','999','123','321']
  if (badAreas.includes(area))
    return 'Некорректный номер телефона'

  // весь номер из одинаковых цифр
  if (/^(\d)\1{9}$/.test(local))
    return 'Некорректный номер телефона'

  // подписной номер из одинаковых цифр (напр. 7777777)
  if (/^(\d)\1{6}$/.test(rest))
    return 'Некорректный номер телефона'

  // последовательности типа 1234567 / 7654321
  if (['1234567','2345678','3456789','9876543','8765432','7654321'].includes(rest))
    return 'Некорректный номер телефона'

  return null
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
