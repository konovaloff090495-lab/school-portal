'use client'
import { useState, useEffect } from 'react'
import Link from 'next/link'
import {
  getUser, saveUser, getExpressResult, saveExtendedResult,
  type UserProfile, type ExtendedTestResult,
} from '@/lib/userStorage'

// ── Типы ─────────────────────────────────────────────────────────────────────

type AnswerValue = 'yes' | 'sometimes' | 'no'

interface ExtQuestion {
  id: number
  block: string
  text: string
  dimension: string // что измеряем
  direction: 'positive' | 'negative' // yes = +score или -score
}

// ── 30 вопросов по 5 блокам ──────────────────────────────────────────────────

const QUESTIONS: ExtQuestion[] = [
  // БЛОК 1: Стиль мышления (visual/analytical/creative)
  { id: 0,  block: 'Стиль мышления',    dimension: 'visual',     direction: 'positive', text: 'Мне легче запомнить информацию, если я её вижу — схемы, картинки, таблицы' },
  { id: 1,  block: 'Стиль мышления',    dimension: 'analytical', direction: 'positive', text: 'Мне нравится разбивать сложную задачу на шаги и решать последовательно' },
  { id: 2,  block: 'Стиль мышления',    dimension: 'creative',   direction: 'positive', text: 'Я лучше запоминаю через историю, метафору или необычный пример' },
  { id: 3,  block: 'Стиль мышления',    dimension: 'analytical', direction: 'positive', text: 'Прежде чем принять решение, я собираю и анализирую все факты' },
  { id: 4,  block: 'Стиль мышления',    dimension: 'creative',   direction: 'positive', text: 'Мне интереснее придумывать новые идеи, чем выполнять готовые инструкции' },
  { id: 5,  block: 'Стиль мышления',    dimension: 'visual',     direction: 'positive', text: 'Я хорошо ориентируюсь на местности и легко представляю пространство мысленно' },

  // БЛОК 2: Социальная роль (introvert/extrovert/leader)
  { id: 6,  block: 'Социальная роль',   dimension: 'introvert',  direction: 'positive', text: 'Я восстанавливаю энергию в одиночестве, а не в компании' },
  { id: 7,  block: 'Социальная роль',   dimension: 'extrovert',  direction: 'positive', text: 'Я чувствую себя в своей тарелке, когда вокруг много людей и движения' },
  { id: 8,  block: 'Социальная роль',   dimension: 'leader',     direction: 'positive', text: 'Я часто беру на себя ответственность за группу, когда никто не берётся' },
  { id: 9,  block: 'Социальная роль',   dimension: 'introvert',  direction: 'positive', text: 'Мне комфортнее работать над задачей самостоятельно, без обсуждений' },
  { id: 10, block: 'Социальная роль',   dimension: 'leader',     direction: 'positive', text: 'Мне нравится убеждать других и добиваться принятия своей точки зрения' },

  // БЛОК 3: Мотивация (intrinsic/achievement/social)
  { id: 11, block: 'Мотивация',         dimension: 'intrinsic',  direction: 'positive', text: 'Я делаю что-то не ради оценки, а потому что само занятие приносит удовольствие' },
  { id: 12, block: 'Мотивация',         dimension: 'achievement',direction: 'positive', text: 'Мне важно быть лучше других или занять первое место' },
  { id: 13, block: 'Мотивация',         dimension: 'social',     direction: 'positive', text: 'Меня больше мотивирует одобрение и признание со стороны людей, которых я уважаю' },
  { id: 14, block: 'Мотивация',         dimension: 'intrinsic',  direction: 'positive', text: 'Я часто занимаюсь чем-то сверх программы — просто потому что интересно' },
  { id: 15, block: 'Мотивация',         dimension: 'achievement',direction: 'positive', text: 'Трудности и сложные задачи меня не пугают — они делают результат ценнее' },

  // БЛОК 4: Среда и формат (structure/freedom/hands-on)
  { id: 16, block: 'Среда и формат',    dimension: 'structure',  direction: 'positive', text: 'Мне комфортно, когда есть чёткое расписание и правила — это помогает сосредоточиться' },
  { id: 17, block: 'Среда и формат',    dimension: 'freedom',    direction: 'positive', text: 'Я лучше работаю, когда сам выбираю что, когда и как делать' },
  { id: 18, block: 'Среда и формат',    dimension: 'hands-on',   direction: 'positive', text: 'Мне важно видеть реальный, ощутимый результат своей работы' },
  { id: 19, block: 'Среда и формат',    dimension: 'structure',  direction: 'positive', text: 'Я предпочитаю заранее знать, что будет и как оценят мою работу' },
  { id: 20, block: 'Среда и формат',    dimension: 'freedom',    direction: 'positive', text: 'Мне сложно работать по жёсткому алгоритму — хочется находить свои пути решения' },

  // БЛОК 5: Интересы и будущее (tech/people/ideas/nature/business)
  { id: 21, block: 'Интересы',          dimension: 'tech',       direction: 'positive', text: 'Мне интересно, как работают программы, гаджеты и технические системы' },
  { id: 22, block: 'Интересы',          dimension: 'people',     direction: 'positive', text: 'Мне нравится разбираться, почему люди поступают так или иначе' },
  { id: 23, block: 'Интересы',          dimension: 'ideas',      direction: 'positive', text: 'Меня захватывают философские вопросы, теории и абстрактные идеи' },
  { id: 24, block: 'Интересы',          dimension: 'nature',     direction: 'positive', text: 'Мне интересно всё, что связано с природой, биологией или экологией' },
  { id: 25, block: 'Интересы',          dimension: 'business',   direction: 'positive', text: 'Меня привлекает тема денег, бизнеса, стартапов и предпринимательства' },

  // БЛОК 6: Ценности карьеры (impact/mastery/stability/creativity)
  { id: 26, block: 'Ценности карьеры',  dimension: 'impact',     direction: 'positive', text: 'Для меня важно, чтобы моя работа меняла жизнь людей или мира к лучшему' },
  { id: 27, block: 'Ценности карьеры',  dimension: 'mastery',    direction: 'positive', text: 'Я хочу стать настоящим экспертом в своей области — глубоко и надолго' },
  { id: 28, block: 'Ценности карьеры',  dimension: 'stability',  direction: 'positive', text: 'Мне важны стабильность, предсказуемость и уверенность в завтрашнем дне' },
  { id: 29, block: 'Ценности карьеры',  dimension: 'creativity', direction: 'positive', text: 'Я хочу работать там, где можно регулярно создавать что-то новое и оригинальное' },
]

