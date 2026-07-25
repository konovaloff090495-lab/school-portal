'use client'
import { useEffect, useRef } from 'react'

declare global {
  interface Window {
    yaContextCb?: Array<() => void>
    Ya?: {
      Context: {
        AdvManager: {
          render: (opts: { blockId: string; renderTo: string }) => void
        }
      }
    }
  }
}

interface Props {
  blockId: string
  /** Уникальный суффикс для div ID, если блок используется несколько раз на странице */
  suffix?: string
}

/** За сколько пикселей до вьюпорта начинаем грузить блок */
const PRELOAD_MARGIN = '300px 0px'

/**
 * Рекламный блок РСЯ с отложенным рендером.
 *
 * blockId — идентификатор блока из кабинета РСЯ, напр. "R-A-19425636-1"
 * suffix  — уникальный суффикс если блок стоит несколько раз на одной странице
 *
 * Рендер вызывается не при монтировании, а когда блок подходит к вьюпорту
 * (IntersectionObserver, запас 300px). Платят за ВИДИМЫЕ показы: блоки в теле
 * статьи, отрендеренные сразу, засчитывались как показ, но до зоны видимости
 * не доживали — на мобильных viewability был 36% против 82% на десктопе.
 */
export default function YandexRTBBanner({ blockId, suffix }: Props) {
  const divId = suffix
    ? `yandex_rtb_${blockId}_${suffix}`
    : `yandex_rtb_${blockId}`
  const ref = useRef<HTMLDivElement>(null)
  const rendered = useRef(false)

  useEffect(() => {
    const el = ref.current
    if (!el) return

    const render = () => {
      if (rendered.current) return
      rendered.current = true
      window.yaContextCb = window.yaContextCb || []
      window.yaContextCb.push(() => {
        window.Ya?.Context.AdvManager.render({ blockId, renderTo: divId })
      })
    }

    // Старые браузеры без IntersectionObserver — рендерим сразу, как раньше
    if (typeof IntersectionObserver === 'undefined') {
      render()
      return
    }

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries.some((e) => e.isIntersecting)) {
          render()
          observer.disconnect()
        }
      },
      { rootMargin: PRELOAD_MARGIN },
    )
    observer.observe(el)

    return () => observer.disconnect()
  }, [blockId, divId])

  return <div id={divId} ref={ref} />
}
