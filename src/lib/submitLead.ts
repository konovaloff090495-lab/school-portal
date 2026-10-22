// ЕДИНСТВЕННАЯ точка отправки лидов с клиента. Любая форма с именем/телефоном обязана
// вызывать submitLead() — тогда заявка автоматически уходит в Telegram и CRM Синергии
// (GraphQL sendLead, landCode mo_tilda_online_school, utm_source=gerasimov_lav) с
// контекстом визита (UTM, страница, реферер, ClientID Метрики).
// Прямой fetch('/api/leads/submit') из компонентов запрещён — см. scripts/check-lead-forms.sh.

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
  /** false — только Telegram, без CRM (B2B-формы вроде «Разместить школу») */
  crm?: boolean
}

export interface SchoolSubmissionPayload { kind: 'school-submission'; formData: FormData; crm: false; source: 'Добавление школы' }
export function submitLead(payload: LeadPayload): Promise<boolean>
export function submitLead(payload: SchoolSubmissionPayload): Promise<import('./school-submissions/types').SubmissionReceipt>
export async function submitLead(payload: LeadPayload | SchoolSubmissionPayload): Promise<boolean | import('./school-submissions/types').SubmissionReceipt> {
  if ('kind' in payload && payload.kind === 'school-submission') {
    const response = await fetch('/api/school-submissions/submit/', { method: 'POST', body: payload.formData })
    const receipt = await response.json()
    if (!response.ok) throw new Error(receipt.error || 'Не удалось отправить заявку')
    return receipt
  }
  const lead = payload as LeadPayload

  try {
    const res = await fetch('/api/leads/submit', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        ...lead,
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
