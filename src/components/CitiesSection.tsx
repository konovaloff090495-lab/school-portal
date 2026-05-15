import Link from 'next/link'
import { schools, regionSlugs, regionLabels } from '@/data/schools'
import { CityCard } from './CityCard'

// ── Метаданные городов: описание + фото (если есть) + градиент-запасной вариант
// photoKey → /public/cities/{key}.png
// Когда добавляется новый город в regionSlugs — он автоматически появится здесь
// с градиентом. Фото можно добавить позже.
const CITY_META: Record<string, {
  sub: string
  photoKey?: string
  gradient?: string
}> = {
  'moskva':           { sub: 'Столица · самый большой каталог',          photoKey: 'msk' },
  'moskovskaya-oblast': { sub: 'Лицеи, гимназии и школы Подмосковья',    gradient: 'linear-gradient(135deg, #b8cce4 0%, #4a7fb5 100%)' },
  'novosibirsk':      { sub: 'Сильные физмат-классы Академгородка',       photoKey: 'nsk' },
  'ekaterinburg':     { sub: 'IT-профили и инженерные классы',            photoKey: 'ekb' },
  'kazan':            { sub: 'Татарские гимназии и IT-парки',             photoKey: 'kzn' },
  'nizhniy-novgorod': { sub: 'Лицеи при ННГУ и Высшей школе',            photoKey: 'nn'  },
  'sankt-peterburg':  { sub: 'Гимназии и языковые школы',                 photoKey: 'spb' },
  'chelyabinsk':      { sub: 'Технические лицеи и кадетские корпуса',     gradient: 'linear-gradient(135deg, #8fa3b1 0%, #3d5a6e 100%)' },
  'omsk':             { sub: 'Физмат-школы и нефтехимические профили',    gradient: 'linear-gradient(135deg, #a8c5a0 0%, #3d7a4e 100%)' },
  'samara':           { sub: 'Школы с космической специализацией',        photoKey: 'sam' },
  'rostov-na-donu':   { sub: 'Кадетские корпуса и казачьи школы',         photoKey: 'rnd' },
  'ufa':              { sub: 'Башкирские гимназии и лицеи',               photoKey: 'ufa' },
  'krasnodar':        { sub: 'Спортивные интернаты юга России',           photoKey: 'krd' },
  'perm':             { sub: 'Академические лицеи и школы НИУ ВШЭ',       gradient: 'linear-gradient(135deg, #b19cd9 0%, #6a3d9a 100%)' },
  'voronezh':         { sub: 'Университетские классы и профильные школы', gradient: 'linear-gradient(135deg, #f4b97a 0%, #c26a1a 100%)' },
  'volgograd':        { sub: 'Школы-победители олимпиад ЮФО',            gradient: 'linear-gradient(135deg, #f9c74f 0%, #c0392b 100%)' },
  'krasnoyarsk':      { sub: 'Сибирские гимназии и лесной профиль',       gradient: 'linear-gradient(135deg, #74b49b 0%, #1b5e20 100%)' },
  'saratov':          { sub: 'Поволжские гимназии и медицинские классы',  gradient: 'linear-gradient(135deg, #f6d365 0%, #d4870a 100%)' },
  'tomsk':            { sub: 'Университетский город · олимпиадные школы', gradient: 'linear-gradient(135deg, #82b74b 0%, #2d6a4f 100%)' },
  'izhevsk':          { sub: 'Технические лицеи и оборонный профиль',    gradient: 'linear-gradient(135deg, #a8c5d6 0%, #2c5f7a 100%)' },
  'barnaul':          { sub: 'Алтайские гимназии и аграрные классы',      gradient: 'linear-gradient(135deg, #f9e07a 0%, #c8960c 100%)' },
  'ulyanovsk':        { sub: 'Гимназии и авиационные профильные классы',  gradient: 'linear-gradient(135deg, #90caf9 0%, #1565c0 100%)' },
  'irkutsk':          { sub: 'Байкальский регион · физмат-классы',        gradient: 'linear-gradient(135deg, #80deea 0%, #006064 100%)' },
  'khabarovsk':       { sub: 'Дальневосточные гимназии и лицеи',          gradient: 'linear-gradient(135deg, #80cbc4 0%, #00695c 100%)' },
}

// ── Подсчёт школ по городу ────────────────────────────────────────────────────
function countByRegion(slug: string): number {
  return schools.filter(s => s.region === slug).length
}

// ── Arrow icon ────────────────────────────────────────────────────────────────
const ArrowIcon = ({ size = 16 }: { size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round">
    <path d="M5 12h14"/>
    <path d="m12 5 7 7-7 7"/>
  </svg>
)

// ── Section ───────────────────────────────────────────────────────────────────
export default function CitiesSection() {
  // Берём все регионы из schools.ts — новый город добавляется автоматически
  const cityList = regionSlugs.map(slug => {
    const meta = CITY_META[slug] ?? {
      sub: 'Школы региона',
      gradient: 'linear-gradient(135deg, #e8c99a 0%, #c97b4b 100%)',
    }
    return {
      slug,
      name: regionLabels[slug],
      count: countByRegion(slug),
      ...meta,
    }
  }).filter(c => c.count > 0) // не показываем города без школ

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

        <div className="cities-grid">
          {cityList.map(city => (
            <CityCard key={city.slug} {...city} />
          ))}
        </div>
      </div>
    </section>
  )
}
