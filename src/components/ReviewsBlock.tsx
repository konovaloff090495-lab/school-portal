'use client'
import { useState } from 'react'
import { getReviewsBySchool, getAverageRating, type Review } from '@/data/reviews'
import ReviewForm from '@/components/ReviewForm'

interface ReviewsBlockProps {
  schoolSlug: string
  schoolName: string
}

function formatDate(isoString: string): string {
  const date = new Date(isoString)
  return date.toLocaleDateString('ru-RU', { day: 'numeric', month: 'long', year: 'numeric' })
}

function StarRating({ rating, max = 5 }: { rating: number; max?: number }) {
  return (
    <span className="text-base leading-none">
      {Array.from({ length: max }, (_, i) => (
        <span key={i} className={i < rating ? 'text-yellow-400' : 'text-gray-300'}>
          {i < rating ? '★' : '☆'}
        </span>
      ))}
    </span>
  )
}

function ReviewCard({ review }: { review: Review }) {
  return (
    <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-5">
      <div className="flex items-start justify-between gap-3 mb-3">
        <div>
          <p className="font-semibold text-gray-900 text-sm">{review.authorName}</p>
          <p className="text-xs text-gray-400 mt-0.5">{formatDate(review.publishedAt)}</p>
          {review.childGrade && (
            <p className="text-xs text-gray-400 mt-0.5">Ребёнок: {review.childGrade}</p>
          )}
        </div>
        <StarRating rating={review.rating} />
      </div>

      <p className="text-sm text-gray-700 leading-relaxed mb-3">{review.text}</p>

      {review.pros && (
        <div className="flex items-start gap-2 text-sm text-gray-700 mb-1.5">
          <span className="text-green-500 font-bold shrink-0 mt-0.5">✓</span>
          <span><span className="text-gray-500 text-xs mr-1">Плюсы:</span>{review.pros}</span>
        </div>
      )}
      {review.cons && (
        <div className="flex items-start gap-2 text-sm text-gray-700">
          <span className="text-red-400 font-bold shrink-0 mt-0.5">−</span>
          <span><span className="text-gray-500 text-xs mr-1">Минусы:</span>{review.cons}</span>
        </div>
      )}
    </div>
  )
}

export default function ReviewsBlock({ schoolSlug, schoolName }: ReviewsBlockProps) {
  const [showForm, setShowForm] = useState(false)
  const reviews = getReviewsBySchool(schoolSlug)
  const avgRating = getAverageRating(schoolSlug)

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-6">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3 mb-5">
        <div className="flex items-center gap-3">
          <h2 className="text-lg font-semibold text-gray-900">Отзывы родителей</h2>
          {avgRating !== null && (
            <div className="flex items-center gap-1.5 bg-yellow-50 border border-yellow-200 rounded-full px-3 py-1">
              <span className="text-yellow-400 text-base leading-none">★</span>
              <span className="text-sm font-semibold text-gray-800">{avgRating}</span>
              <span className="text-xs text-gray-400">({reviews.length})</span>
            </div>
          )}
        </div>
        {!showForm && (
          <button
            onClick={() => setShowForm(true)}
            className="text-sm bg-[#0369A1] text-white px-4 py-2 rounded-lg font-medium hover:bg-blue-500 transition-colors cursor-pointer"
          >
            Оставить отзыв
          </button>
        )}
      </div>

      {/* Form (toggled inline) */}
      {showForm && (
        <div className="mb-6">
          <ReviewForm
            schoolSlug={schoolSlug}
            schoolName={schoolName}
            onClose={() => setShowForm(false)}
          />
        </div>
      )}

      {/* Reviews list */}
      {reviews.length === 0 ? (
        <div className="text-center py-10 text-gray-400">
          <p className="text-4xl mb-2">💬</p>
          <p className="text-sm">Пока нет отзывов — будьте первым</p>
          {!showForm && (
            <button
              onClick={() => setShowForm(true)}
              className="mt-3 text-sm text-[#0369A1] underline hover:no-underline cursor-pointer"
            >
              Написать отзыв
            </button>
          )}
        </div>
      ) : (
        <div className="space-y-4">
          {reviews.map(review => (
            <ReviewCard key={review.id} review={review} />
          ))}
        </div>
      )}
    </div>
  )
}
