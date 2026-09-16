import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { typeSlugs, profileMetas, languageMetas, getSchoolsByLanguage, schools, SchoolType } from '@/data/schools'
import { buildKeywords } from '@/lib/utils'
import Link from 'next/link'
import CatalogClient from '../../CatalogClient'
import SeoBlock from '@/components/SeoBlock'
import TypeGuide from '@/components/TypeGuide'
import OnlineBrandsTable from '@/components/OnlineBrandsTable'
import OnlineLeadCta from '@/components/OnlineLeadCta'
import { onlineBrands } from '@/data/online-brands'

interface Props {
  params: Promise<{ type: string }>
}

export function generateStaticParams() {
  return typeSlugs.map(type => ({ type }))
}

// Full display titles for H1 and metadata (overrides bare typeLabels for new types)
const typeDisplayTitles: Record<SchoolType, string> = {
  gosudarstvennye: 'Государственные школы',
  chastnie:        'Частные школы',
  online:          'Онлайн-школы',
  vechernie:       'Вечерние школы',
  eksternal:       'Школы-экстернаты',
  semejnye:        'Семейные школы',
  domashnie:       'Домашние школы',
  'pri-vuzakh':    'Школы при вузах',
  profilnye:       'Профильные школы',
  gimnazii:        'Гимназии и лицеи',
  korrektsionnye:  'Коррекционные школы',
  kadetskie:       'Кадетские школы',
  mezhdunarodnie:  'Международные школы',
  programmirovanie:'Школы программирования',
  shahmatnye:      'Шахматные школы',
  'podgotovka-ege': 'Центры подготовки к ЕГЭ',
  'podgotovka-oge': 'Центры подготовки к ОГЭ',
  internaty:        'Школы-интернаты и пансионы',
  valdorfskie:      'Вальдорфские школы',
  montessori:       'Школы Монтессори',
  pravoslavnye:     'Православные школы',
  sportivnye:       'Спортивные школы',
  yazykovye:        'Языковые школы',
}

const typeDescriptions: Record<SchoolType, string> = {
  gosudarstvennye: 'Бесплатные государственные школы России — полный каталог с адресами, телефонами и отзывами.',
  chastnie:        'Частные школы России: малые классы, индивидуальный подход, расширенные программы.',
  online:          'Рейтинг онлайн-школ России 2026: Фоксфорд, ИнтернетУрок, Синергия, Онлайн Гимназия №1, Skysmart, БИТ, Онлайн-школа №1 — цены 2026/27, у кого своя аккредитация, где пробный период. Как проверить аккредитацию и перейти на дистанционное обучение.',
  vechernie:       'Вечерние школы для работающих и взрослых — обучение по вечерам, аттестат гос. образца.',
  eksternal:       'Школы-экстернаты России: как пройти 10–11 класс за год, где прикрепиться бесплатно, сколько стоит платный экстернат и как оформить документы.',
  semejnye:        'Семейное обучение в 2026 году: как перейти по шагам, уведомление и заявление, где проходить аттестацию, сколько стоит. Семейные школы и классы по городам, онлайн-школы для семейной формы с ценами 2026/27.',
  domashnie:       'Домашняя школа в 2026 году: чем надомное обучение отличается от семейного и онлайн-школы, сколько стоит домашняя школа онлайн (Фоксфорд, ИнтернетУрок, Синергия, Skysmart), кто выдаёт аттестат и как оформить переход. Каталог школ по городам.',
  'pri-vuzakh':    'Лицеи и школы при университетах: профильная подготовка и высокая поступаемость.',
  profilnye:       'Профильные школы: IT, медицина, право, искусство, инженерия и другие направления.',
  gimnazii:        'Гимназии и лицеи: углублённые программы, высокие баллы ЕГЭ, победители олимпиад.',
  korrektsionnye:  'Коррекционные школы для детей с ОВЗ: профессиональные дефектологи, адаптированные программы.',
  kadetskie:       'Кадетские школы и корпуса: военно-патриотическое воспитание, строевая подготовка, НВП.',
  mezhdunarodnie:  'Международные школы России: программы IB и Cambridge, обучение на английском, диплом для поступления в зарубежные вузы.',
  programmirovanie:'Школы программирования России: Python, веб-разработка, ИИ, кибербезопасность. Партнёрство с Яндексом и ведущими IT-компаниями.',
  shahmatnye:      'Шахматные школы России: шахматы как учебный предмет, тренировка логики и стратегического мышления, турниры ФИДЕ.',
  'podgotovka-ege': 'Коммерческие центры подготовки к ЕГЭ: Вебиум, Максимум Эдьюкейшн, ЕГЭхаб, 100Бальный и другие. Авторские методики, пробные экзамены, 80+ баллов.',
  'podgotovka-oge': 'Центры подготовки к ОГЭ для учеников 8–9 классов. Тренировочные экзамены по актуальным КИМам, разбор ошибок, все предметы ОГЭ очно и онлайн.',
  internaty:        'Школы-интернаты и частные пансионы России с проживанием. Государственные и частные учебные заведения с круглосуточным пребыванием, полным пансионом и качественным образованием.',
  valdorfskie:      'Вальдорфские школы России по педагогике Рудольфа Штайнера. Художественное воспитание, эвритмия, ритмический день, без отметок в начальной школе.',
  montessori:       'Школы Монтессори России по методу Марии Монтессори. Развивающая среда, смешанные возрастные группы, свободный выбор деятельности, AMI-сертифицированные педагоги.',
  pravoslavnye:     'Православные школы и гимназии России. Образование 1–11 класс в сочетании с православным воспитанием, уроками Закона Божия и духовными практиками.',
  sportivnye:       'Спортивные школы России при профессиональных клубах и как самостоятельные учреждения. Двухразовые тренировки, полное образование, путь в профессиональный спорт.',
  yazykovye:        'Языковые школы России: лингвистические гимназии, немецкие и французские лицеи, школы с углублённым китайским и испанским. Международные сертификаты и дипломы.',
}

