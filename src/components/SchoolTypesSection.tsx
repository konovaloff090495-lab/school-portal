'use client'

import { useState } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { schools, typeSlugs, typeLabels, SchoolType, getSchoolsByFeature } from '@/data/schools'

// ── Card metadata ─────────────────────────────────────────────────────────────
const TYPE_META: {
  slug: SchoolType
  name: string
  tint: string
  image: string | null
  overlay?: boolean   // true = render text on top of image dynamically
  href: string
  sub: string
}[] = [
  {
    slug: 'gosudarstvennye',
    name: 'Государственные',
    tint: '#4D8BFF',
    image: '/school-types/state.png',
    href: '/shkoly/tipy/gosudarstvennye/',
    sub: 'Бесплатное образование по государственной программе',
  },
  {
    slug: 'chastnie',
    name: 'Частные',
    tint: '#9B6BFF',
    image: '/school-types/private.png',
    href: '/shkoly/tipy/chastnie/',
    sub: 'Малые классы, индивидуальный подход, доп. программы',
  },
  {
    slug: 'online',
    name: 'Онлайн',
    tint: '#3DBE7E',
    image: '/school-types/online.png',
    href: '/shkoly/tipy/online/',
    sub: 'Обучение дистанционно из любой точки мира',
  },
  {
    slug: 'vechernie',
    name: 'Вечерние',
    tint: '#5A6EC8',
    image: '/school-types/vechernie.png',
    href: '/shkoly/tipy/vechernie/',
    sub: 'Для работающих граждан, обучение по вечерам',
  },
  {
    slug: 'eksternal',
    name: 'Экстернат',
    tint: '#F5A623',
    image: '/school-types/eksternal.png',
    href: '/shkoly/tipy/eksternal/',
    sub: 'Ускоренное прохождение программы, аттестат гос. образца',
  },
  {
    slug: 'semejnye',
    name: 'Семейные',
    tint: '#6BBE7E',
    image: '/school-types/semejnye.png',
    href: '/shkoly/tipy/semejnye/',
    sub: 'Родители участвуют в обучении, малые классы, семейная атмосфера',
  },
  {
    slug: 'domashnie',
    name: 'Домашние',
    tint: '#FFC547',
    image: '/school-types/domashnie.png',
    overlay: true,
    href: '/shkoly/tipy/domashnie/',
    sub: 'Обучение дома с официальным сопровождением и аттестацией',
  },
  {
    slug: 'pri-vuzakh',
    name: 'При вузах',
    tint: '#7CC0DE',
    image: '/school-types/pri-vuzakh.png',
    href: '/shkoly/tipy/pri-vuzakh/',
    sub: 'Лицеи и школы на базе университетов с углублённой программой',
  },
  {
    slug: 'profilnye',
    name: 'Профильные',
    tint: '#FF6B7A',
    image: '/school-types/profilnye.png',
    href: '/shkoly/tipy/profilnye/',
    sub: 'Специализированные: IT, медицина, право, искусство и другие',
  },
  {
    slug: 'gimnazii',
    name: 'Гимназии',
    tint: '#7CC0DE',
    image: '/school-types/gimnazii.png',
    href: '/shkoly/tipy/gimnazii/',
    sub: 'Углублённые программы, высокие баллы ЕГЭ, победители олимпиад',
  },
  {
    slug: 'korrektsionnye',
    name: 'Коррекционные',
    tint: '#88C96B',
    image: '/school-types/korrektsionnye.png',
    href: '/shkoly/tipy/korrektsionnye/',
    sub: 'Обучение детей с ОВЗ: нарушения слуха, зрения, речи, ЗПР, РАС',
  },
  {
    slug: 'kadetskie',
    name: 'Кадетские',
    tint: '#8A99B5',
    image: '/school-types/kadetskie.png',
    href: '/shkoly/tipy/kadetskie/',
    sub: 'Военно-патриотическое воспитание, строевая подготовка, НВП',
  },
  {
    slug: 'programmirovanie',
    name: 'Программирование',
    tint: '#7B5CFF',
    image: null,
    href: '/shkoly/tipy/programmirovanie/',
    sub: 'Python, веб-разработка, ИИ, кибербезопасность — профильные IT-школы',
  },
  {
    slug: 'shahmatnye',
    name: 'Шахматные',
    tint: '#2D6A4F',
    image: '/school-types/shahmatnye.png',
    href: '/shkoly/tipy/shahmatnye/',
    sub: 'Шахматы как учебный предмет, логика, стратегия, турниры ФИДЕ',
  },
  {
    slug: 'mezhdunarodnie',
    name: 'Международные',
    tint: '#0EA5E9',
    image: null,
    href: '/shkoly/tipy/mezhdunarodnie/',
    sub: 'IB, Cambridge, обучение на английском, диплом для зарубежных вузов',
  },
  {
    slug: 'podgotovka-ege',
    name: 'Центры ЕГЭ',
    tint: '#F59E0B',
    image: '/school-types/podgotovka-ege.png',
    href: '/shkoly/tipy/podgotovka-ege/',
    sub: 'Вебиум, Максимум Эдьюкейшн, ЕГЭхаб — 80+ баллов по каждому предмету',
  },
  {
    slug: 'podgotovka-oge',
    name: 'Центры ОГЭ',
    tint: '#0D9488',
    image: '/school-types/podgotovka-oge.png',
    href: '/shkoly/tipy/podgotovka-oge/',
    sub: 'Подготовка 9-классников: КИМы, тренировочные экзамены, все предметы',
  },
  {
    slug: 'internaty',
    name: 'Интернаты',
    tint: '#3B82F6',
    image: null,
    href: '/shkoly/tipy/internaty/',
    sub: 'Школы с проживанием, пансионы, круглосуточное пребывание',
  },
  {
    slug: 'valdorfskie',
    name: 'Вальдорфские',
    tint: '#65A30D',
    image: null,
    href: '/shkoly/tipy/valdorfskie/',
    sub: 'Педагогика Штайнера: эвритмия, художественное воспитание',
  },
  {
    slug: 'montessori',
    name: 'Монтессори',
    tint: '#EC4899',
    image: null,
    href: '/shkoly/tipy/montessori/',
    sub: 'Метод Монтессори: развивающая среда, свободный выбор деятельности',
  },
  {
    slug: 'pravoslavnye',
    name: 'Православные',
    tint: '#D97706',
    image: null,
    href: '/shkoly/tipy/pravoslavnye/',
    sub: 'Православное воспитание, Закон Божий, духовное образование',
  },
  {
    slug: 'sportivnye',
    name: 'Спортивные',
    tint: '#EA580C',
    image: null,
    href: '/shkoly/tipy/sportivnye/',
    sub: 'При спортивных клубах, двухразовые тренировки, олимпийский резерв',
  },
  {
    slug: 'yazykovye',
    name: 'Языковые',
    tint: '#0891B2',
    image: null,
    href: '/shkoly/tipy/yazykovye/',
    sub: 'Английский, немецкий, французский, китайский — углублённый профиль',
  },
]

