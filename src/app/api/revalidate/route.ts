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
  let gdz: unknown
  let uchebnik: unknown
  try {
    ;({ slug, gdz, uchebnik } = await req.json())
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 })
  }

  const revalidated: string[] = []

  // Публикация решений ГДЗ (scripts/gdz_publish.sh): данные книг доехали git pull,
  // сбрасываем весь раздел /gdz и его sitemap-индекс с чанками.
  if (gdz === true) {
    revalidatePath('/gdz', 'layout')
    revalidated.push('/gdz/*')
    revalidatePath('/sitemap-gdz.xml')
    revalidated.push('/sitemap-gdz.xml')
    for (let i = 1; i <= 30; i++) revalidatePath(`/sitemap-gdz/${i}`)
    revalidated.push('/sitemap-gdz/1..30')
    revalidatePath('/sitemap.xml')
    revalidated.push('/sitemap.xml')
    return NextResponse.json({ revalidated, now: Date.now() })
  }
  // Массовые правки тем «Учебника» (заголовки/описания, шаблон): страницы тем
  // живут в ISR-кэше сутки (revalidate = 86400), и после деплоя прод отдаёт старый
  // HTML — сбрасываем весь раздел.
  if (uchebnik === true) {
    revalidatePath('/uchebnik', 'layout')
    revalidated.push('/uchebnik/*')
    revalidatePath('/sitemap.xml')
    revalidated.push('/sitemap.xml')
    return NextResponse.json({ revalidated, now: Date.now() })
  }
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