// Title под головной запрос — для хабов с развёрнутым гайдом (TypeGuide).
// Общий шаблон «— N в каталоге» под «онлайн школа» и «школа экстернат» не играл:
// хабы стояли на 27 и 19 месте, кликов не было.
const typeTitleOverrides: Partial<Record<SchoolType, (n: number) => string>> = {
  online:    () => `Онлайн-школы России 2026: рейтинг ${onlineBrands.length} школ, цены, аккредитация`,
  domashnie: () => `Домашняя школа 2026: обучение дома онлайн, цены, как оформить`,
  semejnye:  () => `Семейное обучение 2026: как перейти, уведомление, аттестация — семейные школы`,
  eksternal: n => `Школа-экстернат — ${n} школ России: 10–11 класс за год, цены`,
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { type } = await params
  if (!typeSlugs.includes(type as SchoolType)) return {}
  const t = type as SchoolType
  const displayTitle = typeDisplayTitles[t]
  const count = schools.filter(s => s.type === t).length
  const title = typeTitleOverrides[t]?.(count) ?? `${displayTitle} России — ${count} в каталоге`
  return {
    title,
    description: typeDescriptions[t],
    keywords: buildKeywords(undefined, t),
    alternates: { canonical: `https://pro-schools.ru/shkoly/tipy/${t}/` },
    openGraph: { title, description: typeDescriptions[t], url: `https://pro-schools.ru/shkoly/tipy/${t}/` },
  }
}

function ProfileNavSection() {
  const extraTiles = [
    { href: '/shkoly/tipy/profilnye/online/',      label: '💻 Онлайн',         sub: 'Дистанционный профиль' },
    { href: '/shkoly/tipy/profilnye/10-11-klass/', label: '🎓 10–11 класс',     sub: 'Старшая профильная школа' },
    { href: '/shkoly/tipy/profilnye/letnie/',       label: '☀️ Летние школы',   sub: 'Интенсивы на каникулах' },
  ]
  return (
    <div style={{ maxWidth: 860, margin: '0 auto', padding: '0 0 40px', fontFamily: 'var(--font-manrope, system-ui)' }}>
      <h2 style={{ fontSize: 18, fontWeight: 700, color: '#1A1814', margin: '0 0 16px', lineHeight: 1.3 }}>
        Выберите профиль
      </h2>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: 10 }}>
        {profileMetas.map(p => (
          <Link
            key={p.slug}
            href={`/shkoly/tipy/profilnye/${p.slug}/`}
            style={{
              display: 'flex', flexDirection: 'column', gap: 4,
              padding: '14px 16px', borderRadius: 14,
              border: '1.5px solid #E8E0D6', background: '#fff',
              textDecoration: 'none', transition: 'border-color .15s, box-shadow .15s',
            }}
            className="profile-nav-tile"
          >
            <span style={{ fontSize: 14, fontWeight: 700, color: '#1A1814', lineHeight: 1.3 }}>{p.label}</span>
            <span style={{ fontSize: 12, color: '#9B9490', lineHeight: 1.4 }}>{p.title.replace('школы России', '').replace('России', '').trim()}</span>
          </Link>
        ))}
        {extraTiles.map(t => (
          <a
            key={t.href}
            href={t.href}
            style={{
              display: 'flex', flexDirection: 'column', gap: 4,
              padding: '14px 16px', borderRadius: 14,
              border: '1.5px solid #E8E0D6', background: '#fff',
              textDecoration: 'none', transition: 'border-color .15s, box-shadow .15s',
            }}
            className="profile-nav-tile"
          >
            <span style={{ fontSize: 14, fontWeight: 700, color: '#1A1814', lineHeight: 1.3 }}>{t.label}</span>
            <span style={{ fontSize: 12, color: '#9B9490', lineHeight: 1.4 }}>{t.sub}</span>
          </a>
        ))}
      </div>
      <style>{`.profile-nav-tile:hover { border-color: #FF6B3D !important; box-shadow: 0 4px 12px rgba(255,107,61,0.12) !important; }`}</style>
    </div>
  )
}

