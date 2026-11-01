/** The campaign runtime selects an exact sale offer from this page's topic and age. */
export default function SuPartnerBanner(_props: {
  productKey: string
  postSlug?: string
  pathOverride?: string
  compact?: boolean
}) {
  return <div data-ps-sale-slot="article" />
}