// ── Placeholder for cards without images ──────────────────────────────────────
function Placeholder({ name, sub, tint, count }: { name: string; sub: string; tint: string; count: number }) {
  return (
    <div style={{
      width: '100%', height: '100%',
      background: `color-mix(in srgb, ${tint} 15%, #FFF8F0)`,
      borderRadius: 22,
      position: 'relative', overflow: 'hidden',
    }}>
      {/* Blob */}
      <div style={{
        position: 'absolute', right: '-8%', top: '6%',
        width: '65%', height: '72%', borderRadius: '50%',
        background: `color-mix(in srgb, ${tint} 22%, white)`,
        filter: 'blur(2px)',
      }}/>
      {/* Icon chip */}
      <div style={{
        position: 'absolute', top: 24, left: 24,
        width: 52, height: 52, borderRadius: 14,
        background: tint,
        display: 'grid', placeItems: 'center',
        boxShadow: `0 6px 18px ${tint}55`,
        zIndex: 2,
      }}>
        <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M3 21h18"/><path d="M5 21V10l7-5 7 5v11"/><rect x="9" y="13" width="6" height="8"/>
        </svg>
      </div>
      {/* Text */}
      <div style={{ padding: '98px 24px 20px', position: 'relative', zIndex: 2, display: 'flex', flexDirection: 'column', gap: 10 }}>
        <div style={{
          fontFamily: 'var(--font-unbounded, sans-serif)',
          fontWeight: 700, fontSize: 22, lineHeight: 1.1,
          letterSpacing: '-0.02em', color: '#1A1814',
          maxWidth: '62%',
        }}>
          {name}
        </div>
        <div style={{
          fontFamily: 'var(--font-manrope, sans-serif)',
          fontSize: 12, lineHeight: 1.45, color: '#4A453E',
          fontWeight: 500, maxWidth: '56%',
        }}>
          {sub}
        </div>
        <div style={{
          alignSelf: 'flex-start',
          padding: '7px 16px', borderRadius: 999,
          background: tint, color: '#fff',
          fontFamily: 'var(--font-manrope, sans-serif)',
          fontWeight: 700, fontSize: 13,
          boxShadow: `0 4px 12px ${tint}55`,
          marginTop: 2, whiteSpace: 'nowrap',
        }}>
          {count} школ
        </div>
      </div>
    </div>
  )
}

