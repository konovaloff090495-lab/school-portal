import { readFileSync } from 'node:fs'
import { join } from 'node:path'

// ════════════════════════════════════════════════════
// GDZ Data — готовые домашние задания
// ════════════════════════════════════════════════════

export interface GdzSubject {
  slug: string
  name: string
  icon: string
  bookCount: number
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
  chapters: GdzChapter[  ]
}

export interface GdzChapter {
  title: string
  problems: GdzProblem[  ]
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

// ────────────────────────────────────────────────────
// Subjects by class
// ────────────────────────────────────────────────────

export const gdzKlasses = [ 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11 ]

const subjectsBase14: GdzSubject[  ] = [ { slug: 'matematika', name: 'Математика', icon: '🔢', bookCount: 20 },
  { slug: 'russkiy-yazyk', name: 'Русский язык', icon: '📖', bookCount: 18 },
  { slug: 'okruzhayushchiy-mir', name: 'Окружающий мир', icon: '🌍', bookCount: 12 },
  { slug: 'angliiskiy-yazyk', name: 'Английский язык', icon: '🇬🇧', bookCount: 15 },
  { slug: 'literaturnoe-chtenie', name: 'Литературное чтение', icon: '📚', bookCount: 10 } ]

const subjectsGrade56extra: GdzSubject[  ] = [ { slug: 'biologiya', name: 'Биология', icon: '🧬', bookCount: 1 },
  { slug: 'istoriya', name: 'История', icon: '🏛️', bookCount: 14 },
  { slug: 'obshchestvoznanie', name: 'Обществознание', icon: '⚖️', bookCount: 8 },
  { slug: 'nemetskiy-yazyk', name: 'Немецкий язык', icon: '🇩🇪', bookCount: 7 },
  { slug: 'informatika', name: 'Информатика', icon: '💻', bookCount: 6 },
  { slug: 'izo', name: 'ИЗО', icon: '🎨', bookCount: 5 },
  { slug: 'muzyka', name: 'Музыка', icon: '🎵', bookCount: 4 },
  { slug: 'geografiya', name: 'География', icon: '🗺️', bookCount: 9 },
  { slug: 'literatura', name: 'Литература', icon: '📕', bookCount: 11 } ]

const subjectsGrade79extra: GdzSubject[  ] = [ { slug: 'algebra', name: 'Алгебра', icon: '📐', bookCount: 22 },
  { slug: 'geometriya', name: 'Геометрия', icon: '📏', bookCount: 16 },
  { slug: 'fizika', name: 'Физика', icon: '⚛️', bookCount: 15 },
  { slug: 'khimiya', name: 'Химия', icon: '🧪', bookCount: 12 },
  { slug: 'obzh', name: 'ОБЖ', icon: '🛡️', bookCount: 6 } ]

const subjectsGrade1011extra: GdzSubject[  ] = [ { slug: 'algebra-nachala-analiza', name: 'Алгебра и начала анализа', icon: '∫', bookCount: 18 } ]

function makeGrade14(n: number): GdzSubject[  ] {
  return subjectsBase14.map(s => ({
    ...s,
    bookCount: s.bookCount - Math.abs(n - 3),
  }))
}

function makeGrade56(): GdzSubject[  ] {
  const base = subjectsBase14.map(s => ({ ...s }))
  return [ ...base, ...subjectsGrade56extra ]
}

function makeGrade79(): GdzSubject[  ] {
  // Replace Математика with Алгебра + Геометрия; keep Russian, English
  const base = subjectsBase14
    .filter(s => s.slug !== 'matematika' && s.slug !== 'okruzhayushchiy-mir' && s.slug !== 'literaturnoe-chtenie')
    .map(s => ({ ...s }))
  return [ ...subjectsGrade79extra,
    ...base,
    ...subjectsGrade56extra ]
}

function makeGrade1011(): GdzSubject[  ] {
  return [ ...subjectsGrade1011extra,
    { slug: 'algebra', name: 'Алгебра', icon: '📐', bookCount: 18 },
    { slug: 'geometriya', name: 'Геометрия', icon: '📏', bookCount: 14 },
    { slug: 'russkiy-yazyk', name: 'Русский язык', icon: '📖', bookCount: 16 },
    { slug: 'literatura', name: 'Литература', icon: '📕', bookCount: 12 },
    { slug: 'fizika', name: 'Физика', icon: '⚛️', bookCount: 14 },
    { slug: 'khimiya', name: 'Химия', icon: '🧪', bookCount: 10 },
    { slug: 'biologiya', name: 'Биология', icon: '🧬', bookCount: 1 },
    { slug: 'angliiskiy-yazyk', name: 'Английский язык', icon: '🇬🇧', bookCount: 18 },
    { slug: 'istoriya', name: 'История', icon: '🏛️', bookCount: 11 },
    { slug: 'obshchestvoznanie', name: 'Обществознание', icon: '⚖️', bookCount: 7 },
    { slug: 'informatika', name: 'Информатика', icon: '💻', bookCount: 8 },
    { slug: 'obzh', name: 'ОБЖ', icon: '🛡️', bookCount: 5 } ]
}

export const gdzSubjectsByClass: Record<number, GdzSubject[  ]> = {
  1: makeGrade14(1),
  2: makeGrade14(2),
  3: makeGrade14(3),
  4: makeGrade14(4),
  5: makeGrade56(),
  6: makeGrade56(),
  7: makeGrade79(),
  8: makeGrade79(),
  9: makeGrade79(),
  10: makeGrade1011(),
  11: makeGrade1011(),
}


// ────────────────────────────────────────────────────
// Vilenkin Math 6 — full chapter structure with solutions for 1–30
// ────────────────────────────────────────────────────

// ────────────────────────────────────────────────────
// Данные книг/задач вынесены в gdz-books.json и грузятся через fs в рантайме,
// чтобы webpack/Turbopack не парсил ~6 МБ в бандл (резко ускоряет next build).
// ────────────────────────────────────────────────────
export const gdzBooks: GdzBook[] = JSON.parse(
  readFileSync(join(process.cwd(), 'src/data/gdz-books.json'), 'utf8'),
) as GdzBook[]

// ────────────────────────────────────────────────────
// Helper functions
// ────────────────────────────────────────────────────

export function getGdzSubjects(klass: number): GdzSubject[  ] {
  return gdzSubjectsByClass[ klass ] ?? [  ]
}

export function getGdzBooks(klass: number, subjectSlug: string): GdzBook[  ] {
  return gdzBooks.filter(b => b.klass === klass && b.subjectSlug === subjectSlug)
}

export function getGdzBook(klass: number, subjectSlug: string, bookSlug: string): GdzBook | undefined {
  return gdzBooks.find(b => b.klass === klass && b.subjectSlug === subjectSlug && b.slug === bookSlug)
}

export function getGdzAllProblems(book: GdzBook): GdzProblem[  ] {
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
    prev: idx > 0 ? all[ idx - 1 ].number : null,
    next: idx < all.length - 1 ? all[ idx + 1 ].number : null,
  }
}

export function getGdzProblemChapter(book: GdzBook, number: string): GdzChapter | undefined {
  return book.chapters.find(ch => ch.problems.some(p => p.number === number))
}
