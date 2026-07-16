import type { MetadataRoute } from 'next'

// v3: блокируем /preload/ */preload/ /spasibo/ /lk/ /admin/
const BASE_URL = 'https://pro-schools.ru'

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: '*',
        allow: '/',
        disallow: ['/api/', '/_next/', '/poisk/', '/preload/', '*/preload/', '/spasibo/', '/lk/', '/admin/'],
      },
      {
        userAgent: 'Yandex',
        allow: '/',
        disallow: ['/api/', '/_next/', '/poisk/', '/preload/', '*/preload/', '/spasibo/', '/lk/', '/admin/'],
      },
    ],
    sitemap: `${BASE_URL}/sitemap.xml`,
    host: BASE_URL,
  }
}
