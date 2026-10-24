import { NextRequest, NextResponse } from 'next/server'
import { listPublishedReviews, validSchoolSlug } from '@/lib/review-store'

export async function GET(req: NextRequest) {
  const school = req.nextUrl.searchParams.get('school')
  if (!validSchoolSlug(school)) return NextResponse.json({ error: 'Invalid school' }, { status: 400 })
  try {
    return NextResponse.json({ reviews: await listPublishedReviews(school) }, { headers: { 'Cache-Control': 'public, max-age=30' } })
  } catch {
    return NextResponse.json({ error: 'Отзывы временно недоступны' }, { status: 503 })
  }
}
