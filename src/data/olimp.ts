import { readFileSync } from 'node:fs'
import { join } from 'node:path'

// ════════════════════════════════════════════════════
// Раздел «Олимпиады» — архив заданий ВсОШ прошлых лет.
//
// Источник: архив vos.olimpiada.ru (API /api/getTasks), сборка —
// scripts/olimp/build_index.py. Хранилище: src/data/olimp/index.json
// (метаданные всех работ) + src/data/olimp/papers/{id}.json (текст заданий
// и решений, вытащенный pdftotext — читается лениво по запросу).
// Сами PDF лежат в public/olimpiady/pdf/ (gitignored, уезжают rsync'ом public/).
//
// Работа (paper) = предмет × этап × учебный год × группа классов.
// URL: /olimpiady/{subject}/{stage}-{year}/{classSlug}/
// ════════════════════════════════════════════════════

export interface OlimpSubject { slug: string; name: string; dat: string; icon: string; psevdo: string }
export interface OlimpStage { slug: string; name: string; gen: string; order: number }
export interface OlimpFile {
  kind: 'tasks' | 'solutions' | 'video' | 'other'
  group: string
  label: string
  url: string
  ext: string
  size: number
  pages?: number
}
export interface OlimpPaper {
  id: string
  subject: string
  subjectName: string
  subjectDat: string
  icon: string
  stage: string
  stageName: string
  stageGen: string
  year: string        // 2024-2025
  yearLabel: string   // 2024/2025
  classSlug: string   // 9-klass | 7-8-klass
  classLabel: string  // 9 класс | 7–8 классы
  classes: number[]
  files: OlimpFile[]
  tasksPages: number
  hasTasks: boolean
  hasSolutions: boolean
  textChars: number
}
export interface OlimpPaperText {
  id: string
  tasks: { label: string; group: string; paras: string[] }[]
  solutions: { label: string; group: string; paras: string[] }[]
}

const DIR = join(process.cwd(), 'src', 'data', 'olimp')

interface Index { subjects: OlimpSubject[]; stages: OlimpStage[]; papers: OlimpPaper[] }
let _index: Index | null = null
function index(): Index {
  if (!_index) _index = JSON.parse(readFileSync(join(DIR, 'index.json'), 'utf8')) as Index
  return _index
}

// Порядок предметов на хабе — по спросу (Вордстат: математика и русский впереди).
const SUBJECT_ORDER = [
  'matematika', 'russkiy-yazyk', 'angliyskiy-yazyk', 'fizika', 'himiya', 'biologiya', 'istoriya',
  'obshchestvoznanie', 'geografiya', 'literatura', 'informatika', 'ekonomika', 'pravo', 'astronomiya',
  'ekologiya', 'obzh', 'fizkultura', 'mhk', 'nemeckiy-yazyk', 'francuzskiy-yazyk', 'ispanskiy-yazyk',
  'italyanskiy-yazyk', 'kitayskiy-yazyk', 'tehnologiya-kddit', 'tehnologiya-ttitt', 'robototehnika',
  'informacionnaya-bezopasnost', 'iskusstvennyy-intellekt',
]

export function olimpSubjects(): OlimpSubject[] {
  const have = new Set(index().papers.map(p => p.subject))
  return index().subjects
    .filter(s => have.has(s.slug))
    .sort((a, b) => SUBJECT_ORDER.indexOf(a.slug) - SUBJECT_ORDER.indexOf(b.slug))
}
export function olimpStages(): OlimpStage[] {
  return [...index().stages].sort((a, b) => a.order - b.order)
}
export function getOlimpSubject(slug: string): OlimpSubject | undefined {
  return index().subjects.find(s => s.slug === slug)
}
export function getOlimpStage(slug: string): OlimpStage | undefined {
  return index().stages.find(s => s.slug === slug)
}
export function olimpPapers(): OlimpPaper[] { return index().papers }

