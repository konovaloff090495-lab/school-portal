'use client'
import { useState } from 'react'
import { School } from '@/data/schools'

// ── Типы ─────────────────────────────────────────────────────────────────────
type Answers = Record<number, string>

interface Question {
  id: number
  text: string
  sub?: string
  options: { value: string; label: string; emoji: string }[]
}

// ── Вопросы ───────────────────────────────────────────────────────────────────
const QUESTIONS: Question[] = [
  {
    id: 0,
    text: 'В каком классе ребёнок?',
    sub: 'Это поможет проверить, работает ли школа с нужными ступенями',
    options: [
      { value: '1-4',  emoji: '📚', label: '1–4 класс (начальная)' },
      { value: '5-9',  emoji: '📖', label: '5–9 класс (основная)' },
      { value: '10-11',emoji: '🎓', label: '10–11 класс (старшая)' },
    ],
  },
  {
    id: 1,
    text: 'Как бы вы описали характер ребёнка?',
    sub: 'Не нужно точного ответа — выберите ближайшее',
    options: [
      { value: 'active',  emoji: '⚡', label: 'Активный, любит общение и движение' },
      { value: 'quiet',   emoji: '🎯', label: 'Спокойный, сосредоточенный, вдумчивый' },
      { value: 'mixed',   emoji: '🌊', label: 'Зависит от ситуации' },
    ],
  },
  {
    id: 2,
    text: 'Что больше всего увлекает ребёнка?',
    sub: 'Если несколько интересов — выберите главный',
    options: [
      { value: 'tech',      emoji: '💻', label: 'IT, математика, точные науки' },
      { value: 'languages', emoji: '🌍', label: 'Языки, гуманитарные предметы' },
      { value: 'sports',    emoji: '⚽', label: 'Спорт, физическая активность' },
      { value: 'creative',  emoji: '🎨', label: 'Творчество, искусство, музыка' },
      { value: 'open',      emoji: '🔍', label: 'Ещё не определился' },
    ],
  },
  {
    id: 3,
    text: 'Какой формат обучения предпочтительнее?',
    options: [
      { value: 'class',    emoji: '🏫', label: 'Очно в классе' },
      { value: 'online',   emoji: '💻', label: 'Онлайн или дистанционно' },
      { value: 'boarding', emoji: '🏡', label: 'С проживанием в пансионе' },
    ],
  },
  {
    id: 4,
    text: 'Какой бюджет рассматриваете?',
    options: [
      { value: 'free', emoji: '🆓', label: 'Бесплатное обучение' },
      { value: '25k',  emoji: '💰', label: 'До 25 000 ₽ в месяц' },
      { value: '70k',  emoji: '💎', label: 'До 70 000 ₽ в месяц' },
      { value: 'any',  emoji: '🚀', label: 'Бюджет не ограничен' },
    ],
  },
  {
    id: 5,
    text: 'Что для вас важнее всего?',
    sub: 'Главный приоритет при выборе школы',
    options: [
      { value: 'ege',            emoji: '📊', label: 'Высокие баллы ЕГЭ / ОГЭ' },
      { value: 'development',    emoji: '🌱', label: 'Развитие личности и таланта' },
      { value: 'specialization', emoji: '🎯', label: 'Глубокая специализация' },
      { value: 'values',         emoji: '💫', label: 'Воспитание и ценности' },
    ],
  },
]

// ── Логика оценки совместимости ───────────────────────────────────────────────
function parseGradeRange(grades: string): [number, number] {
  const clean = grades.replace(/\s/g, '').replace('–', '-').replace('—', '-')
  const m = clean.match(/(\d+)-(\d+)/)
  if (m) return [parseInt(m[1]), parseInt(m[2])]
  const single = parseInt(clean)
  if (!isNaN(single)) return [single, single]
  return [1, 11]
}

function gradeScore(grades: string, answer: string): number {
  const [from, to] = parseGradeRange(grades)
  if (answer === '1-4')  { if (from <= 4) return 20; if (to >= 1 && from <= 4) return 10; return -15 }
  if (answer === '5-9')  { if (from <= 5 && to >= 9) return 20; if (to >= 5) return 10; return -15 }
  if (answer === '10-11'){ if (to >= 10) return 20; return -15 }
  return 0
}

