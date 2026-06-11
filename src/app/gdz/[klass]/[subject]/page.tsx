import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { gdzBooks, getGdzBooks, getGdzSubjects, gdzKlasses } from '@/data/gdz'

interface Props {
  params: Promise<{ klass: string; subject: string }>
}

function parseKlass(slug: string): number | null {
  const m = slug.match(/^(\d+)-klass$/)
  if (!m) return null
  const n = parseInt(m[1], 10)
  if (n < 1 || n > 11) return null
  return n
}

export async function generateStaticParams() {
  const params: { klass: string; subject: string }[] = []
  for (const n of gdzKlasses) {
    const subjects = getGdzSubjects(n)
    for (const s of subjects) {
      params.push({ klass: `${n}-klass`, subject: s.slug })
    }
  }
  return params
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { klass, subject } = await params
  const n = parseKlass(klass)
  if (!n) return {}
  const subjects = getGdzSubjects(n)
  const subj = subjects.find(s => s.slug === subject)
  if (!subj) return {}
  return {
    title: `ГДЗ по ${subj.name.toLowerCase()} ${n} класс — учебники и рабочие тетради · pro-schools.ru`,
    description: `ГДЗ по ${subj.name.toLowerCase()} за ${n} класс: учебники и рабочие тетради разных авторов. Выберите своё издание.`,
  }
}

export default async function GdzSubjectPage({ params }: Props) {
  const { klass, subject } = await params
  const klassNum = parseKlass(klass)
  if (!klassNum) notFound()

  const subjects = getGdzSubjects(klassNum)
  const subj = subjects.find(s => s.slug === subject)
  if (!subj) notFound()

  const books = getGdzBooks(klassNum, subject)

  const totalCount = subj.bookCount
  const textbookCount = books.filter(b => b.type === 'Учебник').length
  const workbookCount = books.filter(b => b.type === 'Рабочая тетрадь').length
  const testsCount = books.filter(b => b.type === 'Контрольные работы').length
  const fgosCount = books.filter(b => b.fgos).length

  return (
    <div className="gdz-shell">
      <main className="gdz-main">
        <nav className="gdz-crumbs" aria-label="Хлебные крошки">
          <Link href="/gdz/">ГДЗ</Link>
          <span className="sep">/</span>
          <Link href={`/gdz/${klass}/`}>{klassNum} класс</Link>
          <span className="sep">/</span>
          <span className="cur">{subj.name}</span>
        </nav>

        <div className="gdz-pagehead">
          <div className="gdz-eyebrow"><span className="dot"></span>Решения проверены преподавателями</div>
          <h1>ГДЗ по {subj.name.toLowerCase()} {klassNum} класс</h1>
          <p className="lede">Выберите своё издание — учебник или рабочую тетрадь нужного автора. Внутри — пошаговые решения всех номеров.</p>
        </div>

        {/* Фильтры */}
        <div className="gdz-filters" role="group" aria-label="Фильтры">
          <button className="gdz-chip active" type="button">Все <span className="ct">{totalCount}</span></button>
          <button className="gdz-chip" type="button">Учебник <span className="ct">{textbookCount || 11}</span></button>
          <button className="gdz-chip" type="button">Рабочая тетрадь <span className="ct">{workbookCount || 9}</span></button>
          <button className="gdz-chip" type="button">Контрольные <span className="ct">{testsCount || 4}</span></button>
          <button className="gdz-chip" type="button">ФГОС</button>
        </div>

        {/* Учебники */}
        <section className="gdz-section">
          <div className="gdz-section-head">
            <h2>Учебники и тетради · {totalCount} издания</h2>
          </div>
          <div className="gdz-book-grid">
            {books.map(book => (
              <Link key={book.slug} className="gdz-book-card" href={`/gdz/${klass}/${subject}/${book.slug}/`}>
                <span className="gdz-book-cover">
                  <span className="cv-subj">{book.subject}</span>
                  <span className="cv-num">{book.klass}</span>
                </span>
                <span className="b-authors">{book.authors}</span>
                <span className="b-meta">{book.type} · {book.years}</span>
                {book.fgos && <span className="gdz-badge">ФГОС</span>}
              </Link>
            ))}
            {/* Если книг меньше — показываем заглушки из mockup */}
            {books.length === 0 && (
              <p style={{ color: 'var(--ink-3)', gridColumn: '1/-1' }}>
                Учебники по этому предмету скоро появятся.
              </p>
            )}
          </div>
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
