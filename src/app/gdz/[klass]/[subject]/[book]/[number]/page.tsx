import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import {
  gdzBooks,
  getGdzBook,
  getGdzProblem,
  getGdzPrevNext,
  getGdzProblemChapter,
  getGdzAllProblems,
} from '@/data/gdz'

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
  const firstAuthor = book.authors.split(',')[0].trim().split(' ')[0]
  return {
    title: `Номер ${num} — ГДЗ ${book.subject} ${n} класс ${firstAuthor} · pro-schools.ru`,
    description: `ГДЗ номер ${num} по ${book.subject.toLowerCase()} ${n} класс, учебник ${firstAuthor}. Условие, пошаговое решение и ответ.`,
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

  // Related: ±4 neighbors from same chapter
  let related: typeof problem[] = []
  if (chapter) {
    const idx = chapter.problems.findIndex(p => p.number === num)
    const start = Math.max(0, idx - 4)
    const end = Math.min(chapter.problems.length - 1, idx + 4)
    related = chapter.problems.slice(start, end + 1)
  }

  const firstAuthor = book.authors.split(',')[0].trim()
  const lede = [book.authors.split(',')[0].trim(), chapter ? `${chapter.title}` : '', `страница ${problem.page}`]
    .filter(Boolean).join(' · ')

  const bookBase = `/gdz/${klass}/${subject}/${bookSlug}`

  return (
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

        {/* Навигация */}
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
            <p>Номер {num}. Страница {problem.page}.</p>
          )}
          <div className="gdz-figure">📷 место под скан задания из учебника (необязательно)</div>
        </article>

        {problem.steps && problem.steps.length > 0 ? (
          <>
            {/* Вкладки */}
            <div className="gdz-soltabs" role="tablist">
              <button className="gdz-soltab active" type="button" role="tab">Решение</button>
            </div>

            {/* Решение */}
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
                {problem.steps.map((step, i) => (
                  <li key={i} dangerouslySetInnerHTML={{ __html: step }} />
                ))}
              </ol>
              {problem.formulas && problem.formulas.map((f, i) => (
                <span key={i} className="gdz-formula">{f}</span>
              ))}
            </article>

            {/* Ответ */}
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
            <p>Решение готовится — скоро добавим пошаговый разбор.</p>
          </article>
        )}

        {/* Нативная реклама */}
        <aside className="gdz-ad gdz-ad-inline" data-rsya="R-A-XXXXXX-2" aria-label="Реклама">
          <div className="gdz-ad-label"><span>Реклама</span><span className="age">16+</span></div>
          <div className="gdz-ad-slot">
            <div className="ph-ic">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <rect x="3" y="5" width="18" height="14" rx="2"></rect>
                <path d="M3 10h18"></path>
              </svg>
            </div>
            <div className="ph-t">Нативный блок РСЯ</div>
            <div className="ph-id">R-A-XXXXXX-2</div>
            <div className="ph-hint">Горизонтальный адаптивный блок после решения</div>
          </div>
        </aside>

        {/* Похожие номера */}
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

      {/* Рекламная колонка */}
      <aside className="gdz-rail" aria-label="Реклама">
        <div className="gdz-rail-sticky">
          <div className="gdz-ad" data-rsya="R-A-XXXXXX-1">
            <div className="gdz-ad-label"><span>Реклама</span><span className="age">16+</span></div>
            <div className="gdz-ad-slot gdz-ad-slot--tall">
              <div className="ph-ic">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <rect x="4" y="3" width="16" height="18" rx="2"></rect>
                  <path d="M8 8h8M8 12h8M8 16h5"></path>
                </svg>
              </div>
              <div className="ph-t">Место под РСЯ</div>
              <div className="ph-id">R-A-XXXXXX-1</div>
              <div className="ph-hint">Вертикальный блок 300×600. Вставьте код рекламного блока Яндекса.</div>
            </div>
          </div>
        </div>
      </aside>
    </div>
  )
}
