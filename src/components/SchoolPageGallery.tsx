'use client'

import { useState } from 'react'
import Image from 'next/image'

const PHOTOS_COUNT = 3

interface Props {
  slug: string
  imageAlt: string
  children: React.ReactNode  // overlay (title, badge, rating)
}

export default function SchoolPageGallery({ slug, imageAlt, children }: Props) {
  const [current, setCurrent]   = useState(0)
  const [errors, setErrors]     = useState<Record<number, boolean>>({})

  const available = Array.from({ length: PHOTOS_COUNT }, (_, i) => i).filter(i => !errors[i])
  const validIdx  = available.includes(current) ? current : (available[0] ?? 0)

  function prev() {
    const pos = available.indexOf(validIdx)
    setCurrent(available[(pos - 1 + available.length) % available.length])
  }
  function next() {
    const pos = available.indexOf(validIdx)
    setCurrent(available[(pos + 1) % available.length])
  }

  const src = (i: number) => `/schools/${slug}-${i + 1}.jpg`

  return (
    <div className="mt-6 relative h-64 md:h-80 rounded-2xl overflow-hidden bg-gray-200 group">
      {/* Главное фото */}
      {Array.from({ length: PHOTOS_COUNT }, (_, i) => (
        <Image
          key={i}
          src={src(i)}
          alt={`${imageAlt} — фото ${i + 1}`}
          fill
          priority={i === 0}
          sizes="(max-width: 1280px) 100vw, 1200px"
          className={`object-cover transition-opacity duration-300 ${i === validIdx && !errors[i] ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}
          onError={() => setErrors(e => ({ ...e, [i]: true }))}
        />
      ))}

      {/* Градиент + оверлей */}
      <div className="absolute inset-0 bg-gradient-to-t from-black/65 via-black/10 to-transparent pointer-events-none" />
      <div className="absolute bottom-4 left-5 right-5 flex items-end justify-between">
        {children}
      </div>

      {/* Стрелки — только если >1 фото */}
      {available.length > 1 && (
        <>
          <button
            onClick={prev}
            className="absolute left-3 top-1/2 -translate-y-1/2 w-9 h-9 rounded-full bg-black/40 hover:bg-black/60 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer"
            aria-label="Предыдущее фото"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          <button
            onClick={next}
            className="absolute right-3 top-1/2 -translate-y-1/2 w-9 h-9 rounded-full bg-black/40 hover:bg-black/60 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer"
            aria-label="Следующее фото"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 5l7 7-7 7" />
            </svg>
          </button>

          {/* Точки */}
          <div className="absolute top-3 left-1/2 -translate-x-1/2 flex gap-1.5">
            {available.map(i => (
              <button
                key={i}
                onClick={() => setCurrent(i)}
                className={`rounded-full transition-all cursor-pointer ${i === validIdx ? 'w-5 h-1.5 bg-white' : 'w-1.5 h-1.5 bg-white/50 hover:bg-white/80'}`}
                aria-label={`Фото ${i + 1}`}
              />
            ))}
          </div>
        </>
      )}

      {/* Миниатюры снизу */}
      {available.length > 1 && (
        <div className="absolute bottom-16 right-4 flex gap-1.5">
          {available.map(i => (
            <button
              key={i}
              onClick={() => setCurrent(i)}
              className={`relative w-14 h-10 rounded-lg overflow-hidden border-2 cursor-pointer transition-all ${i === validIdx ? 'border-white' : 'border-white/40 hover:border-white/80'}`}
              aria-label={`Фото ${i + 1}`}
            >
              <Image
                src={src(i)}
                alt={`${imageAlt} миниатюра ${i + 1}`}
                fill
                sizes="56px"
                className="object-cover"
              />
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