function DomashnieSubNav() {
  const tiles = [
    { href: '/shkoly/tipy/domashnie/online/',        icon: '💻', label: 'Онлайн',           sub: 'Дистанционно из дома' },
    { href: '/shkoly/tipy/domashnie/luchshie/',      icon: '⭐', label: 'Лучшие',           sub: 'Рейтинг по отзывам' },
    { href: '/shkoly/tipy/domashnie/anglijskij/',    icon: '🇬🇧', label: 'С английским',    sub: 'Билингвальное обучение' },
    { href: '/shkoly/tipy/domashnie/chastnie/',      icon: '🏠', label: 'Частные',          sub: 'Стоимость и программы' },
    { href: '/shkoly/tipy/domashnie/srednie-klassy/', icon: '📚', label: '5–9 класс',       sub: 'Средняя школа, ОГЭ' },
  ]
  return (
    <div style={{ maxWidth: 860, margin: '0 auto', padding: '0 0 40px', fontFamily: 'var(--font-manrope, system-ui)' }}>
      <h2 style={{ fontSize: 18, fontWeight: 700, color: '#1A1814', margin: '0 0 16px', lineHeight: 1.3 }}>
        Найти по запросу
      </h2>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(190px, 1fr))', gap: 10 }}>
        {tiles.map(t => (
          <a
            key={t.href}
            href={t.href}
            style={{
              display: 'flex', alignItems: 'flex-start', gap: 12,
              padding: '14px 16px', borderRadius: 14,
              border: '1.5px solid #E8E0D6', background: '#fff',
              textDecoration: 'none', transition: 'border-color .15s, box-shadow .15s',
            }}
            className="vechernie-nav-tile"
          >
            <span style={{ fontSize: 22, lineHeight: 1, flexShrink: 0 }}>{t.icon}</span>
            <span style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
              <span style={{ fontSize: 14, fontWeight: 700, color: '#1A1814', lineHeight: 1.3 }}>{t.label}</span>
              <span style={{ fontSize: 12, color: '#9B9490', lineHeight: 1.4 }}>{t.sub}</span>
            </span>
          </a>
        ))}
      </div>
    </div>
  )
}

function SemejnyeSubNav() {
  const tiles = [
    { href: '/shkoly/tipy/semejnye/online/',           icon: '💻', label: 'Онлайн',             sub: 'Дистанционное семейное' },
    { href: '/shkoly/tipy/semejnye/attestatsiya/',     icon: '📋', label: 'Аттестация',          sub: 'Как сдать, документы' },
    { href: '/shkoly/tipy/semejnye/nachalnye-klassy/', icon: '🎒', label: '1–4 класс',           sub: 'Начальная школа дома' },
    { href: '/shkoly/tipy/semejnye/srednie-klassy/',   icon: '📚', label: '5–9 класс',           sub: 'Средняя школа, ОГЭ' },
  ]
  return (
    <div style={{ maxWidth: 860, margin: '0 auto', padding: '0 0 40px', fontFamily: 'var(--font-manrope, system-ui)' }}>
      <h2 style={{ fontSize: 18, fontWeight: 700, color: '#1A1814', margin: '0 0 16px', lineHeight: 1.3 }}>
        Найти по запросу
      </h2>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(190px, 1fr))', gap: 10 }}>
        {tiles.map(t => (
          <a
            key={t.href}
            href={t.href}
            style={{
              display: 'flex', alignItems: 'flex-start', gap: 12,
              padding: '14px 16px', borderRadius: 14,
              border: '1.5px solid #E8E0D6', background: '#fff',
              textDecoration: 'none', transition: 'border-color .15s, box-shadow .15s',
            }}
            className="vechernie-nav-tile"
          >
            <span style={{ fontSize: 22, lineHeight: 1, flexShrink: 0 }}>{t.icon}</span>
            <span style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
              <span style={{ fontSize: 14, fontWeight: 700, color: '#1A1814', lineHeight: 1.3 }}>{t.label}</span>
              <span style={{ fontSize: 12, color: '#9B9490', lineHeight: 1.4 }}>{t.sub}</span>
            </span>
          </a>
        ))}
      </div>
    </div>
  )
}

