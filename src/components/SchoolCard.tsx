'use client'
import { useState } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { School, typeLabels } from '@/data/schools'
import { getTypeColor, formatPrice } from '@/lib/utils'

const placeholderGradient: Record<string, string> = {
  gosudarstvennye: 'from-blue-50 to-blue-100',
  chastnie:        'from-purple-50 to-purple-100',
  online:          'from-emerald-50 to-emerald-100',
  vechernie:       'from-indigo-50 to-indigo-100',
  eksternal:       'from-amber-50 to-amber-100',
  semejnye:        'from-teal-50 to-teal-100',
  domashnie:       'from-yellow-50 to-yellow-100',
  'pri-vuzakh':    'from-indigo-50 to-indigo-100',
  profilnye:       'from-rose-50 to-rose-100',
  gimnazii:        'from-cyan-50 to-cyan-100',
  korrektsionnye:  'from-lime-50 to-lime-100',
  kadetskie:       'from-slate-50 to-slate-100',
}

const placeholderIconColor: Record<string, string> = {
  gosudarstvennye: 'text-blue-300',
  chastnie:        'text-purple-300',
  online:          'text-emerald-300',
  vechernie:       'text-indigo-300',
  eksternal:       'text-amber-300',
  semejnye:        'text-teal-300',
  domashnie:       'text-yellow-300',
  'pri-vuzakh':    'text-indigo-300',
  profilnye:       'text-rose-300',
  gimnazii:        'text-cyan-300',
  korrektsionnye:  'text-lime-300',
  kadetskie:       'text-slate-300',
}

function SchoolPlaceholder({ type, name }: { type: string; name: string }) {
  const gradient = placeholderGradient[type] ?? 'from-gray-50 to-gray-100'
  const iconColor = placeholderIconColor[type] ?? 'text-gray-300'
  const initials = name.split(' ').slice(0, 2).map(w => w[0]).join('').toUpperCase()

  return (
    <div className={`absolute inset-0 bg-gradient-to-br ${gradient} flex flex-col items-center justify-center gap-2`}>
      <svg className={`w-14 h-14 ${iconColor}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M3.75 21h16.5M4.5 3h15M5.25 3v18m13.5-18v18M9 6.75h1.5m-1.5 3h1.5m-1.5 3h1.5m3-6H15m-1.5 3H15m-1.5 3H15M9 21v-3.375c0-.621.504-1.125 1.125-1.125h3.75c.621 0 1.125.504 1.125 1.125V21" />
      </svg>
      <span className={`text-lg font-bold ${iconColor} opacity-60`}>{initials}</span>
    </div>
  )
}

export default function SchoolCard({ school }: { school: School }) {
  const [imgError, setImgError] = useState(false)
  const stars = Math.round(school.rating)

  return (
    <article className="bg-white rounded-2xl border border-gray-200 hover:border-[#0369A1] hover:shadow-xl transition-all duration-300 overflow-hidden group cursor-pointer">
      <Link href={`/shkola/${school.slug}/`} className="block relative h-44 overflow-hidden bg-gray-100">
        {!imgError ? (
          <Image
            src={`/schools/${school.slug}.jpg`}
            alt={school.imageAlt}
            fill
            className="object-cover group-hover:scale-105 transition-transform duration-500"
            sizes="(max-width: 768px) 100vw, 400px"
            onError={() => setImgError(true)}
          />
        ) : (
          <SchoolPlaceholder type={school.type} name={school.name} />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-black/30 to-transparent" />
        <div className="absolute bottom-2 left-3 flex items-center gap-1.5">
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
        <div className="absolute top-2 right-2 bg-white/90 backdrop-blur-sm rounded-xl px-2.5 py-1.5 text-center shadow-sm">
          <div className="text-sm font-bold text-gray-900 leading-none">{school.rating}</div>
          <div className="text-yellow-400 text-[10px] leading-none mt-0.5">{'★'.repeat(stars)}</div>
        </div>
      </Link>

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
