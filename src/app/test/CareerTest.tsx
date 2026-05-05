'use client'
import { useState } from 'react'
import Link from 'next/link'

// ── RIASEC вопросы (20 штук, да / нет) ──────────────────────────────────────
// Типы: R=Мастер, I=Исследователь, A=Творец, S=Помощник, E=Лидер, C=Организатор

type RiasecType = 'R' | 'I' | 'A' | 'S' | 'E' | 'C'

interface Question {
  id: number
  text: string
  type: RiasecType
}

const QUESTIONS: Question[] = [
  // R — Мастер (практик)
  { id: 0,  type: 'R', text: 'Мне нравится чинить или собирать вещи своими руками' },
  { id: 1,  type: 'R', text: 'Я предпочитаю практические задания теоретическим' },
  { id: 2,  type: 'R', text: 'Мне интересно работать с техникой, инструментами или механизмами' },
  { id: 3,  type: 'R', text: 'Мне нравится физическая нагрузка и активный образ жизни' },
  // I — Исследователь (аналитик)
  { id: 4,  type: 'I', text: 'Я люблю решать головоломки и сложные задачи' },
  { id: 5,  type: 'I', text: 'Мне интересно узнавать, как устроены вещи и явления' },
  { id: 6,  type: 'I', text: 'Математика или точные науки даются мне легче, чем большинству' },
  { id: 7,  type: 'I', text: 'Мне нравится проводить опыты и делать выводы на основе фактов' },
  // A — Творец
  { id: 8,  type: 'A', text: 'Мне нравится рисовать, писать стихи или придумывать истории' },
  { id: 9,  type: 'A', text: 'Я нахожу удовольствие в музыке, театре или танцах' },
  { id: 10, type: 'A', text: 'Меня привлекают нестандартные, оригинальные решения' },
  // S — Помощник (социальный)
  { id: 11, type: 'S', text: 'Мне нравится общаться с новыми людьми и заводить друзей' },
  { id: 12, type: 'S', text: 'Я часто помогаю одноклассникам разобраться в заданиях' },
  { id: 13, type: 'S', text: 'Мне важно, чтобы результат моей работы был полезен другим' },
  // E — Лидер (предприимчивый)
  { id: 14, type: 'E', text: 'Я легко беру инициативу и предпочитаю быть организатором' },
  { id: 15, type: 'E', text: 'Мне нравится убеждать людей и отстаивать свою точку зрения' },
  { id: 16, type: 'E', text: 'Я готов рисковать ради достижения амбициозной цели' },
  // C — Организатор (конвенциональный)
  { id: 17, type: 'C', text: 'Мне нравится работать по чёткому плану и следовать правилам' },
  { id: 18, type: 'C', text: 'Я люблю порядок: все вещи и данные должны быть систематизированы' },
  { id: 19, type: 'C', text: 'Мне нравится аккуратно вести записи и оформлять работу по правилам' },
]

// ── Архетипы личности ────────────────────────────────────────────────────────

interface Archetype {
  code: RiasecType
  name: string
  emoji: string
  tagline: string
  description: string
  strengths: string[]
  weaknesses: string[]
  color: string
  bg: string
  border: string
  schoolTypes: { slug: string; label: string; emoji: string }[]
  professions: string[]
}

