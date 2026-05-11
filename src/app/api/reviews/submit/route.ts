import { NextRequest, NextResponse } from 'next/server'

const GITHUB_TOKEN = process.env.GITHUB_TOKEN
const GITHUB_OWNER = process.env.GITHUB_OWNER
const GITHUB_REPO = process.env.GITHUB_REPO

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { schoolSlug, schoolName, authorName, childGrade, rating, text, pros, cons } = body

    // Validation
    if (!authorName || typeof authorName !== 'string' || authorName.trim().length === 0) {
      return NextResponse.json({ error: 'Укажите ваше имя' }, { status: 400 })
    }
    if (!text || typeof text !== 'string' || text.trim().length < 10) {
      return NextResponse.json({ error: 'Отзыв слишком короткий (минимум 10 символов)' }, { status: 400 })
    }
    if (text.trim().length > 2000) {
      return NextResponse.json({ error: 'Отзыв слишком длинный (максимум 2000 символов)' }, { status: 400 })
    }
    if (!rating || typeof rating !== 'number' || rating < 1 || rating > 5 || !Number.isInteger(rating)) {
      return NextResponse.json({ error: 'Укажите оценку от 1 до 5' }, { status: 400 })
    }
    if (!schoolSlug || typeof schoolSlug !== 'string') {
      return NextResponse.json({ error: 'Не указана школа' }, { status: 400 })
    }

    if (!GITHUB_TOKEN || !GITHUB_OWNER || !GITHUB_REPO) {
      console.error('Missing GitHub env vars')
      return NextResponse.json({ error: 'Сервис временно недоступен' }, { status: 500 })
    }

    const timestamp = Date.now()
    const filename = `${timestamp}-${schoolSlug}.json`
    const reviewData = {
      schoolSlug: schoolSlug.trim(),
      schoolName: (schoolName ?? '').trim(),
      authorName: authorName.trim(),
      childGrade: childGrade ? childGrade.trim() : undefined,
      rating,
      text: text.trim(),
      pros: pros ? pros.trim() : undefined,
      cons: cons ? cons.trim() : undefined,
      submittedAt: new Date().toISOString(),
    }

    const content = Buffer.from(JSON.stringify(reviewData, null, 2)).toString('base64')

    const ghRes = await fetch(
      `https://api.github.com/repos/${GITHUB_OWNER}/${GITHUB_REPO}/contents/scripts/pending-reviews/${filename}`,
      {
        method: 'PUT',
        headers: {
          Authorization: `Bearer ${GITHUB_TOKEN}`,
          'Content-Type': 'application/json',
          Accept: 'application/vnd.github+json',
          'X-GitHub-Api-Version': '2022-11-28',
        },
        body: JSON.stringify({
          message: `Add pending review: ${filename}`,
          content,
        }),
      }
    )

    if (!ghRes.ok) {
      const ghErr = await ghRes.text()
      console.error('GitHub API error:', ghErr)
      return NextResponse.json({ error: 'Не удалось сохранить отзыв. Попробуйте позже.' }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (err) {
    console.error('submit review error:', err)
    return NextResponse.json({ error: 'Внутренняя ошибка сервера' }, { status: 500 })
  }
}
