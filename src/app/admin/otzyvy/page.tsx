import type { Metadata } from 'next'
import { cookies } from 'next/headers'
import { ADMIN_COOKIE, validAdminSession } from '@/lib/review-admin'
import { listPendingReviews } from '@/lib/review-store'
import ApproveButton from './ApproveButton'

export const metadata: Metadata = { robots: { index: false, follow: false }, referrer: 'no-referrer' }

export default async function AdminReviewsPage() {
  if (!validAdminSession((await cookies()).get(ADMIN_COOKIE)?.value)) {
    return <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
      <form action="/api/reviews/login/" method="post" className="w-full max-w-sm bg-white p-6 rounded-xl border border-gray-200">
        <h1 className="text-xl font-semibold mb-4">Модерация отзывов</h1>
        <label htmlFor="review-password" className="block text-sm mb-2">Пароль администратора</label>
        <input id="review-password" name="password" type="password" autoComplete="current-password" required maxLength={256} className="w-full rounded-lg border border-gray-300 p-3 mb-4" />
        <button className="w-full bg-[#0369A1] text-white rounded-lg p-3">Войти</button>
      </form>
    </div>
  }
  const pending = await listPendingReviews()

  return (
    <div className="min-h-screen bg-gray-50 py-10 px-4">
      <div className="max-w-4xl mx-auto">
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-gray-900">Модерация отзывов</h1>
          <form action="/api/reviews/logout/" method="post" className="mt-3">
            <button className="text-sm text-gray-500 underline">Выйти</button>
          </form>
          <p className="text-gray-500 text-sm mt-1">
            {pending.length === 0
              ? 'Нет отзывов на проверке'
              : `На проверке: ${pending.length} отзыв${pending.length === 1 ? '' : pending.length < 5 ? 'а' : 'ов'}`}
          </p>
        </div>

        {pending.length === 0 ? (
          <div className="bg-white rounded-xl border border-gray-200 p-10 text-center text-gray-400">
            <p className="text-4xl mb-2">🎉</p>
            <p>Все отзывы обработаны</p>
          </div>
        ) : (
          <div className="space-y-4">
            {pending.map(({ filename, review }) => (
              <div key={filename} className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm">
                <div className="flex items-start justify-between gap-4 flex-wrap">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap mb-2">
                      <span className="font-semibold text-gray-900 text-sm">{review.schoolName}</span>
                      <span className="text-yellow-400 text-sm">{'★'.repeat(review.rating)}{'☆'.repeat(5 - review.rating)}</span>
                      <span className="text-xs text-gray-400 bg-gray-100 px-2 py-0.5 rounded-full">
                        {new Date(review.submittedAt).toLocaleDateString('ru-RU')}
                      </span>
                    </div>

                    <div className="text-xs text-gray-500 mb-2">
                      <span className="font-medium text-gray-700">{review.authorName}</span>
                      {review.childGrade && <span className="ml-2">• {review.childGrade}</span>}
                      <span className="ml-2 text-gray-400 font-mono">{filename}</span>
                    </div>

                    <p className="text-sm text-gray-700 leading-relaxed mb-2">{review.text}</p>

                    {review.pros && (
                      <p className="text-xs text-gray-600 mb-1">
                        <span className="text-green-500 font-bold">✓</span>{' '}
                        <span className="text-gray-400">Плюсы:</span> {review.pros}
                      </p>
                    )}
                    {review.cons && (
                      <p className="text-xs text-gray-600">
                        <span className="text-red-400 font-bold">−</span>{' '}
                        <span className="text-gray-400">Минусы:</span> {review.cons}
                      </p>
                    )}
                  </div>

                  <div className="shrink-0">
                    <ApproveButton filename={filename}  />
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
