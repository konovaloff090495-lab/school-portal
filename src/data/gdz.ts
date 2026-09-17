import { readFileSync } from 'node:fs'
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

export const gdzBookIndex: GdzBookMeta[] = JSON.parse(
  readFileSync(join(DATA_DIR, 'index.json'), 'utf8'),
) as GdzBookMeta[]

// Наружу (списки, sitemap, роуты) идут только книги хотя бы с одним решённым
// номером: книга, у которой ещё только импортирована структура, не светится.
export const gdzBooks: GdzBookMeta[] = gdzBookIndex.filter(b => b.solvedCount > 0)

// Предметы по классам — собираются из реальных книг, bookCount = фактическое число.
export const gdzSubjectsByClass: Record<number, GdzSubject[]> = (() => {
  const out: Record<number, GdzSubject[]> = {}
  for (const n of gdzKlasses) {
    const counts = new Map<string, number>()
    for (const b of gdzBooks) {
      if (b.klass === n) counts.set(b.subjectSlug, (counts.get(b.subjectSlug) ?? 0) + 1)
    }
    out[n] = SUBJECT_CATALOG
      .filter(s => counts.has(s.slug))
      .map(s => ({ ...s, bookCount: counts.get(s.slug)! }))
  }
  return out
})()

// ────────────────────────────────────────────────────
// Ленивая загрузка книг с LRU-кешем
// ────────────────────────────────────────────────────

const CACHE_MAX = 80
const cache = new Map<string, GdzBook>()

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
  return gdzSubjectsByClass[klass] ?? []
}

export function getGdzBooks(klass: number, subjectSlug: string): GdzBookMeta[] {
  return gdzBooks.filter(b => b.klass === klass && b.subjectSlug === subjectSlug)
}

export function getGdzBookMeta(klass: number, subjectSlug: string, bookSlug: string): GdzBookMeta | undefined {
  return gdzBooks.find(b => b.klass === klass && b.subjectSlug === subjectSlug && b.slug === bookSlug)
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