const ARCHETYPES: Record<RiasecType, Archetype> = {
  R: {
    code: 'R',
    name: 'Мастер',
    emoji: '🔧',
    tagline: 'Практик, который умеет делать руками',
    description:
      'Вы любите работать с реальными объектами, техникой и природой. Вам важна конкретность и результат, который можно потрогать. Лучше всего учитесь через практику и эксперименты.',
    strengths: ['Техническое мышление', 'Усидчивость', 'Точность', 'Умение работать руками', 'Надёжность'],
    weaknesses: ['Сложнее с абстрактными теориями', 'Меньше любит монотонные устные задания'],
    color: '#0369A1',
    bg: '#EFF6FF',
    border: '#BFDBFE',
    schoolTypes: [
      { slug: 'profilnye', label: 'Профильные (технические)', emoji: '⚙️' },
      { slug: 'kadetskie', label: 'Кадетские', emoji: '🎖️' },
    ],
    professions: ['Инженер', 'Программист', 'Архитектор', 'Пилот', 'Механик', 'Агроном'],
  },
  I: {
    code: 'I',
    name: 'Исследователь',
    emoji: '🔬',
    tagline: 'Аналитик, который хочет понять всё',
    description:
      'Вы любите думать, анализировать и открывать новое. Вам интересны точные науки, эксперименты и интеллектуальные задачи. Предпочитаете понимать суть, а не просто запоминать факты.',
    strengths: ['Аналитическое мышление', 'Любознательность', 'Логика', 'Самостоятельность', 'Глубина погружения'],
    weaknesses: ['Иногда сложнее работать в команде', 'Может казаться закрытым'],
    color: '#7C3AED',
    bg: '#F5F3FF',
    border: '#DDD6FE',
    schoolTypes: [
      { slug: 'profilnye', label: 'Профильные (физмат)', emoji: '🧮' },
      { slug: 'pri-vuzakh', label: 'При вузах', emoji: '🎓' },
      { slug: 'gimnazii', label: 'Гимназии и лицеи', emoji: '🏛️' },
    ],
    professions: ['Учёный', 'IT-специалист', 'Врач', 'Аналитик данных', 'Финансист', 'Физик'],
  },
  A: {
    code: 'A',
    name: 'Творец',
    emoji: '🎨',
    tagline: 'Художник с богатым внутренним миром',
    description:
      'Вы мыслите образами, идеями и чувствами. Вам важна свобода самовыражения. Лучше всего раскрываетесь в творческих проектах и нестандартных заданиях. Вас вдохновляет красота и оригинальность.',
    strengths: ['Креативность', 'Эмпатия', 'Нестандартное мышление', 'Эстетический вкус', 'Развитая интуиция'],
    weaknesses: ['Сложнее с рутиной и жёсткими правилами', 'Иногда трудно с дедлайнами'],
    color: '#D97706',
    bg: '#FFFBEB',
    border: '#FDE68A',
    schoolTypes: [
      { slug: 'chastnie', label: 'Частные школы', emoji: '🏫' },
      { slug: 'semejnye', label: 'Семейные школы', emoji: '🏠' },
    ],
    professions: ['Дизайнер', 'Художник', 'Режиссёр', 'Архитектор', 'Журналист', 'Музыкант'],
  },
  S: {
    code: 'S',
    name: 'Помощник',
    emoji: '🤝',
    tagline: 'Общительный и заботливый человек',
    description:
      'Вы получаете энергию от общения с людьми. Вам важно помогать и видеть, как ваши действия меняют чью-то жизнь к лучшему. Вы отлично работаете в команде и умеете слушать.',
    strengths: ['Коммуникабельность', 'Эмпатия', 'Командный игрок', 'Умение слушать', 'Лидерство в группе'],
    weaknesses: ['Иногда сложно с индивидуальными тихими заданиями', 'Может откладывать конкурентные задачи'],
    color: '#16A34A',
    bg: '#F0FDF4',
    border: '#BBF7D0',
    schoolTypes: [
      { slug: 'gosudarstvennye', label: 'Государственные', emoji: '🏛️' },
      { slug: 'semejnye', label: 'Семейные школы', emoji: '🏠' },
      { slug: 'chastnie', label: 'Частные школы', emoji: '🎒' },
    ],
    professions: ['Психолог', 'Педагог', 'Врач', 'Социальный работник', 'HR-специалист', 'Тренер'],
  },
  E: {
    code: 'E',
    name: 'Лидер',
    emoji: '🚀',
    tagline: 'Прирождённый организатор и предприниматель',
    description:
      'Вы прирождённый лидер и переговорщик. Умеете ставить цели и вести за собой других. Вас вдохновляют большие проекты, конкуренция и возможность влиять на результат.',
    strengths: ['Лидерство', 'Целеустремлённость', 'Убедительность', 'Инициативность', 'Амбициозность'],
    weaknesses: ['Иногда сложнее с детальной монотонной работой', 'Нетерпение к медленным процессам'],
    color: '#DC2626',
    bg: '#FFF7F7',
    border: '#FECACA',
    schoolTypes: [
      { slug: 'kadetskie', label: 'Кадетские', emoji: '🎖️' },
      { slug: 'mezhdunarodnie', label: 'Международные', emoji: '🌍' },
      { slug: 'profilnye', label: 'Профильные (экономика)', emoji: '📊' },
    ],
    professions: ['Предприниматель', 'Менеджер', 'Юрист', 'Политик', 'Маркетолог', 'Топ-менеджер'],
  },
  C: {
    code: 'C',
    name: 'Организатор',
    emoji: '📋',
    tagline: 'Структурный и внимательный к деталям',
    description:
      'Вы любите порядок, точность и системность. Вам комфортно работать по чётким правилам и структурам. Вы надёжный и предсказуемый партнёр, которому можно доверить любые данные.',
    strengths: ['Точность', 'Надёжность', 'Системное мышление', 'Внимание к деталям', 'Ответственность'],
    weaknesses: ['Иногда сложнее с неопределёнными задачами', 'Может быть сложнее с импровизацией'],
    color: '#0891B2',
    bg: '#ECFEFF',
    border: '#A5F3FC',
    schoolTypes: [
      { slug: 'online', label: 'Онлайн-школы', emoji: '💻' },
      { slug: 'chastnie', label: 'Частные школы', emoji: '🏫' },
      { slug: 'profilnye', label: 'Профильные (экономика/право)', emoji: '⚖️' },
    ],
    professions: ['Бухгалтер', 'Юрист', 'Программист', 'Аналитик', 'Финансист', 'Логист'],
  },
}

