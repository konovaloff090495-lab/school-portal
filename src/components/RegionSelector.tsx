'use client'

import { useState, useEffect, useRef } from 'react'
import Link from 'next/link'
import { regionSlugs, regionLabels, RegionSlug } from '@/data/schools'

const STORAGE_KEY = 'selected_region'

const cityToRegion: Record<string, RegionSlug> = {
  'Москва': 'moskva',
  'Moscow': 'moskva',
  'Московская область': 'moskovskaya-oblast',
  'Moscow Oblast': 'moskovskaya-oblast',
  'Новосибирск': 'novosibirsk',
  'Novosibirsk': 'novosibirsk',
}

async function detectRegion(): Promise<{ region: RegionSlug; label: string } | null> {
  try {
    const res = await fetch('https://ipapi.co/json/', { signal: AbortSignal.timeout(4000) })
    if (!res.ok) return null
    const data = await res.json()
    const city: string = data.city || ''
    const regionName: string = data.region || ''
    const slug = cityToRegion[city] || cityToRegion[regionName]
    if (slug) return { region: slug, label: regionLabels[slug] }
    return null
  } catch {
    return null
  }
}

export default function RegionSelector() {
  const [open, setOpen] = useState(false)
  const [savedRegion, setSavedRegion] = useState<RegionSlug | null>(null)
  const [prompt, setPrompt] = useState<{ region: RegionSlug; label: string } | null>(null)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEY) as RegionSlug | null
    if (saved && regionSlugs.includes(saved)) {
      setSavedRegion(saved)
      return
    }
    detectRegion().then(detected => {
      if (detected) setPrompt(detected)
    })
  }, [])

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [])

  function confirmRegion(slug: RegionSlug) {
    localStorage.setItem(STORAGE_KEY, slug)
    setSavedRegion(slug)
    setPrompt(null)
  }

  function dismissPrompt() {
    setPrompt(null)
    setOpen(true)
  }

  const displayLabel = savedRegion ? regionLabels[savedRegion] : 'Выбрать город'

  return (
    <div className="relative" ref={ref}>
      {/* Geo-detection confirmation banner */}
      {prompt && !open && (
        <div className="absolute top-full right-0 mt-2 z-50 bg-[#0F172A] border border-white/20 rounded-xl shadow-xl p-4 w-64 text-sm">
          <p className="text-slate-300 mb-3">
            Ваш город — <span className="text-white font-semibold">{prompt.label}</span>?
          </p>
          <div className="flex gap-2">
            <Link
              href={`/shkoly/${prompt.region}/`}
              onClick={() => confirmRegion(prompt.region)}
              className="flex-1 text-center bg-[#0369A1] hover:bg-blue-500 text-white py-1.5 rounded-lg font-medium transition-colors"
            >
              Да
            </Link>
            <button
              onClick={dismissPrompt}
              className="flex-1 bg-white/10 hover:bg-white/20 text-slate-300 py-1.5 rounded-lg transition-colors"
            >
              Другой город
            </button>
          </div>
        </div>
      )}

      {/* Trigger button */}
      <button
        onClick={() => { setOpen(o => !o); setPrompt(null) }}
        className="flex items-center gap-1.5 text-sm text-slate-300 hover:text-white transition-colors duration-200 font-medium cursor-pointer"
      >
        <svg className="w-4 h-4 text-[#0369A1] shrink-0" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" d="M15 10.5a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z" />
          <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1 1 15 0Z" />
        </svg>
        <span>{displayLabel}</span>
        <svg className={`w-3.5 h-3.5 transition-transform duration-200 ${open ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" d="m19 9-7 7-7-7" />
        </svg>
      </button>

      {/* Dropdown */}
      {open && (
        <div className="absolute top-full right-0 mt-2 z-50 bg-[#0F172A] border border-white/20 rounded-xl shadow-xl py-2 w-52">
          {regionSlugs.map(region => (
            <Link
              key={region}
              href={`/shkoly/${region}/`}
              onClick={() => { confirmRegion(region); setOpen(false) }}
              className={`block px-4 py-2 text-sm transition-colors hover:bg-white/10 ${savedRegion === region ? 'text-white font-semibold' : 'text-slate-300'}`}
            >
              {regionLabels[region]}
            </Link>
          ))}
          <div className="border-t border-white/10 mt-1 pt-1">
            <Link
              href="/shkoly/"
              onClick={() => setOpen(false)}
              className="block px-4 py-2 text-sm text-[#0369A1] hover:bg-white/10 transition-colors font-medium"
            >
              Все школы России
            </Link>
          </div>
        </div>
      )}
    </div>
  )
}
