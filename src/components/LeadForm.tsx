'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

interface LeadFormProps {
  schoolName?: string
  compact?: boolean
  title?: string
}

const FORMSPREE_ID = process.env.NEXT_PUBLIC_FORMSPREE_ID ?? 'mpqkebae'

export default function LeadForm({ schoolName, compact = false, title }: LeadFormProps) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [form, setForm] = useState({ name: '', phone: '', email: '', question: '' })
  const [pdAgreed, setPdAgreed] = useState(true)
  const [marketingAgreed, setMarketingAgreed] = useState(true)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)

    if (FORMSPREE_ID) {
      try {
        await fetch(`https://formspree.io/f/${FORMSPREE_ID}`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
          body: JSON.stringify({
            name: form.name,
            phone: form.phone,
            email: form.email,
            question: form.question,
            school: schoolName ?? 'Не указана',
            pd_agreed: pdAgreed,
            marketing_agreed: marketingAgreed,
            _subject: `Заявка со школьного портала: ${schoolName ?? 'общая'}`,
          }),
        })
      } catch {}
    }

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
        <input
          type="tel"
          placeholder="Телефон"
          required
          value={form.phone}
          onChange={e => setForm(f => ({ ...f, phone: e.target.value }))}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
        />
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
