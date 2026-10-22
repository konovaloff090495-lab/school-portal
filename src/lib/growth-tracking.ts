/** Only fixed route enums and paths; never send input values to analytics. */
export const GROWTH_RELEASE = 'leads-growth-20261022-r2'
export const GROWTH_ROUTE_KEY = 'ps_growth_route_v1'
export const GROWTH_CHOICES = ['local-school', 'attestat-9', 'attestat-11', 'full-school', 'adult-attestat', 'subject-courses'] as const
export function rememberGrowthRoute(choice: string): void {
  if (!GROWTH_CHOICES.some(c => c === choice)) return
  try { sessionStorage.setItem(GROWTH_ROUTE_KEY, choice) } catch { /* Storage may be unavailable. */ }
}
export function selectedGrowthRoute(): string | undefined {
  try { const value = sessionStorage.getItem(GROWTH_ROUTE_KEY); return GROWTH_CHOICES.some(c => c === value) ? value! : undefined } catch { return undefined }
}
