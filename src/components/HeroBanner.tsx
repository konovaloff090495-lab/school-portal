import Link from 'next/link'
import Image from 'next/image'

const STATS = [
  { num: '3 280', label: 'школ в каталоге', emoji: '🏫' },
  { num: '247',   label: 'олимпиад и экзаменов', emoji: '🏆' },
  { num: '12 400', label: 'семей помогли', emoji: '👨‍👩‍👧' },
  { num: '4.8 ★', label: 'оценка родителей', emoji: '💛' },
]

const AVATARS = [
  { bg: '#FFC547', emoji: '👩' },
  { bg: '#FF8B5A', emoji: '👨' },
  { bg: '#6BBE7E', emoji: '👩‍🦱' },
  { bg: '#7CC0DE', emoji: '🧑' },
]

export default function HeroBanner() {
  return (
    <div style={{ background: 'var(--cream)' }}>
      <div style={{ padding: '28px 32px 48px' }} className="md:px-14">

        {/* ── Hero card ── */}
        <div style={{
          background: 'linear-gradient(135deg, #FFB988 0%, #FF8B5A 65%, #FF6B3D 100%)',
          borderRadius: 40,
          padding: '56px 64px 56px 64px',
          position: 'relative',
          overflow: 'hidden',
          minHeight: 560,
          display: 'grid',
          gridTemplateColumns: '1.15fr 1fr',
          alignItems: 'stretch',
          gap: 30,
          color: 'white',
        }}
        className="hero-card"
        >
          {/* SVG decorations */}
          <svg style={{ position: 'absolute', top: 36, right: '40%', opacity: 0.55, zIndex: 0, pointerEvents: 'none' }} width="68" height="68" viewBox="0 0 60 60" aria-hidden="true">
            <path d="M30 0 Q33 27 60 30 Q33 33 30 60 Q27 33 0 30 Q27 27 30 0Z" fill="#FFC547"/>
          </svg>
          <div style={{ position: 'absolute', bottom: 60, left: '46%', width: 90, height: 90, border: '2px dashed rgba(255,255,255,0.45)', borderRadius: '50%', zIndex: 0, pointerEvents: 'none' }} aria-hidden="true" />
          <svg style={{ position: 'absolute', top: '52%', left: '6%', zIndex: 0, pointerEvents: 'none' }} width="58" height="22" viewBox="0 0 80 24" aria-hidden="true">
            <path d="M2 12 Q 12 2, 22 12 T 42 12 T 62 12 T 78 12" stroke="rgba(255,255,255,0.55)" strokeWidth="3" strokeLinecap="round" fill="none"/>
          </svg>
          <svg style={{ position: 'absolute', bottom: '12%', right: '38%', zIndex: 0, pointerEvents: 'none' }} width="40" height="40" viewBox="0 0 24 24" aria-hidden="true">
            <path d="M12 2 L 14 10 L 22 12 L 14 14 L 12 22 L 10 14 L 2 12 L 10 10 Z" fill="rgba(255,255,255,0.45)"/>
          </svg>

          {/* ── LEFT: copy + CTA ── */}
          <div style={{ position: 'relative', zIndex: 2, display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>

            {/* Pill badge */}
            <div style={{
              display: 'inline-flex', alignItems: 'center', gap: 8, padding: '8px 14px',
              borderRadius: 999, fontSize: 13, fontWeight: 600,
              background: 'rgba(0,0,0,0.28)', color: '#fff',
              border: '1px solid rgba(255,255,255,0.15)', marginBottom: 26, alignSelf: 'flex-start',
              backdropFilter: 'blur(8px)',
              fontFamily: 'var(--font-manrope, sans-serif)',
            }}>
              <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#FFC547', display: 'inline-block' }} />
              Бесплатный сервис подбора школ · 2026
            </div>

            {/* H1 */}
            <h1 style={{
              fontFamily: 'var(--font-unbounded, sans-serif)',
              fontWeight: 600,
              fontSize: 'clamp(38px, 5vw, 68px)',
              lineHeight: 1.0,
              letterSpacing: '-0.025em',
              margin: '0 0 22px',
              color: '#fff',
              textShadow: '0 1px 0 rgba(0,0,0,0.04)',
            }}>
              Найдём школу,<br />
              где ребёнок<br />
              <span style={{ display: 'inline-block', position: 'relative' }}>
                расцветёт
                <svg style={{ position: 'absolute', left: 0, right: 0, bottom: -10, width: '100%' }} height="14" viewBox="0 0 200 14" preserveAspectRatio="none" aria-hidden="true">
                  <path d="M2 8 Q 50 2, 100 7 T 198 6" stroke="#FFC547" strokeWidth="4" strokeLinecap="round" fill="none"/>
                </svg>
              </span>
              {' '}🌸
            </h1>

            {/* Description */}
            <p style={{
              fontFamily: 'var(--font-manrope, sans-serif)',
              fontSize: 19,
              color: 'rgba(255,255,255,0.95)',
              lineHeight: 1.5,
              maxWidth: 480,
              margin: '0 0 32px',
              fontWeight: 400,
            }}>
              Пройдите квиз — за 2 минуты подберём школы под класс, район, профиль и бюджет. Без регистрации и звонков.
            </p>

            {/* CTA buttons */}
            <div style={{ display: 'flex', gap: 12, marginBottom: 30, flexWrap: 'wrap' }}>
              <Link
                href="/shkoly/"
                style={{
                  display: 'inline-flex', alignItems: 'center', gap: 8,
                  background: '#1A1814', color: '#fff',
                  borderRadius: 999, padding: '18px 32px',
                  fontFamily: 'var(--font-manrope, sans-serif)',
                  fontWeight: 700, fontSize: 17, textDecoration: 'none',
                  boxShadow: '0 4px 0 #000, 0 12px 32px rgba(0,0,0,0.25)',
                  transition: 'transform .12s ease',
                  whiteSpace: 'nowrap',
                }}
              >
                Подобрать школу за 2 мин →
              </Link>
              <Link
                href="/shkoly/"
                style={{
                  display: 'inline-flex', alignItems: 'center', gap: 8,
                  background: 'rgba(255,255,255,0.18)', color: '#fff',
                  border: '1.5px solid rgba(255,255,255,0.35)',
                  borderRadius: 999, padding: '18px 32px',
                  fontFamily: 'var(--font-manrope, sans-serif)',
                  fontWeight: 600, fontSize: 17, textDecoration: 'none',
                  backdropFilter: 'blur(8px)',
                  whiteSpace: 'nowrap',
                }}
              >
                Каталог 3&nbsp;280 школ
              </Link>
            </div>

            {/* Social proof */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
              <div style={{ display: 'flex' }}>
                {AVATARS.map((a, i) => (
                  <div key={i} style={{
                    width: 38, height: 38, borderRadius: '50%',
                    background: a.bg, marginLeft: i ? -10 : 0,
                    border: '3px solid white',
                    display: 'grid', placeItems: 'center', fontSize: 16,
                  }}>
                    {a.emoji}
                  </div>
                ))}
              </div>
              <div style={{ fontFamily: 'var(--font-manrope, sans-serif)', fontSize: 13, color: 'rgba(255,255,255,0.95)', lineHeight: 1.4 }}>
                <div style={{ fontWeight: 700 }}>★ 4.8 · 1 240 отзывов</div>
                <div style={{ opacity: 0.85 }}>от родителей со всей России</div>
              </div>
            </div>
          </div>

          {/* ── RIGHT: photo + floating cards ── */}
          <div style={{ position: 'relative', display: 'flex', alignItems: 'flex-end', justifyContent: 'center', minHeight: 560 }}>

            {/* Peach circle behind boy */}
            <div style={{
              position: 'absolute', bottom: -40, right: -10,
              width: 460, height: 460,
              background: 'var(--peach-glow)',
              borderRadius: '50%', zIndex: 0,
            }} />
            <div style={{
              position: 'absolute', bottom: -40, right: -10,
              width: 460, height: 460,
              background: 'radial-gradient(circle at 30% 40%, rgba(255,255,255,0.4), transparent 60%)',
              borderRadius: '50%', zIndex: 1,
            }} />

            {/* Hero boy photo */}
            <Image
              src="/hero-boy.png"
              alt="Школьник с букетом цветов"
              width={620}
              height={620}
              priority
              style={{
                position: 'relative', zIndex: 2,
                height: '105%', maxHeight: 620, width: 'auto',
                objectFit: 'contain', objectPosition: 'bottom center',
                marginBottom: -40,
                filter: 'drop-shadow(0 20px 40px rgba(60, 30, 10, 0.18))',
              }}
            />

            {/* Floating tag — calendar */}
            <div className="ps-floaty" style={{
              position: 'absolute', top: '8%', right: '4%', zIndex: 4,
              background: 'white', borderRadius: 16, padding: '12px 16px',
              boxShadow: '0 4px 12px rgba(60,30,10,0.06), 0 12px 32px rgba(60,30,10,0.08)',
              display: 'flex', alignItems: 'center', gap: 10,
              fontFamily: 'var(--font-manrope, sans-serif)', fontSize: 14, fontWeight: 600, color: 'var(--ink)',
            }}>
              <span style={{ fontSize: 22 }}>📅</span>
              <div>
                <div style={{ fontSize: 11, color: 'var(--ink-3)', fontWeight: 500 }}>Запись 2026/27</div>
                <div>Открыта</div>
              </div>
            </div>

            {/* Floating tag — school match */}
            <div className="ps-floaty" style={{
              position: 'absolute', top: '34%', left: '0%', zIndex: 4,
              animationDelay: '0.8s',
              background: 'white', borderRadius: 16, padding: '12px 16px',
              boxShadow: '0 4px 12px rgba(60,30,10,0.06), 0 12px 32px rgba(60,30,10,0.08)',
              display: 'flex', alignItems: 'center', gap: 10,
              fontFamily: 'var(--font-manrope, sans-serif)', fontSize: 14, fontWeight: 600, color: 'var(--ink)',
            }}>
              <span style={{ fontSize: 22 }}>🏫</span>
              <div>
                <div style={{ fontSize: 11, color: 'var(--ink-3)', fontWeight: 500 }}>Лицей №1535</div>
                <div>Хамовники · 4.9 ★</div>
              </div>
            </div>

            {/* Floating tag — happy parent */}
            <div className="ps-floaty" style={{
              position: 'absolute', bottom: '12%', left: '-2%', zIndex: 4,
              animationDelay: '1.6s', maxWidth: 200,
              background: 'white', borderRadius: 16, padding: '12px 16px',
              boxShadow: '0 4px 12px rgba(60,30,10,0.06), 0 12px 32px rgba(60,30,10,0.08)',
              display: 'flex', alignItems: 'center', gap: 10,
              fontFamily: 'var(--font-manrope, sans-serif)', fontSize: 14, fontWeight: 600, color: 'var(--ink)',
            }}>
              <span style={{ fontSize: 22 }}>💛</span>
              <div>
                <div style={{ fontSize: 11, color: 'var(--ink-3)', fontWeight: 500 }}>Мария, мама</div>
                <div style={{ fontSize: 13 }}>«Нашли за вечер!»</div>
              </div>
            </div>

            {/* Free badge */}
            <div style={{
              position: 'absolute', top: '52%', right: '-8px', zIndex: 5,
              transform: 'rotate(12deg)',
            }}>
              <div style={{
                width: 80, height: 80, borderRadius: '50%',
                background: '#1A1814', color: '#FFC547',
                display: 'grid', placeItems: 'center',
                fontFamily: 'var(--font-unbounded, sans-serif)',
                fontWeight: 700, fontSize: 12, lineHeight: 1.1,
                textAlign: 'center',
                boxShadow: '0 4px 12px rgba(60,30,10,0.06), 0 12px 32px rgba(60,30,10,0.08)',
              }}>
                Бес-<br/>платно
              </div>
            </div>
          </div>
        </div>

        {/* ── Stats strip ── */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(4, 1fr)',
          gap: 16,
          marginTop: 24,
        }}
        className="stats-grid"
        >
          {STATS.map(({ num, label, emoji }) => (
            <div key={label} style={{
              background: '#fff', borderRadius: 20, padding: '22px 24px',
              border: '1px solid rgba(26,24,20,0.08)',
              display: 'flex', alignItems: 'center', justifyContent: 'space-between',
              boxShadow: '0 1px 2px rgba(60,30,10,0.04), 0 2px 6px rgba(60,30,10,0.04)',
            }}>
              <div>
                <div style={{
                  fontFamily: 'var(--font-unbounded, sans-serif)',
                  fontSize: 32, fontWeight: 600, letterSpacing: '-0.02em', color: 'var(--ink)',
                }}>
                  {num}
                </div>
                <div style={{
                  fontFamily: 'var(--font-manrope, sans-serif)',
                  fontSize: 13, color: 'var(--ink-3)', fontWeight: 500, marginTop: 2,
                }}>
                  {label}
                </div>
              </div>
              <span style={{ fontSize: 36 }}>{emoji}</span>
            </div>
          ))}
        </div>
      </div>

      <style>{`
        @media (max-width: 1024px) {
          .hero-card {
            grid-template-columns: 1fr !important;
            padding: 40px 32px !important;
          }
          .hero-card > div:last-child {
            min-height: 320px !important;
          }
        }
        @media (max-width: 768px) {
          .stats-grid {
            grid-template-columns: repeat(2, 1fr) !important;
          }
        }
        @media (max-width: 480px) {
          .hero-card h1 {
            font-size: 36px !important;
          }
          .hero-card > div:last-child {
            min-height: 260px !important;
          }
        }
      `}</style>
    </div>
  )
}
