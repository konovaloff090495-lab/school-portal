import type { Metadata } from 'next'
import Link from 'next/link'
import ExamShell, { AdInline, Crumbs, breadcrumbLd } from '@/components/exam/ExamShell'
import { type Exam, type SiteSubject, docsFor, docPath, EXAM_NAME, CURRENT_YEAR } from '@/data/exam'
import type { ExamTask } from '@/data/ege-oge'

const SITE = 'https://pro-schools.ru'

export function taskMetadata(exam: Exam, s: SiteSubject, t: ExamTask): Metadata {
  const ex = EXAM_NAME[exam]
  return {
    title: `${t.title} ${ex} по ${s.dat}: ${t.shortDesc.toLowerCase()} — разбор, теория, тренажёр`,
    description: `Разбор задания ${t.number} ${ex} по ${s.dat}: что проверяет, какие темы нужно знать, примеры с решением и задания для тренировки. Максимальный балл — ${t.maxScore}. Плюс демоверсия ${CURRENT_YEAR} и кодификатор ФИПИ.`,
    keywords: `задание ${t.number} ${ex.toLowerCase()} ${s.short.toLowerCase()}, ${t.shortDesc.toLowerCase()} ${ex.toLowerCase()}, ${t.number} задание ${ex.toLowerCase()} по ${s.dat}`,
    alternates: { canonical: `${SITE}/${exam}/${s.slug}/${t.slug}/` },
  }
}

export default function ExamTaskPage({ exam, s, t }: { exam: Exam; s: SiteSubject; t: ExamTask }) {
  const ex = EXAM_NAME[exam]
  const tasks = s.tasks?.tasks ?? []
  const i = tasks.findIndex(x => x.slug === t.slug)
  const prev = i > 0 ? tasks[i - 1] : null, next = i < tasks.length - 1 ? tasks[i + 1] : null
  const demo = docsFor(exam, s, 'demo').find(d => d.year === CURRENT_YEAR)
  const codif = docsFor(exam, s, 'codif').find(d => d.year === CURRENT_YEAR)
  const topics = docsFor(exam, s, 'nav-topic').filter(d => docPath(d)).slice(0, 8)
  const ld = [breadcrumbLd([{ name: 'Главная', href: '/' }, { name: ex, href: `/${exam}/` }, { name: s.name, href: `/${exam}/${s.slug}/` }, { name: t.title, href: `/${exam}/${s.slug}/${t.slug}/` }])]
  return (
    <ExamShell exam={exam} suffix="ex-task" ld={ld} active={s.slug} railExtra={
      <div className="ol-rail-box">
        <h3>Все задания {ex} по {s.dat}</h3>
        <div className="ol-rail-list">{tasks.map(x => <Link key={x.slug} href={`/${exam}/${s.slug}/${x.slug}/`} className={x.slug === t.slug ? 'active' : ''}>{x.title} · {x.shortDesc}</Link>)}</div>
      </div>
    }>
      <Crumbs items={[{ name: 'Главная', href: '/' }, { name: ex, href: `/${exam}/` }, { name: s.name, href: `/${exam}/${s.slug}/` }, { name: t.title }]} />
      <div className="gdz-pagehead">
        <div className="gdz-eyebrow"><span className="dot"></span>{s.icon} {ex} · {s.name} · до {t.maxScore} {t.maxScore === 1 ? 'балла' : 'баллов'}</div>
        <h1>{t.title} {ex} по {s.dat}: {t.shortDesc.toLowerCase()}</h1>
      </div>
      <AdInline slot="mobile" suffix="ex-task" />
      <section className="ol-text ol-seo ol-guide" dangerouslySetInnerHTML={{ __html: t.content }} />
      <AdInline slot={2} suffix="ex-task" />
      <section className="gdz-section">
        <div className="gdz-section-head"><h2>Официальные материалы ФИПИ к заданию</h2></div>
        <div className="ol-stage-block"><div className="rows">
          {demo && <Link href={docPath(demo)!}>Демоверсия {ex} {demo.year} по {s.dat}</Link>}
          {codif && <Link href={docPath(codif)!}>Кодификатор {codif.year}</Link>}
          {topics.map(d => <Link key={d.id} href={docPath(d)!}>{d.title}</Link>)}
        </div></div>
      </section>
      <div className="ol-stage-block"><div className="rows">
        {prev && <Link href={`/${exam}/${s.slug}/${prev.slug}/`}>← {prev.title}: {prev.shortDesc}</Link>}
        {next && <Link href={`/${exam}/${s.slug}/${next.slug}/`}>{next.title}: {next.shortDesc} →</Link>}
      </div></div>
      <AdInline slot={3} suffix="ex-task" />
    </ExamShell>
  )
}
