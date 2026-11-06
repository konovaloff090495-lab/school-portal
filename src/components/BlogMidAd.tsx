'use client'

import { useEffect, useState } from 'react'
import { createPortal } from 'react-dom'
import YandexRTBBanner from './YandexRTBBanner'

/** One mobile slot, mounted once at the assigned position after hydration. */
export default function BlogMidAd({ blockId }: { blockId: string }) {
  const [destination, setDestination] = useState<HTMLElement | false | null>(null)
  useEffect(() => {
    if (window.matchMedia('(min-width: 1024px)').matches) return
    const test = window.__psBlogAds?.getActive()
    const target = test?.arm === 'B' ? document.getElementById('ps-blog-early-ad') : null
    setDestination(target || false)
  }, [])
  if (destination === null) return null
  const ad = <div className="in-article-ad post-mobile-ad" data-ps-mid-position={destination ? 'early' : 'original'}>
    <div className="in-article-ad-label"><span>Реклама</span><span>16+</span></div>
    <YandexRTBBanner blockId={blockId} suffix="blog-mid-mobile" viewport="mobile" />
  </div>
  return destination ? createPortal(ad, destination) : ad
}
