import type { Metadata } from 'next'
import Link from 'next/link'
import ExamShell, { AdInline, Crumbs, breadcrumbLd } from '@/components/exam/ExamShell'
import {
  type Exam, type ExamDoc, type SiteSubject, docsFor, docPath, getDocText, docTitle, fmtSize, pagesWord, minutesLabel,
  EXAM_NAME, KIND_NAME, KIND_PLURAL, CURRENT_YEAR,
} from '@/data/exam'

const SITE = 'https://pro-schools.ru'
const TEXT_CAP = 60_000

function h1Of(d: ExamDoc, s: SiteSubject): string {
  const ex = EXAM_NAME[d.exam]
  switch (d.kind) {
    case 'demo': return `Демоверсия ${ex} ${d.year} по ${s.dat} от ФИПИ — задания, ответы и критерии`
    case 'spec': return `Спецификация ${ex} ${d.year} по ${s.dat}: структура КИМ, баллы и время`
    case 'codif': return `Кодификатор ${ex} ${d.year} по ${s.dat}: что проверяют на экзамене`
    case 'variant': return `Открытый вариант ${ex} ${d.year} по ${s.dat} — реальные задания досрочного периода`
    case 'mr': return `Методические рекомендации ФИПИ по ${s.dat}: анализ ошибок ${ex} ${d.year}`
    case 'nav-rec': return `Рекомендации ФИПИ по самостоятельной подготовке к ${ex} по ${s.dat} (${d.year})`
    case 'nav-topic': return `${d.title} — теория и задания к ${ex} по ${s.dat}`
    case 'criteria': return `Критерии оценивания ${ex} ${d.year} по ${s.dat}: материалы для экспертов`
    default: return docTitle(d, s)
  }
}

function ledeOf(d: ExamDoc, s: SiteSubject): string {
  const ex = EXAM_NAME[d.exam]; const sm = d.summary ?? {}
  const facts = [sm.tasks ? `${sm.tasks} заданий` : '', sm.minutes ? `${minutesLabel(sm.minutes)} на выполнение` : '', sm.maxPrimary ? `максимум ${sm.maxPrimary} первичных баллов` : ''].filter(Boolean).join(', ')
  switch (d.kind) {
    case 'demo': return `Официальный демонстрационный вариант КИМ ${ex} ${d.year} года по ${s.dat}, опубликованный ФИПИ${facts ? `: ${facts}` : ''}. Ниже — PDF для скачивания и просмотра, текст заданий, ответы и критерии оценивания части 2${sm.changes ? ', а также изменения по сравнению с прошлым годом' : ''}.`
    case 'spec': return `Спецификация — документ ФИПИ, который задаёт структуру экзамена ${d.year} года по ${s.dat}${facts ? `: ${facts}` : ''}. Здесь распределение заданий по темам, уровням сложности и баллам, а также перечень изменений.`
    case 'codif': return `Кодификатор ${ex} ${d.year} по ${s.dat} — полный перечень проверяемых элементов содержания и требований к подготовке выпускников ${s.klass} класса. По нему составляют варианты КИМ, поэтому это самый точный список тем для повторения.`
    case 'variant': return `Один из реальных вариантов КИМ ${ex} ${d.year} по ${s.dat}, использованных на досрочном периоде и открытых ФИПИ после экзамена. Лучший тренировочный материал: настоящие формулировки, реальный уровень сложности, официальные ответы.`
    case 'mr': return `Аналитический отчёт ФИПИ по итогам ${ex} ${d.year} по ${s.dat}: какие задания вызвали наибольшие затруднения, типичные ошибки участников, статистика выполнения и рекомендации по подготовке к следующему году.`
    case 'nav-rec': return `Официальные рекомендации ФИПИ ${d.year} года по самостоятельной подготовке к ${ex} по ${s.dat}: как устроен экзамен, с чего начать повторение, какие темы важнее и какими материалами пользоваться.`
    case 'nav-topic': return `Раздел «${d.title}» из навигатора самостоятельной подготовки ФИПИ к ${ex} по ${s.dat}: краткая теория, перечень проверяемых умений и примеры заданий с разбором.`
    case 'criteria': return `Материалы ФИПИ для председателей и членов предметных комиссий по проверке заданий с развёрнутым ответом ${ex} ${d.year} по ${s.dat}: критерии, примеры ответов и их оценка экспертами.`
    default: return docTitle(d, s)
  }
}