// ── Утилиты ──────────────────────────────────────────────────────────────────

function computeResult(answers: Record<number, boolean>): { primary: RiasecType; secondary: RiasecType; scores: Record<RiasecType, number> } {
  const scores: Record<RiasecType, number> = { R: 0, I: 0, A: 0, S: 0, E: 0, C: 0 }
  QUESTIONS.forEach(q => {
    if (answers[q.id] === true) scores[q.type]++
  })
  const sorted = (Object.entries(scores) as [RiasecType, number][]).sort((a, b) => b[1] - a[1])
  return { primary: sorted[0][0], secondary: sorted[1][0], scores }
}

// ── Компонент ─────────────────────────────────────────────────────────────────

type Screen = 'intro' | 'test' | 'result'

export default function CareerTest() {
  const [screen, setScreen] = useState<Screen>('intro')
  const [currentQ, setCurrentQ] = useState(0)
  const [answers, setAnswers] = useState<Record<number, boolean>>({})

  const handleAnswer = (yes: boolean) => {
    const newAnswers = { ...answers, [currentQ]: yes }
    setAnswers(newAnswers)
    if (currentQ < QUESTIONS.length - 1) {
      setCurrentQ(q => q + 1)
    } else {
      setScreen('result')
    }
  }

  const handleRestart = () => {
    setAnswers({})
    setCurrentQ(0)
    setScreen('intro')
  }

  if (screen === 'intro') {
    return <IntroScreen onStart={() => setScreen('test')} />
  }

  if (screen === 'test') {
    const q = QUESTIONS[currentQ]
    const progress = Math.round((currentQ / QUESTIONS.length) * 100)
    return (
      <TestScreen
        question={q}
        progress={progress}
        current={currentQ + 1}
        total={QUESTIONS.length}
        onAnswer={handleAnswer}
        onBack={currentQ > 0 ? () => setCurrentQ(q => q - 1) : undefined}
      />
    )
  }

  const { primary, secondary, scores } = computeResult(answers)
  return (
    <ResultScreen
      primary={ARCHETYPES[primary]}
      secondary={ARCHETYPES[secondary]}
      scores={scores}
      onRestart={handleRestart}
    />
  )
}

// ── Экран: Введение ───────────────────────────────────────────────────────────

