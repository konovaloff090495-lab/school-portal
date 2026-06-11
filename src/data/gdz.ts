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
    chapters: merzlyak6Chapters,
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
    chapters: makarychev7Chapters,
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
    chapters: atanasyan7Chapters,
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
  // ── Metadata-only books (empty chapters) ──
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
    chapters: [],
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
    chapters: [],
  },
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
    chapters: [],
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
    chapters: [],
  },
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
    chapters: [],
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
    chapters: [],
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
