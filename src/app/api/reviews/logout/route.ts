import { NextRequest, NextResponse } from 'next/server'
import { ADMIN_COOKIE, sameAdminOrigin } from '@/lib/review-admin'

export async function POST(req: NextRequest) {
  if (!sameAdminOrigin(req)) return new NextResponse('Forbidden', { status: 403 })
  const response = new NextResponse(null, { status: 303, headers: { Location: '/admin/otzyvy/', 'Cache-Control': 'no-store' } })
  response.cookies.set(ADMIN_COOKIE, '', { httpOnly: true, secure: process.env.NODE_ENV === 'production', sameSite: 'strict', path: '/', maxAge: 0 })
  return response
}
