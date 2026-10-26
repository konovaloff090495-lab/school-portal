/** Fixed campaign labels only. Never pass form values or other personal data. */
export type CatalogOfferKind = 'trial' | 'attestat'
export type CatalogOfferFormPosition = 'top' | 'middle' | 'bottom'
export type CatalogOfferAction = 'banner_click' | 'form_view' | 'form_start' | 'cta_click' | 'lead_success'
export type CatalogOfferPlacement = CatalogOfferFormPosition | 'programs' | 'externat'
export interface CatalogOfferFormTracking { kind: CatalogOfferKind; placement: CatalogOfferFormPosition }

export function trackCatalogOffer(kind: CatalogOfferKind, action: CatalogOfferAction, placement?: CatalogOfferPlacement): void {
  if (typeof window === 'undefined') return
  const params = { offer: kind, ...(placement ? { placement } : {}) }
  try {
    window.ym?.(108789843, 'reachGoal', `catalog_${kind}_${action}`, params)
    if (action === 'lead_success' && placement && ['top', 'middle', 'bottom'].includes(placement)) {
      window.ym?.(108789843, 'reachGoal', `catalog_${kind}_lead_${placement}`, params)
    }
  } catch { /* Analytics must never interrupt opening a panel or submitting a lead. */ }
}
