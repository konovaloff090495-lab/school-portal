'use client'
import { useState } from 'react'
import React from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { School, typeLabels } from '@/data/schools'
import { getTypeColor, formatPrice } from '@/lib/utils'

// градиент фона плейсхолдера
const placeholderGradient: Record<string, string> = {
  gosudarstvennye: 'from-blue-100 via-blue-50 to-sky-100',
  chastnie:        'from-purple-100 via-purple-50 to-fuchsia-100',
  online:          'from-emerald-100 via-emerald-50 to-teal-100',
  vechernie:       'from-indigo-100 via-indigo-50 to-violet-100',
  eksternal:       'from-amber-100 via-amber-50 to-yellow-100',
  semejnye:        'from-teal-100 via-teal-50 to-cyan-100',
  domashnie:       'from-yellow-100 via-yellow-50 to-orange-100',
  'pri-vuzakh':    'from-indigo-100 via-indigo-50 to-blue-100',
  profilnye:       'from-rose-100 via-rose-50 to-pink-100',
  gimnazii:        'from-cyan-100 via-cyan-50 to-sky-100',
  korrektsionnye:  'from-lime-100 via-lime-50 to-green-100',
  kadetskie:       'from-slate-100 via-slate-50 to-gray-100',
}

// цвет иконки и акцентов
const placeholderAccent: Record<string, { icon: string; ring: string; dot: string }> = {
  gosudarstvennye: { icon: 'text-blue-400',   ring: 'border-blue-200',   dot: 'bg-blue-300' },
  chastnie:        { icon: 'text-purple-400', ring: 'border-purple-200', dot: 'bg-purple-300' },
  online:          { icon: 'text-emerald-400',ring: 'border-emerald-200',dot: 'bg-emerald-300' },
  vechernie:       { icon: 'text-indigo-400', ring: 'border-indigo-200', dot: 'bg-indigo-300' },
  eksternal:       { icon: 'text-amber-400',  ring: 'border-amber-200',  dot: 'bg-amber-300' },
  semejnye:        { icon: 'text-teal-400',   ring: 'border-teal-200',   dot: 'bg-teal-300' },
  domashnie:       { icon: 'text-yellow-500', ring: 'border-yellow-200', dot: 'bg-yellow-300' },
  'pri-vuzakh':    { icon: 'text-indigo-400', ring: 'border-indigo-200', dot: 'bg-indigo-300' },
  profilnye:       { icon: 'text-rose-400',   ring: 'border-rose-200',   dot: 'bg-rose-300' },
  gimnazii:        { icon: 'text-cyan-400',   ring: 'border-cyan-200',   dot: 'bg-cyan-300' },
  korrektsionnye:  { icon: 'text-lime-500',   ring: 'border-lime-200',   dot: 'bg-lime-400' },
  kadetskie:       { icon: 'text-slate-400',  ring: 'border-slate-200',  dot: 'bg-slate-300' },
}

