import type { MetadataRoute } from 'next'
import { schools, regionSlugs, typeSlugs, moscowDistrictSlugs, moCitySlugs } from '@/data/schools'

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

  return [...staticPages, ...regionPages, ...typePages, ...districtPages, ...moCityPages, ...schoolPages]
}
