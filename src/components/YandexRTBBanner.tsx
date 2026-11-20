'use client'
import { useEffect, useRef } from 'react'
import { usePathname } from 'next/navigation'

declare global {
  interface Window {
    __psBlogAds?: { getActive: () => { arm: string; statId: number; qa: boolean } | null }
    yaContextCb?: Array<() => void>
    Ya?: {
      Context: {
        AdvManager: {
          render: (opts: {
            blockId: string
            renderTo: string
            pageNumber?: number
            statId?: number
          }) => void
        }
      }
    }
  }
}

interface Props {
  blockId: string
  /** Optional desktop counterpart for placements that exchange block IDs. */
  desktopBlockId?: string
  /** Уникальный суффикс для div ID, если блок используется несколько раз на странице */
  suffix?: string
  /**
   * Ограничить место одним типом экрана. Нужно там, где под десктоп и под
   * мобильные стоят РАЗНЫЕ места одного и того же блока РСЯ: без ограничения
   * оба вызовут render(), а блок отрисуется только в первом — и на телефоне
   * реклама уедет в скрытый сайдбар. Граница — 1024px (Tailwind `lg`).
   */
  viewport?: 'mobile' | 'desktop'
  retry?: boolean
  statId?: number
}

let pairedPlacementViewport: { pathname: string; isDesktop: boolean } | undefined

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
 * 31.08 — pageNumber УБРАН. Проверено в браузере на живой странице блога:
 * один вызов блока в свежий контейнер даёт рекламу (330px, заполнен), а ДВА вызова
 * того же blockId на странице оставляют пустыми ОБА контейнера — независимо от
 * pageNumber. Из-за этого оба инлайна в статье молчали с 10.08, и на телефоне
 * (сайдбар там display:none) в блоге не было ни одного показа вообще.
 * Правило: на одной странице каждый blockId вызывается РОВНО ОДИН раз.
 * Разные экраны разводятся prop `viewport`, а не повторным вызовом.
 *
 * 31.08 (вечер) — НАСТОЯЩАЯ причина пустых мест в теле статьи. Замер на живой
 * странице: свежесозданный div рядом с мёртвым местом, тот же блок, та же ширина
 * 341px, та же секунда — реклама приходит (480px). Контейнер компонента — пусто.
 * То есть ни блок, ни ширина, ни высота ни при чём: РСЯ рисует в React-узел,
 * React при реконсиляции сносит вставленное поддерево, а повторно в тот же
 * renderTo РСЯ уже не рисует. Сайдбар выживал потому, что стоит вне разметки
 * статьи, а инлайн-места сидят внутри sections.map рядом с dangerouslySetInnerHTML,
 * где узлы и пересобираются. Лечение: целевой узел создаём императивно в useEffect
 * и React про него не знает.
 *
 * 31.08 — почему появился viewport. В /uchebnik/ единственное рекламное место
 * лежало в сайдбаре `hidden lg:block`, то есть на телефоне и планшете его не было
 * вовсе. За 30 дней это 2 207 просмотров раздела (52% его трафика) без единого
 * запроса в РСЯ, при том что мобильный CPM (152₽) втрое выше десктопного (57₽).
 * Ставим второе место в теле страницы под мобильные, а сайдбар оставляем десктопу.
 * Оба места — один и тот же блок кабинета, поэтому render() должен звать ровно
 * одно из них: иначе первый вызов заберёт блок себе и на телефоне снова пусто.
 * Проверка через matchMedia синхронная, в том же useEffect — отложенного рендера
 * (провал 25.07, CPM втрое вниз) здесь нет.
 */
export default function YandexRTBBanner({ blockId, desktopBlockId, suffix, viewport, retry = true, statId }: Props) {
  const pathname = usePathname()
  const hostRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const experiment = window.__psBlogAds?.getActive()
    if (experiment?.qa) return
    const isDesktop = window.matchMedia('(min-width: 1024px)').matches
    if (viewport === 'desktop' && !isDesktop) return
    if (viewport === 'mobile' && isDesktop) return
    const host = hostRef.current
    if (!host) return

    let activeBlockId = blockId
    if (desktopBlockId) {
      // Keep both catalog placements paired if filters remount just one after a resize.
      if (pairedPlacementViewport?.pathname !== pathname) {
        const narrowDesktop = window.matchMedia('(min-width: 640px) and (hover: hover) and (pointer: fine)').matches
        pairedPlacementViewport = { pathname, isDesktop: isDesktop || narrowDesktop }
      }
      if (pairedPlacementViewport.isDesktop) activeBlockId = desktopBlockId
    }
    const divId = `yandex_rtb_${activeBlockId}${suffix ? `_${suffix}` : ''}`

    // Замер 31.08 (вечер): вызов из useEffect в момент гидрации не даёт рекламы,
    // а точно такой же вызов в свежесозданный узел ПОСЛЕ того, как страница ожила,
    // даёт её всегда. Поэтому создаём узел и просим рекламу на следующем кадре,
    // когда React уже закончил свою работу со страницей. Это не отложенный рендер
    // по скроллу (провал 25.07, CPM втрое вниз) — задержка в один кадр, без условий.
    let cancelled = false
    let attempt = 0

    const draw = () => {
      if (cancelled || !hostRef.current) return
      attempt += 1
      const id = attempt === 1 ? divId : `${divId}-r${attempt}`
      const node = document.createElement('div')
      node.id = id
      host.replaceChildren(node)
      window.yaContextCb = window.yaContextCb || []
      window.yaContextCb.push(() => {
        if (!cancelled && node.isConnected) {
          window.Ya?.Context.AdvManager.render({ blockId: activeBlockId, renderTo: id, statId: statId ?? experiment?.statId })
        }
      })
      // Самопроверка: если через 4 с место пустое, пробуем ещё раз в НОВЫЙ узел —
      // повторно в тот же renderTo РСЯ не рисует. Больше двух попыток не делаем.
      if (retry && attempt < 3) {
        window.setTimeout(() => {
          if (cancelled) return
          if (!node.isConnected || node.childElementCount === 0) draw()
        }, 4000)
      }
    }

    // ВАЖНО: только setTimeout, без requestAnimationFrame. В скрытой вкладке
    // (фоновая вкладка, свёрнутое окно) кадр отрисовки не наступает вообще —
    // с rAF место не создавалось и реклама не запрашивалась никогда. Замер
    // 31.08: document.visibilityState === 'hidden' → узлов нет ни одного.
    // Таймеры в скрытой вкладке работают, пусть и реже.
    const t = window.setTimeout(draw, 0)
    return () => { cancelled = true; window.clearTimeout(t) }
  }, [blockId, desktopBlockId, suffix, viewport, pathname, retry, statId])

  // suppressHydrationWarning + пустой children: React не трогает содержимое хоста.
  return <div ref={hostRef} suppressHydrationWarning />
}
