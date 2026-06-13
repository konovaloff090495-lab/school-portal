import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import {
  gdzBooks,
  getGdzBook,
  getGdzProblem,
  getGdzPrevNext,
  getGdzProblemChapter,
} from '@/data/gdz'
import YandexRTBBanner from '@/components/YandexRTBBanner'

const SITE = 'https://pro-schools.ru'

interface Props {
  params: Promise<{ klass: string; subject: string; book: string; number: string }>
}

function parseKlass(slug: string): number | null {
  const m = slug.match(/^(\d+)-klass$/)
  if (!m) return null
  const n = parseInt(m[1], 10)
  if (n < 1 || n > 11) return null
  return n
}

function parseNumber(slug: string): string | null {
  const m = slug.match(/^nomer-(.+)$/)
  return m ? m[1] : null
}

function stripTags(s: string) {
  return s.replace(/<[^>]+>/g, '')
}

export async function generateStaticParams() {
  const out: { klass: string; subject: string; book: string; number: string }[] = []
  for (const b of gdzBooks) {
    if (b.chapters.length === 0) continue
    const allProblems = b.chapters.flatMap(ch => ch.problems)
    for (const p of allProblems) {
      out.push({
        klass: `${b.klass}-klass`,
        subject: b.subjectSlug,
        book: b.slug,
        number: `nomer-${p.number}`,
      })
    }
  }
  return out
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { klass, subject, book: bookSlug, number: numSlug } = await params
  const n = parseKlass(klass)
  if (!n) return {}
  const book = getGdzBook(n, subject, bookSlug)
  if (!book) return {}
  const num = parseNumber(numSlug)
  if (!num) return {}
  const problem = getGdzProblem(book, num)
  if (!problem) return {}

  const firstAuthor = book.authors.split(',')[0].trim()
  const hasSolution = !!(problem.steps?.length && problem.condition)
  const canonicalUrl = `${SITE}/gdz/${klass}/${subject}/${bookSlug}/nomer-${num}/`

  const conditionSnippet = problem.condition
    ? stripTags(problem.condition).slice(0, 100)
    : null

  const title = hasSolution
    ? `Номер ${num} — ГДЗ ${book.subject} ${n} класс ${firstAuthor.split(' ')[0]} · pro-schools.ru`
    : `Номер ${num} — ${book.subject} ${n} класс ${firstAuthor.split(' ')[0]} · pro-schools.ru`

  const description = hasSolution && conditionSnippet
    ? `${conditionSnippet.slice(0, 110)}. Пошаговое решение и ответ — ГДЗ ${book.subject.toLowerCase()} ${n} класс, учебник ${firstAuthor}.`
    : `ГДЗ номер ${num} по ${book.subject.toLowerCase()} ${n} класс, учебник ${firstAuthor}. Условие, пошаговое решение и ответ.`

  return {
    title,
    description,
    // Страницы без решения не индексируем — тонкий контент
    robots: hasSolution
      ? { index: true, follow: true }
      : { index: false, follow: true },
    alternates: { canonical: canonicalUrl },
    openGraph: {
      title,
      description,
      url: canonicalUrl,
      siteName: 'pro-schools.ru',
      locale: 'ru_RU',
      type: 'article',
    },
  }
}

