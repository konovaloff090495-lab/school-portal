'use client'
import { useEffect } from 'react'
import { usePathname } from 'next/navigation'
import { GROWTH_CHOICES, GROWTH_RELEASE, rememberGrowthRoute } from '@/lib/growth-tracking'

type Goal = 'growth_route_view' | 'growth_route_click' | 'growth_form_start' | 'growth_form_error'
export default function GrowthFunnelTracking() {
  const path = usePathname()
  useEffect(() => {
    if (path.startsWith('/admin') || path.startsWith('/dobavit-shkolu')) return
    let active = true
    const pending: [Goal, Record<string, string>][] = []
    const send = (goal: Goal, params: Record<string, string>) => {
      const data = { release: GROWTH_RELEASE, page_path: path, ...params }
      if (window.ym) window.ym(108789843, 'reachGoal', goal, data)
      else pending.push([goal, data])
    }
    // The tag initializes after hydration; don't lose the first visible block.
    const timer = window.setInterval(() => {
      if (!active || !window.ym) return
      while (pending.length) { const event = pending.shift()!; window.ym(108789843, 'reachGoal', event[0], event[1]) }
      window.clearInterval(timer)
    }, 500)
    const seen = new WeakSet<Element>(), started = new WeakSet<Element>(), invalid = new WeakSet<Element>()
    const observer = new IntersectionObserver(entries => {
      for (const e of entries) if (e.isIntersecting && !seen.has(e.target)) {
        seen.add(e.target); send('growth_route_view', { block: e.target.getAttribute('data-growth-block') || 'evening-intent' }); observer.unobserve(e.target)
      }
    }, { threshold: 0.2 })
    document.querySelectorAll('[data-growth-block]').forEach(el => observer.observe(el))
    const onClick = (event: MouseEvent) => {
      if (!(event.target instanceof Element)) return
      const link = event.target.closest('[data-growth-choice]')
      const choice = link?.getAttribute('data-growth-choice') || ''
      if (!GROWTH_CHOICES.some(c => c === choice)) return
      rememberGrowthRoute(choice)
      send('growth_route_click', { choice, block: link?.closest('[data-growth-block]')?.getAttribute('data-growth-block') || 'adult-links' })
    }
    const onStart = (event: FocusEvent) => {
      if (!(event.target instanceof Element)) return
      const form = event.target.closest('form[data-growth-form]')
      if (!form || started.has(form)) return
      started.add(form); send('growth_form_start', { form_id: form.getAttribute('data-growth-form') || 'student-form' })
    }
    const onInvalid = (event: Event) => {
      if (!(event.target instanceof Element)) return
      const form = event.target.closest('form[data-growth-form]')
      if (!form || invalid.has(form)) return
      invalid.add(form); send('growth_form_error', { form_id: form.getAttribute('data-growth-form') || 'student-form', reason: 'browser-validation' })
    }
    document.addEventListener('click', onClick)
    document.addEventListener('focusin', onStart)
    document.addEventListener('invalid', onInvalid, true)
    return () => { active = false; window.clearInterval(timer); observer.disconnect(); document.removeEventListener('click', onClick); document.removeEventListener('focusin', onStart); document.removeEventListener('invalid', onInvalid, true) }
  }, [path])
  return null
}
