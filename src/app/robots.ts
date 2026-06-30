import type { MetadataRoute } from 'next'

const BASE_URL = 'https://pro-schools.ru'

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: '*',
        allow: '/',
        disallow: ['/api/', '/_next/', '/poisk/', '/preload/', '*/preload/', '/spasibo/', '/lk/'],
      },
      {
        userAgent: 'Yandex',
        allow: '/',
        disallow: ['/api/', '/_next/', '/poisk/', '/preload/', '*/preload/', '/spasibo/', '/lk/'],
      },
    ],
    sitemap: `${BASE_URL}/sitemap.xml`,
    host: BASE_URL,
  }
}
