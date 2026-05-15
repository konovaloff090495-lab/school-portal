'use client'

import { useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'

const ArrowIcon = ({ size = 20 }: { size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round">
    <path d="M5 12h14"/>
    <path d="m12 5 7 7-7 7"/>
  </svg>
)

export interface CityCardProps {
  slug: string
  name: string
  count: number
  sub: string
  photoKey?: string   // e.g. 'msk' → /cities/msk.png
  gradient?: string   // fallback CSS gradient
}

export function CityCard({ slug, name, count, sub, photoKey, gradient }: CityCardProps) {
  const [hover, setHover] = useState(false)
  const isLong = name.length > 11

  return (
    <Link
      href={`/shkoly/${slug}/`}
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      style={{
        display: 'grid',
        gridTemplateColumns: '1fr 1.15fr',
        background: '#F5EDE0',
        borderRadius: 28,
        textDecoration: 'none',
        color: 'var(--ink)',
        position: 'relative',
        overflow: 'hidden',
        minHeight: 300,
        transition: 'transform .22s ease, box-shadow .22s ease',
        transform: hover ? 'translateY(-4px)' : 'none',
        boxShadow: hover
          ? '0 24px 56px rgba(60,30,10,0.14), 0 4px 12px rgba(60,30,10,0.06)'
          : '0 1px 2px rgba(60,30,10,0.04)',
        cursor: 'pointer',
      }}
    >
      {/* Text column */}
      <div style={{
        padding: '32px 12px 28px 32px',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between',
        gap: 16,
        minWidth: 0,
        position: 'relative',
        zIndex: 2,
      }}>
        <div style={{ minWidth: 0 }}>
          <div style={{
            fontFamily: 'var(--font-unbounded, sans-serif)',
            fontSize: isLong ? 36 : 46,
            fontWeight: 700,
            lineHeight: 0.98,
            letterSpacing: '-0.032em',
            marginBottom: 10,
            color: 'var(--ink)',
            wordBreak: 'normal',
            hyphens: 'none',
          }}>
            {name}
          </div>
          <div style={{
            fontFamily: 'var(--font-manrope, sans-serif)',
            fontSize: 14,
            color: 'var(--ink-3)',
            lineHeight: 1.4,
            fontWeight: 500,
          }}>
            {sub}
          </div>
        </div>
        <div>
          <div style={{
            fontFamily: 'var(--font-unbounded, sans-serif)',
            fontSize: 42,
            fontWeight: 700,
            color: 'var(--coral-500)',
            letterSpacing: '-0.03em',
            lineHeight: 1,
            marginBottom: 4,
          }}>
            {count.toLocaleString('ru-RU')}
          </div>
          <div style={{
            fontFamily: 'var(--font-manrope, sans-serif)',
            fontSize: 13,
            color: 'var(--ink-3)',
            fontWeight: 500,
            marginBottom: 16,
          }}>
            школ в каталоге
          </div>
          <div style={{
            width: 52,
            height: 52,
            borderRadius: 13,
            background: 'var(--coral-500)',
            color: '#fff',
            display: 'grid',
            placeItems: 'center',
            transition: 'transform .18s ease, box-shadow .18s ease',
            transform: hover ? 'translateX(6px)' : 'none',
            boxShadow: hover
              ? '0 8px 20px rgba(232,74,42,0.4)'
              : '0 2px 6px rgba(232,74,42,0.25)',
          }}>
            <ArrowIcon size={22} />
          </div>
        </div>
      </div>

      {/* Photo / gradient column */}
      <div style={{ position: 'relative', overflow: 'hidden' }}>
        <div style={{
          position: 'absolute',
          inset: 0,
          transition: 'transform .35s ease',
          transform: hover ? 'scale(1.04)' : 'scale(1)',
        }}>
          {photoKey ? (
            <Image
              src={`/cities/${photoKey}.png`}
              alt={name}
              fill
              style={{ objectFit: 'cover', display: 'block' }}
              sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 400px"
            />
          ) : (
            <div style={{
              position: 'absolute',
              inset: 0,
              background: gradient || 'linear-gradient(135deg, #e8c99a 0%, #c97b4b 100%)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}>
              <span style={{
                fontFamily: 'var(--font-unbounded, sans-serif)',
                fontSize: 96,
                fontWeight: 700,
                color: 'rgba(255,255,255,0.22)',
                lineHeight: 1,
                userSelect: 'none',
                letterSpacing: '-0.04em',
              }}>
                {name[0]}
              </span>
            </div>
          )}
        </div>
        {/* Soft gradient fade */}
        <div style={{
          position: 'absolute',
          inset: 0,
          background: 'linear-gradient(90deg, #F5EDE0 0%, rgba(245,237,224,0.7) 12%, rgba(245,237,224,0) 32%)',
          pointerEvents: 'none',
          zIndex: 2,
        }} />
      </div>
    </Link>
  )
}
