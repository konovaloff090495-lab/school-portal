'use client'

import { useEffect, useId, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import LeadForm from '@/components/LeadForm'
import OfferIcon from '@/components/offerwall/OfferIcon'
import { CATALOG_GIFTS, dailyGiftClock, trackGift } from '@/lib/catalog-gifts'
import type { CatalogGift } from '@/lib/catalog-gifts'
import { usePathname } from 'next/navigation'
import styles from './PartnerStickyBanner.module.css'

const CLOSED_KEY = 'ps_catalog_gifts_closed_day'

function GiftIcon({ className }: { className?: string }) {
  return <svg className={className} viewBox="0 0 32 32" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M5 15h22v13H5zM3 10h26v5H3zM16 10v18"/><path d="M16 10C7 11 7 3 11 3c3 0 5 7 5 7Zm0 0c9 1 9-7 5-7-3 0-5 7-5 7Z"/></svg>
}

export default function PartnerStickyBanner() {
  const pathname = usePathname()
  const [clock, setClock] = useState<ReturnType<typeof dailyGiftClock> | null>(null)
  const [scrolled, setScrolled] = useState(false)
  const [closedDay, setClosedDay] = useState('')
  const [formVisible, setFormVisible] = useState(false)
  const [otherDialog, setOtherDialog] = useState(false)
  const [open, setOpen] = useState(false)
  const [active, setActive] = useState<CatalogGift | null>(null)
  const banner = useRef<HTMLDivElement>(null)
  const opener = useRef<HTMLButtonElement>(null)
  const panel = useRef<HTMLDialogElement>(null)
  const body = useRef<HTMLDivElement>(null)
  const seen = useRef(new Set<string>())
  const heading = useId()
  const panelId = useId()

  useEffect(() => {
    const tick = () => setClock(dailyGiftClock(Date.now()))
    tick()
    try { setClosedDay(localStorage.getItem(CLOSED_KEY) || '') } catch {}
    const timer = setInterval(tick, 1000)
    const scroll = () => setScrolled(window.scrollY > 250)
    scroll(); window.addEventListener('scroll', scroll, { passive: true })
    return () => { clearInterval(timer); window.removeEventListener('scroll', scroll) }
  }, [])

  useEffect(() => { setOpen(false); setActive(null) }, [pathname])

  useEffect(() => {
    const forms = new Set<Element>()
    const observer = new IntersectionObserver(entries => {
      for (const entry of entries) {
        if (entry.isIntersecting) forms.add(entry.target)
        else forms.delete(entry.target)
      }
      setFormVisible(forms.size > 0)
    }, { threshold: 0, rootMargin: '0px 0px 120px 0px' })
    document.querySelectorAll('form[data-growth-form]').forEach(form => observer.observe(form))
    return () => observer.disconnect()
  }, [pathname])

  useEffect(() => {
    const update = () => setOtherDialog(Boolean([...document.querySelectorAll('dialog[open]')].find(node => node !== panel.current)))
    const observer = new MutationObserver(update)
    observer.observe(document.body, { subtree: true, childList: true, attributes: true, attributeFilter: ['open'] })
    update()
    return () => observer.disconnect()
  }, [])

  const eligible = Boolean(clock && scrolled && closedDay !== clock.day && !formVisible && !otherDialog && !open)
  useEffect(() => {
    if (!eligible || !banner.current || !clock) return
    const key = `${pathname}:${clock.day}`
    const observer = new IntersectionObserver(entries => {
      if (!entries.some(entry => entry.isIntersecting && entry.intersectionRatio >= 0.5) || seen.current.has(key)) return
      seen.current.add(key); trackGift('view'); observer.disconnect()
    }, { threshold: 0.5 })
    observer.observe(banner.current)
    return () => observer.disconnect()
  }, [eligible, pathname, clock?.day])

  useEffect(() => {
    if (!open || !panel.current) return
    const dialog = panel.current
    const overflow = document.body.style.overflow
    dialog.showModal(); document.body.style.overflow = 'hidden'
    window.dispatchEvent(new Event('ps:catalog-drawer-open'))
    trackGift('panel_view')
    return () => { dialog.close(); document.body.style.overflow = overflow; requestAnimationFrame(() => opener.current?.focus({ preventScroll: true })) }
  }, [open])

  function select(offer: CatalogGift) {
    setActive(offer); trackGift('offer_open', offer.id)
    body.current?.scrollTo({ top: 0 })
  }

  return <>
    {eligible && clock && <div ref={banner} data-partner-sticky-banner data-catalog-gifts-banner className={styles.banner}>
      <div className={styles.bannerInner}>
        <span className={styles.gift}><GiftIcon /></span>
        <div className={styles.bannerCopy}>
          <strong>{CATALOG_GIFTS.length} спецпредложений <span className={styles.partners}>от партнёров </span>на {clock.date}</strong>
          <span className={styles.timer}>До обновления подборки <b data-gift-countdown>{clock.countdown}</b></span>
        </div>
        <button ref={opener} type="button" className={styles.take} aria-haspopup="dialog" aria-controls={panelId} onClick={() => { trackGift('click'); setActive(null); setOpen(true) }}>Забрать подарок <span aria-hidden="true">→</span></button>
        <button type="button" aria-label="Закрыть предложения на сегодня" className={styles.dismiss} onClick={() => { trackGift('close'); setClosedDay(clock.day); try { localStorage.setItem(CLOSED_KEY, clock.day) } catch {} }}>×</button>
      </div>
    </div>}
    {open && clock && createPortal(<dialog ref={panel} id={panelId} aria-labelledby={heading} className={styles.panel} data-catalog-gifts-panel onCancel={() => setOpen(false)} onClose={() => setOpen(false)} onClick={event => { if (event.target === event.currentTarget) setOpen(false) }}>
      <header className={styles.header}>
        <span><GiftIcon /> Подарки от партнёров</span>
        <button type="button" aria-label="Закрыть панель подарков" onClick={() => setOpen(false)}>×</button>
      </header>
      <div ref={body} className={styles.body}>
        <div className={styles.daily}><span>Подборка на {clock.date}</span><span>Обновится через <b data-gift-countdown>{clock.countdown}</b></span></div>
        {active ? <section className={styles.detail}>
          <button type="button" className={styles.back} onClick={() => { setActive(null); body.current?.scrollTo({ top: 0 }) }}>← Все {CATALOG_GIFTS.length} предложений</button>
          <div className={styles.detailHero}>
            {/* Existing editorial illustration, not a photograph of school staff. */}
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={active.hero.src} alt={active.hero.alt} width="1200" height="200" />
            <div><small>{active.hero.label}</small><strong>{active.hero.headline}</strong></div>
          </div>
          <span className={styles.brand}>{active.brand}</span>
          <h2 id={heading}>{active.badge}</h2>
          <p>{active.lead}</p>
          <div className={styles.facts}>{active.facts.map(fact => <span key={fact}>{fact}</span>)}</div>
          {active.price && <div className={styles.price}><del>{active.price.previous}</del><strong>{active.price.current}</strong><span>{active.price.note}</span></div>}
          <ul>{active.bullets.map(text => <li key={text}>{text}</li>)}</ul>
          <div className={styles.form}>
            <LeadForm key={active.id} compact schoolName={active.productName} source={`Растяжка подарков: ${active.productName}`} defaultGoal={`${active.productName}: ${active.badge}`} title={active.formLabel || "Забрать подарок"} submitLabel={active.formLabel || "Забрать подарок"} showGiftNotice={false} giftOfferId={active.id} />
          </div>
          <div className={styles.landingSections}>{active.sections.map(section => <section key={section.title}><h3>{section.title}</h3><p>{section.text}</p></section>)}</div>
          <div className={styles.offerTerms}><h3>Условия предложения</h3><p>{active.terms}</p>{active.sourceUrl && <a href={active.sourceUrl} target="_blank" rel="noopener sponsored">Посмотреть тарифы на сайте школы ↗</a>}</div>
          <p className={styles.conditions}>Консультант Синергии свяжется с вами по выбранному предложению. Дата и таймер относятся к обновлению подборки, а не к сроку действия договора или скидки.</p>
        </section> : <>
          <div className={styles.intro}><span className={styles.kicker}>ВЫБЕРИТЕ СВОЁ</span><h2 id={heading}>{CATALOG_GIFTS.length} поводов попробовать<br /><em>что-то новое</em></h2><p>Скидка на домашнюю школу, пробные занятия и полезные бонусы Синергии. Выберите предложение и посмотрите подробные условия.</p></div>
          <div className={styles.offers}>{CATALOG_GIFTS.map((offer, index) => <button type="button" key={offer.id} className={styles.offer} data-gift-offer={offer.id} onClick={() => select(offer)}>
            <span className={styles.offerIcon} style={{ background: offer.tint[0] }}><OfferIcon name={offer.icon} /></span>
            <span className={styles.offerCopy}><small>{offer.brand} <span>· {String(index + 1).padStart(2, '0')}</span></small><strong>{offer.badge}</strong><span>{offer.tile}</span></span><span className={styles.arrow} aria-hidden="true">↗</span>
          </button>)}</div>
          <p className={styles.note}>Без случайного выбора: у каждого предложения есть описание, условия и отдельная заявка.</p>
        </>}
      </div>
    </dialog>, document.body)}
  </>
}
