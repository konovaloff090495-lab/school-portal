import { NextRequest, NextResponse } from 'next/server'
import { revalidatePath } from 'next/cache'

export const dynamic = 'force-dynamic'

const ADMIN_SECRET = process.env.ADMIN_SECRET

// Быстрая публикация статьи: после того как content/blog/<slug>.json доехал на
// VPS (git pull), этот роут инвалидирует кэш нужных путей — статья появляется на
// проде без полной пересборки сайта. Авторизация: заголовок Authorization ==
// ADMIN_SECRET (как в /api/reviews/approve).
export async function POST(req: NextRequest) {
  const authHeader = req.headers.get('Authorization')
  if (!ADMIN_SECRET || !authHeader || authHeader !== ADMIN_SECRET) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  let slug: unknown
  try {
    ;({ slug } = await req.json())
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 })
  }

  const revalidated: string[] = []
  // Индекс блога и sitemap — всегда (список статей изменился).
  revalidatePath('/blog')
  revalidated.push('/blog')
  revalidatePath('/sitemap.xml')
  revalidated.push('/sitemap.xml')

  // Конкретная статья — если slug валиден. Точный путь важен для revalidatePath.
  if (typeof slug === 'string' && /^[a-z0-9-]+$/i.test(slug)) {
    revalidatePath(`/blog/${slug}`)
    revalidated.push(`/blog/${slug}`)
  }

  return NextResponse.json({ revalidated, now: Date.now() })
}
