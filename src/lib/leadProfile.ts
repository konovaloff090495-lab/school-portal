// Профиль последней заявки пользователя (только этот браузер, localStorage).
// Зачем: после заявки человек попадает на витрину подарков /spasibo/ и /podarki/.
// Заставлять его заново набирать имя-телефон-почту ради второго оффера — терять заявки,
// поэтому форма в шторке витрины предзаполняется тем, что он уже ввёл минуту назад.
// Данные никуда не уходят сами: отправка по-прежнему только через submitLead().

const KEY = 'ps_lead_profile'

export interface LeadProfile {
  name: string
  phone: string
  email: string
  /** ISO-дата последней заявки — чтобы не подставлять совсем старые данные */
  at: string
}

export function saveLeadProfile(p: { name: string; phone: string; email: string }): void {
  if (typeof window === 'undefined') return
  try {
    localStorage.setItem(KEY, JSON.stringify({ ...p, at: new Date().toISOString() }))
  } catch {}
}

/** Профиль не старше 30 дней, иначе — пусто. */
export function getLeadProfile(): LeadProfile | null {
  if (typeof window === 'undefined') return null
  try {
    const raw = localStorage.getItem(KEY)
    if (!raw) return null
    const p = JSON.parse(raw) as LeadProfile
    if (!p?.phone) return null
    const age = Date.now() - new Date(p.at).getTime()
    if (!Number.isFinite(age) || age > 30 * 24 * 3600 * 1000) return null
    return p
  } catch {
    return null
  }
}
