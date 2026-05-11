import { NextRequest, NextResponse } from 'next/server'

const GITHUB_TOKEN = process.env.GITHUB_TOKEN
const GITHUB_OWNER = process.env.GITHUB_OWNER
const GITHUB_REPO = process.env.GITHUB_REPO
const ADMIN_SECRET = process.env.ADMIN_SECRET

const REVIEWS_FILE_PATH = 'src/data/reviews.ts'

export async function POST(req: NextRequest) {
  // Auth check
  const authHeader = req.headers.get('Authorization')
  if (!authHeader || authHeader !== ADMIN_SECRET) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  if (!GITHUB_TOKEN || !GITHUB_OWNER || !GITHUB_REPO) {
    return NextResponse.json({ error: 'Missing GitHub configuration' }, { status: 500 })
  }

  try {
    const body = await req.json()
    const { filename } = body

    if (!filename || typeof filename !== 'string') {
      return NextResponse.json({ error: 'filename is required' }, { status: 400 })
    }

    // 1. Fetch the pending review file from GitHub
    const pendingPath = `scripts/pending-reviews/${filename}`
    const pendingRes = await fetch(
      `https://api.github.com/repos/${GITHUB_OWNER}/${GITHUB_REPO}/contents/${pendingPath}`,
      {
        headers: {
          Authorization: `Bearer ${GITHUB_TOKEN}`,
          Accept: 'application/vnd.github+json',
          'X-GitHub-Api-Version': '2022-11-28',
        },
      }
    )

    if (!pendingRes.ok) {
      return NextResponse.json({ error: 'Pending review not found' }, { status: 404 })
    }

    const pendingFile = await pendingRes.json() as { content: string; sha: string }
    const pendingSha = pendingFile.sha
    const reviewData = JSON.parse(Buffer.from(pendingFile.content, 'base64').toString('utf-8'))

    // 2. Fetch the current reviews.ts from GitHub
    const reviewsRes = await fetch(
      `https://api.github.com/repos/${GITHUB_OWNER}/${GITHUB_REPO}/contents/${REVIEWS_FILE_PATH}`,
      {
        headers: {
          Authorization: `Bearer ${GITHUB_TOKEN}`,
          Accept: 'application/vnd.github+json',
          'X-GitHub-Api-Version': '2022-11-28',
        },
      }
    )

    if (!reviewsRes.ok) {
      return NextResponse.json({ error: 'Could not fetch reviews.ts' }, { status: 500 })
    }

    const reviewsFile = await reviewsRes.json() as { content: string; sha: string }
    const reviewsFileSha = reviewsFile.sha
    const reviewsContent = Buffer.from(reviewsFile.content, 'base64').toString('utf-8')

    // 3. Build the new Review object
    const newId = `rv-${Date.now()}`
    const newReview = {
      id: newId,
      schoolSlug: reviewData.schoolSlug,
      schoolName: reviewData.schoolName,
      authorName: reviewData.authorName,
      rating: reviewData.rating,
      text: reviewData.text,
      ...(reviewData.pros ? { pros: reviewData.pros } : {}),
      ...(reviewData.cons ? { cons: reviewData.cons } : {}),
      publishedAt: new Date().toISOString(),
      ...(reviewData.childGrade ? { childGrade: reviewData.childGrade } : {}),
    }

    // 4. Append the new review to the approvedReviews array in reviews.ts
    // Find the closing bracket of the approvedReviews array
    const insertMarker = '\n]\n\nexport function getReviewsBySchool'
    if (!reviewsContent.includes(insertMarker)) {
      return NextResponse.json({ error: 'Could not parse reviews.ts structure' }, { status: 500 })
    }

    const newEntry = `  {
    id: '${newReview.id}',
    schoolSlug: '${newReview.schoolSlug}',
    schoolName: '${newReview.schoolName.replace(/'/g, "\\'")}',
    authorName: '${newReview.authorName.replace(/'/g, "\\'")}',
    rating: ${newReview.rating},
    text: '${newReview.text.replace(/'/g, "\\'").replace(/\n/g, '\\n')}',${newReview.pros ? `\n    pros: '${newReview.pros.replace(/'/g, "\\'").replace(/\n/g, '\\n')}',` : ''}${newReview.cons ? `\n    cons: '${newReview.cons.replace(/'/g, "\\'").replace(/\n/g, '\\n')}',` : ''}
    publishedAt: '${newReview.publishedAt}',${newReview.childGrade ? `\n    childGrade: '${newReview.childGrade.replace(/'/g, "\\'")}',` : ''}
  },`

    const updatedContent = reviewsContent.replace(
      insertMarker,
      `\n${newEntry}\n]\n\nexport function getReviewsBySchool`
    )

    // 5. Commit updated reviews.ts
    const updatedBase64 = Buffer.from(updatedContent).toString('base64')
    const commitRes = await fetch(
      `https://api.github.com/repos/${GITHUB_OWNER}/${GITHUB_REPO}/contents/${REVIEWS_FILE_PATH}`,
      {
        method: 'PUT',
        headers: {
          Authorization: `Bearer ${GITHUB_TOKEN}`,
          'Content-Type': 'application/json',
          Accept: 'application/vnd.github+json',
          'X-GitHub-Api-Version': '2022-11-28',
        },
        body: JSON.stringify({
          message: `Approve review ${newId} for ${newReview.schoolSlug}`,
          content: updatedBase64,
          sha: reviewsFileSha,
        }),
      }
    )

    if (!commitRes.ok) {
      const errText = await commitRes.text()
      console.error('GitHub commit error:', errText)
      return NextResponse.json({ error: 'Could not update reviews.ts' }, { status: 500 })
    }

    // 6. Delete the pending review file
    await fetch(
      `https://api.github.com/repos/${GITHUB_OWNER}/${GITHUB_REPO}/contents/${pendingPath}`,
      {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${GITHUB_TOKEN}`,
          'Content-Type': 'application/json',
          Accept: 'application/vnd.github+json',
          'X-GitHub-Api-Version': '2022-11-28',
        },
        body: JSON.stringify({
          message: `Delete approved pending review: ${filename}`,
          sha: pendingSha,
        }),
      }
    )

    return NextResponse.json({ success: true, review: newReview })
  } catch (err) {
    console.error('approve review error:', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