// ── Профиль результата ────────────────────────────────────────────────────────

function computeExtended(answers: Record<number, AnswerValue>) {
  function score(dim: string): number {
    return QUESTIONS.filter(q => q.dimension === dim).reduce((sum, q) => {
      const v = answers[q.id]
      const pts = v === 'yes' ? 2 : v === 'sometimes' ? 1 : 0
      return sum + (q.direction === 'positive' ? pts : 2 - pts)
    }, 0)
  }

  // Стиль мышления
  const visual = score('visual')
  const analytical = score('analytical')
  const creative = score('creative')
  const learningStyle = visual >= analytical && visual >= creative ? 'visual'
    : analytical >= creative ? 'analytical' : 'creative'

  // Социальный тип
  const introvert = score('introvert')
  const extrovert = score('extrovert')
  const leader = score('leader')
  const socialType = leader >= 3 ? 'leader' : introvert > extrovert ? 'introvert' : 'extrovert'

  // Мотивация
  const intrinsic = score('intrinsic')
  const achievement = score('achievement')
  const socialM = score('social')
  const motivationType = intrinsic >= achievement && intrinsic >= socialM ? 'intrinsic'
    : achievement >= socialM ? 'achievement' : 'social'

  // Среда
  const structure = score('structure')
  const freedom = score('freedom')
  const handsOn = score('hands-on')
  const bestEnvironment = handsOn >= 3 ? 'hands-on'
    : structure > freedom ? 'structure' : 'freedom'

  // Интересы (топ)
  const interestDims = ['tech','people','ideas','nature','business'] as const
  const interestScores = interestDims.map(d => ({ d, s: score(d) })).sort((a,b) => b.s - a.s)
  const topSkills = interestScores.slice(0, 3).map(x => interestLabels[x.d])

  // Карьерные пути
  const careerPaths = buildCareerPaths({
    learningStyle, socialType, motivationType, bestEnvironment,
    topInterest: interestScores[0].d,
    topValue: (() => {
      const valDims = ['impact','mastery','stability','creativity'] as const
      return valDims.reduce((a,b) => score(a) >= score(b) ? a : b)
    })(),
  })

  // RIASEC scores из экспресс теста (если есть) — или считаем из этого теста
  const expressResult = typeof window !== 'undefined'
    ? (() => { try { return JSON.parse(localStorage.getItem('ps_test_express') ?? 'null') } catch { return null } })()
    : null
  const riasecScores = expressResult?.scores ?? { R: 0, I: 0, A: 0, S: 0, E: 0, C: 0 }
  const primary = expressResult?.primary ?? 'I'
  const secondary = expressResult?.secondary ?? 'R'

  return {
    primary, secondary, scores: riasecScores,
    learningStyle, socialType, motivationType, bestEnvironment,
    topSkills, careerPaths,
  }
}

