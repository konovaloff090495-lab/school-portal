import type { MetadataRoute } from 'next'

// Keep Next.js CSS, scripts and image URLs crawlable for page rendering.
// Search, API and private/utility routes remain excluded.
const BASE_URL = 'https://pro-schools.ru'

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: '*',
        allow: ['/', '/api/school-submissions/images/'],
        disallow: ['/api/', '/poisk/', '/preload/', '*/preload/', '/spasibo/', '/podarki/', '/lk/', '/admin/', '/dobavit-shkolu/zayavka/'],
      },
      {
        userAgent: 'Yandex',
        allow: ['/', '/api/school-submissions/images/'],
        disallow: ['/api/', '/poisk/', '/preload/', '*/preload/', '/spasibo/', '/podarki/', '/lk/', '/admin/', '/dobavit-shkolu/zayavka/'],
      },
    ],
    sitemap: [`${BASE_URL}/sitemap.xml`, `${BASE_URL}/sitemap-gdz.xml`, `${BASE_URL}/kursy/sitemap.xml`, `${BASE_URL}/sitemap-school-submissions.xml`],
    host: BASE_URL,
  }
}
