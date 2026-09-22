import type { Metadata } from 'next'
import Link from 'next/link'
import ExamShell, { AdInline, Crumbs, breadcrumbLd } from '@/components/exam/ExamShell'
import {
  type Exam, siteSubjects, docsFor, docsByKind, yearsOf, currentSummary, minutesLabel,
  EXAM_NAME, EXAM_FULL, CURRENT_YEAR, PREV_YEAR, allDocs,
} from '@/data/exam'
import { specialPages } from '@/components/exam/special'

const SITE = 'https://pro-schools.ru'

export function hubMetadata(exam: Exam): Metadata {
  const ex = EXAM_NAME[exam]; const n = siteSubjects(exam).length
  const docs = allDocs().filter(d => d.exam === exam).length
  return {
    // Вордстат: «егэ 2027», «подготовка к егэ», «демоверсия егэ 2027» (302k), «фипи егэ»
    title: `${ex} ${CURRENT_YEAR}: демоверсии ФИПИ по всем предметам, варианты, кодификаторы, изменения — подготовка к ${ex}`,
    description: `Подготовка к ${ex} ${CURRENT_YEAR} бесплатно: официальные демоверсии ФИПИ по ${n} предметам с ответами, спецификации и кодификаторы, ${exam === 'ege' ? `реальные варианты ${PREV_YEAR}, ` : ''}навигатор самостоятельной подготовки, методические рекомендации и разбор заданий. ${docs} документов в PDF и текстом.`,
    keywords: `${ex.toLowerCase()} ${CURRENT_YEAR}, подготовка к ${ex.toLowerCase()}, демоверсия ${ex.toLowerCase()} ${CURRENT_YEAR}, фипи ${ex.toLowerCase()}, ${ex.toLowerCase()} демоверсии по всем предметам, задания ${ex.toLowerCase()}`,
    alternates: { canonical: `${SITE}/${exam}/` },
  }
}

