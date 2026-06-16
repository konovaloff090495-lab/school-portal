import type { NextConfig } from "next";

const securityHeaders = [
  // Запрещаем отображение сайта в iframe с чужих доменов
  { key: 'X-Frame-Options', value: 'SAMEORIGIN' },
  // Запрещаем браузеру угадывать MIME-тип
  { key: 'X-Content-Type-Options', value: 'nosniff' },
  // Управляем реферером
  { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
  // Ограничиваем доступ к браузерным API
  { key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=()' },
  // HSTS — только HTTPS
  { key: 'Strict-Transport-Security', value: 'max-age=63072000; includeSubDomains; preload' },
  // XSS-фильтр для старых браузеров
  { key: 'X-XSS-Protection', value: '1; mode=block' },
  // Content Security Policy
  {
    key: 'Content-Security-Policy',
    value: [
      "default-src 'self'",
      // Next.js inline scripts + загрузчик и скрипты рекламы РСЯ (Яндекс)
      "script-src 'self' 'unsafe-inline' 'unsafe-eval' mc.yandex.ru yandex.ru *.yandex.ru yastatic.net",
      // Inline стили — для CSS-in-JS и контента блога
      "style-src 'self' 'unsafe-inline' fonts.googleapis.com",
      // Картинки: свои + data-URI + креативы и аватары рекламы РСЯ
      "img-src 'self' data: blob: mc.yandex.ru yandex.ru *.yandex.ru *.yandex.net yastatic.net",
      // Шрифты Google
      "font-src 'self' fonts.gstatic.com",
      // API-запросы + запросы рекламы РСЯ
      "connect-src 'self' formspree.io vitals.vercel-insights.com mc.yandex.ru yandex.ru *.yandex.ru *.yandex.net",
      // Фреймы рекламы РСЯ (баннеры РСЯ рендерятся в iframe)
      "frame-src yandex.ru *.yandex.ru yastatic.net",
      "object-src 'none'",
      "base-uri 'self'",
      "form-action 'self' formspree.io",
    ].join('; '),
  },
];

const nextConfig: NextConfig = {
  trailingSlash: true,

  // Папка сборки из env — для blue-green деплоя (build в .next-build → атомарный swap)
  distDir: process.env.NEXT_DIST_DIR || '.next',

  // Не гоняем type-check при сборке (огромные data-файлы 14MB) —
  // типы проверяются локально через `npx tsc --noEmit` перед пушем.
  // Это резко ускоряет `next build`. (ESLint в Next 16 в build не запускается.)
  typescript: { ignoreBuildErrors: true },

  async headers() {
    return [
      {
        source: '/(.*)',
        headers: securityHeaders,
      },
    ];
  },
};

export default nextConfig;
