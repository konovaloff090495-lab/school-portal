import type { Metadata } from 'next'
import Link from 'next/link'

export const metadata: Metadata = {
  title: 'Реклама на ШколыРоссии.рф — форматы и цены | pro-schools.ru',
  description:
    'Реклама на портале pro-schools.ru: 14 000+ визитов в месяц, аудитория родителей школьников и учеников. SEO-статьи в топе, баннеры, поп-апы, нативные интеграции. Форматы, статистика и прайс.',
  alternates: { canonical: 'https://pro-schools.ru/reklama/' },
  openGraph: {
    title: 'Реклама на ШколыРоссии.рф — форматы и цены',
    description:
      'Тёплая аудитория родителей и школьников: 14 000+ визитов и 46 000+ просмотров в месяц из поиска. Форматы рекламы, статистика и прайс.',
    url: 'https://pro-schools.ru/reklama/',
    type: 'website',
  },
}

const TG = 'https://t.me/Gerasim951'

// ── реальные метрики (Яндекс.Метрика, счётчик 108789843, 30 дней, август 2026) ──
const HERO_STATS = [
  { b: '14 000+', s: 'визитов в месяц' },
  { b: '11 800+', s: 'уникальных посетителей' },
  { b: '46 000+', s: 'просмотров страниц' },
  { b: '91%', s: 'трафика — из поиска' },
]

const NUM_STATS = [
  { b: '69%', s: 'заходят со смартфона' },
  { b: '×3', s: 'рост трафика за июль' },
  { b: '235 000+', s: 'показов в поиске / мес' },
  { b: 'вся РФ', s: 'Москва, СПб, города-миллионники' },
]

// динамика визитов по месяцам (Яндекс.Метрика)
const GROWTH = [
  { m: 'Апр', v: 51 },
  { m: 'Май', v: 712 },
  { m: 'Июн', v: 4081 },
  { m: 'Июл', v: 13378 },
]
const GROWTH_MAX = 13378

const GEO = [
  ['Москва', '18%'],
  ['Санкт-Петербург', '8%'],
  ['Екатеринбург', '3%'],
  ['Новосибирск', '2%'],
  ['Нижний Новгород', '2%'],
  ['Челябинск', '2%'],
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
    price: 'от 8 000 ₽ / статья',
    sub: 'Пакет из 10 статей — 60 000 ₽',
  },
  {
    ic: '🖼️',
    t: 'Баннеры и растяжки',
    d: 'Сквозные баннерные места на страницах каталога, ГДЗ, учебника и блога. Показы на всём трафике портала.',
    li: ['Десктоп и мобайл', 'Сквозное или по разделам', 'Ваш креатив или наш дизайн'],
    price: '20 000 ₽ / мес',
    sub: 'Один раздел — 10 000 ₽ / мес',
  },
  {
    ic: '💬',
    t: 'Поп-ап и лид-форма',
    d: 'Всплывающее предложение или встроенная форма заявки. Собираем контакты заинтересованных родителей и учеников прямо на портале.',
    li: ['Настройка по разделам', 'Лиды сразу вам', 'A/B тест офферов'],
    price: 'от 25 000 ₽ / мес',
    sub: 'Оплата за размещение, лиды не лимитируем',
  },
  {
    ic: '⭐',
    t: 'Спецпроект / брендзона',
    d: 'Брендированный раздел, подборка или лендинг под ваш продукт внутри портала. Максимальная вовлечённость и доверие.',
    li: ['Индивидуальный формат', 'Обогащённые карточки', 'Приоритет в каталоге'],
    price: 'от 30 000 ₽ / мес',
    sub: 'Формат и объём — под задачу',
  },
]

