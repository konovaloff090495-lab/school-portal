'use client'

import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { schools } from '@/data/schools'

// ─── Типы ────────────────────────────────────────────────────────────────────

interface QuizAnswers {
  city?: string        // RegionSlug
  cityLabel?: string
  type?: string        // SchoolType slug
  typeLabel?: string
  grade?: string
  feature?: string
}

// ─── Шаги ────────────────────────────────────────────────────────────────────

const STEPS = [
  {
    id: 'city',
    title: 'В каком городе ищете школу?',
    emoji: '🏙️',
    options: [
      { value: 'moskva',          label: 'Москва',              emoji: '🏛️' },
      { value: 'sankt-peterburg', label: 'Санкт-Петербург',     emoji: '🌊' },
      { value: 'novosibirsk',     label: 'Новосибирск',         emoji: '❄️' },
      { value: 'ekaterinburg',    label: 'Екатеринбург',        emoji: '⛰️' },
      { value: 'kazan',           label: 'Казань',              emoji: '🕌' },
      { value: 'nizhniy-novgorod',label: 'Нижний Новгород',     emoji: '🏘️' },
      { value: 'krasnodar',       label: 'Краснодар',           emoji: '🌞' },
      { value: 'other',           label: 'Другой город',        emoji: '📍' },
    ],
  },
  {
    id: 'type',
    title: 'Какой тип школы интересует?',
    emoji: '🏫',
    options: [
      { value: 'gosudarstvennye', label: 'Государственная',     emoji: '🏛️', hint: 'бесплатно' },
      { value: 'gimnazii',        label: 'Гимназия или лицей',  emoji: '🎓', hint: 'углублённые программы' },
      { value: 'chastnie',        label: 'Частная школа',       emoji: '⭐', hint: 'малые классы' },
      { value: 'online',          label: 'Онлайн-школа',        emoji: '💻', hint: 'из любой точки' },
      { value: 'pri-vuzakh',      label: 'При университете',    emoji: '🔬', hint: 'ранний старт' },
      { value: 'any',             label: 'Не принципиально',    emoji: '🤷', hint: '' },
    ],
  },
  {
    id: 'grade',
    title: 'В каком классе ребёнок?',
    emoji: '👧',
    options: [
      { value: '1-4',  label: '1–4 класс',   emoji: '🌱', hint: 'начальная школа' },
      { value: '5-9',  label: '5–9 класс',   emoji: '📚', hint: 'средняя школа' },
      { value: '10-11',label: '10–11 класс', emoji: '🎯', hint: 'подготовка к ЕГЭ' },
      { value: 'any',  label: 'Ещё не решили', emoji: '💭', hint: '' },
    ],
  },
  {
    id: 'feature',
    title: 'Что важнее всего?',
    emoji: '✨',
    options: [
      { value: 'ege',       label: 'Высокий рейтинг ЕГЭ', emoji: '📈', hint: '' },
      { value: 'languages', label: 'Иностранные языки',    emoji: '🇬🇧', hint: '' },
      { value: 'it',        label: 'IT и технологии',      emoji: '💻', hint: '' },
      { value: 'sport',     label: 'Спорт и активности',   emoji: '🏃', hint: '' },
      { value: 'prodlyonka',label: 'Группа продлёнки',     emoji: '🕐', hint: '' },
      { value: 'price',     label: 'Доступная цена',       emoji: '💰', hint: '' },
    ],
  },
]

const TOTAL = STEPS.length

// ─── URL-логика ───────────────────────────────────────────────────────────────

function buildUrl(answers: QuizAnswers): string {
  const { city, type, feature } = answers

  // Если «другой город» или не выбран город — идём в общий каталог
  const region = city && city !== 'other' ? city : null
  const typeSlug = type && type !== 'any' ? type : null

  // Маппинг фичи на страницу особенностей
  const featurePageMap: Record<string, string> = {
    it:        '/shkoly/osobennosti/it-klass/',
    prodlyonka:'/shkoly/osobennosti/prodlyonka/',
    languages: '/shkoly/osobennosti/uglublenny-anglijskij/',
    ege:       '/shkoly/moskva/gosudarstvennye/', // рейтинг ЕГЭ → гос.
  }

  // Если выбрана фича и нет конкретного типа и есть Москва → страница особенности
  if (feature && featurePageMap[feature] && !typeSlug && region === 'moskva') {
    return featurePageMap[feature]
  }

  if (region && typeSlug) return `/shkoly/${region}/${typeSlug}/`
  if (region)             return `/shkoly/${region}/`
  if (typeSlug)           return `/shkoly/${typeSlug}/` // fallback (маловероятно)
  return '/shkoly/'
}

// Считаем школы по ответам для финального экрана
function countMatching(answers: QuizAnswers): number {
  const { city, type } = answers
  const region = city && city !== 'other' ? city : null
  const typeSlug = type && type !== 'any' ? type : null
  return schools.filter(s =>
    (!region || s.region === region) &&
    (!typeSlug || s.type === typeSlug)
  ).length
}

// ─── Компонент ───────────────────────────────────────────────────────────────

