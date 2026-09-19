import { readFileSync, statSync } from 'node:fs'
import { join } from 'node:path'

// ════════════════════════════════════════════════════
// GDZ Data — готовые домашние задания
//
// Хранилище: src/data/gdz-books/index.json (метаданные книг, без задач) +
// по одному JSON на книгу ({klass}-{subject}-{slug}.json). Индекс читается
// один раз при старте, книги — лениво с диска по запросу и кешируются (LRU),
// чтобы при сотнях книг и сотнях тысяч номеров процесс не держал всё в памяти.
// Правки данных: scripts/gdz_lib.py (save_book пересобирает index.json).
// ════════════════════════════════════════════════════

export interface GdzSubject {
  slug: string
  name: string
  icon: string
  bookCount: number
}

export interface GdzBookMeta {
  slug: string
  klass: number
  subjectSlug: string
  subject: string
  authors: string
  type: string
  years: string
  publisher: string
  fgos: boolean
  parts: string
  source?: string
  file: string
  problemCount: number
  solvedCount: number
  chapterCount: number
}

export interface GdzBook {
  slug: string
  klass: number
  subjectSlug: string
  subject: string
  authors: string
  type: string
  years: string
  publisher: string
  fgos: boolean
  parts: string
  chapters: GdzChapter[]
}

export interface GdzChapter {
  title: string
  problems: GdzProblem[]
}

export interface GdzProblem {
  number: string
  page: number
  condition?: string
  steps?: string[]
  formulas?: string[]
  answer?: string
  imageUrls?: string[]
}

// Критерий «у номера есть решение» — единый для страницы номера и sitemap.
export function hasGdzSolution(p: GdzProblem): boolean {
  return !!(p.condition && (p.steps?.length || p.imageUrls?.length))
}

// ────────────────────────────────────────────────────
// Справочник предметов: название и иконка по slug.
// Порядок массива = порядок вывода на страницах класса.
// ────────────────────────────────────────────────────

const SUBJECT_CATALOG: { slug: string; name: string; icon: string }[] = [
  { slug: 'matematika', name: 'Математика', icon: '🔢' },
  { slug: 'algebra', name: 'Алгебра', icon: '📐' },
  { slug: 'algebra-nachala-analiza', name: 'Алгебра и начала анализа', icon: '∫' },
  { slug: 'geometriya', name: 'Геометрия', icon: '📏' },
  { slug: 'russkiy-yazyk', name: 'Русский язык', icon: '📖' },
  { slug: 'angliiskiy-yazyk', name: 'Английский язык', icon: '🇬🇧' },
  { slug: 'nemetskiy-yazyk', name: 'Немецкий язык', icon: '🇩🇪' },
  { slug: 'fizika', name: 'Физика', icon: '⚛️' },
  { slug: 'khimiya', name: 'Химия', icon: '🧪' },
  { slug: 'biologiya', name: 'Биология', icon: '🧬' },
  { slug: 'istoriya', name: 'История', icon: '🏛️' },
  { slug: 'obshchestvoznanie', name: 'Обществознание', icon: '⚖️' },
  { slug: 'geografiya', name: 'География', icon: '🗺️' },
  { slug: 'literatura', name: 'Литература', icon: '📕' },
  { slug: 'literaturnoe-chtenie', name: 'Литературное чтение', icon: '📚' },
  { slug: 'okruzhayushchiy-mir', name: 'Окружающий мир', icon: '🌍' },
  { slug: 'informatika', name: 'Информатика', icon: '💻' },
  { slug: 'obzh', name: 'ОБЖ', icon: '🛡️' },
  { slug: 'izo', name: 'ИЗО', icon: '🎨' },
  { slug: 'muzyka', name: 'Музыка', icon: '🎵' },
]

export const gdzKlasses = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11]

// ────────────────────────────────────────────────────
// Индекс книг (лёгкий) — читается при старте процесса
// ────────────────────────────────────────────────────

const DATA_DIR = join(process.cwd(), 'src/data/gdz-books')
const cache = new Map<string, GdzBook>()

// Индекс перечитывается, когда index.json меняется на диске (git pull новых
// решений без рестарта процесса): stat дешёвый, парсинг — только при изменении.
let indexMtime = 0
let indexAll: GdzBookMeta[] = []
let indexVisible: GdzBookMeta[] = []
let subjectsByClass: Record<number, GdzSubject[]> = {}

function refreshIndex(): void {
  const mtime = statSync(join(DATA_DIR, 'index.json')).mtimeMs
  if (mtime === indexMtime) return
  indexMtime = mtime
  indexAll = JSON.parse(readFileSync(join(DATA_DIR, 'index.json'), 'utf8')) as GdzBookMeta[]
  // Наружу (списки, sitemap, роуты) идут только книги хотя бы с одним решённым
  // номером: книга, у которой ещё только импортирована структура, не светится.
  indexVisible = indexAll.filter(b => b.solvedCount > 0)
  const out: Record<number, GdzSubject[]> = {}
  for (const n of gdzKlasses) {
    const counts = new Map<string, number>()
    for (const b of indexVisible) {
      if (b.klass === n) counts.set(b.subjectSlug, (counts.get(b.subjectSlug) ?? 0) + 1)
    }
    out[n] = SUBJECT_CATALOG
      .filter(s => counts.has(s.slug))
      .map(s => ({ ...s, bookCount: counts.get(s.slug)! }))
  }
  subjectsByClass = out
  cache.clear()
}

export function getGdzBookIndex(): GdzBookMeta[] {
  refreshIndex()
  return indexAll
}

