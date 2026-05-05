'use client'
import { useState, useEffect } from 'react'
import Link from 'next/link'
import {
  getUser, getExpressResult, getExtendedResult, clearAll, formatDate,
  type UserProfile, type ExpressTestResult, type ExtendedTestResult,
} from '@/lib/userStorage'

const RIASEC_NAMES: Record<string, string> = {
  R: '🔧 Мастер', I: '🔬 Исследователь', A: '🎨 Творец',
  S: '🤝 Помощник', E: '🚀 Лидер', C: '📋 Организатор',
}
const RIASEC_COLORS: Record<string, string> = {
  R: '#0369A1', I: '#7C3AED', A: '#D97706',
  S: '#16A34A', E: '#DC2626', C: '#0891B2',
}

export default function LKPage() {
  const [user, setUser] = useState<UserProfile | null>(null)
  const [express, setExpress] = useState<ExpressTestResult | null>(null)
  const [extended, setExtended] = useState<ExtendedTestResult | null>(null)
  const [loaded, setLoaded] = useState(false)
  const [showConfirm, setShowConfirm] = useState(false)

  useEffect(() => {
    setUser(getUser())
    setExpress(getExpressResult())
    setExtended(getExtendedResult())
    setLoaded(true)
  }, [])

  const handleClearData = () => {
    clearAll()
    setUser(null)
    setExpress(null)
    setExtended(null)
    setShowConfirm(false)
  }

  if (!loaded) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-8 h-8 rounded-full border-2 border-violet-400 border-t-transparent animate-spin" />
      </div>
    )
  }

  // Не авторизован и нет данных
  if (!user && !express && !extended) {
    return <EmptyState />
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-violet-50">
      <div className="max-w-2xl mx-auto px-4 py-12">

        {/* Шапка */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <p className="text-xs text-gray-400 uppercase tracking-widest font-semibold mb-1">Личный кабинет</p>
            <h1 className="text-2xl font-black text-[#0F172A]">
              {user ? `Привет, ${user.name.split(' ')[0]}! 👋` : 'Мои результаты'}
            </h1>
            {user?.email && <p className="text-sm text-gray-400 mt-0.5">{user.email}</p>}
          </div>
          <div className="w-12 h-12 rounded-full bg-violet-100 flex items-center justify-center text-2xl">
            {user ? user.name[0].toUpperCase() : '👤'}
          </div>
        </div>

        {/* Статус-карточки */}
        <div className="grid grid-cols-2 gap-4 mb-8">
          <div className={`rounded-2xl p-4 border-2 ${express ? 'border-green-200 bg-green-50' : 'border-gray-200 bg-gray-50'}`}>
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-1">Экспресс-тест</p>
            {express ? (
              <>
                <p className="text-sm font-bold text-green-700">✅ Пройден</p>
                <p className="text-xs text-gray-500 mt-0.5">{formatDate(express.completedAt)}</p>
              </>
            ) : (
              <>
                <p className="text-sm font-bold text-gray-400">Не пройден</p>
                <Link href="/test/" className="text-xs text-violet-600 hover:underline mt-0.5 block">
                  Пройти →
                </Link>
              </>
            )}
          </div>
          <div className={`rounded-2xl p-4 border-2 ${extended ? 'border-violet-200 bg-violet-50' : 'border-gray-200 bg-gray-50'}`}>
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-1">Расширенный тест</p>
            {extended ? (
              <>
                <p className="text-sm font-bold text-violet-700">✅ Пройден</p>
                <p className="text-xs text-gray-500 mt-0.5">{formatDate(extended.completedAt)}</p>
              </>
            ) : (
              <>
                <p className="text-sm font-bold text-gray-400">Не пройден</p>
                <Link href="/test/extended/" className="text-xs text-violet-600 hover:underline mt-0.5 block">
                  Пройти →
                </Link>
              </>
            )}
          </div>
        </div>

        {/* Результат экспресс-теста */}
        {express && (
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 mb-5">
            <div className="flex items-center justify-between mb-4">
              <p className="text-xs font-semibold text-gray-400 uppercase tracking-widest">Результат экспресс-теста</p>
              <Link href="/test/" className="text-xs text-violet-600 hover:underline">Пройти заново</Link>
            </div>
            <div className="flex items-center gap-3 mb-4">
              <span className="text-3xl">{RIASEC_NAMES[express.primary]?.split(' ')[0]}</span>
              <div>
                <p className="font-bold text-[#0F172A]">{RIASEC_NAMES[express.primary]?.split(' ').slice(1).join(' ')}</p>
                <p className="text-xs text-gray-400">Второй тип: {RIASEC_NAMES[express.secondary]}</p>
              </div>
            </div>
            {/* RIASEC бар */}
            <div className="space-y-2">
              {(Object.entries(express.scores) as [string, number][])
                .sort((a, b) => b[1] - a[1])
                .map(([type, score]) => {
                  const max = Math.max(...Object.values(express.scores))
                  const width = max > 0 ? Math.round((score / max) * 100) : 0
                  return (
                    <div key={type} className="flex items-center gap-2">
                      <span className="text-xs text-gray-500 w-20 text-right font-medium shrink-0">
                        {RIASEC_NAMES[type]}
                      </span>
                      <div className="flex-1 bg-gray-100 rounded-full h-2 overflow-hidden">
                        <div className="h-2 rounded-full" style={{ width: `${width}%`, background: RIASEC_COLORS[type] }} />
                      </div>
                      <span className="text-xs font-bold shrink-0 w-4" style={{ color: RIASEC_COLORS[type] }}>{score}</span>
                    </div>
                  )
                })}
            </div>
          </div>
        )}

        {/* Результат расширенного теста */}
        {extended && (
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 mb-5">
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-widest mb-4">Расширенный профиль</p>

            <div className="grid grid-cols-2 gap-3 mb-5">
              {[
                { label: 'Стиль мышления', value: { visual: '👁️ Визуальный', analytical: '🔢 Аналитический', creative: '💡 Ассоциативный' }[extended.learningStyle] ?? extended.learningStyle },
                { label: 'Социальный тип', value: { introvert: '🎧 Интроверт', extrovert: '🌟 Экстраверт', leader: '🚀 Лидер' }[extended.socialType] ?? extended.socialType },
                { label: 'Мотивация', value: { intrinsic: '🔥 Внутренняя', achievement: '🏆 Достижения', social: '🤝 Социальная' }[extended.motivationType] ?? extended.motivationType },
                { label: 'Среда', value: { structure: '📋 Структура', freedom: '🦋 Свобода', 'hands-on': '🔨 Практика' }[extended.bestEnvironment] ?? extended.bestEnvironment },
              ].map(item => (
                <div key={item.label} className="bg-gray-50 rounded-xl p-3">
                  <p className="text-[10px] text-gray-400 font-semibold uppercase tracking-wide mb-1">{item.label}</p>
                  <p className="text-sm font-bold text-[#0F172A]">{item.value}</p>
                </div>
              ))}
            </div>

            <p className="text-xs font-semibold text-gray-400 uppercase tracking-widest mb-2">Карьерные пути</p>
            <div className="space-y-2">
              {extended.careerPaths.map((path, i) => (
                <div key={path.title} className="flex items-center gap-3">
                  <span className="text-xs font-bold text-gray-400 w-4 shrink-0">{i + 1}</span>
                  <span className="flex-1 text-xs font-medium text-[#0F172A]">{path.title}</span>
                  <span className="text-xs font-black" style={{ color: i === 0 ? '#7C3AED' : '#9CA3AF' }}>{path.fit}%</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* CTA если расширенный не пройден */}
        {express && !extended && (
          <div className="rounded-2xl p-6 mb-6 text-center bg-gradient-to-br from-violet-50 to-purple-50 border border-violet-100">
            <p className="text-xl mb-2">🔍</p>
            <p className="text-sm font-bold text-[#0F172A] mb-1">Хотите узнать больше?</p>
            <p className="text-xs text-gray-500 mb-4">
              Пройдите расширенный тест — получите полный профиль с карьерными путями и рекомендациями по школам
            </p>
            <Link
              href="/test/extended/"
              className="inline-flex items-center gap-2 bg-violet-600 hover:bg-violet-700 text-white text-sm font-bold px-6 py-3 rounded-xl transition-all shadow-md shadow-violet-200"
            >
              Пройти расширенный тест →
            </Link>
          </div>
        )}

        {/* Действия */}
        <div className="flex flex-col gap-3">
          <Link
            href="/shkoly/"
            className="w-full py-3 rounded-xl bg-gray-900 hover:bg-gray-700 text-white text-sm font-bold text-center transition-all"
          >
            🏫 Открыть каталог школ
          </Link>

          {!showConfirm ? (
            <button
              onClick={() => setShowConfirm(true)}
              className="w-full py-3 rounded-xl border border-gray-200 text-gray-400 text-xs hover:text-red-400 hover:border-red-200 transition-all"
            >
              Удалить все данные
            </button>
          ) : (
            <div className="bg-red-50 border border-red-200 rounded-xl p-4">
              <p className="text-sm font-semibold text-red-700 mb-1">Удалить все данные?</p>
              <p className="text-xs text-red-500 mb-3">Это действие нельзя отменить. Все результаты тестов будут удалены.</p>
              <div className="flex gap-2">
                <button onClick={handleClearData} className="flex-1 py-2 rounded-lg bg-red-500 text-white text-xs font-bold hover:bg-red-600 transition-colors">
                  Да, удалить
                </button>
                <button onClick={() => setShowConfirm(false)} className="flex-1 py-2 rounded-lg border border-gray-200 text-gray-600 text-xs font-bold hover:bg-gray-50 transition-colors">
                  Отмена
                </button>
              </div>
            </div>
          )}
        </div>

        <p className="text-xs text-gray-300 text-center mt-8 leading-relaxed">
          Все данные хранятся только в вашем браузере и не передаются на сервер.
        </p>
      </div>
    </div>
  )
}

function EmptyState() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-violet-50 flex items-center justify-center px-4">
      <div className="max-w-sm text-center">
        <div className="text-6xl mb-6">👤</div>
        <h1 className="text-2xl font-black text-[#0F172A] mb-3">Личный кабинет</h1>
        <p className="text-gray-500 text-sm mb-8 leading-relaxed">
          Пройдите профориентационный тест — ваш профиль и результаты появятся здесь
        </p>
        <div className="space-y-3">
          <Link
            href="/test/"
            className="block w-full py-3.5 rounded-xl bg-[#0369A1] hover:bg-blue-500 text-white font-bold text-sm transition-all shadow-md shadow-blue-200"
          >
            Экспресс-тест (5 мин) →
          </Link>
          <Link
            href="/test/extended/"
            className="block w-full py-3.5 rounded-xl border border-violet-200 bg-violet-50 text-violet-700 font-bold text-sm transition-all hover:bg-violet-100"
          >
            Расширенный тест (10 мин) →
          </Link>
        </div>
      </div>
    </div>
  )
}
