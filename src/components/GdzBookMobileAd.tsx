'use client'

import { useEffect, useState } from 'react'
import { createPortal } from 'react-dom'
import { usePathname } from 'next/navigation'
import YandexRTBBanner from './YandexRTBBanner'

export default function GdzBookMobileAd({ blockId }: { blockId: string }) {
  const pathname = usePathname()
  const [placement, setPlacement] = useState<{ path: string; target: HTMLElement | null }>()
  useEffect(() => {
    if (window.matchMedia('(min-width: 1024px)').matches) {
      setPlacement(undefined)
      return
    }
    const assignment = window.__psBlogAds?.getActive()
    const early = assignment?.arm === 'B' && assignment.statId === 611200202
    setPlacement({ path: pathname, target: early ? document.getElementById('ps-gdz-book-early-ad') : null })
  }, [pathname])
  if (!placement || placement.path !== pathname) return null
  const ad = (
    <aside className="gdz-ad gdz-ad-inline" aria-label="Реклама"
      data-ps-gdz-position={placement.target ? 'after-search' : 'original'}>
      <div className="gdz-ad-label"><span>Реклама</span><span className="age">16+</span></div>
      <YandexRTBBanner blockId={blockId} suffix="list-inline" viewport="mobile" />
    </aside>
  )
  return placement.target ? createPortal(ad, placement.target) : ad
}
