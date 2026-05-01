import Link from 'next/link'
import { schools, regionSlugs, regionLabels, typeSlugs, typeLabels, getSchoolsByFeature, RegionSlug, SchoolType } from '@/data/schools'
import { getTypeColor, pluralSchools } from '@/lib/utils'
import SchoolCard from '@/components/SchoolCard'
import SearchBar from '@/components/SearchBar'
import HeroBanner from '@/components/HeroBanner'
import CitiesSection from '@/components/CitiesSection'

function IconBuilding() {
  return (
    <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3.75 21h16.5M4.5 3h15M5.25 3v18m13.5-18v18M9 6.75h1.5m-1.5 3h1.5m-1.5 3h1.5m3-6H15m-1.5 3H15m-1.5 3H15M9 21v-3.375c0-.621.504-1.125 1.125-1.125h3.75c.621 0 1.125.504 1.125 1.125V21" />
    </svg>
  )
}
function IconGradCap() {
  return (
    <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4.26 10.147a60.436 60.436 0 00-.491 6.347A48.627 48.627 0 0112 20.904a48.627 48.627 0 018.232-4.41 60.46 60.46 0 00-.491-6.347m-15.482 0a50.57 50.57 0 00-2.658-.813A59.905 59.905 0 0112 3.493a59.902 59.902 0 0110.399 5.84c-.896.248-1.783.52-2.658.814m-15.482 0A50.697 50.697 0 0112 13.489a50.702 50.702 0 017.74-3.342M6.75 15a.75.75 0 100-1.5.75.75 0 000 1.5zm0 0v-3.675A55.378 55.378 0 0112 8.443m-7.007 11.55A5.981 5.981 0 006.75 15.75v-1.5" />
    </svg>
  )
}
function IconMonitor() {
  return (
    <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 17.25v1.007a3 3 0 01-.879 2.122L7.5 21h9l-.621-.621A3 3 0 0115 18.257V17.25m6-12V15a2.25 2.25 0 01-2.25 2.25H5.25A2.25 2.25 0 013 15V5.25m18 0A2.25 2.25 0 0018.75 3H5.25A2.25 2.25 0 003 5.25m18 0H3" />
    </svg>
  )
}
function IconMoon() {
  return (
    <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M21.752 15.002A9.718 9.718 0 0118 15.75c-5.385 0-9.75-4.365-9.75-9.75 0-1.33.266-2.597.748-3.752A9.753 9.753 0 003 11.25C3 16.635 7.365 21 12.75 21a9.753 9.753 0 009.002-5.998z" />
    </svg>
  )
}
function IconBolt() {
  return (
    <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3.75 13.5l10.5-11.25L12 10.5h8.25L9.75 21.75 12 13.5H3.75z" />
    </svg>
  )
}
function IconMapPin() {
  return (
    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 10.5a3 3 0 11-6 0 3 3 0 016 0z" />
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1115 0z" />
    </svg>
  )
}

