import { mkdir, open, readFile, readdir, rename, unlink } from 'node:fs/promises'
import { randomUUID } from 'node:crypto'
import path from 'node:path'

export interface PendingReview {
  schoolSlug: string
  schoolName: string
  authorName: string
  childGrade?: string
  rating: number
  text: string
  pros?: string
  cons?: string
  submittedAt: string
}
export type PublishedReview = PendingReview & { id: string; publishedAt: string }
const validId = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}\.json$/
export const validSchoolSlug = (value: unknown): value is string => typeof value === 'string' && /^[a-z0-9][a-z0-9-]{0,159}$/.test(value)

export function validateReview(value: unknown): PendingReview {
  if (!value || typeof value !== 'object' || Array.isArray(value)) throw new Error('Некорректный отзыв')
  const body = value as Record<string, unknown>
  const field = (name: string, max: number, required = false) => {
    const value = body[name]
    if (value === undefined && !required) return undefined
    if (typeof value !== 'string' || value.trim().length > max || (required && !value.trim())) throw new Error('Проверьте поля отзыва')
    return value.trim()
  }
  if (!validSchoolSlug(body.schoolSlug)) throw new Error('Не указана школа')
  if (typeof body.rating !== 'number' || !Number.isInteger(body.rating) || body.rating < 1 || body.rating > 5) throw new Error('Укажите оценку от 1 до 5')
  const text = field('text', 2000, true)!
  if (text.length < 10) throw new Error('Отзыв слишком короткий (минимум 10 символов)')
  return { schoolSlug: body.schoolSlug, schoolName: field('schoolName', 200) || body.schoolSlug,
    authorName: field('authorName', 100, true)!, childGrade: field('childGrade', 40),
    rating: body.rating, text, pros: field('pros', 1000), cons: field('cons', 1000),
    submittedAt: new Date().toISOString() }
}

function root() {
  const configured = process.env.REVIEWS_STATE_DIR
  if (process.env.NODE_ENV === 'production' && !configured) throw new Error('Reviews state directory is not configured')
  return configured || path.join(process.cwd(), '.review-state')
}
async function folder(state: 'pending' | 'approved') {
  const target = path.join(root(), state)
  await mkdir(target, { recursive: true, mode: 0o700 })
  return target
}
async function atomicWrite(target: string, value: unknown) {
  const temporary = `${target}.${randomUUID()}.tmp`
  const file = await open(temporary, 'wx', 0o600)
  try { await file.writeFile(JSON.stringify(value)); await file.sync() } finally { await file.close() }
  try { await rename(temporary, target) } catch (error) { await unlink(temporary).catch(() => {}); throw error }
}
export async function savePendingReview(review: PendingReview) {
  const directory = await folder('pending')
  if ((await readdir(directory)).length >= 5000) throw new Error('Review queue is full')
  const filename = `${randomUUID()}.json`
  await atomicWrite(path.join(directory, filename), review)
  return filename
}
export async function listPendingReviews() {
  const pending = await folder('pending')
  const approved = new Set(await readdir(await folder('approved')))
  const result: { filename: string; review: PendingReview }[] = []
  for (const filename of (await readdir(pending)).filter(name => validId.test(name) && !approved.has(name)).slice(0, 5000)) {
    const review = JSON.parse(await readFile(path.join(pending, filename), 'utf8')) as PendingReview
    result.push({ filename, review })
  }
  return result.sort((a, b) => b.review.submittedAt.localeCompare(a.review.submittedAt))
}
export async function approvePendingReview(filename: string): Promise<PublishedReview> {
  if (!validId.test(filename)) throw new Error('Invalid review identifier')
  const approved = path.join(await folder('approved'), filename)
  try { return JSON.parse(await readFile(approved, 'utf8')) as PublishedReview } catch (error) {
    if ((error as NodeJS.ErrnoException).code !== 'ENOENT') throw error
  }
  const pending = path.join(await folder('pending'), filename)
  const raw = JSON.parse(await readFile(pending, 'utf8')) as PendingReview
  const review = { ...validateReview(raw), submittedAt: raw.submittedAt, id: `rv-${filename.slice(0, -5)}`, publishedAt: new Date().toISOString() }
  await atomicWrite(approved, review)
  await unlink(pending).catch(error => { if (error.code !== 'ENOENT') throw error })
  return review
}
export async function listPublishedReviews(schoolSlug: string): Promise<PublishedReview[]> {
  if (!validSchoolSlug(schoolSlug)) throw new Error('Invalid school')
  const directory = await folder('approved')
  const result: PublishedReview[] = []
  for (const filename of (await readdir(directory)).filter(name => validId.test(name))) {
    const value = JSON.parse(await readFile(path.join(directory, filename), 'utf8')) as PublishedReview
    if (value.schoolSlug === schoolSlug) result.push(value)
  }
  return result.sort((a, b) => b.publishedAt.localeCompare(a.publishedAt))
}