function EksternalSubNav() {
  const tiles = [
    { href: '/shkoly/tipy/eksternal/10-11-klass/', icon: '🎓', label: '10–11 класс',      sub: 'Старшие классы экстерном' },
    { href: '/shkoly/tipy/eksternal/online/',      icon: '💻', label: 'Онлайн',            sub: 'Дистанционный экстернат' },
    { href: '/shkoly/tipy/eksternal/besplatnye/',  icon: '🆓', label: 'Бесплатные',        sub: 'Прикрепление к гос. школе' },
    { href: '/shkoly/tipy/eksternal/9-klass/',     icon: '9️⃣', label: '9 класс / ОГЭ',    sub: 'Сдать ОГЭ экстерном' },
  ]
  return (
    <div style={{ maxWidth: 860, margin: '0 auto', padding: '0 0 40px', fontFamily: 'var(--font-manrope, system-ui)' }}>
      <h2 style={{ fontSize: 18, fontWeight: 700, color: '#1A1814', margin: '0 0 16px', lineHeight: 1.3 }}>
        Найти по запросу
      </h2>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(190px, 1fr))', gap: 10 }}>
        {tiles.map(t => (
          <a
            key={t.href}
            href={t.href}
            style={{
              display: 'flex', alignItems: 'flex-start', gap: 12,
              padding: '14px 16px', borderRadius: 14,
              border: '1.5px solid #E8E0D6', background: '#fff',
              textDecoration: 'none', transition: 'border-color .15s, box-shadow .15s',
            }}
            className="vechernie-nav-tile"
          >
            <span style={{ fontSize: 22, lineHeight: 1, flexShrink: 0 }}>{t.icon}</span>
            <span style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
              <span style={{ fontSize: 14, fontWeight: 700, color: '#1A1814', lineHeight: 1.3 }}>{t.label}</span>
              <span style={{ fontSize: 12, color: '#9B9490', lineHeight: 1.4 }}>{t.sub}</span>
            </span>
          </a>
        ))}
      </div>
    </div>
  )
}

function VechernieSubNav() {
  const tiles = [
    { href: '/shkoly/tipy/vechernie/online/',          icon: '💻', label: 'Онлайн',             sub: 'Дистанционное вечернее' },
    { href: '/shkoly/tipy/vechernie/besplatnye/',      icon: '🆓', label: 'Бесплатные',          sub: 'Государственные школы' },
    { href: '/shkoly/tipy/vechernie/smennye/',         icon: '🔄', label: 'Сменные школы',       sub: 'Вечерняя сменная форма' },
    { href: '/shkoly/tipy/vechernie/posle-9-klassa/',  icon: '9️⃣', label: 'После 9 класса',     sub: 'Поступление в 10 класс' },
    { href: '/shkoly/tipy/vechernie/starshie-klassy/', icon: '🎓', label: '10–11 класс',         sub: 'Старшие классы вечером' },
    { href: '/shkoly/tipy/vechernie/s-attestatom/',    icon: '📜', label: 'С аттестатом',        sub: 'Государственный документ' },
  ]
  return (
    <div style={{ maxWidth: 860, margin: '0 auto', padding: '0 0 40px', fontFamily: 'var(--font-manrope, system-ui)' }}>
      <h2 style={{ fontSize: 18, fontWeight: 700, color: '#1A1814', margin: '0 0 16px', lineHeight: 1.3 }}>
        Найти по запросу
      </h2>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(190px, 1fr))', gap: 10 }}>
        {tiles.map(t => (
          <a
            key={t.href}
            href={t.href}
            style={{
              display: 'flex', alignItems: 'flex-start', gap: 12,
              padding: '14px 16px', borderRadius: 14,
              border: '1.5px solid #E8E0D6', background: '#fff',
              textDecoration: 'none', transition: 'border-color .15s, box-shadow .15s',
            }}
            className="vechernie-nav-tile"
          >
            <span style={{ fontSize: 22, lineHeight: 1, flexShrink: 0 }}>{t.icon}</span>
            <span style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
              <span style={{ fontSize: 14, fontWeight: 700, color: '#1A1814', lineHeight: 1.3 }}>{t.label}</span>
              <span style={{ fontSize: 12, color: '#9B9490', lineHeight: 1.4 }}>{t.sub}</span>
            </span>
          </a>
        ))}
      </div>
      <style>{`.vechernie-nav-tile:hover { border-color: #FF6B3D !important; box-shadow: 0 4px 12px rgba(255,107,61,0.12) !important; }`}</style>
    </div>
  )
}