function characterScore(type: string, answer: string): number {
  const activeTypes = ['kadetskie', 'sportivnye', 'semejnye', 'mezhdunarodnie', 'profilnye']
  const quietTypes  = ['online', 'eksternal', 'domashnie', 'montessori', 'shahmatnye', 'profilnye']
  if (answer === 'active') {
    if (activeTypes.includes(type)) return 15
    if (quietTypes.includes(type))  return -8
    return 8
  }
  if (answer === 'quiet') {
    if (quietTypes.includes(type))  return 15
    if (activeTypes.includes(type)) return -5
    return 8
  }
  return 8 // mixed → neutral
}

function interestScore(school: School, answer: string): number {
  const t = school.type
  const hay = [school.name, school.description, ...school.features].join(' ').toLowerCase()
  if (answer === 'tech') {
    if (['programmirovanie', 'shahmatnye'].includes(t)) return 20
    if (['profilnye', 'pri-vuzakh', 'online'].includes(t)) return 14
    if (hay.includes('it') || hay.includes('программ') || hay.includes('математ')) return 12
    if (['gosudarstvennye', 'chastnie', 'gimnazii'].includes(t)) return 8
    return 4
  }
  if (answer === 'languages') {
    if (['yazykovye', 'mezhdunarodnie'].includes(t)) return 20
    if (['gimnazii'].includes(t)) return 15
    if (hay.includes('язык') || hay.includes('английск') || hay.includes('лингв')) return 12
    return 6
  }
  if (answer === 'sports') {
    if (['sportivnye', 'kadetskie'].includes(t)) return 20
    if (['semejnye'].includes(t)) return 10
    if (hay.includes('спорт') || hay.includes('физ')) return 8
    return 4
  }
  if (answer === 'creative') {
    if (['valdorfskie', 'montessori'].includes(t)) return 20
    if (['semejnye', 'chastnie'].includes(t)) return 12
    if (hay.includes('творч') || hay.includes('искусств') || hay.includes('музык')) return 12
    return 6
  }
  // open/undecided
  if (['gosudarstvennye', 'chastnie'].includes(t)) return 14
  if (['gimnazii', 'online'].includes(t)) return 10
  return 8
}

function formatScore(school: School, answer: string): number {
  const t = school.type
  if (answer === 'online') {
    if (['online', 'eksternal'].includes(t)) return 20
    if (['domashnie', 'vechernie'].includes(t)) return 12
    return -8
  }
  if (answer === 'boarding') {
    if (['internaty'].includes(t)) return 20
    if (school.boarding) return 18
    if (['kadetskie'].includes(t)) return 14
    return -5
  }
  // class (очно)
  if (['online', 'domashnie'].includes(t)) return -10
  if (['eksternal'].includes(t)) return -5
  return 15
}

function budgetScore(priceFrom: number | undefined, answer: string): number {
  const price = priceFrom ?? 0
  if (answer === 'free') {
    if (price === 0) return 15
    if (price <= 10000) return 5
    return -15
  }
  if (answer === '25k') {
    if (price === 0) return 12
    if (price <= 25000) return 15
    if (price <= 50000) return -5
    return -12
  }
  if (answer === '70k') {
    if (price <= 70000) return 15
    if (price <= 100000) return 5
    return -8
  }
  return 15 // any budget
}

function priorityScore(school: School, answer: string): number {
  const t = school.type
  const hay = [school.description, ...school.features].join(' ').toLowerCase()
  if (answer === 'ege') {
    if (['podgotovka-ege', 'podgotovka-oge'].includes(t)) return 14
    if (['profilnye', 'pri-vuzakh', 'gimnazia'].includes(t)) return 12
    if (['gimnazii'].includes(t)) return 12
    if (hay.includes('егэ') || hay.includes('огэ') || hay.includes('олимпиад')) return 10
    return 5
  }
  if (answer === 'development') {
    if (['valdorfskie', 'montessori', 'semejnye'].includes(t)) return 14
    if (['chastnie', 'domashnie'].includes(t)) return 10
    return 6
  }
  if (answer === 'specialization') {
    if (['programmirovanie', 'yazykovye', 'sportivnye', 'shahmatnye'].includes(t)) return 14
    if (['profilnye', 'mezhdunarodnie'].includes(t)) return 12
    return 5
  }
  if (answer === 'values') {
    if (['pravoslavnye', 'kadetskie'].includes(t)) return 14
    if (['semejnye', 'domashnie', 'valdorfskie'].includes(t)) return 10
    return 4
  }
  return 6
}

