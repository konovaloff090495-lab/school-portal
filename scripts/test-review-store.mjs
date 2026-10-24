import assert from 'node:assert/strict'
import { mkdtemp, readdir, rm } from 'node:fs/promises'
import os from 'node:os'
import path from 'node:path'
import { randomBytes } from 'node:crypto'
import { validateReview, savePendingReview, listPendingReviews, approvePendingReview, listPublishedReviews } from '../src/lib/review-store.ts'
import { validAdminPassword, createAdminSession, validAdminSession, sameAdminOrigin, allowReviewAttempt, boundedReviewBody } from '../src/lib/review-admin.ts'
const temporary = await mkdtemp(path.join(os.tmpdir(), 'reviews-test-'))
process.env.REVIEWS_STATE_DIR = temporary
process.env.ADMIN_SECRET = randomBytes(32).toString('hex')
const raw = { schoolSlug: 'test-school', schoolName: 'School', authorName: 'Test Author', rating: 5, text: "A valid review with quotes '\\ and <script>literal text</script>" }
try {
  for (const bad of [null, [], { ...raw, rating: 0 }, { ...raw, rating: 5.5 }, { ...raw, schoolSlug: '../escape' }, { ...raw, authorName: {} }, { ...raw, text: 'short' }, { ...raw, cons: 42 }]) assert.throws(() => validateReview(bad))
  assert.equal(validAdminPassword(process.env.ADMIN_SECRET), true)
  assert.equal(validAdminPassword(''), false)
  const session = createAdminSession()
  assert.equal(validAdminSession(session), true)
  assert.equal(validAdminSession(session + 'x'), false)
  assert.equal(validAdminSession(session, Date.now() + 5 * 3600_000), false)
  assert.equal(validAdminSession(undefined), false)
  process.env.ADMIN_SECRET = randomBytes(32).toString('hex')
  assert.equal(validAdminSession(session), false)
  assert.equal(sameAdminOrigin(new Request('https://pro-schools.ru/', { headers: { Origin: 'https://evil.example' } })), false)
  assert.equal(sameAdminOrigin(new Request('https://pro-schools.ru/', { headers: { Origin: 'https://pro-schools.ru' } })), true)
  assert.equal(sameAdminOrigin(new Request('https://pro-schools.ru/')), false)
  const request = new Request('https://pro-schools.ru/', { headers: { 'X-Real-IP': '192.0.2.20' } })
  for (let i = 0; i < 5; i++) assert.equal(allowReviewAttempt(request, 'login'), true)
  assert.equal(allowReviewAttempt(request, 'login'), false)
  assert.equal(allowReviewAttempt(request, 'submit'), true)
  await assert.rejects(boundedReviewBody(new Request('https://pro-schools.ru/', { method: 'POST', body: 'я'.repeat(8193) })))
  assert.equal(await boundedReviewBody(new Request('https://pro-schools.ru/', { method: 'POST', body: '{}' })), '{}')
  const ids = await Promise.all(Array.from({ length: 8 }, () => savePendingReview(validateReview(raw))))
  assert.equal(new Set(ids).size, 8)
  assert.equal((await listPendingReviews()).length, 8)
  assert.deepEqual(await listPublishedReviews(raw.schoolSlug), [])
  await assert.rejects(approvePendingReview('../../package.json'))
  await approvePendingReview(ids[0])
  await approvePendingReview(ids[0])
  assert.equal((await listPendingReviews()).length, 7)
  const published = await listPublishedReviews(raw.schoolSlug)
  assert.equal(published.length, 1)
  assert.equal(published[0].text, raw.text)
  assert.equal((await listPublishedReviews('another-school')).length, 0)
  assert.deepEqual((await readdir(temporary)).sort(), ['approved', 'pending'])
  console.log('Review store, moderation, session, CSRF, input and rate-limit checks passed')
} finally { await rm(temporary, { recursive: true, force: true }) }