export function docMetadata(exam: Exam, s: SiteSubject, d: ExamDoc): Metadata {
  const url = `${SITE}${docPath(d)}`
  const ex = EXAM_NAME[exam]
  const kw: Record<string, string> = {
    demo: `демоверсия ${ex.toLowerCase()} ${d.year} ${s.dat}, демоверсия ${ex.toLowerCase()} ${d.year} по ${s.dat} фипи, демонстрационный вариант ${ex.toLowerCase()} ${d.year} ${s.short.toLowerCase()}, ${ex.toLowerCase()} ${d.year} ${s.short.toLowerCase()} демоверсия скачать`,
    spec: `спецификация ${ex.toLowerCase()} ${d.year} ${s.short.toLowerCase()}, спецификация ${ex.toLowerCase()} по ${s.dat} ${d.year}, структура ${ex.toLowerCase()} ${s.short.toLowerCase()} ${d.year}`,
    codif: `кодификатор ${ex.toLowerCase()} ${d.year} ${s.short.toLowerCase()}, кодификатор ${ex.toLowerCase()} по ${s.dat} ${d.year} фипи, темы ${ex.toLowerCase()} ${s.short.toLowerCase()}`,
    variant: `варианты ${ex.toLowerCase()} ${d.year} ${s.short.toLowerCase()}, реальный вариант ${ex.toLowerCase()} ${d.year} по ${s.dat}, досрочный ${ex.toLowerCase()} ${d.year} ${s.short.toLowerCase()} с ответами`,
    mr: `методические рекомендации фипи ${s.short.toLowerCase()} ${d.year}, анализ результатов ${ex.toLowerCase()} ${d.year} ${s.short.toLowerCase()}, типичные ошибки ${ex.toLowerCase()} ${s.short.toLowerCase()}`,
    'nav-rec': `навигатор подготовки фипи ${s.short.toLowerCase()}, самостоятельная подготовка к ${ex.toLowerCase()} по ${s.dat}`,
    'nav-topic': `${(d.title ?? '').toLowerCase()} ${ex.toLowerCase()} ${s.short.toLowerCase()}, навигатор фипи ${s.short.toLowerCase()}`,
    criteria: `критерии оценивания ${ex.toLowerCase()} ${d.year} ${s.short.toLowerCase()}, критерии проверки ${ex.toLowerCase()} по ${s.dat}`,
  }
  const pages = d.pages ? ` (PDF, ${d.pages} ${pagesWord(d.pages)})` : ''
  return {
    title: `${h1Of(d, s)}${pages}`.slice(0, 140),
    description: ledeOf(d, s).slice(0, 300),
    keywords: kw[d.kind] ?? '',
    alternates: { canonical: url },
  }
}

/** Обрезает общий объём текста документа (по абзацам), чтобы страница не раздувалась. */
export function capBlocks(texts: { label: string; role: string; paras: string[] }[], cap: number) {
  let shown = 0
  const blocks = texts.map(b => {
    const out: string[] = []
    for (const p of b.paras) { if (shown > cap) break; if (p.length > 1) { out.push(p); shown += p.length } }
    return { ...b, paras: out }
  })
  return { blocks, truncated: shown > cap }
}

/** Делит текст демоверсии на задания и блок ответов/критериев. */
function splitAnswers(paras: string[]): [string[], string[]] {
  const i = paras.findIndex(p => /^(Система оценивания|Ответы к заданиям|ОТВЕТЫ|Критерии оценивания выполнения задани)/i.test(p) || /^Система оценивания экзаменационной работы/.test(p))
  if (i < 0) return [paras, []]
  return [paras.slice(0, i), paras.slice(i)]
}

