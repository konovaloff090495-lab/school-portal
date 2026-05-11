import type { Metadata } from 'next'
import Link from 'next/link'
import Image from 'next/image'
import { notFound } from 'next/navigation'
import { blogPosts, getPostBySlug, getAllPostSlugs } from '@/data/blog'
import { sanitizeHtml } from '@/lib/sanitize'

interface Props {
  params: Promise<{ slug: string }>
}

export async function generateStaticParams() {
  return getAllPostSlugs().map(slug => ({ slug }))
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params
  const post = getPostBySlug(slug)
  if (!post) return {}
  return {
    title: `${post.title} | Блог pro-schools.ru`,
    description: post.excerpt,
    alternates: { canonical: `https://pro-schools.ru/blog/${slug}/` },
    openGraph: {
      title: post.title,
      description: post.excerpt,
      type: 'article',
      publishedTime: post.publishedAt,
      authors: [post.author],
    },
  }
}

const CATEGORY_COLORS: Record<string, string> = {
  'Советы родителям': 'bg-orange-100 text-orange-700',
  'Типы школ':        'bg-blue-100 text-blue-700',
  'Рейтинги':         'bg-emerald-100 text-emerald-700',
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('ru-RU', { day: 'numeric', month: 'long', year: 'numeric' })
}