const interestLabels: Record<string, string> = {
  tech: 'Технологии и IT', people: 'Психология людей', ideas: 'Теории и идеи',
  nature: 'Природа и наука', business: 'Бизнес и предпринимательство',
}

function buildCareerPaths({ learningStyle, socialType, motivationType, bestEnvironment, topInterest, topValue }: {
  learningStyle: string; socialType: string; motivationType: string
  bestEnvironment: string; topInterest: string; topValue: string
}): { title: string; fit: number; desc: string }[] {
  const all = [
    {
      title: 'IT / Разработка',
      fit: [
        topInterest === 'tech' ? 25 : 5,
        learningStyle === 'analytical' ? 15 : 5,
        bestEnvironment === 'freedom' ? 10 : 5,
        topValue === 'mastery' ? 10 : 5,
        motivationType === 'intrinsic' ? 10 : 0,
      ].reduce((a, b) => a + b, 0),
      desc: 'Программирование, разработка, системный анализ',
    },
    {
      title: 'Медицина и биотех',
      fit: [
        topInterest === 'nature' ? 25 : 5,
        topInterest === 'people' ? 15 : 3,
        topValue === 'impact' ? 15 : 5,
        motivationType === 'intrinsic' ? 10 : 0,
        learningStyle === 'analytical' ? 10 : 3,
      ].reduce((a, b) => a + b, 0),
      desc: 'Врач, исследователь, биолог, фармацевт',
    },
    {
      title: 'Предпринимательство',
      fit: [
        topInterest === 'business' ? 25 : 5,
        socialType === 'leader' ? 20 : 5,
        motivationType === 'achievement' ? 15 : 5,
        topValue === 'creativity' ? 10 : 3,
        bestEnvironment === 'freedom' ? 10 : 3,
      ].reduce((a, b) => a + b, 0),
      desc: 'Стартап, управление, маркетинг, продажи',
    },
    {
      title: 'Творческие профессии',
      fit: [
        learningStyle === 'creative' ? 25 : 5,
        topValue === 'creativity' ? 20 : 5,
        topInterest === 'ideas' ? 10 : 3,
        bestEnvironment === 'freedom' ? 10 : 3,
        motivationType === 'intrinsic' ? 10 : 3,
      ].reduce((a, b) => a + b, 0),
      desc: 'Дизайн, режиссура, журналистика, искусство',
    },
    {
      title: 'Социальная работа / Педагогика',
      fit: [
        topInterest === 'people' ? 25 : 5,
        topValue === 'impact' ? 20 : 5,
        socialType === 'extrovert' ? 15 : 5,
        motivationType === 'social' ? 10 : 3,
      ].reduce((a, b) => a + b, 0),
      desc: 'Учитель, психолог, соцработник, волонтёрство',
    },
    {
      title: 'Наука и исследования',
      fit: [
        topInterest === 'ideas' ? 20 : 5,
        topInterest === 'nature' ? 15 : 3,
        learningStyle === 'analytical' ? 20 : 5,
        topValue === 'mastery' ? 15 : 5,
        motivationType === 'intrinsic' ? 10 : 3,
      ].reduce((a, b) => a + b, 0),
      desc: 'Исследователь, учёный, аналитик, инженер',
    },
    {
      title: 'Право и государство',
      fit: [
        bestEnvironment === 'structure' ? 20 : 3,
        topValue === 'stability' ? 20 : 5,
        socialType === 'leader' ? 15 : 5,
        learningStyle === 'analytical' ? 15 : 5,
      ].reduce((a, b) => a + b, 0),
      desc: 'Юрист, государственное управление, дипломатия',
    },
  ]

  // Нормализуем к 100 и берём топ-5
  const maxFit = Math.max(...all.map(x => x.fit))
  return all
    .map(x => ({ ...x, fit: Math.min(98, Math.round((x.fit / maxFit) * 95) + 10) }))
    .sort((a, b) => b.fit - a.fit)
    .slice(0, 5)
}

