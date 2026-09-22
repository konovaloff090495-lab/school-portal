import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { type Exam, siteSubjects, getSiteSubject, docsFor, docSlug, findDocBySlug } from '@/data/exam'
import ExamHubPage, { hubMetadata } from '@/components/exam/ExamHubPage'
import ExamSubjectPage, { subjectMetadata } from '@/components/exam/ExamSubjectPage'
import ExamDocPage, { docMetadata } from '@/components/exam/ExamDocPage'
import ExamTaskPage, { taskMetadata } from '@/components/exam/ExamTaskPage'
import ExamSpecialPage, { specialPages, getSpecial, specialMetadata } from '@/components/exam/special'

/**
 * Общая логика роутов /ege/… и /oge/…: файлы в src/app/{ege,oge}/ только делегируют сюда.
 *   /{exam}/                       — хаб
 *   /{exam}/{subject}/             — предмет  |  /{exam}/{special}/ — кросс-предметная страница
 *   /{exam}/{subject}/{doc|task}/  — документ ФИПИ (demoversiya-2027 …) или разбор задания (zadanie-N)
 */
export function subjectParams(exam: Exam) {
  return [...siteSubjects(exam).map(s => ({ subject: s.slug })), ...specialPages(exam).map(p => ({ subject: p.slug }))]
}
export function docParams(exam: Exam) {
  const out: { subject: string; task: string }[] = []
  for (const s of siteSubjects(exam)) {
    for (const d of docsFor(exam, s)) { const sl = docSlug(d); if (sl) out.push({ subject: s.slug, task: sl }) }
    for (const t of s.tasks?.tasks ?? []) out.push({ subject: s.slug, task: t.slug })
  }
  return [...new Map(out.map(x => [`${x.subject}/${x.task}`, x])).values()]
}

export function HubRoute({ exam }: { exam: Exam }) { return <ExamHubPage exam={exam} /> }
export function hubMeta(exam: Exam): Metadata { return hubMetadata(exam) }

export function subjectMeta(exam: Exam, subject: string): Metadata {
  const s = getSiteSubject(exam, subject)
  if (s) return subjectMetadata(exam, s)
  const p = getSpecial(exam, subject)
  return p ? specialMetadata(exam, p) : {}
}
export function SubjectRoute({ exam, subject }: { exam: Exam; subject: string }) {
  const s = getSiteSubject(exam, subject)
  if (s) return <ExamSubjectPage exam={exam} s={s} />
  const p = getSpecial(exam, subject)
  if (p) return <ExamSpecialPage exam={exam} p={p} />
  notFound()
}

export function docMeta(exam: Exam, subject: string, task: string): Metadata {
  const s = getSiteSubject(exam, subject)
  if (!s) return {}
  const d = findDocBySlug(exam, s, task)
  if (d) return docMetadata(exam, s, d)
  const t = s.tasks?.tasks.find(x => x.slug === task)
  return t ? taskMetadata(exam, s, t) : {}
}
export function DocRoute({ exam, subject, task }: { exam: Exam; subject: string; task: string }) {
  const s = getSiteSubject(exam, subject)
  if (!s) notFound()
  const d = findDocBySlug(exam, s, task)
  if (d) return <ExamDocPage exam={exam} s={s} d={d} />
  const t = s.tasks?.tasks.find(x => x.slug === task)
  if (t) return <ExamTaskPage exam={exam} s={s} t={t} />
  notFound()
}
