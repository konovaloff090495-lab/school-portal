import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import {
  schools, regionLabels, typeLabels,
  getSchoolBySlug, getAllSchoolSlugs, formatPrice,
} from '@/data/schools'
import { getTypeColor, getTypeBorderColor } from '@/lib/utils'
import Breadcrumbs from '@/components/Breadcrumbs'
import LeadForm from '@/components/LeadForm'
import SchoolCard from '@/components/SchoolCard'
import SchoolPageGallery from '@/components/SchoolPageGallery'


interface Props {
  params: Promise<{ slug: string }>
}

export async function generateStaticParams() {
  return getAllSchoolSlugs().map(slug => ({ slug }))
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params
  const school = getSchoolBySlug(slug)
  if (!school) return {}
  return {
    title: `${school.name} — ${school.city} | адрес, телефон, описание`,
    description: `${school.name} (${school.city}) — ${school.description} Адрес: ${school.address}. Телефон: ${school.phone}.`,
    alternates: { canonical: `https://pro-schools.ru/shkola/${slug}/` },
  }
}

export default async function SchoolPage({ params }: Props) {
  const { slug } = await params
  const school = getSchoolBySlug(slug)
  if (!school) notFound()

  const similar = schools
    .filter(s => s.id !== school.id && s.type === school.type && s.region === school.region)
    .slice(0, 3)

  const stars = Math.round(school.rating)

  const pageUrl = `https://pro-schools.ru/shkola/${school.slug}/`
  const regionName = school.region === 'moskva' ? 'Москва'
    : school.region === 'moskovskaya-oblast' ? 'Московская область'
    : 'Новосибирск'

  // Schema.org: EducationalOrganization
  const orgSchema = {
    '@context': 'https://schema.org',
    '@type': 'EducationalOrganization',
    '@id': pageUrl,
    name: school.name,
    description: school.description,
    url: school.website ?? pageUrl,
    image: `https://pro-schools.ru/schools/${school.slug}.jpg`,
    telephone: school.phone,
    address: {
      '@type': 'PostalAddress',
      streetAddress: school.address,
      addressLocality: school.city,
      addressRegion: regionName,
      addressCountry: 'RU',
    },
    aggregateRating: {
      '@type': 'AggregateRating',
      ratingValue: school.rating.toString(),
      reviewCount: school.reviewCount.toString(),
      bestRating: '5',
      worstRating: '1',
    },
    ...(school.founded ? { foundingDate: school.founded.toString() } : {}),
    ...(school.email ? { email: school.email } : {}),
  }

  // Schema.org: BreadcrumbList
  const breadcrumbSchema = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      { '@type': 'ListItem', position: 1, name: 'Все школы', item: 'https://pro-schools.ru/shkoly/' },
      { '@type': 'ListItem', position: 2, name: regionLabels[school.region], item: `https://pro-schools.ru/shkoly/${school.region}/` },
      { '@type': 'ListItem', position: 3, name: typeLabels[school.type], item: `https://pro-schools.ru/shkoly/${school.region}/${school.type}/` },
      { '@type': 'ListItem', position: 4, name: school.name, item: pageUrl },
    ],
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(orgSchema) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbSchema) }} />

      <Breadcrumbs crumbs={[
        { label: 'Все школы', href: '/shkoly/' },
        { label: regionLabels[school.region], href: `/shkoly/${school.region}/` },
        { label: typeLabels[school.type], href: `/shkoly/${school.region}/${school.type}/` },
        { label: school.name },
      ]} />

      {/* Hero галерея */}
      <SchoolPageGallery slug={school.slug} imageAlt={school.imageAlt}>
        <div>
          <span className={`inline-block text-xs font-semibold px-2.5 py-1 rounded-full mb-2 bg-white/95 ${getTypeColor(school.type)}`}>
            {typeLabels[school.type]}
          </span>
          <h1 className="text-white font-bold text-2xl md:text-3xl drop-shadow-md leading-tight">
            {school.name}
          </h1>
          <p className="text-white/80 text-sm mt-1">{school.city}, {school.address}</p>
        </div>
        <div className="bg-white/95 rounded-xl px-3 py-2 text-center shrink-0">
          <div className="text-2xl font-bold text-gray-900">{school.rating}</div>
          <div className="text-yellow-400 text-sm">{'★'.repeat(stars)}</div>
          <div className="text-xs text-gray-400">{school.reviewCount} отз.</div>
        </div>
      </SchoolPageGallery>

      <div className="mt-6 grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Main content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Header card */}
          <div className={`bg-white rounded-xl border-2 ${getTypeBorderColor(school.type)} p-6`}>
            <div className="flex items-center gap-2 flex-wrap mb-3">
              {school.license && (
                <span className="text-xs text-gray-400 bg-gray-100 px-2 py-1 rounded-full">
                  Лицензия № {school.license}
                </span>
              )}
              {school.founded && (
                <span className="text-xs text-gray-400 bg-gray-100 px-2 py-1 rounded-full">
                  Основана в {school.founded}
                </span>
              )}
            </div>

            <p className="text-gray-700 leading-relaxed mb-4">{school.fullDescription}</p>

            {/* Key facts */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div className="bg-gray-50 rounded-lg p-3 text-center">
                <div className="text-xs text-gray-500 mb-1">Классы</div>
                <div className="font-semibold text-gray-900 text-sm">{school.grades}</div>
              </div>
              {school.founded && (
                <div className="bg-gray-50 rounded-lg p-3 text-center">
                  <div className="text-xs text-gray-500 mb-1">Основана</div>
                  <div className="font-semibold text-gray-900 text-sm">{school.founded}</div>
                </div>
              )}
              {school.studentsCount && (
                <div className="bg-gray-50 rounded-lg p-3 text-center">
                  <div className="text-xs text-gray-500 mb-1">Учеников</div>
                  <div className="font-semibold text-gray-900 text-sm">
                    {school.studentsCount.toLocaleString('ru-RU')}
                  </div>
                </div>
              )}
              <div className="bg-gray-50 rounded-lg p-3 text-center">
                <div className="text-xs text-gray-500 mb-1">Стоимость</div>
                <div className="font-semibold text-sm">
                  {school.priceFrom !== undefined ? (
                    school.priceFrom === 0 ? (
                      <span className="text-green-600">Бесплатно</span>
                    ) : (
                      <span className="text-gray-900">от {formatPrice(school.priceFrom)}</span>
                    )
                  ) : (
                    <span className="text-green-600">Бесплатно</span>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Features */}
          <div className="bg-white rounded-xl border border-gray-200 p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Особенности и преимущества</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {school.features.map(feature => (
                <div key={feature} className="flex items-center gap-2 text-sm text-gray-700">
                  <span className="w-5 h-5 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center shrink-0">
                    <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M4.5 12.75l6 6 9-13.5" /></svg>
                  </span>
                  {feature}
                </div>
              ))}
            </div>
          </div>

          {/* Contacts */}
          <div className="bg-white rounded-xl border border-gray-200 p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Контакты и адрес</h2>

            {/* Yandex Map */}
            <div className="mb-5 rounded-xl overflow-hidden border border-gray-100" style={{ height: 280 }}>
              <iframe
                title={`Карта — ${school.name}`}
                src={`https://yandex.ru/map-widget/v1/?text=${encodeURIComponent(`${school.city}, ${school.address}`)}&z=16&lang=ru_RU`}
                width="100%"
                height="280"
                allowFullScreen
                loading="lazy"
                className="block"
                style={{ border: 0 }}
              />
            </div>

            <div className="space-y-3">
              <div className="flex items-start gap-3">
                <span className="text-gray-400 mt-0.5 shrink-0">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 10.5a3 3 0 11-6 0 3 3 0 016 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1115 0z" /></svg>
                </span>
                <div>
                  <p className="text-xs text-gray-500 mb-0.5">Адрес</p>
                  <p className="text-sm text-gray-800">{school.city}, {school.address}</p>
                  {school.metro && (
                    <p className="text-xs text-gray-500 mt-0.5 flex items-center gap-1">
                      <span className="w-3.5 h-3.5 bg-red-500 rounded-full text-white text-[8px] flex items-center justify-center font-bold">М</span>
                      ст. метро {school.metro}
                    </p>
                  )}
                </div>
              </div>
              <div className="flex items-start gap-3">
                <span className="text-gray-400 mt-0.5 shrink-0">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M2.25 6.75c0 8.284 6.716 15 15 15h2.25a2.25 2.25 0 002.25-2.25v-1.372c0-.516-.351-.966-.852-1.091l-4.423-1.106c-.44-.11-.902.055-1.173.417l-.97 1.293c-.282.376-.769.542-1.21.38a12.035 12.035 0 01-7.143-7.143c-.162-.441.004-.928.38-1.21l1.293-.97c.363-.271.527-.734.417-1.173L6.963 3.102a1.125 1.125 0 00-1.091-.852H4.5A2.25 2.25 0 002.25 4.5v2.25z" /></svg>
                </span>
                <div>
                  <p className="text-xs text-gray-500 mb-0.5">Телефон</p>
                  <a href={`tel:${school.phone}`} className="text-sm text-[#0369A1] hover:underline font-medium cursor-pointer">
                    {school.phone}
                  </a>
                </div>
              </div>
              {school.email && (
                <div className="flex items-start gap-3">
                  <span className="text-gray-400 mt-0.5 shrink-0">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M21.75 6.75v10.5a2.25 2.25 0 01-2.25 2.25h-15a2.25 2.25 0 01-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25m19.5 0v.243a2.25 2.25 0 01-1.07 1.916l-7.5 4.615a2.25 2.25 0 01-2.36 0L3.32 8.91a2.25 2.25 0 01-1.07-1.916V6.75" /></svg>
                  </span>
                  <div>
                    <p className="text-xs text-gray-500 mb-0.5">Email</p>
                    <a href={`mailto:${school.email}`} className="text-sm text-[#0369A1] hover:underline cursor-pointer">
                      {school.email}
                    </a>
                  </div>
                </div>
              )}
              {school.website && (
                <div className="flex items-start gap-3">
                  <span className="text-gray-400 mt-0.5 shrink-0">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 21a9.004 9.004 0 008.716-6.747M12 21a9.004 9.004 0 01-8.716-6.747M12 21c2.485 0 4.5-4.03 4.5-9S14.485 3 12 3m0 18c-2.485 0-4.5-4.03-4.5-9S9.515 3 12 3m0 0a8.997 8.997 0 017.843 4.582M12 3a8.997 8.997 0 00-7.843 4.582m15.686 0A11.953 11.953 0 0112 10.5c-2.998 0-5.74-1.1-7.843-2.918m15.686 0A8.959 8.959 0 0121 12c0 .778-.099 1.533-.284 2.253m0 0A17.919 17.919 0 0112 16.5c-3.162 0-6.133-.815-8.716-2.247m0 0A9.015 9.015 0 013 12c0-1.605.42-3.113 1.157-4.418" /></svg>
                  </span>
                  <div>
                    <p className="text-xs text-gray-500 mb-0.5">Сайт</p>
                    <a
                      href={school.website}
                      target="_blank"
                      rel="noopener noreferrer nofollow"
                      className="text-sm text-[#0369A1] hover:underline cursor-pointer"
                    >
                      {school.website.replace(/^https?:\/\//, '')}
                    </a>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Similar schools */}
          {similar.length > 0 && (
            <div>
              <h2 className="text-xl font-bold text-gray-900 mb-4">
                Похожие {typeLabels[school.type].toLowerCase()} школы
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                {similar.map(s => (
                  <SchoolCard key={s.id} school={s} />
                ))}
              </div>
              <div className="mt-4 text-center">
                <Link
                  href={`/shkoly/${school.region}/${school.type}/`}
                  className="inline-flex items-center gap-2 text-blue-600 text-sm font-medium hover:underline"
                >
                  Все {typeLabels[school.type].toLowerCase()} школы {regionLabels[school.region]} →
                </Link>
              </div>
            </div>
          )}
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          <LeadForm schoolName={school.name} />

          {/* Price block */}
          {school.priceFrom !== undefined && school.priceFrom > 0 && (
            <div className="bg-white rounded-xl border border-gray-200 p-5">
              <h3 className="font-semibold text-gray-900 mb-3">Стоимость обучения</h3>
              <div className="text-2xl font-bold text-gray-900 mb-1">
                от {formatPrice(school.priceFrom)}
              </div>
              {school.priceTo && (
                <p className="text-sm text-gray-500">до {formatPrice(school.priceTo)}</p>
              )}
              <p className="text-xs text-gray-400 mt-2">Уточняйте актуальную стоимость по телефону</p>
            </div>
          )}

          {/* Quick info */}
          <div className="bg-white rounded-xl border border-gray-200 p-5">
            <h3 className="font-semibold text-gray-900 mb-3">Основное</h3>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-500">Тип</span>
                <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${getTypeColor(school.type)}`}>
                  {typeLabels[school.type]}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Город</span>
                <span className="text-gray-800">{school.city}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Классы</span>
                <span className="text-gray-800">{school.grades}</span>
              </div>
              {school.district && (
                <div className="flex justify-between">
                  <span className="text-gray-500">Район</span>
                  <span className="text-gray-800">{school.district}</span>
                </div>
              )}
              {school.founded && (
                <div className="flex justify-between">
                  <span className="text-gray-500">Основана</span>
                  <span className="text-gray-800">{school.founded}</span>
                </div>
              )}
            </div>
          </div>

          {/* Navigation */}
          <div className="bg-white rounded-xl border border-gray-200 p-5">
            <h3 className="font-semibold text-gray-900 mb-3">В каталоге</h3>
            <div className="space-y-2">
              <Link
                href={`/shkoly/${school.region}/${school.type}/`}
                className="block text-sm text-blue-600 hover:underline"
              >
                ← {typeLabels[school.type]} школы {regionLabels[school.region]}
              </Link>
              <Link
                href={`/shkoly/${school.region}/`}
                className="block text-sm text-blue-600 hover:underline"
              >
                ← Все школы {regionLabels[school.region]}
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