export default async function GdzNumberPage({ params }: Props) {
  const { klass, subject, book: bookSlug, number: numSlug } = await params
  const klassNum = parseKlass(klass)
  if (!klassNum) notFound()

  const book = getGdzBook(klassNum, subject, bookSlug)
  if (!book) notFound()

  const num = parseNumber(numSlug)
  if (!num) notFound()

  const problem = getGdzProblem(book, num)
  if (!problem) notFound()

  const { prev, next } = getGdzPrevNext(book, num)
  const chapter = getGdzProblemChapter(book, num)

  // Related: ±4 соседа из параграфа
  let related: typeof problem[] = []
  if (chapter) {
    const idx = chapter.problems.findIndex(p => p.number === num)
    const start = Math.max(0, idx - 4)
    const end = Math.min(chapter.problems.length - 1, idx + 4)
    related = chapter.problems.slice(start, end + 1)
  }

  const firstAuthor = book.authors.split(',')[0].trim()
  const lede = [firstAuthor, chapter ? chapter.title : '', `страница ${problem.page}`]
    .filter(Boolean).join(' · ')

  const bookBase = `/gdz/${klass}/${subject}/${bookSlug}`
  const canonicalUrl = `${SITE}${bookBase}/nomer-${num}/`
  const hasSolution = !!(problem.steps?.length && problem.condition)

  // ── JSON-LD ────────────────────────────────────────────────────────────────
  const breadcrumbLd = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      { '@type': 'ListItem', position: 1, name: 'ГДЗ', item: `${SITE}/gdz/` },
      { '@type': 'ListItem', position: 2, name: `${klassNum} класс`, item: `${SITE}/gdz/${klass}/` },
      { '@type': 'ListItem', position: 3, name: book.subject, item: `${SITE}/gdz/${klass}/${subject}/` },
      { '@type': 'ListItem', position: 4, name: firstAuthor.split(' ')[0], item: `${SITE}${bookBase}/` },
      { '@type': 'ListItem', position: 5, name: `Номер ${num}`, item: canonicalUrl },
    ],
  }

  const howToLd = hasSolution ? {
    '@context': 'https://schema.org',
    '@type': 'HowTo',
    name: `Решение номера ${num} — ${book.subject} ${klassNum} класс ${firstAuthor.split(' ')[0]}`,
    description: problem.condition ? stripTags(problem.condition) : `Номер ${num}, страница ${problem.page}.`,
    step: problem.steps!.map((step, i) => ({
      '@type': 'HowToStep',
      position: i + 1,
      text: stripTags(step),
    })),
  } : null

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbLd) }}
      />
      {howToLd && (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(howToLd) }}
        />
      )}

      <div className="gdz-shell">
        <main className="gdz-main">
          <nav className="gdz-crumbs" aria-label="Хлебные крошки">
            <Link href="/gdz/">ГДЗ</Link>
            <span className="sep">/</span>
            <Link href={`/gdz/${klass}/`}>{klassNum} класс</Link>
            <span className="sep">/</span>
            <Link href={`/gdz/${klass}/${subject}/`}>{book.subject}</Link>
            <span className="sep">/</span>
            <Link href={`${bookBase}/`}>{firstAuthor.split(' ')[0]}</Link>
            <span className="sep">/</span>
            <span className="cur">Номер {num}</span>
          </nav>

          <div className="gdz-pagehead">
            <div className="gdz-eyebrow"><span className="dot"></span>Решение без ошибок · проверено преподавателем</div>
            <h1>Номер {num} — {book.subject} {klassNum} класс</h1>
            <p className="lede">{lede}</p>
          </div>

          {/* Навигация по номерам */}
          <nav className="gdz-exnav" aria-label="Соседние номера">
            {prev ? (
              <Link href={`${bookBase}/nomer-${prev}/`}>← Номер {prev}</Link>
            ) : (
              <span style={{ visibility: 'hidden' }}>← Номер 0</span>
            )}
            <Link href={`${bookBase}/`} className="to-list">Все номера</Link>
            <span className="spacer"></span>
            {next ? (
              <Link href={`${bookBase}/nomer-${next}/`}>Номер {next} →</Link>
            ) : (
              <span style={{ visibility: 'hidden' }}>Номер 0 →</span>
            )}
          </nav>

          {/* Условие */}
          <article className="gdz-solve">
            <div className="gdz-solve-tag">
              <span className="ic">
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4">
                  <path d="M4 5h16M4 12h16M4 19h10"></path>
                </svg>
              </span>
              Условие
            </div>
            {problem.condition ? (
              <p dangerouslySetInnerHTML={{ __html: problem.condition }} />
            ) : (
              <p>
                Номер {num} из {chapter ? chapter.title : book.subject}, страница {problem.page}.{' '}
                Учебник: {book.authors.split(',')[0].trim()}, {book.years}, {book.publisher}.
              </p>
            )}
          </article>

          {hasSolution ? (
            <>
              <div className="gdz-soltabs" role="tablist">
                <button className="gdz-soltab active" type="button" role="tab">Решение</button>
              </div>

              <article className="gdz-solve">
                <div className="gdz-solve-tag">
                  <span className="ic">
                    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4">
                      <path d="m5 12 5 5L20 7"></path>
                    </svg>
                  </span>
                  Решение
                </div>
                <ol className="gdz-steps">
                  {problem.steps!.map((step, i) => (
                    <li key={i} dangerouslySetInnerHTML={{ __html: step }} />
                  ))}
                </ol>
                {problem.formulas && problem.formulas.map((f, i) => (
                  <span key={i} className="gdz-formula">{f}</span>
                ))}
              </article>

              {problem.answer && (
                <article className="gdz-solve gdz-answer">
                  <div className="gdz-solve-tag ans">
                    <span className="ic">
                      <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4">
                        <path d="m5 12 5 5L20 7"></path>
                      </svg>
                    </span>
                    Ответ
                  </div>
                  <p dangerouslySetInnerHTML={{ __html: problem.answer }} />
                </article>
              )}
            </>
          ) : (
            <article className="gdz-solve">
              <div className="gdz-solve-tag">
                <span className="ic">
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4">
                    <path d="m5 12 5 5L20 7"></path>
                  </svg>
                </span>
                Решение
              </div>
              <p>Пошаговое решение для номера {num} готовится и скоро будет добавлено.</p>
              <p style={{ fontSize: '14px', color: 'var(--ink-3)', marginTop: '8px' }}>
                Пока можно посмотреть соседние номера этого параграфа — многие уже решены.
              </p>
            </article>
          )}

          {/* РСЯ — адаптивный баннер после решения */}
          <aside className="gdz-ad gdz-ad-inline" aria-label="Реклама">
            <div className="gdz-ad-label"><span>Реклама</span><span className="age">16+</span></div>
            <YandexRTBBanner blockId="R-A-19425636-1" />
          </aside>

          {/* Соседние номера */}
          {related.length > 1 && (
            <section className="gdz-related gdz-section">
              <h2>Другие номера параграфа</h2>
              <div className="gdz-num-grid">
                {related.map(p => (
                  <Link
                    key={p.number}
                    className="gdz-num"
                    href={`${bookBase}/nomer-${p.number}/`}
                    style={p.number === num ? {
                      borderColor: 'var(--coral-400)',
                      background: 'var(--peach-50)',
                      color: 'var(--coral-600)',
                    } : undefined}
                  >
                    {p.number}
                    <small>с. {p.page}</small>
                  </Link>
                ))}
              </div>
            </section>
          )}
        </main>

        {/* Рекламная колонка — появится когда создадим второй блок РСЯ */}
        <aside className="gdz-rail" aria-label="Реклама"></aside>
      </div>
    </>
  )
}
