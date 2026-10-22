'use client'
import { useState } from 'react'
import React from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { School, typeLabels, schoolMatchesType } from '@/data/schools'
import { getTypeColor, formatPrice } from '@/lib/utils'
import SchoolMatchModal from './SchoolMatchModal'
import SchoolCover from './SchoolCover'
import { schoolPhotoCount } from '@/lib/school-media'

function SchoolGallery({ school }: { school: School }) {
  const [current, setCurrent] = useState(0)
  // Список слотов: 1..photoCount, ошибочные помечаем
  const [errors, setErrors] = useState<Record<number, boolean>>({})

  const markError = (idx: number) => setErrors(e => ({ ...e, [idx]: true }))

  // Only request audited local files or photos submitted by the school.
  const count = schoolPhotoCount(school)

  // Слоты без ошибок
  const slots = Array.from({ length: count }, (_, i) => i + 1).filter(i => !errors[i])
  const hasPhotos = slots.length > 0

  // Если текущий слот сломан — сдвигаемся
  const safeIdx = current < slots.length ? current : 0
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
      {Array.from({ length: count }, (_, i) => i + 1).map(slot => (
        <div
          key={slot}
          className={`absolute inset-0 transition-opacity duration-300 ${
            !errors[slot] && activeSlot === slot ? 'opacity-100' : 'opacity-0 pointer-events-none'
          }`}
        >
          {!errors[slot] && activeSlot === slot ? (
            <Image
              src={school.photoUrls?.[slot-1] || `/schools/${school.slug}-${slot}.jpg`}
              unoptimized={!!school.photoUrls}
              alt={`${school.imageAlt} — фото ${slot}`}
              fill
              className="object-cover"
              sizes="(max-width: 768px) 100vw, 400px"
              onError={() => markError(slot)}
            />
          ) : null}
        </div>
      ))}

      {/* Если все фото сломаны или не загружены — placeholder */}
      {!hasPhotos && (
        <SchoolCover school={school} />
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
  const stars = school.rating ? Math.round(school.rating) : 0

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
        {school.rating && (
          <div className="absolute top-2 right-2 bg-white/90 backdrop-blur-sm rounded-xl px-2.5 py-1.5 text-center shadow-sm z-20 pointer-events-none">
            <div className="text-sm font-bold text-gray-900 leading-none">{school.rating}</div>
            <div className="text-yellow-400 text-[10px] leading-none mt-0.5">{'★'.repeat(stars)}</div>
          </div>
        )}
      </div>

      <div className="p-4">
        <div className="mb-2">
          <Link href={`/shkola/${school.slug}/`}>
            <h2 className="font-semibold text-[#0F172A] text-base leading-snug group-hover:text-[#0369A1] transition-colors duration-200 line-clamp-2">
              {school.name}
            </h2>
          </Link>
          {(school.reviewCount > 0 || !school.yandexRating) && <p className="text-xs text-gray-400 mt-0.5">{school.reviewCount} отзывов на ProSchools</p>}
          {school.yandexRating && (
            <p className="text-xs text-amber-600 mt-1">
              ★ {school.yandexRating} · {school.yandexMapsUrl ? <a href={school.yandexMapsUrl} target="_blank" rel="noopener noreferrer" className="hover:underline">Яндекс Карты</a> : 'Яндекс Карты'}
              {school.yandexReviewCount !== undefined ? ` · ${school.yandexReviewCount} отзывов` : ''}
            </p>
          )}
        </div>

        <p className="text-sm text-gray-600 leading-relaxed mb-3 line-clamp-2">
          {school.description}
        </p>

        <div className="flex items-center gap-1.5 text-xs text-gray-500 mb-3">
          <svg className="w-3.5 h-3.5 shrink-0 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10.5a3 3 0 11-6 0 3 3 0 016 0z" />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1115 0z" />
          </svg>
          <span className="truncate">{[school.city, school.address].filter(Boolean).join(', ')}</span>
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

        <div className="flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-gray-100">
          <div className="text-sm">
            {school.representativeSubmitted ? <span className="text-sm font-semibold">{school.priceDescription || 'Стоимость по запросу'}</span> : school.priceFrom !== undefined ? (
              school.priceFrom === 0 ? (
                <span className="text-emerald-600 font-semibold">Бесплатно</span>
              ) : (
                <span className="text-gray-700">
                  от <span className="font-semibold text-[#0F172A]">{formatPrice(school.priceFrom)}</span>
                </span>
              )
            ) : schoolMatchesType(school, 'semejnye') ? (
              <span className="text-gray-500">Стоимость по запросу</span>
            ) : school.type === 'podgotovka-ege' || school.type === 'podgotovka-oge' || school.type === 'programmirovanie' || school.type === 'shahmatnye' || school.type === 'sportivnye' || school.type === 'litsei' || school.type === 'muzykalnye' || school.type === 'hudozhestvennye' || school.type === 'iskusstv' ? (
              <span className="text-gray-500">Платно, цена по запросу</span>
            ) : (
              <span className="text-gray-500">Стоимость уточняется</span>
            )}
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <a
              href={`tel:${school.phone}`}
              onClick={() => window.ym?.(108789843, 'reachGoal', 'phone_click')}
              className="text-xs text-gray-500 hover:text-[#0369A1] transition-colors duration-200 cursor-pointer whitespace-nowrap"
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

        <SchoolMatchModal school={school} />
      </div>
    </article>
  )
}
