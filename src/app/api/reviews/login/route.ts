import { NextRequest, NextResponse } from 'next/server'
import { ADMIN_COOKIE, SESSION_SECONDS, allowReviewAttempt, boundedReviewBody, createAdminSession, sameAdminOrigin, validAdminPassword } from '@/lib/review-admin'

export async function POST(req: NextRequest) {
  if (!sameAdminOrigin(req)) return new NextResponse('Forbidden', { status: 403 })
  if (!allowReviewAttempt(req, 'login')) return new NextResponse('Слишком много попыток. Попробуйте позже.', { status: 429 })
  let password = ''
  try { password = new URLSearchParams(await boundedReviewBody(req, 1024)).get('password') || '' } catch { return new NextResponse('Invalid request', { status: 400 }) }
  if (!validAdminPassword(password)) return new NextResponse('Неверный пароль. Вернитесь назад и повторите вход.', { status: 401 })
  const response = new NextResponse(null, { status: 303, headers: { Location: '/admin/otzyvy/', 'Cache-Control': 'no-store' } })
  response.cookies.set(ADMIN_COOKIE, createAdminSession(), { httpOnly: true, secure: process.env.NODE_ENV === 'production', sameSite: 'strict', path: '/', maxAge: SESSION_SECONDS })
  return response
}
