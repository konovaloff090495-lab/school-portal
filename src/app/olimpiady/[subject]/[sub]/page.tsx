import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import {
  olimpSubjects, olimpPapers, getOlimpSubject, getOlimpStage, papersBySubject, papersByClass, papersByStageYear,
  classesForSubject, stageYearsForSubject, sortPapers, olimpUrl, stageYearUrl, classUrl,
  parseStageYear, parseKlassSlug, olimpYears, textbookSubjectsFor,
} from '@/data/olimp'
import { getSubjectBySlug, getTopicsForSubjectAndClass } from '@/data/textbook'
import YandexRTBBanner from '@/components/YandexRTBBanner'
import { AD_BLOCKS, AD_SLOT_2, AD_SLOT_3 } from '@/lib/ads'

const SITE = 'https://pro-schools.ru'
interface Props { params: Promise<{ subject: string; sub: string }> }

// Один маршрут — три вида страниц:
//   /olimpiady/klass/7-klass/                 — класс по всем предметам
//   /olimpiady/matematika/7-klass/            — класс внутри предмета
//   /olimpiady/matematika/shkolnyj-etap-2025-2026/ — этап × год внутри предмета
export function generateStaticParams() {
  const out: { subject: string; sub: string }[] = []
  const allClasses = new Set<number>()
  for (const s of olimpSubjects()) {
    for (const k of classesForSubject(s.slug)) { out.push({ subject: s.slug, sub: `${k}-klass` }); allClasses.add(k) }
    for (const sy of stageYearsForSubject(s.slug)) out.push({ subject: s.slug, sub: `${sy.stage.slug}-${sy.year}` })
  }
  for (const k of allClasses) out.push({ subject: 'klass', sub: `${k}-klass` })
  return out
}

function yearsSpan(): string {
  const y = olimpYears()
  return `${y[y.length - 1].slice(0, 4)}–${y[0].slice(0, 4)}`
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { subject, sub } = await params
  const klass = parseKlassSlug(sub)
  if (subject === 'klass' && klass) {
    const n = olimpPapers().filter(p => p.classes.includes(klass)).length
    if (!n) return {}
    // Вордстат: «олимпиада 4 класс» — сквозной по предметам спрос
    return {
      title: `Олимпиады для ${klass} класса — задания с ответами по всем предметам (ВсОШ ${yearsSpan()})`,
      description: `Задания олимпиад для ${klass} класса по всем предметам: ${n} комплектов Всероссийской олимпиады школьников с ответами и решениями за ${yearsSpan()}. Скачать PDF или прорешать онлайн.`,
      alternates: { canonical: `${SITE}/olimpiady/klass/${sub}/` },
    }
  }
  const s = getOlimpSubject(subject)
  if (!s) return {}
  if (klass) {
    const list = papersByClass(subject, klass)
    if (!list.length) return {}
    // Вордстат: «олимпиада по математике 4 класс задания» 2 659, «…5 класс» 1 395, «…7 класс» 1 041
    return {
      title: `Олимпиада по ${s.dat} ${klass} класс — задания с ответами прошлых лет (ВсОШ ${yearsSpan()})`,
      description: `${list.length} комплектов заданий Всероссийской олимпиады школьников по ${s.dat} для ${klass} класса: школьный, муниципальный${klass >= 9 ? ', региональный и заключительный' : ''} этапы ${yearsSpan()} с ответами и решениями. PDF и текст для прорешивания онлайн.`,
      keywords: `олимпиада по ${s.dat} ${klass} класс, олимпиада по ${s.dat} ${klass} класс задания, олимпиада по ${s.dat} ${klass} класс с ответами, всош ${s.dat} ${klass} класс`,
      alternates: { canonical: `${SITE}/olimpiady/${subject}/${sub}/` },
    }
  }
  const sy = parseStageYear(sub)
  if (!sy) return {}
  const st = getOlimpStage(sy.stage)
  const list = sortPapers(papersByStageYear(subject, sy.stage, sy.year))
  if (!st || !list.length) return {}
  const yl = sy.year.replace('-', '/')
  const ks = list.flatMap(p => p.classes)
  const cl = `${Math.min(...ks)}–${Math.max(...ks)} классы`
  return {
    // Вордстат: «задания олимпиад по математике школьный этап» 778, «всош 2026», «олимпиада по математике 2025 задания» 1 090
    title: `${st.name} ВсОШ по ${s.dat} ${yl} — задания и ответы (${cl})`,
    description: `Задания и решения ${st.gen} Всероссийской олимпиады школьников по ${s.dat} ${yl} учебного года: ${cl}. Официальные PDF, ответы и критерии оценивания, текст заданий онлайн.`,
    keywords: `${st.name.toLowerCase()} всош ${s.dat} ${sy.year.slice(0, 4)}, олимпиада по ${s.dat} ${sy.year.slice(5)} задания, ${st.name.toLowerCase()} олимпиады по ${s.dat} задания`,
    alternates: { canonical: `${SITE}/olimpiady/${subject}/${sub}/` },
  }
}