function LanguageNavSection() {
  return (
    <div style={{ maxWidth: 860, margin: '0 auto', padding: '0 0 40px', fontFamily: 'var(--font-manrope, system-ui)' }}>
      <h2 style={{ fontSize: 18, fontWeight: 700, color: '#1A1814', margin: '0 0 16px', lineHeight: 1.3 }}>
        Выберите язык
      </h2>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: 10 }}>
        {languageMetas.map(l => {
          const cnt = getSchoolsByLanguage(l.slug).length
          return (
            <Link
              key={l.slug}
              href={`/shkoly/tipy/yazykovye/${l.slug}/`}
              style={{
                display: 'flex', flexDirection: 'column', gap: 6,
                padding: '16px 18px', borderRadius: 14,
                border: '1.5px solid #E8E0D6', background: '#fff',
                textDecoration: 'none', transition: 'border-color .15s, box-shadow .15s',
              }}
              className="profile-nav-tile"
            >
              <span style={{ fontSize: 15, fontWeight: 700, color: '#1A1814', lineHeight: 1.3 }}>{l.label}</span>
              <span style={{ fontSize: 12, color: '#9B9490', lineHeight: 1.4 }}>{cnt} школ</span>
            </Link>
          )
        })}
      </div>
      <style>{`.profile-nav-tile:hover { border-color: #FF6B3D !important; box-shadow: 0 4px 12px rgba(255,107,61,0.12) !important; }`}</style>
    </div>
  )
}

function SportivnyeSubNav() {
  const tiles = [
    { href: '/shkoly/tipy/sportivnye/olimpijskij-rezerv/', icon: '🏆', label: 'Олимп. резерв',    sub: 'СШОР и ДЮСШ' },
    { href: '/shkoly/tipy/sportivnye/posle-9-klassa/',     icon: '🎓', label: 'После 9 класса',   sub: '10–11 класс и карьера' },
    { href: '/shkoly/tipy/sportivnye/gimnastika/',          icon: '🤸', label: 'Гимнастика',        sub: 'Спортивная и художественная' },
    { href: '/shkoly/tipy/sportivnye/edinoborstva/',        icon: '🥋', label: 'Единоборства',      sub: 'Борьба, дзюдо, самбо' },
    { href: '/shkoly/tipy/sportivnye/futbol/',              icon: '⚽', label: 'Футбол',            sub: 'Академии и СШОР' },
    { href: '/shkoly/tipy/sportivnye/plavanie/',            icon: '🏊', label: 'Плавание',          sub: 'Секции и бассейны' },
  ]
  return (
    <div style={{ maxWidth: 860, margin: '0 auto', padding: '0 0 40px', fontFamily: 'var(--font-manrope, system-ui)' }}>
      <h2 style={{ fontSize: 18, fontWeight: 700, color: '#1A1814', margin: '0 0 16px', lineHeight: 1.3 }}>
        Найти по направлению
      </h2>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(190px, 1fr))', gap: 10 }}>
        {tiles.map(t => (
          <a key={t.href} href={t.href} style={{ display: 'flex', alignItems: 'flex-start', gap: 12, padding: '14px 16px', borderRadius: 14, border: '1.5px solid #E8E0D6', background: '#fff', textDecoration: 'none', transition: 'border-color .15s, box-shadow .15s' }} className="vechernie-nav-tile">
            <span style={{ fontSize: 22, lineHeight: 1, flexShrink: 0 }}>{t.icon}</span>
            <span style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
              <span style={{ fontSize: 14, fontWeight: 700, color: '#1A1814', lineHeight: 1.3 }}>{t.label}</span>
              <span style={{ fontSize: 12, color: '#9B9490', lineHeight: 1.4 }}>{t.sub}</span>
            </span>
          </a>
        ))}
      </div>
    </div>
  )
}

