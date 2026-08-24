import PartnerOfferPopup from '@/components/PartnerOfferPopup'

export default function BlogLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      {children}
      <PartnerOfferPopup />
    </>
  )
}
