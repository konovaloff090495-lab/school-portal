import Script from 'next/script'

/**
 * Глобальный загрузчик РСЯ — вставляется один раз в root layout.
 * Инициализирует window.yaContextCb и загружает context.js.
 */
export default function YandexRTB() {
  return (
    <>
      <Script id="ya-rtb-cb" strategy="beforeInteractive">
        {`window.yaContextCb=window.yaContextCb||[]`}
      </Script>
      <Script
        src="https://yandex.ru/ads/system/context.js"
        strategy="afterInteractive"
      />
    </>
  )
}
