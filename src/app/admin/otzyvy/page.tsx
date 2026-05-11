import ApproveButton from './ApproveButton'

interface PendingReview {
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

interface GithubFile {
  name: string
  path: string
  sha: string
  download_url: string | null
  type: string
  url: string
}

interface Props {
  searchParams: Promise<{ secret?: string }>
}

async function fetchPendingReviews(): Promise<{ filename: string; review: PendingReview }[]> {
  const GITHUB_TOKEN = process.env.GITHUB_TOKEN
  const GITHUB_OWNER = process.env.GITHUB_OWNER
  const GITHUB_REPO = process.env.GITHUB_REPO

  if (!GITHUB_TOKEN || !GITHUB_OWNER || !GITHUB_REPO) {
    return []
  }

  // List files in scripts/pending-reviews/
  const listRes = await fetch(
    `https://api.github.com/repos/${GITHUB_OWNER}/${GITHUB_REPO}/contents/scripts/pending-reviews`,
    {
      headers: {
        Authorization: `Bearer ${GITHUB_TOKEN}`,
        Accept: 'application/vnd.github+json',
        'X-GitHub-Api-Version': '2022-11-28',
      },
      cache: 'no-store',
    }
  )

  if (!listRes.ok) {
    // Directory doesn't exist yet — no pending reviews
    return []
  }

  const files: GithubFile[] = await listRes.json()
  const jsonFiles = files.filter(f => f.type === 'file' && f.name.endsWith('.json'))

  // Fetch content of each file in parallel
  const results = await Promise.allSettled(
    jsonFiles.map(async (file) => {
      const fileRes = await fetch(file.url, {
        headers: {
          Authorization: `Bearer ${GITHUB_TOKEN}`,
          Accept: 'application/vnd.github+json',
          'X-GitHub-Api-Version': '2022-11-28',
        },
        cache: 'no-store',
      })
      if (!fileRes.ok) return null
      const fileData = await fileRes.json() as { content: string }
      const review: PendingReview = JSON.parse(Buffer.from(fileData.content, 'base64').toString('utf-8'))
      return { filename: file.name, review }
    })
  )

  return results
    .filter((r): r is PromiseFulfilledResult<{ filename: string; review: PendingReview } | null> => r.status === 'fulfilled')
    .map(r => r.value)
    .filter((r): r is { filename: string; review: PendingReview } => r !== null)
}

export default async function AdminReviewsPage({ searchParams }: Props) {
  const { secret } = await searchParams
  const ADMIN_SECRET = process.env.ADMIN_SECRET

  if (!ADMIN_SECRET || secret !== ADMIN_SECRET) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <h1 className="text-4xl font-bold text-gray-800 mb-2">403</h1>
          <p className="text-gray-600">Forbidden — неверный секрет</p>
        </div>
      </div>
    )
  }

  const pending = await fetchPendingReviews()

  return (
    <div className="min-h-screen bg-gray-50 py-10 px-4">
      <div className="max-w-4xl mx-auto">
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-gray-900">Модерация отзывов</h1>
          <p className="text-gray-500 text-sm mt-1">
            {pending.length === 0
              ? 'Нет отзывов на проверке'
              : `На проверке: ${pending.length} отзыв${pending.length === 1 ? '' : pending.length < 5 ? 'а' : 'ов'}`}
          </p>
        </div>

        {pending.length === 0 ? (
          <div className="bg-white rounded-xl border border-gray-200 p-10 text-center text-gray-400">
            <p className="text-4xl mb-2">🎉</p>
            <p>Все отзывы обработаны</p>
          </div>
        ) : (
          <div className="space-y-4">
            {pending.map(({ filename, review }) => (
              <div key={filename} className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm">
                <div className="flex items-start justify-between gap-4 flex-wrap">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap mb-2">
                      <span className="font-semibold text-gray-900 text-sm">{review.schoolName}</span>
                      <span className="text-yellow-400 text-sm">{'★'.repeat(review.rating)}{'☆'.repeat(5 - review.rating)}</span>
                      <span className="text-xs text-gray-400 bg-gray-100 px-2 py-0.5 rounded-full">
                        {new Date(review.submittedAt).toLocaleDateString('ru-RU')}
                      </span>
                    </div>

                    <div className="text-xs text-gray-500 mb-2">
                      <span className="font-medium text-gray-700">{review.authorName}</span>
                      {review.childGrade && <span className="ml-2">• {review.childGrade}</span>}
                      <span className="ml-2 text-gray-400 font-mono">{filename}</span>
                    </div>

                    <p className="text-sm text-gray-700 leading-relaxed mb-2">{review.text}</p>

                    {review.pros && (
                      <p className="text-xs text-gray-600 mb-1">
                        <span className="text-green-500 font-bold">✓</span>{' '}
                        <span className="text-gray-400">Плюсы:</span> {review.pros}
                      </p>
                    )}
                    {review.cons && (
                      <p className="text-xs text-gray-600">
                        <span className="text-red-400 font-bold">−</span>{' '}
                        <span className="text-gray-400">Минусы:</span> {review.cons}
                      </p>
                    )}
                  </div>

                  <div className="shrink-0">
                    <ApproveButton filename={filename} adminSecret={ADMIN_SECRET} />
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
