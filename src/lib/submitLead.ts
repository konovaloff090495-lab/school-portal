// ЕДИНСТВЕННАЯ точка отправки лидов с клиента. Любая форма с именем/телефоном обязана
// вызывать submitLead() — тогда заявка автоматически уходит в Telegram и CRM Синергии
// (GraphQL sendLead, landCode mo_tilda_online_school, utm_source=gerasimov_lav) с
// контекстом визита (UTM, страница, реферер, ClientID Метрики).
// Прямой fetch('/api/leads/submit') из компонентов запрещён — см. scripts/check-lead-forms.sh.

import { getLeadContext } from '@/lib/leadContext'

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
  pd_agreed: boolean
  marketing_agreed: boolean
  /** false — только Telegram, без CRM (B2B-формы вроде «Разместить школу») */
  crm?: boolean
}

export async function submitLead(payload: LeadPayload): Promise<boolean> {
  try {
    const res = await fetch('/api/leads/submit', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        ...payload,
        school: payload.school ?? 'Не указана',
        crm: payload.crm ?? true,
        ...getLeadContext(),
      }),
    })
    return res.ok
  } catch {
    return false
  }
}
