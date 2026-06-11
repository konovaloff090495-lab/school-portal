import type { Metadata } from 'next'
import Link from 'next/link'
import { gdzSubjectsByClass } from '@/data/gdz'

export const metadata: Metadata = {
  title: 'ГДЗ — готовые домашние задания по всем предметам · pro-schools.ru',
  description: 'ГДЗ и готовые решения по всем школьным предметам с 1 по 11 класс. Выберите класс — учебники, рабочие тетради и пошаговые ответы.',
}

const classSubCounts: Record<number, string> = {
  1: '9 предметов',
  2: '10 предметов',
  3: '11 предметов',
  4: '12 предметов',
  5: '14 предметов',
  6: '15 предметов',
  7: '17 предметов',
  8: '18 предметов',
  9: '18 предметов',
  10: '16 предметов',
  11: '16 предметов',
}

const popularSubjects = [
  { name: 'Математика', icon: '🔢', slug: 'matematika', klass: 6, count: '320 учебников' },
  { name: 'Алгебра', icon: '📐', slug: 'algebra', klass: 7, count: '180 учебников' },
  { name: 'Геометрия', icon: '📏', slug: 'geometriya', klass: 7, count: '140 учебников' },
  { name: 'Русский язык', icon: '📖', slug: 'russkiy-yazyk', klass: 6, count: '410 учебников' },
  { name: 'Английский язык', icon: '🇬🇧', slug: 'angliiskiy-yazyk', klass: 6, count: '360 учебников' },
  { name: 'Физика', icon: '⚛️', slug: 'fizika', klass: 7, count: '150 учебников' },
  { name: 'Химия', icon: '🧪', slug: 'khimiya', klass: 8, count: '90 учебников' },
  { name: 'Биология', icon: '🧬', slug: 'biologiya', klass: 6, count: '120 учебников' },
]

export default function GdzPage() {
  return (
    <div className="gdz-shell">
      <main className="gdz-main">
        <nav className="gdz-crumbs" aria-label="Хлебные крошки">
          <Link href="/">Главная</Link>
          <span className="sep">/</span>
          <span className="cur">ГДЗ</span>
        </nav>

        <div className="gdz-pagehead">
          <div className="gdz-eyebrow"><span className="dot"></span>Готовые домашние задания</div>
          <h1>ГДЗ — ответы и решения<br/>по всем предметам</h1>
          <p className="lede">Учебники, рабочие тетради и пошаговые решения с 1 по 11 класс. Выберите класс — внутри собраны все предметы и издания.</p>
        </div>

        {/* Классы */}
        <section className="gdz-section">
          <div className="gdz-section-head"><h2>Выберите класс</h2></div>
          <div className="gdz-class-grid">
            {[1,2,3,4,5,6,7,8,9,10,11].map(n => (
              <Link key={n} className="gdz-class-card" href={`/gdz/${n}-klass/`}>
                <span className="corner"></span>
                <span className="gdz-class-num">{n}</span>
                <span className="lbl">{n} класс</span>
                <span className="sub">{classSubCounts[n]}</span>
              </Link>
            ))}
          </div>
        </section>

        {/* Нативная реклама в поток */}
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
            <div className="ph-hint">Горизонтальный адаптивный блок между секциями</div>
          </div>
        </aside>

        {/* Популярные предметы */}
        <section className="gdz-section">
          <div className="gdz-section-head">
            <h2>Популярные предметы</h2>
            <Link className="more" href="/gdz/6-klass/">Все предметы →</Link>
          </div>
          <div className="gdz-subj-grid">
            {popularSubjects.map(s => (
              <Link key={s.slug} className="gdz-subj-card" href={`/gdz/${s.klass}-klass/${s.slug}/`}>
                <span className="gdz-subj-ic">{s.icon}</span>
                <span className="gdz-subj-txt">
                  <span className="name">{s.name}</span>
                  <span className="count">{s.count}</span>
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
