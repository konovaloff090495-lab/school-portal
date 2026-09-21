import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import {
  olimpPapers, getOlimpSubject, getOlimpStage, getOlimpPaper, getOlimpPaperText, papersBySubject, papersByStageYear,
  sortPapers, olimpUrl, stageYearUrl, classUrl, parseStageYear, fmtSize, pagesWord, textbookSubjectsFor, olimpSubjects,
} from '@/data/olimp'
import { getSubjectBySlug, getTopicsForSubjectAndClass } from '@/data/textbook'
import YandexRTBBanner from '@/components/YandexRTBBanner'
import { AD_BLOCKS, AD_SLOT_2, AD_SLOT_3 } from '@/lib/ads'

const SITE = 'https://pro-schools.ru'
interface Props { params: Promise<{ subject: string; sub: string; klass: string }> }

export function generateStaticParams() {
  return olimpPapers().map(p => ({ subject: p.subject, sub: `${p.stage}-${p.year}`, klass: p.classSlug }))
}

function resolve(subject: string, sub: string, klass: string) {
  const sy = parseStageYear(sub)
  if (!sy) return null
  const p = getOlimpPaper(subject, sy.stage, sy.year, klass)
  return p ?? null
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { subject, sub, klass } = await params
  const p = resolve(subject, sub, klass)
  if (!p) return {}
  const url = `${SITE}${olimpUrl(p)}`
  const cls = p.classLabel.replace('–', '-')
  // Вордстат: «олимпиада по математике 9 класс задания» + «региональный этап» + год + «ответы»
  return {
    title: `Олимпиада по ${p.subjectDat} ${cls} — ${p.stageName.toLowerCase()} ВсОШ ${p.yearLabel}: задания и ответы`,
    description: `Задания ${p.stageGen} Всероссийской олимпиады школьников по ${p.subjectDat} ${p.yearLabel} учебного года, ${p.classLabel}${p.hasSolutions ? ', с официальными ответами и критериями оценивания' : ''}. Скачать PDF${p.tasksPages ? ` (${p.tasksPages} ${pagesWord(p.tasksPages)})` : ''} или прорешать онлайн.`,
    keywords: `олимпиада по ${p.subjectDat} ${cls} задания, ${p.stageName.toLowerCase()} всош ${p.subjectDat} ${p.year.slice(0, 4)}, олимпиада по ${p.subjectDat} ${p.year.slice(5)} ответы, всош ${p.subjectDat} ${cls}`,
    alternates: { canonical: url },
  }
}