export function getAllGdzBooks(): GdzBookMeta[] {
  refreshIndex()
  return indexVisible
}

// Предметы по классам — собираются из реальных книг, bookCount = фактическое число.
export function getGdzSubjectsByClass(): Record<number, GdzSubject[]> {
  refreshIndex()
  return subjectsByClass
}

// ────────────────────────────────────────────────────
// Ленивая загрузка книг с LRU-кешем
// ────────────────────────────────────────────────────

const CACHE_MAX = 80

function readBook(meta: GdzBookMeta): GdzBook {
  const hit = cache.get(meta.file)
  if (hit) {
    // обновляем «свежесть»: Map хранит порядок вставки
    cache.delete(meta.file)
    cache.set(meta.file, hit)
    return hit
  }
  const book = JSON.parse(readFileSync(join(DATA_DIR, meta.file), 'utf8')) as GdzBook
  cache.set(meta.file, book)
  if (cache.size > CACHE_MAX) {
    const oldest = cache.keys().next().value
    if (oldest) cache.delete(oldest)
  }
  return book
}

// ────────────────────────────────────────────────────
// Helper functions
// ────────────────────────────────────────────────────

export function getGdzSubjects(klass: number): GdzSubject[] {
  return getGdzSubjectsByClass()[klass] ?? []
}

export function getGdzBooks(klass: number, subjectSlug: string): GdzBookMeta[] {
  return getAllGdzBooks().filter(b => b.klass === klass && b.subjectSlug === subjectSlug)
}

export function getGdzBookMeta(klass: number, subjectSlug: string, bookSlug: string): GdzBookMeta | undefined {
  return getAllGdzBooks().find(b => b.klass === klass && b.subjectSlug === subjectSlug && b.slug === bookSlug)
}

export function getGdzBook(klass: number, subjectSlug: string, bookSlug: string): GdzBook | undefined {
  const meta = getGdzBookMeta(klass, subjectSlug, bookSlug)
  return meta ? readBook(meta) : undefined
}

export function loadGdzBook(meta: GdzBookMeta): GdzBook {
  return readBook(meta)
}

export function getGdzAllProblems(book: GdzBook): GdzProblem[] {
  return book.chapters.flatMap(ch => ch.problems)
}

export function getGdzProblem(book: GdzBook, number: string): GdzProblem | undefined {
  return getGdzAllProblems(book).find(p => p.number === number)
}

export function getGdzPrevNext(book: GdzBook, number: string): { prev: string | null; next: string | null } {
  const all = getGdzAllProblems(book)
  const idx = all.findIndex(p => p.number === number)
  if (idx === -1) return { prev: null, next: null }
  return {
    prev: idx > 0 ? all[idx - 1].number : null,
    next: idx < all.length - 1 ? all[idx + 1].number : null,
  }
}

export function getGdzProblemChapter(book: GdzBook, number: string): GdzChapter | undefined {
  return book.chapters.find(ch => ch.problems.some(p => p.number === number))
}

// Номер задачи → URL-безопасный slug (точка в номере кодируется дефисом)
export function gdzNumToSlug(n: string): string {
  return n.replace(/\./g, '-')
}

// Человеческая подпись номера: в рабочих тетрадях номера повторяются на разных
// страницах, поэтому ключ «6-s12» = номер 6 на странице 12.
export function gdzNumLabel(n: string): string {
  const m = n.match(/^(.+?)-s(\d+)(?:-\d+)?$/)
  if (m) return `${m[1]} (с. ${m[2]})`
  // Книги с вопросами после параграфов (химия/история/география): p12-3, lab-5, pr-2, t3-1
  let q = n.match(/^p(\d+)-(\d+)$/)
  if (q) return q[1] === '0' ? `Введение, вопрос ${q[2]}` : `§ ${q[1]}, вопрос ${q[2]}`
  q = n.match(/^p(\d+)-dop(\d*)(?:-(\d+))?$/)
  if (q) return q[3] ? `§ ${q[1]}, доп. материал ${q[2]}, задание ${q[3]}` : `§ ${q[1]}, доп. задание${q[2] ? ' ' + q[2] : ''}`
  q = n.match(/^itogi(\d+)-(\d+)$/)
  if (q) return q[1] === '0' ? `Итоговые вопросы, задание ${q[2]}` : `Итоги главы ${q[1]}, вопрос ${q[2]}`
  q = n.match(/^p(\d+)-lab(\d*)$/)
  if (q) return `§ ${q[1]}, лабораторный опыт${q[2] ? ' ' + q[2] : ''}`
  q = n.match(/^p(\d+)-test(\d*)$/)
  if (q) return `§ ${q[1]}, тест${q[2] ? ' ' + q[2] : 'овые задания'}`
  q = n.match(/^lab-(\d+)$/)
  if (q) return `Лабораторная работа ${q[1]}`
  // Физика (Пёрышкин): upr7-4 = упражнение 7, задание 4; zad-37 = задание к § 37; povtor-12 = задача для повторения
  q = n.match(/^upr(\d+)-(\d+)$/)
  if (q) return `Упражнение ${q[1]}, задание ${q[2]}`
  q = n.match(/^zad-(\d+)$/)
  if (q) return `§ ${q[1]}, задание`
  q = n.match(/^povtor-(\d+)$/)
  if (q) return `Задача для повторения ${q[1]}`
  q = n.match(/^pr-(\d+)$/)
  if (q) return `Практическая работа ${q[1]}`
  q = n.match(/^t(\d+)-(\d+)$/)
  if (q) return q[1] === '0' ? `Введение, тема ${q[2]}` : `Глава ${q[1]}, тема ${q[2]}`
  return n
}
