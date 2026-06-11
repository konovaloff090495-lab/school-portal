import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { gdzBooks, getGdzBook } from '@/data/gdz'

interface Props {
  params: Promise<{ klass: string; subject: string; book: string }>
}

function parseKlass(slug: string): number | null {
  const m = slug.match(/^(\d+)-klass$/)
  if (!m) return null
  const n = parseInt(m[1], 10)
  if (n < 1 || n > 11) return null
  return n
}

export async function generateStaticParams() {
  return gdzBooks
    .filter(b => b.chapters.length > 0)
    .map(b => ({
      klass: `${b.klass}-klass`,
      subject: b.subjectSlug,
      book: b.slug,
    }))
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { klass, subject, book: bookSlug } = await params
  const n = parseKlass(klass)
  if (!n) return {}
  const book = getGdzBook(n, subject, bookSlug)
  if (!book) return {}
  const firstAuthor = book.authors.split(',')[0].trim()
  return {
    title: `ГДЗ ${book.subject} ${n} класс ${firstAuthor} — все номера · pro-schools.ru`,
    description: `ГДЗ по ${book.subject.toLowerCase()} ${n} класс, учебник ${firstAuthor}. Пошаговые решения всех номеров и заданий.`,
  }
}

export default async function GdzBookPage({ params }: Props) {
  const { klass, subject, book: bookSlug } = await params
  const klassNum = parseKlass(klass)
  if (!klassNum) notFound()

  const book = getGdzBook(klassNum, subject, bookSlug)
  if (!book) notFound()

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
          <span className="cur">{book.authors.split(',')[0].trim().split(' ')[0]}</span>
        </nav>

        <div className="gdz-pagehead">
          <div className="gdz-eyebrow"><span className="dot"></span>Решения без ошибок</div>
          <h1>ГДЗ по {book.subject.toLowerCase()} {klassNum} класс<br/>{book.authors.split(',')[0].trim()} — {book.type.toLowerCase()}</h1>
        </div>

        {/* Карточка учебника */}
        <div className="gdz-bookhead">
          <div className="gdz-bookhead-cover">
            <span className="cv-subj">{book.subject}</span>
            <span className="cv-num">{book.klass}</span>
          </div>
          <div className="gdz-bookhead-meta">
            <div className="row"><span className="k">Авторы:</span><span className="v">{book.authors}</span></div>
            <div className="row"><span className="k">Тип:</span><span className="v">{book.type}</span></div>
            <div className="row"><span className="k">Год издания:</span><span className="v">{book.years}</span></div>
            <div className="row"><span className="k">Издательство:</span><span className="v">{book.publisher}</span></div>
            <div className="row"><span className="k">Части:</span><span className="v">{book.parts}</span></div>
            <div className="row"><span className="k">ФГОС:</span><span className="v">{book.fgos ? 'Да' : 'Нет'}</span></div>
          </div>
        </div>

        {/* Поиск по номеру */}
        <div className="gdz-exsearch" role="search">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round">
            <circle cx="11" cy="11" r="7"></circle>
            <path d="m20 20-3.5-3.5"></path>
          </svg>
          <input type="text" inputMode="numeric" placeholder="Введите номер упражнения…" aria-label="Поиск по номеру"/>
        </div>

        {/* Содержание */}
        <section className="gdz-section">
          <div className="gdz-section-head"><h2>Содержание</h2></div>

          {book.chapters.map((chapter, ci) => (
            <div key={chapter.title}>
              {ci === 2 && (
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
                    <div className="ph-hint">Горизонтальный адаптивный блок между параграфами</div>
                  </div>
                </aside>
              )}
              <div className="gdz-toc-group">
                <h3>{chapter.title}</h3>
                <div className="gdz-num-grid">
                  {chapter.problems.map(p => (
                    <Link
                      key={p.number}
                      className="gdz-num"
                      href={`/gdz/${klass}/${subject}/${bookSlug}/nomer-${p.number}/`}
                    >
                      {p.number}
                      <small>с. {p.page}</small>
                    </Link>
                  ))}
                </div>
              </div>
            </div>
          ))}
        </section>
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
