'use client'

import { useId } from 'react'
import { usePathname } from 'next/navigation'
import YandexRTBBanner from '@/components/YandexRTBBanner'
import { AD_SLOT_2, AD_SLOT_3 } from '@/lib/ads'

const existingPlacements = /^\/(?:blog\/[^/]+\/?$|gdz(?:\/|$)|olimpiady(?:\/|$)|uchebnik\/[^/]+\/[^/]+(?:\/|$))/
const privatePages = /^\/(?:admin|lk|api|education-gifts)(?:\/|$)/

export default function SiteAds({ placement }: { placement: 'early' | 'lower' }) {
  const pathname = usePathname()
  const id = useId().replace(/[^a-z0-9_-]/gi, '')
  if (privatePages.test(pathname) || existingPlacements.test(pathname)) return null

  return (
    <div data-ps-native-ads={placement} className="mx-auto w-full max-w-6xl min-w-0 px-4 empty:hidden">
      <YandexRTBBanner
        blockId={placement === 'early' ? AD_SLOT_2 : AD_SLOT_3}
        suffix={`${id}-${pathname.replace(/[^a-z0-9-]+/g, '-')}`}
        statId={placement === 'early' ? 202611201 : 202611202}
        retry={false}
      />
    </div>
  )
}