function computeMatch(school: School, answers: Answers): number {
  const raw =
    gradeScore(school.grades, answers[0] ?? '5-9') +
    characterScore(school.type, answers[1] ?? 'mixed') +
    interestScore(school, answers[2] ?? 'open') +
    formatScore(school, answers[3] ?? 'class') +
    budgetScore(school.priceFrom, answers[4] ?? 'any') +
    priorityScore(school, answers[5] ?? 'development')

  // Нормализуем: теоретический max ≈ 99 (20+15+20+20+15+14 - небольшие бонусы)
  const normalized = Math.round((raw / 99) * 100)
  return Math.max(10, Math.min(98, normalized))
}

function matchLabel(pct: number): { text: string; color: string; bg: string; border: string } {
  if (pct >= 80) return { text: 'Отличное совпадение', color: '#16A34A', bg: '#F0FDF4', border: '#BBF7D0' }
  if (pct >= 60) return { text: 'Хорошее совпадение',  color: '#0369A1', bg: '#EFF6FF', border: '#BFDBFE' }
  if (pct >= 40) return { text: 'Частичное совпадение', color: '#D97706', bg: '#FFFBEB', border: '#FDE68A' }
  return           { text: 'Слабое совпадение',     color: '#DC2626', bg: '#FFF7F7', border: '#FECACA' }
}

function matchReasons(school: School, answers: Answers, pct: number): string[] {
  const reasons: string[] = []
  const t = school.type

  // Grade
  const [gFrom, gTo] = parseGradeRange(school.grades)
  const gradeMap: Record<string, [number, number]> = { '1-4': [1,4], '5-9': [5,9], '10-11': [10,11] }
  const [uFrom, uTo] = gradeMap[answers[0]] ?? [1,11]
  if (gFrom <= uTo && gTo >= uFrom) {
    reasons.push(`✅ Обучает нужные классы (${school.grades})`)
  } else {
    reasons.push(`⚠️ Классы школы (${school.grades}) не совпадают с вашим запросом`)
  }

  // Format
  if (answers[3] === 'online' && ['online','eksternal'].includes(t))
    reasons.push('✅ Дистанционный формат — то, что нужно')
  if (answers[3] === 'boarding' && (t === 'internaty' || school.boarding))
    reasons.push('✅ Предлагает проживание и пансион')

  // Budget
  const price = school.priceFrom ?? 0
  const budgetOk =
    (answers[4] === 'free' && price === 0) ||
    (answers[4] === '25k'  && price <= 25000) ||
    (answers[4] === '70k'  && price <= 70000) ||
    answers[4] === 'any'
  if (budgetOk) reasons.push('✅ Стоимость соответствует вашему бюджету')
  else reasons.push('⚠️ Стоимость обучения может быть выше ожиданий')

  // Interest
  if (answers[2] === 'tech' && ['programmirovanie','shahmatnye','profilnye'].includes(t))
    reasons.push('✅ Специализируется на точных науках и IT')
  if (answers[2] === 'languages' && ['yazykovye','mezhdunarodnie'].includes(t))
    reasons.push('✅ Языковая специализация — сильная сторона школы')
  if (answers[2] === 'sports' && ['sportivnye','kadetskie'].includes(t))
    reasons.push('✅ Спорт — ключевое направление этой школы')
  if (answers[2] === 'creative' && ['valdorfskie','montessori'].includes(t))
    reasons.push('✅ Творческая педагогика — основа подхода')

  // Priority
  if (answers[5] === 'ege' && ['podgotovka-ege','podgotovka-oge','profilnye','pri-vuzakh'].includes(t))
    reasons.push('✅ Ориентирована на подготовку к экзаменам')
  if (answers[5] === 'development' && ['valdorfskie','montessori','semejnye'].includes(t))
    reasons.push('✅ Ставит развитие личности выше оценок')
  if (answers[5] === 'values' && ['pravoslavnye','kadetskie'].includes(t))
    reasons.push('✅ Воспитание и ценности — неотъемлемая часть программы')

  return reasons.slice(0, 4)
}