// ── Лейблы ───────────────────────────────────────────────────────────────────

const LEARNING_LABELS: Record<string, { name: string; emoji: string; desc: string }> = {
  visual:     { name: 'Визуальный', emoji: '👁️', desc: 'Лучше воспринимаете схемы, графики и наглядные образы' },
  analytical: { name: 'Аналитический', emoji: '🔢', desc: 'Мыслите структурно, легко разбираете задачи на части' },
  creative:   { name: 'Ассоциативный', emoji: '💡', desc: 'Учитесь через истории, метафоры и нестандартные связи' },
}
const SOCIAL_LABELS: Record<string, { name: string; emoji: string; desc: string }> = {
  introvert: { name: 'Интроверт', emoji: '🎧', desc: 'Энергию черпаете из уединения и глубокой сосредоточенности' },
  extrovert: { name: 'Экстраверт', emoji: '🌟', desc: 'Заряжаетесь от общения, командной работы и новых знакомств' },
  leader:    { name: 'Лидер', emoji: '🚀', desc: 'Берёте инициативу, организуете людей и добиваетесь результата' },
}
const MOTIVATION_LABELS: Record<string, { name: string; emoji: string; desc: string }> = {
  intrinsic:   { name: 'Внутренняя', emoji: '🔥', desc: 'Вам важен сам процесс — интерес к делу важнее внешних наград' },
  achievement: { name: 'Достижения', emoji: '🏆', desc: 'Мотивируют сложные вызовы, соревнование и высокая планка' },
  social:      { name: 'Социальная', emoji: '🤝', desc: 'Важно признание, одобрение и влияние на жизнь других людей' },
}
const ENV_LABELS: Record<string, { name: string; emoji: string; desc: string }> = {
  structure:  { name: 'Структура и порядок', emoji: '📋', desc: 'Лучше работаете с чётким планом и понятными правилами' },
  freedom:    { name: 'Свобода действий', emoji: '🦋', desc: 'Раскрываетесь там, где есть пространство для своего пути' },
  'hands-on': { name: 'Практика и результат', emoji: '🔨', desc: 'Важно видеть реальный, ощутимый итог своей работы' },
}

// ── Компонент ─────────────────────────────────────────────────────────────────

type Screen = 'gate' | 'test' | 'result'

