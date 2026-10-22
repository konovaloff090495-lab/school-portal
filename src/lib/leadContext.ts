// Контекст визита для лид-форм (только клиент): UTM первого захода, текущая страница, реферер, ClientID Метрики.
// UTM запоминаем в sessionStorage — пользователь часто оставляет заявку не на странице входа.

import { GROWTH_RELEASE, selectedGrowthRoute } from './growth-tracking'

const UTM_KEY = 'ps_utm'
const ENTRY_KEY = 'ps_visit_entry_v1'

const UTM_KEYS = ['utm_source', 'utm_medium', 'utm_campaign', 'utm_term', 'utm_content', 'yclid', 'gclid']

export interface LeadContext {
  utm: Record<string, string>
  page_url: string
  referrer: string
  landing_url?: string
  first_referrer?: string
  growth_release?: string
  selected_route?: string
  ym_client_id?: string
}

export function rememberUtm(): void {
  if (typeof window === 'undefined') return
  try {
    if (!sessionStorage.getItem(ENTRY_KEY)) sessionStorage.setItem(ENTRY_KEY, JSON.stringify({
      landing_url: window.location.origin + window.location.pathname,
      first_referrer: document.referrer,
    }))
    const params = new URLSearchParams(window.location.search)
    const found: Record<string, string> = {}
    for (const k of UTM_KEYS) { const v = params.get(k); if (v) found[k] = v }
    if (!sessionStorage.getItem(UTM_KEY)) sessionStorage.setItem(UTM_KEY, JSON.stringify(found))
  } catch {}
}

export function getLeadContext(): LeadContext {
  if (typeof window === 'undefined') return { utm: {}, page_url: '', referrer: '' }
  rememberUtm()
  let utm: Record<string, string> = {}
  let entry: { landing_url?: string; first_referrer?: string } = {}
  try { utm = JSON.parse(sessionStorage.getItem(UTM_KEY) || '{}') } catch {}
  try { entry = JSON.parse(sessionStorage.getItem(ENTRY_KEY) || '{}') } catch {}
  let ym_client_id: string | undefined
  try {
    const m = document.cookie.match(/(?:^|; )_ym_uid=([^;]+)/)
    if (m) ym_client_id = decodeURIComponent(m[1])
  } catch {}
  return { utm, page_url: window.location.href, referrer: document.referrer, ym_client_id, ...entry, growth_release: GROWTH_RELEASE, selected_route: selectedGrowthRoute() }
}