function EgeSubNav() {
  const tiles = [
    { href: '/shkoly/tipy/podgotovka-ege/online/',     icon: '💻', label: 'Онлайн',          sub: 'Дистанционная подготовка' },
    { href: '/shkoly/tipy/podgotovka-ege/matematika/', icon: '📐', label: 'Математика',       sub: 'Профиль и база' },
    { href: '/shkoly/tipy/podgotovka-ege/russkij/',    icon: '📝', label: 'Русский язык',     sub: 'Сочинение и тест' },
    { href: '/shkoly/tipy/podgotovka-ege/biologiya/',  icon: '🧬', label: 'Биология',         sub: 'Для поступления в медвуз' },
    { href: '/shkoly/tipy/podgotovka-ege/luchshie/',   icon: '⭐', label: 'Лучшие',           sub: 'Рейтинг и отзывы' },
  ]
  return (
    <div style={{ maxWidth: 860, margin: '0 auto', padding: '0 0 40px', fontFamily: 'var(--font-manrope, system-ui)' }}>
      <h2 style={{ fontSize: 18, fontWeight: 700, color: '#1A1814', margin: '0 0 16px', lineHeight: 1.3 }}>
        Найти по запросу
      </h2>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(190px, 1fr))', gap: 10 }}>
        {tiles.map(t => (
          <a key={t.href} href={t.href} style={{ display: 'flex', alignItems: 'flex-start', gap: 12, padding: '14px 16px', borderRadius: 14, border: '1.5px solid #E8E0D6', background: '#fff', textDecoration: 'none', transition: 'border-color .15s, box-shadow .15s' }} className="vechernie-nav-tile">
            <span style={{ fontSize: 22, lineHeight: 1, flexShrink: 0 }}>{t.icon}</span>
            <span style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
              <span style={{ fontSize: 14, fontWeight: 700, color: '#1A1814', lineHeight: 1.3 }}>{t.label}</span>
              <span style={{ fontSize: 12, color: '#9B9490', lineHeight: 1.4 }}>{t.sub}</span>
            </span>
          </a>
        ))}
      </div>
    </div>
  )
}

function OgeSubNav() {
  const tiles = [
    { href: '/shkoly/tipy/podgotovka-oge/online/',     icon: '💻', label: 'Онлайн',          sub: 'Дистанционная подготовка' },
    { href: '/shkoly/tipy/podgotovka-oge/matematika/', icon: '📐', label: 'Математика',       sub: '9 класс, алгебра и геометрия' },
    { href: '/shkoly/tipy/podgotovka-oge/russkij/',    icon: '📝', label: 'Русский язык',     sub: 'Изложение и сочинение' },
    { href: '/shkoly/tipy/podgotovka-oge/9-klass/',    icon: '9️⃣', label: '9 класс',          sub: 'Все предметы ОГЭ' },
  ]
  return (
    <div style={{ maxWidth: 860, margin: '0 auto', padding: '0 0 40px', fontFamily: 'var(--font-manrope, system-ui)' }}>
      <h2 style={{ fontSize: 18, fontWeight: 700, color: '#1A1814', margin: '0 0 16px', lineHeight: 1.3 }}>
        Найти по запросу
      </h2>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(190px, 1fr))', gap: 10 }}>
        {tiles.map(t => (
          <a key={t.href} href={t.href} style={{ display: 'flex', alignItems: 'flex-start', gap: 12, padding: '14px 16px', borderRadius: 14, border: '1.5px solid #E8E0D6', background: '#fff', textDecoration: 'none', transition: 'border-color .15s, box-shadow .15s' }} className="vechernie-nav-tile">
            <span style={{ fontSize: 22, lineHeight: 1, flexShrink: 0 }}>{t.icon}</span>
            <span style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
              <span style={{ fontSize: 14, fontWeight: 700, color: '#1A1814', lineHeight: 1.3 }}>{t.label}</span>
              <span style={{ fontSize: 12, color: '#9B9490', lineHeight: 1.4 }}>{t.sub}</span>
            </span>
          </a>
        ))}
      </div>
    </div>
  )
}

function MezhdunarodnieSubNav() {
  const tiles = [
    { href: '/shkoly/tipy/mezhdunarodnie/anglijskie/',  icon: '🇬🇧', label: 'С английским',      sub: 'Языковые программы, IELTS' },
    { href: '/shkoly/tipy/mezhdunarodnie/britanskie/',  icon: '🎓', label: 'Британские',          sub: 'Cambridge, IGCSE, A-Level' },
    { href: '/shkoly/tipy/mezhdunarodnie/online/',      icon: '💻', label: 'Онлайн',              sub: 'Дистанционные программы' },
    { href: '/shkoly/tipy/mezhdunarodnie/letnie/',      icon: '☀️', label: 'Летние школы',        sub: 'Языки и наука на каникулах' },
    { href: '/shkoly/tipy/mezhdunarodnie/stoimost/',    icon: '💰', label: 'Стоимость',           sub: 'Цены и сравнение вариантов' },
  ]
  return (
    <div style={{ maxWidth: 860, margin: '0 auto', padding: '0 0 40px', fontFamily: 'var(--font-manrope, system-ui)' }}>
      <h2 style={{ fontSize: 18, fontWeight: 700, color: '#1A1814', margin: '0 0 16px', lineHeight: 1.3 }}>
        Найти по направлению
      </h2>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(190px, 1fr))', gap: 10 }}>
        {tiles.map(t => (
          <a
            key={t.href}
            href={t.href}
            style={{
              display: 'flex', alignItems: 'flex-start', gap: 12,
              padding: '14px 16px', borderRadius: 14,
              border: '1.5px solid #E8E0D6', background: '#fff',
              textDecoration: 'none', transition: 'border-color .15s, box-shadow .15s',
            }}
            className="vechernie-nav-tile"
          >
            <span style={{ fontSize: 22, lineHeight: 1, flexShrink: 0 }}>{t.icon}</span>
            <span style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
              <span style={{ fontSize: 14, fontWeight: 700, color: '#1A1814', lineHeight: 1.3 }}>{t.label}</span>
              <span style={{ fontSize: 12, color: '#9B9490', lineHeight: 1.4 }}>{t.sub}</span>
            </span>
          </a>
        ))}
      </div>
    </div>
  )
}