function PaperCard({ p, showSubject }: { p: ReturnType<typeof olimpPapers>[number]; showSubject?: boolean }) {
  return (
    <Link className="ol-paper" href={olimpUrl(p)}>
      <span className="yr">{p.yearLabel}{showSubject ? ` · ${p.subjectName}` : ''}</span>
      <span className="t">{p.stageName}, {p.classLabel}</span>
      <span className="m">
        {p.hasTasks && <span>задания</span>}
        {p.hasSolutions && <span className="ok">✓ решения</span>}
        {p.tasksPages > 0 && <span>{p.tasksPages} стр.</span>}
      </span>
    </Link>
  )
}

function Ads({ sfx }: { sfx: string }) {
  return (
    <aside className="gdz-ad gdz-ad-inline ol-ad-mobile" aria-label="Реклама">
      <div className="gdz-ad-label"><span>Реклама</span><span className="age">16+</span></div>
      <div className="gdz-ad-slot"><YandexRTBBanner blockId={AD_BLOCKS.gdzUchebnik} suffix={`${sfx}-inline`} viewport="mobile" /></div>
    </aside>
  )
}
function Rail({ sfx, children }: { sfx: string; children?: React.ReactNode }) {
  return (
    <aside className="gdz-rail" aria-label="Реклама">
      <div className="gdz-rail-sticky">
        <div className="gdz-ad">
          <div className="gdz-ad-label"><span>Реклама</span><span className="age">16+</span></div>
          <div className="gdz-ad-slot gdz-ad-slot--tall"><YandexRTBBanner blockId={AD_BLOCKS.gdzUchebnik} suffix={`${sfx}-sidebar`} viewport="desktop" /></div>
        </div>
        {children}
      </div>
    </aside>
  )
}