// SVG-иконки по типу школы
const typeIcons: Record<string, React.ReactNode> = {
  gosudarstvennye: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.2} strokeLinecap="round" strokeLinejoin="round">
      <path d="M3.75 21h16.5M4.5 3h15M5.25 3v18m13.5-18v18M9 6.75h1.5m-1.5 3h1.5m-1.5 3h1.5m3-6H15m-1.5 3H15m-1.5 3H15M9 21v-3.375c0-.621.504-1.125 1.125-1.125h3.75c.621 0 1.125.504 1.125 1.125V21" />
    </svg>
  ),
  chastnie: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.2} strokeLinecap="round" strokeLinejoin="round">
      <path d="M2.25 21h19.5M9 3.75H5.625a.375.375 0 00-.375.375v7.5c0 .207.168.375.375.375H9M9 3.75v7.5M9 3.75H14.25M9 11.25h5.25M14.25 3.75H18.375c.207 0 .375.168.375.375v7.5a.375.375 0 01-.375.375H14.25M14.25 3.75v7.5M12 21v-6.75A2.25 2.25 0 009.75 12h-.75A2.25 2.25 0 006.75 14.25V21" />
    </svg>
  ),
  online: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.2} strokeLinecap="round" strokeLinejoin="round">
      <path d="M9 17.25v1.007a3 3 0 01-.879 2.122L7.5 21h9l-.621-.621A3 3 0 0115 18.257V17.25m6-12V15a2.25 2.25 0 01-2.25 2.25H5.25A2.25 2.25 0 013 15V5.25m18 0A2.25 2.25 0 0018.75 3H5.25A2.25 2.25 0 003 5.25m18 0v.243a2.25 2.25 0 01-1.07 1.916l-7.5 4.615a2.25 2.25 0 01-2.36 0L3.32 7.409a2.25 2.25 0 01-1.07-1.916V5.25" />
    </svg>
  ),
  vechernie: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.2} strokeLinecap="round" strokeLinejoin="round">
      <path d="M21.752 15.002A9.718 9.718 0 0118 15.75c-5.385 0-9.75-4.365-9.75-9.75 0-1.33.266-2.597.748-3.752A9.753 9.753 0 003 11.25C3 16.635 7.365 21 12.75 21a9.753 9.753 0 009.002-5.998z" />
    </svg>
  ),
  eksternal: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.2} strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 6.042A8.967 8.967 0 006 3.75c-1.052 0-2.062.18-3 .512v14.25A8.987 8.987 0 016 18c2.305 0 4.408.867 6 2.292m0-14.25a8.966 8.966 0 016-2.292c1.052 0 2.062.18 3 .512v14.25A8.987 8.987 0 0018 18a8.967 8.967 0 00-6 2.292m0-14.25v14.25" />
    </svg>
  ),
  semejnye: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.2} strokeLinecap="round" strokeLinejoin="round">
      <path d="M2.25 12l8.954-8.955c.44-.439 1.152-.439 1.591 0L21.75 12M4.5 9.75v10.125c0 .621.504 1.125 1.125 1.125H9.75v-4.875c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125V21h4.125c.621 0 1.125-.504 1.125-1.125V9.75M8.25 21h8.25" />
    </svg>
  ),
  domashnie: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.2} strokeLinecap="round" strokeLinejoin="round">
      <path d="M4.26 10.147a60.436 60.436 0 00-.491 6.347A48.627 48.627 0 0112 20.904a48.627 48.627 0 018.232-4.41 60.46 60.46 0 00-.491-6.347m-15.482 0a50.57 50.57 0 00-2.658-.813A59.905 59.905 0 0112 3.493a59.902 59.902 0 0110.399 5.84c-.896.248-1.783.52-2.658.814m-15.482 0A50.697 50.697 0 0112 13.489a50.702 50.702 0 017.74-3.342M6.75 15a.75.75 0 100-1.5.75.75 0 000 1.5zm0 0v-3.675A55.378 55.378 0 0112 8.443m-7.007 11.55A5.981 5.981 0 006.75 15.75v-1.5" />
    </svg>
  ),
  'pri-vuzakh': (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.2} strokeLinecap="round" strokeLinejoin="round">
      <path d="M4.26 10.147a60.436 60.436 0 00-.491 6.347A48.627 48.627 0 0112 20.904a48.627 48.627 0 018.232-4.41 60.46 60.46 0 00-.491-6.347m-15.482 0a50.57 50.57 0 00-2.658-.813A59.905 59.905 0 0112 3.493a59.902 59.902 0 0110.399 5.84c-.896.248-1.783.52-2.658.814m-15.482 0A50.697 50.697 0 0112 13.489a50.702 50.702 0 017.74-3.342M6.75 15a.75.75 0 100-1.5.75.75 0 000 1.5zm0 0v-3.675A55.378 55.378 0 0112 8.443m-7.007 11.55A5.981 5.981 0 006.75 15.75v-1.5" />
    </svg>
  ),
  profilnye: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.2} strokeLinecap="round" strokeLinejoin="round">
      <path d="M9.75 3.104v5.714a2.25 2.25 0 01-.659 1.591L5 14.5M9.75 3.104c-.251.023-.501.05-.75.082m.75-.082a24.301 24.301 0 014.5 0m0 0v5.714c0 .597.237 1.17.659 1.591L19.8 15.3M14.25 3.104c.251.023.501.05.75.082M19.8 15.3l-1.57.393A9.065 9.065 0 0112 15a9.065 9.065 0 00-6.23-.693L5 14.5m14.8.8l1.402 1.402c1.232 1.232.65 3.318-1.067 3.611A48.309 48.309 0 0112 21c-2.773 0-5.491-.235-8.135-.687-1.718-.293-2.3-2.379-1.067-3.61L5 14.5" />
    </svg>
  ),
  gimnazii: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.2} strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 3v2.25m6.364.386l-1.591 1.591M21 12h-2.25m-.386 6.364l-1.591-1.591M12 18.75V21m-4.773-4.227l-1.591 1.591M5.25 12H3m4.227-4.773L5.636 5.636M15.75 12a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0z" />
    </svg>
  ),
  korrektsionnye: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.2} strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 8.25c0-2.485-2.099-4.5-4.688-4.5-1.935 0-3.597 1.126-4.312 2.733-.715-1.607-2.377-2.733-4.313-2.733C5.1 3.75 3 5.765 3 8.25c0 7.22 9 12 9 12s9-4.78 9-12z" />
    </svg>
  ),
  kadetskie: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.2} strokeLinecap="round" strokeLinejoin="round">
      <path d="M11.48 3.499a.562.562 0 011.04 0l2.125 5.111a.563.563 0 00.475.345l5.518.442c.499.04.701.663.321.988l-4.204 3.602a.563.563 0 00-.182.557l1.285 5.385a.562.562 0 01-.84.61l-4.725-2.885a.563.563 0 00-.586 0L6.982 20.54a.562.562 0 01-.84-.61l1.285-5.386a.562.562 0 00-.182-.557l-4.204-3.602a.563.563 0 01.321-.988l5.518-.442a.563.563 0 00.475-.345L11.48 3.5z" />
    </svg>
  ),
}

