import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { gdzKlasses, getGdzSubjects } from '@/data/gdz'

const SITE = 'https://pro-schools.ru'

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

// Уникальный текст для каждого класса
const klassDescriptions: Record<number, string> = {
  1: 'В 1 классе дети осваивают основы математики и русского языка. Решебник поможет разобрать задания по счёту, письму и чтению в игровой форме.',
  2: 'Во 2 классе углубляется изучение математики, русского языка и окружающего мира. Решебники помогут закрепить таблицу умножения, правила правописания и знания о природе.',
  3: 'В 3 классе начинается серьёзное изучение грамматики и арифметики. Решебник охватывает сложение и вычитание многозначных чисел, части речи и природные зоны.',
  4: 'В 4 классе завершается начальная школа. Ключевые темы: дроби, умножение многозначных чисел, синтаксис и история Отечества. Решебник поможет подготовиться к переходу в среднюю школу.',
  5: 'В 5 классе начинается средняя школа. Новые предметы, большой объём программы по математике (дроби, проценты), русскому языку и окружающему миру.',
  6: 'В 6 классе программа усложняется: рациональные числа, координатная плоскость, сложные темы русского языка. Решебники по всем предметам с пошаговыми разборами.',
  7: 'В 7 классе математика делится на алгебру и геометрию. Начинается физика. Решебники Макарычева, Атанасяна и Пёрышкина помогут освоить все ключевые темы.',
  8: 'В 8 классе алгебра включает квадратные уравнения и корни, геометрия — подобие и окружность, физика — электричество. Полные решения для всех популярных учебников.',
  9: 'В 9 классе готовятся к ОГЭ. Программа включает квадратичную функцию, прогрессии, теорему Пифагора, тригонометрию. Решебники помогут систематизировать знания.',
  10: 'В 10 классе начинается подготовка к ЕГЭ. Алгебра и начала анализа, стереометрия, физика и химия — для каждого предмета есть пошаговые решебники.',
  11: 'В 11 классе — финальная подготовка к ЕГЭ. Решебники по алгебре, геометрии, физике, химии и другим предметам с разбором типовых экзаменационных задач.',
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { klass } = await params
  const n = parseKlass(klass)
  if (!n) return {}
  const subjects = getGdzSubjects(n)
  const canonicalUrl = `${SITE}/gdz/${klass}/`
  const subjectList = subjects.slice(0, 5).map(s => s.name.toLowerCase()).join(', ')
  const title = `ГДЗ за ${n} класс — решебники по всем предметам · pro-schools.ru`
  const description = `Готовые домашние задания за ${n} класс: ${subjectList} и другие предметы. Пошаговые решения — проверено преподавателями.`
  return {
    title,
    description,
    alternates: { canonical: canonicalUrl },
    openGraph: { title, description, url: canonicalUrl, siteName: 'pro-schools.ru', locale: 'ru_RU', type: 'website' },
  }
}

export default async function GdzKlassPage({ params }: Props) {
  const { klass } = await params
  const klassNum = parseKlass(klass)
  if (!klassNum) notFound()

  const subjects = getGdzSubjects(klassNum)
  const canonicalUrl = `${SITE}/gdz/${klass}/`

  const breadcrumbLd = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      { '@type': 'ListItem', position: 1, name: 'ГДЗ', item: `${SITE}/gdz/` },
      { '@type': 'ListItem', position: 2, name: `${klassNum} класс`, item: canonicalUrl },
    ],
  }

  const intro = klassDescriptions[klassNum] ?? `ГДЗ за ${klassNum} класс — готовые домашние задания по всем предметам школьной программы.`

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbLd) }}
      />

      <div className="gdz-shell">
        <main className="gdz-main">
          <nav className="gdz-crumbs" aria-label="Хлебные крошки">
            <Link href="/gdz/">ГДЗ</Link>
            <span className="sep">/</span>
            <span className="cur">{klassNum} класс</span>
          </nav>

          <div className="gdz-pagehead">
            <div className="gdz-eyebrow"><span className="dot"></span>Готовые домашние задания</div>
            <h1>ГДЗ за {klassNum} класс — все предметы</h1>
            <p className="lede">{intro}</p>
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
              <h2>Предметы {klassNum} класса — {subjects.length} предметов</h2>
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
                <div className="ph-hint">Вертикальный блок 300×600.</div>
              </div>
            </div>
          </div>
        </aside>
      </div>
    </>
  )
}