export default function ExtendedTest() {
  const [screen, setScreen] = useState<Screen>('gate')
  const [user, setUser] = useState<UserProfile | null>(null)
  const [currentQ, setCurrentQ] = useState(0)
  const [answers, setAnswers] = useState<Record<number, AnswerValue>>({})
  const [result, setResult] = useState<ReturnType<typeof computeExtended> | null>(null)

  useEffect(() => {
    setUser(getUser())
  }, [])

  const handleRegister = (profile: UserProfile) => {
    saveUser(profile)
    setUser(profile)
    setScreen('test')
  }

  const handleAnswer = (val: AnswerValue) => {
    const newAnswers = { ...answers, [currentQ]: val }
    setAnswers(newAnswers)
    if (currentQ < QUESTIONS.length - 1) {
      setCurrentQ(q => q + 1)
    } else {
      const res = computeExtended(newAnswers)
      const extResult: ExtendedTestResult = {
        ...res,
        completedAt: new Date().toISOString(),
      }
      saveExtendedResult(extResult)
      setResult(res)
      setScreen('result')
    }
  }

  const handleBack = () => {
    if (currentQ > 0) setCurrentQ(q => q - 1)
  }

  const handleRestart = () => {
    setAnswers({})
    setCurrentQ(0)
    setScreen('gate')
  }

  if (screen === 'gate') {
    return <GateScreen user={user} onContinue={handleRegister} />
  }

  if (screen === 'test') {
    const q = QUESTIONS[currentQ]
    const block = q.block
    const blockIdx = [...new Set(QUESTIONS.map(x => x.block))].indexOf(block)
    const progress = Math.round((currentQ / QUESTIONS.length) * 100)
    return (
      <QuestionScreen
        question={q}
        block={block}
        blockNum={blockIdx + 1}
        totalBlocks={6}
        progress={progress}
        current={currentQ + 1}
        total={QUESTIONS.length}
        selected={answers[currentQ] ?? null}
        onAnswer={handleAnswer}
        onBack={currentQ > 0 ? handleBack : undefined}
      />
    )
  }

  return <ResultScreen result={result!} user={user} onRestart={handleRestart} />
}

// ── Экран: Лид-форма (Гейт) ───────────────────────────────────────────────────