export default function ExamDocPage({ exam, s, d }: { exam: Exam; s: SiteSubject; d: ExamDoc }) {
  const url = `${SITE}${docPath(d)}`
  const text = getDocText(d.id)
  const pdfs = d.files.filter(f => f.ext === 'pdf')
  const audio = d.files.filter(f => f.ext === 'mp3')
  const embed = pdfs.find(f => f.role === 'demo' || f.role === 'main') ?? pdfs[0]
  const sm = d.summary ?? {}
  const ex = EXAM_NAME[exam]

  // текст: для демоверсии и варианта — задания отдельно, ответы под спойлером
  const { blocks: capped, truncated } = capBlocks(text?.texts ?? [], TEXT_CAP)
  const main = capped.find(b => b.role === 'demo' || b.role === 'main') ?? capped[0]
  const [taskParas, answerParas] = main && (d.kind === 'demo' || d.kind === 'variant') ? splitAnswers(main.paras) : [main?.paras ?? [], []]
  const others = capped.filter(b => b !== main)

  const sameKind = docsFor(exam, s, d.kind).filter(x => x.id !== d.id && docPath(x))
  const sameYear = docsFor(exam, s).filter(x => x.year === d.year && x.id !== d.id && ['demo', 'spec', 'codif', 'variant', 'mr', 'criteria'].includes(x.kind) && docPath(x))
  const topics = d.kind === 'nav-topic' || d.kind === 'nav-rec' ? docsFor(exam, s, 'nav-topic').filter(x => x.id !== d.id) : []

  const ld = [
    breadcrumbLd([{ name: 'Главная', href: '/' }, { name: ex, href: `/${exam}/` }, { name: s.name, href: `/${exam}/${s.slug}/` }, { name: `${KIND_NAME[d.kind]}${d.year ? ` ${d.year}` : ''}`, href: docPath(d)! }]),
    { '@context': 'https://schema.org', '@type': 'LearningResource', name: h1Of(d, s), url, inLanguage: 'ru', isAccessibleForFree: true,
      educationalLevel: `${s.klass} класс`, learningResourceType: KIND_NAME[d.kind], about: s.name, datePublished: d.year ? `${d.year - 1}-09-01` : undefined,
      publisher: { '@type': 'Organization', name: 'ФИПИ', url: 'https://fipi.ru/' },
      hasPart: pdfs.map(f => ({ '@type': 'DigitalDocument', name: f.label, url: `${SITE}${f.url}`, encodingFormat: 'application/pdf' })) },
  ]
  const yearTitle = (x: ExamDoc) => x.kind === 'nav-topic' ? (x.title ?? '') : `${x.year}`

  return (
    <ExamShell exam={exam} suffix={`ex-doc`} ld={ld} active={s.slug}>
      <Crumbs items={[{ name: 'Главная', href: '/' }, { name: ex, href: `/${exam}/` }, { name: s.name, href: `/${exam}/${s.slug}/` }, { name: `${KIND_NAME[d.kind]}${d.year ? ` ${d.year}` : ''}` }]} />
      <div className="gdz-pagehead">
        <div className="gdz-eyebrow"><span className="dot"></span>{s.icon} {ex} · {s.name} · ФИПИ{d.year ? ` · ${d.year}` : ''}</div>
        <h1>{h1Of(d, s)}</h1>
        <p className="lede">{ledeOf(d, s)}</p>
      </div>

      {(sm.tasks || sm.minutes || sm.maxPrimary || d.pages) && (
        <div className="ex-facts">
          {sm.tasks ? <div><b>{sm.tasks}</b><span>заданий</span></div> : null}
          {sm.minutes ? <div><b>{minutesLabel(sm.minutes)}</b><span>на выполнение</span></div> : null}
          {sm.maxPrimary ? <div><b>{sm.maxPrimary}</b><span>первичных баллов</span></div> : null}
          {d.pages ? <div><b>{d.pages}</b><span>{pagesWord(d.pages)} PDF</span></div> : null}
        </div>
      )}

      <div className="ol-dl">
        {pdfs.map((f, i) => (
          <a key={f.url} href={f.url} className={i === 0 ? 'pri' : ''} target="_blank" rel="noopener">
            📄 {f.label} <small>PDF{f.pages ? ` · ${f.pages} ${pagesWord(f.pages)}` : ''}{f.size ? ` · ${fmtSize(f.size)}` : ''}</small>
          </a>
        ))}
        {audio.map(f => <a key={f.url} href={f.url} target="_blank" rel="noopener">🎧 {f.label} <small>MP3 · {fmtSize(f.size)}</small></a>)}
        {d.source && <a href={d.source} target="_blank" rel="noopener nofollow">🗂 Полный архив ФИПИ <small>ZIP{s.fipi === 'informatika' ? ' · с файлами к заданиям' : ''}</small></a>}
      </div>

      {sm.changes && sm.changes.length > 0 && (
        <section className="ol-text ex-changes">
          <h2>Изменения в КИМ {ex} {d.year} по {s.dat}</h2>
          {sm.changes.map((c, i) => <p key={i}>{c}</p>)}
        </section>
      )}

      {embed && (
        <div className="ol-pdf">
          <iframe src={`${embed.url}#view=FitH`} title={`${embed.label} — ${s.name}`} loading="lazy" />
          <div className="bar"><span>Просмотр PDF: {embed.label}</span><a href={embed.url} target="_blank" rel="noopener">Открыть в новой вкладке ↗</a></div>
        </div>
      )}

      <AdInline slot="mobile" suffix="ex-doc" />

      {taskParas.length > 3 && (
        <section className="ol-text" id="tekst">
          <h2>{d.kind === 'demo' ? `Задания демоверсии ${ex} ${d.year} по ${s.dat} — текст` : d.kind === 'variant' ? 'Задания варианта — текст' : 'Текст документа'}</h2>
          <p className="note">Текст извлечён из официального PDF ФИПИ автоматически: формулы, таблицы и рисунки могут отображаться неточно — сверяйтесь с документом выше.</p>
          {taskParas.map((p, j) => <p key={j}>{p}</p>)}
        </section>
      )}

      <AdInline slot={2} suffix="ex-doc" />

      {answerParas.length > 0 && (
        <section className="ol-text" id="otvety">
          <details>
            <summary>Ответы и критерии оценивания — показать</summary>
            <p className="note">Официальная система оценивания ФИПИ. Сначала решите задания самостоятельно.</p>
            {answerParas.map((p, j) => <p key={j}>{p}</p>)}
          </details>
        </section>
      )}

      {others.map((b, i) => b.paras.length > 3 && (
        <section className="ol-text" key={i}>
          <details>
            <summary>{b.label} — текст</summary>
            {b.paras.map((p, j) => <p key={j}>{p}</p>)}
          </details>
        </section>
      ))}
      {truncated && <p className="ol-text note" style={{ padding: '12px 16px' }}>Показана часть текста. Полная версия — в PDF выше.</p>}

      {sameYear.length > 0 && (
        <section className="gdz-section">
          <div className="gdz-section-head"><h2>{ex} {d.year} по {s.dat} — другие документы</h2></div>
          <div className="ol-stage-block"><div className="rows">
            {sameYear.map(x => <Link key={x.id} href={docPath(x)!}>{KIND_NAME[x.kind]} {x.year}</Link>)}
            {s.tasks && s.tasks.tasks.length > 0 && <Link href={`/${exam}/${s.slug}/#zadaniya`}>Разбор заданий</Link>}
          </div></div>
        </section>
      )}

      {sameKind.length > 0 && (
        <section className="gdz-section">
          <div className="gdz-section-head"><h2>{KIND_PLURAL[d.kind] ?? KIND_NAME[d.kind]} {ex} по {s.dat} — {d.kind === 'nav-topic' ? 'другие темы' : 'другие годы'}</h2></div>
          <div className="ol-stage-block"><div className="rows">
            {sameKind.map(x => <Link key={x.id} href={docPath(x)!}>{yearTitle(x)}{x.year === CURRENT_YEAR && x.kind !== 'nav-topic' ? ' · новая' : ''}</Link>)}
          </div></div>
        </section>
      )}

      {topics.length > 0 && d.kind === 'nav-rec' && (
        <section className="gdz-section">
          <div className="gdz-section-head"><h2>Навигатор ФИПИ: теория по темам</h2></div>
          <div className="ol-theory">{topics.map(x => <Link key={x.id} href={docPath(x)!}>{x.title}</Link>)}</div>
        </section>
      )}

      <AdInline slot={3} suffix="ex-doc" />
    </ExamShell>
  )
}