// ── Основной компонент ────────────────────────────────────────────────────────
export default function SchoolMatchModal({ school }: { school: School }) {
  const [open, setOpen] = useState(false)
  const [step, setStep] = useState(0) // 0..QUESTIONS.length = result
  const [answers, setAnswers] = useState<Answers>({})
  const [selected, setSelected] = useState<string | null>(null)

  const isResult = step === QUESTIONS.length
  const question = QUESTIONS[step]
  const pct = isResult ? computeMatch(school, answers) : 0
  const label = isResult ? matchLabel(pct) : null
  const reasons = isResult ? matchReasons(school, answers, pct) : []

  const handleOpen = () => {
    setOpen(true)
    setStep(0)
    setAnswers({})
    setSelected(null)
  }
  const handleClose = () => setOpen(false)

  const handleNext = () => {
    if (!selected) return
    const newAnswers = { ...answers, [step]: selected }
    setAnswers(newAnswers)
    setSelected(null)
    setStep(s => s + 1)
  }

  const handleRestart = () => {
    setStep(0)
    setAnswers({})
    setSelected(null)
  }

  return (
    <>
      {/* Кнопка-триггер */}
      <button
        onClick={handleOpen}
        className="w-full mt-3 py-2.5 px-4 rounded-xl border-2 border-dashed border-[#FF6B3D]/40 text-[#FF6B3D] text-xs font-semibold
          hover:bg-[#FFF3EE] hover:border-[#FF6B3D] transition-all duration-200 flex items-center justify-center gap-2"
      >
        <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
          <path d="M9.879 7.519c1.171-1.025 3.071-1.025 4.242 0 1.172 1.025 1.172 2.687 0 3.712-.203.179-.43.326-.67.442-.745.361-1.45.999-1.45 1.827v.75" />
          <circle cx="12" cy="17.5" r=".5" fill="currentColor" stroke="none" />
          <circle cx="12" cy="12" r="9" />
        </svg>
        Подходит ли эта школа?
      </button>

      {/* Модалка */}
      {open && (
        <div
          className="fixed inset-0 z-[200] flex items-end sm:items-center justify-center p-0 sm:p-4"
          style={{ background: 'rgba(15,23,42,0.55)', backdropFilter: 'blur(4px)' }}
          onClick={e => { if (e.target === e.currentTarget) handleClose() }}
        >
          <div
            className="bg-white w-full sm:max-w-lg sm:rounded-2xl rounded-t-3xl shadow-2xl overflow-hidden"
            style={{ maxHeight: '92dvh', overflowY: 'auto' }}
          >
            {/* Шапка */}
            <div className="sticky top-0 bg-white border-b border-gray-100 px-5 py-4 flex items-center justify-between z-10">
              <div>
                <p className="text-xs text-gray-400 font-medium uppercase tracking-wide">Проверка совместимости</p>
                <p className="text-sm font-semibold text-[#0F172A] line-clamp-1">{school.name}</p>
              </div>
              <button
                onClick={handleClose}
                className="w-8 h-8 flex items-center justify-center rounded-full bg-gray-100 hover:bg-gray-200 transition-colors"
              >
                <svg className="w-4 h-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* Прогресс-бар */}
            {!isResult && (
              <div className="h-1 bg-gray-100">
                <div
                  className="h-1 bg-gradient-to-r from-[#FF6B3D] to-[#FF8B5A] transition-all duration-500"
                  style={{ width: `${(step / QUESTIONS.length) * 100}%` }}
                />
              </div>
            )}

            <div className="p-5">
              {!isResult ? (
                /* ── Вопрос ── */
                <>
                  <p className="text-[11px] text-gray-400 mb-1 font-medium">
                    Вопрос {step + 1} из {QUESTIONS.length}
                  </p>
                  <h3 className="text-lg font-bold text-[#0F172A] mb-1 leading-snug">
                    {question.text}
                  </h3>
                  {question.sub && (
                    <p className="text-xs text-gray-400 mb-4">{question.sub}</p>
                  )}
                  <div className="flex flex-col gap-2.5 mb-6">
                    {question.options.map(opt => (
                      <button
                        key={opt.value}
                        onClick={() => setSelected(opt.value)}
                        className={`flex items-center gap-3 p-3.5 rounded-xl border-2 text-left transition-all duration-150 ${
                          selected === opt.value
                            ? 'border-[#FF6B3D] bg-[#FFF3EE]'
                            : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                        }`}
                      >
                        <span className="text-xl w-8 text-center shrink-0">{opt.emoji}</span>
                        <span className={`text-sm font-medium ${selected === opt.value ? 'text-[#FF6B3D]' : 'text-[#0F172A]'}`}>
                          {opt.label}
                        </span>
                        {selected === opt.value && (
                          <svg className="w-4 h-4 ml-auto text-[#FF6B3D] shrink-0" fill="currentColor" viewBox="0 0 24 24">
                            <path fillRule="evenodd" d="M2.25 12c0-5.385 4.365-9.75 9.75-9.75s9.75 4.365 9.75 9.75-4.365 9.75-9.75 9.75S2.25 17.385 2.25 12zm13.36-1.814a.75.75 0 10-1.22-.872l-3.236 4.53L9.53 12.22a.75.75 0 00-1.06 1.06l2.25 2.25a.75.75 0 001.14-.094l3.75-5.25z" clipRule="evenodd" />
                          </svg>
                        )}
                      </button>
                    ))}
                  </div>
                  <button
                    onClick={handleNext}
                    disabled={!selected}
                    className={`w-full py-3 rounded-xl font-semibold text-sm transition-all duration-200 ${
                      selected
                        ? 'bg-[#FF6B3D] text-white hover:bg-[#E8552A] shadow-md shadow-orange-200'
                        : 'bg-gray-100 text-gray-400 cursor-not-allowed'
                    }`}
                  >
                    {step < QUESTIONS.length - 1 ? 'Следующий вопрос →' : 'Узнать результат →'}
                  </button>
                </>
              ) : (
                /* ── Результат ── */
                <>
                  {/* Процент */}
                  <div
                    className="rounded-2xl p-5 mb-4 text-center"
                    style={{ background: label!.bg, border: `1.5px solid ${label!.border}` }}
                  >
                    {/* Круговой индикатор */}
                    <div className="relative inline-flex items-center justify-center mb-3">
                      <svg className="w-24 h-24 -rotate-90" viewBox="0 0 100 100">
                        <circle cx="50" cy="50" r="42" fill="none" stroke="#E5E7EB" strokeWidth="8" />
                        <circle
                          cx="50" cy="50" r="42" fill="none"
                          stroke={label!.color} strokeWidth="8"
                          strokeLinecap="round"
                          strokeDasharray={`${2 * Math.PI * 42}`}
                          strokeDashoffset={`${2 * Math.PI * 42 * (1 - pct / 100)}`}
                          style={{ transition: 'stroke-dashoffset 1s ease' }}
                        />
                      </svg>
                      <div className="absolute text-center">
                        <span className="text-2xl font-black" style={{ color: label!.color }}>{pct}%</span>
                      </div>
                    </div>
                    <p className="text-base font-bold" style={{ color: label!.color }}>
                      {label!.text}
                    </p>
                    <p className="text-xs text-gray-500 mt-1">
                      {pct >= 70
                        ? 'Школа хорошо соответствует вашим запросам'
                        : pct >= 50
                        ? 'Школа частично соответствует — стоит уточнить детали'
                        : 'Рекомендуем рассмотреть другие варианты в каталоге'}
                    </p>
                  </div>

                  {/* Причины */}
                  {reasons.length > 0 && (
                    <div className="mb-5">
                      <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-2">Почему такой результат</p>
                      <div className="flex flex-col gap-2">
                        {reasons.map((r, i) => (
                          <div key={i} className="text-sm text-[#0F172A] flex items-start gap-2">
                            <span>{r}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* CTA кнопки */}
                  <div className="flex flex-col gap-2.5">
                    <a
                      href={`/shkola/${school.slug}/`}
                      className="w-full py-3 rounded-xl bg-[#0369A1] text-white text-sm font-semibold text-center hover:bg-blue-500 transition-colors"
                    >
                      Открыть страницу школы →
                    </a>
                    {pct < 60 && (
                      <a
                        href="/shkoly/"
                        className="w-full py-3 rounded-xl border border-gray-200 text-[#0F172A] text-sm font-semibold text-center hover:bg-gray-50 transition-colors"
                      >
                        Найти более подходящие школы
                      </a>
                    )}
                    <button
                      onClick={handleRestart}
                      className="w-full py-2.5 rounded-xl text-gray-400 text-xs hover:text-gray-600 transition-colors"
                    >
                      ↺ Пройти тест заново
                    </button>
                  </div>

                  {/* Дисклеймер */}
                  <p className="text-[10px] text-gray-300 text-center mt-4 leading-relaxed">
                    Результат носит информационный характер и основан на ваших ответах.
                    Для точной консультации свяжитесь со школой напрямую.
                  </p>
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  )
}
