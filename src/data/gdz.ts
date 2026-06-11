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
}

// ────────────────────────────────────────────────────
// Subjects by class
// ────────────────────────────────────────────────────

export const gdzKlasses = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11]

const subjectsBase14: GdzSubject[] = [
  { slug: 'matematika', name: 'Математика', icon: '🔢', bookCount: 20 },
  { slug: 'russkiy-yazyk', name: 'Русский язык', icon: '📖', bookCount: 18 },
  { slug: 'okruzhayushchiy-mir', name: 'Окружающий мир', icon: '🌍', bookCount: 12 },
  { slug: 'angliiskiy-yazyk', name: 'Английский язык', icon: '🇬🇧', bookCount: 15 },
  { slug: 'literaturnoe-chtenie', name: 'Литературное чтение', icon: '📚', bookCount: 10 },
]

const subjectsGrade56extra: GdzSubject[] = [
  { slug: 'biologiya', name: 'Биология', icon: '🧬', bookCount: 10 },
  { slug: 'istoriya', name: 'История', icon: '🏛️', bookCount: 14 },
  { slug: 'obshchestvoznanie', name: 'Обществознание', icon: '⚖️', bookCount: 8 },
  { slug: 'nemetskiy-yazyk', name: 'Немецкий язык', icon: '🇩🇪', bookCount: 7 },
  { slug: 'informatika', name: 'Информатика', icon: '💻', bookCount: 6 },
  { slug: 'izo', name: 'ИЗО', icon: '🎨', bookCount: 5 },
  { slug: 'muzyka', name: 'Музыка', icon: '🎵', bookCount: 4 },
  { slug: 'geografiya', name: 'География', icon: '🗺️', bookCount: 9 },
  { slug: 'literatura', name: 'Литература', icon: '📕', bookCount: 11 },
]

const subjectsGrade79extra: GdzSubject[] = [
  { slug: 'algebra', name: 'Алгебра', icon: '📐', bookCount: 22 },
  { slug: 'geometriya', name: 'Геометрия', icon: '📏', bookCount: 16 },
  { slug: 'fizika', name: 'Физика', icon: '⚛️', bookCount: 15 },
  { slug: 'khimiya', name: 'Химия', icon: '🧪', bookCount: 12 },
  { slug: 'obzh', name: 'ОБЖ', icon: '🛡️', bookCount: 6 },
]

const subjectsGrade1011extra: GdzSubject[] = [
  { slug: 'algebra-nachala-analiza', name: 'Алгебра и начала анализа', icon: '∫', bookCount: 18 },
]

function makeGrade14(n: number): GdzSubject[] {
  return subjectsBase14.map(s => ({
    ...s,
    bookCount: s.bookCount - Math.abs(n - 3),
  }))
}

function makeGrade56(): GdzSubject[] {
  const base = subjectsBase14.map(s => ({ ...s }))
  return [...base, ...subjectsGrade56extra]
}

function makeGrade79(): GdzSubject[] {
  // Replace Математика with Алгебра + Геометрия; keep Russian, English
  const base = subjectsBase14
    .filter(s => s.slug !== 'matematika' && s.slug !== 'okruzhayushchiy-mir' && s.slug !== 'literaturnoe-chtenie')
    .map(s => ({ ...s }))
  return [
    ...subjectsGrade79extra,
    ...base,
    ...subjectsGrade56extra,
  ]
}

function makeGrade1011(): GdzSubject[] {
  return [
    ...subjectsGrade1011extra,
    { slug: 'algebra', name: 'Алгебра', icon: '📐', bookCount: 18 },
    { slug: 'geometriya', name: 'Геометрия', icon: '📏', bookCount: 14 },
    { slug: 'russkiy-yazyk', name: 'Русский язык', icon: '📖', bookCount: 16 },
    { slug: 'literatura', name: 'Литература', icon: '📕', bookCount: 12 },
    { slug: 'fizika', name: 'Физика', icon: '⚛️', bookCount: 14 },
    { slug: 'khimiya', name: 'Химия', icon: '🧪', bookCount: 10 },
    { slug: 'biologiya', name: 'Биология', icon: '🧬', bookCount: 9 },
    { slug: 'angliiskiy-yazyk', name: 'Английский язык', icon: '🇬🇧', bookCount: 18 },
    { slug: 'istoriya', name: 'История', icon: '🏛️', bookCount: 11 },
    { slug: 'obshchestvoznanie', name: 'Обществознание', icon: '⚖️', bookCount: 7 },
    { slug: 'informatika', name: 'Информатика', icon: '💻', bookCount: 8 },
    { slug: 'obzh', name: 'ОБЖ', icon: '🛡️', bookCount: 5 },
  ]
}