export default async function OlimpPaperPage({ params }: Props) {
  const { subject, sub, klass } = await params
  const p = resolve(subject, sub, klass)
  if (!p) notFound()
  const s = getOlimpSubject(subject)!
  const st = getOlimpStage(p.stage)!
  const text = getOlimpPaperText(p.id)
  const url = `${SITE}${olimpUrl(p)}`
  const pdfs = p.files.filter(f => f.ext === 'pdf')
  const taskPdfs = pdfs.filter(f => f.kind === 'tasks')
  const solPdfs = pdfs.filter(f => f.kind === 'solutions')
  const otherPdfs = pdfs.filter(f => f.kind === 'other')
  const media = p.files.filter(f => f.ext !== 'pdf' && f.kind !== 'video')
  const videos = p.files.filter(f => f.kind === 'video')
  const embed = taskPdfs[0] ?? pdfs[0]
  const firstClass = p.classes[0]

  // соседи: тот же предмет и класс — другие годы/этапы
  const siblings = sortPapers(papersBySubject(subject).filter(x => x.id !== p.id && x.classes.some(k => p.classes.includes(k)))).slice(0, 12)
  const sameStage = papersByStageYear(subject, p.stage, p.year).filter(x => x.id !== p.id)
  const tbTopics = textbookSubjectsFor(subject, firstClass).flatMap(ts => {
    const tsub = getSubjectBySlug(ts)
    return getTopicsForSubjectAndClass(ts, firstClass).slice(0, 6).map(t => ({ title: t.title, href: `/uchebnik/${ts}/${firstClass}-klass/${t.slug}/`, subj: tsub?.title ?? '' }))
  })

  const taskParas = (text?.tasks ?? []).map(t => ({ ...t, paras: t.paras.filter(x => x.length > 1) }))
  const solParas = (text?.solutions ?? []).map(t => ({ ...t, paras: t.paras.filter(x => x.length > 1) }))
  const hasTaskText = taskParas.some(t => t.paras.length > 2)
  const hasSolText = solParas.some(t => t.paras.length > 2)

  const ld = [
    { '@context': 'https://schema.org', '@type': 'BreadcrumbList', itemListElement: [
      { '@type': 'ListItem', position: 1, name: 'Олимпиады', item: `${SITE}/olimpiady/` },
      { '@type': 'ListItem', position: 2, name: s.name, item: `${SITE}/olimpiady/${subject}/` },
      { '@type': 'ListItem', position: 3, name: `${st.name} ${p.yearLabel}`, item: `${SITE}${stageYearUrl(subject, p.stage, p.year)}` },
      { '@type': 'ListItem', position: 4, name: p.classLabel, item: url } ] },
    { '@context': 'https://schema.org', '@type': 'LearningResource',
      name: `Олимпиада по ${p.subjectDat} ${p.classLabel} — ${st.name.toLowerCase()} ВсОШ ${p.yearLabel}`,
      url, inLanguage: 'ru', educationalLevel: p.classLabel, learningResourceType: 'Задания олимпиады',
      about: s.name, isAccessibleForFree: true,
      hasPart: pdfs.map(f => ({ '@type': 'DigitalDocument', name: `${f.group} ${f.label}`.trim(), url: `${SITE}${f.url}`, encodingFormat: 'application/pdf' })) },
  ]

  const label = (f: { group: string; label: string }) => f.label ? `${f.group} — ${f.label}` : f.group

  return (
    <div className="gdz-shell">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(ld) }} />
      <main className="gdz-main">
        <nav className="gdz-crumbs" aria-label="Хлебные крошки">
          <Link href="/olimpiady/">Олимпиады</Link><span className="sep">/</span>
          <Link href={`/olimpiady/${subject}/`}>{s.name}</Link><span className="sep">/</span>
          <Link href={classUrl(subject, firstClass)}>{firstClass} класс</Link><span className="sep">/</span>
          <span className="cur">{st.name} {p.yearLabel}</span>
        </nav>

        <div className="gdz-pagehead">
          <div className="gdz-eyebrow"><span className="dot"></span>{s.icon} ВсОШ · {st.name} · {p.yearLabel}</div>
          <h1>Олимпиада по {p.subjectDat} {p.classLabel} — {st.name.toLowerCase()} ВсОШ {p.yearLabel}: задания и ответы</h1>
          <p className="lede">
            Официальный комплект {st.gen} Всероссийской олимпиады школьников по {p.subjectDat} для {p.classLabel.replace('классы', 'классов').replace('класс', 'класса')} ({p.yearLabel} учебный год).
            {p.hasSolutions ? ' Задания и решения с критериями оценивания — ' : ' Задания — '}
            скачайте PDF или прорешайте онлайн по тексту ниже.
          </p>
        </div>

        <div className="ol-dl">
          {taskPdfs.map((f, i) => (
            <a key={f.url} href={f.url} className={i === 0 ? 'pri' : ''} target="_blank" rel="noopener">
              📄 {label(f)} <small>PDF{f.pages ? ` · ${f.pages} ${pagesWord(f.pages)}` : ''}{f.size ? ` · ${fmtSize(f.size)}` : ''}</small>
            </a>
          ))}
          {solPdfs.map(f => (
            <a key={f.url} href={f.url} target="_blank" rel="noopener">✅ {label(f)} <small>PDF{f.size ? ` · ${fmtSize(f.size)}` : ''}</small></a>
          ))}
          {otherPdfs.map(f => (
            <a key={f.url} href={f.url} target="_blank" rel="noopener">📎 {label(f)} <small>PDF</small></a>
          ))}
          {media.map(f => (
            <a key={f.url} href={f.url} target="_blank" rel="noopener nofollow">🎧 {label(f)} <small>{f.ext}</small></a>
          ))}
        </div>

        {embed && (
          <div className="ol-pdf">
            <iframe src={`${embed.url}#view=FitH`} title={`${label(embed)} — ${s.name}, ${p.classLabel}`} loading="lazy" />
            <div className="bar">
              <span>Просмотр PDF: {label(embed)}</span>
              <a href={embed.url} target="_blank" rel="noopener">Открыть в новой вкладке ↗</a>
            </div>
          </div>
        )}

        <aside className="gdz-ad gdz-ad-inline" aria-label="Реклама">
          <div className="gdz-ad-label"><span>Реклама</span><span className="age">16+</span></div>
          <div className="gdz-ad-slot"><YandexRTBBanner blockId={AD_BLOCKS.gdzUchebnik} suffix="ol-paper-inline" viewport="mobile" /></div>
        </aside>

        {hasTaskText && (
          <section className="ol-text" id="zadaniya">
            <h2>Задания — текст для прорешивания</h2>
            <p className="note">Текст извлечён из официального PDF автоматически: формулы, таблицы и рисунки могут отображаться неточно — сверяйтесь с документом выше.</p>
            {taskParas.map((t, i) => (
              <div key={i}>
                {taskParas.length > 1 && <h3>{label(t)}</h3>}
                {t.paras.map((para, j) => <p key={j}>{para}</p>)}
              </div>
            ))}
          </section>
        )}

        <aside className="gdz-ad gdz-ad-inline" aria-label="Реклама">
          <div className="gdz-ad-label"><span>Реклама</span><span className="age">16+</span></div>
          <div className="gdz-ad-slot"><YandexRTBBanner blockId={AD_SLOT_2} suffix="ol-paper-mid" /></div>
        </aside>

        {hasSolText && (
          <section className="ol-text" id="otvety">
            <details>
              <summary>Ответы и решения — показать</summary>
              <p className="note">Официальные ответы и критерии оценивания жюри. Сначала решите задания самостоятельно.</p>
              {solParas.map((t, i) => (
                <div key={i}>
                  {solParas.length > 1 && <h3>{label(t)}</h3>}
                  {t.paras.map((para, j) => <p key={j}>{para}</p>)}
                </div>
              ))}
            </details>
          </section>
        )}

        {videos.length > 0 && (
          <section className="gdz-section">
            <div className="gdz-section-head"><h2>Видеоразборы заданий</h2></div>
            <div className="ol-stage-block"><div className="rows">
              {videos.map(f => <a key={f.url} href={f.url} target="_blank" rel="noopener nofollow">▶ {label(f)}</a>)}
            </div></div>
          </section>
        )}

        {tbTopics.length > 0 && (
          <section className="gdz-section">
            <div className="gdz-section-head"><h2>Теория к заданиям: {s.name.toLowerCase()}, {firstClass} класс</h2></div>
            <div className="ol-theory">
              {tbTopics.map(t => <Link key={t.href} href={t.href}>{t.title}<br /><small style={{ fontWeight: 600, color: 'var(--ink-3)' }}>{t.subj}</small></Link>)}
            </div>
          </section>
        )}

        {sameStage.length > 0 && (
          <section className="gdz-section">
            <div className="gdz-section-head"><h2>{st.name} {p.yearLabel} — другие классы</h2><Link className="more" href={stageYearUrl(subject, p.stage, p.year)}>Все классы →</Link></div>
            <div className="ol-stage-block"><div className="rows">
              {sameStage.map(x => <Link key={x.id} href={olimpUrl(x)}>{x.classLabel}</Link>)}
            </div></div>
          </section>
        )}

        {siblings.length > 0 && (
          <section className="gdz-section">
            <div className="gdz-section-head"><h2>Олимпиада по {p.subjectDat} {firstClass} класс — другие годы и этапы</h2><Link className="more" href={classUrl(subject, firstClass)}>Все комплекты →</Link></div>
            <div className="ol-paper-grid">
              {siblings.map(x => (
                <Link key={x.id} className="ol-paper" href={olimpUrl(x)}>
                  <span className="yr">{x.yearLabel}</span>
                  <span className="t">{x.stageName}, {x.classLabel}</span>
                  <span className="m">{x.hasSolutions && <span className="ok">✓ решения</span>}{x.tasksPages > 0 && <span>{x.tasksPages} стр.</span>}</span>
                </Link>
              ))}
            </div>
          </section>
        )}

        <aside className="gdz-ad gdz-ad-inline" aria-label="Реклама">
          <div className="gdz-ad-label"><span>Реклама</span><span className="age">16+</span></div>
          <div className="gdz-ad-slot"><YandexRTBBanner blockId={AD_SLOT_3} suffix="ol-paper-bottom" /></div>
        </aside>
      </main>

      <aside className="gdz-rail" aria-label="Реклама">
        <div className="gdz-rail-sticky">
          <div className="gdz-ad">
            <div className="gdz-ad-label"><span>Реклама</span><span className="age">16+</span></div>
            <div className="gdz-ad-slot gdz-ad-slot--tall"><YandexRTBBanner blockId={AD_BLOCKS.gdzUchebnik} suffix="ol-paper-sidebar" viewport="desktop" /></div>
          </div>
          <div className="ol-rail-box">
            <h3>{st.name} {p.yearLabel} — предметы</h3>
            <div className="ol-rail-list">
              {olimpSubjects().filter(x => papersByStageYear(x.slug, p.stage, p.year).length).slice(0, 14).map(x => (
                <Link key={x.slug} href={stageYearUrl(x.slug, p.stage, p.year)} className={x.slug === subject ? 'active' : ''}>{x.icon} {x.name}</Link>
              ))}
            </div>
          </div>
        </div>
      </aside>
    </div>
  )
}
