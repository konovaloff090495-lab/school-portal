import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import {
  olimpSubjects, getOlimpSubject, papersBySubject, classesForSubject, stageYearsForSubject,
  sortPapers, olimpUrl, stageYearUrl, classUrl, olimpYears,
} from '@/data/olimp'
import YandexRTBBanner from '@/components/YandexRTBBanner'
import { AD_BLOCKS, AD_SLOT_2, AD_SLOT_3 } from '@/lib/ads'
import { olimpGuides, getOlimpGuide } from '@/data/olimp-guides'
import { getOlimpPrep } from '@/data/olimp'

const SITE = 'https://pro-schools.ru'
interface Props { params: Promise<{ subject: string }> }

export function generateStaticParams() {
  return [...olimpSubjects().map(s => ({ subject: s.slug })), ...olimpGuides.map(g => ({ subject: g.slug }))]
}

function yearsSpan(): string {
  const y = olimpYears()
  return `${y[y.length - 1].slice(0, 4)}–${y[0].slice(0, 4)}`
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { subject } = await params
  const g = getOlimpGuide(subject)
  if (g) {
    return { title: g.title, description: g.description, keywords: g.keywords, alternates: { canonical: `${SITE}/olimpiady/${g.slug}/` } }
  }
  const s = getOlimpSubject(subject)
  if (!s || papersBySubject(subject).length === 0) return {}
  const classes = classesForSubject(subject)
  return {
    // Вордстат: «олимпиада по математике задания» (12 370/мес), «…прошлых лет» (1 875), «…ответы» (1 533)
    title: `Олимпиада по ${s.dat} — задания прошлых лет с ответами, ${classes[0]}–${classes[classes.length - 1]} класс (ВсОШ ${yearsSpan()})`,
    description: `Задания и решения Всероссийской олимпиады школьников по ${s.dat}: школьный, муниципальный, региональный и заключительный этапы ${yearsSpan()} для ${classes[0]}–${classes[classes.length - 1]} классов. PDF для скачивания и текст заданий для прорешивания онлайн.`,
    keywords: `олимпиада по ${s.dat} задания, всош ${s.dat}, олимпиада по ${s.dat} ответы, олимпиада по ${s.dat} прошлых лет`,
    alternates: { canonical: `${SITE}/olimpiady/${subject}/` },
  }
}

