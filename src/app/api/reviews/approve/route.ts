import { NextRequest, NextResponse } from 'next/server'
import { ADMIN_COOKIE, boundedReviewBody, sameAdminOrigin, validAdminSession } from '@/lib/review-admin'
import { approvePendingReview } from '@/lib/review-store'

export async function POST(req: NextRequest) {
  if (!validAdminSession(req.cookies.get(ADMIN_COOKIE)?.value)) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  if (!sameAdminOrigin(req)) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  try {
    const body = JSON.parse(await boundedReviewBody(req, 1024))
    if (!body || typeof body.filename !== 'string') return NextResponse.json({ error: 'Invalid review' }, { status: 400 })
    const review = await approvePendingReview(body.filename)
    return NextResponse.json({ success: true, review })
  } catch {
    return NextResponse.json({ error: 'Не удалось одобрить отзыв. Обновите страницу.' }, { status: 400 })
  }
}
