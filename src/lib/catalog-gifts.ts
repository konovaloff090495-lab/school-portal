import { WALL_OFFERS } from '@/lib/offerwall'

/** Same verified offers as /spasibo/; no external offers without our CRM form. */
const GIFT_IDS = ['online-school', 'kursy-ege', 'kursy-oge', 'repetitor', 'nachalnaya-shkola', 'programmirovanie', 'soft-skills', 'lektoriy', 'profilnye-klassy', 'vneurochka']
export const CATALOG_GIFTS = GIFT_IDS.map(id => WALL_OFFERS.find(offer => offer.id === id)!).filter(Boolean).map(offer => offer.id === 'online-school' ? {
  ...offer,
  lead: 'Познакомьтесь с онлайн-школой для 5–11 классов: живые уроки, записи и поддержка педагогов. Условия пробного доступа уточнит консультант.',
  bullets: ['Школьная программа 5–11 классов: живые уроки и записи', 'Классный руководитель, наставник и психолог — состав поддержки зависит от тарифа', 'Пробное знакомство со школой перед выбором платного обучения'],
} : offer)
export const GIFT_EXPERIMENT = 'catalog-gifts-v1'

/** Refresh the selection's date at Moscow midnight, not 24 hours after a visit. */
export function dailyGiftClock(now: number) {
  const offset = 3 * 3600_000
  const shifted = new Date(now + offset)
  const refreshAt = (Math.floor((now + offset) / 86400_000) + 1) * 86400_000 - offset
  const pad = (n: number) => String(n).padStart(2, '0')
  const left = Math.max(0, Math.ceil((refreshAt - now) / 1000))
  return {
    day: shifted.toISOString().slice(0, 10),
    date: `${pad(shifted.getUTCDate())}.${pad(shifted.getUTCMonth() + 1)}`,
    countdown: `${pad(Math.floor(left / 3600))}:${pad(Math.floor(left / 60) % 60)}:${pad(left % 60)}`,
  }
}

export type GiftAction = 'view' | 'click' | 'close' | 'panel_view' | 'offer_open' | 'form_view' | 'form_start' | 'form_submit' | 'lead_success' | 'lead_error'
export function trackGift(action: GiftAction, offer?: string) {
  if (typeof window === 'undefined') return
  try {
    window.ym?.(108789843, 'reachGoal', `catalog_gifts_${action}`, {
      experiment: GIFT_EXPERIMENT, page_path: window.location.pathname,
      day: dailyGiftClock(Date.now()).day, ...(offer ? { offer } : {}),
    })
  } catch { /* Analytics must never block an offer or a lead. */ }
}
