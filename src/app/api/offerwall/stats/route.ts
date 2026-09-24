import { NextResponse } from 'next/server'
import { FALLBACK_STATS, type WallStats } from '@/lib/offerwallStats'

// Статистика для витрины подарков: посетители и заявки за 30 дней из Метрики.
// Кэш на час, чтобы не дёргать API на каждый показ страницы.
export const revalidate = 3600

const COUNTER = '108789843'
const GOALS = ['601419050', '601419042'] // заявка с карточки школы + из поп-апа

export async function GET() {
  const token = process.env.METRIKA_TOKEN
  if (!token) return NextResponse.json(FALLBACK_STATS)

  const to = new Date()
  const from = new Date(to.getTime() - 29 * 24 * 3600 * 1000)
  const iso = (d: Date) => d.toISOString().slice(0, 10)
  const metrics = ['ym:s:users', ...GOALS.map(g => `ym:s:goal${g}reaches`)].join(',')
  const url =
    'https://api-metrika.yandex.net/stat/v1/data?' +
    new URLSearchParams({
      ids: COUNTER,
      metrics,
      date1: iso(from),
      date2: iso(to),
      accuracy: 'full',
    })

  try {
    const res = await fetch(url, {
      headers: { Authorization: `OAuth ${token}` },
      next: { revalidate },
    })
    if (!res.ok) return NextResponse.json(FALLBACK_STATS)
    const data = (await res.json()) as { totals?: number[] }
    const t = data.totals
    if (!t || t.length < 3) return NextResponse.json(FALLBACK_STATS)
    const stats: WallStats = {
      users30: Math.round(t[0]),
      leads30: Math.round(t[1] + t[2]),
      measuredAt: iso(to),
    }
    // Подстраховка от пустого ответа API: лучше показать прошлый замер, чем ноль
    if (!stats.leads30 || !stats.users30) return NextResponse.json(FALLBACK_STATS)
    return NextResponse.json(stats)
  } catch {
    return NextResponse.json(FALLBACK_STATS)
  }
}