const PRICE_TABLE: [string, string, string][] = [
  ['SEO-статья в топ', 'Разово, трафик остаётся навсегда', 'от 8 000 ₽'],
  ['SEO-статьи — пакет из 10', 'Разово', '60 000 ₽'],
  ['SEO-пакет: 50 статей в топ', 'Разово, охват семантики ниши', 'от 80 000 ₽'],
  ['Баннер / растяжка — весь сайт', 'В месяц', '20 000 ₽'],
  ['Баннер — один раздел', 'В месяц', '10 000 ₽'],
  ['Поп-ап (переход или лид-форма)', 'В месяц', 'от 25 000 ₽'],
  ['Спецпроект / брендзона', 'В месяц', 'от 30 000 ₽'],
  ['Пакет «Всё включено» — статьи + баннер + поп-ап', 'На 3 месяца', 'от 150 000 ₽'],
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
  maxWidth: 720,
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
            <a href="#price" style={btn('ghost')}>Смотреть прайс</a>
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
            {HERO_STATS.map((x) => (
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

      {/* STATISTICS */}
      <section style={{ padding: '64px 0', background: '#FFF8F0', borderTop: '1px solid #F0E7DC', borderBottom: '1px solid #F0E7DC' }}>
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <p style={eyebrow}>Портал в цифрах</p>
          <h2 style={h2}>Статистика аудитории</h2>
          <p style={lead}>
            Данные Яндекс.Метрики за последние 30 дней. Трафик почти полностью органический
            и быстро растёт — тот же поток читателей мы направим на ваш продукт.
          </p>

          {/* number tiles */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 16, marginTop: 28 }}>
            {NUM_STATS.map((x) => (
              <div key={x.s} style={{ ...card, textAlign: 'center' }}>
                <b style={{ font: '800 clamp(26px,3vw,36px)/1 var(--font-unbounded, system-ui)', color: '#E8552A', display: 'block' }}>{x.b}</b>
                <span style={{ font: '500 14px/1.4 var(--font-manrope, system-ui)', color: '#6B5F50', display: 'block', marginTop: 10 }}>{x.s}</span>
              </div>
            ))}
          </div>

          {/* growth + geo */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: 16, marginTop: 16 }}>
            {/* growth chart */}
            <div style={card}>
              <h3 style={{ font: '700 17px/1.3 var(--font-unbounded, system-ui)', color: '#1A1814', margin: '0 0 4px' }}>Рост посещаемости</h3>
              <p style={{ font: '400 13.5px/1.5 var(--font-manrope, system-ui)', color: '#6B5F50', margin: '0 0 18px' }}>Визиты в месяц, Яндекс.Метрика</p>
              <div style={{ display: 'flex', alignItems: 'flex-end', gap: 18, height: 180 }}>
                {GROWTH.map((g) => (
                  <div key={g.m} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'flex-end', height: '100%' }}>
                    <b style={{ font: '700 14px/1 var(--font-unbounded, system-ui)', color: '#1A1814', marginBottom: 7 }}>
                      {g.v >= 1000 ? (g.v / 1000).toFixed(1).replace('.0', '') + 'k' : g.v}
                    </b>
                    <i
                      style={{
                        width: '100%',
                        maxWidth: 70,
                        height: `${Math.max(6, (g.v / GROWTH_MAX) * 100)}%`,
                        borderRadius: '8px 8px 0 0',
                        background: 'linear-gradient(180deg, #FF8B5A, #E8552A)',
                        display: 'block',
                      }}
                    />
                    <span style={{ font: '600 13px/1 var(--font-manrope, system-ui)', color: '#6B5F50', marginTop: 9 }}>{g.m}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* geo */}
            <div style={card}>
              <h3 style={{ font: '700 17px/1.3 var(--font-unbounded, system-ui)', color: '#1A1814', margin: '0 0 4px' }}>География</h3>
              <p style={{ font: '400 13.5px/1.5 var(--font-manrope, system-ui)', color: '#6B5F50', margin: '0 0 18px' }}>Доля визитов по городам</p>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                {GEO.map(([city, pct]) => (
                  <div key={city}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', font: '600 14px/1.3 var(--font-manrope, system-ui)', color: '#3A332B', marginBottom: 5 }}>
                      <span>{city}</span>
                      <span style={{ color: '#E8552A' }}>{pct}</span>
                    </div>
                    <div style={{ height: 7, background: '#F0E7DC', borderRadius: 999, overflow: 'hidden' }}>
                      <div style={{ height: '100%', width: pct, background: 'linear-gradient(90deg, #FF8B5A, #E8552A)', borderRadius: 999 }} />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
          <p style={{ font: '400 12.5px/1.5 var(--font-manrope, system-ui)', color: '#9B9490', margin: '18px 0 0' }}>
            Источник: Яндекс.Метрика (счётчик портала) и Google Search Console. Данные обновляются, актуальные цифры пришлём в медиаките.
          </p>
        </div>
      </section>

      {/* FORMATS */}
      <section style={{ padding: '64px 0' }}>
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <p style={eyebrow}>Форматы размещения</p>
          <h2 style={h2}>Как разместить рекламу</h2>
          <p style={lead}>Подберём формат под задачу — от разовой статьи до брендированного раздела. Цены ниже — ориентир, финальная смета зависит от объёма.</p>
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
                <div style={{ marginTop: 'auto', paddingTop: 14, borderTop: '1px solid #F0E7DC' }}>
                  <b style={{ font: '800 20px/1 var(--font-unbounded, system-ui)', color: '#E8552A' }}>{f.price}</b>
                  <span style={{ display: 'block', font: '500 13px/1.4 var(--font-manrope, system-ui)', color: '#9B9490', marginTop: 6 }}>{f.sub}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* PRICE TABLE */}
      <section id="price" style={{ padding: '8px 0 64px', scrollMarginTop: 80 }}>
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <p style={eyebrow}>Прайс-лист</p>
          <h2 style={h2}>Цены на размещение</h2>
          <p style={lead}>Стоимость зависит от ниши, объёма и срока. Ниже — базовые ориентиры; под ваш бюджет соберём индивидуальный пакет.</p>
          <div style={{ ...card, padding: 0, overflow: 'hidden', marginTop: 28 }}>
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: 520 }}>
                <thead>
                  <tr style={{ background: '#FFF8F0' }}>
                    <th style={{ textAlign: 'left', padding: '16px 22px', font: '700 13px/1.3 var(--font-manrope, system-ui)', color: '#6B5F50', textTransform: 'uppercase', letterSpacing: '.06em' }}>Формат</th>
                    <th style={{ textAlign: 'left', padding: '16px 22px', font: '700 13px/1.3 var(--font-manrope, system-ui)', color: '#6B5F50', textTransform: 'uppercase', letterSpacing: '.06em' }}>Условия</th>
                    <th style={{ textAlign: 'right', padding: '16px 22px', font: '700 13px/1.3 var(--font-manrope, system-ui)', color: '#6B5F50', textTransform: 'uppercase', letterSpacing: '.06em' }}>Цена</th>
                  </tr>
                </thead>
                <tbody>
                  {PRICE_TABLE.map(([f, c, p], i) => (
                    <tr key={f} style={{ borderTop: '1px solid #F0E7DC', background: i === PRICE_TABLE.length - 1 ? '#FFF8F0' : '#fff' }}>
                      <td style={{ padding: '15px 22px', font: '600 15px/1.4 var(--font-manrope, system-ui)', color: '#1A1814' }}>{f}</td>
                      <td style={{ padding: '15px 22px', font: '400 14px/1.4 var(--font-manrope, system-ui)', color: '#6B5F50' }}>{c}</td>
                      <td style={{ padding: '15px 22px', font: '800 16px/1.2 var(--font-unbounded, system-ui)', color: '#E8552A', textAlign: 'right', whiteSpace: 'nowrap' }}>{p}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
          <p style={{ font: '400 12.5px/1.5 var(--font-manrope, system-ui)', color: '#9B9490', margin: '14px 0 0' }}>
            Цены указаны без НДС. Возможна оплата от юрлица и по договору. Точную смету и медиакит пришлём в Telegram.
          </p>
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
                Напишите в Telegram — пришлём медиакит с актуальной статистикой, подберём
                формат под ваш продукт и рассчитаем точную стоимость. Отвечаем быстро.
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