const typeIcons: Record<SchoolType, React.ReactNode> = {
  gosudarstvennye: <IconBuilding />,
  chastnie: <IconGradCap />,
  online: <IconMonitor />,
  vechernie: <IconMoon />,
  eksternal: <IconBolt />,
  semejnye: (
    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M2.25 12l8.954-8.955c.44-.439 1.152-.439 1.591 0L21.75 12M4.5 9.75v10.125c0 .621.504 1.125 1.125 1.125H9.75v-4.875c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125V21h4.125c.621 0 1.125-.504 1.125-1.125V9.75M8.25 21h8.25" />
    </svg>
  ),
  domashnie: (
    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 6.042A8.967 8.967 0 006 3.75c-1.052 0-2.062.18-3 .512v14.25A8.987 8.987 0 016 18c2.305 0 4.408.867 6 2.292m0-14.25a8.966 8.966 0 016-2.292c1.052 0 2.062.18 3 .512v14.25A8.987 8.987 0 0018 18a8.967 8.967 0 00-6 2.292m0-14.25v14.25" />
    </svg>
  ),
  'pri-vuzakh': (
    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 3v2.25m6.364.386l-1.591 1.591M21 12h-2.25m-.386 6.364l-1.591-1.591M12 18.75V21m-4.773-4.227l-1.591 1.591M5.25 12H3m4.227-4.773L5.636 5.636M15.75 12a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0z" />
    </svg>
  ),
  profilnye: (
    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9.75 3.104v5.714a2.25 2.25 0 01-.659 1.591L5 14.5M9.75 3.104c-.251.023-.501.05-.75.082m.75-.082a24.301 24.301 0 014.5 0m0 0v5.714c0 .597.237 1.17.659 1.591L19.8 15.3M14.25 3.104c.251.023.501.05.75.082M19.8 15.3l-1.57.393A9.065 9.065 0 0112 15a9.065 9.065 0 00-6.23-.693L5 14.5m14.8.8l1.402 1.402c1.232 1.232.65 3.318-1.067 3.611A48.309 48.309 0 0112 21c-2.773 0-5.491-.235-8.135-.687-1.718-.293-2.3-2.379-1.067-3.61L5 14.5" />
    </svg>
  ),
  gimnazii: (
    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4.26 10.147a60.436 60.436 0 00-.491 6.347A48.627 48.627 0 0112 20.904a48.627 48.627 0 018.232-4.41 60.46 60.46 0 00-.491-6.347m-15.482 0a50.57 50.57 0 00-2.658-.813A59.905 59.905 0 0112 3.493a59.902 59.902 0 0110.399 5.84c-.896.248-1.783.52-2.658.814m-15.482 0A50.697 50.697 0 0112 13.489a50.702 50.702 0 017.74-3.342M6.75 15a.75.75 0 100-1.5.75.75 0 000 1.5zm0 0v-3.675A55.378 55.378 0 0112 8.443m-7.007 11.55A5.981 5.981 0 006.75 15.75v-1.5" />
    </svg>
  ),
  korrektsionnye: (
    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M21 8.25c0-2.485-2.099-4.5-4.688-4.5-1.935 0-3.597 1.126-4.312 2.733-.715-1.607-2.377-2.733-4.313-2.733C5.1 3.75 3 5.765 3 8.25c0 7.22 9 12 9 12s9-4.78 9-12z" />
    </svg>
  ),
  kadetskie: (
    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M11.48 3.499a.562.562 0 011.04 0l2.125 5.111a.563.563 0 00.475.345l5.518.442c.499.04.701.663.321.988l-4.204 3.602a.563.563 0 00-.182.557l1.285 5.385a.562.562 0 01-.84.61l-4.725-2.885a.563.563 0 00-.586 0L6.982 20.54a.562.562 0 01-.84-.61l1.285-5.386a.562.562 0 00-.182-.557l-4.204-3.602a.563.563 0 01.321-.988l5.518-.442a.563.563 0 00.475-.345L11.48 3.5z" />
    </svg>
  ),
}

const typeDesc: Record<SchoolType, string> = {
  gosudarstvennye: 'Бесплатное образование по государственной программе',
  chastnie: 'Малые классы, индивидуальный подход, доп. программы',
  online: 'Обучение дистанционно из любой точки мира',
  vechernie: 'Для работающих граждан, обучение по вечерам',
  eksternal: 'Ускоренное прохождение программы, аттестат гос. образца',
  semejnye: 'Родители участвуют в обучении, малые классы, семейная атмосфера',
  domashnie: 'Обучение дома с официальным сопровождением и аттестацией',
  'pri-vuzakh': 'Лицеи и школы на базе университетов с углублённой программой',
  profilnye: 'Специализированные школы: IT, медицина, право, искусство и другие',
  gimnazii: 'Углублённые программы, высокие баллы ЕГЭ, победители олимпиад',
  korrektsionnye: 'Обучение детей с ОВЗ: нарушения слуха, зрения, речи, ЗПР, РАС',
  kadetskie: 'Военно-патриотическое воспитание, строевая подготовка, НВП',
}

const typeColors: Record<SchoolType, string> = {
  gosudarstvennye: 'bg-blue-50 text-blue-700 border-blue-200 group-hover:border-blue-400 group-hover:bg-blue-50',
  chastnie: 'bg-purple-50 text-purple-700 border-purple-200 group-hover:border-purple-400 group-hover:bg-purple-50',
  online: 'bg-emerald-50 text-emerald-700 border-emerald-200 group-hover:border-emerald-400 group-hover:bg-emerald-50',
  vechernie: 'bg-indigo-50 text-indigo-700 border-indigo-200 group-hover:border-indigo-400 group-hover:bg-indigo-50',
  eksternal: 'bg-amber-50 text-amber-700 border-amber-200 group-hover:border-amber-400 group-hover:bg-amber-50',
  semejnye: 'bg-teal-50 text-teal-700 border-teal-200 group-hover:border-teal-400 group-hover:bg-teal-50',
  domashnie: 'bg-yellow-50 text-yellow-700 border-yellow-200 group-hover:border-yellow-400 group-hover:bg-yellow-50',
  'pri-vuzakh': 'bg-indigo-50 text-indigo-700 border-indigo-200 group-hover:border-indigo-400 group-hover:bg-indigo-50',
  profilnye: 'bg-rose-50 text-rose-700 border-rose-200 group-hover:border-rose-400 group-hover:bg-rose-50',
  gimnazii: 'bg-cyan-50 text-cyan-700 border-cyan-200 group-hover:border-cyan-400 group-hover:bg-cyan-50',
  korrektsionnye: 'bg-lime-50 text-lime-700 border-lime-200 group-hover:border-lime-400 group-hover:bg-lime-50',
  kadetskie: 'bg-slate-50 text-slate-700 border-slate-200 group-hover:border-slate-400 group-hover:bg-slate-50',
}

