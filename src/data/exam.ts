import { readFileSync, existsSync } from 'node:fs'
import { join } from 'node:path'
import { egeSubjects, ogeSubjects, type ExamSubject as TaskSubject } from '@/data/ege-oge'

// ════════════════════════════════════════════════════
// Раздел «ЕГЭ и ОГЭ» — официальные материалы ФИПИ.
//
// Источник: fipi.ru (демоверсии/спецификации/кодификаторы 2016–2027, открытые
// варианты КИМ, методические рекомендации по итогам года, навигатор
// самостоятельной подготовки, материалы для предметных комиссий, итоговое
// сочинение/собеседование). Сборка — scripts/ege/fetch_fipi.py → build_index.py.
// Хранилище: src/data/exam/index.json (метаданные) + src/data/exam/texts/{id}.json
// (текст PDF абзацами, читается лениво). PDF — public/fipi/ (gitignored, rsync public/).
//
// URL: /{ege|oge}/{subject}/{docSlug}/ — см. docPath().
// ════════════════════════════════════════════════════

export type Exam = 'ege' | 'oge'
export type DocKind = 'demo' | 'spec' | 'codif' | 'variant' | 'mr' | 'nav-rec' | 'nav-topic' | 'criteria' | 'doc' | 'sochinenie' | 'sobesedovanie' | 'izmeneniya' | 'scale'

export interface ExamFile { label: string; role: string; url: string; ext: string; size: number; pages?: number }
export interface ExamDoc {
  id: string
  exam: Exam
  subject: string | null       // slug ФИПИ (matematika — без уровня)
  kind: DocKind
  year: number | null
  level: 'base' | 'prof' | null
  title: string | null
  files: ExamFile[]
  chars: number
  pages: number
  summary?: { tasks?: number; duration?: string; minutes?: number; maxPrimary?: number; changes?: string[] }
  /** Для методических рекомендаций: факты о результатах экзамена (средний балл, участники, цитаты ФИПИ). */
  stats?: { avg?: number; participants?: string; belowMin?: string; excerpt?: string[] }
  /** Шкала перевода первичных баллов в отметки (ОГЭ, из письма Рособрнадзора). */
  scale?: { subject: string; name: string; max: number; marks: Record<'2' | '3' | '4' | '5', [number, number]>; profile: number | null }[]
  /** Исходный архив на doc.fipi.ru (в нём же доп. файлы к заданиям и аудио других языков). */
  source?: string | null
}
export interface FipiSubject { slug: string; name: string; dat: string; icon: string; ege: boolean; oge: boolean }
export interface ExamText { id: string; texts: { label: string; role: string; paras: string[] }[] }

/** Предмет раздела на сайте: slug страницы + предмет ФИПИ (+ уровень для математики ЕГЭ). */
export interface SiteSubject {
  slug: string          // /ege/matematika-profilnaya/
  fipi: string          // matematika
  level: 'base' | 'prof' | null
  name: string          // Математика (профиль)
  short: string
  dat: string           // «по …»: профильной математике
  icon: string
  klass: 9 | 11
  tasks: TaskSubject | null   // разборы заданий из ege-oge.ts (если есть)
}

const DIR = join(process.cwd(), 'src', 'data', 'exam')
interface Index { subjects: FipiSubject[]; docs: ExamDoc[] }
let _index: Index | null = null
function index(): Index {
  if (!_index) _index = JSON.parse(readFileSync(join(DIR, 'index.json'), 'utf8')) as Index
  return _index
}

export const EXAM_NAME: Record<Exam, string> = { ege: 'ЕГЭ', oge: 'ОГЭ' }
export const EXAM_FULL: Record<Exam, string> = { ege: 'Единый государственный экзамен', oge: 'Основной государственный экзамен' }
export const EXAM_CLASS: Record<Exam, 9 | 11> = { ege: 11, oge: 9 }
/** Текущий экзаменационный год (демоверсии выходят в конце августа). */
export const CURRENT_YEAR = 2027
export const PREV_YEAR = CURRENT_YEAR - 1