// ── Card with image on right, text on left (same layout as Placeholder) ───────
function ImageCard({ image, name, sub, tint, count }: { image: string; name: string; sub: string; tint: string; count: number }) {
  return (
    <div style={{
      width: '100%', height: '100%',
      background: `color-mix(in srgb, ${tint} 15%, #FFF8F0)`,
      borderRadius: 22,
      position: 'relative', overflow: 'hidden',
    }}>
      {/* Image — bleeds to right/bottom edges, no box */}
      <div style={{
        position: 'absolute', right: 0, bottom: 0,
        width: '65%', height: '100%',
        borderRadius: '0 22px 22px 0',
        overflow: 'hidden',
      }}>
        <Image
          src={image}
          alt={name}
          fill
          style={{ objectFit: 'cover', objectPosition: 'center bottom' }}
        />
      </div>
      {/* Icon chip */}
      <div style={{
        position: 'absolute', top: 24, left: 24,
        width: 52, height: 52, borderRadius: 14,
        background: tint,
        display: 'grid', placeItems: 'center',
        boxShadow: `0 6px 18px ${tint}55`,
        zIndex: 2,
      }}>
        <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M3 21h18"/><path d="M5 21V10l7-5 7 5v11"/><rect x="9" y="13" width="6" height="8"/>
        </svg>
      </div>
      {/* Text */}
      <div style={{ padding: '98px 24px 20px', position: 'relative', zIndex: 2, display: 'flex', flexDirection: 'column', gap: 10 }}>
        <div style={{
          fontFamily: 'var(--font-unbounded, sans-serif)',
          fontWeight: 700, fontSize: 22, lineHeight: 1.1,
          letterSpacing: '-0.02em', color: '#1A1814',
          maxWidth: '62%',
        }}>
          {name}
        </div>
        <div style={{
          fontFamily: 'var(--font-manrope, sans-serif)',
          fontSize: 12, lineHeight: 1.45, color: '#4A453E',
          fontWeight: 500, maxWidth: '56%',
        }}>
          {sub}
        </div>
        <div style={{
          alignSelf: 'flex-start',
          padding: '7px 16px', borderRadius: 999,
          background: tint, color: '#fff',
          fontFamily: 'var(--font-manrope, sans-serif)',
          fontWeight: 700, fontSize: 13,
          boxShadow: `0 4px 12px ${tint}55`,
          marginTop: 2, whiteSpace: 'nowrap',
        }}>
          {count} школ
        </div>
      </div>
    </div>
  )
}