function IntroScreen({ onStart }: { onStart: () => void }) {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-blue-50">
      {/* Hero */}
      <div className="max-w-2xl mx-auto px-4 pt-16 pb-24">
        {/* Бейдж */}
        <div className="flex justify-center mb-6">
          <span className="inline-flex items-center gap-2 bg-white border border-blue-100 shadow-sm text-blue-600 text-xs font-semibold px-4 py-2 rounded-full">
            <span className="w-2 h-2 bg-blue-500 rounded-full animate-pulse" />
            Бесплатный тест · Без регистрации
          </span>
        </div>

        <h1 className="text-4xl sm:text-5xl font-black text-[#0F172A] text-center leading-tight mb-4">
          Профориентационный<br />тест для школьника
        </h1>
        <p className="text-lg text-gray-500 text-center mb-10 leading-relaxed">
          20 вопросов «да/нет» — 5 минут. Узнайте тип личности ребёнка, его сильные стороны
          и какие школы и профессии подойдут лучше всего.
        </p>

        {/* Карточки преимуществ */}
        <div className="grid grid-cols-3 gap-4 mb-10">
          {[
            { emoji: '⚡', title: '5 минут', sub: '20 вопросов' },
            { emoji: '🎯', title: 'Точный результат', sub: '6 типов личности' },
            { emoji: '🏫', title: 'Подбор школ', sub: 'По типу ребёнка' },
          ].map(card => (
            <div key={card.title} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 text-center">
              <div className="text-2xl mb-1">{card.emoji}</div>
              <div className="text-sm font-bold text-[#0F172A]">{card.title}</div>
              <div className="text-xs text-gray-400 mt-0.5">{card.sub}</div>
            </div>
          ))}
        </div>

        {/* Что получите */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 mb-8">
          <p className="text-xs font-semibold text-gray-400 uppercase tracking-widest mb-4">Что вы узнаете</p>
          <div className="space-y-3">
            {[
              'Тип личности по методике RIASEC (Голланд)',
              'Ключевые сильные стороны и зоны роста',
              'Подходящие направления обучения и типы школ',
              'Профессии, которые максимально совпадают с характером',
            ].map(item => (
              <div key={item} className="flex items-start gap-3">
                <div className="w-5 h-5 rounded-full bg-green-100 flex items-center justify-center shrink-0 mt-0.5">
                  <svg className="w-3 h-3 text-green-600" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                </div>
                <span className="text-sm text-[#0F172A]">{item}</span>
              </div>
            ))}
          </div>
        </div>

        <button
          onClick={onStart}
          className="w-full py-4 rounded-2xl bg-[#0369A1] hover:bg-blue-500 text-white font-bold text-base transition-all duration-200 shadow-lg shadow-blue-200 hover:shadow-blue-300 hover:-translate-y-0.5"
        >
          Начать тест →
        </button>

        <p className="text-xs text-gray-400 text-center mt-4">
          Данные не сохраняются и не передаются третьим лицам
        </p>
      </div>
    </div>
  )
}

// ── Экран: Вопрос ─────────────────────────────────────────────────────────────