const typeIconColors: Record<SchoolType, string> = {
  gosudarstvennye: 'text-blue-600 bg-blue-100',
  chastnie: 'text-purple-600 bg-purple-100',
  online: 'text-emerald-600 bg-emerald-100',
  vechernie: 'text-indigo-600 bg-indigo-100',
  eksternal: 'text-amber-600 bg-amber-100',
  semejnye: 'text-teal-600 bg-teal-100',
  domashnie: 'text-yellow-600 bg-yellow-100',
  'pri-vuzakh': 'text-indigo-600 bg-indigo-100',
  profilnye: 'text-rose-600 bg-rose-100',
  gimnazii: 'text-cyan-600 bg-cyan-100',
  korrektsionnye: 'text-lime-600 bg-lime-100',
  kadetskie: 'text-slate-600 bg-slate-100',
}

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
  const itCount = getSchoolsByFeature('it-klass').length

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
              <Link key={type} href={`/shkoly/moskva/${type}/`} className="flex items-center gap-1.5 whitespace-nowrap hover:text-[#0369A1] transition-colors duration-200 cursor-pointer">
                <span className={`inline-block w-2 h-2 rounded-full ${getTypeColor(type).split(' ')[0]}`} />
                {typeLabels[type]}: {schools.filter(s => s.type === type).length}
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* Types grid */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <h2 className="text-2xl font-bold text-[#0F172A] mb-2">Типы школ</h2>
        <p className="text-gray-500 mb-8">Выберите подходящий формат обучения</p>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4">
          {typeSlugs.map(type => (
            <Link
              key={type}
              href={`/shkoly/moskva/${type}/`}
              className={`group bg-white rounded-2xl border-2 p-5 hover:shadow-lg transition-all duration-200 cursor-pointer ${typeColors[type]}`}
            >
              <div className={`inline-flex items-center justify-center w-12 h-12 rounded-xl mb-4 ${typeIconColors[type]} transition-transform duration-200 group-hover:scale-110`}>
                {typeIcons[type]}
              </div>
              <h3 className="font-semibold text-[#0F172A] mb-1.5 group-hover:text-[#0369A1] transition-colors duration-200">
                {typeLabels[type]}
              </h3>
              <p className="text-xs text-gray-500 leading-relaxed mb-3">{typeDesc[type]}</p>
              <span className={`inline-block text-xs px-2.5 py-1 rounded-full font-semibold ${getTypeColor(type)}`}>
                {schools.filter(s => s.type === type).length} школ
              </span>
            </Link>
          ))}

          {/* Программирование */}
          <Link
            href="/shkoly/osobennosti/it-klass/"
            className="group bg-white rounded-2xl border-2 p-5 hover:shadow-lg transition-all duration-200 cursor-pointer border-violet-200 hover:border-violet-400 hover:bg-violet-50"
          >
            <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl mb-4 text-violet-600 bg-violet-100 transition-transform duration-200 group-hover:scale-110">
              <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M6.75 7.5l3 2.25-3 2.25m4.5 0h3m-9 8.25h13.5A2.25 2.25 0 0021 18V6a2.25 2.25 0 00-2.25-2.25H5.25A2.25 2.25 0 003 6v12a2.25 2.25 0 002.25 2.25z" />
              </svg>
            </div>
            <h3 className="font-semibold text-[#0F172A] mb-1.5 group-hover:text-[#0369A1] transition-colors duration-200">Программирование</h3>
            <p className="text-xs text-gray-500 leading-relaxed mb-3">IT-классы, робототехника, веб-разработка, ИИ, Яндекс и СКБ Контур</p>
            <span className="inline-block text-xs px-2.5 py-1 rounded-full font-semibold bg-violet-100 text-violet-700">
              {itCount} школ
            </span>
          </Link>

          {/* ЕГЭ */}
          <Link
            href="/shkoly/moskva/podgotovka-k-ege/"
            className="group bg-white rounded-2xl border-2 p-5 hover:shadow-lg transition-all duration-200 cursor-pointer border-amber-200 hover:border-amber-400 hover:bg-amber-50"
          >
            <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl mb-4 text-amber-600 bg-amber-100 transition-transform duration-200 group-hover:scale-110">
              <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4.26 10.147a60.436 60.436 0 00-.491 6.347A48.627 48.627 0 0112 20.904a48.627 48.627 0 018.232-4.41 60.46 60.46 0 00-.491-6.347m-15.482 0a50.57 50.57 0 00-2.658-.813A59.905 59.905 0 0112 3.493a59.902 59.902 0 0110.399 5.84c-.896.248-1.783.52-2.658.814m-15.482 0A50.697 50.697 0 0112 13.489a50.702 50.702 0 017.74-3.342M6.75 15a.75.75 0 100-1.5.75.75 0 000 1.5zm0 0v-3.675A55.378 55.378 0 0112 8.443m-7.007 11.55A5.981 5.981 0 006.75 15.75v-1.5" />
              </svg>
            </div>
            <h3 className="font-semibold text-[#0F172A] mb-1.5 group-hover:text-[#0369A1] transition-colors duration-200">Подготовка к ЕГЭ</h3>
            <p className="text-xs text-gray-500 leading-relaxed mb-3">Профильные 10–11 классы, интенсивы, высокий средний балл выпускников</p>
            <span className="inline-block text-xs px-2.5 py-1 rounded-full font-semibold bg-amber-100 text-amber-700">
              {egeCount} школ
            </span>
          </Link>

          {/* ОГЭ */}
          <Link
            href="/shkoly/moskva/podgotovka-k-oge/"
            className="group bg-white rounded-2xl border-2 p-5 hover:shadow-lg transition-all duration-200 cursor-pointer border-teal-200 hover:border-teal-400 hover:bg-teal-50"
          >
            <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl mb-4 text-teal-600 bg-teal-100 transition-transform duration-200 group-hover:scale-110">
              <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h3.75M9 15h3.75M9 18h3.75m3 .75H18a2.25 2.25 0 002.25-2.25V6.108c0-1.135-.845-2.098-1.976-2.192a48.424 48.424 0 00-1.123-.08m-5.801 0c-.065.21-.1.433-.1.664 0 .414.336.75.75.75h4.5a.75.75 0 00.75-.75 2.25 2.25 0 00-.1-.664m-5.8 0A2.251 2.251 0 0113.5 2.25H15c1.012 0 1.867.668 2.15 1.586m-5.8 0c-.376.023-.75.05-1.124.08C9.095 4.01 8.25 4.973 8.25 6.108V8.25m0 0H4.875c-.621 0-1.125.504-1.125 1.125v11.25c0 .621.504 1.125 1.125 1.125h9.75c.621 0 1.125-.504 1.125-1.125V9.375c0-.621-.504-1.125-1.125-1.125H8.25zM6.75 12h.008v.008H6.75V12zm0 3h.008v.008H6.75V15zm0 3h.008v.008H6.75V18z" />
              </svg>
            </div>
            <h3 className="font-semibold text-[#0F172A] mb-1.5 group-hover:text-[#0369A1] transition-colors duration-200">Подготовка к ОГЭ</h3>
            <p className="text-xs text-gray-500 leading-relaxed mb-3">Профильные 9-е классы, тренировочные экзамены, разбор КИМ по всем предметам</p>
            <span className="inline-block text-xs px-2.5 py-1 rounded-full font-semibold bg-teal-100 text-teal-700">
              {ogeCount} школ
            </span>
          </Link>

        </div>
      </section>

      {/* Cities */}
      <CitiesSection />

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
                  href="/shkoly/moskva/podgotovka-k-ege/"
                  className="inline-flex items-center gap-1.5 bg-amber-600 hover:bg-amber-700 text-white text-sm font-semibold px-4 py-2.5 rounded-xl transition-colors duration-200"
                >
                  Смотреть школы ЕГЭ
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" />
                  </svg>
                </Link>
                <Link
                  href="/shkoly/moskva/podgotovka-k-ege/online/"
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
                  href="/shkoly/moskva/podgotovka-k-oge/"
                  className="inline-flex items-center gap-1.5 bg-teal-600 hover:bg-teal-700 text-white text-sm font-semibold px-4 py-2.5 rounded-xl transition-colors duration-200"
                >
                  Смотреть школы ОГЭ
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" />
                  </svg>
                </Link>
                <Link
                  href="/shkoly/moskva/podgotovka-k-oge/online/"
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
