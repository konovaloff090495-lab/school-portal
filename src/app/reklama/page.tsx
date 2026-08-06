import type { Metadata } from 'next'
import Link from 'next/link'

export const metadata: Metadata = {
  title: 'Реклама на ШколыРоссии.рф — форматы и цены | pro-schools.ru',
  description:
    'Реклама на портале pro-schools.ru: 14 000+ визитов в месяц, аудитория родителей школьников и учеников. SEO-статьи в топе, баннеры и растяжки, поп-апы, нативные интеграции. Форматы и прайс.',
  alternates: { canonical: 'https://pro-schools.ru/reklama/' },
  openGraph: {
    title: 'Реклама на ШколыРоссии.рф — форматы и цены',
    description:
      'Тёплая аудитория родителей и школьников: 14 000+ визитов и 46 000+ просмотров в месяц из поиска. Форматы рекламы и прайс.',
    url: 'https://pro-schools.ru/reklama/',
    type: 'website',
  },
}

const TG = 'https://t.me/Gerasim951'

const STATS = [
  { b: '14 000+', s: 'визитов в месяц' },
  { b: '11 800+', s: 'уникальных посетителей' },
  { b: '46 000+', s: 'просмотров страниц' },
  { b: '91%', s: 'трафика — из поиска' },
]

const AUDIENCE = [
  { ic: '👨‍👩‍👧', t: 'Родители школьников', d: 'Выбирают школу, репетиторов, курсы и кружки для детей 1–11 классов. Готовы платить за образование.' },
  { ic: '🎓', t: 'Ученики и выпускники', d: 'Готовятся к ЕГЭ и ОГЭ, ищут ГДЗ, учебники и разборы заданий. Активны и вовлечены.' },
  { ic: '🏫', t: 'Онлайн-школы и экстернат', d: 'Аудитория, которая осознанно ищет альтернативные форматы обучения и семейное образование.' },
  { ic: '📍', t: 'Вся Россия', d: 'Москва, область, Санкт-Петербург, города-миллионники и регионы — каталог покрывает всю страну.' },
]

const FORMATS = [
  {
    star: true,
    ic: '📝',
    t: 'SEO-статья в топе',
    d: 'Нативная статья под ваш продукт, оптимизированная под запросы аудитории. Постоянный поток тёплых читателей из Яндекса и Google — работает годами.',
    li: ['Размещение навсегда', 'Ссылки и CTA на ваш сайт', 'Тема под ваш продукт'],
  },
  {
    ic: '🖼️',
    t: 'Баннеры и растяжки',
    d: 'Сквозные баннерные места на страницах каталога, ГДЗ, учебника и блога. Показы на всём трафике портала.',
    li: ['Десктоп и мобайл', 'Сквозное или по разделам', 'Ваш креатив или наш дизайн'],
  },
  {
    ic: '💬',
    t: 'Поп-ап и лид-форма',
    d: 'Всплывающее предложение или встроенная форма заявки. Собираем контакты заинтересованных родителей и учеников прямо на портале.',
    li: ['Настройка по разделам', 'Лиды сразу вам', 'A/B тест офферов'],
  },
  {
    ic: '⭐',
    t: 'Спецпроект / брендзона',
    d: 'Брендированный раздел, подборка или лендинг под ваш продукт внутри портала. Максимальная вовлечённость и доверие.',
    li: ['Индивидуальный формат', 'Обогащённые карточки', 'Приоритет в каталоге'],
  },
]

const REACH = [
  { b: '230 000+', s: 'показов в поиске / мес' },
  { b: 'Топ Яндекса', s: 'и Google по тысячам запросов' },
  { b: '1–11 класс', s: 'весь охват школьного возраста' },
]

const btn = (variant: 'light' | 'dark' | 'ghost'): React.CSSProperties => ({
  display: 'inline-flex',
  alignItems: 'center',
  gap: 9,
  font: '700 16px/1 var(--font-manrope, system-ui)',
  padding: '15px 26px',
  borderRadius: 14,
  textDecoration: 'none',
  transition: '.18s',
  cursor: 'pointer',
  ...(variant === 'light' && { background: '#fff', color: '#E8552A', boxShadow: '0 8px 24px rgba(0,0,0,.18)' }),
  ...(variant === 'dark' && { background: '#FF6B3D', color: '#fff', boxShadow: '0 8px 24px rgba(255,107,61,.35)' }),
  ...(variant === 'ghost' && { background: 'rgba(255,255,255,.14)', color: '#fff', border: '1px solid rgba(255,255,255,.4)' }),
})

