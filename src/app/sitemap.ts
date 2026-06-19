import type { MetadataRoute } from 'next'
import { schools, regionSlugs, typeSlugs, moscowDistrictSlugs, moCitySlugs } from '@/data/schools'
import { gdzKlasses, gdzBooks, getGdzSubjects } from '@/data/gdz'
import { textbookSubjects, textbookTopics } from '@/data/textbook'

const BASE_URL = 'https://pro-schools.ru'

export default function sitemap(): MetadataRoute.Sitemap {
  const now = new Date()

  const staticPages: MetadataRoute.Sitemap = [
    {
      url: BASE_URL,
      lastModified: now,
      changeFrequency: 'weekly',
      priority: 1.0,
    },
    {
      url: `${BASE_URL}/shkoly/`,
      lastModified: now,
      changeFrequency: 'weekly',
      priority: 0.9,
    },
  ]

  const regionPages: MetadataRoute.Sitemap = regionSlugs.map(region => ({
    url: `${BASE_URL}/shkoly/${region}/`,
    lastModified: now,
    changeFrequency: 'weekly',
    priority: 0.85,
  }))

  const typePages: MetadataRoute.Sitemap = regionSlugs.flatMap(region =>
    typeSlugs.map(type => ({
      url: `${BASE_URL}/shkoly/${region}/${type}/`,
      lastModified: now,
      changeFrequency: 'weekly',
      priority: 0.8,
    }))
  )

  const schoolPages: MetadataRoute.Sitemap = schools.map(school => ({
    url: `${BASE_URL}/shkola/${school.slug}/`,
    lastModified: now,
    changeFrequency: 'monthly',
    priority: 0.7,
  }))

  const districtPages: MetadataRoute.Sitemap = moscowDistrictSlugs.map(d => ({
    url: `${BASE_URL}/shkoly/moskva/rayon/${d}/`,
    lastModified: now,
    changeFrequency: 'weekly' as const,
    priority: 0.8,
  }))

  const moCityPages: MetadataRoute.Sitemap = moCitySlugs.map(c => ({
    url: `${BASE_URL}/shkoly/moskovskaya-oblast/gorod/${c}/`,
    lastModified: now,
    changeFrequency: 'weekly' as const,
    priority: 0.8,
  }))

  // ── GDZ pages ──────────────────────────────────────
  const gdzIndex: MetadataRoute.Sitemap = [
    { url: `${BASE_URL}/gdz/`, lastModified: now, changeFrequency: 'weekly', priority: 0.9 },
  ]

  const gdzKlassPages: MetadataRoute.Sitemap = gdzKlasses.map(n => ({
    url: `${BASE_URL}/gdz/${n}-klass/`,
    lastModified: now,
    changeFrequency: 'weekly',
    priority: 0.85,
  }))

  const gdzSubjectPages: MetadataRoute.Sitemap = gdzKlasses.flatMap(n =>
    getGdzSubjects(n).map(s => ({
      url: `${BASE_URL}/gdz/${n}-klass/${s.slug}/`,
      lastModified: now,
      changeFrequency: 'weekly',
      priority: 0.8,
    }))
  )

  const gdzBookPages: MetadataRoute.Sitemap = gdzBooks
    .filter(b => b.chapters.length > 0)
    .map(b => ({
      url: `${BASE_URL}/gdz/${b.klass}-klass/${b.subjectSlug}/${b.slug}/`,
      lastModified: now,
      changeFrequency: 'monthly',
      priority: 0.75,
    }))

  const gdzProblemPages: MetadataRoute.Sitemap = gdzBooks.flatMap(b =>
    b.chapters.flatMap(ch =>
      ch.problems
        .filter(p => p.condition && p.steps?.length)
        .map(p => ({
          url: `${BASE_URL}/gdz/${b.klass}-klass/${b.subjectSlug}/${b.slug}/nomer-${p.number.replace(/\./g, "-")}/`,
          lastModified: now,
          changeFrequency: 'monthly' as const,
          priority: 0.7,
        }))
    )
  )

  // ── Учебник (textbook) pages ───────────────────────
  const uchebnikIndex: MetadataRoute.Sitemap = [
    { url: `${BASE_URL}/uchebnik/`, lastModified: now, changeFrequency: 'weekly', priority: 0.9 },
  ]

  const uchebnikSubjectPages: MetadataRoute.Sitemap = textbookSubjects.map(s => ({
    url: `${BASE_URL}/uchebnik/${s.slug}/`,
    lastModified: now,
    changeFrequency: 'weekly' as const,
    priority: 0.85,
  }))

  const uchebnikKlassPages: MetadataRoute.Sitemap = textbookSubjects.flatMap(s =>
    s.classes.map(k => ({
      url: `${BASE_URL}/uchebnik/${s.slug}/${k}-klass/`,
      lastModified: now,
      changeFrequency: 'weekly' as const,
      priority: 0.8,
    }))
  )

  const uchebnikTopicPages: MetadataRoute.Sitemap = textbookTopics.map(t => ({
    url: `${BASE_URL}/uchebnik/${t.subject}/${t.klass}-klass/${t.slug}/`,
    lastModified: now,
    changeFrequency: 'monthly' as const,
    priority: 0.7,
  }))

  return [
    ...staticPages, ...regionPages, ...typePages, ...districtPages, ...moCityPages, ...schoolPages,
    ...gdzIndex, ...gdzKlassPages, ...gdzSubjectPages, ...gdzBookPages, ...gdzProblemPages,
    ...uchebnikIndex, ...uchebnikSubjectPages, ...uchebnikKlassPages, ...uchebnikTopicPages,
  ]
}
