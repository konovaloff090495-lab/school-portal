// Отправка заявок в CRM Синергии через GraphQL-мутацию sendLead.
// Тестовый контур (РЦ): https://api.school.syndev.ru/graphql
// Прод:                  https://api.school.synergy.ru/graphql
// Обязательные аргументы: landCode, personalDataAgree, marketingAgree.
// Партнёрская атрибуция pro-schools.ru — utm_source=gerasimov_lav (ставится сервером всегда).

const PROD_URL = 'https://api.school.synergy.ru/graphql'
const RC_URL   = 'https://api.school.syndev.ru/graphql'

const ENDPOINT  = process.env.SYNERGY_GRAPHQL_URL
  || (process.env.NODE_ENV === 'production' ? PROD_URL : RC_URL)
const LAND_CODE = process.env.SYNERGY_LAND_CODE || 'mo_tilda_online_school'

export const SYNERGY_UTM_SOURCE = 'gerasimov_lav'
export const SYNERGY_UTM_MEDIUM = 'lkpartners'

const MUTATION = `mutation SendLead(
  $name: String, $email: String, $phone: String, $landCode: String!,
  $utmData: JSON, $formTitle: String, $latestComment: String,
  $visitHistory: [JSON!], $customAttributes: JSON,
  $personalDataAgree: Boolean!, $marketingAgree: Boolean!
) {
  sendLead(
    name: $name, email: $email, phone: $phone, landCode: $landCode,
    utmData: $utmData, formTitle: $formTitle, latestComment: $latestComment,
    visitHistory: $visitHistory, customAttributes: $customAttributes,
    personalDataAgree: $personalDataAgree, marketingAgree: $marketingAgree
  ) { success errors { field message } lead { id } }
}`

export interface SynergyLeadInput {
  name: string
  phone: string
  email?: string
  formTitle: string
  comment?: string
  /** UTM-метки визита (utm_source будет заменён на gerasimov_lav, оригинал уйдёт в customAttributes) */
  utm?: Record<string, string>
  pageUrl?: string
  referrer?: string
  ymClientId?: string
  personalDataAgree: boolean
  marketingAgree: boolean
  extra?: Record<string, unknown>
}

export type SynergyLeadResult =
  | { ok: true; id: string | null }
  | { ok: false; error: string }

/** +7 (999) 123-45-67 / 8 999 123 45 67 → +79991234567 */
export function normalizePhone(raw: string): string {
  const digits = raw.replace(/\D/g, '')
  const local = (digits.startsWith('7') || digits.startsWith('8')) && digits.length === 11
    ? digits.slice(1)
    : digits.slice(-10)
  return `+7${local}`
}

export async function sendLeadToSynergy(input: SynergyLeadInput): Promise<SynergyLeadResult> {
  const visitorUtm = input.utm ?? {}
  const utmData: Record<string, string> = {
    ...visitorUtm,
    utm_source: SYNERGY_UTM_SOURCE,
    utm_medium: visitorUtm.utm_medium || SYNERGY_UTM_MEDIUM,
    utm_campaign: visitorUtm.utm_campaign || 'pro-schools.ru',
  }

  const variables = {
    name: input.name,
    email: input.email || undefined,
    phone: normalizePhone(input.phone),
    landCode: LAND_CODE,
    utmData,
    formTitle: input.formTitle,
    latestComment: input.comment || undefined,
    visitHistory: input.pageUrl
      ? [{ url: input.pageUrl, referrer: input.referrer || null, ts: new Date().toISOString() }]
      : undefined,
    customAttributes: {
      site: 'pro-schools.ru',
      page_url: input.pageUrl,
      referrer: input.referrer,
      ym_client_id: input.ymClientId,
      original_utm: Object.keys(visitorUtm).length ? visitorUtm : undefined,
      ...input.extra,
    },
    personalDataAgree: input.personalDataAgree,
    marketingAgree: input.marketingAgree,
  }

  try {
    const res = await fetch(ENDPOINT, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ query: MUTATION, variables }),
      signal: AbortSignal.timeout(15000),
    })
    const json = await res.json().catch(() => null)
    if (!res.ok || !json) return { ok: false, error: `HTTP ${res.status}` }
    if (json.errors?.length) return { ok: false, error: json.errors.map((e: { message: string }) => e.message).join('; ') }
    const payload = json.data?.sendLead
    if (!payload?.success) {
      const msgs = (payload?.errors ?? []).map((e: { field?: string; message: string }) =>
        e.field ? `${e.field}: ${e.message}` : e.message)
      return { ok: false, error: msgs.join('; ') || 'success=false' }
    }
    return { ok: true, id: payload.lead?.id ?? null }
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : String(err) }
  }
}
