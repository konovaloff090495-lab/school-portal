import type { Metadata } from 'next'
import Link from 'next/link'
import { getAllPostsMeta } from '@/lib/blog-content'
import { BreadcrumbJsonLd, FaqJsonLd } from '@/lib/schema'

// Хаб раздела «Взрослым»: список статей читается из манифеста в рендере,
// поэтому новая статья категории появляется здесь без пересборки кода.
export const revalidate = 3600

export const metadata: Metadata = {
  title: 'Школа для взрослых: аттестат за 9 и 11 класс после 18 лет | pro-schools.ru',
  description:
    'Как взрослому получить школьный аттестат: вечерняя школа, экстернат, онлайн-обучение. Сроки, стоимость, документы, ЕГЭ и ОГЭ для совершеннолетних.',
  keywords: [
    'школа для взрослых',
    'аттестат взрослому',
    'экстернат для взрослых',
    'вечерняя школа',
    'аттестат за 11 класс взрослому',
    'аттестат за 9 класс взрослому',
    'закончить школу экстерном',
  ],
  alternates: { canonical: 'https://pro-schools.ru/blog/vzroslym/' },
}

// Материалы раздела, написанные до появления категории «Взрослым».
const LEGACY_SLUGS = [
  'zaochnoe-obuchenie-dlya-vzroslyh',
  'vechernyaya-shkola-onlajn',
  'vechernyaya-shkola-kak-postupit',
  'vechernyaya-shkola-posle-9-11-klassa',
  'attestat-vechernej-shkoly',
  'eksternal-shkolnika-chto-eto',
  'eksternat-v-10-klasse',
  'eksternat-za-9-klass',
  'eksternat-posle-9-klassa',
  'ochno-zaochnaya-forma-obucheniya',
  'zaochnoe-obuchenie-v-shkole',
  'kak-poluchit-attestat-onlajn',
  'kak-poluchit-attestat-bez-ekzamenov',
  'kak-poluchit-dublikat-attestata',
  'rossijskij-attestat-za-granicej',
  'onlajn-shkoly-akkreditatsiya-2026',
]

const START_HERE = [
  {
    slug: 'attestat-vzroslomu-9-klass',
    label: 'Нужен аттестат за 9 класс',
    text: 'Школа брошена в 8–9 классе. Куда идти, что сдавать и как попасть в колледж.',
  },
  {
    slug: 'attestat-vzroslomu-11-klass',
    label: 'Нужен аттестат за 11 класс',
    text: 'Полная инструкция: зачисление, итоговое сочинение, ЕГЭ, сроки и стоимость.',
  },
  {
    slug: 'eksternat-ili-vechernyaya-shkola',
    label: 'Не знаю, какой формат выбрать',
    text: 'Сравнение вечерней школы и экстерната по срокам, деньгам и нагрузке.',
  },
]

const FAQS = [
  {
    question: 'До какого возраста можно получить школьный аттестат?',
    answer:
      'Верхней возрастной границы нет. Общее образование в России общедоступно и бесплатно, получить его впервые можно в любом возрасте — и в 30, и в 50 лет. Для совершеннолетних предусмотрены очно-заочная и заочная формы обучения, а также прохождение аттестации экстерном.',
  },
  {
    question: 'Можно ли получить аттестат взрослому бесплатно?',
    answer:
      'Да. Обучение в вечерней (открытой сменной) школе и прохождение аттестации экстерном в государственной школе бесплатны, если этот уровень образования вы получаете впервые. Платить нужно только за добровольную подготовку — онлайн-школу или репетиторов.',
  },
  {
    question: 'Сколько времени займёт получение аттестата за 11 класс?',
    answer:
      'В вечерней школе программа 10–11 класса рассчитана на два года, экстерном её можно пройти за один учебный год. Сроки ограничены календарём экзаменов: итоговое сочинение проходит в декабре, заявление на ЕГЭ подаётся по общему правилу до 1 февраля, экзамены — весной и в начале лета.',
  },
  {
    question: 'Отличается ли аттестат вечерней школы или экстерната от обычного?',
    answer:
      'Нет. Выдаётся аттестат государственного образца на стандартном бланке, пометок о форме обучения в нём нет. Права он даёт те же: поступление в колледж, вуз по результатам ЕГЭ, трудоустройство.',
  },
  {
    question: 'Можно ли получить аттестат без экзаменов?',
    answer:
      'Нет. Государственная итоговая аттестация обязательна во всех форматах: ОГЭ после 9 класса, ЕГЭ после 11. Предложения «аттестат без экзаменов» означают подделку документа, использование которой влечёт уголовную ответственность.',
  },
]