export default async function OlimpSubPage({ params }: Props) {
  const { subject, sub } = await params
  const klass = parseKlassSlug(sub)

  // ── Класс по всем предметам ──
  if (subject === 'klass') {
    if (!klass) notFound()
    const list = sortPapers(olimpPapers().filter(p => p.classes.includes(klass)))
    if (!list.length) notFound()
    const subjects = olimpSubjects().filter(s => list.some(p => p.subject === s.slug))
    const ld = { '@context': 'https://schema.org', '@type': 'BreadcrumbList', itemListElement: [
      { '@type': 'ListItem', position: 1, name: 'Олимпиады', item: `${SITE}/olimpiady/` },
      { '@type': 'ListItem', position: 2, name: `${klass} класс`, item: `${SITE}/olimpiady/klass/${sub}/` } ] }
    return (
      <div className="gdz-shell">
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(ld) }} />
        <main className="gdz-main">
          <nav className="gdz-crumbs" aria-label="Хлебные крошки">
            <Link href="/">Главная</Link><span className="sep">/</span>
            <Link href="/olimpiady/">Олимпиады</Link><span className="sep">/</span>
            <span className="cur">{klass} класс</span>
          </nav>
          <div className="gdz-pagehead">
            <div className="gdz-eyebrow"><span className="dot"></span>{list.length} комплектов · {subjects.length} предметов</div>
            <h1>Олимпиады для {klass} класса — задания с ответами по всем предметам</h1>
            <p className="lede">Всё, что писали {klass}-классники на Всероссийской олимпиаде школьников в {yearsSpan()} годах: выберите предмет — внутри задания и решения по этапам и годам.</p>
          </div>
          <section className="gdz-section">
            <div className="gdz-section-head"><h2>Предметы</h2></div>
            <div className="gdz-subj-grid">
              {subjects.map(s => (
                <Link key={s.slug} className="gdz-subj-card" href={classUrl(s.slug, klass)}>
                  <span className="gdz-subj-ic">{s.icon}</span>
                  <span className="gdz-subj-txt"><span className="name">{s.name}</span><span className="count">{list.filter(p => p.subject === s.slug).length} комплектов</span></span>
                </Link>
              ))}
            </div>
          </section>
          <Ads sfx="ol-kl" />
          <section className="gdz-section">
            <div className="gdz-section-head"><h2>Другие классы</h2></div>
            <div className="gdz-classbar">
              {[3, 4, 5, 6, 7, 8, 9, 10, 11].filter(k => k !== klass).map(k => <Link key={k} href={`/olimpiady/klass/${k}-klass/`}>{k} класс</Link>)}
            </div>
          </section>
          <aside className="gdz-ad gdz-ad-inline" aria-label="Реклама">
            <div className="gdz-ad-label"><span>Реклама</span><span className="age">16+</span></div>
            <div className="gdz-ad-slot"><YandexRTBBanner blockId={AD_SLOT_3} suffix="ol-kl-pop" /></div>
          </aside>
        </main>
        <Rail sfx="ol-kl" />
      </div>
    )
  }

  const s = getOlimpSubject(subject)
  if (!s) notFound()

  // ── Класс внутри предмета ──
  if (klass) {
    const list = sortPapers(papersByClass(subject, klass))
    if (!list.length) notFound()
    const classes = classesForSubject(subject)
    const byYear = new Map<string, typeof list>()
    for (const p of list) { const a = byYear.get(p.yearLabel) ?? []; a.push(p); byYear.set(p.yearLabel, a) }
    const tbTopics = textbookSubjectsFor(subject, klass).flatMap(ts => {
      const tsub = getSubjectBySlug(ts)
      return getTopicsForSubjectAndClass(ts, klass).slice(0, 8).map(t => ({ title: t.title, href: `/uchebnik/${ts}/${klass}-klass/${t.slug}/`, subj: tsub?.title ?? '' }))
    })
    const ld = { '@context': 'https://schema.org', '@type': 'BreadcrumbList', itemListElement: [
      { '@type': 'ListItem', position: 1, name: 'Олимпиады', item: `${SITE}/olimpiady/` },
      { '@type': 'ListItem', position: 2, name: s.name, item: `${SITE}/olimpiady/${subject}/` },
      { '@type': 'ListItem', position: 3, name: `${klass} класс`, item: `${SITE}/olimpiady/${subject}/${sub}/` } ] }
    return (
      <div className="gdz-shell">
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(ld) }} />
        <main className="gdz-main">
          <nav className="gdz-crumbs" aria-label="Хлебные крошки">
            <Link href="/">Главная</Link><span className="sep">/</span>
            <Link href="/olimpiady/">Олимпиады</Link><span className="sep">/</span>
            <Link href={`/olimpiady/${subject}/`}>{s.name}</Link><span className="sep">/</span>
            <span className="cur">{klass} класс</span>
          </nav>
          <div className="gdz-pagehead">
            <div className="gdz-eyebrow"><span className="dot"></span>{s.icon} ВсОШ · {list.length} комплектов · {yearsSpan()}</div>
            <h1>Олимпиада по {s.dat} {klass} класс — задания с ответами прошлых лет</h1>
            <p className="lede">
              Все комплекты Всероссийской олимпиады школьников по {s.dat} для {klass} класса за {yearsSpan()} учебные годы:
              задания, официальные ответы и критерии оценивания. Откройте комплект — внутри PDF для скачивания и текст заданий,
              который удобно решать с телефона.
            </p>
          </div>
          <div className="gdz-classbar">
            {classes.map(k => <Link key={k} href={classUrl(subject, k)} className={k === klass ? 'active' : ''}>{k} класс</Link>)}
          </div>
          <Ads sfx="ol-cls" />
          {[...byYear.entries()].map(([yl, arr], i) => (
            <section key={yl} className="gdz-section">
              <div className="gdz-section-head"><h2>{yl} учебный год</h2></div>
              <div className="ol-paper-grid">{arr.map(p => <PaperCard key={p.id} p={p} />)}</div>
              {i === 0 && (
                <aside className="gdz-ad gdz-ad-inline" aria-label="Реклама" style={{ marginTop: 18 }}>
                  <div className="gdz-ad-label"><span>Реклама</span><span className="age">16+</span></div>
                  <div className="gdz-ad-slot"><YandexRTBBanner blockId={AD_SLOT_3} suffix="ol-cls-pop" /></div>
                </aside>
              )}
            </section>
          ))}
          {tbTopics.length > 0 && (
            <section className="gdz-section">
              <div className="gdz-section-head"><h2>Теория для подготовки: {s.name.toLowerCase()}, {klass} класс</h2></div>
              <p className="ol-text note" style={{ padding: 0, border: 0, marginBottom: 10 }}>Темы школьной программы, на которых строятся олимпиадные задания. Разбор с примерами — в нашем учебнике.</p>
              <div className="ol-theory">
                {tbTopics.map(t => <Link key={t.href} href={t.href}>{t.title}<br /><small style={{ fontWeight: 600, color: 'var(--ink-3)' }}>{t.subj}</small></Link>)}
              </div>
            </section>
          )}
          <section className="gdz-section ol-seo">
            <h2>Как устроена олимпиада по {s.dat} в {klass} классе</h2>
            <p>
              {klass <= 6
                ? `В ${klass} классе ученики участвуют в школьном этапе ВсОШ (и в пригласительном — онлайн, весной). Муниципальный, региональный и заключительный этапы начинаются с 7 класса, поэтому основная цель сейчас — освоить формат: нестандартные задачи на логику и смекалку, а не на скорость счёта.`
                : klass <= 8
                  ? `С 7 класса после школьного этапа открывается муниципальный. Задания ${klass} класса заметно сложнее школьной программы: важны идеи и полные обоснования, а не только ответ. Разбирайте критерии оценивания — они показывают, за какие шаги начисляют баллы.`
                  : `В ${klass} классе доступны все этапы, включая региональный и заключительный. Дипломы этих этапов учитываются при поступлении в вузы: победители и призёры заключительного этапа зачисляются без экзаменов, региональный этап даёт дополнительные баллы. Готовьтесь по комплектам двух-трёх последних лет и решайте задания класса старше.`}
            </p>
            <p>
              Порядок работы: решите комплект прошлого года на время без подсказок, сверьте с ответами и критериями, выпишите темы, в которых были ошибки, и подтяните их по теории. Затем возьмите комплект более раннего года.
            </p>
          </section>
          <aside className="gdz-ad gdz-ad-inline" aria-label="Реклама">
            <div className="gdz-ad-label"><span>Реклама</span><span className="age">16+</span></div>
            <div className="gdz-ad-slot"><YandexRTBBanner blockId={AD_SLOT_2} suffix="ol-cls-mid" /></div>
          </aside>
        </main>
        <Rail sfx="ol-cls">
          <div className="ol-rail-box">
            <h3>{klass} класс — другие предметы</h3>
            <div className="ol-rail-list">
              {olimpSubjects().filter(x => x.slug !== subject && papersByClass(x.slug, klass).length).slice(0, 14).map(x => (
                <Link key={x.slug} href={classUrl(x.slug, klass)}>{x.icon} {x.name}</Link>
              ))}
            </div>
          </div>
        </Rail>
      </div>
    )
  }

  // ── Этап × год внутри предмета ──
  const sy = parseStageYear(sub)
  if (!sy) notFound()
  const st = getOlimpStage(sy.stage)
  const list = sortPapers(papersByStageYear(subject, sy.stage, sy.year))
  if (!st || !list.length) notFound()
  const yl = sy.year.replace('-', '/')
  const others = stageYearsForSubject(subject).filter(x => !(x.stage.slug === sy.stage && x.year === sy.year))
  const ld = { '@context': 'https://schema.org', '@type': 'BreadcrumbList', itemListElement: [
    { '@type': 'ListItem', position: 1, name: 'Олимпиады', item: `${SITE}/olimpiady/` },
    { '@type': 'ListItem', position: 2, name: s.name, item: `${SITE}/olimpiady/${subject}/` },
    { '@type': 'ListItem', position: 3, name: `${st.name} ${yl}`, item: `${SITE}/olimpiady/${subject}/${sub}/` } ] }
  return (
    <div className="gdz-shell">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(ld) }} />
      <main className="gdz-main">
        <nav className="gdz-crumbs" aria-label="Хлебные крошки">
          <Link href="/">Главная</Link><span className="sep">/</span>
          <Link href="/olimpiady/">Олимпиады</Link><span className="sep">/</span>
          <Link href={`/olimpiady/${subject}/`}>{s.name}</Link><span className="sep">/</span>
          <span className="cur">{st.name} {yl}</span>
        </nav>
        <div className="gdz-pagehead">
          <div className="gdz-eyebrow"><span className="dot"></span>{s.icon} ВсОШ · {yl} · {list.length} комплектов</div>
          <h1>{st.name} ВсОШ по {s.dat} {yl}: задания и ответы</h1>
          <p className="lede">
            Комплекты {st.gen} Всероссийской олимпиады школьников по {s.dat} {yl} учебного года для всех классов —
            задания, официальные ответы и критерии оценивания в PDF и текстом.
          </p>
        </div>
        <section className="gdz-section">
          <div className="gdz-section-head"><h2>Выберите класс</h2></div>
          <div className="ol-paper-grid">{list.map(p => <PaperCard key={p.id} p={p} />)}</div>
        </section>
        <Ads sfx="ol-sy" />
        <section className="gdz-section">
          <div className="gdz-section-head"><h2>Другие этапы и годы — {s.name.toLowerCase()}</h2></div>
          <div className="ol-stage-block">
            <div className="rows">
              {others.map(o => (
                <Link key={o.stage.slug + o.year} href={stageYearUrl(subject, o.stage.slug, o.year)}>{o.stage.name} {o.yearLabel} <span className="ct">· {o.count}</span></Link>
              ))}
            </div>
          </div>
        </section>
        <aside className="gdz-ad gdz-ad-inline" aria-label="Реклама">
          <div className="gdz-ad-label"><span>Реклама</span><span className="age">16+</span></div>
          <div className="gdz-ad-slot"><YandexRTBBanner blockId={AD_SLOT_3} suffix="ol-sy-pop" /></div>
        </aside>
      </main>
      <Rail sfx="ol-sy">
        <div className="ol-rail-box">
          <h3>{st.name} {yl} — другие предметы</h3>
          <div className="ol-rail-list">
            {olimpSubjects().filter(x => x.slug !== subject && papersByStageYear(x.slug, sy.stage, sy.year).length).slice(0, 14).map(x => (
              <Link key={x.slug} href={stageYearUrl(x.slug, sy.stage, sy.year)}>{x.icon} {x.name}</Link>
            ))}
          </div>
        </div>
      </Rail>
    </div>
  )
}
