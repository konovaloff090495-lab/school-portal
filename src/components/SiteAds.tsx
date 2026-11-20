'use client'

import { usePathname } from 'next/navigation'
import YandexRTBBanner from '@/components/YandexRTBBanner'
import { AD_SLOT_2, AD_SLOT_3 } from '@/lib/ads'

const existingPlacements = /^\/(?:blog\/[^/]+\/?$|gdz(?:\/|$)|olimpiady(?:\/|$)|uchebnik\/[^/]+\/[^/]+(?:\/|$))/
const privatePages = /^\/(?:admin|lk|api|education-gifts)(?:\/|$)/

export default function SiteAds({ placement }: { placement: 'early' | 'lower' }) {
  const pathname = usePathname()
  if (privatePages.test(pathname) || existingPlacements.test(pathname)) return null

  return (
    <div data-ps-native-ads={placement} className="mx-auto w-full max-w-6xl min-w-0 px-4 empty:hidden">
      <YandexRTBBanner
        blockId={placement === 'early' ? AD_SLOT_2 : AD_SLOT_3}
        suffix={placement}
        retry={false}
      />
    </div>
  )
}