export default function VzroslymHubPage() {
  const all = getAllPostsMeta()
  const section = all.filter(p => p.category === 'Взрослым')
  const legacy = LEGACY_SLUGS.map(s => all.find(p => p.slug === s)).filter(Boolean) as typeof all

  return (
    <div style={{ background: 'var(--cream)', minHeight: '100vh' }}>
      <BreadcrumbJsonLd
        items={[
          { name: 'Главная', href: 'https://pro-schools.ru/' },
          { name: 'Блог', href: 'https://pro-schools.ru/blog/' },
          { name: 'Взрослым' },
        ]}
      />
      <FaqJsonLd faqs={FAQS} />

      <style>{`
        .vz-wrap { max-width: 1080px; margin: 0 auto; padding: 40px 24px 72px; }
        @media (min-width: 768px) { .vz-wrap { padding: 56px 40px 88px; } }
        .vz-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(280px, 1fr)); gap: 16px; }
        .vz-card { background: white; border: 1px solid rgba(26,24,20,0.08); border-radius: 18px; padding: 20px 22px; height: 100%; display: flex; flex-direction: column; transition: transform .15s, box-shadow .15s; }
        .vz-card:hover { transform: translateY(-2px); box-shadow: 0 8px 24px rgba(60,30,10,0.09); }
        .vz-start { display: grid; grid-template-columns: repeat(auto-fit, minmax(260px, 1fr)); gap: 14px; margin: 28px 0 8px; }
        .vz-faq { background: white; border: 1px solid rgba(26,24,20,0.08); border-radius: 18px; padding: 20px 22px; margin-bottom: 12px; }
      `}</style>

      <div className="vz-wrap">
        <div style={{ fontSize: 13, color: 'var(--ink-3)', fontFamily: 'var(--font-manrope)', marginBottom: 16 }}>
          <Link href="/" style={{ color: 'var(--ink-3)', textDecoration: 'none' }}>Главная</Link>
          {' / '}
          <Link href="/blog/" style={{ color: 'var(--ink-3)', textDecoration: 'none' }}>Блог</Link>
          {' / '}
          <span style={{ color: 'var(--ink)' }}>Взрослым</span>
        </div>

        <h1 style={{
          fontFamily: 'var(--font-unbounded, sans-serif)', fontWeight: 700,
          fontSize: 'clamp(26px, 4vw, 44px)', color: 'var(--ink)',
          margin: '0 0 14px', lineHeight: 1.12, letterSpacing: '-0.02em',
        }}>
          Школа для взрослых: аттестат за 9 и 11 класс
        </h1>
        <p style={{ fontFamily: 'var(--font-manrope)', fontSize: 17, color: 'var(--ink-3)', lineHeight: 1.6, margin: '0 0 8px', maxWidth: 760 }}>
          Получить школьный аттестат в России можно в любом возрасте, и в большинстве случаев — бесплатно.
          Здесь собраны разборы всех законных путей: вечерняя школа, экстернат, заочная форма и аккредитованные
          онлайн-школы. Сроки, документы, стоимость, ЕГЭ и ОГЭ для совершеннолетних.
        </p>

        <div className="vz-start">
          {START_HERE.map(item => (
            <Link key={item.slug} href={`/blog/${item.slug}/`} style={{ textDecoration: 'none' }}>
              <div className="vz-card" style={{ background: 'linear-gradient(135deg, #FFE9DA 0%, #FFD6BC 100%)', border: '1px solid rgba(255,107,61,0.25)' }}>
                <div style={{ fontFamily: 'var(--font-manrope)', fontWeight: 800, fontSize: 16, color: 'var(--ink)', marginBottom: 8 }}>
                  {item.label}
                </div>
                <div style={{ fontFamily: 'var(--font-manrope)', fontSize: 14, color: 'var(--ink-2, #4a4038)', lineHeight: 1.5 }}>
                  {item.text}
                </div>
              </div>
            </Link>
          ))}
        </div>

        <h2 style={{ fontFamily: 'var(--font-unbounded)', fontWeight: 700, fontSize: 24, color: 'var(--ink)', margin: '44px 0 18px' }}>
          Все статьи раздела
        </h2>
        <div className="vz-grid">
          {section.map(post => (
            <Link key={post.slug} href={`/blog/${post.slug}/`} style={{ textDecoration: 'none' }}>
              <article className="vz-card">
                <h3 style={{ fontFamily: 'var(--font-manrope)', fontWeight: 700, fontSize: 16, lineHeight: 1.35, color: 'var(--ink)', margin: '0 0 10px' }}>
                  {post.title}
                </h3>
                <p style={{ fontFamily: 'var(--font-manrope)', fontSize: 14, color: 'var(--ink-3)', lineHeight: 1.55, margin: '0 0 14px', flex: 1 }}>
                  {post.excerpt}
                </p>
                <span style={{ fontFamily: 'var(--font-manrope)', fontSize: 12, color: 'var(--ink-3)' }}>
                  {post.readTime} мин чтения
                </span>
              </article>
            </Link>
          ))}
        </div>

        {legacy.length > 0 && (
          <>
            <h2 style={{ fontFamily: 'var(--font-unbounded)', fontWeight: 700, fontSize: 24, color: 'var(--ink)', margin: '44px 0 18px' }}>
              Смежные материалы
            </h2>
            <div className="vz-grid">
              {legacy.map(post => (
                <Link key={post.slug} href={`/blog/${post.slug}/`} style={{ textDecoration: 'none' }}>
                  <article className="vz-card">
                    <h3 style={{ fontFamily: 'var(--font-manrope)', fontWeight: 700, fontSize: 16, lineHeight: 1.35, color: 'var(--ink)', margin: '0 0 10px' }}>
                      {post.title}
                    </h3>
                    <p style={{ fontFamily: 'var(--font-manrope)', fontSize: 14, color: 'var(--ink-3)', lineHeight: 1.55, margin: 0, flex: 1 }}>
                      {post.excerpt}
                    </p>
                  </article>
                </Link>
              ))}
            </div>
          </>
        )}

        <h2 style={{ fontFamily: 'var(--font-unbounded)', fontWeight: 700, fontSize: 24, color: 'var(--ink)', margin: '48px 0 18px' }}>
          Частые вопросы
        </h2>
        {FAQS.map(faq => (
          <div key={faq.question} className="vz-faq">
            <div style={{ fontFamily: 'var(--font-manrope)', fontWeight: 700, fontSize: 16, color: 'var(--ink)', marginBottom: 8 }}>
              {faq.question}
            </div>
            <div style={{ fontFamily: 'var(--font-manrope)', fontSize: 15, color: 'var(--ink-3)', lineHeight: 1.6 }}>
              {faq.answer}
            </div>
          </div>
        ))}

        <div style={{
          marginTop: 44, background: 'linear-gradient(135deg, #FFB988 0%, #FF6B3D 100%)',
          borderRadius: 24, padding: '32px 28px', color: 'white', fontFamily: 'var(--font-manrope)',
        }}>
          <div style={{ fontFamily: 'var(--font-unbounded)', fontWeight: 700, fontSize: 20, marginBottom: 10 }}>
            Найдите школу, где принимают взрослых
          </div>
          <p style={{ fontSize: 15, opacity: 0.92, margin: '0 0 20px', lineHeight: 1.5 }}>
            Вечерние школы и школы-экстернаты по городам России — с адресами, телефонами и условиями приёма.
          </p>
          <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
            <Link href="/shkoly/tipy/vechernie/" style={{
              display: 'inline-flex', alignItems: 'center', gap: 8, background: '#1A1814', color: 'white',
              borderRadius: 999, padding: '12px 24px', fontSize: 15, fontWeight: 700,
              textDecoration: 'none', boxShadow: '0 4px 0 #000',
            }}>
              Вечерние школы →
            </Link>
            <Link href="/shkoly/tipy/eksternal/" style={{
              display: 'inline-flex', alignItems: 'center', gap: 8, background: 'rgba(255,255,255,0.2)',
              color: 'white', borderRadius: 999, padding: '12px 24px', fontSize: 15, fontWeight: 700,
              textDecoration: 'none', border: '1px solid rgba(255,255,255,0.5)',
            }}>
              Школы-экстернаты →
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}
