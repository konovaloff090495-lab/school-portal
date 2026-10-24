import { NextRequest, NextResponse } from 'next/server'
import { allowReviewAttempt, boundedReviewBody } from '@/lib/review-admin'
import { savePendingReview, validateReview } from '@/lib/review-store'
import { sendTelegramMessage } from '@/lib/telegram'

export async function POST(req: NextRequest) {
  if (!allowReviewAttempt(req, 'submit')) return NextResponse.json({ error: 'Слишком много попыток. Попробуйте позже.' }, { status: 429 })
  let review
  try { review = validateReview(JSON.parse(await boundedReviewBody(req))) } catch {
    return NextResponse.json({ error: 'Проверьте поля отзыва: имя, школу, оценку и текст от 10 до 2000 символов.' }, { status: 400 })
  }
  try {
    await savePendingReview(review)
    const escape = (value: string) => value.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
    sendTelegramMessage(`📝 <b>Новый отзыв</b>\n🏫 ${escape(review.schoolName)}\n👤 ${escape(review.authorName)}\n${'⭐'.repeat(review.rating)}\n\n${escape(review.text)}\n\n⏳ Ожидает модерации\nhttps://pro-schools.ru/admin/otzyvy/`).catch(() => {})
    return NextResponse.json({ success: true })
  } catch {
    console.error('Review queue write failed')
    return NextResponse.json({ error: 'Не удалось сохранить отзыв. Попробуйте позже.' }, { status: 503 })
  }
}
