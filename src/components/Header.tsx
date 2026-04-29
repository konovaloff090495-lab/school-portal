'use client'

import { useState, useEffect, useRef } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { regionSlugs, regionLabels, typeSlugs, typeLabels, RegionSlug } from '@/data/schools'

const STORAGE_KEY = 'selected_region'

const SCHOOL_TYPES = [
  { slug: 'gosudarstvennye', icon: '🏫', desc: 'Бесплатно · по прописке' },
  { slug: 'chastnie',        icon: '✨', desc: 'Платно · малые классы' },
  { slug: 'gimnazii',        icon: '🏛️', desc: 'Профильное · олимпиады' },
  { slug: 'kadetskie',       icon: '🎖️', desc: 'Дисциплина · НВП' },
  { slug: 'online',          icon: '💻', desc: 'Дистанционно · из любой точки' },
  { slug: 'profilnye',       icon: '🎓', desc: 'IT, медицина, право, искусство' },
  { slug: 'semejnye',        icon: '🏡', desc: 'Родители в процессе обучения' },
  { slug: 'eksternal',       icon: '⚡', desc: 'Ускоренная программа · аттестат' },
] as const

export default function Header() {
  const router = useRouter()
  const [city, setCity] = useState('Москва')
  const [cityOpen, setCityOpen] = useState(false)
  const [citySearch, setCitySearch] = useState('')
  const [schoolsOpen, setSchoolsOpen] = useState(false)
  const [searchVal, setSearchVal] = useState('')
  const navRef = useRef<HTMLElement>(null)
  const cityInputRef = useRef<HTMLInputElement>(null)

  // Restore saved region
  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEY) as RegionSlug | null
    if (saved && regionSlugs.includes(saved)) setCity(regionLabels[saved])
  }, [])

  // Close schools dropdown on outside click
  useEffect(() => {
    function handler(e: MouseEvent) {
      if (navRef.current && !navRef.current.contains(e.target as Node)) setSchoolsOpen(false)
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  // Esc closes everything
  useEffect(() => {
    function handler(e: KeyboardEvent) {
      if (e.key === 'Escape') { setCityOpen(false); setSchoolsOpen(false) }
    }
    document.addEventListener('keydown', handler)
    return () => document.removeEventListener('keydown', handler)
  }, [])

  // Focus search when city modal opens
  useEffect(() => {
    if (cityOpen) setTimeout(() => cityInputRef.current?.focus(), 50)
  }, [cityOpen])

  function selectCity(slug: RegionSlug) {
    localStorage.setItem(STORAGE_KEY, slug)
    setCity(regionLabels[slug])
    setCityOpen(false)
    setCitySearch('')
  }

  function handleSearch(e: React.FormEvent) {
    e.preventDefault()
    if (searchVal.trim()) router.push(`/poisk?q=${encodeURIComponent(searchVal.trim())}`)
  }

  const filteredCities = regionSlugs.filter(s =>
    regionLabels[s].toLowerCase().includes(citySearch.toLowerCase())
  )

  return (
    <>
      <header
        ref={navRef}
        style={{
          background: 'var(--cream, #FFF8F0)',
          borderBottom: '1px solid rgba(26,24,20,0.08)',
          position: 'sticky', top: 0, zIndex: 50,
          fontFamily: 'var(--font-manrope, system-ui, sans-serif)',
        }}
      >
        <div style={{
          maxWidth: 1280, margin: '0 auto',
          padding: '0 40px',
          display: 'flex', alignItems: 'center', gap: 20,
          height: 64,
        }}
        className="header-inner"
        >
          {/* Logo */}
          <Link href="/" style={{ display: 'flex', alignItems: 'center', gap: 10, textDecoration: 'none', flexShrink: 0 }}>
            <div style={{
              width: 36, height: 36, borderRadius: 10,
              background: 'var(--coral-500, #FF6B3D)',
              display: 'grid', placeItems: 'center',
              color: 'white',
              fontFamily: 'var(--font-unbounded, system-ui)',
              fontWeight: 700, fontSize: 18,
              boxShadow: '0 2px 0 #E8552A, inset 0 1px 0 rgba(255,255,255,0.25)',
              flexShrink: 0,
            }}>P</div>
            <span style={{
              fontFamily: 'var(--font-unbounded, system-ui)',
              fontWeight: 700, fontSize: 20,
              letterSpacing: '-0.02em',
              color: 'var(--ink, #1A1814)',
            }}>
              pro<span style={{ color: 'var(--coral-500, #FF6B3D)' }}>·</span>school<span style={{ opacity: 0.5, fontWeight: 500 }}>.ru</span>
            </span>
          </Link>

          {/* City selector */}
          <button
            onClick={() => setCityOpen(true)}
            style={{
              display: 'flex', alignItems: 'center', gap: 6,
              padding: '8px 12px', borderRadius: 10,
              background: 'transparent', border: 'none', cursor: 'pointer',
              fontFamily: 'var(--font-manrope, system-ui)', fontWeight: 600, fontSize: 14,
              color: 'var(--ink-2, #3A332B)',
              transition: 'background .12s',
              flexShrink: 0,
            }}
            onMouseEnter={e => (e.currentTarget.style.background = 'rgba(0,0,0,0.04)')}
            onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#FF6B3D" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M20 10c0 7-8 13-8 13s-8-6-8-13a8 8 0 0 1 16 0z"/><circle cx="12" cy="10" r="3"/>
            </svg>
            {city}
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ opacity: 0.5 }}>
              <path d="m6 9 6 6 6-6"/>
            </svg>
          </button>

          {/* Search */}
          <form onSubmit={handleSearch} style={{ flex: 1, maxWidth: 380, display: 'flex', alignItems: 'center', gap: 10, background: 'rgba(26,24,20,0.05)', borderRadius: 12, padding: '10px 14px' }}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--ink-3,#6B5F50)" strokeWidth="2.2" strokeLinecap="round">
              <circle cx="11" cy="11" r="7"/><path d="m20 20-3.5-3.5"/>
            </svg>
            <input
              type="text"
              value={searchVal}
              onChange={e => setSearchVal(e.target.value)}
              placeholder="Школа, район, профиль…"
              style={{
                border: 'none', outline: 'none', background: 'transparent', flex: 1,
                fontFamily: 'var(--font-manrope, system-ui)', fontSize: 14, color: 'var(--ink, #1A1814)',
              }}
            />
            {searchVal && (
              <button type="button" onClick={() => setSearchVal('')} style={{ border: 'none', background: 'transparent', cursor: 'pointer', color: 'var(--ink-3,#6B5F50)', padding: 0, display: 'flex', lineHeight: 1 }}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round">
                  <path d="M18 6 6 18M6 6l12 12"/>
                </svg>
              </button>
            )}
          </form>

          {/* Nav links */}
          <nav style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 15, fontWeight: 600, color: 'var(--ink-2,#3A332B)', position: 'relative', marginLeft: 'auto' }}>
            {/* Schools dropdown trigger */}
            <button
              onClick={() => setSchoolsOpen(v => !v)}
              style={{
                display: 'flex', alignItems: 'center', gap: 6, padding: '8px 12px', borderRadius: 10,
                background: schoolsOpen ? 'rgba(255,107,61,0.1)' : 'transparent',
                color: schoolsOpen ? 'var(--coral-500,#FF6B3D)' : 'inherit',
                border: 'none', cursor: 'pointer',
                fontFamily: 'var(--font-manrope, system-ui)', fontWeight: 600, fontSize: 15,
                transition: 'background .12s, color .12s',
              }}
            >
              Школы
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" style={{ opacity: 0.7, transform: schoolsOpen ? 'rotate(180deg)' : 'none', transition: 'transform .15s' }}>
                <path d="m6 9 6 6 6-6"/>
              </svg>
            </button>

            {/* Blog */}
            <Link href="/blog" style={{
              padding: '8px 12px', borderRadius: 10, cursor: 'pointer',
              textDecoration: 'none', color: 'inherit', transition: 'background .12s',
              fontFamily: 'var(--font-manrope, system-ui)',
            }}
            onMouseEnter={(e: React.MouseEvent<HTMLAnchorElement>) => (e.currentTarget.style.background = 'rgba(0,0,0,0.04)')}
            onMouseLeave={(e: React.MouseEvent<HTMLAnchorElement>) => (e.currentTarget.style.background = 'transparent')}
            >Блог</Link>

            {/* Schools dropdown */}
            {schoolsOpen && (
              <div style={{
                position: 'absolute', top: '100%', left: 0, marginTop: 8, zIndex: 100,
                background: 'white', borderRadius: 16, padding: 14, minWidth: 460,
                boxShadow: '0 8px 24px rgba(60,30,10,0.08), 0 24px 60px rgba(60,30,10,0.10)',
                border: '1px solid rgba(26,24,20,0.08)',
                display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 4,
              }}>
                {SCHOOL_TYPES.map(t => (
                  <Link
                    key={t.slug}
                    href={`/shkoly/moskva/${t.slug}/`}
                    onClick={() => setSchoolsOpen(false)}
                    style={{
                      display: 'flex', alignItems: 'flex-start', gap: 12, padding: '12px 14px',
                      borderRadius: 10, cursor: 'pointer', textDecoration: 'none',
                      color: 'var(--ink,#1A1814)', transition: 'background .12s',
                    }}
                    onMouseEnter={(e: React.MouseEvent<HTMLAnchorElement>) => (e.currentTarget.style.background = '#FFEFDD')}
                    onMouseLeave={(e: React.MouseEvent<HTMLAnchorElement>) => (e.currentTarget.style.background = 'transparent')}
                  >
                    <span style={{ fontSize: 22, lineHeight: 1, marginTop: 2 }}>{t.icon}</span>
                    <div>
                      <div style={{ fontWeight: 700, fontSize: 14, marginBottom: 2 }}>{typeLabels[t.slug]}</div>
                      <div style={{ fontSize: 12, color: 'var(--ink-3,#6B5F50)', fontWeight: 500 }}>{t.desc}</div>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </nav>

          {/* CTA */}
          <Link
            href="/shkoly/"
            style={{
              display: 'inline-flex', alignItems: 'center',
              background: 'var(--coral-500, #FF6B3D)', color: 'white',
              borderRadius: 999, padding: '11px 22px',
              fontFamily: 'var(--font-manrope, system-ui)', fontWeight: 600, fontSize: 14,
              textDecoration: 'none', whiteSpace: 'nowrap', flexShrink: 0,
              boxShadow: '0 4px 0 #E8552A, 0 8px 24px rgba(255,107,61,0.3)',
              transition: 'background .15s, transform .12s',
            }}
            onMouseEnter={(e: React.MouseEvent<HTMLAnchorElement>) => (e.currentTarget.style.background = '#FF8B5A')}
            onMouseLeave={(e: React.MouseEvent<HTMLAnchorElement>) => (e.currentTarget.style.background = 'var(--coral-500, #FF6B3D)')}
          >
            Каталог школ
          </Link>
        </div>

        <style>{`
          @media (max-width: 768px) {
            .header-inner { padding: 0 16px !important; gap: 12px !important; }
            .header-inner form { display: none !important; }
            .header-inner nav { display: none !important; }
          }
        `}</style>
      </header>

      {/* City modal */}
      {cityOpen && (
        <div
          onClick={() => setCityOpen(false)}
          style={{
            position: 'fixed', inset: 0,
            background: 'rgba(26,24,20,0.45)', zIndex: 200,
            display: 'flex', alignItems: 'flex-start', justifyContent: 'center', paddingTop: 80,
            backdropFilter: 'blur(4px)',
          }}
        >
          <div
            onClick={e => e.stopPropagation()}
            style={{
              background: 'white', borderRadius: 20, padding: 28,
              width: 520, maxWidth: '90vw',
              boxShadow: '0 8px 24px rgba(60,30,10,0.08), 0 24px 60px rgba(60,30,10,0.10)',
              maxHeight: '70vh', display: 'flex', flexDirection: 'column',
              fontFamily: 'var(--font-manrope, system-ui)',
            }}
          >
            {/* Modal header */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 18 }}>
              <div style={{ fontFamily: 'var(--font-unbounded, system-ui)', fontSize: 22, fontWeight: 600, color: 'var(--ink,#1A1814)' }}>
                Выберите город
              </div>
              <button onClick={() => setCityOpen(false)} style={{ border: 'none', background: 'rgba(0,0,0,0.05)', borderRadius: 8, width: 32, height: 32, cursor: 'pointer', display: 'grid', placeItems: 'center', color: 'var(--ink,#1A1814)' }}>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round">
                  <path d="M18 6 6 18M6 6l12 12"/>
                </svg>
              </button>
            </div>

            {/* Search */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, background: 'rgba(0,0,0,0.04)', borderRadius: 12, padding: '12px 16px', marginBottom: 16, color: 'var(--ink-3,#6B5F50)' }}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round">
                <circle cx="11" cy="11" r="7"/><path d="m20 20-3.5-3.5"/>
              </svg>
              <input
                ref={cityInputRef}
                value={citySearch}
                onChange={e => setCitySearch(e.target.value)}
                placeholder="Найти город…"
                style={{ border: 'none', outline: 'none', background: 'transparent', flex: 1, fontFamily: 'var(--font-manrope, system-ui)', fontSize: 15, color: 'var(--ink,#1A1814)' }}
              />
            </div>

            {/* City list */}
            <div style={{ overflowY: 'auto', flex: 1, margin: '0 -10px' }}>
              {filteredCities.map(slug => (
                <Link
                  key={slug}
                  href={`/shkoly/${slug}/`}
                  onClick={() => selectCity(slug)}
                  style={{
                    width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                    padding: '14px 16px', borderRadius: 12, textDecoration: 'none',
                    background: regionLabels[slug] === city ? '#FFEFDD' : 'transparent',
                    color: 'var(--ink,#1A1814)', transition: 'background .12s',
                  }}
                  onMouseEnter={(e: React.MouseEvent<HTMLAnchorElement>) => { if (regionLabels[slug] !== city) e.currentTarget.style.background = 'rgba(0,0,0,0.04)' }}
                  onMouseLeave={(e: React.MouseEvent<HTMLAnchorElement>) => { if (regionLabels[slug] !== city) e.currentTarget.style.background = 'transparent' }}
                >
                  <span style={{ display: 'flex', alignItems: 'center', gap: 12, fontSize: 15, fontWeight: 600 }}>
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={regionLabels[slug] === city ? '#FF6B3D' : 'var(--ink-3,#6B5F50)'} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M20 10c0 7-8 13-8 13s-8-6-8-13a8 8 0 0 1 16 0z"/><circle cx="12" cy="10" r="3"/>
                    </svg>
                    {regionLabels[slug]}
                  </span>
                </Link>
              ))}
              {filteredCities.length === 0 && (
                <div style={{ padding: '24px 16px', textAlign: 'center', color: 'var(--ink-3,#6B5F50)', fontSize: 14 }}>
                  Ничего не нашлось
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  )
}
