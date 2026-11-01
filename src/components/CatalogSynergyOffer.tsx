/** Campaign placement. Rendering is shared with static pages in /sale-context/widget.js. */
export default function CatalogSynergyOffer({kind = 'trial'}: {kind?: 'trial' | 'attestat'}) {
  return <div data-ps-sale-slot={kind} />
}