// ── Справочная страница (/olimpiady/vsosh-2026-2027/, /olimpiady/sirius/ …) ──
function GuidePage({ g }: { g: (typeof olimpGuides)[number] }) {
  const subj = (g.subjects ?? []).map(sl => getOlimpSubject(sl)).filter((x): x is NonNullable<typeof x> => !!x && papersBySubject(x.slug).length > 0)
  const ld = [
    { '@context': 'https://schema.org', '@type': 'BreadcrumbList', itemListElement: [
      { '@type': 'ListItem', position: 1, name: 'Олимпиады', item: `${SITE}/olimpiady/` },
      { '@type': 'ListItem', position: 2, name: g.h1, item: `${SITE}/olimpiady/${g.slug}/` } ] },
    { '@context': 'https://schema.org', '@type': 'Article', headline: g.h1, description: g.description, dateModified: g.updated,
      inLanguage: 'ru', mainEntityOfPage: `${SITE}/olimpiady/${g.slug}/`, publisher: { '@type': 'Organization', name: 'pro-schools.ru' } },
  ]
  return (
    <div className="gdz-shell">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(ld) }} />
      <main className="gdz-main">
        <nav className="gdz-crumbs" aria-label="Хлебные крошки">
          <Link href="/">Главная</Link><span className="sep">/</span>
          <Link href="/olimpiady/">Олимпиады</Link><span className="sep">/</span>
          <span className="cur">{g.h1}</span>
        </nav>
        <div className="gdz-pagehead">
          <div className="gdz-eyebrow"><span className="dot"></span>{g.eyebrow}</div>
          <h1>{g.h1}</h1>
          <p className="lede">{g.lede}</p>
        </div>
        <aside className="gdz-ad gdz-ad-inline ol-ad-mobile" aria-label="Реклама">
          <div className="gdz-ad-label"><span>Реклама</span><span className="age">16+</span></div>
          <div className="gdz-ad-slot"><YandexRTBBanner blockId={AD_BLOCKS.gdzUchebnik} suffix="ol-guide-inline" viewport="mobile" /></div>
        </aside>
        <section className="ol-text ol-seo ol-guide" dangerouslySetInnerHTML={{ __html: g.html }} />
        <aside className="gdz-ad gdz-ad-inline" aria-label="Реклама">
          <div className="gdz-ad-label"><span>Реклама</span><span className="age">16+</span></div>
          <div className="gdz-ad-slot"><YandexRTBBanner blockId={AD_SLOT_2} suffix="ol-guide-mid" /></div>
        </aside>
        {subj.length > 0 && (
          <section className="gdz-section">
            <div className="gdz-section-head"><h2>Задания прошлых лет с ответами</h2></div>
            <div className="gdz-subj-grid">
              {subj.map(x => (
                <Link key={x.slug} className="gdz-subj-card" href={`/olimpiady/${x.slug}/`}>
                  <span className="gdz-subj-ic">{x.icon}</span>
                  <span className="gdz-subj-txt"><span className="name">{x.name}</span><span className="count">{papersBySubject(x.slug).length} комплектов ВсОШ</span></span>
                </Link>
              ))}
            </div>
          </section>
        )}
        <section className="gdz-section">
          <div className="gdz-section-head"><h2>Другие справочные страницы</h2></div>
          <div className="ol-stage-block"><div className="rows">
            {olimpGuides.filter(x => x.slug !== g.slug).map(x => <Link key={x.slug} href={`/olimpiady/${x.slug}/`}>{x.h1}</Link>)}
          </div></div>
        </section>
        <aside className="gdz-ad gdz-ad-inline" aria-label="Реклама">
          <div className="gdz-ad-label"><span>Реклама</span><span className="age">16+</span></div>
          <div className="gdz-ad-slot"><YandexRTBBanner blockId={AD_SLOT_3} suffix="ol-guide-bottom" /></div>
        </aside>
      </main>
      <aside className="gdz-rail" aria-label="Реклама">
        <div className="gdz-rail-sticky">
          <div className="gdz-ad">
            <div className="gdz-ad-label"><span>Реклама</span><span className="age">16+</span></div>
            <div className="gdz-ad-slot gdz-ad-slot--tall"><YandexRTBBanner blockId={AD_BLOCKS.gdzUchebnik} suffix="ol-guide-sidebar" viewport="desktop" /></div>
          </div>
          <div className="ol-rail-box">
            <h3>Архив ВсОШ по предметам</h3>
            <div className="ol-rail-list">
              {olimpSubjects().slice(0, 12).map(x => <Link key={x.slug} href={`/olimpiady/${x.slug}/`}>{x.icon} {x.name}</Link>)}
            </div>
          </div>
        </div>
      </aside>
    </div>
  )
}

