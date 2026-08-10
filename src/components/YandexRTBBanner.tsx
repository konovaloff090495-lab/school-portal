'use client'
import { useEffect } from 'react'

declare global {
  interface Window {
    yaContextCb?: Array<() => void>
    Ya?: {
      Context: {
        AdvManager: {
          render: (opts: {
            blockId: string
            renderTo: string
            pageNumber?: number
          }) => void
        }
      }
    }
  }
}

interface Props {
  blockId: string
  /** Уникальный суффикс для div ID, если блок используется несколько раз на странице */
  suffix?: string
  /**
   * Порядковый номер рекламного места на странице, начиная с 1.
   * Обязателен, если на одной странице стоит больше одного блока: без него
   * РСЯ отрисовывает только первый вызов render() и остальные места молчат.
   */
  pageNumber?: number
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
 *
 * 10.08 — почему появился pageNumber. Замер за неделю: запросов в РСЯ 4488 при
 * 4742 просмотрах монетизируемых страниц, то есть ровно ОДИН запрос на просмотр,
 * хотя в статье размечено 2 инлайна + сайдбар. `rsya.py --by block_caption`
 * показывает единственный блок «Баннер (13.06.2026)» — все три идентификатора
 * из ads.ts ведут в один и тот же блок кабинета. Один блок РСЯ отрисовывается на
 * странице один раз: второй и третий render() уходят в никуда. Это же объясняет,
 * почему уплотнение до 5 инлайнов (ebae112) не дало ни одного лишнего запроса.
 * pageNumber — штатный способ РСЯ повторить блок на странице (он же для
 * бесконечной ленты). Нумеруем места сквозной единицей по всей странице.
 */
export default function YandexRTBBanner({ blockId, suffix, pageNumber }: Props) {
  const divId = suffix
    ? `yandex_rtb_${blockId}_${suffix}`
    : `yandex_rtb_${blockId}`

  useEffect(() => {
    window.yaContextCb = window.yaContextCb || []
    window.yaContextCb.push(() => {
      window.Ya?.Context.AdvManager.render({
        blockId,
        renderTo: divId,
        ...(pageNumber && pageNumber > 1 ? { pageNumber } : {}),
      })
    })
  }, [blockId, divId, pageNumber])

  return <div id={divId} />
}