// ── Single card ───────────────────────────────────────────────────────────────
function SchoolTypeCard({ item, count }: { item: typeof TYPE_META[number]; count: number }) {
  const [hover, setHover] = useState(false)
  return (
    <Link
      href={item.href}
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      style={{
        display: 'block',
        textDecoration: 'none',
        borderRadius: 22,
        transition: 'transform .22s ease, box-shadow .22s ease',
        transform: hover ? 'translateY(-4px)' : 'none',
        boxShadow: hover
          ? `0 22px 48px ${item.tint}33, 0 4px 12px rgba(60,30,10,0.06)`
          : '0 1px 2px rgba(60,30,10,0.04)',
      }}
    >
      <div style={{
        width: '100%', aspectRatio: '5 / 4',
        borderRadius: 22, overflow: 'hidden',
        background: '#FFF8F0', position: 'relative',
      }}>
        {item.image && item.overlay ? (
          <ImageCard image={item.image} name={item.name} sub={item.sub} tint={item.tint} count={count} />
        ) : item.image ? (
          <Image
            src={item.image}
            alt={`${item.name} школы`}
            fill
            style={{ objectFit: 'cover' }}
          />
        ) : (
          <Placeholder name={item.name} sub={item.sub} tint={item.tint} count={count} />
        )}
      </div>
    </Link>
  )
}

// ── Section ───────────────────────────────────────────────────────────────────
export default function SchoolTypesSection() {
  const counts: Record<string, number> = {}
  for (const t of typeSlugs) {
    counts[t] = schools.filter(s => s.type === t).length
  }

  return (
    <section>
      <div className="school-types-wrap">
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', marginBottom: 28, gap: 24 }}>
          <div>
            <h2 style={{
              fontFamily: 'var(--font-unbounded, sans-serif)',
              fontWeight: 700, fontSize: 'clamp(28px, 3vw, 40px)',
              letterSpacing: '-0.03em', lineHeight: 1.05,
              color: '#1A1814', margin: '0 0 6px',
            }}>
              Типы школ
            </h2>
            <p style={{ color: '#6B5F50', fontSize: 15, margin: 0, fontFamily: 'var(--font-manrope, sans-serif)' }}>
              Выберите подходящий формат обучения
            </p>
          </div>
          <Link href="/shkoly/" style={{
            fontSize: 14, fontWeight: 600, color: '#FF6B3D',
            textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: 6,
            padding: '10px 16px', borderRadius: 12,
            background: 'rgba(255,107,61,0.08)', whiteSpace: 'nowrap',
            fontFamily: 'var(--font-manrope, sans-serif)',
          }}>
            Все форматы
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round">
              <path d="M5 12h14"/><path d="m12 5 7 7-7 7"/>
            </svg>
          </Link>
        </div>

        {/* 3-up grid */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(3, 1fr)',
          gap: 20,
        }}
          className="school-types-grid"
        >
          {TYPE_META.map(item => (
            <SchoolTypeCard
              key={item.slug}
              item={item}
              count={counts[item.slug] ?? 0}
            />
          ))}
        </div>
      </div>

      <style>{`
        .school-types-wrap {
          padding: 48px 16px 64px;
        }
        @media (min-width: 640px) {
          .school-types-wrap { padding: 56px 24px 72px; }
        }
        @media (min-width: 1024px) {
          .school-types-wrap { padding: 56px 56px 80px; }
        }
        @media (max-width: 900px) {
          .school-types-grid { grid-template-columns: repeat(2, 1fr) !important; }
        }
        @media (max-width: 560px) {
          .school-types-grid { grid-template-columns: 1fr !important; }
        }
      `}</style>
    </section>
  )
}
