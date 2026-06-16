import Link from 'next/link'
import { schools, typeSlugs, typeLabels, getSchoolsByFeature, featureMetas } from '@/data/schools'
import { getTypeColor, pluralSchools } from '@/lib/utils'
import SchoolCard from '@/components/SchoolCard'
import HeroBanner from '@/components/HeroBanner'
import CitiesSection from '@/components/CitiesSection'
import SchoolTypesSection from '@/components/SchoolTypesSection'

const websiteSchema = {
  '@context': 'https://schema.org',
  '@type': 'WebSite',
  '@id': 'https://pro-schools.ru/#website',
  name: 'ШколыРоссии.рф',
  url: 'https://pro-schools.ru',
  description: 'Крупнейший каталог школ России',
  potentialAction: {
    '@type': 'SearchAction',
    target: { '@type': 'EntryPoint', urlTemplate: 'https://pro-schools.ru/poisk/?q={search_term_string}' },
    'query-input': 'required name=search_term_string',
  },
}

const orgSchema = {
  '@context': 'https://schema.org',
  '@type': 'Organization',
  '@id': 'https://pro-schools.ru/#organization',
  name: 'ШколыРоссии.рф',
  url: 'https://pro-schools.ru',
  logo: 'https://pro-schools.ru/logo.png',
  contactPoint: { '@type': 'ContactPoint', email: 'info@pro-schools.ru', contactType: 'customer support' },
}

