'use client'

import { useState, useEffect } from 'react'

// Приём документов — последняя волна: до 31 августа 2026, 23:59 МСК
const TARGET = new Date('2026-08-31T23:59:59+03:00').getTime()

type Variant = 'light' | 'dark'

function Cell({ value, label, variant }: { value: number; label: string; variant: Variant }) {
  const box = variant === 'dark'
    ? 'bg-white/15 text-white'
    : 'bg-[#0F3A5F] text-white'
  const lab = variant === 'dark' ? 'text-white/70' : 'text-gray-500'
  return (
    <div className="flex flex-col items-center">
      <span className={`${box} rounded-md font-bold tabular-nums px-2 py-1 text-base sm:text-lg min-w-[2.2rem] text-center`}>
        {String(value).padStart(2, '0')}
      </span>
      <span className={`${lab} text-[10px] mt-1`}>{label}</span>
    </div>
  )
}

export default function Countdown({ variant = 'light', compact = false, className = '' }:
  { variant?: Variant; compact?: boolean; className?: string }) {
  const [left, setLeft] = useState<number | null>(null)

  useEffect(() => {
    const tick = () => setLeft(TARGET - Date.now())
    tick()
    const t = setInterval(tick, 1000)
    return () => clearInterval(t)
  }, [])

  if (left === null || left <= 0) return null

  const d = Math.floor(left / 86400000)
  const h = Math.floor(left / 3600000) % 24
  const m = Math.floor(left / 60000) % 60
  const s = Math.floor(left / 1000) % 60

  // Компактный однострочный вид (для узких мест, напр. нижней растяжки)
  if (compact) {
    const box = variant === 'dark' ? 'bg-white/15 text-white' : 'bg-[#0F3A5F] text-white'
    const p = (v: number) => String(v).padStart(2, '0')
    return (
      <span className={`inline-flex items-center gap-1 font-bold tabular-nums text-sm ${box} rounded-md px-2 py-1 ${className}`}>
        <span>{p(d)}<span className="opacity-70 font-medium text-xs">д</span></span>
        <span className="opacity-50">:</span>
        <span>{p(h)}<span className="opacity-70 font-medium text-xs">ч</span></span>
        <span className="opacity-50">:</span>
        <span>{p(m)}<span className="opacity-70 font-medium text-xs">м</span></span>
        <span className="opacity-50">:</span>
        <span>{p(s)}<span className="opacity-70 font-medium text-xs">с</span></span>
      </span>
    )
  }

  return (
    <div className={`flex items-center gap-1.5 ${className}`}>
      <Cell value={d} label="дней" variant={variant} />
      <span className={variant === 'dark' ? 'text-white/50 font-bold' : 'text-gray-300 font-bold'}>:</span>
      <Cell value={h} label="часов" variant={variant} />
      <span className={variant === 'dark' ? 'text-white/50 font-bold' : 'text-gray-300 font-bold'}>:</span>
      <Cell value={m} label="минут" variant={variant} />
      <span className={variant === 'dark' ? 'text-white/50 font-bold' : 'text-gray-300 font-bold'}>:</span>
      <Cell value={s} label="секунд" variant={variant} />
    </div>
  )
}