function KadetkieSubNav() {
  const tiles = [
    { href: '/shkoly/tipy/kadetskie/dlya-devochek/',  icon: '👧', label: 'Для девочек',       sub: 'Женские кадетские корпуса' },
    { href: '/shkoly/tipy/kadetskie/s-prozhivaniem/', icon: '🏠', label: 'С проживанием',      sub: 'Интернаты, полный пансион' },
    { href: '/shkoly/tipy/kadetskie/postuplenie/',    icon: '📋', label: 'Поступление',         sub: 'Возраст, документы, нормативы' },
    { href: '/shkoly/tipy/kadetskie/voennaya/',       icon: '⚔️', label: 'Военные / МЧС',      sub: 'МЧС, МВД, ФСБ, армия' },
    { href: '/shkoly/tipy/kadetskie/kazachya/',       icon: '🐴', label: 'Казачьи',             sub: 'Традиции казачества' },
    { href: '/shkoly/tipy/kadetskie/morskaya/',       icon: '⚓', label: 'Морские и лётные',   sub: 'Флот и авиация' },
  ]
  return (
    <div style={{ maxWidth: 860, margin: '0 auto', padding: '0 0 40px', fontFamily: 'var(--font-manrope, system-ui)' }}>
      <h2 style={{ fontSize: 18, fontWeight: 700, color: '#1A1814', margin: '0 0 16px', lineHeight: 1.3 }}>
        Найти по направлению
      </h2>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(190px, 1fr))', gap: 10 }}>
        {tiles.map(t => (
          <a
            key={t.href}
            href={t.href}
            style={{
              display: 'flex', alignItems: 'flex-start', gap: 12,
              padding: '14px 16px', borderRadius: 14,
              border: '1.5px solid #E8E0D6', background: '#fff',
              textDecoration: 'none', transition: 'border-color .15s, box-shadow .15s',
            }}
            className="vechernie-nav-tile"
          >
            <span style={{ fontSize: 22, lineHeight: 1, flexShrink: 0 }}>{t.icon}</span>
            <span style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
              <span style={{ fontSize: 14, fontWeight: 700, color: '#1A1814', lineHeight: 1.3 }}>{t.label}</span>
              <span style={{ fontSize: 12, color: '#9B9490', lineHeight: 1.4 }}>{t.sub}</span>
            </span>
          </a>
        ))}
      </div>
    </div>
  )
}

function PriVuzakhSubNav() {
  const tiles = [
    { href: '/shkoly/tipy/pri-vuzakh/tvorcheskie/',  icon: '🎨', label: 'Творческие',      sub: 'Музыка, искусство, театр' },
    { href: '/shkoly/tipy/pri-vuzakh/medicinskie/',  icon: '🩺', label: 'Медицинские',      sub: 'Биология, химия, анатомия' },
    { href: '/shkoly/tipy/pri-vuzakh/tehnicheskie/', icon: '⚙️', label: 'Технические',      sub: 'Математика, физика, IT' },
    { href: '/shkoly/tipy/pri-vuzakh/letnie/',       icon: '☀️', label: 'Летние школы',     sub: 'Интенсивы на каникулах' },
  ]
  return (
    <div style={{ maxWidth: 860, margin: '0 auto', padding: '0 0 40px', fontFamily: 'var(--font-manrope, system-ui)' }}>
      <h2 style={{ fontSize: 18, fontWeight: 700, color: '#1A1814', margin: '0 0 16px', lineHeight: 1.3 }}>
        Найти по направлению
      </h2>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(190px, 1fr))', gap: 10 }}>
        {tiles.map(t => (
          <a
            key={t.href}
            href={t.href}
            style={{
              display: 'flex', alignItems: 'flex-start', gap: 12,
              padding: '14px 16px', borderRadius: 14,
              border: '1.5px solid #E8E0D6', background: '#fff',
              textDecoration: 'none', transition: 'border-color .15s, box-shadow .15s',
            }}
            className="vechernie-nav-tile"
          >
            <span style={{ fontSize: 22, lineHeight: 1, flexShrink: 0 }}>{t.icon}</span>
            <span style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
              <span style={{ fontSize: 14, fontWeight: 700, color: '#1A1814', lineHeight: 1.3 }}>{t.label}</span>
              <span style={{ fontSize: 12, color: '#9B9490', lineHeight: 1.4 }}>{t.sub}</span>
            </span>
          </a>
        ))}
      </div>
    </div>
  )
}