const SITE_SUBJECTS: Record<Exam, { slug: string; fipi: string; level?: 'base' | 'prof'; name?: string; short?: string; dat?: string }[]> = {
  ege: [
    { slug: 'matematika-profilnaya', fipi: 'matematika', level: 'prof', name: 'Математика (профиль)', short: 'Математика профиль', dat: 'профильной математике' },
    { slug: 'matematika-bazovaya', fipi: 'matematika', level: 'base', name: 'Математика (база)', short: 'Математика база', dat: 'базовой математике' },
    { slug: 'russkiy-yazyk', fipi: 'russkiy-yazyk' },
    { slug: 'obshchestvoznanie', fipi: 'obshchestvoznanie' },
    { slug: 'fizika', fipi: 'fizika' },
    { slug: 'biologiya', fipi: 'biologiya' },
    { slug: 'istoriya', fipi: 'istoriya' },
    { slug: 'informatika', fipi: 'informatika' },
    { slug: 'khimiya', fipi: 'khimiya' },
    { slug: 'angliiskiy-yazyk', fipi: 'angliiskiy-yazyk' },
    { slug: 'literatura', fipi: 'literatura' },
    { slug: 'geografiya', fipi: 'geografiya' },
    { slug: 'nemetskiy-yazyk', fipi: 'nemetskiy-yazyk' },
    { slug: 'frantsuzskiy-yazyk', fipi: 'frantsuzskiy-yazyk' },
    { slug: 'ispanskiy-yazyk', fipi: 'ispanskiy-yazyk' },
    { slug: 'kitayskiy-yazyk', fipi: 'kitayskiy-yazyk' },
  ],
  oge: [
    { slug: 'matematika', fipi: 'matematika' },
    { slug: 'russkiy-yazyk', fipi: 'russkiy-yazyk' },
    { slug: 'obshchestvoznanie', fipi: 'obshchestvoznanie' },
    { slug: 'fizika', fipi: 'fizika' },
    { slug: 'biologiya', fipi: 'biologiya' },
    { slug: 'istoriya', fipi: 'istoriya' },
    { slug: 'informatika', fipi: 'informatika' },
    { slug: 'khimiya', fipi: 'khimiya' },
    { slug: 'angliiskiy-yazyk', fipi: 'angliiskiy-yazyk' },
    { slug: 'literatura', fipi: 'literatura' },
    { slug: 'geografiya', fipi: 'geografiya' },
    { slug: 'nemetskiy-yazyk', fipi: 'nemetskiy-yazyk' },
    { slug: 'frantsuzskiy-yazyk', fipi: 'frantsuzskiy-yazyk' },
    { slug: 'ispanskiy-yazyk', fipi: 'ispanskiy-yazyk' },
  ],
}

let _site: Record<Exam, SiteSubject[]> | null = null
export function siteSubjects(exam: Exam): SiteSubject[] {
  if (!_site) {
    _site = { ege: [], oge: [] }
    for (const ex of ['ege', 'oge'] as Exam[]) {
      const taskList = ex === 'ege' ? egeSubjects : ogeSubjects
      for (const s of SITE_SUBJECTS[ex]) {
        const f = index().subjects.find(x => x.slug === s.fipi)
        if (!f || !f[ex]) continue
        _site[ex].push({
          slug: s.slug, fipi: s.fipi, level: s.level ?? null,
          name: s.name ?? f.name, short: s.short ?? f.name, dat: s.dat ?? f.dat, icon: f.icon, klass: EXAM_CLASS[ex],
          tasks: taskList.find(t => t.slug === s.slug) ?? null,
        })
      }
    }
  }
  return _site[exam]
}
export function getSiteSubject(exam: Exam, slug: string): SiteSubject | undefined {
  return siteSubjects(exam).find(s => s.slug === slug)
}

export function allDocs(): ExamDoc[] { return index().docs }
export function getDoc(id: string): ExamDoc | undefined { return index().docs.find(d => d.id === id) }
export function getDocText(id: string): ExamText | null {
  const p = join(DIR, 'texts', `${id}.json`)
  if (!existsSync(p)) return null
  return JSON.parse(readFileSync(p, 'utf8')) as ExamText
}

/** Документы предмета сайта: для математики ЕГЭ — свой уровень + общие (без уровня, напр. кодификатор). */
export function docsFor(exam: Exam, s: SiteSubject, kind?: DocKind): ExamDoc[] {
  return index().docs.filter(d => d.exam === exam && d.subject === s.fipi && (!kind || d.kind === kind) && (s.level === null || d.level === null || d.level === s.level))
}
export function docsByKind(exam: Exam, kind: DocKind, year?: number | null): ExamDoc[] {
  return index().docs.filter(d => d.exam === exam && d.kind === kind && (year === undefined || d.year === year))
}
export function yearsOf(exam: Exam, kind: DocKind): number[] {
  return [...new Set(index().docs.filter(d => d.exam === exam && d.kind === kind && d.year).map(d => d.year as number))].sort((a, b) => b - a)
}

