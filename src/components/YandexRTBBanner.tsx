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
}

/**
 * Рекламный блок РСЯ.
 * Использует один раз добавленный загрузчик из YandexRTB.
 * blockId — идентификатор блока из кабинета РСЯ, напр. "R-A-19425636-1"
 */
export default function YandexRTBBanner({ blockId }: Props) {
  const divId = `yandex_rtb_${blockId}`

  useEffect(() => {
    window.yaContextCb = window.yaContextCb || []
    window.yaContextCb.push(() => {
      window.Ya?.Context.AdvManager.render({ blockId, renderTo: divId })
    })
  }, [blockId, divId])

  return <div id={divId} />
}
