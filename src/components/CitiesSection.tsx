'use client'

import { useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'

// ── Arrow icon ────────────────────────────────────────────────────────────────
const ArrowIcon = ({ size = 20 }: { size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round">
    <path d="M5 12h14"/>
    <path d="m12 5 7 7-7 7"/>
  </svg>
)

// ── City data with real slug → URL mapping ────────────────────────────────────
const CITY_DATA = [
  { key: 'msk', slug: 'moskva',           name: 'Москва',           count: 174, sub: 'Столица · самый большой каталог' },
  { key: 'spb', slug: 'sankt-peterburg',  name: 'Санкт-Петербург',  count: 120, sub: 'Гимназии и языковые школы' },
  { key: 'ekb', slug: 'ekaterinburg',     name: 'Екатеринбург',     count: 120, sub: 'IT-профили и инженерные классы' },
  { key: 'nsk', slug: 'novosibirsk',      name: 'Новосибирск',      count: 88,  sub: 'Сильные физмат-классы Академгородка' },
  { key: 'kzn', slug: 'kazan',            name: 'Казань',           count: 120, sub: 'Татарские гимназии и IT-парки' },
  { key: 'nn',  slug: 'nizhniy-novgorod', name: 'Нижний Новгород',  count: 40,  sub: 'Лицеи при ННГУ и Высшей школе' },
  { key: 'rnd', slug: 'rostov-na-donu',   name: 'Ростов-на-Дону',   count: 15,  sub: 'Кадетские корпуса и казачьи школы' },
  { key: 'krd', slug: 'krasnodar',        name: 'Краснодар',        count: 16,  sub: 'Спортивные интернаты юга России' },
  { key: 'sam', slug: 'samara',           name: 'Самара',           count: 16,  sub: 'Школы с космической специализацией' },
  { key: 'ufa', slug: 'ufa',              name: 'Уфа',              count: 16,  sub: 'Башкирские гимназии и лицеи' },
]

// ── City card ─────────────────────────────────────────────────────────────────
function CityCard({ city }: { city: typeof CITY_DATA[0] }) {
  const [hover, setHover] = useState(false)
  const isLong = city.name.length > 11

  return (
    <Link
      href={`/shkoly/${city.slug}/`}
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
      {/* Text column (left) */}
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
            {city.name}
          </div>
          <div style={{
            fontFamily: 'var(--font-manrope, sans-serif)',
            fontSize: 14,
            color: 'var(--ink-3)',
            lineHeight: 1.4,
            fontWeight: 500,
          }}>
            {city.sub}
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
            {city.count.toLocaleString('ru-RU')}
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

      {/* Photo column (right) */}
      <div style={{ position: 'relative', overflow: 'hidden' }}>
        <div style={{
          position: 'absolute',
          inset: 0,
          transition: 'transform .35s ease',
          transform: hover ? 'scale(1.04)' : 'scale(1)',
        }}>
          <Image
            src={`/cities/${city.key}.png`}
            alt={city.name}
            fill
            style={{ objectFit: 'cover', display: 'block' }}
            sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 400px"
          />
        </div>
        {/* Soft gradient fade from card bg into photo on left edge */}
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

// ── Section ───────────────────────────────────────────────────────────────────
export default function CitiesSection() {
  return (
    <section style={{ background: 'var(--cream)' }}>
      <style>{`
        .cities-wrap {
          padding: 48px 16px 64px;
        }
        .cities-header {
          display: flex;
          align-items: flex-end;
          justify-content: space-between;
          margin-bottom: 28px;
          gap: 16px;
          flex-wrap: wrap;
        }
        .cities-h2 {
          font-family: var(--font-unbounded, sans-serif);
          font-size: clamp(26px, 5vw, 48px);
          margin: 0;
          letter-spacing: -0.03em;
          line-height: 1.04;
          font-weight: 700;
          color: var(--ink);
        }
        .cities-grid {
          display: grid;
          grid-template-columns: 1fr;
          gap: 16px;
        }
        @media (min-width: 640px) {
          .cities-wrap { padding: 56px 24px 72px; }
          .cities-grid { grid-template-columns: repeat(2, 1fr); gap: 20px; }
          .cities-header { margin-bottom: 32px; }
        }
        @media (min-width: 1024px) {
          .cities-wrap { padding: 72px 56px 96px; }
          .cities-header { margin-bottom: 36px; }
        }
      `}</style>

      <div className="cities-wrap">
        {/* Header */}
        <div className="cities-header">
          <div>
            <div style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 8,
              padding: '6px 12px',
              borderRadius: 999,
              background: '#FFEFDD',
              color: 'var(--coral-500)',
              fontSize: 12,
              fontWeight: 700,
              letterSpacing: '0.06em',
              textTransform: 'uppercase',
              marginBottom: 14,
              fontFamily: 'var(--font-manrope, sans-serif)',
            }}>
              Школы по городам
            </div>
            <h2 className="cities-h2">
              Выберите город —{' '}
              <br className="hidden" style={{ display: 'none' }} />
              покажем подходящие школы
            </h2>
          </div>
          <Link href="/shkoly/" style={{
            fontSize: 15,
            fontWeight: 600,
            color: 'var(--coral-500)',
            textDecoration: 'none',
            display: 'inline-flex',
            alignItems: 'center',
            gap: 8,
            padding: '12px 16px',
            borderRadius: 12,
            background: 'rgba(255,107,61,0.08)',
            whiteSpace: 'nowrap',
            fontFamily: 'var(--font-manrope, sans-serif)',
            flexShrink: 0,
          }}>
            Все регионы <ArrowIcon size={16} />
          </Link>
        </div>

        {/* Cards grid */}
        <div className="cities-grid">
          {CITY_DATA.map(city => (
            <CityCard key={city.key} city={city} />
          ))}
        </div>
      </div>
    </section>
  )
}
