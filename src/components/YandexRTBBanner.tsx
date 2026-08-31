'use client'
import { useEffect, useRef } from 'react'

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
   * Ограничить место одним типом экрана. Нужно там, где под десктоп и под
   * мобильные стоят РАЗНЫЕ места одного и того же блока РСЯ: без ограничения
   * оба вызовут render(), а блок отрисуется только в первом — и на телефоне
   * реклама уедет в скрытый сайдбар. Граница — 1024px (Tailwind `lg`).
   */
  viewport?: 'mobile' | 'desktop'
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
export default function YandexRTBBanner({ blockId, suffix, viewport }: Props) {
  const divId = suffix
    ? `yandex_rtb_${blockId}_${suffix}`
    : `yandex_rtb_${blockId}`
  const hostRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (viewport) {
      const isDesktop = window.matchMedia('(min-width: 1024px)').matches
      if (viewport === 'desktop' && !isDesktop) return
      if (viewport === 'mobile' && isDesktop) return
    }
    const host = hostRef.current
    if (!host) return

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
        window.Ya?.Context.AdvManager.render({ blockId, renderTo: id })
      })
      // Самопроверка: если через 4 с место пустое, пробуем ещё раз в НОВЫЙ узел —
      // повторно в тот же renderTo РСЯ не рисует. Больше двух попыток не делаем.
      if (attempt < 3) {
        window.setTimeout(() => {
          if (cancelled) return
          if (!node.isConnected || node.childElementCount === 0) draw()
        }, 4000)
      }
    }

    const raf = window.requestAnimationFrame(() => window.setTimeout(draw, 0))
    return () => { cancelled = true; window.cancelAnimationFrame(raf) }
  }, [blockId, divId, viewport])

  // suppressHydrationWarning + пустой children: React не трогает содержимое хоста.
  return <div ref={hostRef} suppressHydrationWarning />
}
