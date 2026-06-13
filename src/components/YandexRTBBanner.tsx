'use client'
import { useEffect } from 'react'

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

/**
 * Рекламный блок РСЯ.
 * blockId — идентификатор блока из кабинета РСЯ, напр. "R-A-19425636-1"
 * suffix  — уникальный суффикс если блок стоит несколько раз на одной странице
 */
export default function YandexRTBBanner({ blockId, suffix }: Props) {
  const divId = suffix
    ? `yandex_rtb_${blockId}_${suffix}`
    : `yandex_rtb_${blockId}`

  useEffect(() => {
    window.yaContextCb = window.yaContextCb || []
    window.yaContextCb.push(() => {
      window.Ya?.Context.AdvManager.render({ blockId, renderTo: divId })
    })
  }, [blockId, divId])

  return <div id={divId} />
}