function SchoolPlaceholder({ type, name }: { type: string; name: string }) {
  const gradient = placeholderGradient[type] ?? 'from-gray-100 via-gray-50 to-slate-100'
  const accent   = placeholderAccent[type]   ?? { icon: 'text-gray-400', ring: 'border-gray-200', dot: 'bg-gray-300' }
  const icon     = typeIcons[type]           ?? typeIcons['gosudarstvennye']
  const initials = name
    .replace(/[«»"'№]/g, '')
    .split(/\s+/)
    .filter(w => /^[А-ЯA-Z]/i.test(w))
    .slice(0, 2)
    .map(w => w[0].toUpperCase())
    .join('')

  return (
    <div className={`absolute inset-0 bg-gradient-to-br ${gradient} flex flex-col items-center justify-center gap-3 select-none overflow-hidden`}>
      {/* декоративные круги */}
      <div className={`absolute -top-8 -right-8 w-32 h-32 rounded-full border-2 ${accent.ring} opacity-30`} />
      <div className={`absolute -bottom-6 -left-6 w-24 h-24 rounded-full border-2 ${accent.ring} opacity-20`} />
      <div className={`absolute top-1/2 left-4 w-2 h-2 rounded-full ${accent.dot} opacity-40`} />
      <div className={`absolute top-8 left-1/3 w-1.5 h-1.5 rounded-full ${accent.dot} opacity-30`} />
      <div className={`absolute bottom-8 right-1/3 w-2 h-2 rounded-full ${accent.dot} opacity-35`} />
      {/* иконка в кружке */}
      <div className={`w-16 h-16 rounded-2xl bg-white/60 backdrop-blur-sm border ${accent.ring} flex items-center justify-center shadow-sm ${accent.icon}`}>
        <div className="w-9 h-9">
          {icon}
        </div>
      </div>
      {/* инициалы */}
      <span className={`text-base font-bold ${accent.icon} opacity-70 tracking-widest`}>
        {initials || '—'}
      </span>
    </div>
  )
}

// Количество фото в галерее на школу (должно совпадать с PHOTOS_PER_SCHOOL в скрипте)
const GALLERY_SIZE = 3

function SchoolGallery({ school }: { school: School }) {
  const [current, setCurrent] = useState(0)
  // Список слотов: 1..GALLERY_SIZE, ошибочные помечаем
  const [errors, setErrors] = useState<Record<number, boolean>>({})

  const markError = (idx: number) => setErrors(e => ({ ...e, [idx]: true }))

  // Слоты без ошибок
  const slots = Array.from({ length: GALLERY_SIZE }, (_, i) => i + 1).filter(i => !errors[i])
  const hasPhotos = slots.length > 0

  // Если текущий слот сломан — сдвигаемся
  const safeIdx = slots.includes(current + 1) ? current : 0
  const activeSlot = slots[safeIdx] ?? null

  const prev = (e: React.MouseEvent) => {
    e.preventDefault()
    setCurrent(i => (i - 1 + slots.length) % slots.length)
  }
  const next = (e: React.MouseEvent) => {
    e.preventDefault()
    setCurrent(i => (i + 1) % slots.length)
  }

  return (
    <div className="relative h-44 overflow-hidden bg-gray-100">
      {/* Все изображения слоями, показываем только активное */}
      {Array.from({ length: GALLERY_SIZE }, (_, i) => i + 1).map(slot => (
        <div
          key={slot}
          className={`absolute inset-0 transition-opacity duration-300 ${
            !errors[slot] && activeSlot === slot ? 'opacity-100' : 'opacity-0 pointer-events-none'
          }`}
        >
          {!errors[slot] ? (
            <Image
              src={`/schools/${school.slug}-${slot}.jpg`}
              alt={`${school.imageAlt} — фото ${slot}`}
              fill
              className="object-cover"
              sizes="(max-width: 768px) 100vw, 400px"
              onError={() => markError(slot)}
              priority={slot === 1}
            />
          ) : null}
        </div>
      ))}

      {/* Если все фото сломаны или не загружены — placeholder */}
      {!hasPhotos && (
        <SchoolPlaceholder type={school.type} name={school.name} />
      )}

      {/* Оверлей */}
      <div className="absolute inset-0 bg-gradient-to-t from-black/35 to-transparent pointer-events-none" />

      {/* Стрелки — показываем только если фото > 1 */}
      {hasPhotos && slots.length > 1 && (
        <>
          <button
            onClick={prev}
            className="absolute left-2 top-1/2 -translate-y-1/2 w-7 h-7 rounded-full bg-black/40 hover:bg-black/60 backdrop-blur-sm flex items-center justify-center text-white transition-all opacity-0 group-hover:opacity-100 z-10"
            aria-label="Предыдущее фото"
          >
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          <button
            onClick={next}
            className="absolute right-2 top-1/2 -translate-y-1/2 w-7 h-7 rounded-full bg-black/40 hover:bg-black/60 backdrop-blur-sm flex items-center justify-center text-white transition-all opacity-0 group-hover:opacity-100 z-10"
            aria-label="Следующее фото"
          >
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 5l7 7-7 7" />
            </svg>
          </button>
        </>
      )}

      {/* Точки-индикаторы */}
      {hasPhotos && slots.length > 1 && (
        <div className="absolute bottom-9 left-1/2 -translate-x-1/2 flex gap-1 z-10">
          {slots.map((slot, i) => (
            <button
              key={slot}
              onClick={(e) => { e.preventDefault(); setCurrent(i) }}
              className={`rounded-full transition-all ${
                i === safeIdx
                  ? 'w-4 h-1.5 bg-white'
                  : 'w-1.5 h-1.5 bg-white/50 hover:bg-white/80'
              }`}
              aria-label={`Фото ${i + 1}`}
            />
          ))}
        </div>
      )}

      {/* Счётчик фото (показывается при наведении) */}
      {hasPhotos && slots.length > 1 && (
        <div className="absolute top-2 left-2 bg-black/40 backdrop-blur-sm text-white text-[10px] px-1.5 py-0.5 rounded-md opacity-0 group-hover:opacity-100 transition-opacity z-10">
          {safeIdx + 1} / {slots.length}
        </div>
      )}
    </div>
  )
}

export default function SchoolCard({ school }: { school: School }) {
  const stars = Math.round(school.rating)

  return (
    <article className="bg-white rounded-2xl border border-gray-200 hover:border-[#0369A1] hover:shadow-xl transition-all duration-300 overflow-hidden group cursor-pointer">
      <div className="relative">
        <Link href={`/shkola/${school.slug}/`} className="block">
          <SchoolGallery school={school} />
        </Link>
        {/* Badges поверх галереи */}
        <div className="absolute bottom-2 left-3 flex items-center gap-1.5 z-20 pointer-events-none">
          <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold backdrop-blur-sm bg-white/90 ${getTypeColor(school.type)}`}>
            {typeLabels[school.type]}
          </span>
          {school.metro && (
            <span className="flex items-center gap-1 bg-white/90 backdrop-blur-sm text-xs text-gray-700 px-2 py-1 rounded-full">
              <span className="w-3.5 h-3.5 bg-red-500 rounded-full text-white text-[7px] flex items-center justify-center font-bold shrink-0">М</span>
              {school.metro}
            </span>
          )}
        </div>
        <div className="absolute top-2 right-2 bg-white/90 backdrop-blur-sm rounded-xl px-2.5 py-1.5 text-center shadow-sm z-20 pointer-events-none">
          <div className="text-sm font-bold text-gray-900 leading-none">{school.rating}</div>
          <div className="text-yellow-400 text-[10px] leading-none mt-0.5">{'★'.repeat(stars)}</div>
        </div>
      </div>

      <div className="p-4">
        <div className="mb-2">
          <Link href={`/shkola/${school.slug}/`}>
            <h2 className="font-semibold text-[#0F172A] text-base leading-snug group-hover:text-[#0369A1] transition-colors duration-200 line-clamp-2">
              {school.name}
            </h2>
          </Link>
          <p className="text-xs text-gray-400 mt-0.5">{school.reviewCount} отзывов</p>
        </div>

        <p className="text-sm text-gray-600 leading-relaxed mb-3 line-clamp-2">
          {school.description}
        </p>

        <div className="flex items-center gap-1.5 text-xs text-gray-500 mb-3">
          <svg className="w-3.5 h-3.5 shrink-0 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10.5a3 3 0 11-6 0 3 3 0 016 0z" />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1115 0z" />
          </svg>
          <span className="truncate">{school.city}, {school.address}</span>
        </div>

        {school.features.length > 0 && (
          <div className="flex flex-wrap gap-1 mb-4">
            {school.features.slice(0, 3).map(f => (
              <span key={f} className="text-xs bg-slate-100 text-slate-600 px-2 py-0.5 rounded-md">
                {f}
              </span>
            ))}
            {school.features.length > 3 && (
              <span className="text-xs text-gray-400">+{school.features.length - 3}</span>
            )}
          </div>
        )}

        <div className="flex items-center justify-between pt-3 border-t border-gray-100">
          <div className="text-sm">
            {school.priceFrom !== undefined ? (
              school.priceFrom === 0 ? (
                <span className="text-emerald-600 font-semibold">Бесплатно</span>
              ) : (
                <span className="text-gray-700">
                  от <span className="font-semibold text-[#0F172A]">{formatPrice(school.priceFrom)}</span>
                </span>
              )
            ) : (
              <span className="text-emerald-600 font-semibold">Бесплатно</span>
            )}
          </div>
          <div className="flex items-center gap-2">
            <a
              href={`tel:${school.phone}`}
              className="text-xs text-gray-500 hover:text-[#0369A1] transition-colors duration-200 cursor-pointer"
            >
              {school.phone}
            </a>
            <Link
              href={`/shkola/${school.slug}/`}
              className="text-xs bg-[#0369A1] text-white px-3 py-1.5 rounded-lg hover:bg-blue-500 transition-colors duration-200 font-semibold cursor-pointer"
            >
              Подробнее
            </Link>
          </div>
        </div>
      </div>
    </article>
  )
}
