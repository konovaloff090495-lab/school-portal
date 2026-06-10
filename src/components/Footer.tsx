import Link from 'next/link'
import Image from 'next/image'
import { regionSlugs, regionLabels, typeSlugs, typeLabels, featureMetas } from '@/data/schools'

const MAIN_REGIONS = [
  'moskva', 'moskovskaya-oblast', 'sankt-peterburg', 'novosibirsk',
  'ekaterinburg', 'kazan', 'nizhniy-novgorod', 'krasnodar',
] as const

export default function Footer() {
  return (
    <footer style={{ background: '#1A1814', color: '#C9C4BB', marginTop: 64, fontFamily: 'var(--font-manrope, system-ui)' }}>
      {/* Top band */}
      <div style={{ borderBottom: '1px solid rgba(255,255,255,0.08)', padding: '48px 0 40px' }}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '40px 32px' }}>

            {/* Brand */}
            <div style={{ gridColumn: 'span 1' }}>
              <Link href="/" style={{ display: 'inline-block', marginBottom: 16 }}>
                <div style={{ background: '#fff', borderRadius: 12, padding: '10px 14px', display: 'inline-block' }}>
                  <Image src="/logo.png" alt="Школы России" width={160} height={48} style={{ height: 40, width: 'auto', objectFit: 'contain', display: 'block' }} />
                </div>
              </Link>
              <p style={{ fontSize: 13, lineHeight: 1.65, color: '#9B9490', maxWidth: 220 }}>
                Крупнейший каталог школ России — государственные, частные, онлайн, гимназии и&nbsp;другие форматы.
              </p>
              <div style={{ marginTop: 20, display: 'flex', flexDirection: 'column', gap: 8 }}>
                <Link href="/shkoly/" style={{ fontSize: 13, fontWeight: 700, color: '#FF6B3D', textDecoration: 'none' }}>
                  Все школы России →
                </Link>
                <Link href="/blog/" style={{ fontSize: 13, color: '#9B9490', textDecoration: 'none', transition: 'color .15s' }}>
                  Блог и статьи
                </Link>
                <Link href="/o-nas/" style={{ fontSize: 13, color: '#9B9490', textDecoration: 'none' }}>
                  О сайте
                </Link>
              </div>
            </div>

            {/* Типы школ */}
            <div>
              <h3 style={{ fontSize: 13, fontWeight: 700, color: '#fff', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 16 }}>
                Типы школ
              </h3>
              <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: 9 }}>
                {typeSlugs.slice(0, 10).map(type => (
                  <li key={type}>
                    <Link
                      href={`/shkoly/tipy/${type}/`}
                      style={{ fontSize: 13, color: '#9B9490', textDecoration: 'none', transition: 'color .15s' }}
                      className="footer-link"
                    >
                      {typeLabels[type]}
                    </Link>
                  </li>
                ))}
                <li>
                  <Link href="/shkoly/" style={{ fontSize: 13, color: '#FF6B3D', textDecoration: 'none' }} className="footer-link">
                    Все типы →
                  </Link>
                </li>
              </ul>
            </div>

            {/* Особенности */}
            <div>
              <h3 style={{ fontSize: 13, fontWeight: 700, color: '#fff', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 16 }}>
                Особенности
              </h3>
              <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: 9 }}>
                {featureMetas.map(f => (
                  <li key={f.slug}>
                    <Link
                      href={`/shkoly/osobennosti/${f.slug}/`}
                      style={{ fontSize: 13, color: '#9B9490', textDecoration: 'none' }}
                      className="footer-link"
                    >
                      {f.label}
                    </Link>
                  </li>
                ))}
                <li>
                  <Link href="/shkoly/moskva/programmirovanie/" style={{ fontSize: 13, color: '#9B9490', textDecoration: 'none' }} className="footer-link">
                    Программирование
                  </Link>
                </li>
              </ul>
            </div>

            {/* Регионы */}
            <div>
              <h3 style={{ fontSize: 13, fontWeight: 700, color: '#fff', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 16 }}>
                Регионы
              </h3>
              <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: 9 }}>
                {MAIN_REGIONS.map(region => (
                  <li key={region}>
                    <Link
                      href={`/shkoly/${region}/`}
                      style={{ fontSize: 13, color: '#9B9490', textDecoration: 'none' }}
                      className="footer-link"
                    >
                      {regionLabels[region]}
                    </Link>
                  </li>
                ))}
                <li>
                  <Link href="/shkoly/" style={{ fontSize: 13, color: '#FF6B3D', textDecoration: 'none' }} className="footer-link">
                    Все города →
                  </Link>
                </li>
              </ul>
            </div>

            {/* Подготовка к экзаменам */}
            <div>
              <h3 style={{ fontSize: 13, fontWeight: 700, color: '#fff', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 16 }}>
                Экзамены
              </h3>
              <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: 9 }}>
                <li><Link href="/ege/" style={{ fontSize: 13, color: '#FF6B3D', textDecoration: 'none' }} className="footer-link">Разборы заданий ЕГЭ →</Link></li>
                <li><Link href="/oge/" style={{ fontSize: 13, color: '#FF6B3D', textDecoration: 'none' }} className="footer-link">Разборы заданий ОГЭ →</Link></li>
                <li><Link href="/shkoly/osobennosti/podgotovka-k-ege/" style={{ fontSize: 13, color: '#9B9490', textDecoration: 'none' }} className="footer-link">Школы — подготовка к ЕГЭ</Link></li>
                <li><Link href="/shkoly/osobennosti/podgotovka-k-oge/" style={{ fontSize: 13, color: '#9B9490', textDecoration: 'none' }} className="footer-link">Школы — подготовка к ОГЭ</Link></li>
                <li><Link href="/shkoly/moskva/podgotovka-k-ege/" style={{ fontSize: 13, color: '#9B9490', textDecoration: 'none' }} className="footer-link">ЕГЭ — Москва</Link></li>
                <li style={{ marginTop: 8 }}>
                  <Link href="/shkoly/osobennosti/it-klass/" style={{ fontSize: 13, color: '#9B9490', textDecoration: 'none' }} className="footer-link">IT-классы</Link>
                </li>
                <li>
                  <Link href="/shkoly/osobennosti/uglublenny-anglijskij/" style={{ fontSize: 13, color: '#9B9490', textDecoration: 'none' }} className="footer-link">Углублённый английский</Link>
                </li>
                <li>
                  <Link href="/shkoly/osobennosti/boarding/" style={{ fontSize: 13, color: '#9B9490', textDecoration: 'none' }} className="footer-link">Школы-пансионы</Link>
                </li>
              </ul>
            </div>

          </div>
        </div>
      </div>

      {/* Bottom bar */}
      <div style={{ padding: '20px 0' }}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8" style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'space-between', alignItems: 'center', gap: '12px 24px' }}>
          <p style={{ fontSize: 12, color: '#6B6560', margin: 0, display: 'flex', flexWrap: 'wrap', gap: '4px 16px' }}>
            <span>© {new Date().getFullYear()} ШколыРоссии.рф</span>
            <Link href="/o-nas/" style={{ color: '#6B6560', textDecoration: 'none' }} className="footer-link">О сайте</Link>
            <Link href="/politika-konfidentsialnosti/" style={{ color: '#6B6560', textDecoration: 'none' }} className="footer-link">Политика конфиденциальности</Link>
            <Link href="/soglasie-marketing/" style={{ color: '#6B6560', textDecoration: 'none' }} className="footer-link">Согласие на маркетинг</Link>
          </p>
          <p style={{ fontSize: 12, color: '#6B6560', margin: 0 }}>
            Реклама: <a href="mailto:info@pro-schools.ru" style={{ color: '#0369A1' }}>info@pro-schools.ru</a>
          </p>
        </div>
      </div>

      <style>{`
        .footer-link:hover { color: #fff !important; }
      `}</style>
    </footer>
  )
}