export default function ExamHubPage({ exam }: { exam: Exam }) {
  const ex = EXAM_NAME[exam]
  const subjects = siteSubjects(exam)
  const other: Exam = exam === 'ege' ? 'oge' : 'ege'
  const demoYears = yearsOf(exam, 'demo')
  const varYears = yearsOf(exam, 'variant')
  const changes = docsByKind(exam, 'izmeneniya').sort((a, b) => (b.year ?? 0) - (a.year ?? 0))
  const specials = specialPages(exam)
  const totalDocs = allDocs().filter(d => d.exam === exam).length
  const ld = [
    breadcrumbLd([{ name: 'Главная', href: '/' }, { name: ex, href: `/${exam}/` }]),
    { '@context': 'https://schema.org', '@type': 'CollectionPage', name: `${ex} ${CURRENT_YEAR}: материалы ФИПИ`, url: `${SITE}/${exam}/`, inLanguage: 'ru' },
  ]

  return (
    <ExamShell exam={exam} suffix="ex-hub" ld={ld}>
      <Crumbs items={[{ name: 'Главная', href: '/' }, { name: ex }]} />
      <div className="gdz-pagehead">
        <div className="gdz-eyebrow"><span className="dot"></span>{EXAM_FULL[exam]} · {subjects[0].klass} класс · сезон {CURRENT_YEAR}</div>
        <h1>{ex} {CURRENT_YEAR}: демоверсии, варианты, кодификаторы и разбор заданий по всем предметам</h1>
        <p className="lede">
          Официальные материалы ФИПИ для подготовки к {ex} {CURRENT_YEAR} — {totalDocs} документов: демонстрационные варианты {demoYears[demoYears.length - 1]}–{demoYears[0]} годов с ответами и критериями,
          спецификации и кодификаторы, {varYears.length ? `открытые варианты реальных КИМ ${varYears.join(', ')}, ` : ''}навигатор самостоятельной подготовки по темам,
          методические рекомендации по итогам экзаменов и разбор каждого задания. Всё бесплатно: PDF для скачивания и текст для прорешивания онлайн.
        </p>
      </div>

      <section className="gdz-section">
        <div className="gdz-section-head"><h2>Демоверсии {ex} {CURRENT_YEAR} от ФИПИ по предметам</h2><Link className="more" href={`/${exam}/demoversii-${CURRENT_YEAR}/`}>Все демоверсии →</Link></div>
        <div className="gdz-subj-grid">
          {subjects.map(s => {
            const sm = currentSummary(exam, s)
            const demo = docsFor(exam, s, 'demo').find(d => d.year === CURRENT_YEAR)
            return (
              <Link key={s.slug} className="gdz-subj-card" href={`/${exam}/${s.slug}/`}>
                <span className="gdz-subj-ic">{s.icon}</span>
                <span className="gdz-subj-txt">
                  <span className="name">{s.name}</span>
                  <span className="count">{[sm.tasks ? `${sm.tasks} заданий` : '', sm.minutes ? minutesLabel(sm.minutes) : '', demo ? `демо ${demo.year}` : ''].filter(Boolean).join(' · ')}</span>
                </span>
              </Link>
            )
          })}
        </div>
      </section>

      <AdInline slot="mobile" suffix="ex-hub" />

      <section className="gdz-section">
        <div className="gdz-section-head"><h2>Справочники и подборки {ex} {CURRENT_YEAR}</h2></div>
        <div className="ol-stages">
          {specials.filter(p => p.hub).map(p => (
            <Link key={p.slug} href={`/${exam}/${p.slug}/`} style={{ display: 'block' }}>
              <div><b>{p.h1short}</b><span>{p.blurb}</span></div>
            </Link>
          ))}
        </div>
      </section>

      <section className="gdz-section">
        <div className="gdz-section-head"><h2>Демоверсии {ex} прошлых лет</h2></div>
        <div className="ol-stage-block"><div className="rows">
          {demoYears.map(y => <Link key={y} href={`/${exam}/demoversii-${y}/`}>{y}{y === CURRENT_YEAR ? <span className="ct">· новые</span> : null}</Link>)}
        </div></div>
      </section>

      {varYears.length > 0 && (
        <section className="gdz-section">
          <div className="gdz-section-head"><h2>Открытые варианты реальных КИМ {ex}</h2></div>
          <div className="ol-stage-block"><div className="rows">
            {varYears.map(y => <Link key={y} href={`/${exam}/varianty-${y}/`}>Варианты {y}</Link>)}
          </div></div>
        </section>
      )}

      <AdInline slot={2} suffix="ex-hub" />

      <section className="ol-text ol-seo">
        <h2>Как устроена подготовка к {ex} по материалам ФИПИ</h2>
        <p><strong>Демоверсия</strong> — образец экзаменационной работы: по ней видно формат каждого задания, а в конце документа даны ответы и критерии оценивания. <strong>Спецификация</strong> описывает структуру КИМ: сколько заданий, какие темы, сколько первичных баллов за каждое и сколько времени отводится. <strong>Кодификатор</strong> — перечень всех элементов содержания, которые могут встретиться в вариантах; это самый точный список тем для повторения.</p>
        <p><strong>Навигатор самостоятельной подготовки</strong> ФИПИ разбивает курс на темы, для каждой даёт краткую теорию и примеры заданий с разбором. <strong>Методические рекомендации по итогам экзамена</strong> показывают, какие задания выпускники выполняют хуже всего и какие ошибки повторяются из года в год.{exam === 'ege' ? ' Открытые варианты досрочного периода — настоящие КИМ, которые ФИПИ публикует после экзамена: лучший материал для пробников.' : ''}</p>
        {changes.length > 0 && (
          <p>Планируемые изменения в КИМ по всем предметам ФИПИ публикует отдельным документом: {changes.slice(0, 3).map((c, i) => <span key={c.id}>{i > 0 ? ', ' : ''}<Link href={`/${exam}/izmeneniya-${c.year}/`}>{c.year} год</Link></span>)}.</p>
        )}
      </section>

      <section className="gdz-section">
        <div className="gdz-section-head"><h2>Смотрите также</h2></div>
        <div className="ol-stage-block"><div className="rows">
          <Link href={`/${other}/`}>{EXAM_NAME[other]} {CURRENT_YEAR}: материалы ФИПИ</Link>
          <Link href="/olimpiady/">Олимпиады: задания прошлых лет</Link>
          <Link href="/gdz/">ГДЗ</Link>
          <Link href="/uchebnik/">Учебник по темам</Link>
          <Link href={`/shkoly/osobennosti/podgotovka-k-${exam}/`}>Школы с подготовкой к {ex}</Link>
        </div></div>
      </section>

      <AdInline slot={3} suffix="ex-hub" />
    </ExamShell>
  )
}
