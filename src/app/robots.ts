import type { MetadataRoute } from 'next'

// Keep Next.js CSS, scripts and image URLs crawlable for page rendering.
// Search, API and private/utility routes remain excluded.
const BASE_URL = 'https://pro-schools.ru'

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: '*',
        allow: '/',
        disallow: ['/api/', '/poisk/', '/preload/', '*/preload/', '/spasibo/', '/podarki/', '/lk/', '/admin/'],
      },
      {
        userAgent: 'Yandex',
        allow: '/',
        disallow: ['/api/', '/poisk/', '/preload/', '*/preload/', '/spasibo/', '/podarki/', '/lk/', '/admin/'],
      },
    ],
    sitemap: [`${BASE_URL}/sitemap.xml`, `${BASE_URL}/sitemap-gdz.xml`],
    host: BASE_URL,
  }
}