const KIND_SLUG: Record<string, string> = {
  demo: 'demoversiya', spec: 'specifikaciya', codif: 'kodifikator', variant: 'varianty', mr: 'metodicheskie-rekomendacii',
  'nav-rec': 'rekomendacii-fipi', criteria: 'kriterii-ocenivaniya',
}
export const KIND_NAME: Record<string, string> = {
  demo: 'Демоверсия', spec: 'Спецификация', codif: 'Кодификатор', variant: 'Открытый вариант КИМ', mr: 'Методические рекомендации',
  'nav-rec': 'Рекомендации ФИПИ по самоподготовке', 'nav-topic': 'Навигатор подготовки', criteria: 'Критерии оценивания', doc: 'Нормативные документы',
  sochinenie: 'Итоговое сочинение', sobesedovanie: 'Итоговое собеседование', izmeneniya: 'Изменения в КИМ', scale: 'Шкала перевода баллов',
}
export const KIND_PLURAL: Record<string, string> = {
  demo: 'Демоверсии', spec: 'Спецификации', codif: 'Кодификаторы', variant: 'Открытые варианты КИМ', mr: 'Методические рекомендации по итогам экзамена',
  'nav-rec': 'Рекомендации ФИПИ по самостоятельной подготовке', 'nav-topic': 'Навигатор подготовки — теория по темам', criteria: 'Критерии оценивания (материалы для экспертов)',
}

/** slug документа внутри страницы предмета (второй уровень URL). */
export function docSlug(d: ExamDoc): string | null {
  if (d.kind === 'nav-topic') return `navigator-${d.id.split(`-${d.year ?? 'na'}-`).pop()?.replace(/^(base|prof)-/, '') ?? ''}`
  const k = KIND_SLUG[d.kind]
  if (!k || !d.year) return null
  return `${k}-${d.year}`
}
/** Полный путь документа на сайте (для предметных документов) или null для общих. */
export function docPath(d: ExamDoc): string | null {
  if (!d.subject) return null
  const subs = siteSubjects(d.exam).filter(s => s.fipi === d.subject && (d.level === null || s.level === d.level))
  const s = subs[0]
  if (!s) return null
  const slug = docSlug(d)
  return slug ? `/${d.exam}/${s.slug}/${slug}/` : null
}
export function findDocBySlug(exam: Exam, s: SiteSubject, slug: string): ExamDoc | undefined {
  return docsFor(exam, s).find(d => docSlug(d) === slug)
}
/** Заголовок документа для карточек и title. */
export function docTitle(d: ExamDoc, s?: SiteSubject): string {
  const subj = s ? s.dat : (index().subjects.find(x => x.slug === d.subject)?.dat ?? '')
  const ex = EXAM_NAME[d.exam]
  switch (d.kind) {
    case 'demo': return `Демоверсия ${ex} ${d.year} по ${subj}`
    case 'spec': return `Спецификация ${ex} ${d.year} по ${subj}`
    case 'codif': return `Кодификатор ${ex} ${d.year} по ${subj}`
    case 'variant': return `Открытый вариант ${ex} ${d.year} по ${subj} (досрочный период)`
    case 'mr': return `Методические рекомендации ФИПИ по ${subj}: анализ ${ex} ${d.year}`
    case 'nav-rec': return `Рекомендации ФИПИ по самостоятельной подготовке к ${ex} по ${subj} (${d.year})`
    case 'nav-topic': return `${d.title} — теория для ${ex} по ${subj}`
    case 'criteria': return `Критерии оценивания ${ex} ${d.year} по ${subj}: материалы для экспертов`
    default: return d.title ?? `${KIND_NAME[d.kind]} ${ex}`
  }
}

export function fmtSize(b: number): string {
  if (b >= 1024 * 1024) return `${(b / 1024 / 1024).toFixed(1).replace('.', ',')} МБ`
  return `${Math.max(1, Math.round(b / 1024))} КБ`
}
export function pagesWord(n: number): string {
  const m10 = n % 10, m100 = n % 100
  if (m100 >= 11 && m100 <= 14) return 'страниц'
  if (m10 === 1) return 'страница'
  if (m10 >= 2 && m10 <= 4) return 'страницы'
  return 'страниц'
}
export function minutesLabel(min: number): string {
  const h = Math.floor(min / 60), m = min % 60
  return m ? `${h} ч ${m} мин` : `${h} ч`
}

/** Сводка по актуальной спецификации предмета (число заданий, время, первичный балл). */
export function currentSummary(exam: Exam, s: SiteSubject) {
  const spec = docsFor(exam, s, 'spec').find(d => d.year === CURRENT_YEAR) ?? docsFor(exam, s, 'spec')[0]
  const demo = docsFor(exam, s, 'demo').find(d => d.year === CURRENT_YEAR)
  return { ...(demo?.summary ?? {}), ...(spec?.summary ?? {}), year: spec?.year ?? demo?.year ?? null }
}
