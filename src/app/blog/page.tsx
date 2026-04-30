import type { Metadata } from 'next'
import Link from 'next/link'
import { blogPosts } from '@/data/blog'

export const metadata: Metadata = {
  title: 'Блог про школы — советы родителям, рейтинги, выбор школы | pro-schools.ru',
  description: 'Полезные статьи для родителей: как выбрать школу, чем отличается гимназия от лицея, кадетские школы, онлайн-обучение, подготовка к ЕГЭ.',
  alternates: { canonical: 'https://pro-schools.ru/blog/' },
}

const CATEGORY_COLORS: Record<string, string> = {
  'Советы родителям': 'bg-orange-100 text-orange-700',
  'Типы школ':        'bg-blue-100 text-blue-700',
  'Рейтинги':         'bg-emerald-100 text-emerald-700',
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('ru-RU', { day: 'numeric', month: 'long', year: 'numeric' })
}

export default function BlogPage() {
  const [featured, ...rest] = blogPosts

  return (
    <div style={{ background: 'var(--cream)', minHeight: '100vh' }}>
      <style>{`
        .blog-hero { padding: 48px 24px 40px; max-width: 1280px; margin: 0 auto; }
        .blog-grid { max-width: 1280px; margin: 0 auto; padding: 0 24px 64px; }
        @media (min-width: 768px) {
          .blog-hero { padding: 64px 40px 48px; }
          .blog-grid { padding: 0 40px 80px; }
        }
        @media (min-width: 1024px) {
          .blog-hero { padding: 72px 56px 56px; }
          .blog-grid { padding: 0 56px 96px; }
        }
        .blog-featured-hover { transition: transform .15s, box-shadow .15s; }
        .blog-featured-hover:hover { transform: translateY(-2px); box-shadow: 0 20px 40px rgba(255,107,61,0.25); }
        .blog-card-hover { transition: transform .15s, box-shadow .15s; }
        .blog-card-hover:hover { transform: translateY(-2px); box-shadow: 0 8px 24px rgba(60,30,10,0.09) !important; }
      `}</style>

      {/* Header */}
      <div className="blog-hero">
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16 }}>
          <span style={{ fontSize: 13, color: 'var(--ink-3)', fontFamily: 'var(--font-manrope)' }}>
            <Link href="/" style={{ color: 'var(--ink-3)', textDecoration: 'none' }}>Главная</Link>
            {' / '}
            <span style={{ color: 'var(--ink)' }}>Блог</span>
          </span>
        </div>
        <h1 style={{
          fontFamily: 'var(--font-unbounded, sans-serif)',
          fontWeight: 700, fontSize: 'clamp(28px, 4vw, 48px)',
          color: 'var(--ink)', margin: '0 0 12px', lineHeight: 1.1,
          letterSpacing: '-0.02em',
        }}>
          Блог для родителей
        </h1>
        <p style={{ fontFamily: 'var(--font-manrope)', fontSize: 18, color: 'var(--ink-3)', margin: 0 }}>
          Советы по выбору школы, рейтинги и разборы форматов образования
        </p>
      </div>

      <div className="blog-grid">
        {/* Featured post */}
        <Link href={`/blog/${featured.slug}/`} style={{ textDecoration: 'none', display: 'block', marginBottom: 40 }}>
          <article className="blog-featured-hover" style={{
            background: 'linear-gradient(135deg, #FFB988 0%, #FF8B5A 65%, #FF6B3D 100%)',
            borderRadius: 28, padding: 'clamp(28px, 4vw, 48px)',
            color: 'white', position: 'relative', overflow: 'hidden',
          }}>
            {/* Decoration */}
            <svg style={{ position: 'absolute', top: 20, right: 60, opacity: 0.3 }} width="60" height="60" viewBox="0 0 60 60" aria-hidden="true">
              <path d="M30 0 Q33 27 60 30 Q33 33 30 60 Q27 33 0 30 Q27 27 30 0Z" fill="#FFC547"/>
            </svg>

            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 18, flexWrap: 'wrap' }}>
              <span style={{
                background: 'rgba(255,255,255,0.25)', backdropFilter: 'blur(8px)',
                borderRadius: 999, padding: '4px 12px', fontSize: 12, fontWeight: 700,
                fontFamily: 'var(--font-manrope)', border: '1px solid rgba(255,255,255,0.3)',
              }}>
                ⭐ Главная статья
              </span>
              <span style={{ fontSize: 12, opacity: 0.85, fontFamily: 'var(--font-manrope)' }}>
                {featured.category} · {featured.readTime} мин
              </span>
            </div>

            <h2 style={{
              fontFamily: 'var(--font-unbounded, sans-serif)',
              fontWeight: 700, fontSize: 'clamp(20px, 3vw, 30px)',
              lineHeight: 1.15, margin: '0 0 14px', letterSpacing: '-0.01em',
              color: 'white',
            }}>
              {featured.title}
            </h2>
            <p style={{ fontFamily: 'var(--font-manrope)', fontSize: 16, opacity: 0.92, margin: '0 0 20px', lineHeight: 1.6, maxWidth: 680 }}>
              {featured.excerpt}
            </p>
            <div style={{ display: 'flex', alignItems: 'center', gap: 16, flexWrap: 'wrap' }}>
              <span style={{
                display: 'inline-flex', alignItems: 'center', gap: 6,
                background: '#1A1814', color: 'white', borderRadius: 999,
                padding: '10px 22px', fontSize: 14, fontWeight: 700,
                fontFamily: 'var(--font-manrope)',
                boxShadow: '0 4px 0 #000',
              }}>
                Читать статью →
              </span>
              <span style={{ fontSize: 13, opacity: 0.8, fontFamily: 'var(--font-manrope)' }}>
                {featured.author}
              </span>
            </div>
          </article>
        </Link>

        {/* Posts grid */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: 20 }}>
          {rest.map(post => (
            <Link key={post.slug} href={`/blog/${post.slug}/`} style={{ textDecoration: 'none' }}>
              <article className="blog-card-hover" style={{
                background: 'white', borderRadius: 20,
                border: '1px solid rgba(26,24,20,0.08)',
                padding: '24px 24px 20px',
                height: '100%', display: 'flex', flexDirection: 'column',
                boxShadow: '0 1px 3px rgba(60,30,10,0.04)',
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 14, flexWrap: 'wrap' }}>
                  <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${CATEGORY_COLORS[post.category] ?? 'bg-gray-100 text-gray-600'}`}>
                    {post.category}
                  </span>
                  <span style={{ fontSize: 12, color: 'var(--ink-3)', fontFamily: 'var(--font-manrope)' }}>
                    {post.readTime} мин
                  </span>
                </div>

                <h2 style={{
                  fontFamily: 'var(--font-manrope, sans-serif)',
                  fontWeight: 700, fontSize: 17, lineHeight: 1.35,
                  color: 'var(--ink)', margin: '0 0 10px',
                }}>
                  {post.title}
                </h2>
                <p style={{
                  fontFamily: 'var(--font-manrope)', fontSize: 14,
                  color: 'var(--ink-3)', lineHeight: 1.55,
                  margin: '0 0 18px', flex: 1,
                  display: '-webkit-box', WebkitLineClamp: 3,
                  WebkitBoxOrient: 'vertical', overflow: 'hidden',
                } as React.CSSProperties}>
                  {post.excerpt}
                </p>

                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: 'auto' }}>
                  <div>
                    <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--ink)', fontFamily: 'var(--font-manrope)' }}>
                      {post.author}
                    </div>
                    <div style={{ fontSize: 11, color: 'var(--ink-3)', fontFamily: 'var(--font-manrope)', marginTop: 2 }}>
                      {formatDate(post.publishedAt)}
                    </div>
                  </div>
                  <span style={{ color: 'var(--coral-500)', fontSize: 20, lineHeight: 1 }}>→</span>
                </div>
              </article>
            </Link>
          ))}
        </div>
      </div>
    </div>
  )
}
