import 'server-only'
import { createHmac, timingSafeEqual, createHash } from 'node:crypto'
import type { NextRequest } from 'next/server'
import { SubmissionError } from './store'
export const validId = (id: string) => /^[a-f0-9]{32}$/.test(id)
export const sameSecret = (left: string, right: string) => { const a=Buffer.from(left), b=Buffer.from(right); return a.length===b.length && timingSafeEqual(a,b) }
export function checkOrigin(req: NextRequest) {
  const origin = req.headers.get('origin')
  const expected = process.env.NODE_ENV === 'production' ? 'https://pro-schools.ru' : new URL(req.url).origin
  if (origin !== expected && !(process.env.NODE_ENV === 'production' && origin === 'https://www.pro-schools.ru')) throw new SubmissionError('Запрос с другого сайта отклонён',403)
}
const sign = (text: string) => createHmac('sha256',process.env.ADMIN_SECRET || 'unconfigured').update('school-admin:'+text).digest('hex')
export function adminSession() { const expiry = String(Math.floor(Date.now()/1000)+8*3600); return expiry+'.'+sign(expiry) }
export function isAdmin(req: NextRequest) {
  if (!process.env.ADMIN_SECRET) return false
  const [expiry, signature] = (req.cookies.get('ps_school_admin')?.value || '').split('.')
  return /^\d{10}$/.test(expiry || '') && Number(expiry)>Date.now()/1000 && sameSecret(signature || '',sign(expiry))
}
export function requireAdmin(req: NextRequest) { if (!isAdmin(req)) throw new SubmissionError('Войдите в раздел модерации',401) }
export function owner(req: NextRequest): {id: string; token: string} {
  const auth = req.headers.get('authorization')?.replace(/^Bearer /,'') || req.cookies.get('ps_school_owner')?.value || ''
  const [id,token] = auth.split('.')
  if (!validId(id || '') || !/^[a-f0-9]{64}$/.test(token || '')) throw new SubmissionError('Откройте личную ссылку из письма',403)
  return {id,token}
}
export function ipHash(req: NextRequest) { return createHash('sha256').update((process.env.ADMIN_SECRET || '')+':'+(req.headers.get('x-real-ip') || 'unknown')).digest('hex') }
