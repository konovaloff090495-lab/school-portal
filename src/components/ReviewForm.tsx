'use client'
import { useState } from 'react'

interface ReviewFormProps {
  schoolSlug: string
  schoolName: string
  onClose: () => void
}

export default function ReviewForm({ schoolSlug, schoolName, onClose }: ReviewFormProps) {
  const [rating, setRating] = useState(0)
  const [hoverRating, setHoverRating] = useState(0)
  const [authorName, setAuthorName] = useState('')
  const [childGrade, setChildGrade] = useState('')
  const [text, setText] = useState('')
  const [pros, setPros] = useState('')
  const [cons, setCons] = useState('')
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (rating === 0) {
      setError('Пожалуйста, выберите оценку')
      return
    }
    setLoading(true)
    setError(null)

    try {
      const res = await fetch('/api/reviews/submit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          schoolSlug,
          schoolName,
          authorName,
          childGrade: childGrade || undefined,
          rating,
          text,
          pros: pros || undefined,
          cons: cons || undefined,
        }),
      })
      const data = await res.json()
      if (!res.ok || data.error) {
        setError(data.error ?? 'Произошла ошибка. Попробуйте позже.')
      } else {
        setSuccess(true)
      }
    } catch {
      setError('Не удалось отправить отзыв. Проверьте соединение и попробуйте снова.')
    } finally {
      setLoading(false)
    }
  }

  if (success) {
    return (
      <div className="bg-green-50 border border-green-200 rounded-xl p-6 text-center">
        <div className="text-3xl mb-2">✓</div>
        <p className="text-green-800 font-semibold text-base mb-1">Спасибо! Ваш отзыв отправлен на проверку</p>
        <p className="text-green-600 text-sm mb-4">После модерации он появится на странице школы</p>
        <button
          onClick={onClose}
          className="text-sm text-green-700 underline hover:no-underline cursor-pointer"
        >
          Закрыть
        </button>
      </div>
    )
  }

  return (
    <div className="bg-white border border-gray-200 rounded-xl p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-base font-semibold text-gray-900">Оставить отзыв о школе</h3>
        <button
          onClick={onClose}
          className="text-gray-400 hover:text-gray-600 text-xl leading-none cursor-pointer"
          aria-label="Закрыть форму"
        >
          ×
        </button>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Rating */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Оценка <span className="text-red-500">*</span>
          </label>
          <div className="flex gap-1">
            {[1, 2, 3, 4, 5].map(star => (
              <button
                key={star}
                type="button"
                onClick={() => setRating(star)}
                onMouseEnter={() => setHoverRating(star)}
                onMouseLeave={() => setHoverRating(0)}
                className="text-2xl leading-none transition-colors cursor-pointer"
                aria-label={`${star} звезда`}
              >
                <span className={(hoverRating || rating) >= star ? 'text-yellow-400' : 'text-gray-300'}>
                  ★
                </span>
              </button>
            ))}
          </div>
        </div>

        {/* Author name */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Ваше имя <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            required
            value={authorName}
            onChange={e => setAuthorName(e.target.value)}
            placeholder="Например: Мария К."
            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        {/* Child grade */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Класс ребёнка <span className="text-gray-400 font-normal">(необязательно)</span>
          </label>
          <input
            type="text"
            value={childGrade}
            onChange={e => setChildGrade(e.target.value)}
            placeholder="3 класс"
            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        {/* Main text */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Ваш отзыв <span className="text-red-500">*</span>
          </label>
          <textarea
            required
            value={text}
            onChange={e => setText(e.target.value)}
            placeholder="Расскажите о вашем опыте в этой школе..."
            rows={4}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
          />
        </div>

        {/* Pros */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Что понравилось <span className="text-gray-400 font-normal">(необязательно)</span>
          </label>
          <textarea
            value={pros}
            onChange={e => setPros(e.target.value)}
            placeholder="Преимущества школы..."
            rows={2}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
          />
        </div>

        {/* Cons */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Что не понравилось <span className="text-gray-400 font-normal">(необязательно)</span>
          </label>
          <textarea
            value={cons}
            onChange={e => setCons(e.target.value)}
            placeholder="Недостатки школы..."
            rows={2}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
          />
        </div>

        {error && (
          <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2">
            {error}
          </p>
        )}

        <div className="flex gap-3 pt-1">
          <button
            type="submit"
            disabled={loading}
            className="flex-1 bg-[#0369A1] text-white py-2.5 rounded-lg text-sm font-semibold hover:bg-blue-500 transition-colors disabled:opacity-60 cursor-pointer"
          >
            {loading ? 'Отправляем...' : 'Отправить отзыв'}
          </button>
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2.5 border border-gray-300 text-gray-700 rounded-lg text-sm hover:bg-gray-50 transition-colors cursor-pointer"
          >
            Отмена
          </button>
        </div>
      </form>
    </div>
  )
}