export function papersBySubject(subject: string): OlimpPaper[] {
  return index().papers.filter(p => p.subject === subject)
}
/** Работы, в которых участвует данный класс (в т. ч. группы «7–8 классы»). */
export function papersByClass(subject: string, klass: number): OlimpPaper[] {
  return papersBySubject(subject).filter(p => p.classes.includes(klass))
}
export function papersByStageYear(subject: string, stage: string, year: string): OlimpPaper[] {
  return papersBySubject(subject).filter(p => p.stage === stage && p.year === year)
}
export function getOlimpPaper(subject: string, stage: string, year: string, classSlug: string): OlimpPaper | undefined {
  return index().papers.find(p => p.subject === subject && p.stage === stage && p.year === year && p.classSlug === classSlug)
}
/** Классы, по которым у предмета есть хоть одна работа (по возрастанию). */
export function classesForSubject(subject: string): number[] {
  const s = new Set<number>()
  for (const p of papersBySubject(subject)) for (const k of p.classes) s.add(k)
  return [...s].sort((a, b) => a - b)
}
/** Уникальные пары этап × год у предмета — по порядку этапа, годы по убыванию. */
export function stageYearsForSubject(subject: string): { stage: OlimpStage; year: string; yearLabel: string; count: number }[] {
  const m = new Map<string, { stage: OlimpStage; year: string; yearLabel: string; count: number }>()
  for (const p of papersBySubject(subject)) {
    const k = `${p.stage}|${p.year}`
    const cur = m.get(k)
    if (cur) cur.count++
    else m.set(k, { stage: getOlimpStage(p.stage)!, year: p.year, yearLabel: p.yearLabel, count: 1 })
  }
  return [...m.values()].sort((a, b) => a.stage.order - b.stage.order || b.year.localeCompare(a.year))
}
export function olimpYears(): string[] {
  return [...new Set(index().papers.map(p => p.year))].sort().reverse()
}

// ── Текст работы: лениво с диска, небольшой кеш ──
const cache = new Map<string, OlimpPaperText>()
export function getOlimpPaperText(id: string): OlimpPaperText | null {
  const hit = cache.get(id)
  if (hit) return hit
  try {
    const t = JSON.parse(readFileSync(join(DIR, 'papers', `${id}.json`), 'utf8')) as OlimpPaperText
    if (cache.size > 200) cache.delete(cache.keys().next().value as string)
    cache.set(id, t)
    return t
  } catch {
    return null
  }
}

// ── Сортировка работ: свежий год выше, дальше по порядку этапа, дальше по классу ──
export function sortPapers(list: OlimpPaper[]): OlimpPaper[] {
  const order = new Map(index().stages.map(s => [s.slug, s.order]))
  return [...list].sort((a, b) =>
    b.year.localeCompare(a.year) || (order.get(a.stage)! - order.get(b.stage)!) || a.classes[0] - b.classes[0])
}

export function olimpUrl(p: OlimpPaper): string {
  return `/olimpiady/${p.subject}/${p.stage}-${p.year}/${p.classSlug}/`
}
export function stageYearUrl(subject: string, stage: string, year: string): string {
  return `/olimpiady/${subject}/${stage}-${year}/`
}
export function classUrl(subject: string, klass: number): string {
  return `/olimpiady/${subject}/${klass}-klass/`
}
export function parseStageYear(sub: string): { stage: string; year: string } | null {
  const m = sub.match(/^([a-z-]+-etap)-(\d{4}-\d{4})$/)
  return m ? { stage: m[1], year: m[2] } : null
}
export function parseKlassSlug(sub: string): number | null {
  const m = sub.match(/^(\d{1,2})-klass$/)
  if (!m) return null
  const n = Number(m[1])
  return n >= 1 && n <= 11 ? n : null
}
export function fmtSize(bytes: number): string {
  if (!bytes) return ''
  return bytes >= 1000 * 1024 ? `${(bytes / 1048576).toFixed(1).replace('.', ',')} МБ` : `${Math.max(1, Math.round(bytes / 1024))} КБ`
}
export function pagesWord(n: number): string {
  const m10 = n % 10, m100 = n % 100
  if (m100 >= 11 && m100 <= 14) return 'страниц'
  if (m10 === 1) return 'страница'
  if (m10 >= 2 && m10 <= 4) return 'страницы'
  return 'страниц'
}

// ── Связь с разделом «Учебник»: какой предмет учебника читать для теории ──
export function textbookSubjectsFor(subject: string, klass: number): string[] {
  switch (subject) {
    case 'matematika': return klass <= 6 ? ['matematika'] : ['algebra', 'geometriya']
    case 'russkiy-yazyk': return ['russkiy-yazyk']
    case 'angliyskiy-yazyk': return ['angliiskiy-yazyk']
    case 'fizika': return ['fizika']
    case 'himiya': return ['khimiya']
    case 'biologiya': return ['biologiya']
    case 'istoriya': return ['istoriya']
    case 'obshchestvoznanie': return ['obshchestvoznanie']
    case 'geografiya': return ['geografiya']
    case 'literatura': return ['literatura']
    case 'informatika': return ['informatika']
    default: return []
  }
}
