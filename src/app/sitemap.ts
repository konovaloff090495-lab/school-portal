import type { MetadataRoute } from 'next'
import {
  schools, regionSlugs, typeSlugs, moscowDistrictSlugs, moCitySlugs,
  featureSlugs, languageSlugs, metroSlugs,
} from '@/data/schools'
import { gdzKlasses, gdzBooks, getGdzSubjects } from '@/data/gdz'
import { textbookSubjects, textbookTopics } from '@/data/textbook'
import { blogPosts } from '@/data/blog'
import { egeSubjects, ogeSubjects } from '@/data/ege-oge'

// Статические лендинги-страницы (отдельные page.tsx, не в динамических роутах)
const STATIC_LANDINGS = [
  '/shkoly/tipy/nachalnaya-shkola', '/shkoly/tipy/osnovnaya-shkola', '/shkoly/tipy/starshaya-shkola',
  '/shkoly/tipy/domashnie/anglijskij', '/shkoly/tipy/domashnie/chastnie', '/shkoly/tipy/domashnie/luchshie', '/shkoly/tipy/domashnie/online', '/shkoly/tipy/domashnie/srednie-klassy',
  '/shkoly/tipy/eksternal/10-11-klass', '/shkoly/tipy/eksternal/9-klass', '/shkoly/tipy/eksternal/besplatnye', '/shkoly/tipy/eksternal/online',
  '/shkoly/tipy/kadetskie/dlya-devochek', '/shkoly/tipy/kadetskie/kazachya', '/shkoly/tipy/kadetskie/morskaya', '/shkoly/tipy/kadetskie/postuplenie', '/shkoly/tipy/kadetskie/s-prozhivaniem', '/shkoly/tipy/kadetskie/voennaya',
  '/shkoly/tipy/mezhdunarodnie/anglijskie', '/shkoly/tipy/mezhdunarodnie/britanskie', '/shkoly/tipy/mezhdunarodnie/letnie', '/shkoly/tipy/mezhdunarodnie/online', '/shkoly/tipy/mezhdunarodnie/stoimost',
  '/shkoly/tipy/podgotovka-ege/biologiya', '/shkoly/tipy/podgotovka-ege/luchshie', '/shkoly/tipy/podgotovka-ege/matematika', '/shkoly/tipy/podgotovka-ege/online', '/shkoly/tipy/podgotovka-ege/russkij',
  '/shkoly/tipy/podgotovka-oge/9-klass', '/shkoly/tipy/podgotovka-oge/matematika', '/shkoly/tipy/podgotovka-oge/online', '/shkoly/tipy/podgotovka-oge/russkij',
  '/shkoly/tipy/pri-vuzakh/letnie', '/shkoly/tipy/pri-vuzakh/medicinskie', '/shkoly/tipy/pri-vuzakh/tehnicheskie', '/shkoly/tipy/pri-vuzakh/tvorcheskie',
  '/shkoly/tipy/profilnye/10-11-klass', '/shkoly/tipy/profilnye/letnie', '/shkoly/tipy/profilnye/online',
  '/shkoly/tipy/semejnye/attestatsiya', '/shkoly/tipy/semejnye/nachalnye-klassy', '/shkoly/tipy/semejnye/online', '/shkoly/tipy/semejnye/srednie-klassy',
  '/shkoly/tipy/sportivnye/edinoborstva', '/shkoly/tipy/sportivnye/futbol', '/shkoly/tipy/sportivnye/gimnastika', '/shkoly/tipy/sportivnye/olimpijskij-rezerv', '/shkoly/tipy/sportivnye/plavanie', '/shkoly/tipy/sportivnye/posle-9-klassa',
  '/shkoly/tipy/vechernie/besplatnye', '/shkoly/tipy/vechernie/online', '/shkoly/tipy/vechernie/posle-9-klassa', '/shkoly/tipy/vechernie/s-attestatom', '/shkoly/tipy/vechernie/smennye', '/shkoly/tipy/vechernie/starshie-klassy',
  '/o-nas',
]

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

  const uchebnikClassPages: MetadataRoute.Sitemap = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11].map(k => ({
    url: `${BASE_URL}/uchebnik/klass/${k}-klass/`,
    lastModified: now,
    changeFrequency: 'weekly' as const,
    priority: 0.85,
  }))

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

  // ── ЕГЭ / ОГЭ ──────────────────────────────────────
  const egeIndex: MetadataRoute.Sitemap = [
    { url: `${BASE_URL}/ege/`, lastModified: now, changeFrequency: 'weekly', priority: 0.85 },
    { url: `${BASE_URL}/oge/`, lastModified: now, changeFrequency: 'weekly', priority: 0.85 },
  ]
  const egeSubjectPages: MetadataRoute.Sitemap = [
    ...egeSubjects.map(s => ({ url: `${BASE_URL}/ege/${s.slug}/`, lastModified: now, changeFrequency: 'weekly' as const, priority: 0.8 })),
    ...ogeSubjects.map(s => ({ url: `${BASE_URL}/oge/${s.slug}/`, lastModified: now, changeFrequency: 'weekly' as const, priority: 0.8 })),
  ]
  const egeTaskPages: MetadataRoute.Sitemap = [
    ...egeSubjects.flatMap(s => s.tasks.map(t => ({ url: `${BASE_URL}/ege/${s.slug}/${t.slug}/`, lastModified: now, changeFrequency: 'monthly' as const, priority: 0.7 }))),
    ...ogeSubjects.flatMap(s => s.tasks.map(t => ({ url: `${BASE_URL}/oge/${s.slug}/${t.slug}/`, lastModified: now, changeFrequency: 'monthly' as const, priority: 0.7 }))),
  ]

  // ── Лендинги школ: типы, особенности, профили, языки, метро ──
  const shkolyTypePages: MetadataRoute.Sitemap = typeSlugs.map(t => ({
    url: `${BASE_URL}/shkoly/tipy/${t}/`, lastModified: now, changeFrequency: 'weekly' as const, priority: 0.75,
  }))
  const shkolyFeaturePages: MetadataRoute.Sitemap = featureSlugs.map(f => ({
    url: `${BASE_URL}/shkoly/osobennosti/${f}/`, lastModified: now, changeFrequency: 'weekly' as const, priority: 0.7,
  }))
  const shkolyLangPages: MetadataRoute.Sitemap = languageSlugs.map(l => ({
    url: `${BASE_URL}/shkoly/tipy/yazykovye/${l}/`, lastModified: now, changeFrequency: 'weekly' as const, priority: 0.7,
  }))
  const shkolyMetroPages: MetadataRoute.Sitemap = metroSlugs.map(st => ({
    url: `${BASE_URL}/shkoly/moskva/metro/${st}/`, lastModified: now, changeFrequency: 'weekly' as const, priority: 0.7,
  }))
  // Региональные лендинги: регион × особенность / подготовка
  const regionFeaturePages: MetadataRoute.Sitemap = regionSlugs.flatMap(r =>
    featureSlugs.map(f => ({ url: `${BASE_URL}/shkoly/${r}/osobennosti/${f}/`, lastModified: now, changeFrequency: 'monthly' as const, priority: 0.65 }))
  )
  const regionPodgotovkaPages: MetadataRoute.Sitemap = regionSlugs.flatMap(r => [
    { url: `${BASE_URL}/shkoly/${r}/podgotovka-k-ege/`, lastModified: now, changeFrequency: 'weekly' as const, priority: 0.7 },
    { url: `${BASE_URL}/shkoly/${r}/podgotovka-k-oge/`, lastModified: now, changeFrequency: 'weekly' as const, priority: 0.7 },
    { url: `${BASE_URL}/shkoly/${r}/programmirovanie/`, lastModified: now, changeFrequency: 'weekly' as const, priority: 0.65 },
  ])
  const staticLandingPages: MetadataRoute.Sitemap = STATIC_LANDINGS.map(path => ({
    url: `${BASE_URL}${path}/`, lastModified: now, changeFrequency: 'monthly' as const, priority: 0.6,
  }))

  // ── Блог ───────────────────────────────────────────
  const blogIndex: MetadataRoute.Sitemap = [
    { url: `${BASE_URL}/blog/`, lastModified: now, changeFrequency: 'weekly', priority: 0.8 },
  ]
  const blogPostPages: MetadataRoute.Sitemap = blogPosts.map(p => {
    // Защита от кривых дат: невалидный publishedAt не должен ломать сборку sitemap
    const d = p.publishedAt ? new Date(p.publishedAt) : now
    return {
      url: `${BASE_URL}/blog/${p.slug}/`,
      lastModified: isNaN(d.getTime()) ? now : d,
      changeFrequency: 'monthly' as const,
      priority: 0.7,
    }
  })

  return [
    ...staticPages, ...regionPages, ...typePages, ...districtPages, ...moCityPages, ...schoolPages,
    ...blogIndex, ...blogPostPages,
    ...gdzIndex, ...gdzKlassPages, ...gdzSubjectPages, ...gdzBookPages, ...gdzProblemPages,
    ...uchebnikIndex, ...uchebnikClassPages, ...uchebnikSubjectPages, ...uchebnikKlassPages, ...uchebnikTopicPages,
    ...egeIndex, ...egeSubjectPages, ...egeTaskPages,
    ...shkolyTypePages, ...shkolyFeaturePages, ...shkolyLangPages, ...shkolyMetroPages,
    ...regionFeaturePages, ...regionPodgotovkaPages, ...staticLandingPages,
  ]
}
