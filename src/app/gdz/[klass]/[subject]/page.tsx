import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { gdzBooks, getGdzBooks, getGdzSubjects, gdzKlasses } from '@/data/gdz'
import YandexRTBBanner from '@/components/YandexRTBBanner'

const SITE = 'https://pro-schools.ru'

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

// Уникальные вводные тексты по предмету
const subjectIntros: Record<string, string> = {
  matematika: 'Математика — один из ключевых предметов школьной программы. Решебники помогут разобраться с натуральными числами, дробями, уравнениями, пропорциями и геометрией. Выберите учебник своего автора.',
  algebra: 'Алгебра изучается с 7 класса и включает многочлены, функции, уравнения и неравенства. Пошаговые решения помогут разобрать каждый тип задач и подготовиться к контрольным и ОГЭ.',
  geometriya: 'Геометрия требует чёткого понимания теорем и умения строить доказательства. В решебнике каждая задача разобрана с чертежом и логическим обоснованием каждого шага.',
  'russkiy-yazyk': 'Русский язык — обязательный предмет с 1 по 11 класс. Решебник поможет с орфографией, пунктуацией, морфологией и синтаксисом. Все упражнения разобраны с объяснением правил.',
  fizika: 'Физика объясняет законы природы через формулы и задачи. В решебнике каждая задача решена с записью условия, формул и подробных вычислений — удобно для проверки и разбора ошибок.',
  khimiya: 'Химия требует знания элементов, реакций и расчётов. Решебник содержит полные решения уравнений реакций, расчётных задач и тестовых заданий с объяснением каждого шага.',
  biologiya: 'Биология охватывает клетки, организмы, экосистемы и эволюцию. Ответы на вопросы и развёрнутые объяснения помогут подготовиться к урокам и ВПР.',
  istoriya: 'История требует знания дат, событий и причинно-следственных связей. Развёрнутые ответы на вопросы параграфов и разбор заданий помогут в подготовке к урокам и ОГЭ/ЕГЭ.',
  geografiya: 'География изучает природу, население и хозяйство Земли. Решебник содержит ответы на вопросы параграфов, разбор контурных карт и практических заданий.',
  literatura: 'Литература развивает навыки анализа текста. Краткие содержания, планы сочинений и ответы на вопросы учебника помогут сформулировать мысли и подготовиться к урокам.',
  'angliiskiy-yazyk': 'Английский язык — важнейший иностранный язык. Решебник содержит переводы текстов, ответы на вопросы, выполненные грамматические упражнения и переводы диалогов.',
  'nemetskiy-yazyk': 'Немецкий язык становится понятнее с пошаговым разбором упражнений. Перводы, ответы на вопросы и грамматические разборы — всё в одном решебнике.',
  informatika: 'Информатика включает алгоритмы, программирование и работу с данными. Решебник помогает разобраться с логическими задачами, задачами на Python и работой с таблицами.',
  obshchestvoznanie: 'Обществознание изучает общество, право и экономику. Развёрнутые ответы на вопросы параграфов помогут подготовиться к тестам, ОГЭ и ЕГЭ.',
  'literaturnoe-chtenie': 'Литературное чтение в начальной школе формирует любовь к книгам. Ответы на вопросы, пересказы и характеристики героев помогут выполнить домашнее задание.',
  'okruzhayushchiy-mir': 'Окружающий мир знакомит с природой, обществом и историей. Решебник содержит ответы на вопросы учебника и рабочей тетради для всех тем.',
  izo: 'Изобразительное искусство развивает творческие способности. Ответы на теоретические вопросы и описания работ помогут подготовиться к урокам.',
  muzyka: 'Музыка в школе изучает теорию и историю музыки. Развёрнутые ответы на вопросы учебника помогут в подготовке к урокам.',
  obzh: 'ОБЖ учит действовать в чрезвычайных ситуациях и вести здоровый образ жизни. Решебник поможет выполнить практические задания и ответить на вопросы параграфов.',
  'algebra-nachala-analiza': 'Алгебра и начала анализа (10–11 класс) включает производную, интеграл, тригонометрию и показательные функции. Полные решения для подготовки к ЕГЭ.',
}

