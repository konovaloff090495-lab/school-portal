import type { NextConfig } from "next";
import { readFileSync } from "fs";
import path from "path";

// Карточки школ, удалённые из каталога как недостоверные (scripts/delete-*.mjs
// пишет сюда «слаг → куда вести»). 301 на каталог города, чтобы не плодить 404
// и не терять переходы из поиска.
const removedSchools: Record<string, string> = (() => {
  try {
    return JSON.parse(readFileSync(path.join(process.cwd(), "scripts", "removed-schools.json"), "utf8"));
  } catch {
    return {};
  }
})();

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
      "connect-src 'self' formspree.io vitals.vercel-insights.com mc.yandex.ru yandex.ru *.yandex.ru *.yandex.net ip-api.com",
      // Фреймы рекламы РСЯ (баннеры РСЯ рендерятся в iframe) + карта OpenStreetMap
      "frame-src yandex.ru *.yandex.ru yastatic.net www.openstreetmap.org openstreetmap.org",
      "object-src 'none'",
      "base-uri 'self'",
      "form-action 'self' formspree.io",
    ].join('; '),
  },
];

const nextConfig: NextConfig = {
  trailingSlash: true,

  // Явно фиксируем корень воркспейса на этой папке. Иначе Next по ошибке
  // считает корнем родительский ~/claude/ (там лежит лишний package-lock.json)
  // и Turbopack начинает обходить десятки соседних проектов — сборка зависает.
  turbopack: { root: process.cwd() },

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

  async redirects() {
    return [
      ...Object.entries(removedSchools).map(([slug, destination]) => ({
        source: `/shkola/${slug}`,
        destination,
        permanent: true,
      })),
      // ── Склейка малоценных гео-комбинаций (SEO-аудит 25.08.2026) ────────────
      // 312 страниц «подготовка к ЕГЭ/ОГЭ онлайн × город» за месяц дали 0 кликов
      // при 112 показах и средней позиции 17 — они конкурировали с родительской
      // страницей подготовки и с /shkoly/<город>/online/. Склеиваем в родителя.
      { source: '/shkoly/:region/podgotovka-k-ege/online', destination: '/shkoly/:region/podgotovka-k-ege/', permanent: true },
      { source: '/shkoly/:region/podgotovka-k-oge/online', destination: '/shkoly/:region/podgotovka-k-oge/', permanent: true },
      // Онлайн-школа не имеет районной географии: метро/округ/город МО × online
      // (120 страниц) дали 0 кликов. Экстернат в микро-гео Москвы — тоже 0 кликов
      // на 97 страницах. Всё склеиваем на городской уровень.
      { source: '/shkoly/moskva/metro/:station/online', destination: '/shkoly/moskva/online/', permanent: true },
      { source: '/shkoly/moskva/metro/:station/eksternal', destination: '/shkoly/moskva/eksternal/', permanent: true },
      { source: '/shkoly/moskva/rayon/:district/online', destination: '/shkoly/moskva/online/', permanent: true },
      { source: '/shkoly/moskva/rayon/:district/eksternal', destination: '/shkoly/moskva/eksternal/', permanent: true },
      { source: '/shkoly/moskovskaya-oblast/gorod/:city/online', destination: '/shkoly/moskovskaya-oblast/online/', permanent: true },
      // Удалённая недостоверная запись «Вечерняя школа № 156» (жалоба на чужой телефон,
      // несуществующая школа). Ведём на каталог вечерних школ Москвы. 2026-08-07.
      {
        source: '/shkola/vechernyaya-shkola-156-moskva',
        destination: '/shkoly/moskva/vechernie/',
        permanent: true,
      },
      {
        source: '/shkola/vechernyaya-shkola-156-moskva/',
        destination: '/shkoly/moskva/vechernie/',
        permanent: true,
      },
    ];
  },
};

export default nextConfig;
