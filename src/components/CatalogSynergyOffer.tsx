'use client'

import { useEffect, useId, useRef, useState } from 'react'
import LeadForm from './LeadForm'
import styles from './CatalogSynergyOffer.module.css'

// Confirmed by the owner on 26.10.2026: a ProSchools-specific 14-day offer.
// The public school-university.com offer remains one week; do not change it globally.
const OFFER_SOURCE = 'Каталог школ: Синергия — 14 дней бесплатно'
const OFFER_GOAL = 'Спецпредложение ProSchools: 14 дней бесплатного доступа в онлайн-школу «Синергия», 5–11 класс'

export default function CatalogSynergyOffer() {
  const [open, setOpen] = useState(false)
  const panelId = useId()
  const headingId = useId()
  const dialog = useRef<HTMLDialogElement>(null)
  const opener = useRef<HTMLButtonElement>(null)

  useEffect(() => {
    const panel = dialog.current
    if (!panel || !open) return
    const previousOverflow = document.body.style.overflow
    panel.showModal()
    document.body.style.overflow = 'hidden'
    window.ym?.(108789843, 'reachGoal', 'catalog_synergy_offer_open', { offer: 'proschools-14-days' })
    return () => {
      panel.close()
      document.body.style.overflow = previousOverflow
      opener.current?.focus({ preventScroll: true })
    }
  }, [open])

  return (
    <div data-catalog-synergy-offer>
      <button
        ref={opener}
        type="button"
        className={styles.banner}
        aria-haspopup="dialog"
        aria-controls={panelId}
        onClick={() => setOpen(true)}
      >
        <span className={styles.trialBadge} aria-hidden="true"><span>14</span>дней бесплатно</span>
        <span className={styles.bannerCopy}>
          <span className={styles.eyebrow}>Реклама · Онлайн-школа «Синергия»</span>
          <span className={styles.bannerTitle}>Найдите школу, в которой ребёнку удобно учиться</span>
          <span className={styles.bannerDescription}>Попробуйте онлайн-обучение для 5–11 классов — 14 дней бесплатно по спецпредложению ProSchools.</span>
        </span>
        <span className={styles.bannerCta}>Получить 14 дней <span aria-hidden="true">↗</span></span>
      </button>

      <dialog
        ref={dialog}
        id={panelId}
        className={styles.panel}
        aria-labelledby={headingId}
        onCancel={() => setOpen(false)}
        onClose={() => setOpen(false)}
        onClick={event => { if (event.target === event.currentTarget) setOpen(false) }}
      >
        <header className={styles.header}>
          <span>Синергия <span className={styles.headerTag}>онлайн-школа</span></span>
          <button type="button" onClick={() => setOpen(false)} className={styles.close} aria-label="Закрыть информацию об онлайн-школе">×</button>
        </header>
        <div className={styles.panelBody}>
          <div className={styles.hero}>
            <p className={styles.heroEyebrow}>Для учеников 5–11 классов</p>
            <h2 id={headingId}>14 дней бесплатно,<br />чтобы попробовать<br /><span>новый формат учёбы</span></h2>
            <p>Спецпредложение для посетителей ProSchools. Познакомьтесь с платформой онлайн-школы «Синергия» и узнайте, подходит ли она вашему ребёнку.</p>
            <div className={styles.heroPills}><span>Школьная программа</span><span>Из любой точки мира</span></div>
          </div>

          <div className={styles.form}>
            <LeadForm
              compact
              schoolName="Онлайн-школа «Синергия»"
              source={OFFER_SOURCE}
              defaultGoal={OFFER_GOAL}
              title="Получить 14 дней бесплатного доступа"
            />
          </div>

          <section className={styles.details} aria-label="Об онлайн-школе Синергия">
            <h3>Как устроено обучение</h3>
            <ul>
              <li><span aria-hidden="true">01</span><div><strong>Учёба на одной платформе</strong><p>Уроки, задания и учебные материалы собраны в личном кабинете.</p></div></li>
              <li><span aria-hidden="true">02</span><div><strong>Подходящий формат занятий</strong><p>Живые уроки и записи; состав занятий и поддержки зависит от выбранной программы.</p></div></li>
              <li><span aria-hidden="true">03</span><div><strong>Поддержка в течение учёбы</strong><p>Классный руководитель помогает с организационными вопросами, а родитель может следить за успеваемостью.</p></div></li>
            </ul>
          </section>

          <div className={styles.conditions}>
            <h3>Что важно знать</h3>
            <p>Бесплатный доступ предоставляется на 14 дней по спецпредложению ProSchools. Консультант «Синергии» уточнит порядок подключения, дату начала и доступные занятия. Дальнейшее обучение платное.</p>
            <p>Вопросы перевода, зачисления и аттестаций обсуждаются отдельно. Государственные ОГЭ и ЕГЭ проходят очно.</p>
          </div>
          <button type="button" className={styles.back} onClick={() => setOpen(false)}>Вернуться к выбору школы</button>
        </div>
      </dialog>
    </div>
  )
}