function getSubjectIntro(subjectSlug: string, subjectName: string, klassNum: number, bookCount: number): string {
  const base = subjectIntros[subjectSlug]
    ?? `ГДЗ по ${subjectName.toLowerCase()} за ${klassNum} класс — пошаговые решения всех заданий.`
  return `${base} Для ${klassNum} класса доступно ${bookCount} решебников разных авторов.`
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { klass, subject } = await params
  const n = parseKlass(klass)
  if (!n) return {}
  const subjects = getGdzSubjects(n)
  const subj = subjects.find(s => s.slug === subject)
  if (!subj) return {}
  const books = getGdzBooks(n, subject)
  if (books.length === 0) return {}
  const canonicalUrl = `${SITE}/gdz/${klass}/${subject}/`
  const title = `ГДЗ по ${subj.name.toLowerCase()} ${n} класс — учебники и решебники · pro-schools.ru`
  const description = `ГДЗ по ${subj.name.toLowerCase()} за ${n} класс: ${books.map(b => b.authors.split(',')[0].trim()).join(', ')}. Пошаговые решения всех номеров и заданий.`
  return {
    title,
    description,
    robots: { index: true, follow: true },
    alternates: { canonical: canonicalUrl },
    openGraph: { title, description, url: canonicalUrl, siteName: 'pro-schools.ru', locale: 'ru_RU', type: 'website' },
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
  if (books.length === 0) notFound()
  const canonicalUrl = `${SITE}/gdz/${klass}/${subject}/`

  const breadcrumbLd = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      { '@type': 'ListItem', position: 1, name: 'ГДЗ', item: `${SITE}/gdz/` },
      { '@type': 'ListItem', position: 2, name: `${klassNum} класс`, item: `${SITE}/gdz/${klass}/` },
      { '@type': 'ListItem', position: 3, name: subj.name, item: canonicalUrl },
    ],
  }

  const intro = getSubjectIntro(subject, subj.name, klassNum, subj.bookCount)

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
            <Link href={`/gdz/${klass}/`}>{klassNum} класс</Link>
            <span className="sep">/</span>
            <span className="cur">{subj.name}</span>
          </nav>

          <div className="gdz-pagehead">
            <div className="gdz-eyebrow"><span className="dot"></span>Решения проверены преподавателями</div>
            <h1>ГДЗ по {subj.name.toLowerCase()} {klassNum} класс</h1>
            <p className="lede">{intro}</p>
          </div>

          {/* Фильтры */}
          <div className="gdz-filters" role="group" aria-label="Фильтры">
            <button className="gdz-chip active" type="button">
              Все <span className="ct">{books.length || subj.bookCount}</span>
            </button>
            <button className="gdz-chip" type="button">Учебник</button>
            <button className="gdz-chip" type="button">Рабочая тетрадь</button>
            <button className="gdz-chip" type="button">ФГОС</button>
          </div>

          {/* Учебники */}
          <section className="gdz-section">
            <div className="gdz-section-head">
              <h2>Учебники и решебники — {subj.name} {klassNum} класс</h2>
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
              {books.length === 0 && (
                <p style={{ color: 'var(--ink-3)', gridColumn: '1/-1' }}>
                  Решебники по этому предмету скоро появятся.
                </p>
              )}
            </div>
          </section>
        </main>

        {/* Рекламная колонка */}
        <aside className="gdz-rail" aria-label="Реклама">
          <div className="gdz-rail-sticky">
            <div className="gdz-ad" data-rsya="R-A-19425636-1">
              <div className="gdz-ad-label"><span>Реклама</span><span className="age">16+</span></div>
              <div className="gdz-ad-slot gdz-ad-slot--tall">
                <YandexRTBBanner blockId="R-A-19425636-1" suffix="subject" />
              </div>
            </div>
          </div>
        </aside>
      </div>
    </>
  )
}
