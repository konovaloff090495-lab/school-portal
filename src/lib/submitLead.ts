// ЕДИНСТВЕННАЯ точка отправки лидов с клиента. Любая форма с именем/телефоном обязана
// вызывать submitLead() — тогда заявка автоматически уходит в Telegram и CRM Синергии
// (GraphQL sendLead, landCode mo_tilda_online_school, utm_source=gerasimov_lav) с
// контекстом визита (UTM, страница, реферер, ClientID Метрики).
// Прямой fetch('/api/leads/submit') из компонентов запрещён — см. scripts/check-lead-forms.sh.

import { LEAD_CONSENT_VERSION, LEAD_FORM_POLICY_VERSION } from '@/lib/lead-consent'
import { getLeadContext } from '@/lib/leadContext'
import { saveLeadProfile } from '@/lib/leadProfile'

export interface LeadPayload {
  name: string
  phone: string
  email: string
  question?: string
  /** Название школы, если заявка с карточки */
  school?: string
  city?: string
  /** Откуда заявка — подпись в Telegram и formTitle в CRM. Обязательно, уникально на форму. */
  source: string
  form_id?: string
  product?: string
  qualification?: { goal?: string; audience?: string; callback_time?: string }
  pd_agreed: boolean
  marketing_agreed: boolean
  /** UI default, distinct from an individual checkbox click. */
  marketing_default_selected?: boolean
  /** false — только Telegram, без CRM (B2B-формы вроде «Разместить школу») */
  crm?: boolean
}

export interface CareerResultPayload {
  purpose: 'result_save'
  request_id: string
  email: string
  age: number
  grade: number
  answers: Array<number | null>
  pd_agreed: boolean
  adult_confirmed: boolean
  marketing_agreed: boolean
  landing?: string
  visit_utm?: Record<string, string>
  website?: string
}

export interface CareerPartnerPayload {
  purpose: 'partner_request'
  request_id: string
  offer_id: string
  name: string
  phone: string
  pd_agreed: boolean
  marketing_agreed: boolean
  website?: string
}

export interface CareerReceipt {
  ok: boolean
  result_id?: string
  recovery_url?: string
  mail_sent?: boolean
  result?: Record<string, unknown>
  request_id?: string
  status?: 'pending' | 'sending' | 'delivered' | 'rejected' | 'uncertain' | 'configuration_error'
  duplicate?: boolean
  error?: string
  http_status?: number
}

export interface SchoolSubmissionPayload { kind: 'school-submission'; formData: FormData; crm: false; source: 'Добавление школы' }
export function submitLead(payload: LeadPayload): Promise<boolean>
export function submitLead(payload: SchoolSubmissionPayload): Promise<import('./school-submissions/types').SubmissionReceipt>
export function submitLead(payload: CareerResultPayload | CareerPartnerPayload): Promise<CareerReceipt>
export async function submitLead(payload: LeadPayload | SchoolSubmissionPayload | CareerResultPayload | CareerPartnerPayload): Promise<boolean | import('./school-submissions/types').SubmissionReceipt | CareerReceipt> {
  if ('purpose' in payload) {
    // Career results are saved without CRM. Only an explicit partner choice creates
    // a partner request. Neither branch writes email or phone to browser storage.
    try {
      const context = getLeadContext()
      const { purpose, ...fields } = payload
      const visitUtm = Object.fromEntries(Object.entries(
        payload.purpose === 'result_save' ? (payload.visit_utm || context.utm) : context.utm
      ).filter(([key]) => ['utm_source', 'utm_medium', 'utm_campaign', 'utm_content', 'utm_term', 'yclid', 'gclid', 'referrer', 'ym_client_id'].includes(key)))
      const body = payload.purpose === 'result_save'
        ? { ...fields, landing: payload.landing || window.location.pathname, visit_utm: visitUtm, source: 'career_result_save' }
        : { ...fields, source: 'career_partner_' + payload.offer_id }
      const res = await fetch(purpose === 'result_save' ? '/api/career/results/' : '/api/career/partner/', {
        method: 'POST', credentials: 'same-origin',
        headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body),
      })
      const receipt = await res.json().catch(() => ({})) as CareerReceipt
      return { ...receipt, ok: res.ok && receipt.ok === true, http_status: res.status }
    } catch { return { ok: false, error: 'network_error' } }
  }

  if ('kind' in payload && payload.kind === 'school-submission') {
    const response = await fetch('/api/school-submissions/submit/', { method: 'POST', body: payload.formData })
    const receipt = await response.json()
    if (!response.ok) throw new Error(receipt.error || 'Не удалось отправить заявку')
    return receipt
  }
  const lead = payload as LeadPayload

  if (lead.pd_agreed !== true) return false
  try {
    const res = await fetch('/api/leads/submit/', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        ...lead,
        consent_version: LEAD_CONSENT_VERSION,
        form_policy_version: LEAD_FORM_POLICY_VERSION,
        school: lead.school ?? 'Не указана',
        crm: lead.crm ?? true,
        form_id: lead.form_id || lead.source,
        ...getLeadContext(),
      }),
    })
    // Запоминаем контакты в браузере: витрина подарков (/spasibo/) предзаполняет ими
    // форму второго оффера — см. src/lib/leadProfile.ts.
    if (res.ok) saveLeadProfile({ name: lead.name, phone: lead.phone, email: lead.email })
    return res.ok
  } catch {
    return false
  }
}