function TestScreen({
  question, progress, current, total, onAnswer, onBack,
}: {
  question: Question
  progress: number
  current: number
  total: number
  onAnswer: (yes: boolean) => void
  onBack?: () => void
}) {
  const typeEmoji: Record<RiasecType, string> = {
    R: '🔧', I: '🔬', A: '🎨', S: '🤝', E: '🚀', C: '📋',
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-blue-50 flex flex-col">
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
              <span className="text-xs font-semibold text-gray-400">Вопрос {current} из {total}</span>
            </div>
            <span className="text-xs font-bold text-[#0369A1]">{progress}%</span>
          </div>
          <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
            <div
              className="h-2 bg-gradient-to-r from-[#0369A1] to-blue-400 rounded-full transition-all duration-500"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>
      </div>

      {/* Карточка вопроса */}
      <div className="flex-1 flex items-center justify-center px-4 py-8">
        <div className="w-full max-w-lg">
          {/* Категория */}
          <div className="flex justify-center mb-6">
            <span className="text-3xl">{typeEmoji[question.type]}</span>
          </div>

          {/* Вопрос */}
          <div className="bg-white rounded-3xl shadow-md border border-gray-100 p-8 mb-6 text-center">
            <h2 className="text-xl sm:text-2xl font-bold text-[#0F172A] leading-snug">
              {question.text}
            </h2>
          </div>

          {/* Кнопки да/нет */}
          <div className="grid grid-cols-2 gap-4">
            <button
              onClick={() => onAnswer(false)}
              className="group py-4 rounded-2xl border-2 border-gray-200 bg-white hover:border-red-300 hover:bg-red-50 transition-all duration-200 font-bold text-gray-600 hover:text-red-600 text-base flex items-center justify-center gap-2 shadow-sm hover:shadow"
            >
              <span className="text-xl">❌</span>
              Нет
            </button>
            <button
              onClick={() => onAnswer(true)}
              className="group py-4 rounded-2xl border-2 border-gray-200 bg-white hover:border-green-400 hover:bg-green-50 transition-all duration-200 font-bold text-gray-600 hover:text-green-600 text-base flex items-center justify-center gap-2 shadow-sm hover:shadow"
            >
              <span className="text-xl">✅</span>
              Да
            </button>
          </div>

          <p className="text-xs text-gray-300 text-center mt-5">
            Отвечайте честно — здесь нет правильных и неправильных ответов
          </p>
        </div>
      </div>
    </div>
  )
}

// ── Экран: Результат ──────────────────────────────────────────────────────────