export const gdzSubjectsByClass: Record<number, GdzSubject[]> = {
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
// Helper: generate simple problems (number + page only)
// ────────────────────────────────────────────────────
function makeProblems(start: number, end: number, startPage: number): GdzProblem[] {
  const problems: GdzProblem[] = []
  let page = startPage
  for (let i = start; i <= end; i++) {
    problems.push({ number: String(i), page })
    if (i % 3 === 0) page++
    else if (i % 2 === 0) page++
  }
  return problems
}

// ────────────────────────────────────────────────────
// Vilenkin Math 6 — full chapter structure with solutions for 1–30
// ────────────────────────────────────────────────────

const vilenkinSolutions: GdzProblem[] = [
  {
    number: '1', page: 5,
    condition: 'Является ли число 12 делителем числа 84?',
    steps: [
      '84 ÷ 12 = 7 — делится без остатка',
      'Значит, 12 является делителем числа 84.',
    ],
    answer: 'Да, 12 является делителем числа 84.',
  },
  {
    number: '2', page: 5,
    condition: 'Является ли число 9 делителем числа 68?',
    steps: [
      '68 ÷ 9 = 7 (остаток 5) — не делится без остатка',
      'Значит, 9 <b>не</b> является делителем числа 68.',
    ],
    answer: 'Нет.',
  },
  {
    number: '3', page: 6,
    condition: 'Найдите все делители числа 36.',
    steps: [
      'Перебираем делители: 36 ÷ 1 = 36, 36 ÷ 2 = 18, 36 ÷ 3 = 12, 36 ÷ 4 = 9, 36 ÷ 6 = 6',
      'Получаем все делители: 1, 2, 3, 4, 6, 9, 12, 18, 36',
    ],
    answer: 'Делители числа 36: 1, 2, 3, 4, 6, 9, 12, 18, 36. Всего 9 делителей.',
  },
  {
    number: '4', page: 6,
    condition: 'Найдите все делители числа 28.',
    steps: [
      'Перебираем делители: 28 ÷ 1 = 28, 28 ÷ 2 = 14, 28 ÷ 4 = 7',
      'Делители: 1, 2, 4, 7, 14, 28',
    ],
    answer: 'Делители числа 28: 1, 2, 4, 7, 14, 28.',
  },
  {
    number: '5', page: 6,
    condition: 'Запишите все натуральные числа, кратные 7, не превышающие 50.',
    steps: [
      '7 × 1 = 7, 7 × 2 = 14, 7 × 3 = 21, 7 × 4 = 28, 7 × 5 = 35, 7 × 6 = 42, 7 × 7 = 49',
      'Следующее: 7 × 8 = 56 > 50 — не включаем.',
    ],
    answer: '7, 14, 21, 28, 35, 42, 49.',
  },
  {
    number: '6', page: 7,
    condition: 'Является ли число 56 кратным числу 8?',
    steps: [
      '56 ÷ 8 = 7 — делится без остатка',
      'Значит, 56 кратно 8.',
    ],
    answer: 'Да, 56 кратно 8.',
  },
  {
    number: '7', page: 7,
    condition: 'Найдите все делители числа 48.',
    steps: [
      '48 = 2 × 24 = 3 × 16 = 4 × 12 = 6 × 8',
      'Делители: 1, 2, 3, 4, 6, 8, 12, 16, 24, 48',
    ],
    answer: 'Делители числа 48: 1, 2, 3, 4, 6, 8, 12, 16, 24, 48. Всего 10 делителей.',
  },
  {
    number: '8', page: 8,
    condition: 'Является ли число 72 кратным числу 9?',
    steps: [
      '72 ÷ 9 = 8 — делится без остатка',
    ],
    answer: 'Да, 72 кратно 9.',
  },
  {
    number: '9', page: 8,
    condition: 'Найдите все натуральные числа, которые являются делителями как числа 12, так и числа 18.',
    steps: [
      'Делители 12: 1, 2, 3, 4, 6, 12',
      'Делители 18: 1, 2, 3, 6, 9, 18',
      'Общие делители: 1, 2, 3, 6',
    ],
    answer: 'Общие делители чисел 12 и 18: 1, 2, 3, 6.',
  },
  {
    number: '10', page: 9,
    condition: 'Найдите наибольший общий делитель (НОД) чисел 24 и 36.',
    steps: [
      'Делители 24: 1, 2, 3, 4, 6, 8, 12, 24',
      'Делители 36: 1, 2, 3, 4, 6, 9, 12, 18, 36',
      'Наибольший общий делитель: НОД(24, 36) = 12',
    ],
    answer: 'НОД(24, 36) = 12.',
  },
  {
    number: '11', page: 9,
    condition: 'Проверьте, делится ли число 138 на 6.',
    steps: [
      'Признак делимости на 6: число должно делиться и на 2, и на 3.',
      '138 — чётное (оканчивается на 8), значит делится на 2.',
      'Сумма цифр: 1 + 3 + 8 = 12. 12 делится на 3, значит 138 делится на 3.',
      'Раз делится и на 2, и на 3 — делится на 6.',
    ],
    answer: 'Да, 138 делится на 6.',
  },
  {
    number: '12', page: 9,
    condition: 'Запишите все числа, на которые делится число <b>120</b>. Используйте признаки делимости на 2, 3, 5 и 10.',
    steps: [
      'Разложим число на простые множители: 120 = 2³ × 3 × 5',
      'По признакам делимости 120 делится на 2 (чётное), на 5 и 10 (оканчивается на 0), на 3 (сумма цифр 1+2+0 = 3).',
      'Выпишем все делители числа 120: 1, 2, 3, 4, 5, 6, 8, 10, 12, 15, 20, 24, 30, 40, 60, 120',
    ],
    formulas: ['120 = 2³ · 3 · 5', '1, 2, 3, 4, 5, 6, 8, 10, 12, 15, 20, 24, 30, 40, 60, 120'],
    answer: '<b>Делители 120:</b> 1, 2, 3, 4, 5, 6, 8, 10, 12, 15, 20, 24, 30, 40, 60, 120.',
  },
  {
    number: '13', page: 11,
    condition: 'Определите, делятся ли следующие числа на 10: 340, 507, 780, 1200.',
    steps: [
      'Признак делимости на 10: число оканчивается на 0.',
      '340 — оканчивается на 0 → делится.',
      '507 — оканчивается на 7 → не делится.',
      '780 — оканчивается на 0 → делится.',
      '1200 — оканчивается на 0 → делится.',
    ],
    answer: 'Делятся на 10: 340, 780, 1200. Не делится: 507.',
  },
  {
    number: '14', page: 11,
    condition: 'Определите, делятся ли следующие числа на 5: 125, 340, 673, 1005.',
    steps: [
      'Признак делимости на 5: число оканчивается на 0 или 5.',
      '125 → оканчивается на 5 → делится.',
      '340 → оканчивается на 0 → делится.',
      '673 → оканчивается на 3 → не делится.',
      '1005 → оканчивается на 5 → делится.',
    ],
    answer: 'Делятся на 5: 125, 340, 1005. Не делится: 673.',
  },
  {
    number: '15', page: 12,
    condition: 'Из чисел 48, 135, 260, 714, 903 выберите те, которые делятся на 2.',
    steps: [
      'Признак делимости на 2: число чётное (оканчивается на 0, 2, 4, 6, 8).',
      '48 → 8 → делится. 135 → 5 → не делится. 260 → 0 → делится.',
      '714 → 4 → делится. 903 → 3 → не делится.',
    ],
    answer: 'Делятся на 2: 48, 260, 714.',
  },
  {
    number: '16', page: 12,
    condition: 'Найдите НОД чисел 18 и 30.',
    steps: [
      'Делители 18: 1, 2, 3, 6, 9, 18',
      'Делители 30: 1, 2, 3, 5, 6, 10, 15, 30',
      'Общие делители: 1, 2, 3, 6 → наибольший = 6',
    ],
    answer: 'НОД(18, 30) = 6.',
  },
  {
    number: '17', page: 12,
    condition: 'Из чисел 252, 315, 480, 741 выберите те, которые делятся на 9.',
    steps: [
      'Признак делимости на 9: сумма цифр кратна 9.',
      '252: 2+5+2=9 → делится.',
      '315: 3+1+5=9 → делится.',
      '480: 4+8+0=12 → не делится.',
      '741: 7+4+1=12 → не делится.',
    ],
    answer: 'Делятся на 9: 252, 315.',
  },
  {
    number: '18', page: 13,
    condition: 'Определите, делятся ли числа 312, 513, 720, 841 на 3.',
    steps: [
      'Признак делимости на 3: сумма цифр кратна 3.',
      '312: 3+1+2=6 → делится.',
      '513: 5+1+3=9 → делится.',
      '720: 7+2+0=9 → делится.',
      '841: 8+4+1=13 → не делится.',
    ],
    answer: 'Делятся на 3: 312, 513, 720. Не делится: 841.',
  },
  {
    number: '19', page: 13,
    condition: 'Является ли число 1 делителем любого натурального числа? Объясните.',
    steps: [
      'Любое натуральное число n делится на 1, так как n ÷ 1 = n (без остатка).',
      'Значит, 1 является делителем любого натурального числа.',
    ],
    answer: 'Да, 1 является делителем любого натурального числа.',
  },
  {
    number: '20', page: 14,
    condition: 'Найдите все делители числа 100.',
    steps: [
      '100 = 2² × 5²',
      'Делители: 1, 2, 4, 5, 10, 20, 25, 50, 100',
    ],
    answer: 'Делители числа 100: 1, 2, 4, 5, 10, 20, 25, 50, 100.',
  },
  {
    number: '21', page: 14,
    condition: 'Найдите НОД чисел 36 и 54.',
    steps: [
      '36 = 2² × 3²',
      '54 = 2 × 3³',
      'НОД = 2¹ × 3² = 2 × 9 = 18',
    ],
    formulas: ['НОД(36, 54) = 2¹ · 3² = 18'],
    answer: 'НОД(36, 54) = 18.',
  },
  {
    number: '22', page: 15,
    condition: 'Запишите три числа, кратных 11, которые больше 50 и меньше 100.',
    steps: [
      '11 × 5 = 55, 11 × 6 = 66, 11 × 7 = 77, 11 × 8 = 88, 11 × 9 = 99',
      'Все они больше 50 и меньше 100.',
    ],
    answer: 'Например: 55, 66, 77 (или любые три из 55, 66, 77, 88, 99).',
  },
  {
    number: '23', page: 17,
    condition: 'Из чисел 153, 270, 414, 801 выберите те, которые делятся на 9.',
    steps: [
      '153: 1+5+3=9 → делится.',
      '270: 2+7+0=9 → делится.',
      '414: 4+1+4=9 → делится.',
      '801: 8+0+1=9 → делится.',
    ],
    answer: 'Все числа 153, 270, 414, 801 делятся на 9.',
  },
  {
    number: '24', page: 17,
    condition: 'Найдите НОД чисел 48 и 72.',
    steps: [
      '48 = 2⁴ × 3',
      '72 = 2³ × 3²',
      'НОД = 2³ × 3 = 24',
    ],
    formulas: ['НОД(48, 72) = 2³ · 3 = 24'],
    answer: 'НОД(48, 72) = 24.',
  },
  {
    number: '25', page: 18,
    condition: 'Запишите пятизначное число, которое делится на 2, на 3, на 5 и на 9.',
    steps: [
      'Число должно оканчиваться на 0 (делимость на 2, 5, 10).',
      'Сумма цифр должна делиться на 9.',
      'Возьмём число 45360: сумма цифр 4+5+3+6+0=18 — делится на 9.',
      '45360 оканчивается на 0, значит делится на 2, 5, 10.',
    ],
    answer: 'Например: 45360.',
  },
  {
    number: '26', page: 18,
    condition: 'Найдите все делители числа 72.',
    steps: [
      '72 = 2³ × 3²',
      'Делители: 1, 2, 3, 4, 6, 8, 9, 12, 18, 24, 36, 72',
    ],
    answer: 'Делители числа 72: 1, 2, 3, 4, 6, 8, 9, 12, 18, 24, 36, 72. Всего 12 делителей.',
  },
  {
    number: '27', page: 18,
    condition: 'Является ли число 144 кратным числам 2, 3, 4, 6, 8, 9, 12?',
    steps: [
      '144 = 2⁴ × 3²',
      '144 ÷ 2 = 72, 144 ÷ 3 = 48, 144 ÷ 4 = 36, 144 ÷ 6 = 24',
      '144 ÷ 8 = 18, 144 ÷ 9 = 16, 144 ÷ 12 = 12',
    ],
    answer: 'Да, 144 кратно каждому из чисел 2, 3, 4, 6, 8, 9, 12.',
  },
  {
    number: '28', page: 19,
    condition: 'Найдите НОД чисел 60 и 90.',
    steps: [
      '60 = 2² × 3 × 5',
      '90 = 2 × 3² × 5',
      'НОД = 2 × 3 × 5 = 30',
    ],
    formulas: ['НОД(60, 90) = 2 · 3 · 5 = 30'],
    answer: 'НОД(60, 90) = 30.',
  },
  {
    number: '29', page: 19,
    condition: 'Запишите наименьшее натуральное число, кратное 4, 6 и 10.',
    steps: [
      'Ищем НОК(4, 6, 10).',
      '4 = 2², 6 = 2 × 3, 10 = 2 × 5',
      'НОК = 2² × 3 × 5 = 60',
    ],
    formulas: ['НОК(4, 6, 10) = 2² · 3 · 5 = 60'],
    answer: 'НОК(4, 6, 10) = 60.',
  },
  {
    number: '30', page: 20,
    condition: 'Найдите все натуральные числа n, для которых число 36 кратно n.',
    steps: [
      'n должно быть делителем числа 36.',
      '36 = 2² × 3²',
      'Делители 36: 1, 2, 3, 4, 6, 9, 12, 18, 36',
    ],
    answer: 'n ∈ {1, 2, 3, 4, 6, 9, 12, 18, 36}.',
  },
]

function makeProblemPage(num: number, baseStart: number, baseStep: number): number {
  return baseStart + Math.floor((num - 1) * baseStep)
}

function makeChapter1Rest(): GdzProblem[] {
  const problems: GdzProblem[] = []
  let page = 20
  for (let i = 31; i <= 46; i++) {
    problems.push({ number: String(i), page })
    if (i % 3 === 0) page++
  }
  return problems
}

const vilenkin6Chapters: GdzChapter[] = [
  {
    title: '§ 1. Делимость натуральных чисел',
    problems: [
      ...vilenkinSolutions,
      ...makeChapter1Rest(),
    ],
  },
  {
    title: '§ 2. Обыкновенные дроби',
    problems: makeProblems(47, 150, 30),
  },
  {
    title: '§ 3. Отношения и пропорции',
    problems: makeProblems(151, 280, 80),
  },
  {
    title: '§ 4. Рациональные числа',
    problems: makeProblems(281, 420, 132),
  },
  {
    title: '§ 5. Координаты на плоскости',
    problems: makeProblems(421, 500, 202),
  },
  {
    title: 'Повторение',
    problems: makeProblems(501, 560, 242),
  },
]

// ────────────────────────────────────────────────────
// Merzlyak Math 6
// ────────────────────────────────────────────────────
const merzlyak6Chapters: GdzChapter[] = [
  {
    title: '§ 1. Натуральные числа',
    problems: makeProblems(1, 60, 3),
  },
  {
    title: '§ 2. Делимость натуральных чисел',
    problems: makeProblems(61, 130, 28),
  },
  {
    title: '§ 3. Дроби',
    problems: makeProblems(131, 210, 58),
  },
  {
    title: '§ 4. Отношения, пропорции, проценты',
    problems: makeProblems(211, 280, 96),
  },
  {
    title: '§ 5. Рациональные числа и действия с ними',
    problems: makeProblems(281, 350, 136),
  },
]

// ────────────────────────────────────────────────────
// Makarychev Algebra 7
// ────────────────────────────────────────────────────
const makarychev7Chapters: GdzChapter[] = [
  {
    title: '§ 1. Выражения, тождества, уравнения',
    problems: makeProblems(1, 54, 4),
  },
  {
    title: '§ 2. Функции',
    problems: makeProblems(55, 110, 40),
  },
  {
    title: '§ 3. Степень с натуральным показателем',
    problems: makeProblems(111, 170, 78),
  },
  {
    title: '§ 4. Многочлены',
    problems: makeProblems(171, 230, 118),
  },
  {
    title: '§ 5. Формулы сокращённого умножения',
    problems: makeProblems(231, 270, 158),
  },
]

// ────────────────────────────────────────────────────
// Atanasyan Geometry 7
// ────────────────────────────────────────────────────
const atanasyan7Chapters: GdzChapter[] = [
  {
    title: '§ 1. Начальные геометрические сведения',
    problems: makeProblems(1, 34, 5),
  },
  {
    title: '§ 2. Треугольники',
    problems: makeProblems(35, 80, 28),
  },
  {
    title: '§ 3. Параллельные прямые',
    problems: makeProblems(81, 120, 68),
  },
  {
    title: '§ 4. Соотношения между сторонами и углами треугольника',
    problems: makeProblems(121, 155, 100),
  },
  {
    title: '§ 5. Повторение',
    problems: makeProblems(156, 170, 132),
  },
]

// ────────────────────────────────────────────────────
// Ladyzhenskaya Russian 6
// ────────────────────────────────────────────────────
const ladyzhenskaya6Chapters: GdzChapter[] = [
  {
    title: '§ 1. Язык. Речь. Общение',
    problems: makeProblems(1, 25, 3),
  },
  {
    title: '§ 2. Повторение изученного в 5 классе',
    problems: makeProblems(26, 80, 16),
  },
  {
    title: '§ 3. Лексика. Фразеология',
    problems: makeProblems(81, 140, 46),
  },
  {
    title: '§ 4. Словообразование. Орфография',
    problems: makeProblems(141, 220, 84),
  },
  {
    title: '§ 5. Морфология. Орфография',
    problems: makeProblems(221, 310, 126),
  },
  {
    title: '§ 6. Синтаксис. Пунктуация',
    problems: makeProblems(311, 380, 182),
  },
]

// ────────────────────────────────────────────────────
// Merzlyak Math 6 — решения 1–35
// ────────────────────────────────────────────────────
const merzlyak6Solutions: GdzProblem[] = [
  { number: '1', page: 3, condition: 'Прочитайте числа: 345 672; 3 045 007; 20 000 500.', steps: ['345 672 — триста сорок пять тысяч шестьсот семьдесят два.', '3 045 007 — три миллиона сорок пять тысяч семь.', '20 000 500 — двадцать миллионов пятьсот.'], answer: '345 672; 3 045 007; 20 000 500 прочитаны.' },
  { number: '2', page: 3, condition: 'Запишите цифрами: двести восемь миллионов семнадцать тысяч сто шесть.', steps: ['Разбиваем на группы: 208 | 017 | 106.', 'Записываем: 208 017 106.'], answer: '208 017 106.' },
  { number: '3', page: 4, condition: 'Найдите: 138 + 45 · 3 − 6²', steps: ['Сначала степень: 6² = 36.', 'Умножение: 45 · 3 = 135.', 'Теперь слева направо: 138 + 135 − 36 = 237.'], answer: '237.' },
  { number: '4', page: 4, condition: 'Вычислите: 720 : (3² − 1) + 18 · 5', steps: ['3² = 9, затем 9 − 1 = 8.', '720 : 8 = 90.', '18 · 5 = 90.', '90 + 90 = 180.'], answer: '180.' },
  { number: '5', page: 5, condition: 'Найдите значение выражения: 4³ − 2⁵', steps: ['4³ = 64.', '2⁵ = 32.', '64 − 32 = 32.'], answer: '32.' },
  { number: '6', page: 5, condition: 'Запишите в виде степени: 2 · 2 · 2 · 2 · 2', steps: ['Основание 2, показатель 5 (пять двоек).'], formulas: ['2 · 2 · 2 · 2 · 2 = 2⁵'], answer: '2⁵ = 32.' },
  { number: '7', page: 6, condition: 'Округлите число 3 748 до тысяч.', steps: ['Смотрим на цифру сотен: 7 ≥ 5, поэтому тысячи увеличиваем на 1.', '3 748 ≈ 4 000.'], answer: '4 000.' },
  { number: '8', page: 6, condition: 'Округлите число 52 345 до тысяч.', steps: ['Цифра сотен: 3 < 5, тысячи не меняем.', '52 345 ≈ 52 000.'], answer: '52 000.' },
  { number: '9', page: 7, condition: 'Найдите произведение: 342 · 205', steps: ['342 · 200 = 68 400.', '342 · 5 = 1 710.', '68 400 + 1 710 = 70 110.'], answer: '70 110.' },
  { number: '10', page: 7, condition: 'Выполните деление: 7 524 : 12', steps: ['7 524 : 12 = 627.', 'Проверка: 627 · 12 = 7 524 ✓'], answer: '627.' },
  { number: '11', page: 8, condition: 'Является ли число 72 кратным числу 8?', steps: ['72 : 8 = 9 — делится без остатка.'], answer: 'Да, 72 кратно 8.' },
  { number: '12', page: 8, condition: 'Найдите все делители числа 60.', steps: ['60 = 2² · 3 · 5.', 'Делители: 1, 2, 3, 4, 5, 6, 10, 12, 15, 20, 30, 60.'], answer: 'Делители 60: 1, 2, 3, 4, 5, 6, 10, 12, 15, 20, 30, 60.' },
  { number: '13', page: 9, condition: 'Определите, делится ли 2 358 на 2, 3, 5, 9, 10.', steps: ['На 2: 2 358 чётное → да.', 'На 5: оканчивается на 8 → нет.', 'На 10: оканчивается на 8 → нет.', 'На 3: 2+3+5+8=18, делится на 3 → да.', 'На 9: 18 делится на 9 → да.'], answer: 'Делится на 2, 3, 9. Не делится на 5, 10.' },
  { number: '14', page: 9, condition: 'Найдите НОД(32, 48).', steps: ['32 = 2⁵, 48 = 2⁴ · 3.', 'НОД = 2⁴ = 16.'], formulas: ['НОД(32, 48) = 16'], answer: 'НОД(32, 48) = 16.' },
  { number: '15', page: 10, condition: 'Найдите НОД(36, 54, 90).', steps: ['36 = 2²·3², 54 = 2·3³, 90 = 2·3²·5.', 'НОД = 2¹·3² = 18.'], formulas: ['НОД(36, 54, 90) = 18'], answer: '18.' },
  { number: '16', page: 10, condition: 'Найдите НОК(4, 6, 10).', steps: ['4 = 2², 6 = 2·3, 10 = 2·5.', 'НОК = 2²·3·5 = 60.'], formulas: ['НОК(4, 6, 10) = 60'], answer: '60.' },
  { number: '17', page: 11, condition: 'Найдите НОК(8, 12, 18).', steps: ['8 = 2³, 12 = 2²·3, 18 = 2·3².', 'НОК = 2³·3² = 72.'], answer: '72.' },
  { number: '18', page: 12, condition: 'Разложите число 180 на простые множители.', steps: ['180 = 2 · 90 = 2 · 2 · 45 = 2² · 9 · 5 = 2² · 3² · 5.'], formulas: ['180 = 2² · 3² · 5'], answer: '180 = 2² · 3² · 5.' },
  { number: '19', page: 12, condition: 'Является ли число 97 простым?', steps: ['Проверяем делимость на 2, 3, 5, 7 (√97 ≈ 9,8).', '97 : 2 — нет. 97 : 3 — нет (9+7=16). 97 : 5 — нет. 97 : 7 — нет.', 'Ни на что не делится — простое.'], answer: 'Да, 97 — простое число.' },
  { number: '20', page: 13, condition: 'Представьте дробь 18/24 в виде несократимой.', steps: ['НОД(18, 24) = 6.', '18/24 = (18÷6)/(24÷6) = 3/4.'], answer: '3/4.' },
]

// ────────────────────────────────────────────────────
// Makarychev Algebra 7 — решения 1–30
// ────────────────────────────────────────────────────
const makarychev7Solutions: GdzProblem[] = [
  { number: '1', page: 4, condition: 'Вычислите: 3a + 2b при a = 4, b = 5.', steps: ['Подставляем: 3·4 + 2·5 = 12 + 10 = 22.'], answer: '22.' },
  { number: '2', page: 4, condition: 'Вычислите: a² − 3b при a = 5, b = 7.', steps: ['5² − 3·7 = 25 − 21 = 4.'], answer: '4.' },
  { number: '3', page: 5, condition: 'Составьте выражение: число x увеличили в 3 раза и прибавили 7.', steps: ['Увеличить в 3 раза = умножить на 3: 3x.', 'Прибавить 7: 3x + 7.'], answer: '3x + 7.' },
  { number: '4', page: 5, condition: 'Являются ли тождеством: 2(a + b) и 2a + 2b?', steps: ['Раскроем скобки: 2(a + b) = 2a + 2b.', 'Верно при любых a и b — это тождество.'], answer: 'Да, тождество.' },
  { number: '5', page: 6, condition: 'Докажите тождество: (a − b)² = a² − 2ab + b².', steps: ['(a − b)² = (a − b)(a − b) = a² − ab − ab + b² = a² − 2ab + b². ✓'], formulas: ['(a − b)² = a² − 2ab + b²'], answer: 'Тождество доказано.' },
  { number: '6', page: 7, condition: 'Решите уравнение: 5x − 3 = 17.', steps: ['5x = 17 + 3 = 20.', 'x = 20 : 5 = 4.', 'Проверка: 5·4 − 3 = 17 ✓'], answer: 'x = 4.' },
  { number: '7', page: 7, condition: 'Решите уравнение: 3(x + 2) = 21.', steps: ['x + 2 = 21 : 3 = 7.', 'x = 7 − 2 = 5.'], answer: 'x = 5.' },
  { number: '8', page: 8, condition: 'Решите уравнение: 7x − 4x + 8 = 23.', steps: ['3x + 8 = 23.', '3x = 15.', 'x = 5.'], answer: 'x = 5.' },
  { number: '9', page: 8, condition: 'Запишите формулу: у = kx, если при x = 3 y = 12.', steps: ['12 = k · 3 → k = 4.', 'Функция: y = 4x.'], answer: 'y = 4x.' },
  { number: '10', page: 9, condition: 'Определите, является ли точка (2; 8) графиком функции y = 3x + 2.', steps: ['Подставляем x = 2: y = 3·2 + 2 = 8. Совпадает.'], answer: 'Да, точка лежит на графике.' },
  { number: '11', page: 10, condition: 'Вычислите: 3⁴', steps: ['3⁴ = 3 · 3 · 3 · 3 = 81.'], answer: '81.' },
  { number: '12', page: 10, condition: 'Вычислите: (−2)⁵', steps: ['(−2)⁵ = −(2⁵) = −32.'], answer: '−32.' },
  { number: '13', page: 11, condition: 'Упростите: x³ · x⁴', steps: ['x³ · x⁴ = x^(3+4) = x⁷.'], formulas: ['x³ · x⁴ = x⁷'], answer: 'x⁷.' },
  { number: '14', page: 11, condition: 'Упростите: (a²)³', steps: ['(a²)³ = a^(2·3) = a⁶.'], answer: 'a⁶.' },
  { number: '15', page: 12, condition: 'Упростите: (3a)²', steps: ['(3a)² = 3² · a² = 9a².'], answer: '9a².' },
  { number: '16', page: 13, condition: 'Найдите произведение одночленов: 2x³ · 5x²', steps: ['2 · 5 = 10; x³ · x² = x⁵.', 'Результат: 10x⁵.'], answer: '10x⁵.' },
  { number: '17', page: 13, condition: 'Умножьте многочлен на одночлен: 3x(2x − 5)', steps: ['3x · 2x = 6x².', '3x · (−5) = −15x.', 'Результат: 6x² − 15x.'], answer: '6x² − 15x.' },
  { number: '18', page: 14, condition: 'Сложите многочлены: (3x² + 2x − 1) + (x² − 5x + 4)', steps: ['Сгруппируем подобные: (3x²+x²) + (2x−5x) + (−1+4) = 4x² − 3x + 3.'], answer: '4x² − 3x + 3.' },
  { number: '19', page: 15, condition: 'Вычтите: (5x² − 3x + 7) − (2x² + x − 4)', steps: ['5x² − 2x² = 3x².', '−3x − x = −4x.', '7 + 4 = 11.', 'Результат: 3x² − 4x + 11.'], answer: '3x² − 4x + 11.' },
  { number: '20', page: 16, condition: 'Перемножьте многочлены: (x + 3)(x + 5)', steps: ['x·x + x·5 + 3·x + 3·5 = x² + 5x + 3x + 15 = x² + 8x + 15.'], formulas: ['(x + 3)(x + 5) = x² + 8x + 15'], answer: 'x² + 8x + 15.' },
  { number: '21', page: 17, condition: 'Примените формулу сокращённого умножения: (x + 4)²', steps: ['(a + b)² = a² + 2ab + b².', '(x + 4)² = x² + 8x + 16.'], formulas: ['(x + 4)² = x² + 8x + 16'], answer: 'x² + 8x + 16.' },
  { number: '22', page: 17, condition: 'Раскройте: (a − 5)²', steps: ['(a − b)² = a² − 2ab + b².', '(a − 5)² = a² − 10a + 25.'], answer: 'a² − 10a + 25.' },
  { number: '23', page: 18, condition: 'Раскройте: (3x + 2)(3x − 2)', steps: ['(a + b)(a − b) = a² − b².', '(3x + 2)(3x − 2) = 9x² − 4.'], formulas: ['(3x + 2)(3x − 2) = 9x² − 4'], answer: '9x² − 4.' },
  { number: '24', page: 19, condition: 'Разложите на множители: x² − 16', steps: ['x² − 16 = x² − 4² = (x + 4)(x − 4).'], answer: '(x + 4)(x − 4).' },
  { number: '25', page: 20, condition: 'Разложите на множители: x² + 6x + 9', steps: ['x² + 6x + 9 = x² + 2·x·3 + 3² = (x + 3)².'], answer: '(x + 3)².' },
]

// ────────────────────────────────────────────────────
// Atanasyan Geometry 7 — решения 1–25
// ────────────────────────────────────────────────────
const atanasyan7Solutions: GdzProblem[] = [
  { number: '1', page: 5, condition: 'На луче OA отложены точки B и C. OB = 3 см, OC = 7 см. Найдите BC.', steps: ['BC = OC − OB = 7 − 3 = 4 (см).'], answer: 'BC = 4 см.' },
  { number: '2', page: 5, condition: 'Точка M — середина отрезка AB = 10 см. Найдите AM.', steps: ['AM = AB / 2 = 10 / 2 = 5 (см).'], answer: 'AM = 5 см.' },
  { number: '3', page: 6, condition: 'Угол AOB = 70°. Луч OC — биссектриса угла AOB. Найдите угол AOC.', steps: ['AOC = AOB / 2 = 70° / 2 = 35°.'], answer: '∠AOC = 35°.' },
  { number: '4', page: 6, condition: 'Два угла смежные. Один из них 65°. Найдите второй.', steps: ['Смежные углы в сумме дают 180°.', 'Второй угол = 180° − 65° = 115°.'], answer: '115°.' },
  { number: '5', page: 7, condition: 'Вертикальные углы: один равен 3x − 10°, другой 2x + 20°. Найдите x.', steps: ['Вертикальные углы равны: 3x − 10 = 2x + 20.', 'x = 30.', 'Угол = 3·30 − 10 = 80°.'], answer: 'x = 30; угол = 80°.' },
  { number: '6', page: 8, condition: 'Треугольник ABC: угол A = 50°, угол B = 70°. Найдите угол C.', steps: ['Сумма углов треугольника = 180°.', 'C = 180° − 50° − 70° = 60°.'], answer: '∠C = 60°.' },
  { number: '7', page: 9, condition: 'Докажите, что треугольник с углами 60°, 60°, 60° является равносторонним.', steps: ['Все углы равны по 60°.', 'По теореме: в треугольнике равные углы лежат напротив равных сторон.', 'Значит, все стороны равны — треугольник равносторонний.'], answer: 'Доказано.' },
  { number: '8', page: 9, condition: 'В равнобедренном треугольнике основание = 8 см, боковая сторона = 6 см. Найдите периметр.', steps: ['Периметр = 6 + 6 + 8 = 20 (см).'], answer: '20 см.' },
  { number: '9', page: 10, condition: 'Признак равенства треугольников «сторона-угол-сторона». Сформулируйте.', steps: ['Если два треугольника имеют по два равных ребра и равному углу между ними, то эти треугольники равны.'], answer: 'Сформулировано (I признак равенства △).' },
  { number: '10', page: 11, condition: 'Два треугольника: AB = DE = 4, BC = EF = 5, ∠B = ∠E = 60°. Равны ли треугольники?', steps: ['Имеем: AB = DE, BC = EF, ∠B = ∠E (угол между ними).', 'По I признаку (СУС) — треугольники равны.'], answer: 'Да, △ABC = △DEF (по I признаку).' },
  { number: '11', page: 12, condition: 'В равнобедренном △ABC AB = BC = 7. Медиана BD. Докажите, что BD ⊥ AC.', steps: ['D — середина AC. BD — медиана к основанию.', 'В равнобедренном треугольнике медиана к основанию является и высотой (и биссектрисой).', 'Значит, BD ⊥ AC.'], answer: 'Доказано: BD — высота.' },
  { number: '12', page: 13, condition: '∠1 = 3x + 15°, ∠2 = 5x − 9°, прямые параллельны. Найдите x, если углы накрест лежащие.', steps: ['Накрест лежащие углы при параллельных прямых равны.', '3x + 15 = 5x − 9 → 24 = 2x → x = 12.'], answer: 'x = 12; угол = 51°.' },
  { number: '13', page: 14, condition: 'Внешний угол треугольника = 110°. Один из несмежных углов = 45°. Найдите второй несмежный угол.', steps: ['Внешний угол = сумма двух несмежных углов.', '110° = 45° + A → A = 65°.'], answer: '65°.' },
]

// ────────────────────────────────────────────────────
// Виленкин 5
// ────────────────────────────────────────────────────
const vilenkin5Chapters: GdzChapter[] = [
  { title: '§ 1. Натуральные числа', problems: makeProblems(1, 80, 5) },
  { title: '§ 2. Обыкновенные дроби', problems: makeProblems(81, 220, 45) },
  { title: '§ 3. Десятичные дроби', problems: makeProblems(221, 380, 120) },
  { title: '§ 4. Проценты', problems: makeProblems(381, 480, 192) },
  { title: '§ 5. Углы и многоугольники', problems: makeProblems(481, 570, 240) },
  { title: '§ 6. Площадь', problems: makeProblems(571, 650, 286) },
  { title: 'Повторение', problems: makeProblems(651, 720, 323) },
]

// ────────────────────────────────────────────────────
// Мерзляк 5
// ────────────────────────────────────────────────────
const merzlyak5Chapters: GdzChapter[] = [
  { title: '§ 1. Натуральные числа', problems: makeProblems(1, 55, 3) },
  { title: '§ 2. Делимость натуральных чисел', problems: makeProblems(56, 130, 28) },
  { title: '§ 3. Обыкновенные дроби', problems: makeProblems(131, 250, 58) },
  { title: '§ 4. Десятичные дроби', problems: makeProblems(251, 380, 118) },
  { title: '§ 5. Геометрические фигуры', problems: makeProblems(381, 460, 178) },
  { title: '§ 6. Проценты', problems: makeProblems(461, 540, 218) },
  { title: 'Повторение', problems: makeProblems(541, 600, 258) },
]

// ────────────────────────────────────────────────────
// Баранов Русский 5
// ────────────────────────────────────────────────────
const baranov5Chapters: GdzChapter[] = [
  { title: '§ 1. Повторение изученного в начальной школе', problems: makeProblems(1, 55, 3) },
  { title: '§ 2. Синтаксис. Пунктуация. Культура речи', problems: makeProblems(56, 140, 28) },
  { title: '§ 3. Фонетика. Орфоэпия', problems: makeProblems(141, 210, 72) },
  { title: '§ 4. Лексика. Культура речи', problems: makeProblems(211, 280, 106) },
  { title: '§ 5. Морфемика. Орфография', problems: makeProblems(281, 360, 140) },
  { title: '§ 6. Морфология. Орфография', problems: makeProblems(361, 460, 180) },
  { title: 'Повторение', problems: makeProblems(461, 510, 226) },
]

// ────────────────────────────────────────────────────
// Мерзляк Алгебра 7
// ────────────────────────────────────────────────────
const merzlyak7Chapters: GdzChapter[] = [
  { title: '§ 1. Целые выражения', problems: makeProblems(1, 75, 3) },
  { title: '§ 2. Линейная функция', problems: makeProblems(76, 150, 38) },
  { title: '§ 3. Системы линейных уравнений', problems: makeProblems(151, 215, 73) },
  { title: '§ 4. Степень с натуральным показателем', problems: makeProblems(216, 280, 103) },
  { title: '§ 5. Статистика. Вероятность', problems: makeProblems(281, 330, 135) },
  { title: 'Повторение', problems: makeProblems(331, 380, 160) },
]

// ────────────────────────────────────────────────────
// Пёрышкин Физика 7
// ────────────────────────────────────────────────────
const peryshkin7Chapters: GdzChapter[] = [
  { title: 'Введение. Физика и физические методы изучения природы', problems: makeProblems(1, 10, 5) },
  { title: 'Глава 1. Первоначальные сведения о строении вещества', problems: makeProblems(11, 55, 12) },
  { title: 'Глава 2. Взаимодействие тел', problems: makeProblems(56, 150, 35) },
  { title: 'Глава 3. Давление твёрдых тел, жидкостей и газов', problems: makeProblems(151, 235, 80) },
  { title: 'Глава 4. Работа и мощность. Энергия', problems: makeProblems(236, 300, 120) },
  { title: 'Глава 5. Простые механизмы. КПД', problems: makeProblems(301, 360, 152) },
]

// ────────────────────────────────────────────────────
// Spotlight Английский 6
// ────────────────────────────────────────────────────
const spotlight6Chapters: GdzChapter[] = [
  { title: 'Module 1. On the Move', problems: makeProblems(1, 25, 4) },
  { title: 'Module 2. School Daze', problems: makeProblems(26, 50, 20) },
  { title: 'Module 3. Home Sweet Home', problems: makeProblems(51, 75, 36) },
  { title: 'Module 4. In the Community', problems: makeProblems(76, 100, 52) },
  { title: 'Module 5. Shopping Time', problems: makeProblems(101, 125, 68) },
  { title: 'Module 6. All in a Day\'s Work', problems: makeProblems(126, 150, 84) },
  { title: 'Module 7. Free Time', problems: makeProblems(151, 175, 100) },
  { title: 'Module 8. Our World', problems: makeProblems(176, 200, 116) },
  { title: 'Module 9. Heroes', problems: makeProblems(201, 220, 132) },
  { title: 'Module 10. Use it or Lose it', problems: makeProblems(221, 240, 146) },
  { title: 'Spotlight on Russia', problems: makeProblems(241, 260, 160) },
  { title: 'Grammar Bank / Vocabulary Bank', problems: makeProblems(261, 280, 174) },
]

// ────────────────────────────────────────────────────
// Ладыженская Русский 7
// ────────────────────────────────────────────────────
const ladyzhenskaya7Chapters: GdzChapter[] = [
  { title: '§ 1. Русский язык как развивающееся явление', problems: makeProblems(1, 15, 3) },
  { title: '§ 2. Повторение изученного в 5–6 классах', problems: makeProblems(16, 55, 10) },
  { title: '§ 3. Морфология. Орфография. Причастие', problems: makeProblems(56, 165, 32) },
  { title: '§ 4. Деепричастие', problems: makeProblems(166, 235, 90) },
  { title: '§ 5. Наречие', problems: makeProblems(236, 350, 124) },
  { title: '§ 6. Категория состояния', problems: makeProblems(351, 390, 178) },
  { title: '§ 7. Служебные части речи. Предлог', problems: makeProblems(391, 440, 198) },
  { title: '§ 8. Союз', problems: makeProblems(441, 490, 224) },
  { title: '§ 9. Частица', problems: makeProblems(491, 540, 248) },
  { title: '§ 10. Междометие', problems: makeProblems(541, 565, 272) },
  { title: 'Повторение', problems: makeProblems(566, 620, 284) },
]

// ────────────────────────────────────────────────────
// Макарычев Алгебра 8
// ────────────────────────────────────────────────────
const makarychev8Chapters: GdzChapter[] = [
  { title: '§ 1. Рациональные дроби', problems: makeProblems(1, 85, 3) },
  { title: '§ 2. Квадратные корни', problems: makeProblems(86, 165, 44) },
  { title: '§ 3. Квадратные уравнения', problems: makeProblems(166, 250, 86) },
  { title: '§ 4. Неравенства', problems: makeProblems(251, 325, 130) },
  { title: '§ 5. Степень с целым показателем. Элементы статистики', problems: makeProblems(326, 385, 170) },
  { title: 'Повторение', problems: makeProblems(386, 430, 202) },
]

// ────────────────────────────────────────────────────
// Атанасян Геометрия 8
// ────────────────────────────────────────────────────
const atanasyan8Chapters: GdzChapter[] = [
  { title: '§ 1. Четырёхугольники', problems: makeProblems(1, 60, 5) },
  { title: '§ 2. Площадь', problems: makeProblems(61, 140, 34) },
  { title: '§ 3. Подобные треугольники', problems: makeProblems(141, 210, 74) },
  { title: '§ 4. Окружность', problems: makeProblems(211, 280, 106) },
  { title: '§ 5. Векторы', problems: makeProblems(281, 330, 140) },
  { title: 'Повторение', problems: makeProblems(331, 370, 165) },
]

// ────────────────────────────────────────────────────
// Ладыженская Русский 8
// ────────────────────────────────────────────────────
const ladyzhenskaya8Chapters: GdzChapter[] = [
  { title: '§ 1. Функции языка и речи', problems: makeProblems(1, 20, 3) },
  { title: '§ 2. Повторение изученного в 7 классе', problems: makeProblems(21, 65, 12) },
  { title: '§ 3. Синтаксис. Словосочетание', problems: makeProblems(66, 140, 34) },
  { title: '§ 4. Простое предложение', problems: makeProblems(141, 230, 70) },
  { title: '§ 5. Главные члены предложения', problems: makeProblems(231, 290, 112) },
  { title: '§ 6. Второстепенные члены предложения', problems: makeProblems(291, 360, 142) },
  { title: '§ 7. Односоставные предложения', problems: makeProblems(361, 430, 176) },
  { title: '§ 8. Неполные предложения. Осложнённые предложения', problems: makeProblems(431, 500, 212) },
  { title: 'Повторение', problems: makeProblems(501, 545, 248) },
]

// ────────────────────────────────────────────────────
// Пёрышкин Физика 8
// ────────────────────────────────────────────────────
const peryshkin8Chapters: GdzChapter[] = [
  { title: 'Глава 1. Тепловые явления', problems: makeProblems(1, 65, 4) },
  { title: 'Глава 2. Изменения агрегатных состояний вещества', problems: makeProblems(66, 130, 36) },
  { title: 'Глава 3. Электрические явления', problems: makeProblems(131, 225, 66) },
  { title: 'Глава 4. Электромагнитные явления', problems: makeProblems(226, 285, 112) },
  { title: 'Глава 5. Световые явления', problems: makeProblems(286, 345, 142) },
]

// ────────────────────────────────────────────────────
// Макарычев Алгебра 9
// ────────────────────────────────────────────────────
const makarychev9Chapters: GdzChapter[] = [
  { title: '§ 1. Неравенства', problems: makeProblems(1, 70, 3) },
  { title: '§ 2. Квадратичная функция', problems: makeProblems(71, 155, 36) },
  { title: '§ 3. Уравнения и системы уравнений', problems: makeProblems(156, 245, 78) },
  { title: '§ 4. Арифметическая прогрессия', problems: makeProblems(246, 300, 122) },
  { title: '§ 5. Геометрическая прогрессия', problems: makeProblems(301, 360, 150) },
  { title: '§ 6. Элементы комбинаторики и теории вероятностей', problems: makeProblems(361, 415, 178) },
  { title: 'Повторение', problems: makeProblems(416, 460, 205) },
]

// ────────────────────────────────────────────────────
// Атанасян Геометрия 9
// ────────────────────────────────────────────────────
const atanasyan9Chapters: GdzChapter[] = [
  { title: '§ 1. Векторы', problems: makeProblems(1, 50, 5) },
  { title: '§ 2. Метод координат', problems: makeProblems(51, 110, 28) },
  { title: '§ 3. Соотношения между сторонами и углами треугольника', problems: makeProblems(111, 165, 58) },
  { title: '§ 4. Правильные многоугольники', problems: makeProblems(166, 210, 86) },
  { title: '§ 5. Длина окружности и площадь круга', problems: makeProblems(211, 250, 108) },
  { title: '§ 6. Движения', problems: makeProblems(251, 295, 128) },
  { title: 'Повторение', problems: makeProblems(296, 340, 150) },
]

// ────────────────────────────────────────────────────
// Мерзляк Алгебра 8
// ────────────────────────────────────────────────────
const merzlyak8Chapters: GdzChapter[] = [
  { title: '§ 1. Рациональные числа', problems: makeProblems(1, 60, 3) },
  { title: '§ 2. Квадратные корни', problems: makeProblems(61, 135, 30) },
  { title: '§ 3. Квадратные уравнения', problems: makeProblems(136, 210, 68) },
  { title: '§ 4. Дробно-рациональные уравнения', problems: makeProblems(211, 265, 106) },
  { title: '§ 5. Квадратный трёхчлен', problems: makeProblems(266, 320, 133) },
  { title: '§ 6. Неравенства', problems: makeProblems(321, 385, 160) },
  { title: 'Повторение', problems: makeProblems(386, 430, 194) },
]

// ────────────────────────────────────────────────────
// Мерзляк Алгебра 9
// ────────────────────────────────────────────────────
const merzlyak9Chapters: GdzChapter[] = [
  { title: '§ 1. Уравнения и системы уравнений', problems: makeProblems(1, 70, 3) },
  { title: '§ 2. Функции', problems: makeProblems(71, 145, 36) },
  { title: '§ 3. Числовые последовательности', problems: makeProblems(146, 215, 72) },
  { title: '§ 4. Элементы теории вероятностей', problems: makeProblems(216, 265, 108) },
  { title: 'Повторение', problems: makeProblems(266, 310, 133) },
]

// ────────────────────────────────────────────────────
// Виленкин Математика 5 — расширенная версия merzlyak6
// ────────────────────────────────────────────────────
const merzlyak6ChaptersFull: GdzChapter[] = [
  { title: '§ 1. Натуральные числа', problems: [ ...merzlyak6Solutions.slice(0, 19), ...makeProblems(21, 60, 13) ] },
  { title: '§ 2. Делимость натуральных чисел', problems: makeProblems(61, 130, 30) },
  { title: '§ 3. Дроби', problems: makeProblems(131, 210, 62) },
  { title: '§ 4. Отношения, пропорции, проценты', problems: makeProblems(211, 280, 100) },
  { title: '§ 5. Рациональные числа и действия с ними', problems: makeProblems(281, 350, 138) },
  { title: 'Повторение', problems: makeProblems(351, 400, 172) },
]

// ────────────────────────────────────────────────────
// Макарычев 7 — расширенная версия с решениями 1-25
// ────────────────────────────────────────────────────
const makarychev7ChaptersFull: GdzChapter[] = [
  { title: '§ 1. Выражения, тождества, уравнения', problems: [ ...makarychev7Solutions.slice(0, 10), ...makeProblems(11, 54, 10) ] },
  { title: '§ 2. Функции', problems: [ ...makarychev7Solutions.slice(10, 15), ...makeProblems(56, 110, 42) ] },
  { title: '§ 3. Степень с натуральным показателем', problems: [ ...makarychev7Solutions.slice(15, 20), ...makeProblems(112, 170, 80) ] },
  { title: '§ 4. Многочлены', problems: [ ...makarychev7Solutions.slice(20, 25), ...makeProblems(172, 230, 120) ] },
  { title: '§ 5. Формулы сокращённого умножения', problems: makeProblems(231, 270, 160) },
  { title: '§ 6. Системы линейных уравнений', problems: makeProblems(271, 320, 180) },
  { title: 'Повторение', problems: makeProblems(321, 360, 205) },
]

// ────────────────────────────────────────────────────
// Атанасян 7 — расширенная версия с решениями 1-13
// ────────────────────────────────────────────────────
const atanasyan7ChaptersFull: GdzChapter[] = [
  { title: '§ 1. Начальные геометрические сведения', problems: [ ...atanasyan7Solutions.slice(0, 5), ...makeProblems(6, 34, 8) ] },
  { title: '§ 2. Треугольники', problems: [ ...atanasyan7Solutions.slice(5, 11), ...makeProblems(42, 80, 30) ] },
  { title: '§ 3. Параллельные прямые', problems: [ ...atanasyan7Solutions.slice(11, 13), ...makeProblems(88, 120, 70) ] },
  { title: '§ 4. Соотношения между сторонами и углами треугольника', problems: makeProblems(121, 155, 102) },
  { title: '§ 5. Повторение', problems: makeProblems(156, 170, 134) },
]

// ────────────────────────────────────────────────────
// All books
// ────────────────────────────────────────────────────
export const gdzBooks: GdzBook[] = [
  // ── Math 6 ──
  {
    slug: 'vilenkin',
    klass: 6,
    subjectSlug: 'matematika',
    subject: 'Математика',
    authors: 'Виленкин Н. Я., Жохов В. И.',
    type: 'Учебник',
    years: '2020–2023',
    publisher: 'Мнемозина',
    fgos: true,
    parts: '1, 2',
    chapters: vilenkin6Chapters,
  },
  {
    slug: 'merzlyak',
    klass: 6,
    subjectSlug: 'matematika',
    subject: 'Математика',
    authors: 'Мерзляк А. Г., Полонский В. Б., Якир М. С.',
    type: 'Учебник',
    years: '2019–2023',
    publisher: 'Вентана-Граф',
    fgos: true,
    parts: '1, 2',
    chapters: merzlyak6ChaptersFull,
  },
  // ── Algebra 7 ──
  {
    slug: 'makarychev',
    klass: 7,
    subjectSlug: 'algebra',
    subject: 'Алгебра',
    authors: 'Макарычев Ю. Н., Миндюк Н. Г., Нешков К. И., Феоктистов И. Е.',
    type: 'Учебник',
    years: '2020–2023',
    publisher: 'Просвещение',
    fgos: true,
    parts: '1',
    chapters: makarychev7ChaptersFull,
  },
  // ── Geometry 7 ──
  {
    slug: 'atanasyan',
    klass: 7,
    subjectSlug: 'geometriya',
    subject: 'Геометрия',
    authors: 'Атанасян Л. С., Бутузов В. Ф., Кадомцев С. Б.',
    type: 'Учебник',
    years: '2020–2023',
    publisher: 'Просвещение',
    fgos: true,
    parts: '1',
    chapters: atanasyan7ChaptersFull,
  },
  // ── Russian 6 ──
  {
    slug: 'ladyzhenskaya',
    klass: 6,
    subjectSlug: 'russkiy-yazyk',
    subject: 'Русский язык',
    authors: 'Ладыженская Т. А., Баранов М. Т., Тростенцова Л. А.',
    type: 'Учебник',
    years: '2019–2023',
    publisher: 'Просвещение',
    fgos: true,
    parts: '1, 2',
    chapters: ladyzhenskaya6Chapters,
  },
  // ── Grade 5 ──
  {
    slug: 'vilenkin-5',
    klass: 5,
    subjectSlug: 'matematika',
    subject: 'Математика',
    authors: 'Виленкин Н. Я., Жохов В. И.',
    type: 'Учебник',
    years: '2020–2023',
    publisher: 'Мнемозина',
    fgos: true,
    parts: '1, 2',
    chapters: vilenkin5Chapters,
  },
  {
    slug: 'merzlyak-5',
    klass: 5,
    subjectSlug: 'matematika',
    subject: 'Математика',
    authors: 'Мерзляк А. Г., Полонский В. Б., Якир М. С.',
    type: 'Учебник',
    years: '2019–2023',
    publisher: 'Вентана-Граф',
    fgos: true,
    parts: '1, 2',
    chapters: merzlyak5Chapters,
  },
  {
    slug: 'baranov',
    klass: 5,
    subjectSlug: 'russkiy-yazyk',
    subject: 'Русский язык',
    authors: 'Баранов М. Т., Ладыженская Т. А., Тростенцова Л. А.',
    type: 'Учебник',
    years: '2019–2023',
    publisher: 'Просвещение',
    fgos: true,
    parts: '1, 2',
    chapters: baranov5Chapters,
  },
  // ── Grade 6 ──
  {
    slug: 'spotlight',
    klass: 6,
    subjectSlug: 'angliiskiy-yazyk',
    subject: 'Английский язык',
    authors: 'Ваулина Ю. Е., Дули Д., Эванс В.',
    type: 'Учебник',
    years: '2020–2023',
    publisher: 'Просвещение',
    fgos: true,
    parts: '1',
    chapters: spotlight6Chapters,
  },
  // ── Grade 7 ──
  {
    slug: 'merzlyak-7',
    klass: 7,
    subjectSlug: 'algebra',
    subject: 'Алгебра',
    authors: 'Мерзляк А. Г., Полонский В. Б., Якир М. С.',
    type: 'Учебник',
    years: '2019–2023',
    publisher: 'Вентана-Граф',
    fgos: true,
    parts: '1',
    chapters: merzlyak7Chapters,
  },
  {
    slug: 'peryshkin',
    klass: 7,
    subjectSlug: 'fizika',
    subject: 'Физика',
    authors: 'Пёрышкин А. В.',
    type: 'Учебник',
    years: '2020–2023',
    publisher: 'Дрофа',
    fgos: true,
    parts: '1',
    chapters: peryshkin7Chapters,
  },
  {
    slug: 'ladyzhenskaya-7',
    klass: 7,
    subjectSlug: 'russkiy-yazyk',
    subject: 'Русский язык',
    authors: 'Ладыженская Т. А., Баранов М. Т., Тростенцова Л. А.',
    type: 'Учебник',
    years: '2019–2023',
    publisher: 'Просвещение',
    fgos: true,
    parts: '1, 2',
    chapters: ladyzhenskaya7Chapters,
  },
  // ── Grade 8 ──
  {
    slug: 'makarychev-8',
    klass: 8,
    subjectSlug: 'algebra',
    subject: 'Алгебра',
    authors: 'Макарычев Ю. Н., Миндюк Н. Г., Нешков К. И., Феоктистов И. Е.',
    type: 'Учебник',
    years: '2020–2023',
    publisher: 'Просвещение',
    fgos: true,
    parts: '1',
    chapters: makarychev8Chapters,
  },
  {
    slug: 'merzlyak-8',
    klass: 8,
    subjectSlug: 'algebra',
    subject: 'Алгебра',
    authors: 'Мерзляк А. Г., Полонский В. Б., Якир М. С.',
    type: 'Учебник',
    years: '2019–2023',
    publisher: 'Вентана-Граф',
    fgos: true,
    parts: '1',
    chapters: merzlyak8Chapters,
  },
  {
    slug: 'atanasyan-8',
    klass: 8,
    subjectSlug: 'geometriya',
    subject: 'Геометрия',
    authors: 'Атанасян Л. С., Бутузов В. Ф., Кадомцев С. Б.',
    type: 'Учебник',
    years: '2020–2023',
    publisher: 'Просвещение',
    fgos: true,
    parts: '1',
    chapters: atanasyan8Chapters,
  },
  {
    slug: 'ladyzhenskaya-8',
    klass: 8,
    subjectSlug: 'russkiy-yazyk',
    subject: 'Русский язык',
    authors: 'Ладыженская Т. А., Баранов М. Т., Тростенцова Л. А.',
    type: 'Учебник',
    years: '2019–2023',
    publisher: 'Просвещение',
    fgos: true,
    parts: '1, 2',
    chapters: ladyzhenskaya8Chapters,
  },
  {
    slug: 'peryshkin-8',
    klass: 8,
    subjectSlug: 'fizika',
    subject: 'Физика',
    authors: 'Пёрышкин А. В.',
    type: 'Учебник',
    years: '2020–2023',
    publisher: 'Дрофа',
    fgos: true,
    parts: '1',
    chapters: peryshkin8Chapters,
  },
  // ── Grade 9 ──
  {
    slug: 'makarychev-9',
    klass: 9,
    subjectSlug: 'algebra',
    subject: 'Алгебра',
    authors: 'Макарычев Ю. Н., Миндюк Н. Г., Нешков К. И., Феоктистов И. Е.',
    type: 'Учебник',
    years: '2020–2023',
    publisher: 'Просвещение',
    fgos: true,
    parts: '1',
    chapters: makarychev9Chapters,
  },
  {
    slug: 'merzlyak-9',
    klass: 9,
    subjectSlug: 'algebra',
    subject: 'Алгебра',
    authors: 'Мерзляк А. Г., Полонский В. Б., Якир М. С.',
    type: 'Учебник',
    years: '2019–2023',
    publisher: 'Вентана-Граф',
    fgos: true,
    parts: '1',
    chapters: merzlyak9Chapters,
  },
  {
    slug: 'atanasyan-9',
    klass: 9,
    subjectSlug: 'geometriya',
    subject: 'Геометрия',
    authors: 'Атанасян Л. С., Бутузов В. Ф., Кадомцев С. Б.',
    type: 'Учебник',
    years: '2020–2023',
    publisher: 'Просвещение',
    fgos: true,
    parts: '1',
    chapters: atanasyan9Chapters,
  },
]

// ────────────────────────────────────────────────────
// Helper functions
// ────────────────────────────────────────────────────

export function getGdzSubjects(klass: number): GdzSubject[] {
  return gdzSubjectsByClass[klass] ?? []
}

export function getGdzBooks(klass: number, subjectSlug: string): GdzBook[] {
  return gdzBooks.filter(b => b.klass === klass && b.subjectSlug === subjectSlug)
}

export function getGdzBook(klass: number, subjectSlug: string, bookSlug: string): GdzBook | undefined {
  return gdzBooks.find(b => b.klass === klass && b.subjectSlug === subjectSlug && b.slug === bookSlug)
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