export default function HomePage() {
  const topSchools = schools.filter(s => s.rating >= 4.7).slice(0, 6)
  const egeCount = getSchoolsByFeature('podgotovka-k-ege').length
  const ogeCount = getSchoolsByFeature('podgotovka-k-oge').length
  const egeOnlineCount = getSchoolsByFeature('podgotovka-k-ege').filter(s => s.type === 'online').length
  const ogeOnlineCount = getSchoolsByFeature('podgotovka-k-oge').filter(s => s.type === 'online').length

  return (
    <div className="bg-[#FFF8F0]">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(websiteSchema) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(orgSchema) }} />

      {/* Hero */}
      <HeroBanner />

      {/* Stats bar */}
      <section className="bg-white border-b border-gray-200 shadow-sm" style={{ background: '#fff' }}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3">
          <div className="flex items-center gap-6 overflow-x-auto text-sm text-gray-500">
            <span className="font-semibold text-[#0F172A] whitespace-nowrap">{pluralSchools(schools.length)} в каталоге</span>
            <span className="w-px h-4 bg-gray-200 shrink-0" />
            {typeSlugs.map(type => (
              <Link key={type} href={`/shkoly/tipy/${type}/`} className="flex items-center gap-1.5 whitespace-nowrap hover:text-[#0369A1] transition-colors duration-200 cursor-pointer">
                <span className={`inline-block w-2 h-2 rounded-full ${getTypeColor(type).split(' ')[0]}`} />
                {typeLabels[type]}: {schools.filter(s => s.type === type).length}
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* Types grid */}
      <SchoolTypesSection />

      {/* Cities */}
      <CitiesSection />

      {/* Features / Особенности */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="flex items-end justify-between mb-6 gap-4">
          <div>
            <h2 className="text-2xl font-bold text-[#0F172A] mb-1">Особенности школ</h2>
            <p className="text-gray-500 text-sm">Фильтруйте по важным для вас критериям</p>
          </div>
          <Link href="/shkoly/" className="text-[#FF6B3D] text-sm font-semibold hover:text-orange-600 transition-colors flex items-center gap-1 whitespace-nowrap">
            Все фильтры
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" />
            </svg>
          </Link>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
          {featureMetas.map(f => {
            const cnt = getSchoolsByFeature(f.slug).length
            return (
              <Link
                key={f.slug}
                href={`/shkoly/osobennosti/${f.slug}/`}
                className="group flex flex-col gap-2 rounded-2xl border border-[#E8E0D6] bg-white hover:border-[#FF6B3D] hover:shadow-md transition-all duration-200 p-4"
              >
                <span className="text-sm font-semibold text-[#1A1814] group-hover:text-[#FF6B3D] transition-colors leading-tight">
                  {f.label}
                </span>
                <span className="text-xs text-gray-400 font-medium">{cnt} школ</span>
              </Link>
            )
          })}
          <Link
            href="/shkoly/osobennosti/it-klass/"
            className="group flex flex-col gap-2 rounded-2xl border border-[#E8E0D6] bg-white hover:border-[#7B5CFF] hover:shadow-md transition-all duration-200 p-4"
          >
            <span className="text-sm font-semibold text-[#1A1814] group-hover:text-[#7B5CFF] transition-colors leading-tight">
              Программирование
            </span>
            <span className="text-xs text-gray-400 font-medium">{getSchoolsByFeature('it-klass').length} школ</span>
          </Link>
        </div>
      </section>

      {/* Exam prep */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <h2 className="text-2xl font-bold text-[#0F172A] mb-2">Подготовка к экзаменам</h2>
        <p className="text-gray-500 mb-8">Школы с профильными программами к ЕГЭ и ОГЭ — очно и онлайн</p>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

          {/* ЕГЭ */}
          <div className="rounded-2xl border-2 border-amber-200 bg-amber-50 overflow-hidden">
            <div className="p-6">
              <div className="flex items-start justify-between mb-4">
                <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-amber-100 text-amber-700">
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4.26 10.147a60.436 60.436 0 00-.491 6.347A48.627 48.627 0 0112 20.904a48.627 48.627 0 018.232-4.41 60.46 60.46 0 00-.491-6.347m-15.482 0a50.57 50.57 0 00-2.658-.813A59.905 59.905 0 0112 3.493a59.902 59.902 0 0110.399 5.84c-.896.248-1.783.52-2.658.814m-15.482 0A50.697 50.697 0 0112 13.489a50.702 50.702 0 017.74-3.342M6.75 15a.75.75 0 100-1.5.75.75 0 000 1.5zm0 0v-3.675A55.378 55.378 0 0112 8.443m-7.007 11.55A5.981 5.981 0 006.75 15.75v-1.5" />
                  </svg>
                </div>
                <span className="text-xs font-semibold bg-amber-200 text-amber-800 px-2.5 py-1 rounded-full">
                  {egeCount} школ
                </span>
              </div>
              <h3 className="text-xl font-bold text-[#0F172A] mb-1.5">Подготовка к ЕГЭ</h3>
              <p className="text-sm text-gray-600 mb-5 leading-relaxed">
                Профильные классы 10–11, авторские интенсивы, пробные ЕГЭ с разбором. Школы с высоким средним баллом выпускников.
              </p>
              <div className="flex flex-wrap gap-2">
                <Link
                  href="/shkoly/osobennosti/podgotovka-k-ege/"
                  className="inline-flex items-center gap-1.5 bg-amber-600 hover:bg-amber-700 text-white text-sm font-semibold px-4 py-2.5 rounded-xl transition-colors duration-200"
                >
                  Смотреть школы ЕГЭ
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" />
                  </svg>
                </Link>
                <Link
                  href="/shkoly/tipy/online/"
                  className="inline-flex items-center gap-1.5 bg-white border border-amber-300 text-amber-700 hover:bg-amber-100 text-sm font-semibold px-4 py-2.5 rounded-xl transition-colors duration-200"
                >
                  Онлайн ({egeOnlineCount})
                </Link>
              </div>
            </div>
          </div>

          {/* ОГЭ */}
          <div className="rounded-2xl border-2 border-teal-200 bg-teal-50 overflow-hidden">
            <div className="p-6">
              <div className="flex items-start justify-between mb-4">
                <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-teal-100 text-teal-700">
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h3.75M9 15h3.75M9 18h3.75m3 .75H18a2.25 2.25 0 002.25-2.25V6.108c0-1.135-.845-2.098-1.976-2.192a48.424 48.424 0 00-1.123-.08m-5.801 0c-.065.21-.1.433-.1.664 0 .414.336.75.75.75h4.5a.75.75 0 00.75-.75 2.25 2.25 0 00-.1-.664m-5.8 0A2.251 2.251 0 0113.5 2.25H15c1.012 0 1.867.668 2.15 1.586m-5.8 0c-.376.023-.75.05-1.124.08C9.095 4.01 8.25 4.973 8.25 6.108V8.25m0 0H4.875c-.621 0-1.125.504-1.125 1.125v11.25c0 .621.504 1.125 1.125 1.125h9.75c.621 0 1.125-.504 1.125-1.125V9.375c0-.621-.504-1.125-1.125-1.125H8.25zM6.75 12h.008v.008H6.75V12zm0 3h.008v.008H6.75V15zm0 3h.008v.008H6.75V18z" />
                  </svg>
                </div>
                <span className="text-xs font-semibold bg-teal-200 text-teal-800 px-2.5 py-1 rounded-full">
                  {ogeCount} школ
                </span>
              </div>
              <h3 className="text-xl font-bold text-[#0F172A] mb-1.5">Подготовка к ОГЭ</h3>
              <p className="text-sm text-gray-600 mb-5 leading-relaxed">
                Профильные 9-е классы, тренировочные экзамены по расписанию, разбор типичных ошибок по всем предметам ОГЭ.
              </p>
              <div className="flex flex-wrap gap-2">
                <Link
                  href="/shkoly/osobennosti/podgotovka-k-oge/"
                  className="inline-flex items-center gap-1.5 bg-teal-600 hover:bg-teal-700 text-white text-sm font-semibold px-4 py-2.5 rounded-xl transition-colors duration-200"
                >
                  Смотреть школы ОГЭ
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" />
                  </svg>
                </Link>
                <Link
                  href="/shkoly/tipy/online/"
                  className="inline-flex items-center gap-1.5 bg-white border border-teal-300 text-teal-700 hover:bg-teal-100 text-sm font-semibold px-4 py-2.5 rounded-xl transition-colors duration-200"
                >
                  Онлайн ({ogeOnlineCount})
                </Link>
              </div>
            </div>
          </div>

        </div>
      </section>

      {/* Top schools */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h2 className="text-2xl font-bold text-[#0F172A]">Лучшие школы</h2>
            <p className="text-gray-500 mt-1">По рейтингу и отзывам пользователей</p>
          </div>
          <Link href="/shkoly/" className="text-[#0369A1] text-sm font-semibold hover:text-blue-700 transition-colors duration-200 cursor-pointer flex items-center gap-1">
            Все школы
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" />
            </svg>
          </Link>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {topSchools.map(school => (
            <SchoolCard key={school.id} school={school} />
          ))}
        </div>
      </section>

      {/* Наши сервисы */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="mb-8">
          <h2 className="text-2xl font-bold text-[#0F172A]">Наши сервисы</h2>
          <p className="text-gray-500 mt-1">Бесплатные образовательные ресурсы для учеников и родителей</p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          <Link href="/uchebnik/" className="group bg-white border border-gray-200 rounded-2xl p-6 flex items-start gap-4 hover:border-blue-300 hover:shadow-md transition-all duration-200 cursor-pointer">
            <div className="w-14 h-14 bg-blue-50 rounded-xl flex items-center justify-center shrink-0 group-hover:bg-blue-100 transition-colors">
              <svg className="w-7 h-7 text-[#0369A1]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 6.042A8.967 8.967 0 006 3.75c-1.052 0-2.062.18-3 .512v14.25A8.987 8.987 0 016 18c2.305 0 4.408.867 6 2.292m0-14.25a8.966 8.966 0 016-2.292c1.052 0 2.062.18 3 .512v14.25A8.987 8.987 0 0018 18a8.967 8.967 0 00-6 2.292m0-14.25v14.25" />
              </svg>
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1">
                <h3 className="text-lg font-bold text-[#0F172A]">Онлайн-учебник</h3>
                <span className="text-xs text-[#0369A1] font-semibold opacity-0 group-hover:opacity-100 transition-opacity">Открыть →</span>
              </div>
              <p className="text-sm text-gray-600 leading-relaxed">Понятные статьи по школьной программе 1–11 класса: правила, формулы, таблицы и разбор тем с примерами по всем предметам.</p>
            </div>
          </Link>
          <Link href="/gdz/" className="group bg-white border border-gray-200 rounded-2xl p-6 flex items-start gap-4 hover:border-blue-300 hover:shadow-md transition-all duration-200 cursor-pointer">
            <div className="w-14 h-14 bg-emerald-50 rounded-xl flex items-center justify-center shrink-0 group-hover:bg-emerald-100 transition-colors">
              <svg className="w-7 h-7 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1">
                <h3 className="text-lg font-bold text-[#0F172A]">Помощь с домашними заданиями</h3>
                <span className="text-xs text-[#0369A1] font-semibold opacity-0 group-hover:opacity-100 transition-opacity">Открыть →</span>
              </div>
              <p className="text-sm text-gray-600 leading-relaxed">ГДЗ с подробными решениями по учебникам 1–11 класса: условия задач, пошаговые решения и ответы для самопроверки.</p>
            </div>
          </Link>
        </div>
      </section>

      {/* SEO text */}
      <section className="bg-white border-t border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="max-w-3xl">
            <h2 className="text-xl font-bold text-[#0F172A] mb-4">О каталоге школ России</h2>
            <div className="space-y-3 text-sm text-gray-600 leading-relaxed">
              <p>
                Наш портал собрал информацию о государственных, частных, онлайн-школах, вечерних школах и центрах экстернатного обучения по всей России. Начиная с Москвы и Московской области, каталог постепенно охватывает все регионы страны.
              </p>
              <p>
                Для каждой школы представлены: официальное название, адрес и контакты, описание образовательной программы, особенности и преимущества, а также рейтинг на основе отзывов родителей и учеников.
              </p>
              <p>
                Частные школы Москвы — одно из самых популярных направлений поиска. В каталоге представлены небольшие частные школы с малыми классами, школы с международными программами, а также школы-пансионы Подмосковья.
              </p>
            </div>
          </div>
        </div>
      </section>
    </div>
  )
}
