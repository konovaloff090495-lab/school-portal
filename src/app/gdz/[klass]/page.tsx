import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { gdzKlasses, getGdzSubjects } from '@/data/gdz'

interface Props {
  params: Promise<{ klass: string }>
}

function parseKlass(slug: string): number | null {
  const m = slug.match(/^(\d+)-klass$/)
  if (!m) return null
  const n = parseInt(m[1], 10)
  if (n < 1 || n > 11) return null
  return n
}

export async function generateStaticParams() {
  return gdzKlasses.map(n => ({ klass: `${n}-klass` }))
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { klass } = await params
  const n = parseKlass(klass)
  if (!n) return {}
  return {
    title: `ГДЗ за ${n} класс — решебники по всем предметам · pro-schools.ru`,
    description: `ГДЗ за ${n} класс: готовые домашние задания по всем предметам. Выберите предмет — учебники и рабочие тетради разных авторов.`,
  }
}

export default async function GdzKlassPage({ params }: Props) {
  const { klass } = await params
  const klassNum = parseKlass(klass)
  if (!klassNum) notFound()

  const subjects = getGdzSubjects(klassNum)

  return (
    <div className="gdz-shell">
      <main className="gdz-main">
        <nav className="gdz-crumbs" aria-label="Хлебные крошки">
          <Link href="/gdz/">ГДЗ</Link>
          <span className="sep">/</span>
          <span className="cur">{klassNum} класс</span>
        </nav>

        <div className="gdz-pagehead">
          <div className="gdz-eyebrow"><span className="dot"></span>Готовые домашние задания</div>
          <h1>ГДЗ за {klassNum} класс</h1>
          <p className="lede">Все предметы программы {klassNum} класса. Выберите предмет — внутри собраны учебники и рабочие тетради разных авторов и изданий.</p>
        </div>

        {/* Переключатель классов */}
        <nav className="gdz-classbar" aria-label="Классы">
          {gdzKlasses.map(n => (
            <Link
              key={n}
              href={`/gdz/${n}-klass/`}
              className={n === klassNum ? 'active' : undefined}
            >
              {n} класс
            </Link>
          ))}
        </nav>

        {/* Предметы */}
        <section className="gdz-section">
          <div className="gdz-section-head">
            <h2>Предметы · {klassNum} класс</h2>
          </div>
          <div className="gdz-subj-grid">
            {subjects.map(s => (
              <Link key={s.slug} className="gdz-subj-card" href={`/gdz/${klass}/${s.slug}/`}>
                <span className="gdz-subj-ic">{s.icon}</span>
                <span className="gdz-subj-txt">
                  <span className="name">{s.name}</span>
                  <span className="count">{s.bookCount} решебников</span>
                </span>
              </Link>
            ))}
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