export default async function GlobalTypePage({ params }: Props) {
  const { type } = await params
  if (!typeSlugs.includes(type as SchoolType)) notFound()
  const t = type as SchoolType
  const displayTitle = typeDisplayTitles[t]
  const count = schools.filter(s => s.type === t).length

  const seoContent = t === 'profilnye'
    ? <><ProfileNavSection /><SeoBlock type={t} count={count} /></>
    : t === 'yazykovye'
    ? <><LanguageNavSection /><SeoBlock type={t} count={count} /></>
    : t === 'vechernie'
    ? <><VechernieSubNav /><SeoBlock type={t} count={count} /></>
    // У этих двух хабов SeoBlock не выводим: TypeGuide покрывает те же темы
    // («как поступить», «стоимость», «кому подходит») подробнее, а вместе они
    // дают на одной странице два разных диапазона цен.
    : t === 'eksternal'
    ? <><EksternalSubNav /><TypeGuide type={t} /></>
    : t === 'online'
    ? <>
        <OnlineBrandsTable
          intro="Все школы федеральные — учиться можно из любого города. Сначала идут школы с собственной государственной аккредитацией (аттестат выдают сами), дальше — по цене формата с зачислением; для школ без открытых цен указано «по запросу». Нажмите на название, чтобы открыть тарифы, схему аттестации и отзывы."
          all
        />
        <OnlineLeadCta source="Онлайн-школы: хаб /shkoly/tipy/online/" />
        <TypeGuide type={t} />
      </>
    : t === 'domashnie'
    ? <>
        <DomashnieSubNav />
        <OnlineLeadCta
          source="Домашние школы: хаб /shkoly/tipy/domashnie/"
          heading="Подобрать домашнюю школу онлайн"
          text="Скажите класс, город и причину перехода — за 30 минут перезвоним и объясним, какая форма подойдёт (надомная, семейная или онлайн-школа), сколько это стоит в 2026/27 году и кто выдаст аттестат."
        />
        <OnlineBrandsTable
          title="Домашние школы онлайн: сравнение цен и аттестации"
          intro="Продукты «домашняя школа» у федеральных онлайн-школ: стоимость формата с зачислением, кто выдаёт аттестат и есть ли пробный период."
          compact
        />
        <TypeGuide type={t} />
      </>
    : t === 'semejnye'
    ? <>
        <SemejnyeSubNav />
        <OnlineLeadCta
          source="Семейные школы: хаб /shkoly/tipy/semejnye/"
          heading="Переходите на семейное обучение? Подберём школу для прикрепления"
          text="Скажите класс, город и причину перехода — за 30 минут перезвоним и объясним, как подать уведомление, где пройти аттестацию бесплатно и какая онлайн-школа возьмёт уроки и аттестации на себя."
          bullets={['уведомление и документы — по шагам', 'прикрепление к аккредитованной школе, аттестации онлайн', 'ОГЭ и ЕГЭ — в вашем городе, аттестат государственного образца']}
        />
        <OnlineBrandsTable
          title="Онлайн-школы для семейного обучения — 2026/27"
          intro="Все семь зачисляют на семейную или заочную форму из любого города и проводят промежуточные аттестации дистанционно."
          compact
        />
        <TypeGuide type={t} />
      </>
    : t === 'pri-vuzakh'
    ? <><PriVuzakhSubNav /><SeoBlock type={t} count={count} /></>
    : t === 'kadetskie'
    ? <><KadetkieSubNav /><SeoBlock type={t} count={count} /></>
    : t === 'mezhdunarodnie'
    ? <><MezhdunarodnieSubNav /><SeoBlock type={t} count={count} /></>
    : t === 'sportivnye'
    ? <><SportivnyeSubNav /><SeoBlock type={t} count={count} /></>
    : t === 'podgotovka-ege'
    ? <><EgeSubNav /><SeoBlock type={t} count={count} /></>
    : t === 'podgotovka-oge'
    ? <><OgeSubNav /><SeoBlock type={t} count={count} /></>
    : <SeoBlock type={t} count={count} />

  return (
    <CatalogClient
      initialTypes={[t]}
      lockType
      title={`${displayTitle} в России`}
      subtitle={`${count} школ — выберите город в фильтре`}
      breadcrumbs={[
        { label: 'Все школы', href: '/shkoly/' },
        { label: displayTitle },
      ]}
      seoContent={seoContent}
    />
  )
}