function GateScreen({ user, onContinue }: { user: UserProfile | null; onContinue: (p: UserProfile) => void }) {
  const [name, setName] = useState(user?.name ?? '')
  const [email, setEmail] = useState(user?.email ?? '')
  const [phone, setPhone] = useState(user?.phone ?? '')
  const [errors, setErrors] = useState<Record<string, string>>({})

  const validate = () => {
    const e: Record<string, string> = {}
    if (!name.trim()) e.name = 'Введите имя'
    if (!email.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) e.email = 'Введите корректный email'
    setErrors(e)
    return Object.keys(e).length === 0
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!validate()) return
    onContinue({ name: name.trim(), email: email.trim(), phone: phone.trim() || undefined, createdAt: new Date().toISOString() })
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-violet-50">
      <div className="max-w-lg mx-auto px-4 pt-12 pb-20">

        {/* Breadcrumb */}
        <div className="flex items-center gap-2 text-xs text-gray-400 mb-8">
          <Link href="/test/" className="hover:text-gray-600">Экспресс-тест</Link>
          <span>›</span>
          <span className="text-gray-700 font-medium">Расширенный тест</span>
        </div>

        {/* Hero */}
        <div className="text-center mb-8">
          <div className="text-5xl mb-4">🔍</div>
          <h1 className="text-3xl font-black text-[#0F172A] mb-3">
            Расширенный тест профориентации
          </h1>
          <p className="text-gray-500 text-sm leading-relaxed">
            30 вопросов · ~10 минут · Полный портрет личности
          </p>
        </div>

        {/* Что будет в результате */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 mb-6">
          <p className="text-xs font-semibold text-gray-400 uppercase tracking-widest mb-4">Ваш профиль включает</p>
          <div className="grid grid-cols-2 gap-3">
            {[
              { emoji: '🧠', text: 'Стиль мышления и обучения' },
              { emoji: '🌐', text: 'Социальный тип личности' },
              { emoji: '🔥', text: 'Тип мотивации' },
              { emoji: '🏆', text: 'Карьерные пути с % совпадения' },
              { emoji: '🌱', text: 'Ключевые интересы и навыки' },
              { emoji: '💾', text: 'Сохранение в личном кабинете' },
            ].map(item => (
              <div key={item.text} className="flex items-center gap-2">
                <span className="text-lg">{item.emoji}</span>
                <span className="text-xs text-gray-700">{item.text}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Форма */}
        <div className="bg-white rounded-2xl border border-violet-100 shadow-sm p-6">
          <p className="text-sm font-semibold text-[#0F172A] mb-1">
            {user ? 'Продолжить как ' + user.name : 'Создайте личный кабинет'}
          </p>
          <p className="text-xs text-gray-400 mb-5">
            Результаты теста будут сохранены и доступны в любое время
          </p>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1">Имя *</label>
              <input
                type="text"
                value={name}
                onChange={e => setName(e.target.value)}
                placeholder="Иван"
                className={`w-full border rounded-xl px-4 py-3 text-sm outline-none transition-all ${
                  errors.name ? 'border-red-300 bg-red-50' : 'border-gray-200 focus:border-violet-400 focus:ring-2 focus:ring-violet-100'
                }`}
              />
              {errors.name && <p className="text-xs text-red-500 mt-1">{errors.name}</p>}
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1">Email *</label>
              <input
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder="ivan@example.com"
                className={`w-full border rounded-xl px-4 py-3 text-sm outline-none transition-all ${
                  errors.email ? 'border-red-300 bg-red-50' : 'border-gray-200 focus:border-violet-400 focus:ring-2 focus:ring-violet-100'
                }`}
              />
              {errors.email && <p className="text-xs text-red-500 mt-1">{errors.email}</p>}
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1">Телефон <span className="text-gray-400 font-normal">(необязательно)</span></label>
              <input
                type="tel"
                value={phone}
                onChange={e => setPhone(e.target.value)}
                placeholder="+7 900 000-00-00"
                className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm outline-none focus:border-violet-400 focus:ring-2 focus:ring-violet-100 transition-all"
              />
            </div>
            <button
              type="submit"
              className="w-full py-3.5 rounded-xl bg-[#7C3AED] hover:bg-violet-600 text-white font-bold text-sm transition-all duration-200 shadow-md shadow-violet-200 hover:-translate-y-0.5"
            >
              Начать расширенный тест →
            </button>
            <p className="text-xs text-gray-400 text-center leading-relaxed">
              Нажимая кнопку, вы соглашаетесь с обработкой персональных данных.
              Данные хранятся только в вашем браузере.
            </p>
          </form>
        </div>
      </div>
    </div>
  )
}

// ── Экран: Вопрос ─────────────────────────────────────────────────────────────

function QuestionScreen({
  question, block, blockNum, totalBlocks, progress, current, total,
  selected, onAnswer, onBack,
}: {
  question: ExtQuestion
  block: string
  blockNum: number
  totalBlocks: number
  progress: number
  current: number
  total: number
  selected: AnswerValue | null
  onAnswer: (v: AnswerValue) => void
  onBack?: () => void
}) {
  const OPTIONS: { value: AnswerValue; label: string; emoji: string; color: string }[] = [
    { value: 'yes',       label: 'Да, точно про меня',          emoji: '✅', color: '#16A34A' },
    { value: 'sometimes', label: 'Иногда / отчасти',            emoji: '🔄', color: '#D97706' },
    { value: 'no',        label: 'Нет, не про меня',            emoji: '❌', color: '#DC2626' },
  ]

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-violet-50 flex flex-col">
      {/* Прогресс-шапка */}
      <div className="sticky top-0 bg-white/90 backdrop-blur border-b border-gray-100 px-4 py-3 z-10">
        <div className="max-w-2xl mx-auto">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              {onBack && (
                <button onClick={onBack} className="w-8 h-8 rounded-full bg-gray-100 hover:bg-gray-200 transition-colors flex items-center justify-center">
                  <svg className="w-4 h-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                  </svg>
                </button>
              )}
              <div>
                <p className="text-xs font-semibold text-gray-400">
                  Блок {blockNum} из {totalBlocks}: {block}
                </p>
                <p className="text-xs text-gray-400">Вопрос {current} из {total}</p>
              </div>
            </div>
            <span className="text-xs font-bold text-violet-600">{progress}%</span>
          </div>
          <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
            <div
              className="h-2 bg-gradient-to-r from-violet-500 to-violet-400 rounded-full transition-all duration-500"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>
      </div>

      {/* Вопрос */}
      <div className="flex-1 flex items-center justify-center px-4 py-8">
        <div className="w-full max-w-lg">
          <div className="bg-white rounded-3xl shadow-md border border-gray-100 p-8 mb-6 text-center">
            <p className="text-xs font-semibold text-violet-500 uppercase tracking-widest mb-3">{block}</p>
            <h2 className="text-xl sm:text-2xl font-bold text-[#0F172A] leading-snug">
              {question.text}
            </h2>
          </div>

          {/* Три варианта ответа */}
          <div className="flex flex-col gap-3">
            {OPTIONS.map(opt => (
              <button
                key={opt.value}
                onClick={() => onAnswer(opt.value)}
                className={`flex items-center gap-4 p-4 rounded-2xl border-2 text-left transition-all duration-150 ${
                  selected === opt.value
                    ? 'border-violet-400 bg-violet-50'
                    : 'border-gray-200 bg-white hover:border-gray-300 hover:bg-gray-50'
                }`}
              >
                <span className="text-2xl w-8 text-center shrink-0">{opt.emoji}</span>
                <span className={`flex-1 text-sm font-medium ${selected === opt.value ? 'text-violet-700' : 'text-[#0F172A]'}`}>
                  {opt.label}
                </span>
              </button>
            ))}
          </div>

          <p className="text-xs text-gray-300 text-center mt-5">
            Нажмите на вариант — сразу перейдём к следующему вопросу
          </p>
        </div>
      </div>
    </div>
  )
}

// ── Экран: Результат ──────────────────────────────────────────────────────────

function ResultScreen({
  result, user, onRestart,
}: {
  result: ReturnType<typeof computeExtended>
  user: UserProfile | null
  onRestart: () => void
}) {
  const learning = LEARNING_LABELS[result.learningStyle]
  const social = SOCIAL_LABELS[result.socialType]
  const motivation = MOTIVATION_LABELS[result.motivationType]
  const env = ENV_LABELS[result.bestEnvironment]

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-violet-50">
      <div className="max-w-2xl mx-auto px-4 py-12">

        {/* Шапка */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-2 bg-violet-100 text-violet-700 text-xs font-semibold px-4 py-2 rounded-full mb-4">
            <span className="w-2 h-2 bg-violet-500 rounded-full" />
            Расширенный профиль готов
          </div>
          <h1 className="text-3xl font-black text-[#0F172A] mb-2">
            {user ? `Профиль: ${user.name}` : 'Ваш профиль личности'}
          </h1>
          <p className="text-sm text-gray-500">Полный анализ на основе 30 вопросов</p>
        </div>

        {/* 4 карточки измерений */}
        <div className="grid grid-cols-2 gap-4 mb-6">
          {[
            { label: 'Стиль мышления', ...learning, color: '#7C3AED' },
            { label: 'Социальный тип', ...social, color: '#0369A1' },
            { label: 'Мотивация', ...motivation, color: '#D97706' },
            { label: 'Среда', ...env, color: '#16A34A' },
          ].map(card => (
            <div key={card.label} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4">
              <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-widest mb-1">{card.label}</p>
              <div className="flex items-center gap-2 mb-2">
                <span className="text-xl">{card.emoji}</span>
                <span className="text-sm font-bold text-[#0F172A]">{card.name}</span>
              </div>
              <p className="text-xs text-gray-500 leading-relaxed">{card.desc}</p>
            </div>
          ))}
        </div>

        {/* Карьерные пути */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 mb-6">
          <p className="text-xs font-semibold text-gray-400 uppercase tracking-widest mb-4">🏆 Карьерные пути — процент совпадения</p>
          <div className="space-y-4">
            {result.careerPaths.map((path, i) => (
              <div key={path.title}>
                <div className="flex items-center justify-between mb-1">
                  <div>
                    <span className="text-sm font-bold text-[#0F172A]">{i + 1}. {path.title}</span>
                    <span className="text-xs text-gray-400 ml-2">{path.desc}</span>
                  </div>
                  <span className="text-sm font-black text-violet-600">{path.fit}%</span>
                </div>
                <div className="h-2.5 bg-gray-100 rounded-full overflow-hidden">
                  <div
                    className="h-2.5 rounded-full transition-all duration-700"
                    style={{
                      width: `${path.fit}%`,
                      background: i === 0 ? '#7C3AED' : i === 1 ? '#0369A1' : '#9CA3AF',
                    }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Ключевые интересы */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 mb-6">
          <p className="text-xs font-semibold text-gray-400 uppercase tracking-widest mb-3">🌱 Ключевые области интересов</p>
          <div className="flex flex-wrap gap-2">
            {result.topSkills.map(skill => (
              <span key={skill} className="text-sm font-medium px-3 py-1.5 rounded-full bg-violet-50 text-violet-700 border border-violet-100">
                {skill}
              </span>
            ))}
          </div>
        </div>

        {/* Рекомендации по школам */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 mb-6">
          <p className="text-xs font-semibold text-gray-400 uppercase tracking-widest mb-4">🏫 Рекомендации по школам</p>
          <div className="space-y-3 text-sm text-gray-700">
            {result.learningStyle === 'analytical' && (
              <div className="flex items-start gap-2">
                <span className="text-green-500 mt-0.5">✓</span>
                <p>Вам подойдут школы с углублёнными программами по математике, физике или информатике. Ищите олимпиадные классы и профили при вузах.</p>
              </div>
            )}
            {result.learningStyle === 'creative' && (
              <div className="flex items-start gap-2">
                <span className="text-green-500 mt-0.5">✓</span>
                <p>Обратите внимание на частные школы с проектным обучением, школы Монтессори и Вальдорфские — там больше пространства для творчества.</p>
              </div>
            )}
            {result.learningStyle === 'visual' && (
              <div className="flex items-start gap-2">
                <span className="text-green-500 mt-0.5">✓</span>
                <p>Хорошо подойдут школы с сильным визуальным компонентом: интерактивные доски, медиатеки, практические лаборатории.</p>
              </div>
            )}
            {result.socialType === 'introvert' && (
              <div className="flex items-start gap-2">
                <span className="text-green-500 mt-0.5">✓</span>
                <p>Рассмотрите онлайн-школы или экстернат — там меньше обязательных социальных взаимодействий и больше фокуса на индивидуальном темпе.</p>
              </div>
            )}
            {result.socialType === 'leader' && (
              <div className="flex items-start gap-2">
                <span className="text-green-500 mt-0.5">✓</span>
                <p>Кадетские и профильные школы с активной общественной жизнью, самоуправлением и соревнованиями отлично развивают лидерские качества.</p>
              </div>
            )}
            {result.bestEnvironment === 'freedom' && (
              <div className="flex items-start gap-2">
                <span className="text-green-500 mt-0.5">✓</span>
                <p>Школы с индивидуальными учебными планами (семейные, частные с проектным обучением) дадут больше свободы в выборе темпа и направлений.</p>
              </div>
            )}
          </div>
        </div>

        {/* LK + Каталог */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
          <Link
            href="/lk/"
            className="flex flex-col items-center gap-2 p-5 rounded-2xl bg-violet-600 hover:bg-violet-700 text-white transition-all duration-200 text-center hover:-translate-y-0.5 shadow-md shadow-violet-200"
          >
            <span className="text-3xl">👤</span>
            <span className="font-bold text-sm">Открыть личный кабинет</span>
            <span className="text-xs opacity-80">Все результаты сохранены</span>
          </Link>
          <Link
            href="/shkoly/"
            className="flex flex-col items-center gap-2 p-5 rounded-2xl bg-white border-2 border-gray-200 hover:border-violet-300 text-[#0F172A] transition-all duration-200 text-center hover:-translate-y-0.5 shadow-sm"
          >
            <span className="text-3xl">🏫</span>
            <span className="font-bold text-sm">Каталог школ</span>
            <span className="text-xs text-gray-400">Подберите подходящую</span>
          </Link>
        </div>

        <div className="text-center">
          <button onClick={onRestart} className="text-sm text-gray-400 hover:text-gray-600 transition-colors">
            ↺ Пройти тест заново
          </button>
        </div>
      </div>
    </div>
  )
}
