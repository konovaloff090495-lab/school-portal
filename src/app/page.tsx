import type { Metadata } from 'next';
import HomeRuntime from '@/components/HomeRuntime';
import content from '@/homepage/content.json';
import '../../public/homepage/home.css';
export const metadata: Metadata = {
 title: 'Школы России, курсы для детей и бесплатные уроки — ProSchools',
 description: 'Выберите школу и курсы для ребёнка. Бесплатные онлайн-уроки, учебник, ГДЗ, подготовка к ЕГЭ и ОГЭ и статьи для родителей — на ProSchools.',
 alternates: { canonical: 'https://pro-schools.ru/' },
 openGraph: { title: 'Всё для учёбы и развития ребёнка — ProSchools', description: 'Школы, курсы и бесплатные материалы для учёбы — в одном месте.', url: 'https://pro-schools.ru/', images: [{ url: '/homepage/assets/school-hero-v2.webp', width: 1536, height: 1024 }] },
};
const websiteSchema = {
  '@context': 'https://schema.org',
  '@type': 'WebSite',
  '@id': 'https://pro-schools.ru/#website',
  name: 'ProSchools',
  url: 'https://pro-schools.ru',
  description: 'Школы, курсы и бесплатные материалы для учёбы и развития ребёнка',
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
  name: 'ProSchools',
  url: 'https://pro-schools.ru',
  logo: 'https://pro-schools.ru/logo.png',
  contactPoint: { '@type': 'ContactPoint', email: 'info@pro-schools.ru', contactType: 'customer support' },
}

export default function HomePage() {
 return <>
  <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(websiteSchema) }} />
  <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(orgSchema) }} />
  <div dangerouslySetInnerHTML={{ __html: content.html }} />
  <HomeRuntime />
 </>;
}
