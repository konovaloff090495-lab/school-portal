// Контекст визита для лид-форм (только клиент): UTM первого захода, текущая страница, реферер, ClientID Метрики.
// UTM запоминаем в sessionStorage — пользователь часто оставляет заявку не на странице входа.

const UTM_KEY = 'ps_utm'
const UTM_KEYS = ['utm_source', 'utm_medium', 'utm_campaign', 'utm_term', 'utm_content', 'yclid', 'gclid']

export interface LeadContext {
  utm: Record<string, string>
  page_url: string
  referrer: string
  ym_client_id?: string
}

export function rememberUtm(): void {
  if (typeof window === 'undefined') return
  try {
    const params = new URLSearchParams(window.location.search)
    const found: Record<string, string> = {}
    for (const k of UTM_KEYS) { const v = params.get(k); if (v) found[k] = v }
    if (Object.keys(found).length) sessionStorage.setItem(UTM_KEY, JSON.stringify(found))
  } catch {}
}

export function getLeadContext(): LeadContext {
  if (typeof window === 'undefined') return { utm: {}, page_url: '', referrer: '' }
  rememberUtm()
  let utm: Record<string, string> = {}
  try { utm = JSON.parse(sessionStorage.getItem(UTM_KEY) || '{}') } catch {}
  let ym_client_id: string | undefined
  try {
    const m = document.cookie.match(/(?:^|; )_ym_uid=([^;]+)/)
    if (m) ym_client_id = decodeURIComponent(m[1])
  } catch {}
  return { utm, page_url: window.location.href, referrer: document.referrer, ym_client_id }
}