function ResultScreen({
  primary, secondary, scores, onRestart,
}: {
  primary: Archetype
  secondary: Archetype
  scores: Record<RiasecType, number>
  onRestart: () => void
}) {
  const maxScore = Math.max(...Object.values(scores))

  const typeNames: Record<RiasecType, string> = {
    R: 'Мастер', I: 'Исследов.', A: 'Творец', S: 'Помощник', E: 'Лидер', C: 'Организ.',
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-blue-50">
      <div className="max-w-2xl mx-auto px-4 py-12">

        {/* Заголовок */}
        <div className="text-center mb-8">
          <p className="text-xs font-semibold text-gray-400 uppercase tracking-widest mb-2">Результат теста</p>
          <div
            className="inline-flex items-center gap-3 rounded-2xl px-6 py-4 mb-4"
            style={{ background: primary.bg, border: `2px solid ${primary.border}` }}
          >
            <span className="text-5xl">{primary.emoji}</span>
            <div className="text-left">
              <p className="text-2xl font-black" style={{ color: primary.color }}>{primary.name}</p>
              <p className="text-sm font-medium text-gray-500">{primary.tagline}</p>
            </div>
          </div>
          <p className="text-sm text-gray-500">
            Второй тип: <span className="font-semibold">{secondary.emoji} {secondary.name}</span>
          </p>
        </div>

        {/* Описание */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 mb-5">
          <p className="text-sm text-gray-700 leading-relaxed">{primary.description}</p>
        </div>

        {/* Диаграмма типов */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 mb-5">
          <p className="text-xs font-semibold text-gray-400 uppercase tracking-widest mb-4">Профиль личности</p>
          <div className="space-y-3">
            {(Object.entries(scores) as [RiasecType, number][])
              .sort((a, b) => b[1] - a[1])
              .map(([type, score]) => {
                const arch = ARCHETYPES[type]
                const width = maxScore > 0 ? Math.round((score / maxScore) * 100) : 0
                return (
                  <div key={type} className="flex items-center gap-3">
                    <div className="w-20 text-xs text-right text-gray-500 font-medium shrink-0">
                      {arch.emoji} {typeNames[type]}
                    </div>
                    <div className="flex-1 bg-gray-100 rounded-full h-3 overflow-hidden">
                      <div
                        className="h-3 rounded-full transition-all duration-700"
                        style={{ width: `${width}%`, background: arch.color }}
                      />
                    </div>
                    <div className="w-6 text-xs font-bold text-right shrink-0" style={{ color: arch.color }}>
                      {score}
                    </div>
                  </div>
                )
              })}
          </div>
        </div>

        {/* Сильные стороны */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-5">
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-widest mb-3">💪 Сильные стороны</p>
            <ul className="space-y-1.5">
              {primary.strengths.map(s => (
                <li key={s} className="flex items-center gap-2 text-sm text-[#0F172A]">
                  <span className="w-1.5 h-1.5 rounded-full shrink-0" style={{ background: primary.color }} />
                  {s}
                </li>
              ))}
            </ul>
          </div>
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-widest mb-3">🌱 Зоны роста</p>
            <ul className="space-y-1.5">
              {primary.weaknesses.map(w => (
                <li key={w} className="flex items-start gap-2 text-sm text-gray-600">
                  <span className="w-1.5 h-1.5 rounded-full bg-amber-400 shrink-0 mt-1.5" />
                  {w}
                </li>
              ))}
              {/* Добавляем сильные стороны вторичного типа */}
              {secondary.strengths.slice(0, 2).map(s => (
                <li key={s} className="flex items-start gap-2 text-sm text-gray-500">
                  <span className="w-1.5 h-1.5 rounded-full bg-gray-300 shrink-0 mt-1.5" />
                  {s} <span className="text-gray-300">({secondary.name})</span>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Профессии */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 mb-5">
          <p className="text-xs font-semibold text-gray-400 uppercase tracking-widest mb-4">🎯 Подходящие профессии</p>
          <div className="flex flex-wrap gap-2">
            {[...primary.professions, ...secondary.professions.slice(0, 3)].map(prof => (
              <span
                key={prof}
                className="text-sm font-medium px-3 py-1.5 rounded-full border"
                style={{ color: primary.color, borderColor: primary.border, background: primary.bg }}
              >
                {prof}
              </span>
            ))}
          </div>
        </div>

        {/* Типы школ */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 mb-5">
          <p className="text-xs font-semibold text-gray-400 uppercase tracking-widest mb-4">🏫 Подходящие типы школ</p>
          <div className="flex flex-col gap-3">
            {[...primary.schoolTypes, ...secondary.schoolTypes.slice(0, 1)].map(school => (
              <Link
                key={school.slug}
                href={`/shkoly/?type=${school.slug}`}
                className="flex items-center gap-3 p-3 rounded-xl border border-gray-100 hover:border-blue-200 hover:bg-blue-50 transition-all duration-200 group"
              >
                <span className="text-2xl">{school.emoji}</span>
                <span className="flex-1 text-sm font-semibold text-[#0F172A] group-hover:text-[#0369A1] transition-colors">
                  {school.label}
                </span>
                <svg className="w-4 h-4 text-gray-300 group-hover:text-[#0369A1] transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </Link>
            ))}
          </div>
        </div>

        {/* CTA */}
        <div
          className="rounded-2xl p-6 mb-6 text-center"
          style={{ background: primary.bg, border: `1.5px solid ${primary.border}` }}
        >
          <p className="text-sm font-bold mb-1" style={{ color: primary.color }}>
            Готовы найти идеальную школу?
          </p>
          <p className="text-xs text-gray-500 mb-4">
            Используйте результат теста для фильтрации школ в каталоге
          </p>
          <Link
            href="/shkoly/"
            className="inline-flex items-center gap-2 text-sm font-bold text-white px-6 py-3 rounded-xl transition-all duration-200 hover:opacity-90 hover:-translate-y-0.5 shadow-md"
            style={{ background: primary.color }}
          >
            Открыть каталог школ →
          </Link>
        </div>

        {/* Методология */}
        <div className="bg-gray-50 rounded-2xl p-5 mb-6 text-center">
          <p className="text-xs text-gray-400 leading-relaxed">
            Тест основан на теории профессиональных типов Джона Холланда (RIASEC) —
            одной из наиболее признанных моделей в профориентационной психологии.
            Результат носит информационный характер.
          </p>
        </div>

        {/* Кнопка рестарт */}
        <div className="text-center">
          <button
            onClick={onRestart}
            className="text-sm text-gray-400 hover:text-gray-600 transition-colors"
          >
            ↺ Пройти тест заново
          </button>
        </div>
      </div>
    </div>
  )
}
