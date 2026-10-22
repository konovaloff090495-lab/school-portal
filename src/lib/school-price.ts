import type { School } from '@/data/schools'

// Missing price is not evidence of a budget-funded place.
export function hasConfirmedFreePrice(school: Pick<School, 'priceFrom'>): boolean {
  return school.priceFrom === 0
}
