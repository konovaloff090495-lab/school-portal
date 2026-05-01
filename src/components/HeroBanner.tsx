import Link from 'next/link'
import Image from 'next/image'
import SchoolQuiz from '@/components/SchoolQuiz'

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
      <style>{`
        .hero-wrap { padding: 12px 12px 24px; }
        .hero-card {
          background: linear-gradient(135deg, #FFB988 0%, #FF8B5A 65%, #FF6B3D 100%);
          border-radius: 28px;
          padding: 32px 24px 36px;
          position: relative;
          overflow: hidden;
          color: white;
          display: flex;
          flex-direction: column;
          gap: 0;
        }
        .hero-photo-col { display: none; }
        .hero-h1 {
          font-family: var(--font-unbounded, sans-serif);
          font-weight: 600;
          font-size: 36px;
          line-height: 1.05;
          letter-spacing: -0.02em;
          margin: 0 0 16px;
          color: #fff;
        }
        .hero-desc {
          font-size: 16px;
          line-height: 1.5;
          color: rgba(255,255,255,0.95);
          margin: 0 0 24px;
          font-family: var(--font-manrope, sans-serif);
        }
        .hero-btns { flex-direction: column; }
        .hero-btn-primary, .hero-btn-ghost {
          width: 100%;
          justify-content: center;
          padding: 16px 24px;
          font-size: 16px;
        }
        .stats-grid {
          display: grid;
          grid-template-columns: repeat(2, 1fr);
          gap: 10px;
          margin-top: 12px;
        }
        .stat-num { font-size: 22px; }
        .stat-label { font-size: 12px; }
        .stat-emoji { font-size: 26px; }
        .stat-card { padding: 16px 18px; border-radius: 16px; }

        @media (min-width: 480px) {
          .hero-wrap { padding: 16px 16px 28px; }
          .hero-card { border-radius: 32px; padding: 36px 32px 40px; }
          .hero-h1 { font-size: 42px; }
          .hero-btns { flex-direction: row; }
          .hero-btn-primary, .hero-btn-ghost { width: auto; }
        }

        @media (min-width: 768px) {
          .hero-wrap { padding: 20px 20px 36px; }
          .hero-card { border-radius: 36px; padding: 48px 48px 52px; }
          .hero-h1 { font-size: 52px; }
          .hero-desc { font-size: 18px; }
          .stats-grid { gap: 14px; margin-top: 16px; }
          .stat-num { font-size: 28px; }
          .stat-label { font-size: 13px; }
          .stat-emoji { font-size: 32px; }
          .stat-card { padding: 20px 22px; border-radius: 18px; }
        }

        @media (min-width: 1024px) {
          .hero-wrap { padding: 28px 56px 48px; }
          .hero-card {
            border-radius: 40px;
            padding: 56px 30px 56px 64px;
            display: grid;
            grid-template-columns: 1.15fr 1fr;
            align-items: stretch;
            gap: 30px;
            min-height: 560px;
          }
          .hero-photo-col { display: flex; }
          .hero-h1 { font-size: clamp(48px, 4vw, 68px); margin: 0 0 22px; }
          .hero-desc { font-size: 19px; margin: 0 0 32px; }
          .hero-btns { flex-direction: row; }
          .hero-btn-primary, .hero-btn-ghost { width: auto; padding: 18px 32px; font-size: 17px; }
          .stats-grid {
            grid-template-columns: repeat(4, 1fr);
            gap: 16px;
            margin-top: 24px;
          }
          .stat-num { font-size: 32px; }
          .stat-label { font-size: 13px; }
          .stat-emoji { font-size: 36px; }
          .stat-card { padding: 22px 24px; border-radius: 20px; }
        }
      `}</style>

      <div className="hero-wrap">
        {/* ── Hero card ── */}
        <div className="hero-card">

          {/* SVG decorations */}
          <svg style={{ position: 'absolute', top: 28, right: '38%', opacity: 0.5, zIndex: 0, pointerEvents: 'none' }} width="52" height="52" viewBox="0 0 60 60" aria-hidden="true">
            <path d="M30 0 Q33 27 60 30 Q33 33 30 60 Q27 33 0 30 Q27 27 30 0Z" fill="#FFC547"/>
          </svg>
          <div style={{ position: 'absolute', bottom: 40, left: '44%', width: 70, height: 70, border: '2px dashed rgba(255,255,255,0.4)', borderRadius: '50%', zIndex: 0, pointerEvents: 'none' }} aria-hidden="true" />
          <svg style={{ position: 'absolute', top: '55%', left: '4%', zIndex: 0, pointerEvents: 'none' }} width="48" height="18" viewBox="0 0 80 24" aria-hidden="true">
            <path d="M2 12 Q 12 2, 22 12 T 42 12 T 62 12 T 78 12" stroke="rgba(255,255,255,0.5)" strokeWidth="3" strokeLinecap="round" fill="none"/>
          </svg>

          {/* ── LEFT: copy + CTA ── */}
          <div style={{ position: 'relative', zIndex: 2, display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>

            {/* Pill badge */}
            <div style={{
              display: 'inline-flex', alignItems: 'center', gap: 8, padding: '7px 12px',
              borderRadius: 999, fontSize: 12, fontWeight: 600,
              background: 'rgba(0,0,0,0.28)', color: '#fff',
              border: '1px solid rgba(255,255,255,0.15)', marginBottom: 20, alignSelf: 'flex-start',
              backdropFilter: 'blur(8px)',
              fontFamily: 'var(--font-manrope, sans-serif)',
              whiteSpace: 'nowrap',
            }}>
              <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#FFC547', flexShrink: 0, display: 'inline-block' }} />
              Бесплатный сервис подбора школ · 2026
            </div>

            {/* H1 */}
            <h1 className="hero-h1">
              Найдём школу,<br />
              где ребёнок<br />
              <span style={{ display: 'inline-block', position: 'relative' }}>
                расцветёт
                <svg style={{ position: 'absolute', left: 0, right: 0, bottom: -8, width: '100%' }} height="12" viewBox="0 0 200 14" preserveAspectRatio="none" aria-hidden="true">
                  <path d="M2 8 Q 50 2, 100 7 T 198 6" stroke="#FFC547" strokeWidth="4" strokeLinecap="round" fill="none"/>
                </svg>
              </span>
              {' '}🌸
            </h1>

            {/* Description */}
            <p className="hero-desc">
              Пройдите квиз — за 2 минуты подберём школы под класс, район, профиль и бюджет. Без регистрации и звонков.
            </p>

            {/* CTA buttons */}
            <div className="hero-btns" style={{ display: 'flex', gap: 10, marginBottom: 24, flexWrap: 'wrap' }}>
              <SchoolQuiz />
              <Link href="/shkoly/" className="hero-btn-ghost" style={{
                display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                background: 'rgba(255,255,255,0.18)', color: '#fff',
                border: '1.5px solid rgba(255,255,255,0.35)',
                borderRadius: 999,
                fontFamily: 'var(--font-manrope, sans-serif)',
                fontWeight: 600, textDecoration: 'none',
                backdropFilter: 'blur(8px)',
                whiteSpace: 'nowrap',
              }}>
                Каталог 3&nbsp;280 школ
              </Link>
            </div>

            {/* Social proof */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <div style={{ display: 'flex', flexShrink: 0 }}>
                {AVATARS.map((a, i) => (
                  <div key={i} style={{
                    width: 34, height: 34, borderRadius: '50%',
                    background: a.bg, marginLeft: i ? -9 : 0,
                    border: '2.5px solid white',
                    display: 'grid', placeItems: 'center', fontSize: 14,
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

          {/* ── RIGHT: photo + floating cards (desktop only) ── */}
          <div className="hero-photo-col" style={{ position: 'relative', alignItems: 'flex-end', justifyContent: 'center', minHeight: 560 }}>

            {/* Peach circle */}
            <div style={{ position: 'absolute', bottom: -40, right: -10, width: 460, height: 460, background: 'var(--peach-glow)', borderRadius: '50%', zIndex: 0 }} />
            <div style={{ position: 'absolute', bottom: -40, right: -10, width: 460, height: 460, background: 'radial-gradient(circle at 30% 40%, rgba(255,255,255,0.4), transparent 60%)', borderRadius: '50%', zIndex: 1 }} />

            {/* Hero boy photo */}
            <Image
              src="/hero-boy.png"
              alt="Школьник с букетом цветов"
              width={620} height={620}
              priority
              style={{
                position: 'relative', zIndex: 2,
                height: '105%', maxHeight: 620, width: 'auto',
                objectFit: 'contain', objectPosition: 'bottom center',
                marginBottom: -40,
                filter: 'drop-shadow(0 20px 40px rgba(60,30,10,0.18))',
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
              position: 'absolute', top: '34%', left: '0%', zIndex: 4, animationDelay: '0.8s',
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
              position: 'absolute', bottom: '12%', left: '-2%', zIndex: 4, animationDelay: '1.6s', maxWidth: 200,
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
            <div style={{ position: 'absolute', top: '52%', right: '-8px', zIndex: 5, transform: 'rotate(12deg)' }}>
              <div style={{
                width: 80, height: 80, borderRadius: '50%',
                background: '#1A1814', color: '#FFC547',
                display: 'grid', placeItems: 'center',
                fontFamily: 'var(--font-unbounded, sans-serif)',
                fontWeight: 700, fontSize: 12, lineHeight: 1.1, textAlign: 'center',
                boxShadow: '0 4px 12px rgba(60,30,10,0.06), 0 12px 32px rgba(60,30,10,0.08)',
              }}>
                Бес-<br/>платно
              </div>
            </div>
          </div>
        </div>

        {/* ── Stats strip ── */}
        <div className="stats-grid">
          {STATS.map(({ num, label, emoji }) => (
            <div key={label} className="stat-card" style={{
              background: '#fff',
              border: '1px solid rgba(26,24,20,0.08)',
              display: 'flex', alignItems: 'center', justifyContent: 'space-between',
              boxShadow: '0 1px 2px rgba(60,30,10,0.04), 0 2px 6px rgba(60,30,10,0.04)',
            }}>
              <div>
                <div className="stat-num" style={{
                  fontFamily: 'var(--font-unbounded, sans-serif)',
                  fontWeight: 600, letterSpacing: '-0.02em', color: 'var(--ink)',
                  whiteSpace: 'nowrap',
                }}>
                  {num}
                </div>
                <div className="stat-label" style={{
                  fontFamily: 'var(--font-manrope, sans-serif)',
                  color: 'var(--ink-3)', fontWeight: 500, marginTop: 2,
                }}>
                  {label}
                </div>
              </div>
              <span className="stat-emoji">{emoji}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
