import type { School } from '@/data/schools'
import type { BlogPost } from '@/data/blog'

// ── helpers ────────────────────────────────────────────────────────────────

function ScriptTag({ data }: { data: object }) {
  return (
    <script
      type="application/ld+json"
      suppressHydrationWarning
      dangerouslySetInnerHTML={{ __html: JSON.stringify(data) }}
    />
  )
}

// ── BreadcrumbList ─────────────────────────────────────────────────────────

export function BreadcrumbJsonLd({
  items,
}: {
  items: { name: string; href?: string }[]
}) {
  const data = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: items.map((item, index) => ({
      '@type': 'ListItem',
      position: index + 1,
      name: item.name,
      ...(item.href ? { item: item.href } : {}),
    })),
  }
  return <ScriptTag data={data} />
}

// ── ItemList of schools ────────────────────────────────────────────────────

export function SchoolListJsonLd({
  schools,
  url,
  name,
}: {
  schools: School[]
  url: string
  name: string
}) {
  const data = {
    '@context': 'https://schema.org',
    '@type': 'ItemList',
    name,
    url,
    numberOfItems: schools.length,
    itemListElement: schools.map((school, index) => ({
      '@type': 'ListItem',
      position: index + 1,
      name: school.name,
      url: `https://pro-schools.ru/shkola/${school.slug}/`,
    })),
  }
  return <ScriptTag data={data} />
}

// ── Article ────────────────────────────────────────────────────────────────

export function ArticleJsonLd({
  post,
  url,
}: {
  post: BlogPost
  url: string
}) {
  const data = {
    '@context': 'https://schema.org',
    '@type': 'Article',
    headline: post.title,
    description: post.excerpt,
    author: {
      '@type': 'Person',
      name: post.author,
      jobTitle: post.authorRole,
    },
    datePublished: post.publishedAt,
    publisher: {
      '@type': 'Organization',
      name: 'pro-schools.ru',
      url: 'https://pro-schools.ru',
    },
    mainEntityOfPage: url,
  }
  return <ScriptTag data={data} />
}

// ── EducationalOrganization ────────────────────────────────────────────────

export function SchoolOrgJsonLd({
  school,
  url,
}: {
  school: School
  url: string
}) {
  const data: Record<string, unknown> = {
    '@context': 'https://schema.org',
    '@type': 'EducationalOrganization',
    name: school.name,
    description: school.description,
    url,
    address: {
      '@type': 'PostalAddress',
      streetAddress: school.address,
      addressLocality: school.city,
      addressCountry: 'RU',
    },
    telephone: school.phone,
    ...(school.email ? { email: school.email } : {}),
    ...(school.website ? { sameAs: school.website } : {}),
    ...(school.founded ? { foundingDate: String(school.founded) } : {}),
    ...(school.rating
      ? {
          aggregateRating: {
            '@type': 'AggregateRating',
            ratingValue: school.rating,
            reviewCount: school.reviewCount,
            bestRating: 5,
            worstRating: 1,
          },
        }
      : {}),
  }
  return <ScriptTag data={data} />
}

// ── FAQPage ────────────────────────────────────────────────────────────────

export function FaqJsonLd({
  faqs,
}: {
  faqs: { question: string; answer: string }[]
}) {
  const data = {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: faqs.map(faq => ({
      '@type': 'Question',
      name: faq.question,
      acceptedAnswer: {
        '@type': 'Answer',
        text: faq.answer,
      },
    })),
  }
  return <ScriptTag data={data} />
}

// ── WebSite ────────────────────────────────────────────────────────────────

export function WebSiteJsonLd() {
  const data = {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    '@id': 'https://pro-schools.ru/#website',
    name: 'pro-schools.ru',
    url: 'https://pro-schools.ru',
    description: 'Крупнейший каталог школ России',
    potentialAction: {
      '@type': 'SearchAction',
      target: {
        '@type': 'EntryPoint',
        urlTemplate: 'https://pro-schools.ru/poisk/?q={search_term_string}',
      },
      'query-input': 'required name=search_term_string',
    },
  }
  return <ScriptTag data={data} />
}
