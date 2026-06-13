import Script from 'next/script'

/**
 * Глобальный загрузчик РСЯ — вставляется один раз в root layout.
 *
 * Используем один afterInteractive Script, который:
 * 1. Инициализирует window.yaContextCb (если не было)
 * 2. Вставляет <script src="context.js"> в DOM
 *
 * Такой подход гарантирует правильный порядок инициализации
 * в Next.js App Router, где beforeInteractive не вставляет
 * inline-скрипт в SSR HTML.
 */
export default function YandexRTB() {
  return (
    <Script id="ya-rtb-loader" strategy="afterInteractive">
      {`
        window.yaContextCb = window.yaContextCb || [];
        (function() {
          var s = document.createElement('script');
          s.src = 'https://yandex.ru/ads/system/context.js';
          s.async = true;
          document.head.appendChild(s);
        })();
      `}
    </Script>
  )
}