export default function SchoolQuiz() {
  const [open, setOpen]       = useState(false)
  const [step, setStep]       = useState(0)
  const [answers, setAnswers] = useState<QuizAnswers>({})
  const [done, setDone]       = useState(false)
  const router                = useRouter()

  // Закрытие по Escape
  useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') closeQuiz() }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [open])

  // Блокируем скролл body пока открыт
  useEffect(() => {
    document.body.style.overflow = open ? 'hidden' : ''
    return () => { document.body.style.overflow = '' }
  }, [open])

  function openQuiz() {
    setStep(0); setAnswers({}); setDone(false); setOpen(true)
  }

  const closeQuiz = useCallback(() => {
    setOpen(false)
  }, [])

  function pick(key: keyof QuizAnswers, value: string, label: string) {
    const next: QuizAnswers = { ...answers, [key]: value }
    if (key === 'city') next.cityLabel = label
    if (key === 'type') next.typeLabel = label
    setAnswers(next)

    if (step < TOTAL - 1) {
      setTimeout(() => setStep(s => s + 1), 150)
    } else {
      setTimeout(() => setDone(true), 150)
    }
  }

  function goBack() {
    if (step > 0) setStep(s => s - 1)
  }

  function goToCatalog() {
    const url = buildUrl(answers)
    closeQuiz()
    router.push(url)
  }

  const currentStep = STEPS[step]
  const matchCount  = done ? countMatching(answers) : 0
  const progressPct = done ? 100 : ((step) / TOTAL) * 100

  if (!open) {
    return (
      <button
        onClick={openQuiz}
        className="hero-btn-primary"
        style={{
          display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 8,
          background: '#1A1814', color: '#fff',
          borderRadius: 999,
          fontFamily: 'var(--font-manrope, sans-serif)',
          fontWeight: 700, textDecoration: 'none', border: 'none', cursor: 'pointer',
          boxShadow: '0 4px 0 #000, 0 12px 32px rgba(0,0,0,0.25)',
          whiteSpace: 'nowrap',
        }}
      >
        Подобрать школу за 2 мин →
      </button>
    )
  }

  return (
    <>
      {/* Backdrop */}
      <div
        onClick={closeQuiz}
        style={{
          position: 'fixed', inset: 0, zIndex: 200,
          background: 'rgba(15,23,42,0.7)',
          backdropFilter: 'blur(6px)',
          WebkitBackdropFilter: 'blur(6px)',
        }}
      />

      {/* Modal */}
      <div
        style={{
          position: 'fixed', inset: 0, zIndex: 201,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          padding: '16px',
          pointerEvents: 'none',
        }}
      >
        <div
          style={{
            background: '#fff',
            borderRadius: 24,
            width: '100%', maxWidth: 520,
            boxShadow: '0 24px 80px rgba(0,0,0,0.25)',
            overflow: 'hidden',
            pointerEvents: 'all',
            animation: 'quizPop 0.25s cubic-bezier(.22,.68,0,1.2) forwards',
          }}
          onClick={e => e.stopPropagation()}
        >
          <style>{`
            @keyframes quizPop {
              from { transform: scale(0.92) translateY(12px); opacity: 0; }
              to   { transform: scale(1) translateY(0); opacity: 1; }
            }
            .quiz-option:hover { border-color: #FF6B3D !important; background: #FFF5F2 !important; }
            .quiz-option:hover .quiz-option-emoji { transform: scale(1.15); }
            .quiz-option-emoji { transition: transform 0.15s; }
          `}</style>

          {/* Progress bar */}
          <div style={{ height: 4, background: '#F1F5F9' }}>
            <div style={{
              height: '100%',
              width: `${progressPct}%`,
              background: 'linear-gradient(90deg, #FF6B3D, #FF8B5A)',
              transition: 'width 0.3s ease',
              borderRadius: '0 2px 2px 0',
            }} />
          </div>

          <div style={{ padding: '28px 28px 32px', fontFamily: 'var(--font-manrope, system-ui)' }}>
            {/* Header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 24 }}>
              <div>
                {!done && (
                  <p style={{ fontSize: 12, color: '#94A3B8', fontWeight: 600, marginBottom: 4, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                    Шаг {step + 1} из {TOTAL}
                  </p>
                )}
                <h2 style={{ fontSize: 20, fontWeight: 800, color: '#1A1814', margin: 0, lineHeight: 1.3, fontFamily: 'var(--font-unbounded, sans-serif)' }}>
                  {done ? '🎉 Готово!' : currentStep.emoji + ' ' + currentStep.title}
                </h2>
              </div>
              <button
                onClick={closeQuiz}
                aria-label="Закрыть"
                style={{
                  background: '#F1F5F9', border: 'none', borderRadius: 999,
                  width: 32, height: 32, cursor: 'pointer', fontSize: 16,
                  color: '#64748B', display: 'flex', alignItems: 'center', justifyContent: 'center',
                  flexShrink: 0, marginLeft: 12,
                }}
              >
                ×
              </button>
            </div>

            {/* Финальный экран */}
            {done ? (
              <div style={{ textAlign: 'center' }}>
                <div style={{
                  background: 'linear-gradient(135deg, #FFF5F2, #FFF)',
                  border: '2px solid #FF6B3D',
                  borderRadius: 16, padding: '24px 16px', marginBottom: 20,
                }}>
                  <div style={{ fontSize: 48, fontWeight: 900, color: '#FF6B3D', lineHeight: 1, fontFamily: 'var(--font-unbounded)' }}>
                    {matchCount}
                  </div>
                  <div style={{ fontSize: 14, color: '#64748B', marginTop: 4 }}>
                    {matchCount === 1 ? 'школа подходит' : matchCount < 5 ? 'школы подходят' : 'школ подходят'} вашим критериям
                  </div>
                </div>

                <div style={{ marginBottom: 20, textAlign: 'left', fontSize: 14, color: '#374151' }}>
                  <p style={{ margin: '0 0 8px', fontWeight: 600 }}>Ваши критерии:</p>
                  {answers.cityLabel && (
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 4 }}>
                      <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#FF6B3D', flexShrink: 0 }} />
                      Город: <strong>{answers.cityLabel}</strong>
                    </div>
                  )}
                  {answers.typeLabel && answers.type !== 'any' && (
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 4 }}>
                      <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#FF6B3D', flexShrink: 0 }} />
                      Тип: <strong>{answers.typeLabel}</strong>
                    </div>
                  )}
                  {answers.grade && answers.grade !== 'any' && (
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                      <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#FF6B3D', flexShrink: 0 }} />
                      Класс: <strong>{answers.grade}</strong>
                    </div>
                  )}
                </div>

                <button
                  onClick={goToCatalog}
                  style={{
                    width: '100%', padding: '14px 24px',
                    background: 'linear-gradient(90deg, #FF6B3D, #FF8B5A)',
                    color: '#fff', border: 'none', borderRadius: 12,
                    fontSize: 15, fontWeight: 700, cursor: 'pointer',
                    boxShadow: '0 4px 0 #e5532b, 0 8px 24px rgba(255,107,61,0.3)',
                    fontFamily: 'var(--font-manrope)',
                    letterSpacing: '-0.01em',
                  }}
                >
                  Смотреть {matchCount} {matchCount === 1 ? 'школу' : matchCount < 5 ? 'школы' : 'школ'} →
                </button>
                <button
                  onClick={closeQuiz}
                  style={{
                    marginTop: 10, width: '100%', padding: '10px',
                    background: 'transparent', border: 'none',
                    color: '#94A3B8', fontSize: 13, cursor: 'pointer',
                    fontFamily: 'var(--font-manrope)',
                  }}
                >
                  Закрыть
                </button>
              </div>
            ) : (
              /* Опции шага */
              <>
                <div style={{
                  display: 'grid',
                  gridTemplateColumns: currentStep.options.length > 4 ? '1fr 1fr' : '1fr 1fr',
                  gap: 10,
                  marginBottom: 20,
                }}>
                  {currentStep.options.map(opt => (
                    <button
                      key={opt.value}
                      className="quiz-option"
                      onClick={() => pick(currentStep.id as keyof QuizAnswers, opt.value, opt.label)}
                      style={{
                        background: '#fff', border: '1.5px solid #E2E8F0',
                        borderRadius: 12, padding: '12px 14px',
                        cursor: 'pointer', textAlign: 'left',
                        transition: 'border-color 0.12s, background 0.12s',
                        fontFamily: 'var(--font-manrope)',
                      }}
                    >
                      <div className="quiz-option-emoji" style={{ fontSize: 24, marginBottom: 4, display: 'block' }}>
                        {opt.emoji}
                      </div>
                      <div style={{ fontSize: 13, fontWeight: 700, color: '#1A1814', lineHeight: 1.3 }}>
                        {opt.label}
                      </div>
                      {'hint' in opt && opt.hint && (
                        <div style={{ fontSize: 11, color: '#94A3B8', marginTop: 2 }}>
                          {opt.hint}
                        </div>
                      )}
                    </button>
                  ))}
                </div>

                {/* Back / Skip */}
                <div style={{ display: 'flex', gap: 8 }}>
                  {step > 0 && (
                    <button
                      onClick={goBack}
                      style={{
                        flex: 1, padding: '10px 16px',
                        background: '#F8FAFC', border: '1px solid #E2E8F0',
                        borderRadius: 10, color: '#64748B', fontSize: 13,
                        fontWeight: 600, cursor: 'pointer',
                        fontFamily: 'var(--font-manrope)',
                      }}
                    >
                      ← Назад
                    </button>
                  )}
                  <button
                    onClick={() => pick(currentStep.id as keyof QuizAnswers, 'any', 'Любой')}
                    style={{
                      flex: 1, padding: '10px 16px',
                      background: '#F8FAFC', border: '1px solid #E2E8F0',
                      borderRadius: 10, color: '#94A3B8', fontSize: 13,
                      fontWeight: 500, cursor: 'pointer',
                      fontFamily: 'var(--font-manrope)',
                    }}
                  >
                    Пропустить
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </>
  )
}
