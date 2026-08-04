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
 *
 * blockId — идентификатор блока из кабинета РСЯ, напр. "R-A-19425636-1"
 * suffix  — уникальный суффикс если блок стоит несколько раз на одной странице
 *
 * Рендер — сразу при монтировании (revert 919fc25).
 *
 * 25.07 блоки перевели на отложенный рендер через IntersectionObserver ради
 * viewability. Замер за 10 дней после (`python3 rsya.py --period 30days --days`):
 *   — CPM 25.07: 147₽ → 26.07: 51₽ → далее 23–61₽. Падение втрое, без отскока.
 *   — CTR 1.5–4% → 0.3–1%.
 *   — viewability при этом НЕ выросла: десктоп 82%→74%, мобильные 36%→41%,
 *     видимые/показы держались на 57–64% против 50–61% до правки.
 *   — запросов на монетизируемый просмотр осталось ~0.95 при вёрстке на 2 инлайна
 *     + сайдбар: блоки ниже сгиба просто не успевали запроситься.
 * Заявленная выгода не подтвердилась, цена — CPM втрое. Возвращаем как было.
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
