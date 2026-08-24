import '@/styles/gdz.css'
import PartnerOfferPopup from '@/components/PartnerOfferPopup'

export default function GdzLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="gdz-scope">
      {children}
      <PartnerOfferPopup />
    </div>
  )
}