export default async function BlogPostPage({ params }: Props) {
  const { slug } = await params
  const post = getPostBySlug(slug)
  if (!post) notFound()

  const related = blogPosts.filter(p => p.slug !== slug && p.category === post.category).slice(0, 2)
  const others  = related.length < 2
    ? [...related, ...blogPosts.filter(p => p.slug !== slug && !related.includes(p)).slice(0, 2 - related.length)]
    : related

  // Article schema
  const articleSchema = {
    '@context': 'https://schema.org',
    '@type': 'Article',
    headline: post.title,
    description: post.excerpt,
    author: { '@type': 'Person', name: post.author },
    datePublished: post.publishedAt,
    publisher: {
      '@type': 'Organization',
      name: 'pro-schools.ru',
      url: 'https://pro-schools.ru',
    },
    mainEntityOfPage: `https://pro-schools.ru/blog/${slug}/`,
  }

  return (
    <div style={{ background: 'var(--cream)', minHeight: '100vh' }}>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(articleSchema) }} />

      <style>{`
        .post-wrap { max-width: 1280px; margin: 0 auto; padding: 40px 20px 80px; }
        .post-layout { display: grid; grid-template-columns: 1fr; gap: 32px; }
        .post-sidebar { display: none; }
        @media (min-width: 768px) {
          .post-wrap { padding: 48px 40px 96px; }
        }
        @media (min-width: 1024px) {
          .post-wrap { padding: 56px 56px 96px; }
          .post-layout { grid-template-columns: 1fr 280px; gap: 48px; }
          .post-sidebar { display: block; }
        }

        /* Article typography */
        .post-body h2 {
          font-family: var(--font-unbounded, sans-serif);
          font-weight: 700; font-size: 22px; color: var(--ink);
          margin: 36px 0 14px; line-height: 1.3; letter-spacing: -0.01em;
        }
        .post-body h3 {
          font-family: var(--font-manrope, sans-serif);
          font-weight: 700; font-size: 18px; color: var(--ink);
          margin: 28px 0 10px;
        }
        .post-body p {
          font-family: var(--font-manrope, sans-serif);
          font-size: 16px; line-height: 1.75; color: #2D2620;
          margin: 0 0 18px;
        }
        .post-body ul, .post-body ol {
          font-family: var(--font-manrope, sans-serif);
          font-size: 16px; line-height: 1.7; color: #2D2620;
          margin: 0 0 18px; padding-left: 24px;
        }
        .post-body li { margin-bottom: 8px; }
        .post-body strong { color: var(--ink); font-weight: 700; }
        .post-body em { color: var(--ink-2); font-style: italic; }
        .blog-card-hover { transition: transform .15s, box-shadow .15s; }
        .blog-card-hover:hover { transform: translateY(-2px); box-shadow: 0 8px 20px rgba(60,30,10,0.08) !important; }
        .sidebar-link:hover h3 { color: var(--coral-500); }
      `}</style>

      <div className="post-wrap">
        {/* Breadcrumbs */}
        <nav style={{ marginBottom: 28, fontFamily: 'var(--font-manrope)', fontSize: 13, color: 'var(--ink-3)' }}>
          <Link href="/" style={{ color: 'var(--ink-3)', textDecoration: 'none' }}>Главная</Link>
          {' / '}
          <Link href="/blog/" style={{ color: 'var(--ink-3)', textDecoration: 'none' }}>Блог</Link>
          {' / '}
          <span style={{ color: 'var(--ink)' }}>{post.title}</span>
        </nav>

        <div className="post-layout">
          {/* Main content */}
          <main>
            {/* Header */}
            <header style={{ marginBottom: 32 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16, flexWrap: 'wrap' }}>
                <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${CATEGORY_COLORS[post.category] ?? 'bg-gray-100 text-gray-600'}`}>
                  {post.category}
                </span>
                <span style={{ fontSize: 13, color: 'var(--ink-3)', fontFamily: 'var(--font-manrope)' }}>
                  {post.readTime} минут чтения
                </span>
                <span style={{ fontSize: 13, color: 'var(--ink-3)', fontFamily: 'var(--font-manrope)' }}>
                  {formatDate(post.publishedAt)}
                </span>
              </div>

              <h1 style={{
                fontFamily: 'var(--font-unbounded, sans-serif)',
                fontWeight: 700, fontSize: 'clamp(24px, 3.5vw, 38px)',
                color: 'var(--ink)', margin: '0 0 18px',
                lineHeight: 1.15, letterSpacing: '-0.02em',
              }}>
                {post.title}
              </h1>

              <p style={{
                fontFamily: 'var(--font-manrope)', fontSize: 18,
                color: 'var(--ink-3)', lineHeight: 1.6, margin: '0 0 24px',
              }}>
                {post.excerpt}
              </p>

              {/* Hero image */}
              {post.imageUrl && (
                <div style={{ position: 'relative', width: '100%', height: 'clamp(200px, 40vw, 420px)', borderRadius: 20, overflow: 'hidden', marginBottom: 28 }}>
                  <Image
                    src={post.imageUrl}
                    alt={post.imageAlt}
                    fill
                    style={{ objectFit: 'cover' }}
                    priority
                  />
                </div>
              )}

              {/* Author */}
              <div style={{
                display: 'flex', alignItems: 'center', gap: 12,
                padding: '14px 18px', background: 'white', borderRadius: 14,
                border: '1px solid rgba(26,24,20,0.08)',
                fontFamily: 'var(--font-manrope)',
              }}>
                <div style={{
                  width: 42, height: 42, borderRadius: '50%',
                  background: 'linear-gradient(135deg, #FFB988, #FF6B3D)',
                  display: 'grid', placeItems: 'center',
                  color: 'white', fontWeight: 700, fontSize: 16, flexShrink: 0,
                }}>
                  {post.author[0]}
                </div>
                <div>
                  <div style={{ fontWeight: 700, fontSize: 14, color: 'var(--ink)' }}>{post.author}</div>
                  <div style={{ fontSize: 12, color: 'var(--ink-3)', marginTop: 2 }}>{post.authorRole}</div>
                </div>
              </div>
            </header>

            {/* Article body */}
            <article
              className="post-body"
              style={{
                background: 'white', borderRadius: 20, padding: 'clamp(24px, 4vw, 40px)',
                border: '1px solid rgba(26,24,20,0.07)',
                boxShadow: '0 2px 8px rgba(60,30,10,0.04)',
              }}
              dangerouslySetInnerHTML={{ __html: sanitizeHtml(post.content) }}
            />

            {/* Tags */}
            <div style={{ marginTop: 28, display: 'flex', flexWrap: 'wrap', gap: 8 }}>
              {post.tags.map(tag => (
                <span key={tag} style={{
                  fontSize: 12, fontFamily: 'var(--font-manrope)', fontWeight: 600,
                  background: 'white', border: '1px solid rgba(26,24,20,0.12)',
                  borderRadius: 999, padding: '5px 12px', color: 'var(--ink-3)',
                }}>
                  #{tag}
                </span>
              ))}
            </div>

            {/* CTA */}
            <div style={{
              marginTop: 40, background: 'linear-gradient(135deg, #FFB988 0%, #FF6B3D 100%)',
              borderRadius: 24, padding: '32px 28px', color: 'white',
              fontFamily: 'var(--font-manrope)',
            }}>
              <div style={{ fontFamily: 'var(--font-unbounded)', fontWeight: 700, fontSize: 20, marginBottom: 10 }}>
                Найдите школу для вашего ребёнка
              </div>
              <p style={{ fontSize: 15, opacity: 0.92, margin: '0 0 20px', lineHeight: 1.5 }}>
                В нашем каталоге более 3&nbsp;280 школ по всей России — с рейтингами, адресами и контактами.
              </p>
              <Link href="/shkoly/" style={{
                display: 'inline-flex', alignItems: 'center', gap: 8,
                background: '#1A1814', color: 'white', borderRadius: 999,
                padding: '12px 24px', fontSize: 15, fontWeight: 700,
                textDecoration: 'none', boxShadow: '0 4px 0 #000',
              }}>
                Открыть каталог школ →
              </Link>
            </div>

            {/* Related posts */}
            {others.length > 0 && (
              <div style={{ marginTop: 48 }}>
                <h2 style={{
                  fontFamily: 'var(--font-unbounded)', fontWeight: 700,
                  fontSize: 20, color: 'var(--ink)', margin: '0 0 20px',
                }}>
                  Читайте также
                </h2>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: 16 }}>
                  {others.map(p => (
                    <Link key={p.slug} href={`/blog/${p.slug}/`} style={{ textDecoration: 'none' }}>
                      <div className="blog-card-hover" style={{
                        background: 'white', borderRadius: 16, padding: '20px 20px 16px',
                        border: '1px solid rgba(26,24,20,0.08)',
                      }}>
                        <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${CATEGORY_COLORS[p.category] ?? 'bg-gray-100 text-gray-600'}`} style={{ fontSize: 11 }}>
                          {p.category}
                        </span>
                        <h3 style={{ fontFamily: 'var(--font-manrope)', fontWeight: 700, fontSize: 15, color: 'var(--ink)', margin: '10px 0 8px', lineHeight: 1.35 }}>
                          {p.title}
                        </h3>
                        <span style={{ fontSize: 13, color: 'var(--coral-500)', fontFamily: 'var(--font-manrope)', fontWeight: 600 }}>
                          Читать →
                        </span>
                      </div>
                    </Link>
                  ))}
                </div>
              </div>
            )}
          </main>

          {/* Sidebar */}
          <aside className="post-sidebar">
            <div style={{ position: 'sticky', top: 88, display: 'flex', flexDirection: 'column', gap: 20 }}>
              {/* All posts */}
              <div style={{ background: 'white', borderRadius: 18, padding: 20, border: '1px solid rgba(26,24,20,0.08)' }}>
                <div style={{ fontFamily: 'var(--font-unbounded)', fontWeight: 700, fontSize: 14, color: 'var(--ink)', marginBottom: 16 }}>
                  Все статьи
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                  {blogPosts.filter(p => p.slug !== slug).slice(0, 5).map(p => (
                    <Link key={p.slug} href={`/blog/${p.slug}/`} style={{ textDecoration: 'none' }}>
                      <div style={{ display: 'flex', gap: 10, alignItems: 'flex-start' }}>
                        <span style={{
                          width: 6, height: 6, borderRadius: '50%', flexShrink: 0, marginTop: 7,
                          background: p.slug === slug ? 'var(--coral-500)' : 'rgba(26,24,20,0.2)',
                        }} />
                        <span style={{
                          fontFamily: 'var(--font-manrope)', fontSize: 13, lineHeight: 1.45,
                          color: 'var(--ink-2)', fontWeight: 600,
                        }}>
                          {p.title}
                        </span>
                      </div>
                    </Link>
                  ))}
                </div>
                <Link href="/blog/" style={{
                  display: 'block', marginTop: 16, textAlign: 'center', fontSize: 13,
                  color: 'var(--coral-500)', fontFamily: 'var(--font-manrope)', fontWeight: 700,
                  textDecoration: 'none',
                }}>
                  Все статьи →
                </Link>
              </div>

              {/* Catalog CTA */}
              <div style={{
                background: 'linear-gradient(135deg, #FFB988, #FF6B3D)',
                borderRadius: 18, padding: 20, color: 'white',
                fontFamily: 'var(--font-manrope)',
              }}>
                <div style={{ fontFamily: 'var(--font-unbounded)', fontWeight: 700, fontSize: 15, marginBottom: 10 }}>
                  Каталог школ
                </div>
                <p style={{ fontSize: 13, opacity: 0.9, margin: '0 0 14px', lineHeight: 1.5 }}>
                  Более 3&nbsp;280 школ с рейтингами и контактами
                </p>
                <Link href="/shkoly/" style={{
                  display: 'block', textAlign: 'center',
                  background: '#1A1814', color: 'white', borderRadius: 999,
                  padding: '10px 0', fontSize: 13, fontWeight: 700,
                  textDecoration: 'none', boxShadow: '0 3px 0 #000',
                }}>
                  Найти школу →
                </Link>
              </div>
            </div>
          </aside>
        </div>
      </div>
    </div>
  )
}
