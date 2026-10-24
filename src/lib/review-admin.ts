import { createHash, createHmac, randomBytes, timingSafeEqual } from 'node:crypto'

export const ADMIN_COOKIE = 'proschools-review-admin'
export const SESSION_SECONDS = 4 * 60 * 60
function secret() { const value = process.env.ADMIN_SECRET; return value && value.length >= 32 ? value : null }
function equal(a: string, b: string) { return timingSafeEqual(createHash('sha256').update(a).digest(), createHash('sha256').update(b).digest()) }
export function validAdminPassword(value: string) { const expected = secret(); return !!expected && equal(value, expected) }
export function createAdminSession(now = Date.now()) {
  const key = secret()
  if (!key) throw new Error('Admin authentication is not configured')
  const payload = `${Math.floor(now / 1000) + SESSION_SECONDS}.${randomBytes(16).toString('hex')}`
  return `${payload}.${createHmac('sha256', key).update(`reviews:v1:${payload}`).digest('hex')}`
}
export function validAdminSession(value: string | undefined, now = Date.now()) {
  const key = secret()
  if (!key || !value || !/^\d{10}\.[0-9a-f]{32}\.[0-9a-f]{64}$/.test(value)) return false
  const [expiry, nonce, signature] = value.split('.')
  const remaining = Number(expiry) - Math.floor(now / 1000)
  return remaining > 0 && remaining <= SESSION_SECONDS && equal(signature, createHmac('sha256', key).update(`reviews:v1:${expiry}.${nonce}`).digest('hex'))
}
export function sameAdminOrigin(request: Request) {
  return request.headers.get('origin') === (process.env.ADMIN_ORIGIN || 'https://pro-schools.ru')
}
const attempts = new Map<string, { count: number; reset: number }>()
export function allowReviewAttempt(request: Request, kind: 'login' | 'submit', now = Date.now()) {
  const ip = request.headers.get('x-real-ip') || 'unknown'
  const key = createHash('sha256').update(`${kind}:${ip}`).digest('hex')
  for (const [id, state] of attempts) if (state.reset <= now) attempts.delete(id)
  let state = attempts.get(key)
  if (!state) {
    if (attempts.size >= 10000) return false
    state = { count: 0, reset: now + 15 * 60 * 1000 }; attempts.set(key, state)
  }
  return ++state.count <= 5
}
export async function boundedReviewBody(request: Request, maximum = 16384) {
  const reader = request.body?.getReader()
  if (!reader) throw new Error('Empty request')
  const chunks: Uint8Array[] = []; let size = 0
  try {
    while (true) {
      const { done, value } = await reader.read()
      if (done) break
      size += value.byteLength
      if (size > maximum) { await reader.cancel(); throw new Error('Request too large') }
      chunks.push(value)
    }
  } finally { reader.releaseLock() }
  return Buffer.concat(chunks).toString('utf8')
}
