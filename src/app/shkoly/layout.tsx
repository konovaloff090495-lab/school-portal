import CatalogOfferPopup from '@/components/CatalogOfferPopup'
import PartnerStickyBanner from '@/components/PartnerStickyBanner'

export default function ShkolyLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      {children}
      <CatalogOfferPopup />
      <PartnerStickyBanner />
    </>
  )
}