export default async function OlimpSubjectPage({ params }: Props) {
  const { subject } = await params
  const g = getOlimpGuide(subject)
  if (g) return <GuidePage g={g} />
  const s = getOlimpSubject(subject)
  if (!s) notFound()
  const papers = sortPapers(papersBySubject(subject))
  if (papers.length === 0) notFound()
  const classes = classesForSubject(subject)
  const stageYears = stageYearsForSubject(subject)
  const latest = papers.slice(0, 12)
  const breadcrumbLd = {
    '@context': 'https://schema.org', '@type': 'BreadcrumbList',
    itemListElement: [
      { '@type': 'ListItem', position: 1, name: 'Олимпиады', item: `${SITE}/olimpiady/` },
      { '@type': 'ListItem', position: 2, name: s.name, item: `${SITE}/olimpiady/${subject}/` },
    ],
  }
  // группируем этапы
  const byStage = new Map<string, typeof stageYears>()
  for (const sy of stageYears) {
    const arr = byStage.get(sy.stage.slug) ?? []
    arr.push(sy); byStage.set(sy.stage.slug, arr)
  }

  return (
    <div className="gdz-shell">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbLd) }} />
      <main className="gdz-main">
        <nav className="gdz-crumbs" aria-label="Хлебные крошки">
          <Link href="/">Главная</Link><span className="sep">/</span>
          <Link href="/olimpiady/">Олимпиады</Link><span className="sep">/</span>
          <span className="cur">{s.name}</span>
        </nav>

        <div className="gdz-pagehead">
          <div className="gdz-eyebrow"><span className="dot"></span>{s.icon} ВсОШ · {papers.length} комплектов · {yearsSpan()}</div>
          <h1>Олимпиада по {s.dat} — задания прошлых лет с ответами</h1>
          <p className="lede">
            Все комплекты Всероссийской олимпиады школьников по {s.dat} за {yearsSpan()} учебные годы: задания
            и официальные решения каждого этапа для {classes[0]}–{classes[classes.length - 1]} классов. Выберите класс или этап.
          </p>
        </div>

        <section className="gdz-section">
          <div className="gdz-section-head"><h2>По классам</h2></div>
          <div className="gdz-classbar">
            {classes.map(k => <Link key={k} href={classUrl(subject, k)}>{k} класс</Link>)}
          </div>
        </section>

        <aside className="gdz-ad gdz-ad-inline ol-ad-mobile" aria-label="Реклама">
          <div className="gdz-ad-label"><span>Реклама</span><span className="age">16+</span></div>
          <div className="gdz-ad-slot"><YandexRTBBanner blockId={AD_BLOCKS.gdzUchebnik} suffix="ol-subj-inline" viewport="mobile" /></div>
        </aside>

        <section className="gdz-section">
          <div className="gdz-section-head"><h2>Свежие комплекты</h2></div>
          <div className="ol-paper-grid">
            {latest.map(p => (
              <Link key={p.id} className="ol-paper" href={olimpUrl(p)}>
                <span className="yr">{p.yearLabel}</span>
                <span className="t">{p.stageName}, {p.classLabel}</span>
                <span className="m">
                  {p.hasTasks && <span>задания</span>}
                  {p.hasSolutions && <span className="ok">✓ решения</span>}
                  {p.tasksPages > 0 && <span>{p.tasksPages} стр.</span>}
                </span>
              </Link>
            ))}
          </div>
        </section>

        <aside className="gdz-ad gdz-ad-inline" aria-label="Реклама">
          <div className="gdz-ad-label"><span>Реклама</span><span className="age">16+</span></div>
          <div className="gdz-ad-slot"><YandexRTBBanner blockId={AD_SLOT_3} suffix="ol-subj-pop" /></div>
        </aside>

        <section className="gdz-section">
          <div className="gdz-section-head"><h2>По этапам и годам</h2></div>
          {[...byStage.entries()].map(([slug, list]) => (
            <div key={slug} className="ol-stage-block">
              <h3>{list[0].stage.name}</h3>
              <div className="rows">
                {list.map(sy => (
                  <Link key={sy.year} href={stageYearUrl(subject, slug, sy.year)}>
                    {sy.yearLabel} <span className="ct">· {sy.count}</span>
                  </Link>
                ))}
              </div>
            </div>
          ))}
        </section>

        {getOlimpPrep(subject) && (
          <div className="ol-stage-block" style={{ background: 'var(--peach-50)', borderColor: 'var(--peach-200)' }}>
            <h3>📘 Как подготовиться к олимпиаде по {s.dat}</h3>
            <p style={{ margin: '0 0 10px', fontSize: 14, color: 'var(--ink-2)' }}>Структура этапов, типы заданий, темы по классам, план и книги — отдельное руководство.</p>
            <div className="rows"><Link href={`/olimpiady/${subject}/podgotovka/`}>Открыть руководство →</Link></div>
          </div>
        )}

        <section className="gdz-section ol-seo">
          <h2>Как готовиться к олимпиаде по {s.dat}</h2>
          <p>
            Начните с комплекта своего класса за прошлый год того этапа, который предстоит: решите его на время, не
            подглядывая в ответы, затем разберите решения и критерии — они показывают, за что именно ставят баллы.
            После этого переходите к более ранним годам и к комплектам на класс старше: задания соседних классов
            часто пересекаются.
          </p>
          <p>
            Школьный этап открыт для всех, начиная с 4 класса; на муниципальный проходят по результатам школьного,
            на региональный — 9–11 классы по проходным баллам региона. Дипломы регионального и заключительного этапов
            учитываются при поступлении в вузы.
          </p>
        </section>

        <aside className="gdz-ad gdz-ad-inline" aria-label="Реклама">
          <div className="gdz-ad-label"><span>Реклама</span><span className="age">16+</span></div>
          <div className="gdz-ad-slot"><YandexRTBBanner blockId={AD_SLOT_2} suffix="ol-subj-mid" /></div>
        </aside>
      </main>

      <aside className="gdz-rail" aria-label="Реклама">
        <div className="gdz-rail-sticky">
          <div className="gdz-ad">
            <div className="gdz-ad-label"><span>Реклама</span><span className="age">16+</span></div>
            <div className="gdz-ad-slot gdz-ad-slot--tall"><YandexRTBBanner blockId={AD_BLOCKS.gdzUchebnik} suffix="ol-subj-sidebar" viewport="desktop" /></div>
          </div>
          <div className="ol-rail-box">
            <h3>Другие предметы</h3>
            <div className="ol-rail-list">
              {olimpSubjects().filter(x => x.slug !== subject).slice(0, 14).map(x => (
                <Link key={x.slug} href={`/olimpiady/${x.slug}/`}>{x.icon} {x.name}</Link>
              ))}
            </div>
          </div>
        </div>
      </aside>
    </div>
  )
}