const card: React.CSSProperties = {
  background: '#fff',
  border: '1px solid #F0E7DC',
  borderRadius: 20,
  padding: 24,
  boxShadow: '0 2px 10px rgba(26,24,20,.05)',
}

const h2: React.CSSProperties = {
  font: '800 clamp(26px,3.4vw,36px)/1.1 var(--font-unbounded, system-ui)',
  color: '#1A1814',
  margin: '0 0 14px',
  letterSpacing: '-.01em',
}

const eyebrow: React.CSSProperties = {
  font: '700 13px/1.4 var(--font-manrope, system-ui)',
  letterSpacing: '.14em',
  textTransform: 'uppercase',
  color: '#E8552A',
  margin: '0 0 12px',
}

const lead: React.CSSProperties = {
  font: '400 clamp(16px,2vw,19px)/1.6 var(--font-manrope, system-ui)',
  color: '#6B5F50',
  maxWidth: 680,
  margin: '0 0 8px',
}

export default function ReklamaPage() {
  return (
    <div style={{ fontFamily: 'var(--font-manrope, system-ui)' }}>
      {/* HERO */}
      <section
        style={{
          position: 'relative',
          overflow: 'hidden',
          background: 'linear-gradient(135deg, #FF8B5A 0%, #E8552A 55%, #C63F1D 100%)',
          color: '#fff',
          padding: '72px 0 60px',
        }}
      >
        <div
          style={{
            position: 'absolute',
            inset: 0,
            background: 'radial-gradient(900px 420px at 82% -10%, rgba(255,255,255,.22), transparent 60%)',
            pointerEvents: 'none',
          }}
        />
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8" style={{ position: 'relative', zIndex: 1 }}>
          <nav style={{ fontSize: 13, color: 'rgba(255,255,255,.8)', marginBottom: 22 }}>
            <Link href="/" style={{ color: 'rgba(255,255,255,.85)', textDecoration: 'none' }}>Главная</Link>
            <span style={{ margin: '0 8px' }}>/</span>
            <span>Рекламодателям</span>
          </nav>
          <h1
            style={{
              font: '800 clamp(30px,5vw,52px)/1.05 var(--font-unbounded, system-ui)',
              letterSpacing: '-.02em',
              margin: '0 0 18px',
              maxWidth: 840,
            }}
          >
            Реклама на ШколыРоссии.рф
          </h1>
          <p style={{ font: '400 clamp(16px,2.2vw,20px)/1.6 var(--font-manrope, system-ui)', color: 'rgba(255,255,255,.94)', maxWidth: 660, margin: '0 0 28px' }}>
            Тёплая аудитория родителей школьников и учеников — те, кто прямо сейчас
            выбирает школу, курсы, репетиторов и учебные материалы. Расскажите им о себе.
          </p>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 12 }}>
            <a href={TG} target="_blank" rel="noopener" style={btn('light')}>
              ✈️ Написать в Telegram
            </a>
            <a href="#formaty" style={btn('ghost')}>Форматы и цены</a>
          </div>

          {/* hero stats */}
          <div
            style={{
              display: 'flex',
              flexWrap: 'wrap',
              gap: '16px 40px',
              marginTop: 40,
              paddingTop: 28,
              borderTop: '1px solid rgba(255,255,255,.24)',
            }}
          >
            {STATS.map((x) => (
              <div key={x.s} style={{ display: 'flex', flexDirection: 'column' }}>
                <b style={{ font: '800 28px/1 var(--font-unbounded, system-ui)' }}>{x.b}</b>
                <span style={{ font: '500 13px/1.3 var(--font-manrope, system-ui)', color: 'rgba(255,255,255,.85)', marginTop: 6 }}>{x.s}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* AUDIENCE */}
      <section style={{ padding: '64px 0' }}>
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <p style={eyebrow}>Кто нас читает</p>
          <h2 style={h2}>Аудитория, готовая платить за образование</h2>
          <p style={lead}>Портал ежемесячно посещают десятки тысяч человек с осознанным образовательным запросом.</p>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: 16, marginTop: 28 }}>
            {AUDIENCE.map((a) => (
              <div key={a.t} style={card}>
                <span style={{ fontSize: 30, lineHeight: 1, display: 'block', marginBottom: 12 }}>{a.ic}</span>
                <h3 style={{ font: '700 18px/1.3 var(--font-unbounded, system-ui)', color: '#1A1814', margin: '0 0 8px' }}>{a.t}</h3>
                <p style={{ font: '400 14.5px/1.55 var(--font-manrope, system-ui)', color: '#6B5F50', margin: 0 }}>{a.d}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* REACH band */}
      <section style={{ padding: '48px 0', background: '#FFF8F0', borderTop: '1px solid #F0E7DC', borderBottom: '1px solid #F0E7DC' }}>
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 24, textAlign: 'center' }}>
            {REACH.map((r) => (
              <div key={r.s}>
                <b style={{ font: '800 clamp(24px,3vw,34px)/1.05 var(--font-unbounded, system-ui)', color: '#E8552A', display: 'block' }}>{r.b}</b>
                <span style={{ font: '500 14px/1.4 var(--font-manrope, system-ui)', color: '#6B5F50', display: 'block', marginTop: 8 }}>{r.s}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* FORMATS */}
      <section id="formaty" style={{ padding: '64px 0', scrollMarginTop: 80 }}>
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <p style={eyebrow}>Форматы размещения</p>
          <h2 style={h2}>Как разместить рекламу</h2>
          <p style={lead}>Подберём формат под задачу — от разовой статьи до брендированного раздела. Цены и условия обсуждаем индивидуально.</p>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 18, marginTop: 28 }}>
            {FORMATS.map((f) => (
              <div
                key={f.t}
                style={{
                  ...card,
                  padding: 28,
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 12,
                  position: 'relative',
                  ...(f.star && { borderColor: '#FF6B3D', boxShadow: '0 10px 30px rgba(255,107,61,.16)' }),
                }}
              >
                {f.star && (
                  <span
                    style={{
                      position: 'absolute',
                      top: -12,
                      left: 28,
                      background: '#FF6B3D',
                      color: '#fff',
                      font: '700 12px/1 var(--font-manrope, system-ui)',
                      padding: '7px 12px',
                      borderRadius: 999,
                      letterSpacing: '.04em',
                    }}
                  >
                    ХИТ
                  </span>
                )}
                <span style={{ fontSize: 30, lineHeight: 1 }}>{f.ic}</span>
                <h3 style={{ font: '800 22px/1.15 var(--font-unbounded, system-ui)', color: '#1A1814', margin: 0 }}>{f.t}</h3>
                <p style={{ font: '400 15px/1.6 var(--font-manrope, system-ui)', color: '#6B5F50', margin: 0 }}>{f.d}</p>
                <ul style={{ margin: 0, paddingLeft: 18, color: '#3A332B', font: '400 14.5px/1.7 var(--font-manrope, system-ui)' }}>
                  {f.li.map((x) => (
                    <li key={x}>{x}</li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section style={{ padding: '8px 0 72px' }}>
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div
            style={{
              background: 'linear-gradient(135deg, #1A1814 0%, #2E2620 100%)',
              borderRadius: 28,
              padding: 'clamp(32px,5vw,56px)',
              color: '#fff',
              position: 'relative',
              overflow: 'hidden',
            }}
          >
            <div style={{ position: 'absolute', inset: 0, background: 'radial-gradient(700px 340px at 88% 0%, rgba(255,107,61,.28), transparent 60%)', pointerEvents: 'none' }} />
            <div style={{ position: 'relative', zIndex: 1, maxWidth: 640 }}>
              <h2 style={{ font: '800 clamp(24px,3.4vw,36px)/1.1 var(--font-unbounded, system-ui)', margin: '0 0 14px' }}>
                Обсудим размещение?
              </h2>
              <p style={{ font: '400 clamp(15px,2vw,18px)/1.6 var(--font-manrope, system-ui)', color: 'rgba(255,255,255,.85)', margin: '0 0 28px' }}>
                Напишите в Telegram — пришлём медиакит, подберём формат под ваш продукт
                и рассчитаем стоимость. Отвечаем быстро.
              </p>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 12, alignItems: 'center' }}>
                <a href={TG} target="_blank" rel="noopener" style={btn('dark')}>
                  ✈️ Telegram @Gerasim951
                </a>
                <a href="mailto:info@pro-schools.ru" style={{ ...btn('ghost'), border: '1px solid rgba(255,255,255,.3)' }}>
                  info@pro-schools.ru
                </a>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  )
}
